$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $projectRoot ".runtime\server.pid"
if (!(Test-Path $pidFile)) { Write-Host "Snoozelet is not running."; exit 0 }
$serverPid = [int](Get-Content $pidFile)
taskkill.exe /PID $serverPid /T /F | Out-Null
Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
Write-Host "Snoozelet has stopped."
