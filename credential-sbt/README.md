# MSU-TCTO Academic Credential Verification System (ERC-5192)

An immutable, zero-trust academic credential verification system utilizing Soulbound Tokens (ERC-5192) and decentralized content-addressed storage (IPFS), developed in accordance with research from the **Department of Information Technology, Mindanao State University - Tawi-Tawi College of Technology and Oceanography (MSU-TCTO)**.

---

## 🏛️ System Architecture

The ecosystem eliminates credential fraud, reduces verification latency to sub-second speeds, and preserves strict statutory privacy compliance (GDPR and Philippine RA 10173 - Data Privacy Act of 2012) via a **dual-layer architecture**:

```
Off-Chain Canonical Document (D) -> SHA-256 Digest (docHash) + Encrypted Payload -> IPFS (CID)
                                             │                                         │
                                             ▼                                         ▼
                                ┌──────────────────────────────────────────────────────────┐
                                │             AcademicCredentialSBT (EVM L2)              │
                                │  - Non-transferable Soulbound Token (ERC-5192)           │
                                │  - Role-Based Access Control (REGISTRAR_ROLE)            │
                                │  - Immutable On-Chain Hash Registry (docHash -> tokenId) │
                                │  - Administrative Revocation Registry (audit trails)     │
                                │  - Zero-Trust Client Verification Hook (verifyCredential)│
                                │  - Sovereign Identity Key Recovery (Emergency Migration) │
                                └──────────────────────────────────────────────────────────┘
```

---

## 📋 Requirements Mapping

| Specification | Description | Smart Contract Implementation |
|---|---|---|
| **FR-1** | **Role-Based Access Control (RBAC)** | OpenZeppelin `AccessControl` enforcing `DEFAULT_ADMIN_ROLE` (governance / Gnosis Safe) and `REGISTRAR_ROLE` for minting, revoking, and key recovery. |
| **FR-2** | **Irrevocable Soulbound Constraints** | Conforms to `IERC5192`. Invariant checks lock tokens upon minting. `transferFrom`, `safeTransferFrom`, `approve`, and `setApprovalForAll` revert unconditionally. |
| **FR-3** | **Decentralized Metadata Pinning** | Anchors one-way SHA-256 document digests (`docHash`) and IPFS Content Identifiers (`ipfsCID`). Prevents duplicate document registration. |
| **FR-4** | **Administrative Revocation Registry** | `revokeCredential(uint256 tokenId, string reason)` sets an immutable revocation state and logs audit events with registrar attribution. |
| **FR-5** | **Wallet-Free Client Verification** | `verifyCredential` and `verifyCredentialByHash` perform deterministic zero-trust checks via read-only JSON-RPC queries without requiring Web3 wallets or gas fees. |
| **FR-6** | **Student Key Recovery** | `recoverCredential(uint256 tokenId, address newStudentAddress, string reason)` allows multi-sig registrar migration to a newly generated student address upon verified private key loss. |

---

## 🔍 Cryptographic Verification Invariant (Stage 4)

A credential presented by a candidate is valid **if and only if**:

$$\text{localHash} = \text{docHash} \quad \land \quad \neg \text{isRevoked} \quad \land \quad \text{ownerOf}(\text{tokenId}) = \text{claimedStudent}$$

---

## 🚀 Quickstart & Usage

### 1. Build Contracts
```bash
forge build
```

### 2. Extract ABI
```bash
# Export JSON ABIs to the abi/ directory
mkdir -p abi
forge inspect AcademicCredentialSBT abi --json > abi/AcademicCredentialSBT.json
forge inspect IAcademicCredentialSBT abi --json > abi/IAcademicCredentialSBT.json
```

### 3. Run Test Suite (33/33 Tests Passing)
```bash
forge test -vvv
```

### 4. Generate Gas Snapshots
```bash
forge snapshot
```

### 5. Spin Up Local Anvil Node & Deploy
```bash
# 1. Start local node
anvil

# 2. Deploy AcademicCredentialSBT
ADMIN_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
REGISTRAR_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
forge script script/DeployAcademicCredentialSBT.s.sol:DeployAcademicCredentialSBT \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# 3. Test verification via Cast
cast call <DEPLOYED_ADDRESS> "verifyCredential(uint256,bytes32,address)(bool,uint8,(bytes32,string,uint256,uint256,bool,string))" \
  1 <DOC_HASH> <STUDENT_ADDRESS> --rpc-url http://127.0.0.1:8545
```

### 6. Deploy to EVM Layer-2 (Base, Polygon, Arbitrum, Optimism)
```bash
forge script script/DeployAcademicCredentialSBT.s.sol:DeployAcademicCredentialSBT \
  --rpc-url <RPC_URL> \
  --broadcast \
  --verify
```

Configurable deployment environment variables:
- `ADMIN_ADDRESS`: Multisig or governance administrator address.
- `REGISTRAR_ADDRESS`: Institutional registrar wallet address.
- `METADATA_BASE_URI`: Metadata gateway URI (defaults to `ipfs://`).

---

## 📂 Contract Artifacts

- [`src/IERC5192.sol`](file:///home/rhyn/ITE183/credential-sbt/src/IERC5192.sol): Minimal Soulbound NFT interface standard (EIP-5192).
- [`src/IAcademicCredentialSBT.sol`](file:///home/rhyn/ITE183/credential-sbt/src/IAcademicCredentialSBT.sol): Credential management, diagnostic status enums, structs, and verification interface.
- [`src/AcademicCredentialSBT.sol`](file:///home/rhyn/ITE183/credential-sbt/src/AcademicCredentialSBT.sol): Core Soulbound smart contract with RBAC, non-transferability, and verification logic.
- [`abi/AcademicCredentialSBT.json`](file:///home/rhyn/ITE183/credential-sbt/abi/AcademicCredentialSBT.json): Full JSON ABI for the deployed contract (72 items).
- [`abi/IAcademicCredentialSBT.json`](file:///home/rhyn/ITE183/credential-sbt/abi/IAcademicCredentialSBT.json): Clean interface JSON ABI for client integrations (35 items).
- [`test/AcademicCredentialSBT.t.sol`](file:///home/rhyn/ITE183/credential-sbt/test/AcademicCredentialSBT.t.sol): Complete unit and integration test coverage for all functional requirements.
- [`script/DeployAcademicCredentialSBT.s.sol`](file:///home/rhyn/ITE183/credential-sbt/script/DeployAcademicCredentialSBT.s.sol): Automated deployment script.
