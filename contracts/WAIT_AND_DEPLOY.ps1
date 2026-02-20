Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ⏰ Waiting for CLI Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking Soroban CLI installation status..." -ForegroundColor Yellow
Write-Host ""

# Check current version
$currentVersion = soroban version 2>&1 | Select-String "stellar (\d+\.\d+\.\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }

if ($currentVersion -eq "25.1.0") {
    Write-Host "✅ Soroban CLI v25.1.0 is installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to deploy! Run:" -ForegroundColor Yellow
    Write-Host "  .\DEPLOY_NOW.ps1" -ForegroundColor White
    Write-Host ""
} elseif ($currentVersion -eq "22.0.1") {
    Write-Host "⏰ Still on v22.0.1 - installation in progress" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "The upgrade is compiling in another terminal." -ForegroundColor Cyan
    Write-Host "This can take 15-30 minutes on Windows." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Once complete, run:" -ForegroundColor Yellow
    Write-Host "  .\DEPLOY_NOW.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or check status again:" -ForegroundColor Yellow
    Write-Host "  .\WAIT_AND_DEPLOY.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❓ Unexpected version: $currentVersion" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try running:" -ForegroundColor Yellow
    Write-Host "  soroban version" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  While You Wait..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is already 100% functional!" -ForegroundColor Green
Write-Host ""
Write-Host "Test these features now:" -ForegroundColor Yellow
Write-Host "  1. Cross-Border Payments: http://localhost:5173/cross-border" -ForegroundColor White
Write-Host "  2. Traditional Escrow: http://localhost:5173/escrow" -ForegroundColor White
Write-Host "  3. Send XLM: http://localhost:5173/send" -ForegroundColor White
Write-Host ""
Write-Host "The Soroban smart contract is a bonus feature!" -ForegroundColor Cyan
Write-Host ""
