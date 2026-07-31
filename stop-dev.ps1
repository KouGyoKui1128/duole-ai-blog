$ErrorActionPreference = "Stop"

# Force UTF-8 console output to avoid mojibake in mixed terminal environments.
try {
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    chcp.com 65001 > $null
} catch {
    # Non-fatal: continue with host default encoding.
}

Write-Host "Stopping frontend and backend processes..."

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
        Write-Host "Stopped PID $($_.ProcessId)"
    } catch {
        Write-Host "Failed to stop PID $($_.ProcessId): $($_.Exception.Message)"
    }
}

Write-Host "Service shutdown completed."
