<#
Install backend Python dependencies with fallback.

Usage (PowerShell):
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
  .\.venv\Scripts\Activate.ps1
  ./scripts/install_backend_deps.ps1

This script will attempt to install from `backend/requirements.txt` and, if it
detects a failure building native wheels (commonly pydantic-core requiring MSVC/Rust),
it will retry installing everything except `pydantic` using `backend/requirements_partial.txt`.

It will also print guidance for installing Visual Studio Build Tools or using Python 3.11.
#>

function Try-Install([string]$reqFile) {
    Write-Host "Installing from $reqFile..."
    & .\.venv\Scripts\python.exe -m pip install --upgrade pip
    $rc = & .\.venv\Scripts\python.exe -m pip install -r $reqFile
    return $LASTEXITCODE
}

Write-Host "Attempting to install full backend requirements..."
$exit = Try-Install "backend\requirements.txt"
if ($exit -eq 0) {
    Write-Host "All requirements installed successfully."
    exit 0
}

Write-Warning "Full install failed (likely due to building native wheels like pydantic-core)."
Write-Host "Attempting partial install (excluding pydantic)."
$exit2 = Try-Install "backend\requirements_partial.txt"
if ($exit2 -eq 0) {
    Write-Host "Partial install succeeded. Please install pydantic manually after installing Visual Studio Build Tools, or use a Python version with prebuilt wheels (3.11/3.12)."
    exit 0
}

Write-Error "Partial install also failed. Actions you can take:"
Write-Host "1) Install Visual Studio Build Tools (with C++ workload) and Rust toolchain, then rerun this script."
Write-Host "   - Visual Studio Build Tools (https://visualstudio.microsoft.com/downloads/) -> 'Build Tools for Visual Studio' -> select 'Desktop development with C++'."
Write-Host "   - Install Rust from https://rustup.rs/"
Write-Host "2) Or create a new venv using Python 3.11 and try again (prebuilt wheels are usually available)."
Write-Host "3) If you want, run: .\.venv\Scripts\python.exe -m pip install pydantic==2.6.1  (or another known wheel)"
exit 1
