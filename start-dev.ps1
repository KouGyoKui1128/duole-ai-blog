$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "apps"
$backendPython = Join-Path $backendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $backendPython)) {
    throw "未找到后端虚拟环境 Python: $backendPython"
}

if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
    throw "未找到前端项目文件: $frontendDir"
}

$env:PYTHONPATH = $backendDir
$backendCommand = "Set-Location '$backendDir'; $env:PYTHONPATH = '$backendDir'; & '$backendPython' -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
$frontendCommand = "Set-Location '$frontendDir'; npm run dev"

Write-Host "正在启动后端和前端..."
Start-Process powershell.exe -ArgumentList @('-NoExit','-Command', $backendCommand) -WindowStyle Normal | Out-Null
Start-Process powershell.exe -ArgumentList @('-NoExit','-Command', $frontendCommand) -WindowStyle Normal | Out-Null

Write-Host ""
Write-Host "启动完成，访问地址："
Write-Host "- 后端: http://127.0.0.1:8000"
Write-Host "- 前端: http://localhost:3000"
Write-Host ""
Write-Host "如果端口未立即打开，请稍等 10-15 秒后再刷新页面。"
