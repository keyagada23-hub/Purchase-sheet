@echo off
title Procurement App Server
cd /d "%~dp0"
echo ===================================================
echo   Starting Procurement App on http://localhost:3000
echo ===================================================
echo.
npm run dev
pause
