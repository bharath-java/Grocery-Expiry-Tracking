@echo off
cd %~dp0
echo Installing Web Testing dependencies...
call npm install
echo Running Web E2E Selenium tests...
call npm run test
pause
