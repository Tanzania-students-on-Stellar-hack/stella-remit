#!/bin/bash

echo "🚀 Building Soroban Escrow Contract..."

cd escrow

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install it first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check if wasm32 target is installed
if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
    echo "📦 Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Build the contract
echo "🔨 Building contract..."
cargo build --target wasm32-unknown-unknown --release

if [ $? -eq 0 ]; then
    echo "✅ Contract built successfully!"
    echo "📄 WASM file: target/wasm32-unknown-unknown/release/escrow_contract.wasm"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to testnet: soroban contract deploy --wasm target/wasm32-unknown-unknown/release/escrow_contract.wasm --source deployer --network testnet"
    echo "2. Update contract ID in src/lib/soroban.ts"
else
    echo "❌ Build failed"
    exit 1
fi
