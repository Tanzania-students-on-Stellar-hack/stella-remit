Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🚀 Soroban Contract Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if WASM file exists
$wasmPath = "escrow\target\wasm32-unknown-unknown\release\escrow_contract.wasm"
if (-not (Test-Path $wasmPath)) {
    Write-Host "❌ Contract not built yet!" -ForegroundColor Red
    Write-Host "Run this first:" -ForegroundColor Yellow
    Write-Host "  cd escrow" -ForegroundColor White
    Write-Host "  cargo build --target wasm32-unknown-unknown --release" -ForegroundColor White
    exit 1
}

Write-Host "✅ Contract WASM found!" -ForegroundColor Green
Write-Host ""

# Configure testnet
Write-Host "Step 1: Configuring testnet..." -ForegroundColor Yellow
soroban network add testnet `
  --rpc-url https://soroban-testnet.stellar.org `
  --network-passphrase "Test SDF Network ; September 2015" 2>$null
Write-Host "✅ Testnet configured" -ForegroundColor Green

# Generate key if needed
Write-Host ""
Write-Host "Step 2: Setting up deployer identity..." -ForegroundColor Yellow
$keyExists = soroban keys show deployer 2>$null
if (-not $keyExists) {
    soroban keys generate deployer --network testnet
    Write-Host "✅ New deployer key generated" -ForegroundColor Green
} else {
    Write-Host "✅ Using existing deployer key" -ForegroundColor Green
}

# Get address
$address = soroban keys address deployer
Write-Host ""
Write-Host "Your deployer address:" -ForegroundColor Yellow
Write-Host $address -ForegroundColor White

# Fund via Friendbot
Write-Host ""
Write-Host "Step 3: Funding account..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://friendbot.stellar.org?addr=$address" -UseBasicParsing
    Write-Host "✅ Account funded via Friendbot!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Friendbot failed. Please fund manually:" -ForegroundColor Yellow
    Write-Host "https://laboratory.stellar.org/#account-creator?network=test" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter after funding the account"
}

# Deploy
Write-Host ""
Write-Host "Step 4: Deploying contract to testnet..." -ForegroundColor Yellow
Write-Host "⏰ This may take 30-60 seconds..." -ForegroundColor Cyan
Write-Host ""

try {
    $contractId = soroban contract deploy `
        --wasm $wasmPath `
        --source deployer `
        --network testnet

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  🎉 SUCCESS! CONTRACT DEPLOYED!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Contract ID:" -ForegroundColor Yellow
        Write-Host $contractId -ForegroundColor White
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  NEXT STEPS:" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Open: src\lib\soroban.ts" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "2. Replace this line:" -ForegroundColor Yellow
        Write-Host '   export const ESCROW_CONTRACT_ID = "CXXXXXXXXX...";' -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. With:" -ForegroundColor Yellow
        Write-Host "   export const ESCROW_CONTRACT_ID = `"$contractId`";" -ForegroundColor White
        Write-Host ""
        Write-Host "4. Restart dev server:" -ForegroundColor Yellow
        Write-Host "   npm run dev" -ForegroundColor White
        Write-Host ""
        Write-Host "5. Test at: http://localhost:5173/soroban-escrow" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "View on Stellar Expert:" -ForegroundColor Cyan
        Write-Host "https://stellar.expert/explorer/testnet/contract/$contractId" -ForegroundColor White
        Write-Host ""
    } else {
        throw "Deployment failed"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Account not funded (check Friendbot)" -ForegroundColor White
    Write-Host "- Network issues (try again)" -ForegroundColor White
    Write-Host "- WASM file corrupted (rebuild contract)" -ForegroundColor White
    exit 1
}
