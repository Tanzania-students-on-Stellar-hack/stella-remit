# Check if everything is ready for Soroban deployment

Write-Host "Checking Soroban Setup..." -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Rust
Write-Host "1. Rust:" -NoNewline
try {
    $rustVersion = rustc --version 2>$null
    Write-Host " ✅ $rustVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not installed" -ForegroundColor Red
    Write-Host "   Install from: https://rustup.rs/" -ForegroundColor Yellow
    $allGood = $false
}

# Check Cargo
Write-Host "2. Cargo:" -NoNewline
try {
    $cargoVersion = cargo --version 2>$null
    Write-Host " ✅ $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not installed" -ForegroundColor Red
    $allGood = $false
}

# Check Visual Studio Build Tools
Write-Host "3. Visual Studio Build Tools:" -NoNewline
$vsPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"
if (Test-Path $vsPath) {
    Write-Host " ✅ Installed" -ForegroundColor Green
} else {
    Write-Host " ❌ Not found" -ForegroundColor Red
    Write-Host "   Download: https://aka.ms/vs/17/release/vs_BuildTools.exe" -ForegroundColor Yellow
    Write-Host "   Select: Desktop development with C++" -ForegroundColor Yellow
    $allGood = $false
}

# Check Soroban CLI
Write-Host "4. Soroban CLI:" -NoNewline
try {
    $sorobanVersion = soroban --version 2>$null
    Write-Host " ✅ $sorobanVersion" -ForegroundColor Green
} catch {
    Write-Host " ⚠️  Not installed" -ForegroundColor Yellow
    Write-Host "   Will be installed by deployment script" -ForegroundColor Cyan
}

# Check WASM target
Write-Host "5. WASM Target:" -NoNewline
$targets = rustup target list --installed 2>$null
if ($targets -match "wasm32-unknown-unknown") {
    Write-Host " ✅ Installed" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Not installed" -ForegroundColor Yellow
    Write-Host "   Will be installed by deployment script" -ForegroundColor Cyan
}

Write-Host ""
if ($allGood) {
    Write-Host "🎉 All prerequisites met! Ready to deploy." -ForegroundColor Green
    Write-Host ""
    Write-Host "Run: .\COMPLETE_DEPLOY.ps1" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some prerequisites missing. Install them first." -ForegroundColor Yellow
}
Write-Host ""
