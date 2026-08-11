@echo off
cd /d "%~dp0"

start "Snoozelet Server" /min cmd.exe /c "npm.cmd start"
timeout /t 3 /nobreak >nul
start "" http://localhost:3000
