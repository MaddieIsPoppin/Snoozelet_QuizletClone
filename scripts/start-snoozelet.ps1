$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $projectRoot ".runtime"
$pidFile = Join-Path $runtimeDir "server.pid"
$logFile = Join-Path $runtimeDir "server.log"
$errorLogFile = Join-Path $runtimeDir "server-error.log"
$url = "http://localhost:3000"
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

function Get-SnoozeletHealth {
  try { return Invoke-RestMethod -Uri "$url/api/health" -TimeoutSec 2 } catch { return $null }
}

$health = Get-SnoozeletHealth
if ($health -and $health.databaseMode -eq "local" -and $health.release -eq "web-stable-5") { Start-Process $url; exit 0 }
if ($health) {
  $listener = netstat.exe -ano | Select-String "^\s*TCP\s+.*:3000\s+.*LISTENING\s+(\d+)\s*$" | Select-Object -First 1
  if ($listener -and $listener.Matches.Count) {
    $portPid = [int]$listener.Matches[0].Groups[1].Value
    taskkill.exe /PID $portPid /T /F | Out-Null
    Start-Sleep -Milliseconds 500
  }
}
if (Test-Path $pidFile) {
  $savedPid = [int](Get-Content $pidFile -ErrorAction SilentlyContinue)
  if (Get-Process -Id $savedPid -ErrorAction SilentlyContinue) { exit 0 }
  Remove-Item $pidFile -Force
}

$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$node = (Get-Command node.exe -ErrorAction Stop).Source
$verifyScript = Join-Path $projectRoot "scripts\verify-local-db.js"
& $node $verifyScript *>> $logFile
if ($LASTEXITCODE -ne 0) { Add-Content -Path $errorLogFile -Value "Local database verification failed. See $logFile"; exit 1 }
$buildLogFile = Join-Path $runtimeDir "build.log"
& $npm run build *>> $buildLogFile
if ($LASTEXITCODE -ne 0) { Add-Content -Path $errorLogFile -Value "Build failed. See $buildLogFile"; exit 1 }
$env:SNOOZELET_DATABASE_MODE = "local"
$process = Start-Process -FilePath $npm -ArgumentList @("start") -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $errorLogFile -PassThru
Set-Content -Path $pidFile -Value $process.Id
for ($attempt = 0; $attempt -lt 40; $attempt++) {
  Start-Sleep -Milliseconds 500
  $health = Get-SnoozeletHealth
  if ($health -and $health.databaseMode -eq "local" -and $health.release -eq "web-stable-5") { Start-Process $url; exit 0 }
  if ($process.HasExited) { break }
}
Add-Content -Path $logFile -Value "`nLauncher: Snoozelet did not become ready. Run Diagnose Snoozelet.bat."
