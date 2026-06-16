# Configuration
$BackupDir = ".\backups"
$ContainerName = "supabase-db"
$DbName = "postgres"
$DbUser = "postgres"
$RetentionDays = 7
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Create backup directory if not exists
if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "Starting database backup at $(Get-Date)"

# Dump database
$BackupFile = "$BackupDir\backup-$Timestamp.dump"
docker exec -t $ContainerName pg_dump -U $DbUser -F c $DbName | Out-File -FilePath $BackupFile -Encoding byte

if ($LASTEXITCODE -eq 0) {
  Write-Host "Backup created: $BackupFile"

  # Compress backup
  $CompressedFile = "$BackupFile.gz"
  Compress-Archive -Path $BackupFile -DestinationPath $CompressedFile -Force
  Remove-Item $BackupFile
  Write-Host "Backup compressed: $CompressedFile"

  # Remove old backups
  $CutoffDate = (Get-Date).AddDays(-$RetentionDays)
  Get-ChildItem -Path $BackupDir -Filter "backup-*.dump.gz" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Force
  Write-Host "Old backups removed (older than $RetentionDays days)"

  # Show backup size
  Get-Item $CompressedFile | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB, 2)}}
} else {
  Write-Error "Backup failed"
  exit 1
}

Write-Host "Backup completed at $(Get-Date)"
