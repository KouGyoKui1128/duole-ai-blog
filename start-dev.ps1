$ErrorActionPreference = "Stop"

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
    throw "未找到后端虚拟环境 Python: $backendPython"
}

if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
    throw "未找到前端项目文件: $frontendDir"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "未找到 npm，请先安装 Node.js 20+"
}

$env:PYTHONPATH = $backendDir
$backendCommand = "Set-Location '$backendDir'; $env:PYTHONPATH = '$backendDir'; & '$backendPython' -m uvicorn app.main:app --host $backendHost --port $backendPort"
$frontendCommand = "Set-Location '$frontendDir'; npm run dev"

Write-Host "正在启动后端和前端..."
Start-Process powershell.exe -ArgumentList @('-NoExit','-Command', $backendCommand) -WindowStyle Normal | Out-Null
Start-Process powershell.exe -ArgumentList @('-NoExit','-Command', $frontendCommand) -WindowStyle Normal | Out-Null

Write-Host ""
Write-Host "启动完成，访问地址："
Write-Host "- 后端: http://$backendHost`:$backendPort"
Write-Host "- 前端: http://localhost:3000"
Write-Host ""
Write-Host "如果端口未立即打开，请稍等 10-15 秒后再刷新页面。"
