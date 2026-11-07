// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC5192} from "./IERC5192.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

/// @title IAcademicCredentialSBT
/// @author Department of Information Technology, Mindanao State University - Tawi-Tawi College of Technology and Oceanography
/// @notice Interface for an immutable, zero-trust academic credential verification system using Soulbound Tokens (ERC-5192)
/// @dev Conforms to ERC-5192, ERC-721, ERC-165, and OpenZeppelin AccessControl specifications
interface IAcademicCredentialSBT is IERC5192 {
    /// @notice Diagnostic verification states for zero-trust verifiers
    enum VerificationStatus {
        Valid, // Hash matches, active (not revoked), and owned by claimed student
        InvalidHash, // Document hash does not match immutable on-chain record
        Revoked, // Credential was administratively revoked
        IncorrectOwner, // Token is not owned by the claimed student address
        TokenDoesNotExist // Specified token ID does not exist on-chain
    }

    /// @notice On-chain credential record anchoring off-chain cryptographic proofs
    /// @param docHash One-way SHA-256 cryptographic digest of canonicalized metadata JSON and diploma file
    /// @param ipfsCID Content Identifier (CID) referencing encrypted document package on decentralized IPFS cluster
    /// @param issuedAt Block timestamp of credential issuance
    /// @param revokedAt Block timestamp of revocation (0 if actively valid)
    /// @param isRevoked Flag indicating whether the credential has been administratively revoked
    /// @param revocationReason Documented justification if revoked
    struct CredentialRecord {
        bytes32 docHash;
        string ipfsCID;
        uint256 issuedAt;
        uint256 revokedAt;
        bool isRevoked;
        string revocationReason;
    }

    // ==========================================
    //                   EVENTS
    // ==========================================

    /// @notice Emitted when a new academic credential Soulbound Token is minted
    event CredentialIssued(
        uint256 indexed tokenId, address indexed student, bytes32 indexed docHash, string ipfsCID, uint256 timestamp
    );

    /// @notice Emitted when a credential is administratively revoked by an authorized registrar
    event CredentialRevoked(uint256 indexed tokenId, address indexed revokedBy, string reason, uint256 timestamp);

    /// @notice Emitted when student identity key recovery migrates token ownership to a new sovereign address
    event CredentialRecovered(
        uint256 indexed tokenId,
        address indexed previousAddress,
        address indexed newAddress,
        string reason,
        uint256 timestamp
    );

    /// @notice Emitted when base metadata gateway URI is updated by contract administration
    event BaseURIUpdated(string oldBaseURI, string newBaseURI);

    // ==========================================
    //                CUSTOM ERRORS
    // ==========================================

    error ZeroAddressAdmin();
    error ZeroAddressRecipient();
    error ZeroAddressRecovery();
    error InvalidDocumentHash();
    error EmptyIpfsCID();
    error DocumentHashAlreadyRegistered(bytes32 docHash, uint256 existingTokenId);
    error TokenDoesNotExist(uint256 tokenId);
    error CredentialAlreadyRevoked(uint256 tokenId);
    error EmptyRevocationReason();
    error EmptyRecoveryReason();
    error RecoveryToSameAddress();
    error SoulboundTokenCannotBeTransferred();
    error SoulboundTokenCannotBeApproved();
    error SoulboundTokenCannotBeBurned();
    error BatchLengthMismatch();
    error EmptyBatch();

    // ==========================================
    //             REGISTRAR MUTATIONS
    // ==========================================

    /// @notice Issues an immutable soulbound academic credential to a graduate
    /// @param student The sovereign cryptographic address of the graduate
    /// @param docHash The SHA-256 cryptographic digest of the canonicalized academic record / diploma
    /// @param ipfsCID Content Identifier pointing to the encrypted certificate payload on IPFS
    /// @return tokenId The unique identifier assigned to the newly minted credential token
    function issueCredential(address student, bytes32 docHash, string calldata ipfsCID)
        external
        returns (uint256 tokenId);

    /// @notice Facilitates role-authenticated batch issuance of graduating cohorts
    /// @param students Array of graduate addresses
    /// @param docHashes Array of corresponding SHA-256 document digests
    /// @param ipfsCIDs Array of corresponding IPFS CIDs
    /// @return tokenIds Array of generated token IDs
    function issueCredentialBatch(address[] calldata students, bytes32[] calldata docHashes, string[] calldata ipfsCIDs)
        external
        returns (uint256[] memory tokenIds);

    /// @notice Administratively revokes a credential citing academic misconduct or administrative error
    /// @param tokenId The identifier of the credential to revoke
    /// @param reason Documented justification for revocation
    function revokeCredential(uint256 tokenId, string calldata reason) external;

    /// @notice Emergency multi-signature student identity migration upon verified private key compromise or loss
    /// @param tokenId The credential token identifier
    /// @param newStudentAddress The newly generated sovereign address of the student
    /// @param reason Documented administrative justification for the migration
    function recoverCredential(uint256 tokenId, address newStudentAddress, string calldata reason) external;

    /// @notice Updates the base URI gateway for metadata queries
    /// @param newBaseURI New gateway base URI string
    function setBaseURI(string calldata newBaseURI) external;

    // ==========================================
    //           VERIFICATION & QUERIES
    // ==========================================

    /// @notice Retrieves the full on-chain cryptographic record for a given credential token
    /// @param tokenId The identifier of the credential
    /// @return record The CredentialRecord struct
    function getCredential(uint256 tokenId) external view returns (CredentialRecord memory record);

    /// @notice Retrieves the token ID corresponding to an academic document digest
    /// @param docHash The SHA-256 document hash
    /// @return tokenId The token ID, or 0 if unregistered
    function getTokenIdByDocHash(bytes32 docHash) external view returns (uint256 tokenId);

    /// @notice Algorithmic verification of credential integrity, validity, and ownership in sub-second latency
    /// @param tokenId The token identifier
    /// @param localHash SHA-256 digest computed client-side from candidate-supplied document
    /// @param claimedStudent Sovereign address of the candidate presenting the credential
    /// @return isValid True if credential passes all zero-trust checks
    /// @return status Deterministic diagnostic status enum
    /// @return record On-chain credential data struct
    function verifyCredential(uint256 tokenId, bytes32 localHash, address claimedStudent)
        external
        view
        returns (bool isValid, VerificationStatus status, CredentialRecord memory record);

    /// @notice Algorithmic verification by document hash and claimed student address directly
    /// @param localHash SHA-256 digest computed client-side from candidate-supplied document
    /// @param claimedStudent Sovereign address of the candidate presenting the credential
    /// @return isValid True if credential passes all zero-trust checks
    /// @return tokenId The token ID associated with this document hash
    /// @return status Deterministic diagnostic status enum
    function verifyCredentialByHash(bytes32 localHash, address claimedStudent)
        external
        view
        returns (bool isValid, uint256 tokenId, VerificationStatus status);

    /// @notice Returns the total number of credentials minted since contract deployment
    function totalCredentialsIssued() external view returns (uint256);

    /// @notice Returns the total number of credentials administratively revoked
    function totalCredentialsRevoked() external view returns (uint256);

    /// @notice Returns the total number of active, non-revoked credentials
    function totalActiveCredentials() external view returns (uint256);
}
