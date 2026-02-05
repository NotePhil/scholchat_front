@echo off
echo Stopping any running React processes...
taskkill /f /im node.exe 2>nul

echo Clearing npm cache...
npm cache clean --force

echo Clearing React cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Current environment configuration:
echo REACT_APP_API_BASE_URL=http://localhost:8486/scholchat

echo.
echo Starting React development server with local backend...
echo Make sure your backend is running on http://localhost:8486
echo.

set REACT_APP_API_BASE_URL=http://localhost:8486/scholchat
npm start