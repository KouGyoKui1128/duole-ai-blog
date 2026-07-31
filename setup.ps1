$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "apps"

Write-Host "[1/4] 检查 Node/npm..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "未检测到 node，请先安装 Node.js 20+"
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "未检测到 npm，请先安装 Node.js 20+"
}

Write-Host "[2/4] 安装前端依赖..."
Push-Location $frontendDir
npm install
Pop-Location

Write-Host "[3/4] 创建后端虚拟环境并安装依赖..."
$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Push-Location $backendDir
    python -m venv .venv
    Pop-Location
}

& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $backendDir "requirements.txt")

Write-Host "[4/4] 创建环境变量模板副本..."
$rootEnv = Join-Path $root ".env"
$appsEnv = Join-Path $frontendDir ".env"
$backendEnv = Join-Path $backendDir ".env"

if (-not (Test-Path $rootEnv) -and (Test-Path (Join-Path $root ".env.example"))) {
    Copy-Item (Join-Path $root ".env.example") $rootEnv
}
if (-not (Test-Path $appsEnv) -and (Test-Path (Join-Path $frontendDir ".env.example"))) {
    Copy-Item (Join-Path $frontendDir ".env.example") $appsEnv
}
if (-not (Test-Path $backendEnv) -and (Test-Path (Join-Path $backendDir ".env.example"))) {
    Copy-Item (Join-Path $backendDir ".env.example") $backendEnv
}

Write-Host "初始化完成。请检查并修改 backend/.env 中的 DATABASE_URL 与 SECRET_KEY。"
