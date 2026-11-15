#Requires -Version 5.1
<#
.SYNOPSIS
  一键导出线上博客数据，用于迁移和备份。

.DESCRIPTION
  生成 duole-blog-<时间>.zip，里面有:
    database.dump   整个数据库（pg_dump 自定义格式）: 文章、标签、项目、简历和作者账号
    images/         数据库里引用的图片，保持原来的路径（articles/...、projects/...）
    manifest.json   导出时间、各表行数、图片下载结果

  脚本只读取数据，不修改数据库，也不启动后端。
  连接字符串从仓库根目录的 .env.local 读取（neon env pull 生成），不会打印出来。
  导出文件包含作者邮箱和密码哈希，所以只能保存在仓库外面。
  还原步骤见 docs/DEPLOYMENT.md 的“导出数据”。

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\export-production.ps1

.EXAMPLE
  # 用本地开发库试运行
  powershell -ExecutionPolicy Bypass -File scripts\export-production.ps1 -EnvFile backend\.env -Variable DATABASE_URL
#>
[CmdletBinding()]
param(
    # 存放连接字符串的文件，默认是仓库根目录的 .env.local
    [string]$EnvFile = "",
    # 连接字符串的变量名。pg_dump 要用 Neon 的直连地址，不能用连接池地址
    [string]$Variable = "DATABASE_URL_UNPOOLED",
    # 导出文件保存的目录，必须在仓库外面，默认是仓库旁边的 duole-ai-blog-backups
    [string]$OutputDir = "",
    # 需要下载的图片地址前缀（正则）
    [string]$ImageUrlPrefix = 'https://[a-z0-9]+\.public\.blob\.vercel-storage\.com/'
)

$ErrorActionPreference = "Stop"
# Windows PowerShell 的下载进度条会让下载慢很多
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

# Windows PowerShell 5.1 在计算 param() 默认值时 $PSScriptRoot 还是空的，所以默认路径在这里补上
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $EnvFile) { $EnvFile = Join-Path $scriptDir "..\.env.local" }
if (-not $OutputDir) { $OutputDir = Join-Path $scriptDir "..\..\duole-ai-blog-backups" }

$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Fail([string]$message) {
    Write-Host "导出失败: $message" -ForegroundColor Red
    exit 1
}

function Resolve-FullPath([string]$path) {
    return $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($path)
}

function Read-ConnectionString([string]$path, [string]$name) {
    if (-not (Test-Path -LiteralPath $path)) {
        Fail "找不到 ${path}。先在仓库根目录运行 neon env pull。"
    }
    foreach ($line in Get-Content -LiteralPath $path) {
        if ($line -match "^\s*$([regex]::Escape($name))\s*=\s*(.*?)\s*$") {
            $value = $Matches[1] -replace '^["'']|["'']$', ''
            # backend/.env 是 asyncpg 的写法，转成 pg_dump 能识别的格式
            $value = $value -replace '^postgresql\+asyncpg://', 'postgresql://'
            $value = $value -replace '([?&])ssl=', '$1sslmode='
            if ($value) { return $value }
        }
    }
    Fail "${path} 里没有 ${name}。"
}

function Find-PgBin {
    $command = Get-Command pg_dump.exe -ErrorAction SilentlyContinue
    if ($command) { return (Split-Path $command.Source -Parent) }

    $candidates = foreach ($drive in Get-PSDrive -PSProvider FileSystem) {
        Get-ChildItem -Path (Join-Path $drive.Root "Program Files\PostgreSQL\*\bin\pg_dump.exe") -ErrorAction SilentlyContinue
    }
    $newest = $candidates |
        Sort-Object { [double]("0" + ($_.Directory.Parent.Name -replace '[^\d.]', '')) } -Descending |
        Select-Object -First 1
    if ($newest) { return $newest.DirectoryName }
    Fail "找不到 pg_dump。请安装 PostgreSQL 客户端，版本不能低于线上库。"
}

function Invoke-Pg([string]$exe, [string[]]$arguments, [string]$step) {
    $output = & $exe @arguments
    if ($LASTEXITCODE -ne 0) {
        Fail "${step}出错（退出码 ${LASTEXITCODE}）。如果提示 server version mismatch，请安装更新版本的 PostgreSQL 客户端。"
    }
    return $output
}

# ---- 准备 ----

$outputRoot = Resolve-FullPath $OutputDir
$repoPrefix = $repoRoot.TrimEnd('\') + '\'
if (($outputRoot.TrimEnd('\') + '\').StartsWith($repoPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    Fail "导出文件含作者邮箱和密码哈希，不能保存在仓库里。请换一个 -OutputDir。"
}

$connection = Read-ConnectionString (Resolve-FullPath $EnvFile) $Variable
$pgBin = Find-PgBin
$pgDump = Join-Path $pgBin "pg_dump.exe"
$pgRestore = Join-Path $pgBin "pg_restore.exe"
$psql = Join-Path $pgBin "psql.exe"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$name = "duole-blog-$stamp"
$workDir = Join-Path $outputRoot $name
$zipPath = Join-Path $outputRoot "$name.zip"
$imagesDir = Join-Path $workDir "images"
$dumpFile = Join-Path $workDir "database.dump"
$dumpSql = Join-Path $outputRoot "$name.scan.sql"
New-Item -ItemType Directory -Force -Path $imagesDir | Out-Null

try {
    # ---- 1. 导出数据库 ----
    Write-Host "[1/4] 导出数据库..."
    Invoke-Pg $pgDump @("--dbname=$connection", "--format=custom", "--no-owner", "--no-acl", "--file=$dumpFile") "导出数据库" | Out-Null

    $countSql = "SELECT table_name, (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text " +
        "FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    $tables = [ordered]@{}
    foreach ($row in (Invoke-Pg $psql @("--dbname=$connection", "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", $countSql) "统计行数")) {
        $parts = "$row".Split('|')
        if ($parts.Count -eq 2) { $tables[$parts[0]] = [int]$parts[1] }
    }

    # ---- 2. 找出数据库里引用的图片 ----
    # 把导出文件还原成 SQL 文本再查找，这样不管图片地址存在哪张表、哪个字段都能找到，
    # 同时也确认导出文件是完整可读的。
    Write-Host "[2/4] 查找图片地址..."
    Invoke-Pg $pgRestore @("--file=$dumpSql", $dumpFile) "读取导出文件" | Out-Null
    $dumpText = [IO.File]::ReadAllText($dumpSql, $utf8NoBom)
    $urlPattern = "$ImageUrlPrefix[^\s)<>`"'\\]+"
    $imageUrls = New-Object 'System.Collections.Generic.SortedSet[string]' ([StringComparer]::Ordinal)
    foreach ($match in [regex]::Matches($dumpText, $urlPattern)) { [void]$imageUrls.Add($match.Value) }
    Write-Host "      找到 $($imageUrls.Count) 张图片"

    # ---- 3. 下载图片 ----
    Write-Host "[3/4] 下载图片..."
    $failed = New-Object System.Collections.Generic.List[string]
    $downloaded = 0
    foreach ($url in $imageUrls) {
        $relative = ""
        try { $relative = ([Uri]$url).AbsolutePath.TrimStart('/') } catch { }
        if ($relative -notmatch '^[A-Za-z0-9_\-./]+$' -or $relative -match '\.\.') {
            $failed.Add($url)
            continue
        }

        $target = Join-Path $imagesDir ($relative -replace '/', '\')
        New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
        $ok = $false
        for ($attempt = 1; $attempt -le 3 -and -not $ok; $attempt++) {
            try {
                Invoke-WebRequest -Uri $url -OutFile $target -UseBasicParsing -TimeoutSec 60
                $ok = $true
            } catch {
                if ($attempt -lt 3) { Start-Sleep -Seconds 2 }
            }
        }
        if ($ok) {
            $downloaded++
        } else {
            $failed.Add($url)
            Remove-Item -LiteralPath $target -Force -ErrorAction SilentlyContinue
        }
    }

    # ---- 4. 打包 ----
    Write-Host "[4/4] 打包..."
    $sourceHost = ""
    try { $sourceHost = ([Uri]($connection -replace '^postgresql://', 'http://')).Host } catch { }
    $manifest = [ordered]@{
        exported_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
        source_host = $sourceHost
        pg_dump     = "$(& $pgDump --version)"
        tables      = $tables
        images      = [ordered]@{
            url_prefix = $ImageUrlPrefix
            found      = $imageUrls.Count
            downloaded = $downloaded
            failed     = [string[]]$failed.ToArray()
        }
    }
    [IO.File]::WriteAllText((Join-Path $workDir "manifest.json"), ($manifest | ConvertTo-Json -Depth 5), $utf8NoBom)

    # .NET 的 ZipFile 用正斜杠作路径分隔符，Linux 服务器上解压不会出问题
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [IO.Compression.ZipFile]::CreateFromDirectory($workDir, $zipPath, [IO.Compression.CompressionLevel]::Optimal, $false)
} finally {
    Remove-Item -LiteralPath $dumpSql -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $workDir -Recurse -Force -ErrorAction SilentlyContinue
}

$sizeMb = [math]::Round((Get-Item -LiteralPath $zipPath).Length / 1MB, 2)
Write-Host ""
Write-Host "导出完成: $zipPath（$sizeMb MB）" -ForegroundColor Green
foreach ($key in $tables.Keys) { Write-Host ("  {0,-18} {1} 行" -f $key, $tables[$key]) }
Write-Host ("  {0,-16} {1}" -f "图片", "$downloaded / $($imageUrls.Count) 张")

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "有 $($failed.Count) 张图片没下载成功，地址记在 manifest.json 的 images.failed 里:" -ForegroundColor Yellow
    foreach ($url in $failed) { Write-Host "  $url" -ForegroundColor Yellow }
    exit 2
}
exit 0
