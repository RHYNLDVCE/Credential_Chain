// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.24;

/// @title ERC-5192: Minimal Soulbound NFTs
/// @notice Interface for Soulbound Token (SBT) transfer-locking mechanism
/// @dev See https://eips.ethereum.org/EIPS/eip-5192
/// ERC-165 identifier for this interface is 0xb45a3c0e
interface IERC5192 {
    /// @notice Emitted when the locking status of a token is changed to locked.
    /// @dev If a token is minted and the status is locked, this event must be emitted.
    /// @param tokenId The identifier for the token that is locked.
    event Locked(uint256 tokenId);

    /// @notice Emitted when the locking status of a token is changed to unlocked.
    /// @dev If a token is minted and the status is unlocked, this event must be emitted.
    /// @param tokenId The identifier for the token that is unlocked.
    event Unlocked(uint256 tokenId);

    /// @notice Returns the locking status of a Soulbound Token
    /// @dev SBTs assigned to zero address are considered invalid, and queries about them do throw.
    /// @param tokenId The identifier for an SBT.
    /// @return True if the token is locked (non-transferable), false otherwise.
    function locked(uint256 tokenId) external view returns (bool);
}
