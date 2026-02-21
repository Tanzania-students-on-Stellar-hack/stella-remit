# Dashboard Explained - Complete Guide

## Overview
The Dashboard is the central hub of StellarRemit. It's the first page users see after logging in, and it provides everything they need to manage their Stellar wallet and transactions.

---

## What the Dashboard Shows

### 1. Network Warning Banner
**What it shows:**
- A colored banner at the top indicating whether you're on Testnet (blue) or Mainnet (yellow)
- Testnet: "You are on Stellar Testnet. All transactions use test XLM (no real value)"
- Mainnet: "You are on the Stellar Mainnet. All transactions use real XLM and are irreversible"

**How it works:**
- Uses `isTestnet` constant from `stellar.ts` to detect current network
- Dynamically changes color and message based on network
- Blue for testnet (safe, development mode)
- Yellow for mainnet (warning, real money)

**Why we use it:**
- Prevents costly mistakes - users know if they're using real or test money
- Critical for hackathon demos (testnet) vs production (mainnet)
- Reduces confusion about why balances are zero or transactions fail

---

### 2. Onboarding Tutorial
**What it shows:**
- 5-step interactive tutorial for new users
- Progress bar showing current step
- Icons and descriptions for each step:
  1. Welcome to StellarRemit
  2. Set Up Your Wallet
  3. Fund Your Account
  4. Send Your First Payment
  5. You're All Set!

**How it works:**
- Shows automatically on first visit
- Stores completion status in `localStorage` with key `stellarremit_onboarding_done`
- Users can skip or go through step-by-step
- Disappears after completion and never shows again

**Why we use it:**
- New users don't know how blockchain wallets work
- Reduces support questions by explaining the basics upfront
- Increases user confidence and reduces abandonment
- Shows users the value proposition immediately

---

### 3. Wallet Creation Flow
**What it shows (if no wallet exists):**
- Large card with wallet icon
- "Create Your Stellar Wallet" heading
- Explanation text
- Two buttons: "Create New Wallet" and "Import Existing Wallet"

**How it works:**
- Checks if `profile.stellar_public_key` exists
- If not, shows wallet creation UI
- "Create New Wallet" button calls Supabase Edge Function `create-wallet`
- Edge function generates new keypair securely on server
- Public key stored in database, private key returned once to user
- "Import Existing Wallet" opens dialog to paste existing secret key

**Why we use it:**
- Users need a Stellar account to do anything
- Server-side generation is more secure than client-side
- Import option allows users to bring existing wallets
- Prevents users from getting stuck with no way to proceed

---

### 4. Balance Display Cards
**What it shows:**
- Grid of cards showing asset balances
- Main card: XLM balance (Stellar's native token)
- Additional cards: Other assets user holds (USDC, EURC, custom tokens)
- "Quick Actions" card with Refresh button

**How it works:**
- Calls `getBalance(publicKey)` from `stellar.ts`
- Connects to Stellar Horizon API
- Fetches all assets held by the account
- Updates every time user performs a transaction
- Refresh button manually re-fetches balances
- Shows loading state ("...") while fetching

**Why we use it:**
- Users need to see how much money they have
- Stellar supports multiple assets, not just XLM
- Real-time updates show transaction results immediately
- Manual refresh gives users control when they suspect balance is stale

---

### 5. Quick Action Links
**What it shows:**
- 4 cards with icons and descriptions:
  1. Send Money - Transfer to another wallet
  2. Receive - Share your address
  3. Convert - Swap assets
  4. Escrow - Secure transactions

**How it works:**
- Each card is a clickable link using React Router
- Hover effect (shadow) provides visual feedback
- Icons from `lucide-react` library
- Routes to corresponding feature pages

**Why we use it:**
- Users need fast access to common actions
- Visual icons are easier to understand than text menus
- Reduces clicks to reach important features
- Improves user experience with clear navigation

---

### 6. Funding Guide
**What it shows:**
- Card with coin icon
- Step-by-step instructions to fund wallet:
  1. Buy XLM on exchange (Coinbase, Binance, Kraken)
  2. Copy wallet address
  3. Withdraw XLM to wallet
  4. Wait for confirmation
- Note about 1 XLM minimum requirement

**How it works:**
- Static component, always visible
- Links to exchanges open in new tab
- Provides external links with proper security (`rel="noopener noreferrer"`)

**Why we use it:**
- Most users don't know how to get cryptocurrency
- Empty wallets are useless - users need to fund them
- Stellar requires 1 XLM minimum to activate accounts (base reserve)
- Reduces support questions about "why can't I send money?"
- Links to trusted exchanges make it actionable

---

### 7. Recent Transactions
**What it shows:**
- Card showing last 5 transactions
- Each transaction shows:
  - Icon (up arrow for sent, down arrow for received)
  - "Sent" or "Received" label with asset name
  - Timestamp (formatted as "Jan 15, 3:45 PM")
  - Amount (red for sent, green for received)
  - Link to blockchain explorer (if tx_hash exists)
- "View All" button to see full history
- Empty state if no transactions

**How it works:**
- Queries Supabase `transactions` table
- Orders by `created_at` descending (newest first)
- Limits to 5 results
- Uses Supabase Realtime to listen for new transactions
- Automatically updates when new transaction inserted
- Compares `sender_id` with current user to determine direction
- Links to Stellar.Expert explorer using `txExplorerUrl()` helper

**Why we use it:**
- Users want to see transaction history immediately
- Confirms transactions succeeded
- Provides proof of payment
- Explorer link allows verification on blockchain
- Real-time updates give instant feedback

---

### 8. Real-Time Transaction Notifications
**What it shows:**
- Toast notification popup when transaction occurs
- Shows amount, asset, and memo
- Bell icon for incoming payments
- Auto-refreshes balance

**How it works:**
- Uses Supabase Realtime subscriptions
- Listens to `INSERT` events on `transactions` table
- Filters by `receiver_id` or `sender_id` matching current user
- Calls `toast.info()` from Sonner library
- Automatically triggers `fetchBalances()` to update balance

**Why we use it:**
- Users need immediate feedback when money arrives
- Prevents confusion ("did my payment go through?")
- Creates engaging, responsive user experience
- Reduces need to manually refresh page

---

### 9. Wallet Address Display
**What it shows:**
- Card at bottom with "Wallet Address" title
- Full Stellar public key in monospace font
- Gray background for easy reading
- Text wraps if screen is narrow

**How it works:**
- Displays `profile.stellar_public_key` from database
- Uses `<code>` tag with monospace font
- `break-all` CSS class allows wrapping on small screens

**Why we use it:**
- Users need their address to receive payments
- Easy to copy-paste for sharing
- Always visible for reference
- Monospace font makes it clear it's a technical identifier

---

## Technical Architecture

### State Management
- Uses React hooks (`useState`, `useEffect`, `useCallback`)
- `useAuth()` context provides user profile and refresh function
- Local state for balances, loading states, onboarding visibility

### Data Flow
1. Component mounts → fetch balances from Stellar Horizon
2. User performs action → Supabase Edge Function executes
3. Edge Function updates database → Realtime subscription fires
4. Component receives update → refreshes UI automatically

### Real-Time Features
- Supabase Realtime channels for live transaction updates
- Automatic balance refresh on incoming/outgoing transactions
- Toast notifications for user feedback
- Cleanup on unmount to prevent memory leaks

### Performance Optimizations
- `useCallback` for `fetchBalances` prevents unnecessary re-renders
- Conditional rendering (only show wallet UI if wallet exists)
- Loading states prevent UI flicker
- Debounced refresh button (disabled while loading)

---

## Why Each Feature Exists

### Network Warning
**Problem:** Users accidentally use mainnet with real money during testing
**Solution:** Clear, colored banner shows current network
**Impact:** Prevents costly mistakes, reduces support tickets

### Onboarding Tutorial
**Problem:** New users don't understand blockchain wallets
**Solution:** 5-step guided tour explains everything
**Impact:** Reduces abandonment, increases user confidence

### Wallet Creation
**Problem:** Users can't do anything without a wallet
**Solution:** Prominent creation flow with import option
**Impact:** Gets users started quickly, supports existing users

### Balance Display
**Problem:** Users need to know how much money they have
**Solution:** Clear cards showing all assets
**Impact:** Transparency, trust, usability

### Quick Actions
**Problem:** Users don't know what features are available
**Solution:** Visual cards with icons and descriptions
**Impact:** Discoverability, faster navigation

### Funding Guide
**Problem:** Users don't know how to get cryptocurrency
**Solution:** Step-by-step instructions with exchange links
**Impact:** Reduces friction, actionable guidance

### Recent Transactions
**Problem:** Users want proof their transactions worked
**Solution:** Live list with explorer links
**Impact:** Trust, transparency, verification

### Real-Time Notifications
**Problem:** Users don't know when money arrives
**Solution:** Instant toast notifications
**Impact:** Engagement, responsiveness, user satisfaction

### Wallet Address
**Problem:** Users need their address to receive money
**Solution:** Always-visible address display
**Impact:** Convenience, reduces clicks

---

## User Journey Example

1. **New User Logs In**
   - Sees onboarding tutorial
   - Learns about StellarRemit in 5 steps
   - Clicks "Get Started"

2. **Creates Wallet**
   - Sees "Create Your Stellar Wallet" card
   - Clicks "Create New Wallet"
   - Wallet generated in 2 seconds
   - Dashboard refreshes automatically

3. **Funds Wallet**
   - Reads funding guide
   - Clicks Coinbase link
   - Buys 10 XLM
   - Copies wallet address from bottom card
   - Withdraws from Coinbase to wallet

4. **Sees Balance Update**
   - Balance card updates from 0 to 10 XLM
   - Toast notification: "Received 10 XLM"
   - Recent transactions shows incoming payment
   - Clicks explorer link to verify on blockchain

5. **Sends First Payment**
   - Clicks "Send Money" quick action
   - Enters recipient address and amount
   - Confirms transaction
   - Returns to dashboard
   - Balance updates automatically
   - Recent transactions shows outgoing payment

---

## Design Decisions

### Why Cards?
- Visual separation of different information types
- Modern, clean aesthetic
- Easy to scan and understand
- Responsive (stack on mobile, grid on desktop)

### Why Icons?
- Universal language (no translation needed)
- Faster recognition than text
- Makes UI more engaging
- Reduces cognitive load

### Why Real-Time Updates?
- Blockchain transactions are fast (3-5 seconds)
- Users expect instant feedback in 2024
- Reduces confusion and support questions
- Creates "wow" moment for new users

### Why Onboarding Tutorial?
- Blockchain is complex for non-technical users
- First impression matters for retention
- Reduces learning curve
- Shows value proposition immediately

### Why Network Warning?
- Testnet vs mainnet confusion is common
- Prevents expensive mistakes
- Required for hackathon (must use testnet)
- Professional apps always show network status

---

## Summary

The Dashboard is designed to be:
- **Informative**: Shows all critical information at a glance
- **Actionable**: Quick links to common tasks
- **Educational**: Guides new users through setup
- **Responsive**: Real-time updates and notifications
- **Safe**: Clear network warnings prevent mistakes
- **Professional**: Clean design, proper error handling

Every feature exists to solve a real user problem and improve the experience of using blockchain technology for cross-border payments.
