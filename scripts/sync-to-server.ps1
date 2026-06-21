param(
    [Parameter(HelpMessage="Watch mode - auto-sync on file changes")]
    [switch]$Watch,
    
    [Parameter(HelpMessage="SSH identity file")]
    [string]$IdentityFile = "$env:USERPROFILE\.ssh\id_ed25519",
    
    [Parameter(HelpMessage="Server host")]
    [string]$Host = "142.132.176.234",
    
    [Parameter(HelpMessage="Server user")]
    [string]$User = "root",
    
    [Parameter(HelpMessage="Server path")]
    [string]$ServerPath = "/opt/r6hub"
)

$Excludes = @(
    "--exclude", "node_modules",
    "--exclude", "node_modules_dev",
    "--exclude", ".next",
    "--exclude", ".git",
    "--exclude", ".env",
    "--exclude", ".env.*",
    "--exclude", "volumes/db/data",
    "--exclude", "volumes/storage",
    "--exclude", "*.log",
    "--exclude", ".DS_Store",
    "--exclude", "Thumbs.db",
    "--exclude", "dogfood-output",
    "--exclude", "graphify-out"
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot

function Sync-Files {
    Write-Host "Syncing $ProjectRoot → $User@$Host`:$ServerPath" -ForegroundColor Cyan
    
    # Build tar command
    $TarArgs = @(
        "-czf", "-",
        "--dereference"
    ) + $Excludes + @(
        "-C", $ProjectRoot,
        "."
    )
    
    $SshArgs = @(
        "-i", $IdentityFile,
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "ConnectTimeout=10",
        "$User@$Host",
        "cd $ServerPath && tar xzf -"
    )

    try {
        # Create tar and pipe through SSH
        $Tar = Start-Process -NoNewWindow -PassThru -FilePath "tar" -ArgumentList $TarArgs -RedirectStandardOutput "temp_pipe_$PID"
        
        # Hmm, we can't pipe between processes in PowerShell easily
        # Let me use a different approach
        throw "Use sync-git approach instead"
    }
    catch {
        Write-Warning "Pipe sync failed. Using git-based sync instead."
        Write-Host "Run: git push && ssh root@142.132.176.234 'cd /opt/r6hub && git pull'" -ForegroundColor Yellow
    }
}

function Sync-Git {
    Write-Host "=== Git Sync ===" -ForegroundColor Green
    $ProjectRoot = Split-Path -Parent $PSScriptRoot
    
    # Check for changes
    $Status = git -C $ProjectRoot status --porcelain
    if ($Status) {
        Write-Host "Uncommitted changes detected:" -ForegroundColor Yellow
        $Status | ForEach-Object { Write-Host "  $_" }
        
        $choice = Read-Host "Commit and push? (y/n, default: n)"
        if ($choice -eq "y") {
            $msg = Read-Host "Commit message (default: 'wip')"
            if (-not $msg) { $msg = "wip" }
            
            git -C $ProjectRoot add -A
            git -C $ProjectRoot commit -m $msg
            git -C $ProjectRoot push
        } else {
            Write-Host "Not pushing. Use ./sync.ps1 -Quick for file-level sync." -ForegroundColor Yellow
            return
        }
    } else {
        Write-Host "No local changes. Pulling latest from remote..." -ForegroundColor Green
        git -C $ProjectRoot push 2>$null
    }
    
    # Pull on server
    Write-Host "Pulling on server..." -ForegroundColor Cyan
    ssh -i $IdentityFile -o StrictHostKeyChecking=accept-new $User@$Host "cd $ServerPath && git pull"
}

function Sync-Quick {
    Write-Host "=== Quick File Sync (tar over SSH) ===" -ForegroundColor Green
    $ProjectRoot = Split-Path -Parent $PSScriptRoot
    $ExcludeStr = $Excludes -join " "
    
    # Build command
    $Cmd = "tar czf - --dereference $ExcludeStr -C '$ProjectRoot' . | ssh -i '$IdentityFile' -o StrictHostKeyChecking=accept-new $User@$Host 'cd $ServerPath && tar xzf -'"
    
    Write-Host "Syncing files..." -ForegroundColor Cyan
    Invoke-Expression $Cmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Sync complete! Dev server hot-reloads automatically." -ForegroundColor Green
    } else {
        Write-Error "Sync failed (exit: $LASTEXITCODE)"
    }
}

# Main
Write-Host "" 
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  r6Hub Dev Sync - Hetzner           ║" -ForegroundColor Cyan
Write-Host "║  Server: $User@$Host" -ForegroundColor Cyan
Write-Host "║  Local:  $ProjectRoot" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($Watch) {
    Write-Host "Watch mode not yet implemented. Use -Quick for one-shot sync." -ForegroundColor Yellow
    return
}

Write-Host "Options:" -ForegroundColor White
Write-Host "  [G] Git push + server pull (safe, recommended)"
Write-Host "  [Q] Quick file sync (tar over SSH, files only)"
Write-Host "  [S] SSH into server"
Write-Host "  [L] View dev server logs"
Write-Host "  [X] Exit"
Write-Host ""

# If -Quick flag, skip menu
if ($MyInvocation.Line -match "-Quick\b" -or $MyInvocation.ExpectingInput) {
    Sync-Quick
    return
}

$choice = Read-Host "Choose (g/q/s/l/x)"
switch ($choice.ToLower()) {
    "g" { Sync-Git }
    "q" { Sync-Quick }
    "s" { ssh -i $IdentityFile $User@$Host }
    "l" { ssh -i $IdentityFile $User@$Host "docker logs r6hub-nextjs-dev --tail 50 -f" }
    "x" { return }
    default { Write-Host "Invalid choice" }
}
