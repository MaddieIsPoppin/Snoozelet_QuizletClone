$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $projectRoot ".runtime"
$pidFile = Join-Path $runtimeDir "server.pid"
$logFile = Join-Path $runtimeDir "server.log"
$errorLogFile = Join-Path $runtimeDir "server-error.log"
$url = "http://localhost:3000"
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

function Test-SnoozeletReady {
  try { $response = Invoke-WebRequest -UseBasicParsing -Uri "$url/api/health" -TimeoutSec 2; return $response.StatusCode -eq 200 } catch { return $false }
}

if (Test-SnoozeletReady) { Start-Process $url; exit 0 }
if (Test-Path $pidFile) {
  $savedPid = [int](Get-Content $pidFile -ErrorAction SilentlyContinue)
  if (Get-Process -Id $savedPid -ErrorAction SilentlyContinue) { exit 0 }
  Remove-Item $pidFile -Force
}

$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$node = (Get-Command node.exe -ErrorAction Stop).Source
$bootstrapScript = Join-Path $projectRoot "scripts\bootstrap-local-db.js"
& $node $bootstrapScript *>> $logFile
$env:SNOOZELET_DATABASE_MODE = "local"
$process = Start-Process -FilePath $npm -ArgumentList @("start") -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $errorLogFile -PassThru
Set-Content -Path $pidFile -Value $process.Id
for ($attempt = 0; $attempt -lt 40; $attempt++) {
  Start-Sleep -Milliseconds 500
  if (Test-SnoozeletReady) { Start-Process $url; exit 0 }
  if ($process.HasExited) { break }
}
Add-Content -Path $logFile -Value "`nLauncher: Snoozelet did not become ready. Run Diagnose Snoozelet.bat."
