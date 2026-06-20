# LivePoll

LivePoll is a complete mini decentralized application (dApp) built on **Stellar** and **Soroban**. It is a multi-wallet polling platform powered by a deployed Soroban smart contract on the Stellar Testnet. The application supports real-time contract event synchronization, transaction status tracking, local caching, and includes an automated test suite.

---

# Level 3 Submission Checklist

* **Live Demo:** https://online-live-poll-liard.vercel.app/
* **GitHub Repository:** https://github.com/AYUSHKRSHARMA4986/online-live-poll-lvl3
* **Demo Video:** https://drive.google.com/file/d/1SR8RxqQMYTR2mG-opvBFGaUaCffiQFiw/view?usp=sharing
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

![Screenshot 2026-06-18 115214.png](tempo_ss/Screenshot%202026-06-18%20115214.png)

## 📝 Create Poll

![Screenshot 2026-06-18 115544.png](tempo_ss/Screenshot%202026-06-18%20115544.png)

## 🗳️ Voting Interface

![Screenshot 2026-06-18 120110.png](tempo_ss/Screenshot%202026-06-18%20120110.png)

## ⚙️ CI/CD Pipeline

![Screenshot 2026-06-18 210708.png](tempo_ss/Screenshot%202026-06-18%20210708.png)

---

# Mobile Responsive Design

The screenshot below demonstrates the application's responsiveness on mobile devices.

![Screenshot\_20260618\_215951\_Chrome.jpg](tempo_ss/Screenshot_20260618_215951_Chrome.jpg)

---

# Smart Contract Deployment

* **Network:** Stellar Testnet
* **Contract Address:** `CBT5GCDC2ZGBVPBOOLHI6DB5UDMX33XBQMOUQAEOJNE3I5I3DCVJKOD4`
* **Explorer Link:** https://stellar.expert/explorer/testnet/contract/CBT5GCDC2ZGBVPBOOLHI6DB5UDMX33XBQMOUQAEOJNE3I5I3DCVJKOD4

---

# Contract Transaction Verification

### ➡️ Deployment Transaction

* **Transaction Hash:** `9cc1509985bdd889c47f02e0cf5b29b39a4be3c61d363a60e841ffa3b8a10c62`
* **Explorer:** https://stellar.expert/explorer/testnet/tx/9cc1509985bdd889c47f02e0cf5b29b39a4be3c61d363a60e841ffa3b8a10c62

### ➡️ Sample `create_poll` Transaction

* **Transaction Hash:** `1fd899d9a98e7b262ec7ed357add3d65e7470808d2c715bcb73a94b0b6c69e2d`
* **Explorer:** https://stellar.expert/explorer/testnet/tx/1fd899d9a98e7b262ec7ed357add3d65e7470808d2c715bcb73a94b0b6c69e2d

---

# Smart Contract Source Verification

The custom contract logic and compiled WASM can be verified using the resources below:

* **Source Code:** [poll_contract/src/lib.rs](./poll_contract/src/lib.rs)
* **Compiled WASM:** [public/contracts/poll_contract.wasm](./public/contracts/poll_contract.wasm)

---

# Live Demo

➡️ https://online-live-poll-liard.vercel.app/

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
VITE_STELLAR_CONTRACT_ID=CBT5GCDC2ZGBVPBOOLHI6DB5UDMX33XBQMOUQAEOJNE3I5I3DCVJKOD4
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

➡️ https://drive.google.com/file/d/1SR8RxqQMYTR2mG-opvBFGaUaCffiQFiw/view?usp=sharing

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
