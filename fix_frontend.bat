@echo off
echo ==========================================
echo Fixing Next.js and Clerk Compatibility...
echo ==========================================

cd frontend

echo Cleaning up old Next.js 16 cache and modules...
rmdir /s /q .next
rmdir /s /q node_modules
del package-lock.json

echo.
echo Installing Stable Next.js 14...
call npm install

echo.
echo ==========================================
echo Done! Please run start.bat again.
echo ==========================================
pause
