#!/usr/bin/env pwsh
# r6Hub Dev Sync - Windows → Hetzner
# Usage: .\sync.ps1 [q|g|s|l]
#   q = quick sync (tar+scp, files only, ~5s)
#   g = git push + server pull (safe)
#   s = SSH shell
#   l = dev logs (tail -f)

param([string]$Mode)

$Host = "142.132.176.234"
$User = "root"
$Key  = "$env:USERPROFILE\.ssh\id_ed25519"
$Root = "C:\Projects\r6Hub"
$Ssh  = "ssh -i $Key -o StrictHostKeyChecking=accept-new"

function Sync-Quick {
    Write-Host "Quick sync: $Root → $User@$Host:/opt/r6hub" -ForegroundColor Cyan
    $tmp = "$env:TEMP\r6hub_sync.tar.gz"
    $excl = @("--exclude=node_modules","--exclude=node_modules_dev","--exclude=.next","--exclude=.git",
              "--exclude=.env.*","--exclude=volumes/db/data","--exclude=volumes/storage",
              "--exclude=dogfood-output","--exclude=graphify-out","--exclude=*.log",
              "--exclude=.DS_Store","--exclude=Thumbs.db","--exclude=sync.ps1","--exclude=scripts")
    $tar_args = @("-czf", $tmp) + $excl + @("-C", $Root, ".")
    
    tar @tar_args 2>&1 | Out-Null
    if (-not $?) { Write-Error "tar failed"; return }
    
    scp -i $Key -q $tmp "$User@$Host`:/tmp/r6hub_sync.tar.gz" 2>&1 | Out-Null
    if (-not $?) { Write-Error "scp failed"; return }

    & $Ssh $User@$Host "cd /opt/r6hub && tar xzf /tmp/r6hub_sync.tar.gz && rm /tmp/r6hub_sync.tar.gz"
    Remove-Item $tmp -ErrorAction SilentlyContinue
    
    Write-Host "OK — dev server hot-reloads automatically" -ForegroundColor Green
}

function Sync-Git {
    Write-Host "Git sync..." -ForegroundColor Cyan
    $dirty = git -C $Root status --porcelain
    if ($dirty) {
        Write-Host "Changes:" -ForegroundColor Yellow
        $dirty | ForEach-Object { Write-Host "  $_" }
        git -C $Root add -A
        git -C $Root commit -m "wip $(Get-Date -Format 'HH:mm')"
    }
    git -C $Root push
    & $Ssh $User@$Host "cd /opt/r6hub && git pull"
    Write-Host "OK — git sync done" -ForegroundColor Green
}

function Show-Logs { & $Ssh $User@$Host "docker logs r6hub-nextjs-dev --tail 50 -f 2>&1" }
function SSH-Shell { & $Ssh $User@$Host }

if (-not $Mode) {
    Write-Host "r6Hub Dev Sync — choose:"
    Write-Host "  [q] Quick sync (files only, no git)"
    Write-Host "  [g] Git sync (safe, recommended)"
    Write-Host "  [s] SSH shell"
    Write-Host "  [l] Dev logs"
    $Mode = Read-Host "? "
}
switch ($Mode.ToLower()) { "q" { Sync-Quick } "g" { Sync-Git } "l" { Show-Logs } "s" { SSH-Shell } }
