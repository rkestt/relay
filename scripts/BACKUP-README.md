# Database Backup & Restore

## Backup

### Linux/Mac
```bash
chmod +x scripts/backup-database.sh
./scripts/backup-database.sh
```

### Windows
```powershell
.\scripts\backup-database.ps1
```

Backups saved to `./backups/` with retention of 7 days.

## Restore

### Linux/Mac
```bash
./scripts/restore-database.sh ./backups/backup-20260612-020000.dump.gz
```

### Windows
```powershell
.\scripts\restore-database.ps1 .\backups\backup-20260612-020000.dump.gz
```

## Automated Backup (Cron)

Add to crontab (`crontab -e`):
```
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/r6hub-backup.log 2>&1
```

This runs backup daily at 2:00 AM.
