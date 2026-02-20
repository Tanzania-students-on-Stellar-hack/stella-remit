# Soroban Smart Contract - Escrow

Rust-based escrow smart contract for Stellar blockchain.

## Build Contract

```bash
cd escrow
cargo build --target wasm32-unknown-unknown --release
```

Output: `escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm`

## Deploy to Testnet

```powershell
.\WAIT_AND_DEPLOY.ps1  # Check if CLI ready
.\DEPLOY_NOW.ps1       # Deploy contract
```

Copy the contract ID to `src/lib/soroban.ts`

## Contract Functions

```rust
// Create escrow
create_escrow(creator, recipient, token_address, amount, deadline) -> escrow_id

// Release funds to recipient (after deadline)
release(escrow_id, token_address)

// Refund to creator (if deadline passed)
refund(escrow_id, token_address)

// Get escrow details
get_escrow(escrow_id) -> Escrow
```

## Prerequisites

- Rust + Cargo
- Soroban CLI v25.1.0+
- wasm32-unknown-unknown target

```bash
rustup target add wasm32-unknown-unknown
cargo install --locked soroban-cli
```

## Status

✅ Contract built  
⏰ CLI upgrading (v22.0.1 → v25.1.0)  
📝 Ready to deploy when CLI completes
