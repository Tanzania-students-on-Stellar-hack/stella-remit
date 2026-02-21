# Soroban Smart Contract Escrow - Complete Guide

## Current Status

The Soroban escrow contract is deployed at:
```
CBUE656QQWRAHZFA4HCWBFYUJOVME7XDNQ4QXQUIJDND2ACBGA6BAEU7
```

## Known Issues

### Issue: "UnreachableCodeReached" Error on Release

**Symptoms:**
```
Error: Simulation failed: HostError: Error(WasmVm, InvalidAction)
VM call trapped: UnreachableCodeReached
```

**Possible Causes:**
1. Escrow doesn't exist (ID not found in contract storage)
2. You're not the recipient (auth check failed)
3. Deadline hasn't passed yet
4. Escrow already released
5. Contract storage issue (data didn't persist)

**Why This Happens:**
The Rust contract uses `panic!` for errors, which causes "UnreachableCodeReached". The contract doesn't return detailed error messages.

## Troubleshooting Steps

### 1. Verify Escrow Was Created
After creating an escrow, check the transaction on Stellar Expert:
- Go to: https://stellar.expert/explorer/testnet
- Search for the transaction hash
- Verify the contract invocation succeeded

### 2. Check You're the Recipient
- The secret key you use for release MUST be the recipient's key
- NOT the creator's key
- The recipient address must match exactly what was used in creation

### 3. Verify Deadline Passed
- Check the current time vs deadline
- The UI shows "Can be released in X minutes"
- Wait until it shows "✓ Can be released now"

### 4. Check Contract Storage
The contract stores escrows in instance storage. On testnet, this storage might not persist between ledger closes if not properly configured.

## Alternative: Use Regular Escrow

If Soroban escrow continues to have issues, use the regular escrow feature instead:
- Go to `/escrow` (not `/soroban-escrow`)
- Uses standard Stellar operations (no smart contracts)
- More reliable and simpler
- Works the same way but without Soroban complexity

## How Regular Escrow Works

1. **Create**: Creates a temporary Stellar account with the funds
2. **Store Secret**: Escrow account secret stored in localStorage
3. **Release**: Recipient triggers release, funds sent from escrow account to recipient
4. **Database**: Tracks escrow status in Supabase

## Recommendation for Demo

For your hackathon demo, I recommend:

1. **Use Regular Escrow** (`/escrow`) - More reliable
2. **Show Soroban Page** - Explain it's the smart contract version
3. **Mention**: "We have both implementations - traditional and Soroban smart contract"

This shows you understand both approaches without risking demo failures.

## If You Want to Fix Soroban Escrow

### Option 1: Add Better Error Handling to Contract

Modify the Rust contract to return Result types instead of panicking:

```rust
pub fn release(env: Env, escrow_id: u64, token_address: Address) -> Result<(), Error> {
    // ... validation logic
    if escrow.released {
        return Err(Error::AlreadyReleased);
    }
    // ... rest of logic
}
```

Then redeploy the contract.

### Option 2: Debug with Contract Logs

Add more diagnostic events in the contract:

```rust
env.events().publish(("escrow_found", escrow_id), &escrow);
env.events().publish(("deadline_check",), (current_time, escrow.deadline));
```

This will show in the event log what's happening.

### Option 3: Test with Soroban CLI

Test the contract directly with soroban-cli:

```bash
# Invoke create_escrow
soroban contract invoke \
  --id CBUE656QQWRAHZFA4HCWBFYUJOVME7XDNQ4QXQUIJDND2ACBGA6BAEU7 \
  --source CREATOR_SECRET \
  --network testnet \
  -- create_escrow \
  --creator CREATOR_ADDRESS \
  --recipient RECIPIENT_ADDRESS \
  --token_address CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC \
  --amount 10000000 \
  --deadline 1771759393

# Check if it returns an escrow ID
```

## Summary

- **For Demo**: Use regular escrow at `/escrow`
- **For Learning**: Soroban escrow shows smart contract integration
- **Issue**: Contract panics don't give detailed errors
- **Solution**: Either fix contract error handling or use regular escrow

The regular escrow works perfectly and is actually simpler to understand for demo purposes!
