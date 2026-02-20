# 🌟 StellarRemit - Cross-Border Payment Platform

A fintech solution built on Stellar blockchain for fast, low-cost cross-border payments with automatic currency conversion.

**Built for Stellar Mini-Hackathon 2024**

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit: http://localhost:5173

## 🎯 Features - Covers All 4 Hackathon Project Ideas

### ✅ 1. Cross-Border Payment Prototype
- Real-time XLM ↔ USDC conversion using path payments
- Guaranteed recipient amount
- 2-5 second settlement, <$0.01 fees
- **Demo at:** `/cross-border`

### ✅ 2. Stablecoin/Token Issuance Demo
- Create custom tokens on Stellar (no smart contract needed)
- Issue stablecoins, loyalty points, or any asset
- Automatic distributor account creation
- **Demo at:** `/token-issuance`

### ✅ 3. Merchant Payment Solution
- QR code for receiving payments
- Simple payment links
- Transaction tracking
- **Demo at:** `/receive`

### ✅ 4. Savings Group/Microfinance Tool
- Community savings pools (chamas, ROSCAs)
- Transparent blockchain tracking
- Group contribution management
- **Demo at:** `/savings-group`

### 🎁 Bonus Features
- Traditional escrow (multi-sig) at `/escrow`
- Soroban smart contract escrow at `/soroban-escrow`
- Basic XLM transfers at `/send`
- Wallet management
- Transaction history

## 📋 Current Status

✅ **100% Working:**
- Cross-border payments with path payments
- Basic XLM transfers
- Traditional multi-sig escrow
- Wallet management
- Transaction history

⏰ **In Progress:**
- Soroban CLI upgrading (v22.0.1 → v25.1.0)
- Takes 15-30 minutes on Windows
- Contract code ready, deployment script ready

## 🔧 Soroban Deployment (When CLI Ready)

**Step 1:** Check if ready
```powershell
cd contracts
.\WAIT_AND_DEPLOY.ps1
```

**Step 2:** Deploy
```powershell
.\DEPLOY_NOW.ps1
```

**Step 3:** Copy contract ID to `src/lib/soroban.ts`:
```typescript
export const ESCROW_CONTRACT_ID = "YOUR_CONTRACT_ID_HERE";
```

Done! Test at `/soroban-escrow`

## 🛠 Tech Stack

**Frontend:** React + TypeScript + TailwindCSS + shadcn/ui  
**Blockchain:** Stellar SDK + Soroban + Path Payments  
**Backend:** Supabase  
**Smart Contracts:** Rust

## 📁 Key Files

```
src/
├── pages/
│   ├── CrossBorderPayment.tsx  # Path payments (main demo)
│   ├── SendMoney.tsx           # Basic payments
│   ├── Escrow.tsx              # Multi-sig escrow
│   └── SorobanEscrow.tsx       # Smart contract escrow
├── lib/
│   ├── stellar.ts              # Stellar SDK setup
│   ├── pathPayments.ts         # Cross-border logic
│   └── soroban.ts              # Smart contract helpers
contracts/
└── escrow/src/lib.rs           # Rust smart contract
```

## 🎬 Hackathon Demo Script - All 4 Project Ideas

### 1. Cross-Border Payment Prototype ⭐ (Main Demo)
1. Navigate to `/cross-border`
2. Enter recipient address
3. Select: Send XLM → Receive USDC
4. Enter amount: 10 USDC
5. Click "Get Quote" (shows conversion rate)
6. Click "Send Payment"
7. Show transaction on Stellar Expert
8. Explain: 2-5 second settlement, <$0.01 fee, automatic conversion

### 2. Stablecoin/Token Issuance Demo
1. Navigate to `/token-issuance`
2. Create custom token (e.g., "POINTS" for loyalty program)
3. Set supply limit
4. Issue tokens
5. Show issuer and distributor addresses
6. Explain: No smart contract needed, built into Stellar

### 3. Merchant Payment Solution
1. Navigate to `/receive`
2. Show QR code for payments
3. Copy merchant address
4. Explain: Customers scan QR or use address to pay
5. Show transaction history

### 4. Savings Group/Microfinance Tool
1. Navigate to `/savings-group`
2. Create savings pool (e.g., "Women's Group")
3. Set target amount and member count
4. Make first contribution
5. Show pool address for other members
6. Explain: Perfect for chamas (Kenya), ROSCAs, village savings

### Bonus: Smart Contracts
1. Show Rust code: `contracts/escrow/src/lib.rs`
2. Explain programmable escrow logic
3. If deployed: Demo at `/soroban-escrow`

## 🌐 Network Configuration

**Testnet (Default):**
```typescript
// src/lib/stellar.ts
const USE_TESTNET = true;
```

**Endpoints:**
- Horizon: https://horizon-testnet.stellar.org
- Soroban: https://soroban-testnet.stellar.org
- Friendbot: https://friendbot.stellar.org
- Explorer: https://stellar.expert/explorer/testnet

## 💡 Key Stellar Concepts

### Path Payments
Automatic currency conversion using Stellar's built-in DEX:
```typescript
await sendPathPayment(
  sourceKeypair,
  recipientAddress,
  StellarSdk.Asset.native(),  // Send XLM
  "50",                        // Max 50 XLM
  ASSETS.USDC,                 // Receive USDC
  "10"                         // Exactly 10 USDC
);
```

### Trustlines
Required before receiving custom assets:
```typescript
await createTrustline(accountKeypair, ASSETS.USDC);
```

### Soroban Smart Contracts
Programmable logic in Rust:
```rust
pub fn create_escrow(
    env: Env,
    creator: Address,
    recipient: Address,
    amount: i128,
    deadline: u64,
) -> u64
```

## 🐛 Troubleshooting

**Account not found?**  
→ Fund with Friendbot: https://friendbot.stellar.org

**No trustline?**  
→ Create trustline before receiving USDC/EURC

**Path not found?**  
→ Ensure assets have DEX liquidity

**Soroban deployment fails?**  
→ Wait for CLI upgrade to complete (check with `soroban version`)

## 🔗 Resources

- [Stellar Docs](https://stellar.org/developers)
- [JavaScript SDK](https://stellar.github.io/js-stellar-sdk/)
- [Soroban Docs](https://soroban.stellar.org/docs)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Stellar Discord](https://discord.gg/stellar)

## 🌍 Real-World Anchors

**Africa:**
- Yellow Card - Tanzania, Kenya, Uganda, Nigeria, Ghana
- MoneyGram - 180+ countries, USDC cash-out
- Fonbnk - Airtime to stablecoin

**Global:**
- Circle - USDC issuer
- Tempo - EURC issuer
- Bitso - Mexico/LATAM

## 📝 License

MIT

---

**Made for Stellar Mini-Hackathon 2024** 🚀
