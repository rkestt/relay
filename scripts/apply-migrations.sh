#!/usr/bin/env bash
set -euo pipefail

# ─── Defaults ───────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.supabase"
MIGRATIONS_DIR="${PROJECT_ROOT}/supabase/migrations"
DRY_RUN=false
FORCE=false

# ─── Parse args ─────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --migrations-dir) MIGRATIONS_DIR="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --force) FORCE=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ─── Colors ─────────────────────────────────────────────────
OK()   { echo -e "\033[32m   OK: $1\033[0m"; }
FAIL() { echo -e "\033[31m   FAIL: $1\033[0m"; }
INFO() { echo -e "\033[90m   -- $1\033[0m"; }
WARN() { echo -e "\033[33m   WARN: $1\033[0m"; }

# ─── Load env ───────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "\033[31mERROR: $ENV_FILE not found.\033[0m"
  echo "Run scripts/setup-supabase.ps1 first (or create .env.supabase manually)."
  exit 1
fi

load_env() {
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    [[ -n "$key" ]] && export "$key=$value"
  done < "$ENV_FILE"
}
load_env

PG_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD not found in $ENV_FILE}"
PG_PORT="${POSTGRES_DIRECT_PORT:-54324}"
PG_USER="postgres"
PG_DB="postgres"
PG_HOST="localhost"

# ─── Helper: run SQL via docker exec ────────────────────────
run_sql() {
  local sql="$1"
  docker exec supabase-db psql \
    -U "$PG_USER" -h "$PG_HOST" -d "$PG_DB" \
    -v ON_ERROR_STOP=1 -A -t \
    -c "$sql" 2>/dev/null || true
}

run_sql_file() {
  local file="$1"
  local filename
  filename=$(basename "$file")
  local remote="/tmp/$filename"
  docker cp "$file" "supabase-db:$remote" 2>/dev/null
  docker exec supabase-db psql \
    -U "$PG_USER" -h "$PG_HOST" -d "$PG_DB" \
    -v ON_ERROR_STOP=1 \
    -f "$remote" 2>/dev/null
  local code=$?
  docker exec supabase-db rm -f "$remote" 2>/dev/null || true
  return $code
}

# ─── Check PostgreSQL ───────────────────────────────────────
echo -e "\n\033[36mChecking PostgreSQL connection...\033[0m"
if ! docker exec supabase-db pg_isready -U "$PG_USER" -h "$PG_HOST" 2>/dev/null; then
  echo -e "\033[31mERROR: PostgreSQL not reachable. Is docker compose running?\033[0m"
  echo "Run: docker compose --env-file .env.supabase up -d"
  exit 1
fi
OK "PostgreSQL is reachable"

# ─── Find migrations ────────────────────────────────────────
if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo -e "\033[31mERROR: Migrations directory not found: $MIGRATIONS_DIR\033[0m"
  exit 1
fi

mapfile -t migrations < <(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort)
if [[ ${#migrations[@]} -eq 0 ]]; then
  echo "No migration files found in $MIGRATIONS_DIR"
  exit 0
fi

echo -e "\n\033[36mFound ${#migrations[@]} migration(s):\033[0m"
for m in "${migrations[@]}"; do INFO "$(basename "$m")"; done

if $DRY_RUN; then
  echo -e "\n\033[33mDry run - no migrations applied.\033[0m"
  exit 0
fi

# ─── Create tracking table ──────────────────────────────────
echo -e "\n\033[36mEnsuring schema_migrations tracking table...\033[0m"
run_sql "CREATE TABLE IF NOT EXISTS public.schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW());" > /dev/null
OK "schema_migrations table ready"

# ─── Force re-apply ─────────────────────────────────────────
if $FORCE; then
  WARN "Force mode: clearing schema_migrations tracking"
  run_sql "DELETE FROM public.schema_migrations;" > /dev/null
fi

# ─── Load applied versions ──────────────────────────────────
applied=$(run_sql "SELECT version FROM public.schema_migrations ORDER BY version;")
applied_count=$(echo "$applied" | grep -c '[^ ]' || true)
INFO "$applied_count migration(s) already tracked"

# ─── Apply migrations ───────────────────────────────────────
echo -e "\n\033[36mApplying migrations...\033[0m"
success=0
failed=0
skipped=0
failed_list=""

for migration in "${migrations[@]}"; do
  filename=$(basename "$migration")
  version="${filename%.sql}"

  if echo "$applied" | grep -qx "$version"; then
    INFO "$filename [skip: already applied]"
    ((skipped++))
    continue
  fi

  echo "   >> $filename"
  if run_sql_file "$migration"; then
    OK "$filename"
    run_sql "INSERT INTO public.schema_migrations (version) VALUES ('$version') ON CONFLICT (version) DO NOTHING;" > /dev/null
    ((success++))
  else
    FAIL "$filename"
    ((failed++))
    failed_list="$failed_list $filename"
  fi
done

# ─── Summary ────────────────────────────────────────────────
echo -e "\n\033[36m=== Migration Summary ===\033[0m"
echo "  Total:    ${#migrations[@]}"
echo -e "  Applied:  \033[32m$success\033[0m"
echo -e "  Skipped:  \033[33m$skipped\033[0m"
if [[ $failed -gt 0 ]]; then
  echo -e "  Failed:   \033[31m$failed\033[0m"
  echo -e "  Failed files:$failed_list"
else
  OK "All migrations processed!"
fi

# ─── Verification ───────────────────────────────────────────
echo -e "\n\033[36m=== Post-Migration Verification ===\033[0m"
errors=0

check_column() {
  local table="$1" column="$2" expected="$3"
  local result
  result=$(run_sql "SELECT data_type FROM information_schema.columns WHERE table_name='$table' AND column_name='$column';")
  result=$(echo "$result" | xargs)
  if [[ "$result" == "$expected" ]]; then
    OK "$table.$column exists (type: $result)"
  elif [[ -n "$result" ]]; then
    WARN "$table.$column exists but type is $result (expected $expected)"
    ((errors++))
  else
    FAIL "$table.$column MISSING"
    ((errors++))
  fi
}

check_column "lobbies" "phase" "text"
check_column "lobbies" "starting_side" "text"
check_column "rounds" "team_side" "text"
check_column "strategy_templates" "operator_id" "uuid"
check_column "strategy_hotspots" "image_id" "uuid"
check_column "lobbies" "map_id" "uuid"

check_table() {
  local table="$1"
  local result
  result=$(run_sql "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename='$table' AND schemaname='public');")
  result=$(echo "$result" | xargs)
  if [[ "$result" == "t" ]]; then
    OK "$table table exists"
  else
    FAIL "$table table MISSING"
    ((errors++))
  fi
}

check_table "strategy_images"
check_table "task_votes"

check_count() {
  local query="$1" label="$2" min="$3"
  local count
  count=$(run_sql "$query")
  count=$(echo "$count" | xargs)
  if [[ -n "$count" ]] && [[ "$count" -ge "$min" ]]; then
    OK "$label: $count rows (min: $min)"
  elif [[ -n "$count" ]]; then
    WARN "$label: $count rows (expected at least $min)"
    ((errors++))
  else
    FAIL "$label: could not query"
    ((errors++))
  fi
}

check_count "SELECT COUNT(*) FROM maps" "maps" 5
check_count "SELECT COUNT(*) FROM operators" "operators" 24
check_count "SELECT COUNT(*) FROM sites" "sites" 20
check_count "SELECT COUNT(*) FROM strategy_templates" "strategy_templates" 25

# ─── Final ──────────────────────────────────────────────────
echo -e "\n\033[36m=== Final Result ===\033[0m"
if [[ $errors -gt 0 ]]; then
  WARN "$errors verification check(s) failed"
fi
if [[ $failed -gt 0 ]]; then
  FAIL "$failed migration(s) failed"
  exit 1
fi
OK "All migrations applied successfully!"
