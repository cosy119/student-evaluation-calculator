$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$appUrl = 'http://127.0.0.1:5173/student-evaluation-calculator/'
$logPath = Join-Path $projectPath '.app.log'
$errorLogPath = Join-Path $projectPath '.app-error.log'
$pidPath = Join-Path $projectPath '.app.pid'

function Show-LauncherError([string]$message) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show(
        $message,
        'Student Evaluation Calculator',
        [System.Windows.MessageBoxButton]::OK,
        [System.Windows.MessageBoxImage]::Error
    ) | Out-Null
}

try {
    $npmCommand = Get-Command 'npm.cmd' -ErrorAction Stop

    if (-not (Test-Path (Join-Path $projectPath 'node_modules'))) {
        $installProcess = Start-Process `
            -FilePath $npmCommand.Source `
            -ArgumentList @('install', '--no-audit', '--no-fund') `
            -WorkingDirectory $projectPath `
            -WindowStyle Hidden `
            -Wait `
            -PassThru

        if ($installProcess.ExitCode -ne 0) {
            throw 'Dependency installation failed. Check your network connection.'
        }
    }

    $alreadyRunning = $false
    $portOccupied = $false
    try {
        $response = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 1
        $portOccupied = $response.StatusCode -eq 200
        $alreadyRunning = $portOccupied -and $response.Content.Contains('student-evaluation-calculator')
    } catch {
        $alreadyRunning = $false
        $portOccupied = $false
    }

    if ($portOccupied -and -not $alreadyRunning) {
        throw 'Port 5173 is already used by another application. Close it and try again.'
    }

    if (-not $alreadyRunning) {
        $serverProcess = Start-Process `
            -FilePath $npmCommand.Source `
            -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1') `
            -WorkingDirectory $projectPath `
            -WindowStyle Hidden `
            -RedirectStandardOutput $logPath `
            -RedirectStandardError $errorLogPath `
            -PassThru
        $processToken = "$($serverProcess.Id)|$($serverProcess.StartTime.ToUniversalTime().Ticks)"
        Set-Content -Path $pidPath -Value $processToken -Encoding ASCII

        $ready = $false
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            Start-Sleep -Milliseconds 250
            try {
                $response = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 1
                if ($response.StatusCode -eq 200) {
                    $ready = $true
                    break
                }
            } catch {
                $ready = $false
            }
        }

        if (-not $ready) {
            & taskkill.exe /PID $serverProcess.Id /T /F 2>$null | Out-Null
            Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
            throw "The app did not start. See $errorLogPath for details."
        }
    }

    Start-Process $appUrl
} catch {
    Show-LauncherError $_.Exception.Message
}
