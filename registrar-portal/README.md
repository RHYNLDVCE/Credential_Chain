# MSU-TCTO Academic Credential Verification System (ERC-5192)
## Unified Full-Stack Next.js Registrar Portal

A unified full-stack Next.js application (App Router) integrating the **Registrar Intranet Portal**, cryptographic tokenization engine, and decentralized verification protocols for Mindanao State University - Tawi-Tawi College of Technology and Oceanography (MSU-TCTO).

---

### Architecture Overview

- **Frontend & Backend in One**: Built on Next.js 16 (App Router) using Vanilla CSS for UI styling and Native Route Handlers (`src/app/api/`) for all backend operations.
- **Relational Database**: PostgreSQL with **Prisma ORM** for ACID transactions, token indexing, student records, cohort management, and institutional audit logging.
- **Smart Contract Layer**: ERC-5192 Minimal Soulbound Token standard on EVM Layer-2 (`AcademicCredentialSBT.sol`) at `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
- **Decentralized Storage**: IPFS metadata and certificate payload pin management (local gateway or Pinata).
- **Four-Stage Zero-Trust Verification**:
  1. *Stage 1*: Deterministic JSON Schema Canonicalization & SHA-256 Hashing.
  2. *Stage 2*: IPFS Decentralized Content Addressing & CID resolution.
  3. *Stage 3*: Smart Contract State Query (`locked(tokenId)`, `ownerOf(tokenId)`, `getCredential(tokenId)`).
  4. *Stage 4*: Cryptographic Parity Check (`localDocHash == onChainDocHash && claimedStudent == tokenOwner`).

---

### Quick Start

```bash
# Navigate to the portal
cd registrar-portal

# Install dependencies (already installed)
npm install

# Push database schema to PostgreSQL
npx prisma db push

# Run the unified development server
npm run dev
```

The application provides two completely separated access layers:
- **Public Verification Portal**: [`http://localhost:3000`](http://localhost:3000) or [`http://localhost:3000/verify`](http://localhost:3000/verify) (Completely open to the public; zero buttons/links to registrar portal).
- **Restricted Registrar Intranet**: [`http://localhost:3000/registrar`](http://localhost:3000/registrar) (Hard password gate; restricted to authorized university staff).

---

### Default Credentials

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Chief Registrar** | `registrar@msu.edu.ph` | `registrar123` | Single Issuance, Batch Cohort Import, Revocation, Key Recovery, Registry Management |
| **System Admin** | `admin@msu.edu.ph` | `admin123` | Institutional Settings, User Administration, Full RBAC Control |
| **Registrar Officer** | `officer@msu.edu.ph` | `officer123` | Single Issuance, Registry Browsing |

---

### Key Portal Features

1. **Intranet Overview**: Live real-time statistics (On-chain Active, Revoked, Registered in PostgreSQL, Gas Metrics, and RPC health).
2. **Single Credential Issuance**:
   - Live canonical JSON schema generator and SHA-256 hash calculator.
   - Optional file upload (PDF/Degree certificate) with IPFS CID binding.
   - Nonce-queued on-chain minting (`safeMintCredential`).
3. **Batch Cohort Import**:
   - Drag-and-drop CSV or JSON upload.
   - Table validation with schema compliance checks.
   - One-click atomic batch issuance.
4. **Credential Registry**:
   - Searchable, filterable student records.
   - Detailed 360° modal with on-chain metadata, student address, IPFS CID, and status.
   - Instant QR Code generator for physical verification.
   - Cryptographic Revocation with audit reason.
   - Student Key Recovery for lost or compromised private keys.
5. **Zero-Trust Verifier**:
   - Instant verification by Token ID.
   - Document hash matching with cryptographic parity breakdown.
   - Direct file upload verification.
6. **Institutional Audit Trail**:
   - Complete tamper-evident log of all issuance, revocation, and recovery events.

---

### API Route Endpoints

- **Auth**: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/register`, `GET /api/auth/users`
- **Credentials**:
  - `GET /api/credentials` (List with filters)
  - `POST /api/credentials/issue` (Single issuance with multipart support)
  - `POST /api/credentials/batch` (Batch array issuance)
  - `POST /api/credentials/revoke` (Revoke token with reason)
  - `POST /api/credentials/recover` (Key recovery & token transfer)
  - `GET /api/credentials/[tokenId]` (Detailed view)
  - `GET /api/credentials/[tokenId]/qr` (Data URL & SVG QR codes)
  - `GET /api/credentials/[tokenId]/audit` (Token-specific history)
- **Cohorts**:
  - `GET /api/cohorts` (Cohort list)
  - `POST /api/cohorts/preview` (CSV/JSON roster parser & validator)
  - `POST /api/cohorts/issue` (Issue approved roster)
- **Verification (Public)**:
  - `GET /api/verify/[tokenId]` (Status check)
  - `POST /api/verify/token` (4-stage zero-trust verification)
  - `POST /api/verify/hash` (Hash lookup)
  - `POST /api/verify/document` (File verification)
- **System**:
  - `GET /api/system/health` (RPC, DB, and contract health status)
  - `GET /api/system/stats` (On-chain and PostgreSQL metrics)
  - `GET /api/system/audit-logs` (System audit trail)
  - `GET /api/ipfs/[cid]` (Decentralized storage gateway)
