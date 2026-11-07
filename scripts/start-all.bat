@echo off
REM Run the WhatsApp Agent locally without Docker.
REM Prerequisites: Node 20+, Evolution API running (locally or on a VPS), .env filled.

echo Starting backend...
start "backend" cmd /k "cd /d %~dp0..\backend && npm run start:dev"

timeout /t 5 /nobreak >nul

echo Starting frontend...
start "frontend" cmd /k "cd /d %~dp0..\frontend && npm run dev"

echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Make sure EVOLUTION_BASE_URL and EVOLUTION_WEBHOOK_TOKEN are set in backend\.env
echo and Evolution API webhook points to http://localhost:3001/webhooks/whatsapp
pause