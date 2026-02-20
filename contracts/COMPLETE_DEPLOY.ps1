# Complete Soroban Deployment Script for Windows
# Run this after Visual Studio Build Tools installation completes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Soroban Contract Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Rust
Write-Host "Step 1: Checking Rust installation..." -ForegroundColor Yellow
try {
    $rustVersion = rustc --version
    Write-Host "✅ Rust installed: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust not found. Please install from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

# Step 2: Install Soroban CLI
Write-Host ""
Write-Host "Step 2: Installing Soroban CLI..." -ForegroundColor Yellow
Write-Host "⏰ This takes 5-10 minutes. Please wait..." -ForegroundColor Cyan

cargo install --locked soroban-cli --version 22.0.1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Soroban CLI installation failed" -ForegroundColor Red
    Write-Host "Make sure Visual Studio Build Tools are installed!" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Soroban CLI installed!" -ForegroundColor Green

# Step 3: Add WASM target
Write-Host ""
Write-Host "Step 3: Adding WASM target..." -ForegroundColor Yellow
rustup target add wasm32-unknown-unknown
Write-Host "✅ WASM target added!" -ForegroundColor Green

# Step 4: Build contract
Write-Host ""
Write-Host "Step 4: Building contract..." -ForegroundColor Yellow
Set-Location escrow
cargo build --target wasm32-unknown-unknown --release

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Contract built successfully!" -ForegroundColor Green
Write-Host "📄 WASM: target\wasm32-unknown-unknown\release\escrow_contract.wasm" -ForegroundColor Cyan

# Step 5: Configure testnet
Write-Host ""
Write-Host "Step 5: Configuring Stellar testnet..." -ForegroundColor Yellow
soroban network add testnet `
    --rpc-url https://soroban-testnet.stellar.org `
    --network-passphrase "Test SDF Network ; September 2015" 2>$null

Write-Host "✅ Testnet configured!" -ForegroundColor Green

# Step 6: Generate deployer key
Write-Host ""
Write-Host "Step 6: Setting up deployer identity..." -ForegroundColor Yellow

$keyExists = soroban keys show deployer 2>$null
if (-not $keyExists) {
    soroban keys generate deployer --network testnet
    Write-Host "✅ Deployer key generated!" -ForegroundColor Green
} else {
    Write-Host "✅ Deployer key already exists!" -ForegroundColor Green
}

# Step 7: Get address and fund
$deployerAddress = soroban keys address deployer
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IMPORTANT: Fund Your Account" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your deployer address:" -ForegroundColor Yellow
Write-Host $deployerAddress -ForegroundColor White
Write-Host ""
Write-Host "Fund it here:" -ForegroundColor Yellow
Write-Host "https://laboratory.stellar.org/#account-creator?network=test" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or use Friendbot:" -ForegroundColor Yellow
Write-Host "curl `"https://friendbot.stellar.org?addr=$deployerAddress`"" -ForegroundColor Cyan
Write-Host ""

# Try Friendbot automatically
Write-Host "Attempting to fund via Friendbot..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://friendbot.stellar.org?addr=$deployerAddress" -UseBasicParsing
    Write-Host "✅ Account funded via Friendbot!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Friendbot failed. Please fund manually at the link above." -ForegroundColor Yellow
    Read-Host "Press Enter after funding the account"
}

# Step 8: Deploy contract
Write-Host ""
Write-Host "Step 8: Deploying contract to testnet..." -ForegroundColor Yellow
Write-Host "⏰ This may take 30-60 seconds..." -ForegroundColor Cyan

$contractId = soroban contract deploy `
    --wasm target\wasm32-unknown-unknown\release\escrow_contract.wasm `
    --source deployer `
    --network testnet

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host "Make sure your account is funded!" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  🎉 SUCCESS! CONTRACT DEPLOYED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Contract ID:" -ForegroundColor Yellow
Write-Host $contractId -ForegroundColor White
Write-Host ""
Write-Host "Next step:" -ForegroundColor Yellow
Write-Host "Update src\lib\soroban.ts with:" -ForegroundColor Cyan
Write-Host ""
Write-Host "export const ESCROW_CONTRACT_ID = `"$contractId`";" -ForegroundColor White
Write-Host ""
Write-Host "Then restart your dev server: npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "View on Stellar Expert:" -ForegroundColor Yellow
Write-Host "https://stellar.expert/explorer/testnet/contract/$contractId" -ForegroundColor Cyan
Write-Host ""
