$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $projectRoot ".runtime\server.pid"
if (Test-Path $pidFile) {
  $serverPid = [int](Get-Content $pidFile)
  taskkill.exe /PID $serverPid /T /F | Out-Null
} else {
  try { $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 2 } catch { $health = $null }
  if (!$health) { Write-Host "Snoozelet is not running."; exit 0 }
  $listener = netstat.exe -ano | Select-String "^\s*TCP\s+.*:3000\s+.*LISTENING\s+(\d+)\s*$" | Select-Object -First 1
  if ($listener -and $listener.Matches.Count) {
    $portPid = [int]$listener.Matches[0].Groups[1].Value
    taskkill.exe /PID $portPid /T /F | Out-Null
  }
}
Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
Write-Host "Snoozelet has stopped."
