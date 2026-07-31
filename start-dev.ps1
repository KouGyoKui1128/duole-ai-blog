$ErrorActionPreference = "Stop"

# Force UTF-8 console output to avoid mojibake in mixed terminal environments.
try {
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    chcp.com 65001 > $null
} catch {
    # Non-fatal: continue with host default encoding.
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "apps"
$backendPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$backendEnvFile = Join-Path $backendDir ".env"

$backendHost = "127.0.0.1"
$backendPort = "8000"

if (Test-Path $backendEnvFile) {
    Get-Content $backendEnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) {
            return
        }
        if ($line -match '^BACKEND_HOST=(.+)$') {
            $backendHost = $matches[1].Trim().Trim('"')
        }
        if ($line -match '^BACKEND_PORT=(.+)$') {
            $backendPort = $matches[1].Trim().Trim('"')
        }
    }
}

if (-not (Test-Path $backendPython)) {
    throw "Backend venv Python was not found: $backendPython"
}

if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
    throw "Frontend package.json was not found: $frontendDir"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found. Please install Node.js 20+ first."
}

$env:PYTHONPATH = $backendDir
$backendCommand = "Set-Location '$backendDir'; $env:PYTHONPATH = '$backendDir'; & '$backendPython' -m uvicorn app.main:app --host $backendHost --port $backendPort"
$frontendCommand = "Set-Location '$frontendDir'; npm run dev"

Write-Host "Starting backend and frontend..."
Start-Process powershell.exe -ArgumentList @('-NoExit','-Command', $backendCommand) -WindowStyle Normal | Out-Null
Start-Process powershell.exe -ArgumentList @('-NoExit','-Command', $frontendCommand) -WindowStyle Normal | Out-Null

Write-Host ""
Write-Host "Startup done. Service URLs:"
Write-Host "- Backend: http://$backendHost`:$backendPort"
Write-Host "- Frontend: http://localhost:3000"
Write-Host ""
Write-Host "If ports are not ready yet, wait 10-15 seconds and refresh."
