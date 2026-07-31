@echo off
set SCRIPT=%~dp0stop-dev.ps1

if not exist "%SCRIPT%" (
	echo [ERROR] Cannot find stop script: %SCRIPT%
	exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
