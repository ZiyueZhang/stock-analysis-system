@echo off
setlocal

:: Configuration
set BACKEND_DIR=backend
set FRONTEND_DIR=frontend
set BACKEND_PORT=8000
set FRONTEND_PORT=5173

echo [INFO] Starting Stock Analysis System...

:: 1. Start Backend
echo [INFO] Starting Backend Service...
cd %BACKEND_DIR%
if not exist .venv (
    echo [ERROR] Backend virtual environment not found! Please run 'uv sync' first.
    exit /b 1
)

:: Start uvicorn in a new window/process
start "Backend Service" cmd /k "uv run uvicorn main:app --reload --port %BACKEND_PORT%"

:: Wait for backend to be ready (simple delay for now, can be improved with curl check)
echo [INFO] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: 2. Start Frontend
echo [INFO] Starting Frontend Service...
cd ..\%FRONTEND_DIR%
if not exist node_modules (
    echo [ERROR] Frontend dependencies not found! Please run 'npm install' first.
    exit /b 1
)

:: Start vite in a new window/process
start "Frontend Service" cmd /k "powershell -ExecutionPolicy Bypass -Command npm run dev"

echo [SUCCESS] System started!
echo Backend: http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Press any key to stop all services...
pause

:: Cleanup (Kill processes on exit - simplistic approach)
taskkill /FI "WINDOWTITLE eq Backend Service" /T /F
taskkill /FI "WINDOWTITLE eq Frontend Service" /T /F
endlocal
