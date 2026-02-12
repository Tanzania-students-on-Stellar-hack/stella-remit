

# Cross-Border Student Remittance Platform

A professional banking-style web application where students can send and receive money across borders using the Stellar blockchain testnet.

---

## 🏗️ Architecture

- **Frontend:** React with professional banking UI (clean typography, formal colors, structured layouts)
- **Backend:** Supabase for authentication, user profiles, and transaction history database
- **Blockchain:** Stellar JavaScript SDK for testnet wallet operations, payments, and asset management
- **Edge Functions:** Supabase Edge Functions for server-side Stellar key management and sensitive operations

---

## 📄 Pages & Features

### 1. **Landing Page**
- Professional banking hero section explaining the platform
- Key benefits: instant transfers, low fees, stablecoin support
- Call-to-action buttons for Sign Up / Login

### 2. **Authentication (Supabase Auth)**
- Email/password registration and login
- On signup: automatically create a Stellar testnet account (keypair generated server-side via Edge Function)
- User profile stored in database with encrypted Stellar public key
- Private keys stored securely in Supabase secrets/vault per user

### 3. **Dashboard**
- Account overview: XLM balance, stablecoin balance
- Recent transactions summary
- Quick action buttons: Send, Receive, Convert
- Real-time balance refresh from Stellar testnet

### 4. **Send Money**
- Form to enter recipient (by email/username or Stellar public address)
- Amount input with asset selection (XLM or test stablecoin)
- Transaction memo field (e.g., "Tuition payment")
- Confirmation screen showing fees and details before submitting
- Success screen with transaction hash and link to Stellar explorer

### 5. **Receive Money**
- Display user's Stellar public address with copy button and QR code
- Option to share address via link
- Fund account button (Stellar testnet friendbot for demo)

### 6. **Transaction History**
- Full list of sent/received transactions
- Each entry shows: date, amount, asset, sender/receiver, status, and transaction hash
- Click to view details on Stellar testnet explorer
- Filter by sent/received and date range

### 7. **Asset Conversion**
- Convert between XLM and a test stablecoin (e.g., test USDC)
- Simple swap interface showing conversion rate
- Transaction confirmation and history entry

### 8. **Escrow (Smart Contract Feature)**
- Create an escrow: hold funds until recipient confirms receipt
- Escrow dashboard showing active, completed, and expired escrows
- Release or dispute functionality
- Implemented using Stellar's built-in escrow capabilities (multi-sig accounts with time bounds)

---

## 🗄️ Database (Supabase)

- **profiles** – user ID, display name, email, Stellar public key, created date
- **transactions** – sender, receiver, amount, asset, memo, Stellar tx hash, status, timestamp
- **escrows** – creator, recipient, amount, asset, status (pending/released/expired), deadline, tx hashes

---

## 🔐 Security

- Stellar secret keys handled only in Edge Functions (never exposed to frontend)
- Input validation with Zod on all forms
- Row-Level Security on all database tables
- Rate limiting on payment operations

---

## 🎨 Design

- Professional banking aesthetic: navy/dark blue primary colors, white backgrounds, formal typography
- Clean card-based layouts for accounts and transactions
- Status indicators (green for success, amber for pending, red for failed)
- Responsive design for mobile and desktop
- Professional iconography (Lucide icons)

