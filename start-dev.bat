@echo off
set SCRIPT=%~dp0start-dev.ps1

if not exist "%SCRIPT%" (
	echo [ERROR] Cannot find start script: %SCRIPT%
	exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
if errorlevel 1 (
	echo [ERROR] Failed to start services.
	exit /b 1
)
