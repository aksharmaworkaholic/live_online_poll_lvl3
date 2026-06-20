# LivePoll

LivePoll is a complete mini decentralized application (dApp) built on **Stellar** and **Soroban**. It is a multi-wallet polling platform powered by a deployed Soroban smart contract on the Stellar Testnet. The application supports real-time contract event synchronization, transaction status tracking, local caching, and includes an automated test suite.

---

# Level 3 Submission Checklist

* **Live Demo:** https://live-online-poll-lvl3.vercel.app/
* **GitHub Repository:** https://github.com/aksharmaworkaholic/live_online_poll_lvl3
* **Demo Video:** https://drive.google.com/file/d/1diNyfslOOsMQaZJkjMzTTKtNmENviFJL/view?usp=sharing
* **Complete Documentation (README):** ✅ Included below
* **10+ Meaningful Git Commits:** ✅ Completed
* **Screenshots (Responsive UI, CI/CD, Tests):** ✅ Included below
* **Deployed Contract Address:** ✅ Provided below
* **Verified Contract Transaction Hash:** ✅ Provided below
* **Smart Contract Source Verification:** ✅ Provided below

---

# Project Highlights

The project demonstrates the following concepts:

* Integration of multiple Stellar wallets using `StellarWalletsKit`
* Deployment of a Soroban smart contract on Stellar Testnet
* Frontend interaction with smart contract read/write operations
* Automatic synchronization of contract events in real time
* Transaction progress indicators and user feedback
* Robust wallet error handling
* Loading states during blockchain operations
* Local caching using `localStorage`
* Automated testing of helper utilities

---

# Features

### ➡️ Multi-Wallet Support

Compatible with:

* Freighter
* xBull
* Albedo
* Rabet
* Lobstr
* Hana
* Hot Wallet
* Klever

### ➡️ Poll Management

Users can:

* Create polls
* Vote on polls
* Close polls
* Delete polls

### ➡️ Read-Only Access

Poll data can be viewed without connecting a wallet.

### ➡️ Transaction Lifecycle Tracking

The application displays the following transaction states:

* `preparing`
* `awaiting-signature`
* `pending`
* `success`
* `error`

### ➡️ Real-Time Updates

The frontend automatically refreshes poll information by monitoring recent on-chain events.

---

# Screenshots

## 🏠 Home Page

![Screenshot 2026-06-20 143531.png](Screenshot%202026-06-20%20143531.png)

## 📝 Create Poll

![Screenshot 2026-06-20 143605.png](Screenshot%202026-06-20%20143605.png)
## 🗳️ Voting Interface

![Screenshot 2026-06-20 143623.png](Screenshot%202026-06-20%20143623.png)
## ⚙️ CI/CD Pipeline

![Screenshot 2026-06-20 143641.png](Screenshot%202026-06-20%20143641.png)
---

# Mobile Responsive Design

The screenshot below demonstrates the application's responsiveness on mobile devices.

---![WhatsApp Image 2026-06-20 at 15.12.08.jpeg](WhatsApp%20Image%202026-06-20%20at%2015.12.08.jpeg)

# Smart Contract Deployment

* **Network:** Stellar Testnet
* **Contract Address:** `CDOK7FLLXPHGZUH4DNRPJXSJFUFSJ4C2MQOM4LC2GDDLVMV6N52JYRR3`
* **Explorer Link:** https://stellar.expert/explorer/testnet/contract/CDOK7FLLXPHGZUH4DNRPJXSJFUFSJ4C2MQOM4LC2GDDLVMV6N52JYRR3

---

# Contract Transaction Verification

### ➡️ Deployment Transaction

* **Transaction Hash:** `46590eb8774c8b604fddf776d2d2e114b107718c5c781d96b3a409dd47bbe332`
* **Explorer:** https://stellar.expert/explorer/testnet/tx/46590eb8774c8b604fddf776d2d2e114b107718c5c781d96b3a409dd47bbe332

### ➡️ Sample `create_poll` Transaction

* **Transaction Hash:** `54040b1a9784388034c9fcfb0209beaed20a0402a5cdb68115960f8ae0748daa`
* **Explorer:** https://stellar.expert/explorer/testnet/tx/54040b1a9784388034c9fcfb0209beaed20a0402a5cdb68115960f8ae0748daa

---

# Smart Contract Source Verification

The custom contract logic and compiled WASM can be verified using the resources below:

* **Source Code:** [poll_contract/src/lib.rs](./poll_contract/src/lib.rs)
* **Compiled WASM:** [public/contracts/poll_contract.wasm](./public/contracts/poll_contract.wasm)

---

# Live Demo

➡️  https://live-online-poll-lvl3.vercel.app/

---

# Local Setup

Run all commands from the project's root directory.

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Soroban Contract

```bash
npm run contract:build
```

### 3. Synchronize the WASM File

```bash
npm run wasm:sync
```

### 4. Create Environment File (Optional)

```powershell
Copy-Item .env.example .env.local
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Create Production Build

```bash
npm run build
```

---

# Running Tests

Execute the automated test suite:

```bash
npm test
```

---

# Environment Variables

```env
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_STELLAR_CONTRACT_ID=CDOK7FLLXPHGZUH4DNRPJXSJFUFSJ4C2MQOM4LC2GDDLVMV6N52JYRR3
VITE_STELLAR_READ_ACCOUNT=
VITE_STELLAR_EXPLORER_URL=https://stellar.expert/explorer/testnet
VITE_POLL_CONTRACT_WASM_URL=/contracts/poll_contract.wasm
```

---

# Testnet Information

* Wallets must have testnet funds before sending contract transactions.
* New wallets can be funded using Friendbot.
* Poll data can still be viewed without a funded wallet through the temporary read account.

---

# Available Scripts

| Command                   | Description                                  |
| ------------------------- | -------------------------------------------- |
| `npm run dev`             | Starts the development server                |
| `npm run build`           | Creates a production build                   |
| `npm run lint`            | Runs ESLint                                  |
| `npm test`                | Executes the test suite                      |
| `npm run contract:build`  | Builds the Soroban contract                  |
| `npm run wasm:sync`       | Copies the WASM file into `public/contracts` |
| `npm run contract:deploy` | Deploys the contract to Stellar Testnet      |

---

# Deployment Guide (Vercel / Netlify)

This application uses a standard Vite deployment process.

* **Node Version:** `^20.19.0` or `>=22.12.0`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* Configure the environment variables shown above before deployment.

---

# Demo Video

➡️ https://drive.google.com/file/d/1diNyfslOOsMQaZJkjMzTTKtNmENviFJL/view?usp=sharing

### Demonstration Flow

1. Open the deployed application.
2. Show contract data being fetched.
3. Connect a supported wallet.
4. Create a new poll.
5. Vote on a poll and display event updates.
6. Open the transaction and contract links on Stellar Expert.

---

# Project Structure

```text
src/                      → React frontend
src/lib/stellar.js        → Wallet, RPC, and contract helpers
src/lib/pollCache.js      → Local cache utilities
src/lib/pollLogic.js      → Pure business logic helpers
poll_contract/            → Soroban smart contract
scripts/                  → Deployment scripts
tests/                    → Automated test suite
```

---

# Additional Documentation

* Frontend Documentation: [FRONTEND.md](./FRONTEND.md)
* Contract Documentation: [poll_contract/README.md](./poll_contract/README.md)

---

# Submission Notes

* Includes multiple meaningful commits.
* Smart contract is deployed and integrated with the frontend.
* Implements real-time event synchronization and transaction tracking.
* All required submission artifacts, screenshots, and verification links have been included.
