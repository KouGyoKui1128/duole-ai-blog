$ErrorActionPreference = "Stop"

Write-Host "正在停止前端和后端进程..."

Get-CimInstance Win32_Process | Where-Object {
    $_.Name -in @('node.exe','python.exe','pwsh.exe','powershell.exe') -and (
        $_.CommandLine -match 'uvicorn' -or
        $_.CommandLine -match 'next dev' -or
        $_.CommandLine -match 'start-dev.ps1' -or
        $_.CommandLine -match 'start-dev.bat'
    )
} | ForEach-Object {
    try {
        Stop-Process -Id $_.ProcessId -Force
        Write-Host "已停止 PID $($_.ProcessId)"
    } catch {
        Write-Host "无法停止 PID $($_.ProcessId): $($_.Exception.Message)"
    }
}

Write-Host "服务停止完成。"
