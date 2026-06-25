# ─────────────────────────────────────────────────────────────
#  AURA — Auto Git Push Script
#  Watches for file changes and auto-commits + pushes to GitHub
#  Usage: Right-click → Run with PowerShell
#         OR: pwsh -File auto-push.ps1
# ─────────────────────────────────────────────────────────────

$projectPath = $PSScriptRoot
$branch = "master"

Write-Host "🚀 AURA Auto-Push started" -ForegroundColor Cyan
Write-Host "📁 Watching: $projectPath" -ForegroundColor Yellow
Write-Host "🔗 Branch: $branch" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop.`n" -ForegroundColor Gray

# Set up FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $projectPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::DirectoryName

# Debounce — wait 5 seconds after last change before pushing
$debounceTimer = $null
$lastPushTime = [datetime]::MinValue

$action = {
    $path = $Event.SourceEventArgs.FullPath

    # Ignore node_modules, .git, dist, .env, logs
    $ignored = @("node_modules", ".git", "dist", ".env", "*.log", "tmp", "__pycache__", ".vite")
    foreach ($pattern in $ignored) {
        if ($path -like "*$pattern*") { return }
    }

    $global:pendingChange = $true
    $global:lastChangedFile = $path
    $global:lastChangeTime = [datetime]::Now
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null

$global:pendingChange = $false
$global:lastChangeTime = [datetime]::MinValue
$global:lastChangedFile = ""

Write-Host "✅ Watching for changes..." -ForegroundColor Green

while ($true) {
    Start-Sleep -Seconds 2

    if ($global:pendingChange) {
        $secondsSinceChange = ([datetime]::Now - $global:lastChangeTime).TotalSeconds
        # Wait 5 seconds after last change (debounce)
        if ($secondsSinceChange -ge 5) {
            $global:pendingChange = $false

            Set-Location $projectPath

            # Check if there are actual git changes
            $gitStatus = git status --porcelain 2>&1
            if ($gitStatus) {
                $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                $changedFile = Split-Path $global:lastChangedFile -Leaf

                Write-Host "`n📝 Changes detected at $timestamp" -ForegroundColor Magenta
                Write-Host "   File: $changedFile" -ForegroundColor Gray

                git add . 2>&1 | Out-Null
                git commit -m "auto: update $changedFile [$timestamp]" 2>&1
                $pushResult = git push origin $branch 2>&1

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Pushed to GitHub successfully!" -ForegroundColor Green
                } else {
                    Write-Host "❌ Push failed: $pushResult" -ForegroundColor Red
                }
            }
        }
    }
}
