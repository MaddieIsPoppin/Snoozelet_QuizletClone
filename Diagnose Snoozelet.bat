@echo off
cd /d "%~dp0"
if exist ".runtime\server.log" (
  type ".runtime\server.log"
) else (
  echo No launcher log exists yet.
)
if exist ".runtime\server-error.log" type ".runtime\server-error.log"
pause
