import { ethers } from 'ethers';
import { getReadOnlyContract } from '../blockchain/contract.js';
import canonicalizer from './canonicalizer.js';
import ipfsService from './ipfsService.js';
import config from '../config.js';
import logger from '../utils/logger.js';
import { getCredentialByDocHash } from './dbService.js';

const STATUS_MAP = {
  0: { code: 'VALID', label: 'Valid', description: 'Cryptographic hash matches, token active, owned by claimed student.' },
  1: { code: 'INVALID_HASH', label: 'Invalid Hash', description: 'Provided document hash does not match immutable on-chain record.' },
  2: { code: 'REVOKED', label: 'Revoked', description: 'Credential was administratively revoked by authorized registrar.' },
  3: { code: 'INCORRECT_OWNER', label: 'Incorrect Owner', description: 'Soulbound token is not owned by the claimed student address.' },
  4: { code: 'TOKEN_NOT_FOUND', label: 'Token Does Not Exist', description: 'Token ID was not found on-chain.' },
};

export const verifyByTokenId = async ({ tokenId, docHash, claimedStudent }) => {
  const startTime = performance.now();
  const readContract = getReadOnlyContract();

  let normalizedStudent;
  try {
    normalizedStudent = ethers.getAddress(claimedStudent.trim());
  } catch (err) {
    return {
      isValid: false,
      status: 'INVALID_STUDENT_ADDRESS',
      message: `Invalid claimed student address: ${claimedStudent}`,
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  let formattedDocHash = docHash.startsWith('0x') ? docHash : `0x${docHash}`;
  if (formattedDocHash.length !== 66) {
    return {
      isValid: false,
      status: 'INVALID_HASH_FORMAT',
      message: 'Document hash must be a valid 32-byte hexadecimal string (64 characters + 0x prefix)',
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  try {
    const [isValid, statusEnum, record] = await readContract.verifyCredential(
      tokenId,
      formattedDocHash,
      normalizedStudent
    );

    const statusInfo = STATUS_MAP[Number(statusEnum)] || { code: 'UNKNOWN', label: 'Unknown' };
    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    let owner = null;
    let isLocked = false;
    let ipfsMetadata = null;

    if (Number(statusEnum) !== 4) {
      try {
        owner = await readContract.ownerOf(tokenId);
        isLocked = await readContract.locked(tokenId);
      } catch (e) {
        // ignore
      }

      if (record && record.ipfsCID) {
        const cached = ipfsService.getCachedContent(record.ipfsCID);
        if (cached) {
          try {
            ipfsMetadata = JSON.parse(cached.buffer.toString('utf8'));
          } catch (e) {
            // ignore
          }
        }
      }
    }

    return {
      isValid,
      status: statusInfo.code,
      statusLabel: statusInfo.label,
      statusDescription: statusInfo.description,
      latencyMs,
      checks: {
        hashMatches: record ? record.docHash.toLowerCase() === formattedDocHash.toLowerCase() : false,
        isActive: record ? !record.isRevoked : false,
        ownerMatches: owner ? owner.toLowerCase() === normalizedStudent.toLowerCase() : false,
        isSoulboundLocked: isLocked,
      },
      diagnostics: {
        tokenId: tokenId.toString(),
        claimedStudent: normalizedStudent,
        actualOwner: owner,
        isSoulbound: isLocked,
        isLocked,
        submittedHash: formattedDocHash,
        onChainHash: record ? record.docHash : null,
        ipfsCID: record ? record.ipfsCID : null,
        issuedAt: record && record.issuedAt ? new Date(Number(record.issuedAt) * 1000).toISOString() : null,
        isRevoked: record ? record.isRevoked : false,
        revocationReason: record && record.isRevoked ? record.revocationReason : null,
        revokedAt: record && record.isRevoked && record.revokedAt ? new Date(Number(record.revokedAt) * 1000).toISOString() : null,
      },
      metadata: ipfsMetadata,
      contractAddress: config.contractAddress,
    };
  } catch (err) {
    logger.error(`verifyCredential call failed for token #${tokenId}:`, err.message);
    return {
      isValid: false,
      status: 'VERIFICATION_ERROR',
      message: err.message,
      latencyMs: Math.round(performance.now() - startTime),
    };
  }
};

export const verifyByHash = async (param) => {
  const startTime = performance.now();
  const readContract = getReadOnlyContract();

  const docHash = typeof param === 'string' ? param : param?.docHash;
  const claimedStudent = typeof param === 'object' ? param?.claimedStudent : null;

  if (!docHash || typeof docHash !== 'string' || !docHash.trim()) {
    return {
      found: false,
      isValid: false,
      status: 'INVALID_HASH_FORMAT',
      statusLabel: 'Invalid Hash Format',
      statusDescription: 'Document hash is required.',
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  const cleanHash = docHash.trim();
  const formattedDocHash = cleanHash.startsWith('0x') ? cleanHash.toLowerCase() : `0x${cleanHash.toLowerCase()}`;

  let normalizedStudent = null;
  if (claimedStudent && typeof claimedStudent === 'string' && claimedStudent.trim().length > 0) {
    try {
      normalizedStudent = ethers.getAddress(claimedStudent.trim());
    } catch (err) {
      return {
        found: false,
        isValid: false,
        status: 'INVALID_STUDENT_ADDRESS',
        statusLabel: 'Invalid Student Address',
        statusDescription: `Invalid claimed student address: ${claimedStudent}`,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }
  }

  try {
    // 1. Check local database first (matches docHash, fileInfo.hash, or canonicalRecord.documentHash)
    let match = await getCredentialByDocHash(formattedDocHash);
    let targetTokenId = match ? match.tokenId : null;

    // 2. If not found in database, check on-chain mapping
    if (!targetTokenId && formattedDocHash.length === 66) {
      try {
        const onChainTokenId = await readContract.getTokenIdByDocHash(formattedDocHash);
        if (onChainTokenId && onChainTokenId > 0n) {
          targetTokenId = onChainTokenId.toString();
        }
      } catch (e) {
        // ignore on-chain query error
      }
    }

    if (!targetTokenId) {
      return {
        found: false,
        isValid: false,
        status: 'TOKEN_NOT_FOUND',
        statusLabel: 'Hash Not Found',
        statusDescription: 'No credential matches this document hash in the institutional registry or blockchain.',
        latencyMs: Math.round(performance.now() - startTime),
        checks: {
          hashMatches: false,
          isActive: false,
        },
        diagnostics: {
          submittedHash: formattedDocHash,
        },
        contractAddress: config.contractAddress,
      };
    }

    // 3. Retrieve on-chain and metadata status
    let owner = null;
    let isLocked = false;
    let onChainRecord = null;
    try {
      owner = await readContract.ownerOf(targetTokenId);
      onChainRecord = await readContract.getCredential(targetTokenId);
      try {
        isLocked = await readContract.locked(targetTokenId);
      } catch (e) {
        isLocked = true;
      }
    } catch (e) {
      // ignore
    }

    const isRevoked = onChainRecord ? onChainRecord.isRevoked : (match ? match.status === 'REVOKED' : false);
    const ownerMatches = normalizedStudent && owner
      ? owner.toLowerCase() === normalizedStudent.toLowerCase()
      : true;

    const isValid = !isRevoked && (normalizedStudent ? ownerMatches : true);

    let status = 'VALID';
    let statusLabel = 'Authentic Hash Match';
    let statusDescription = 'The document hash matches an active academic credential on the blockchain.';

    if (isRevoked) {
      status = 'REVOKED';
      statusLabel = 'Credential Revoked';
      statusDescription = 'This document matches a credential that has been officially revoked by the university.';
    } else if (normalizedStudent && !ownerMatches) {
      status = 'INCORRECT_OWNER';
      statusLabel = 'Incorrect Owner';
      statusDescription = 'Soulbound token is not owned by the claimed student address.';
    }

    let ipfsMetadata = null;
    const ipfsCID = onChainRecord ? onChainRecord.ipfsCID : match?.ipfsCID;
    if (ipfsCID) {
      const cached = ipfsService.getCachedContent(ipfsCID);
      if (cached) {
        try {
          ipfsMetadata = JSON.parse(cached.buffer.toString('utf8'));
        } catch (e) {}
      }
    }

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    const metadata = match?.canonicalRecord || ipfsMetadata;
    const actualOwner = owner || match?.studentAddress;
    const onChainHash = onChainRecord ? onChainRecord.docHash : match?.docHash;

    return {
      found: true,
      isValid,
      status,
      statusLabel,
      statusDescription,
      latencyMs,
      checks: {
        hashMatches: true,
        isActive: !isRevoked,
        ownerMatches: normalizedStudent ? ownerMatches : true,
        isSoulboundLocked: isLocked,
      },
      diagnostics: {
        tokenId: targetTokenId.toString(),
        actualOwner,
        claimedStudent: normalizedStudent,
        onChainHash,
        submittedHash: formattedDocHash,
        ipfsCID,
        issuedAt: onChainRecord && onChainRecord.issuedAt ? new Date(Number(onChainRecord.issuedAt) * 1000).toISOString() : (match?.issuedAt ? new Date(match.issuedAt).toISOString() : null),
        isRevoked,
        revocationReason: onChainRecord?.revocationReason || match?.revocation?.reason || null,
        isSoulbound: isLocked,
        isLocked,
      },
      metadata,
      // Compatibility fields for verify/page.js
      academic: metadata,
      studentAddress: actualOwner,
      docHash: onChainHash,
      tokenId: targetTokenId.toString(),
      ipfsCID,
      isRevoked,
      contractAddress: config.contractAddress,
    };
  } catch (err) {
    logger.error('verifyByHash call failed:', err.message);
    return {
      found: false,
      isValid: false,
      status: 'VERIFICATION_ERROR',
      statusLabel: 'Verification Error',
      statusDescription: err.message,
      message: err.message,
      latencyMs: Math.round(performance.now() - startTime),
    };
  }
};

export const verifyByDocumentFile = async ({ fileBuffer, claimedStudent = null, claimedTokenId = null }) => {
  const computedHash = canonicalizer.hashDocumentBuffer(fileBuffer);
  const readContract = getReadOnlyContract();

  let targetTokenId = claimedTokenId;

  if (!targetTokenId) {
    const localMatch = await getCredentialByDocHash(computedHash);
    if (localMatch) {
      targetTokenId = localMatch.tokenId.toString();
    } else {
      try {
        const registeredTokenId = await readContract.getTokenIdByDocHash(computedHash);
        if (registeredTokenId && registeredTokenId > 0n) {
          targetTokenId = registeredTokenId.toString();
        }
      } catch (e) {}
    }
  }

  if (!targetTokenId) {
    return {
      found: false,
      isValid: false,
      status: 'UNREGISTERED_DOCUMENT',
      statusLabel: 'Unregistered Document',
      statusDescription: 'The uploaded document hash does not match any credential minted by this institution.',
      computedDocHash: computedHash,
      checks: {
        hashMatches: false,
        isActive: false,
      },
      diagnostics: {
        computedHash,
      },
    };
  }

  return await verifyByHash({
    docHash: computedHash,
    claimedStudent,
  });
};

export default {
  verifyByTokenId,
  verifyByHash,
  verifyByDocumentFile,
};
