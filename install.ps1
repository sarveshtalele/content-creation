# Thin wrapper for Windows PowerShell. The real installer is install.py (same on macOS, Linux and Windows).
#   .\install.ps1 install            .\install.ps1 status            .\install.ps1 uninstall --dry-run
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
foreach ($py in @('py', 'python', 'python3')) {
    if (Get-Command $py -ErrorAction SilentlyContinue) {
        if ($py -eq 'py') { & py -3 "$here\install.py" @args } else { & $py "$here\install.py" @args }
        exit $LASTEXITCODE
    }
}
Write-Error 'Python 3 is required: winget install Python.Python.3.12'
exit 1
