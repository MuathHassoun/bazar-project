@echo off
echo Stopping Bazar.com Lab 2...

for %%p in (3000 3001 3002 3003 3004) do (
  for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%p " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
    echo   [OK] Killed process on port %%p
  )
)

echo All services stopped.