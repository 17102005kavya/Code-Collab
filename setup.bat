@echo off
echo ==========================================
echo Starting CollabCode Setup...
echo ==========================================

echo.
echo [1/3] Initializing Next.js Frontend (without ESLint)...
call npx -y create-next-app@latest frontend --typescript --tailwind --no-eslint --app --src-dir=false --import-alias="@/*" --use-npm

echo.
echo [2/3] Setting up Node.js Backend...
mkdir backend
cd backend
call npm init -y
call npm install express socket.io cors dotenv ioredis axios @supabase/supabase-js
cd ..

echo.
echo [3/3] Starting Redis Docker Container...
docker run -d -p 6379:6379 redis:alpine

echo.
echo ==========================================
echo Setup Complete! 
echo Please return to the chat so we can continue with the code.
echo ==========================================
pause
