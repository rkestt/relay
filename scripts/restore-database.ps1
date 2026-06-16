param(
  [Parameter(Mandatory=$true)]
  [string]$BackupFile
)

$ContainerName = "supabase-db"
$DbName = "postgres"
$DbUser = "postgres"

if (-not (Test-Path $BackupFile)) {
  Write-Error "Backup file not found: $BackupFile"
  exit 1
}

Write-Host "Starting database restore from $BackupFile"

# Decompress if needed
if ($BackupFile -match '\.gz$') {
  Write-Host "Decompressing backup..."
  $DecompressedFile = $BackupFile -replace '\.gz$', ''
  Expand-Archive -Path $BackupFile -DestinationPath (Split-Path $DecompressedFile) -Force
  $BackupFile = $DecompressedFile
}

# Restore database
Get-Content $BackupFile -Raw | docker exec -i $ContainerName pg_restore -U $DbUser -d $DbName --clean --if-exists

if ($LASTEXITCODE -eq 0) {
  Write-Host "Database restored successfully"
} else {
  Write-Error "Restore failed"
  exit 1
}
