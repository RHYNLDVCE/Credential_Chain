// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {AcademicCredentialSBT} from "../src/AcademicCredentialSBT.sol";
import {IAcademicCredentialSBT} from "../src/IAcademicCredentialSBT.sol";
import {IERC5192} from "../src/IERC5192.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title AcademicCredentialSBTTest
/// @notice Comprehensive unit and integration test suite validating FR-1 through FR-6
contract AcademicCredentialSBTTest is Test {
    AcademicCredentialSBT public credentialContract;

    address public admin = makeAddr("admin");
    address public registrar = makeAddr("registrar");
    address public student1 = makeAddr("student1");
    address public student2 = makeAddr("student2");
    address public imposter = makeAddr("imposter");
    address public newStudent1Key = makeAddr("newStudent1Key");

    bytes32 public docHash1 = keccak256(abi.encodePacked("MSU-TCTO-BSIT-2026-001"));
    bytes32 public docHash2 = keccak256(abi.encodePacked("MSU-TCTO-BSIT-2026-002"));
    string public ipfsCID1 = "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";
    string public ipfsCID2 = "bafybeicg2ggvjshv6s33g73n4a5mwyox4mfs37b5z4u5c2g5q6z7x8y9za";

    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    event CredentialIssued(
        uint256 indexed tokenId, address indexed student, bytes32 indexed docHash, string ipfsCID, uint256 timestamp
    );
    event CredentialRevoked(uint256 indexed tokenId, address indexed revokedBy, string reason, uint256 timestamp);
    event CredentialRecovered(
        uint256 indexed tokenId,
        address indexed previousAddress,
        address indexed newAddress,
        string reason,
        uint256 timestamp
    );

    function setUp() public {
        vm.prank(admin);
        credentialContract =
            new AcademicCredentialSBT("MSU-TCTO Academic Credential SBT", "MSUTCTO-SBT", admin, registrar, "ipfs://");
    }

    // ==========================================
    //            INITIAL STATE TESTS
    // ==========================================

    function test_InitialDeploymentState() public view {
        assertEq(credentialContract.name(), "MSU-TCTO Academic Credential SBT");
        assertEq(credentialContract.symbol(), "MSUTCTO-SBT");
        assertTrue(credentialContract.hasRole(credentialContract.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(credentialContract.hasRole(credentialContract.REGISTRAR_ROLE(), registrar));
        assertFalse(credentialContract.hasRole(credentialContract.REGISTRAR_ROLE(), imposter));
        assertEq(credentialContract.totalCredentialsIssued(), 0);
        assertEq(credentialContract.totalCredentialsRevoked(), 0);
        assertEq(credentialContract.totalActiveCredentials(), 0);
    }

    function test_RevertIfAdminZeroAddress() public {
        vm.expectRevert(IAcademicCredentialSBT.ZeroAddressAdmin.selector);
        new AcademicCredentialSBT("Test", "TST", address(0), registrar, "");
    }

    // ==========================================
    //       FR-1: ROLE-BASED ACCESS CONTROL
    // ==========================================

    function test_NonRegistrarCannotIssueCredential() public {
        vm.prank(imposter);
        vm.expectRevert();
        credentialContract.issueCredential(student1, docHash1, ipfsCID1);
    }

    function test_NonRegistrarCannotRevokeCredential() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(imposter);
        vm.expectRevert();
        credentialContract.revokeCredential(tokenId, "Disciplinary sanction");
    }

    function test_NonRegistrarCannotRecoverCredential() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(imposter);
        vm.expectRevert();
        credentialContract.recoverCredential(tokenId, newStudent1Key, "Key lost");
    }

    function test_AdminCanGrantAndRevokeRegistrarRole() public {
        address newRegistrar = makeAddr("newRegistrar");
        bytes32 registrarRole = credentialContract.REGISTRAR_ROLE();

        assertFalse(credentialContract.hasRole(registrarRole, newRegistrar));

        vm.prank(admin);
        credentialContract.grantRole(registrarRole, newRegistrar);
        assertTrue(credentialContract.hasRole(registrarRole, newRegistrar));

        // Now new registrar can issue
        vm.prank(newRegistrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);
        assertEq(tokenId, 1);

        // Revoke role
        vm.prank(admin);
        credentialContract.revokeRole(registrarRole, newRegistrar);
        assertFalse(credentialContract.hasRole(registrarRole, newRegistrar));

        vm.prank(newRegistrar);
        vm.expectRevert();
        credentialContract.issueCredential(student2, docHash2, ipfsCID2);
    }

    // ==========================================
    //   FR-2: IRREVOCABLE SOULBOUND CONSTRAINTS
    // ==========================================

    function test_LockedStatusReturnsTrueForExistingToken() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        assertTrue(credentialContract.locked(tokenId));
    }

    function test_LockedRevertsForNonExistentToken() public {
        vm.expectRevert();
        credentialContract.locked(999);
    }

    function test_ApproveAlwaysReverts() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(student1);
        vm.expectRevert(IAcademicCredentialSBT.SoulboundTokenCannotBeApproved.selector);
        credentialContract.approve(imposter, tokenId);
    }

    function test_SetApprovalForAllAlwaysReverts() public {
        vm.prank(student1);
        vm.expectRevert(IAcademicCredentialSBT.SoulboundTokenCannotBeApproved.selector);
        credentialContract.setApprovalForAll(imposter, true);
    }

    function test_TransferFromAlwaysReverts() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(student1);
        vm.expectRevert(IAcademicCredentialSBT.SoulboundTokenCannotBeTransferred.selector);
        credentialContract.transferFrom(student1, imposter, tokenId);
    }

    function test_SafeTransferFromAlwaysReverts() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(student1);
        vm.expectRevert(IAcademicCredentialSBT.SoulboundTokenCannotBeTransferred.selector);
        credentialContract.safeTransferFrom(student1, imposter, tokenId);

        vm.prank(student1);
        vm.expectRevert(IAcademicCredentialSBT.SoulboundTokenCannotBeTransferred.selector);
        credentialContract.safeTransferFrom(student1, imposter, tokenId, "");
    }

    function test_SupportsInterfaceERC5192() public view {
        // ERC-5192 interfaceId is 0xb45a3c0e
        assertTrue(credentialContract.supportsInterface(0xb45a3c0e));
        assertTrue(credentialContract.supportsInterface(type(IERC5192).interfaceId));
        assertTrue(credentialContract.supportsInterface(type(IAcademicCredentialSBT).interfaceId));
        assertTrue(credentialContract.supportsInterface(type(IERC721).interfaceId));
        assertTrue(credentialContract.supportsInterface(type(IERC721Metadata).interfaceId));
        assertTrue(credentialContract.supportsInterface(type(IAccessControl).interfaceId));
        assertTrue(credentialContract.supportsInterface(type(IERC165).interfaceId));
        assertFalse(credentialContract.supportsInterface(0x12345678));
    }

    // ==========================================
    //     FR-3: DECENTRALIZED METADATA PINNING
    // ==========================================

    function test_IssueCredentialSuccess() public {
        vm.expectEmit(true, true, true, true);
        emit Locked(1);

        vm.expectEmit(true, true, true, true);
        emit CredentialIssued(1, student1, docHash1, ipfsCID1, block.timestamp);

        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        assertEq(tokenId, 1);
        assertEq(credentialContract.ownerOf(tokenId), student1);
        assertEq(credentialContract.balanceOf(student1), 1);
        assertEq(credentialContract.totalCredentialsIssued(), 1);
        assertEq(credentialContract.totalCredentialsRevoked(), 0);
        assertEq(credentialContract.totalActiveCredentials(), 1);

        IAcademicCredentialSBT.CredentialRecord memory rec = credentialContract.getCredential(tokenId);
        assertEq(rec.docHash, docHash1);
        assertEq(rec.ipfsCID, ipfsCID1);
        assertEq(rec.issuedAt, block.timestamp);
        assertEq(rec.revokedAt, 0);
        assertFalse(rec.isRevoked);
        assertEq(rec.revocationReason, "");

        assertEq(credentialContract.getTokenIdByDocHash(docHash1), 1);
        assertEq(credentialContract.tokenURI(tokenId), string.concat("ipfs://", ipfsCID1));
    }

    function test_RevertIssueToZeroAddress() public {
        vm.prank(registrar);
        vm.expectRevert(IAcademicCredentialSBT.ZeroAddressRecipient.selector);
        credentialContract.issueCredential(address(0), docHash1, ipfsCID1);
    }

    function test_RevertIssueWithEmptyHash() public {
        vm.prank(registrar);
        vm.expectRevert(IAcademicCredentialSBT.InvalidDocumentHash.selector);
        credentialContract.issueCredential(student1, bytes32(0), ipfsCID1);
    }

    function test_RevertIssueWithEmptyCID() public {
        vm.prank(registrar);
        vm.expectRevert(IAcademicCredentialSBT.EmptyIpfsCID.selector);
        credentialContract.issueCredential(student1, docHash1, "");
    }

    function test_RevertIssueDuplicateDocHash() public {
        vm.prank(registrar);
        credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        // Attempt to issue token for another student with the identical document hash
        vm.prank(registrar);
        vm.expectRevert(
            abi.encodeWithSelector(IAcademicCredentialSBT.DocumentHashAlreadyRegistered.selector, docHash1, 1)
        );
        credentialContract.issueCredential(student2, docHash1, ipfsCID2);
    }

    function test_BatchIssuanceSuccess() public {
        address[] memory students = new address[](2);
        students[0] = student1;
        students[1] = student2;

        bytes32[] memory hashes = new bytes32[](2);
        hashes[0] = docHash1;
        hashes[1] = docHash2;

        string[] memory cids = new string[](2);
        cids[0] = ipfsCID1;
        cids[1] = ipfsCID2;

        vm.prank(registrar);
        uint256[] memory tokenIds = credentialContract.issueCredentialBatch(students, hashes, cids);

        assertEq(tokenIds.length, 2);
        assertEq(tokenIds[0], 1);
        assertEq(tokenIds[1], 2);
        assertEq(credentialContract.ownerOf(1), student1);
        assertEq(credentialContract.ownerOf(2), student2);
        assertEq(credentialContract.totalCredentialsIssued(), 2);
    }

    function test_BatchIssuanceRevertsOnMismatch() public {
        address[] memory students = new address[](2);
        bytes32[] memory hashes = new bytes32[](1);
        string[] memory cids = new string[](2);

        vm.prank(registrar);
        vm.expectRevert(IAcademicCredentialSBT.BatchLengthMismatch.selector);
        credentialContract.issueCredentialBatch(students, hashes, cids);
    }

    function test_BatchIssuanceRevertsOnEmpty() public {
        address[] memory students = new address[](0);
        bytes32[] memory hashes = new bytes32[](0);
        string[] memory cids = new string[](0);

        vm.prank(registrar);
        vm.expectRevert(IAcademicCredentialSBT.EmptyBatch.selector);
        credentialContract.issueCredentialBatch(students, hashes, cids);
    }

    // ==========================================
    //   FR-4: ADMINISTRATIVE REVOCATION REGISTRY
    // ==========================================

    function test_RevokeCredentialSuccess() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.warp(block.timestamp + 100);

        vm.expectEmit(true, true, true, true);
        emit CredentialRevoked(tokenId, registrar, "Academic misconduct: plagiarism in thesis", block.timestamp);

        vm.prank(registrar);
        credentialContract.revokeCredential(tokenId, "Academic misconduct: plagiarism in thesis");

        IAcademicCredentialSBT.CredentialRecord memory rec = credentialContract.getCredential(tokenId);
        assertTrue(rec.isRevoked);
        assertEq(rec.revocationReason, "Academic misconduct: plagiarism in thesis");
        assertEq(rec.revokedAt, block.timestamp);

        assertEq(credentialContract.totalCredentialsIssued(), 1);
        assertEq(credentialContract.totalCredentialsRevoked(), 1);
        assertEq(credentialContract.totalActiveCredentials(), 0);
    }

    function test_RevertDoubleRevocation() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(registrar);
        credentialContract.revokeCredential(tokenId, "Reason 1");

        vm.prank(registrar);
        vm.expectRevert(abi.encodeWithSelector(IAcademicCredentialSBT.CredentialAlreadyRevoked.selector, tokenId));
        credentialContract.revokeCredential(tokenId, "Reason 2");
    }

    function test_RevertRevokeEmptyReason() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(registrar);
        vm.expectRevert(IAcademicCredentialSBT.EmptyRevocationReason.selector);
        credentialContract.revokeCredential(tokenId, "");
    }

    // ==========================================
    //  FR-5 & STAGE 4: ZERO-TRUST VERIFICATION
    // ==========================================

    function test_VerifyCredentialValid() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        // Case 1: Valid check via tokenId
        (
            bool isValid,
            IAcademicCredentialSBT.VerificationStatus status,
            IAcademicCredentialSBT.CredentialRecord memory rec
        ) = credentialContract.verifyCredential(tokenId, docHash1, student1);

        assertTrue(isValid);
        assertEq(uint256(status), uint256(IAcademicCredentialSBT.VerificationStatus.Valid));
        assertEq(rec.docHash, docHash1);

        // Case 2: Valid check via hash lookup directly
        (bool isValidByHash, uint256 lookedUpId, IAcademicCredentialSBT.VerificationStatus statusByHash) =
            credentialContract.verifyCredentialByHash(docHash1, student1);

        assertTrue(isValidByHash);
        assertEq(lookedUpId, tokenId);
        assertEq(uint256(statusByHash), uint256(IAcademicCredentialSBT.VerificationStatus.Valid));
    }

    function test_VerifyCredentialTamperedHash() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        bytes32 tamperedHash = keccak256(abi.encodePacked("Tampered grades or GPA"));

        (bool isValid, IAcademicCredentialSBT.VerificationStatus status,) =
            credentialContract.verifyCredential(tokenId, tamperedHash, student1);

        assertFalse(isValid);
        assertEq(uint256(status), uint256(IAcademicCredentialSBT.VerificationStatus.InvalidHash));
    }

    function test_VerifyCredentialRevokedStatus() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(registrar);
        credentialContract.revokeCredential(tokenId, "Administrative error in units computation");

        (bool isValid, IAcademicCredentialSBT.VerificationStatus status,) =
            credentialContract.verifyCredential(tokenId, docHash1, student1);

        assertFalse(isValid);
        assertEq(uint256(status), uint256(IAcademicCredentialSBT.VerificationStatus.Revoked));

        // Also via hash lookup
        (bool isValidByHash,, IAcademicCredentialSBT.VerificationStatus statusByHash) =
            credentialContract.verifyCredentialByHash(docHash1, student1);

        assertFalse(isValidByHash);
        assertEq(uint256(statusByHash), uint256(IAcademicCredentialSBT.VerificationStatus.Revoked));
    }

    function test_VerifyCredentialIncorrectOwner() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        // Imposter presents student1's diploma file
        (bool isValid, IAcademicCredentialSBT.VerificationStatus status,) =
            credentialContract.verifyCredential(tokenId, docHash1, imposter);

        assertFalse(isValid);
        assertEq(uint256(status), uint256(IAcademicCredentialSBT.VerificationStatus.IncorrectOwner));

        (bool isValidByHash,, IAcademicCredentialSBT.VerificationStatus statusByHash) =
            credentialContract.verifyCredentialByHash(docHash1, imposter);

        assertFalse(isValidByHash);
        assertEq(uint256(statusByHash), uint256(IAcademicCredentialSBT.VerificationStatus.IncorrectOwner));
    }

    function test_VerifyCredentialNonExistentToken() public view {
        (bool isValid, IAcademicCredentialSBT.VerificationStatus status,) =
            credentialContract.verifyCredential(999, docHash1, student1);

        assertFalse(isValid);
        assertEq(uint256(status), uint256(IAcademicCredentialSBT.VerificationStatus.TokenDoesNotExist));

        (bool isValidByHash,, IAcademicCredentialSBT.VerificationStatus statusByHash) =
            credentialContract.verifyCredentialByHash(keccak256("unregistered"), student1);

        assertFalse(isValidByHash);
        assertEq(uint256(statusByHash), uint256(IAcademicCredentialSBT.VerificationStatus.TokenDoesNotExist));
    }

    // ==========================================
    //   FR-6: STUDENT IDENTITY KEY RECOVERY
    // ==========================================

    function test_RecoverCredentialSuccess() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.warp(block.timestamp + 500);

        vm.expectEmit(true, true, true, true);
        emit Unlocked(tokenId);

        vm.expectEmit(true, true, true, true);
        emit Locked(tokenId);

        vm.expectEmit(true, true, true, true);
        emit CredentialRecovered(
            tokenId, student1, newStudent1Key, "Lost hardware key confirmed via biometric notarization", block.timestamp
        );

        vm.prank(registrar);
        credentialContract.recoverCredential(
            tokenId, newStudent1Key, "Lost hardware key confirmed via biometric notarization"
        );

        // Ownership is updated to new sovereign address
        assertEq(credentialContract.ownerOf(tokenId), newStudent1Key);
        assertEq(credentialContract.balanceOf(student1), 0);
        assertEq(credentialContract.balanceOf(newStudent1Key), 1);

        // Verification with new key succeeds
        (bool isValidNew, IAcademicCredentialSBT.VerificationStatus statusNew,) =
            credentialContract.verifyCredential(tokenId, docHash1, newStudent1Key);
        assertTrue(isValidNew);
        assertEq(uint256(statusNew), uint256(IAcademicCredentialSBT.VerificationStatus.Valid));

        // Verification with old key now fails as IncorrectOwner
        (bool isValidOld, IAcademicCredentialSBT.VerificationStatus statusOld,) =
            credentialContract.verifyCredential(tokenId, docHash1, student1);
        assertFalse(isValidOld);
        assertEq(uint256(statusOld), uint256(IAcademicCredentialSBT.VerificationStatus.IncorrectOwner));
    }

    function test_RevertRecoverToZeroAddress() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(registrar);
        vm.expectRevert(IAcademicCredentialSBT.ZeroAddressRecovery.selector);
        credentialContract.recoverCredential(tokenId, address(0), "Reason");
    }

    function test_RevertRecoverToSameAddress() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(registrar);
        vm.expectRevert(IAcademicCredentialSBT.RecoveryToSameAddress.selector);
        credentialContract.recoverCredential(tokenId, student1, "Reason");
    }

    function test_RevertRecoverWithEmptyReason() public {
        vm.prank(registrar);
        uint256 tokenId = credentialContract.issueCredential(student1, docHash1, ipfsCID1);

        vm.prank(registrar);
        vm.expectRevert(IAcademicCredentialSBT.EmptyRecoveryReason.selector);
        credentialContract.recoverCredential(tokenId, newStudent1Key, "");
    }
}
