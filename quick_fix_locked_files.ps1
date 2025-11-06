# Quick Fix Script for Locked Build Files
# Run this in PowerShell (as Administrator if needed)

Write-Host "Attempting to fix locked build files..." -ForegroundColor Yellow

# Navigate to project
$projectPath = "C:\kisanone-frontend-main"
Set-Location $projectPath

# Try to delete the locked directory
$lockDir = "$projectPath\node_modules\react-native-screens\android\build"

Write-Host "Attempting to delete locked directory: $lockDir" -ForegroundColor Cyan

if (Test-Path $lockDir) {
    try {
        # Try to remove read-only attributes
        Get-ChildItem -Path $lockDir -Recurse -Force | ForEach-Object {
            $_.Attributes = "Normal"
        }
        
        # Try to delete
        Remove-Item -Path $lockDir -Recurse -Force -ErrorAction Stop
        Write-Host "Successfully deleted locked directory!" -ForegroundColor Green
    }
    catch {
        Write-Host "Could not delete directory: $_" -ForegroundColor Red
        Write-Host "Please close all IDEs and file explorers, then try again." -ForegroundColor Yellow
        
        # Show what processes might be locking files
        Write-Host "`nChecking for processes that might lock files..." -ForegroundColor Cyan
        $javaProcs = Get-Process -Name java -ErrorAction SilentlyContinue
        $nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
        
        if ($javaProcs -or $nodeProcs) {
            Write-Host "Found running processes:" -ForegroundColor Yellow
            if ($javaProcs) { Write-Host "  - Java processes (may need to stop Gradle daemon)" }
            if ($nodeProcs) { Write-Host "  - Node processes" }
            Write-Host "`nTry running: .\gradlew --stop" -ForegroundColor Cyan
        }
    }
}
else {
    Write-Host "Directory doesn't exist, skipping..." -ForegroundColor Green
}

Write-Host "`nDone! Now try running: .\gradlew clean" -ForegroundColor Cyan

