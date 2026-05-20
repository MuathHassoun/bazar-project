@echo off
echo Starting Bazar.com Lab 2...

:: Catalog replica 1 (port 3001)
start "Catalog-1" cmd /k "cd /d C:\Users\abood\Desktop\lab2\bazar-project\catalog && set PORT=3001 && set FRONTEND_URL=http://localhost:3000 && set PEER_CATALOG_URL=http://localhost:3003 && node index.js"
echo   [OK] Catalog replica 1  - http://localhost:3001

:: Catalog replica 2 (port 3003) - same folder, different port
start "Catalog-2" cmd /k "cd /d C:\Users\abood\Desktop\lab2\bazar-project\catalog && set PORT=3003 && set FRONTEND_URL=http://localhost:3000 && set PEER_CATALOG_URL=http://localhost:3001 && node index.js"
echo   [OK] Catalog replica 2  - http://localhost:3003

:: Order replica 1 (port 3002)
start "Order-1" cmd /k "cd /d C:\Users\abood\Desktop\lab2\bazar-project\order && set PORT=3002 && set CATALOG_URL=http://localhost:3001 && set PEER_ORDER_URL=http://localhost:3004 && node index.js"
echo   [OK] Order replica 1    - http://localhost:3002

:: Order replica 2 (port 3004) - same folder, different port
start "Order-2" cmd /k "cd /d C:\Users\abood\Desktop\lab2\bazar-project\order && set PORT=3004 && set CATALOG_URL=http://localhost:3003 && set PEER_ORDER_URL=http://localhost:3002 && node index.js"
echo   [OK] Order replica 2    - http://localhost:3004

:: Wait 2 seconds then start frontend
timeout /t 2 /nobreak > nul
start "Frontend" cmd /k "cd /d C:\Users\abood\Desktop\lab2\bazar-project\frontend && node index.js"
echo   [OK] Frontend           - http://localhost:3000

echo.
echo All services running in separate windows.
echo Run stop.bat to stop them.