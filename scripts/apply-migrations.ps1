#Requires -Version 5.1
<#
.SYNOPSIS
    Apply SQL migrations to local Supabase PostgreSQL with tracking.
.DESCRIPTION
    Creates schema_migrations table if missing, then applies all .sql files
    from supabase/migrations/ in alphabetical order, skipping already-tracked
    migrations. Continues on error. Verifies key columns and seed data at end.
.PARAMETER EnvFile
    Path to .env.supabase file. Defaults to project root.
.PARAMETER MigrationsDir
    Path to migrations directory. Defaults to supabase/migrations/.
.PARAMETER DryRun
    List migrations without applying them.
.PARAMETER Force
    Re-apply all migrations (clear tracking first).
#>

param(
    [string]$EnvFile,
    [string]$MigrationsDir,
    [switch]$DryRun,
    [switch]$Force
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot

if (-not $EnvFile) { $EnvFile = Join-Path $ProjectRoot ".env.supabase" }
if (-not $MigrationsDir) { $MigrationsDir = Join-Path $ProjectRoot "supabase\migrations" }

function Write-Ok($msg)   { Write-Host "   OK: $msg" -ForegroundColor Green }
function Write-Err($msg)  { Write-Host "   FAIL: $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "   -- $msg" -ForegroundColor Gray }
function Write-Warn($msg) { Write-Host "   WARN: $msg" -ForegroundColor Yellow }

# ─── Load env ───────────────────────────────────────────────
if (-not (Test-Path $EnvFile)) {
    Write-Host "ERROR: $EnvFile not found." -ForegroundColor Red
    Write-Host "Run scripts/setup-supabase.ps1 first." -ForegroundColor Yellow
    exit 1
}

$envVars = @{}
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$pgPassword = $envVars["POSTGRES_PASSWORD"]
$pgPort = $envVars["POSTGRES_DIRECT_PORT"]
if (-not $pgPort) { $pgPort = "54834" }

if (-not $pgPassword) {
    Write-Host "ERROR: POSTGRES_PASSWORD not found in $EnvFile" -ForegroundColor Red
    exit 1
}

$pgUser = "postgres"
$pgDb = "postgres"
$pgHost = "localhost"

# ─── Helper: run docker command and capture only stdout ─────
# PowerShell 5.1 treats native stderr as errors when $ErrorActionPreference='Stop'.
# We use 'Continue' and capture stdout only via 2>$null (stderr → null).
# For error diagnostics we re-run without redirection on failure.

function Invoke-Psql([string]$Sql) {
    $tmpFile = [System.IO.Path]::GetTempFileName()
    try {
        Set-Content -Path $tmpFile -Value $Sql -Encoding ASCII -NoNewline
        $remotePath = "/tmp/psql_$(Get-Random).sql"
        docker cp $tmpFile "supabase-db:$remotePath" 2>$null | Out-Null

        $out = docker exec supabase-db psql `
            -U $pgUser -h $pgHost -d $pgDb `
            -v ON_ERROR_STOP=1 -A -t `
            -f $remotePath 2>$null
        $code = $LASTEXITCODE
        docker exec supabase-db rm -f $remotePath 2>$null | Out-Null
    } finally {
        Remove-Item -Path $tmpFile -Force -ErrorAction SilentlyContinue
    }
    $lines = @($out | Where-Object { $_ } | ForEach-Object { "$_".Trim() })
    return ,@($code, $lines)
}

function Invoke-PsqlFile([string]$FilePath) {
    $fileName = Split-Path -Leaf $FilePath
    $remotePath = "/tmp/$fileName"
    docker cp $FilePath "supabase-db:$remotePath" 2>$null | Out-Null

    # Run capture stderr (skip cleanup until we know the result)
    $out = docker exec supabase-db psql `
        -U $pgUser -h $pgHost -d $pgDb `
        -v ON_ERROR_STOP=1 `
        -f $remotePath 2>$null
    $code = $LASTEXITCODE

    if ($code -ne 0) {
        # Re-run without stderr suppress to get actual error messages
        docker exec supabase-db rm -f $remotePath 2>$null | Out-Null
        docker cp $FilePath "supabase-db:$remotePath" 2>$null | Out-Null
        $err = docker exec supabase-db psql `
            -U $pgUser -h $pgHost -d $pgDb `
            -v ON_ERROR_STOP=1 `
            -f $remotePath 2>&1
        $code = $LASTEXITCODE
        docker exec supabase-db rm -f $remotePath 2>$null | Out-Null
        $lines = @($err | Where-Object { $_ } | ForEach-Object { "$_".Trim() })
        return ,@($code, $lines)
    }

    docker exec supabase-db rm -f $remotePath 2>$null | Out-Null
    $lines = @($out | Where-Object { $_ } | ForEach-Object { "$_".Trim() })
    return ,@($code, $lines)
}

# ─── Check PostgreSQL connectivity ──────────────────────────
Write-Host "`nChecking PostgreSQL connection (localhost:$pgPort)..." -ForegroundColor Cyan
$checkResult = docker exec supabase-db pg_isready -U $pgUser -h $pgHost 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: PostgreSQL not reachable. Is docker compose running?" -ForegroundColor Red
    Write-Host "Run: docker compose --env-file .env.supabase up -d" -ForegroundColor Yellow
    exit 1
}
Write-Ok "PostgreSQL is reachable"

# ─── Find migrations ────────────────────────────────────────
if (-not (Test-Path $MigrationsDir)) {
    Write-Host "ERROR: Migrations directory not found: $MigrationsDir" -ForegroundColor Red
    exit 1
}

$migrations = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | Sort-Object Name
if ($migrations.Count -eq 0) {
    Write-Host "No migration files found in $MigrationsDir" -ForegroundColor Yellow
    exit 0
}

Write-Host "`nFound $($migrations.Count) migration(s):" -ForegroundColor Cyan
$migrations | ForEach-Object { Write-Info $_.Name }

if ($DryRun) {
    Write-Host "`nDry run - no migrations applied." -ForegroundColor Yellow
    exit 0
}

# ─── Create schema_migrations table if not exists ───────────
Write-Host "`nEnsuring schema_migrations tracking table..." -ForegroundColor Cyan
$result = Invoke-Psql "CREATE TABLE IF NOT EXISTS public.schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW());"
if ($result[0] -eq 0) {
    Write-Ok "schema_migrations table ready"
} else {
    Write-Err "Could not create schema_migrations table"
    $result[1] | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
    exit 1
}

# ─── Optionally force re-apply ──────────────────────────────
if ($Force) {
    Write-Warn "Force mode: clearing schema_migrations tracking"
    Invoke-Psql "DELETE FROM public.schema_migrations;" | Out-Null
}

# ─── Load already-applied versions ──────────────────────────
$result = Invoke-Psql "SELECT version FROM public.schema_migrations ORDER BY version;"
$applied = @()
if ($result[0] -eq 0 -and $result[1]) {
    $applied = @($result[1] | Where-Object { $_ -ne "" })
}
Write-Info "$($applied.Count) migration(s) already tracked"

# ─── Apply migrations ───────────────────────────────────────
Write-Host "`nApplying migrations..." -ForegroundColor Cyan
$successCount = 0
$failedCount = 0
$skipCount = 0
$failedList = @()

foreach ($migration in $migrations) {
    $filePath = $migration.FullName
    $fileName = $migration.Name
    $version = [System.IO.Path]::GetFileNameWithoutExtension($fileName)

    if ($version -in $applied) {
        Write-Info "$fileName [skip: already applied]"
        $skipCount++
        continue
    }

    Write-Host "   >> $fileName" -ForegroundColor White
    $result = Invoke-PsqlFile $filePath
    $exitCode = $result[0]
    $output = $result[1]

    if ($exitCode -eq 0) {
        Write-Ok "$fileName"

        $trackResult = Invoke-Psql "INSERT INTO public.schema_migrations (version) VALUES ('$version') ON CONFLICT (version) DO NOTHING;"
        if ($trackResult[0] -ne 0) {
            Write-Warn "Failed to track $version in schema_migrations"
            $trackResult[1] | ForEach-Object { Write-Host "      $_" -ForegroundColor Yellow }
        }

        $successCount++
    } else {
        Write-Err "$fileName"
        if ($output) {
            $output | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
        }
        $failedCount++
        $failedList += $fileName
    }
}

# ─── Summary ────────────────────────────────────────────────
Write-Host "`n=== Migration Summary ===" -ForegroundColor Cyan
Write-Host "  Total:    $($migrations.Count)" -ForegroundColor White
Write-Host "  Applied:  $successCount" -ForegroundColor Green
Write-Host "  Skipped:  $skipCount" -ForegroundColor Yellow
if ($failedCount -gt 0) {
    Write-Host "  Failed:   $failedCount" -ForegroundColor Red
    Write-Host "  Failed files:" -ForegroundColor Red
    $failedList | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
} else {
    Write-Ok "All migrations processed!"
}

# ─── Verify key columns and seed data ───────────────────────
Write-Host "`n=== Post-Migration Verification ===" -ForegroundColor Cyan

$verificationErrors = 0

function Get-CellValue([string]$Sql) {
    $result = Invoke-Psql $Sql
    if ($result[0] -eq 0 -and $result[1]) {
        $lines = @($result[1] | Where-Object { $_.Trim() -ne "" })
        if ($lines.Count -gt 0) {
            return $lines[-1].Trim()
        }
    }
    return $null
}

# Column checks
$columnChecks = @(
    @{ Table = "lobbies"; Column = "phase"; ExpectedType = "text" },
    @{ Table = "lobbies"; Column = "starting_side"; ExpectedType = "text" },
    @{ Table = "rounds"; Column = "team_side"; ExpectedType = "text" },
    @{ Table = "strategy_templates"; Column = "operator_id"; ExpectedType = "uuid" },
    @{ Table = "strategy_hotspots"; Column = "image_id"; ExpectedType = "uuid" },
    @{ Table = "lobbies"; Column = "map_id"; ExpectedType = "uuid" }
)

foreach ($check in $columnChecks) {
    $sql = "SELECT data_type FROM information_schema.columns WHERE table_name='$($check.Table)' AND column_name='$($check.Column)';"
    $result = Get-CellValue $sql
    if ($result -eq $check.ExpectedType) {
        Write-Ok "$($check.Table).$($check.Column) exists (type: $result)"
    } elseif ($result) {
        Write-Warn "$($check.Table).$($check.Column) exists but type is $result (expected $($check.ExpectedType))"
    } else {
        Write-Err "$($check.Table).$($check.Column) MISSING"
        $verificationErrors++
    }
}

# Table checks
$tableChecks = @(
    @{ Table = "strategy_images" },
    @{ Table = "task_votes" }
)

foreach ($check in $tableChecks) {
    $sql = "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename='$($check.Table)' AND schemaname='public');"
    $result = Get-CellValue $sql
    if ($result -eq "t") {
        Write-Ok "$($check.Table) table exists"
    } else {
        Write-Err "$($check.Table) table MISSING"
        $verificationErrors++
    }
}

# Seed data checks
$seedChecks = @(
    @{ Query = "SELECT COUNT(*) FROM maps"; Label = "maps"; Min = 5 },
    @{ Query = "SELECT COUNT(*) FROM operators"; Label = "operators"; Min = 24 },
    @{ Query = "SELECT COUNT(*) FROM sites"; Label = "sites"; Min = 20 },
    @{ Query = "SELECT COUNT(*) FROM strategy_templates"; Label = "strategy_templates"; Min = 25 }
)

foreach ($check in $seedChecks) {
    $count = Get-CellValue $check.Query
    $num = $count -as [int]
    if ($num -ge $check.Min) {
        Write-Ok "$($check.Label): $count rows (min: $($check.Min))"
    } elseif ($null -ne $count) {
        Write-Warn "$($check.Label): $count rows (expected at least $($check.Min))"
        $verificationErrors++
    } else {
        Write-Err "$($check.Label): could not query"
        $verificationErrors++
    }
}

# ─── Show tracked migrations ────────────────────────────────
Write-Host "`n=== Tracked Migrations (schema_migrations) ===" -ForegroundColor Cyan
$result = Invoke-Psql "SELECT version, applied_at::text FROM public.schema_migrations ORDER BY version;"
if ($result[0] -eq 0 -and $result[1]) {
    $lines = @($result[1] | Where-Object { $_.Trim() -ne "" })
    foreach ($line in $lines) {
        Write-Info $line
    }
} else {
    Write-Warn "No tracked migrations found"
}

# ─── Final result ───────────────────────────────────────────
Write-Host "`n=== Final Result ===" -ForegroundColor Cyan
if ($verificationErrors -gt 0) {
    Write-Warn "$verificationErrors verification check(s) failed"
}
if ($failedCount -gt 0) {
    Write-Err "$failedCount migration(s) failed"
    exit 1
}
Write-Ok "All migrations applied successfully!"
