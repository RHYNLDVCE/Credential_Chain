// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IERC5192} from "./IERC5192.sol";
import {IAcademicCredentialSBT} from "./IAcademicCredentialSBT.sol";

/// @title AcademicCredentialSBT
/// @author Department of Information Technology, Mindanao State University - Tawi-Tawi College of Technology and Oceanography (MSU-TCTO)
/// @notice Immutable, Zero-Trust Academic Credential Verification System Using Soulbound Tokens (ERC-5192)
/// @dev Implements the formal specification outlined in the MSU-TCTO Research Paper (September 2026):
///      - FR-1: Role-Based Access Control (RBAC via OpenZeppelin AccessControl)
///      - FR-2: Irrevocable Soulbound Constraints (ERC-5192 implementation)
///      - FR-3: Decentralized Metadata Pinning (SHA-256 hashes + IPFS CIDs)
///      - FR-4: Administrative Revocation Registry (Immutable status bitmap/flag & audit events)
///      - FR-5: Wallet-Free Client Verification (Sub-second zero-trust state query)
///      - FR-6: Student Identity Migration and Key Recovery (Registrar recovery routine with audit trail)
contract AcademicCredentialSBT is ERC721, AccessControl, IAcademicCredentialSBT {
    /// @notice Role identifier for institutional registrars authorized to issue, revoke, and recover credentials
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    /// @dev Internal auto-incrementing token identifier counter
    uint256 private _nextTokenId;

    /// @dev Total count of administratively revoked credentials
    uint256 private _revokedCount;

    /// @dev Base URI for decentralized metadata queries (e.g., dedicated IPFS gateway)
    string private _customBaseURI;

    /// @dev Reentrancy and emergency transit guard for student identity migration (FR-6)
    bool private _isRecovering;

    /// @dev Mapping from token ID to on-chain CredentialRecord
    mapping(uint256 => CredentialRecord) private _credentials;

    /// @dev Mapping from document SHA-256 digest to registered token ID (guarantees digest uniqueness)
    mapping(bytes32 => uint256) private _docHashToTokenId;

    /// @notice Initializes the Academic Credential Soulbound Token contract
    /// @param name_ Token collection name (e.g., "MSU-TCTO Academic Credential SBT")
    /// @param symbol_ Token collection symbol (e.g., "MSUTCTO-SBT")
    /// @param defaultAdmin Address assigned the DEFAULT_ADMIN_ROLE (institutional multi-sig / governance)
    /// @param initialRegistrar Address assigned the REGISTRAR_ROLE (can be zero address if assigned later)
    /// @param baseURI_ Optional custom IPFS gateway base URI
    constructor(
        string memory name_,
        string memory symbol_,
        address defaultAdmin,
        address initialRegistrar,
        string memory baseURI_
    ) ERC721(name_, symbol_) {
        if (defaultAdmin == address(0)) {
            revert ZeroAddressAdmin();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);

        if (initialRegistrar != address(0)) {
            _grantRole(REGISTRAR_ROLE, initialRegistrar);
        }

        _nextTokenId = 1;
        _customBaseURI = baseURI_;
    }

    // ==========================================
    //            REGISTRAR FUNCTIONS
    // ==========================================

    /// @notice Issues an immutable soulbound academic credential to a graduate (FR-3, Stage 3)
    /// @param student The sovereign cryptographic address of the graduate
    /// @param docHash The SHA-256 cryptographic digest of the canonicalized academic record / diploma
    /// @param ipfsCID Content Identifier pointing to the encrypted certificate payload on IPFS
    /// @return tokenId The unique identifier assigned to the newly minted credential token
    function issueCredential(address student, bytes32 docHash, string calldata ipfsCID)
        external
        override
        onlyRole(REGISTRAR_ROLE)
        returns (uint256 tokenId)
    {
        return _issueSingleCredential(student, docHash, ipfsCID);
    }

    /// @notice Facilitates role-authenticated batch import of graduating cohorts (Section 3.1)
    /// @param students Array of graduate addresses
    /// @param docHashes Array of corresponding SHA-256 document digests
    /// @param ipfsCIDs Array of corresponding IPFS CIDs
    /// @return tokenIds Array of generated token IDs
    function issueCredentialBatch(address[] calldata students, bytes32[] calldata docHashes, string[] calldata ipfsCIDs)
        external
        override
        onlyRole(REGISTRAR_ROLE)
        returns (uint256[] memory tokenIds)
    {
        uint256 batchSize = students.length;
        if (batchSize == 0) {
            revert EmptyBatch();
        }
        if (docHashes.length != batchSize || ipfsCIDs.length != batchSize) {
            revert BatchLengthMismatch();
        }

        tokenIds = new uint256[](batchSize);

        for (uint256 i = 0; i < batchSize;) {
            tokenIds[i] = _issueSingleCredential(students[i], docHashes[i], ipfsCIDs[i]);
            unchecked {
                ++i;
            }
        }

        return tokenIds;
    }

    /// @notice Administratively revokes a credential citing academic misconduct or administrative error (FR-4)
    /// @param tokenId The identifier of the credential to revoke
    /// @param reason Documented justification for revocation
    function revokeCredential(uint256 tokenId, string calldata reason) external override onlyRole(REGISTRAR_ROLE) {
        _requireOwned(tokenId);

        CredentialRecord storage record = _credentials[tokenId];
        if (record.isRevoked) {
            revert CredentialAlreadyRevoked(tokenId);
        }
        if (bytes(reason).length == 0) {
            revert EmptyRevocationReason();
        }

        record.isRevoked = true;
        record.revokedAt = block.timestamp;
        record.revocationReason = reason;

        unchecked {
            ++_revokedCount;
        }

        emit CredentialRevoked(tokenId, _msgSender(), reason, block.timestamp);
    }

    /// @notice Emergency student identity migration upon verified private key compromise or loss (FR-6)
    /// @param tokenId The credential token identifier
    /// @param newStudentAddress The newly generated sovereign address of the student
    /// @param reason Documented administrative justification for the migration
    function recoverCredential(uint256 tokenId, address newStudentAddress, string calldata reason)
        external
        override
        onlyRole(REGISTRAR_ROLE)
    {
        address previousOwner = _requireOwned(tokenId);

        if (newStudentAddress == address(0)) {
            revert ZeroAddressRecovery();
        }
        if (newStudentAddress == previousOwner) {
            revert RecoveryToSameAddress();
        }
        if (bytes(reason).length == 0) {
            revert EmptyRecoveryReason();
        }

        // Temporary transition window for sovereign identity migration
        _isRecovering = true;

        emit Unlocked(tokenId);
        _update(newStudentAddress, tokenId, address(0));
        emit Locked(tokenId);

        _isRecovering = false;

        emit CredentialRecovered(tokenId, previousOwner, newStudentAddress, reason, block.timestamp);
    }

    /// @notice Updates the metadata gateway base URI
    /// @param newBaseURI New gateway base URI
    function setBaseURI(string calldata newBaseURI) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldURI = _customBaseURI;
        _customBaseURI = newBaseURI;
        emit BaseURIUpdated(oldURI, newBaseURI);
    }

    // ==========================================
    //           INTERNAL ISSUANCE LOGIC
    // ==========================================

    /// @dev Internal helper executing atomic single credential issuance
    function _issueSingleCredential(address student, bytes32 docHash, string memory ipfsCID)
        internal
        returns (uint256 tokenId)
    {
        if (student == address(0)) {
            revert ZeroAddressRecipient();
        }
        if (docHash == bytes32(0)) {
            revert InvalidDocumentHash();
        }
        if (bytes(ipfsCID).length == 0) {
            revert EmptyIpfsCID();
        }

        uint256 existingTokenId = _docHashToTokenId[docHash];
        if (existingTokenId != 0) {
            revert DocumentHashAlreadyRegistered(docHash, existingTokenId);
        }

        tokenId = _nextTokenId;
        unchecked {
            ++_nextTokenId;
        }

        _credentials[tokenId] = CredentialRecord({
            docHash: docHash,
            ipfsCID: ipfsCID,
            issuedAt: block.timestamp,
            revokedAt: 0,
            isRevoked: false,
            revocationReason: ""
        });

        _docHashToTokenId[docHash] = tokenId;

        // ERC-5192: Permanently lock token upon minting
        emit Locked(tokenId);

        // Emit institutional audit event
        emit CredentialIssued(tokenId, student, docHash, ipfsCID, block.timestamp);

        // Mint token to student's sovereign address
        _safeMint(student, tokenId);

        return tokenId;
    }

    // ==========================================
    //        ERC-5192 & SOULBOUND INVARIANTS
    // ==========================================

    /// @notice Returns the locking status of a Soulbound Token (ERC-5192)
    /// @dev Tokens are permanently locked upon minting. Reverts if token does not exist.
    /// @param tokenId The identifier for an SBT.
    /// @return True if the token is locked (always true for existing credentials).
    function locked(uint256 tokenId) external view override returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    /// @notice Forbids token approval under all conditions (FR-2)
    function approve(address, uint256) public pure override {
        revert SoulboundTokenCannotBeApproved();
    }

    /// @notice Forbids operator approval for all under all conditions (FR-2)
    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundTokenCannotBeApproved();
    }

    /// @notice Forbids standard token transfers under all conditions (FR-2)
    function transferFrom(address, address, uint256) public pure override {
        revert SoulboundTokenCannotBeTransferred();
    }

    /// @notice Forbids safe token transfers under all conditions (FR-2)
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert SoulboundTokenCannotBeTransferred();
    }

    /// @dev Overridden update hook to mathematically prevent transfers and burns, except during recovery
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Standard minting occurs when from == address(0)
        if (from != address(0)) {
            // Disallow burning to preserve permanent cryptographic audit trails
            if (to == address(0)) {
                revert SoulboundTokenCannotBeBurned();
            }

            // Standard transfer attempt: forbid unless executed via authorized emergency recovery routine
            if (!_isRecovering) {
                revert SoulboundTokenCannotBeTransferred();
            }
        }

        return super._update(to, tokenId, auth);
    }

    // ==========================================
    //     VERIFICATION & READ PROCEDURES (FR-5)
    // ==========================================

    /// @notice Algorithmic verification of credential integrity, validity, and ownership (Stage 4)
    /// @dev Authenticated iff: (localHash == R.docHash) AND (!R.isRevoked) AND (ownerOf(tokenId) == studentAddress)
    /// @param tokenId The token identifier
    /// @param localHash SHA-256 digest computed client-side from candidate-supplied document
    /// @param claimedStudent Sovereign address of the candidate presenting the credential
    /// @return isValid True if credential passes all zero-trust checks
    /// @return status Deterministic diagnostic status enum
    /// @return record On-chain credential data struct
    function verifyCredential(uint256 tokenId, bytes32 localHash, address claimedStudent)
        external
        view
        override
        returns (bool isValid, VerificationStatus status, CredentialRecord memory record)
    {
        address currentOwner = _ownerOf(tokenId);
        if (currentOwner == address(0)) {
            return (false, VerificationStatus.TokenDoesNotExist, record);
        }

        record = _credentials[tokenId];

        if (record.isRevoked) {
            return (false, VerificationStatus.Revoked, record);
        }

        if (record.docHash != localHash) {
            return (false, VerificationStatus.InvalidHash, record);
        }

        if (currentOwner != claimedStudent) {
            return (false, VerificationStatus.IncorrectOwner, record);
        }

        return (true, VerificationStatus.Valid, record);
    }

    /// @notice Algorithmic verification by document hash and claimed student address directly
    /// @param localHash SHA-256 digest computed client-side from candidate-supplied document
    /// @param claimedStudent Sovereign address of the candidate presenting the credential
    /// @return isValid True if credential passes all zero-trust checks
    /// @return tokenId The token ID associated with this document hash
    /// @return status Deterministic diagnostic status enum
    function verifyCredentialByHash(bytes32 localHash, address claimedStudent)
        external
        view
        override
        returns (bool isValid, uint256 tokenId, VerificationStatus status)
    {
        tokenId = _docHashToTokenId[localHash];
        if (tokenId == 0) {
            return (false, 0, VerificationStatus.TokenDoesNotExist);
        }

        address currentOwner = _ownerOf(tokenId);
        CredentialRecord memory record = _credentials[tokenId];

        if (record.isRevoked) {
            return (false, tokenId, VerificationStatus.Revoked);
        }

        if (currentOwner != claimedStudent) {
            return (false, tokenId, VerificationStatus.IncorrectOwner);
        }

        return (true, tokenId, VerificationStatus.Valid);
    }

    /// @notice Retrieves the full on-chain cryptographic record for a given credential token
    /// @param tokenId The identifier of the credential
    /// @return record The CredentialRecord struct
    function getCredential(uint256 tokenId) external view override returns (CredentialRecord memory record) {
        _requireOwned(tokenId);
        return _credentials[tokenId];
    }

    /// @notice Retrieves the token ID corresponding to an academic document digest
    /// @param docHash The SHA-256 document hash
    /// @return tokenId The token ID, or 0 if unregistered
    function getTokenIdByDocHash(bytes32 docHash) external view override returns (uint256 tokenId) {
        return _docHashToTokenId[docHash];
    }

    /// @notice Returns the metadata URI for a given token
    /// @param tokenId The identifier of the credential
    /// @return The complete decentralized URI pointing to the token's metadata/encrypted package
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        string memory cid = _credentials[tokenId].ipfsCID;

        if (bytes(_customBaseURI).length > 0) {
            return string.concat(_customBaseURI, cid);
        }

        bytes memory cidBytes = bytes(cid);
        if (
            cidBytes.length >= 7 && cidBytes[0] == "i" && cidBytes[1] == "p" && cidBytes[2] == "f" && cidBytes[3] == "s"
                && cidBytes[4] == ":" && cidBytes[5] == "/" && cidBytes[6] == "/"
        ) {
            return cid;
        }

        return string.concat("ipfs://", cid);
    }

    /// @notice Returns the total number of credentials minted since contract deployment
    function totalCredentialsIssued() external view override returns (uint256) {
        unchecked {
            return _nextTokenId - 1;
        }
    }

    /// @notice Returns the total number of credentials administratively revoked
    function totalCredentialsRevoked() external view override returns (uint256) {
        return _revokedCount;
    }

    /// @notice Returns the total number of active, non-revoked credentials
    function totalActiveCredentials() external view override returns (uint256) {
        unchecked {
            return (_nextTokenId - 1) - _revokedCount;
        }
    }

    // ==========================================
    //           INTERFACE INTROSPECTION
    // ==========================================

    /// @dev ERC-165 support for ERC-5192, IAcademicCredentialSBT, ERC-721, and AccessControl
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return interfaceId == type(IERC5192).interfaceId || interfaceId == type(IAcademicCredentialSBT).interfaceId
            || super.supportsInterface(interfaceId);
    }
}
