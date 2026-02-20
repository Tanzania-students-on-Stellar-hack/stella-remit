#!/bin/bash

echo "🚀 Deploying Escrow Contract to Stellar Testnet"
echo ""

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ Soroban CLI is not installed. Install it with:"
    echo "   cargo install --locked soroban-cli"
    exit 1
fi

# Add testnet network if not exists
echo "📡 Configuring testnet network..."
soroban network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" 2>/dev/null || true

# Check if deployer identity exists
if ! soroban keys show deployer &> /dev/null; then
    echo "🔑 Creating deployer identity..."
    soroban keys generate deployer --network testnet
    
    DEPLOYER_ADDRESS=$(soroban keys address deployer)
    echo ""
    echo "⚠️  Your deployer address: $DEPLOYER_ADDRESS"
    echo ""
    echo "Please fund this account with testnet XLM:"
    echo "👉 https://laboratory.stellar.org/#account-creator?network=test"
    echo ""
    read -p "Press Enter after funding the account..."
fi

# Build if not already built
if [ ! -f "escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm" ]; then
    echo "🔨 Building contract first..."
    cd escrow
    cargo build --target wasm32-unknown-unknown --release
    cd ..
fi

# Deploy
echo "🚀 Deploying contract..."
CONTRACT_ID=$(soroban contract deploy \
  --wasm escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm \
  --source deployer \
  --network testnet)

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Contract deployed successfully!"
    echo ""
    echo "📋 Contract ID: $CONTRACT_ID"
    echo ""
    echo "Next step: Update ESCROW_CONTRACT_ID in src/lib/soroban.ts with:"
    echo "export const ESCROW_CONTRACT_ID = \"$CONTRACT_ID\";"
    echo ""
else
    echo "❌ Deployment failed"
    exit 1
fi
