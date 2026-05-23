@echo off
echo ==========================================
echo Starting CollabCode...
echo ==========================================

echo Installing any missing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Starting Backend Server (Port 4000)...
start "CollabCode Backend" cmd /k "cd backend && node index.js"

echo.
echo Starting Frontend Next.js Server (Port 3000)...
start "CollabCode Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo All servers starting! 
echo Once they are ready, open http://localhost:3000 in your browser.
echo ==========================================
