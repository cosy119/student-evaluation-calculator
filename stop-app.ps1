$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidPath = Join-Path $projectPath '.app.pid'

function Show-Message([string]$message, [bool]$isError = $false) {
    Add-Type -AssemblyName PresentationFramework
    $icon = if ($isError) { [System.Windows.MessageBoxImage]::Error } else { [System.Windows.MessageBoxImage]::Information }
    [System.Windows.MessageBox]::Show(
        $message,
        'Student Evaluation Calculator',
        [System.Windows.MessageBoxButton]::OK,
        $icon
    ) | Out-Null
}

try {
    if (-not (Test-Path $pidPath)) {
        Show-Message 'The app is not running or was not started by this launcher.'
        exit 0
    }

    $tokenParts = (Get-Content $pidPath -Raw).Trim().Split('|')
    if ($tokenParts.Count -ne 2) {
        Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
        Show-Message 'The saved process information is outdated. No process was stopped.'
        exit 0
    }

    $processId = [int]$tokenParts[0]
    $expectedStartTicks = [long]$tokenParts[1]
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    $isOwnedProcess = $null -ne $process -and $process.StartTime.ToUniversalTime().Ticks -eq $expectedStartTicks
    if ($isOwnedProcess) {
        & taskkill.exe /PID $processId /T /F 2>$null | Out-Null
        Show-Message 'The app has been stopped.'
    } else {
        Show-Message 'The saved app process is no longer running. No process was stopped.'
    }
    Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
} catch {
    Show-Message $_.Exception.Message $true
}
