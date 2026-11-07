import { ethers } from 'ethers';
import { getRegistrarContract, getReadOnlyContract } from '../blockchain/contract.js';
import { runExclusiveTx } from '../blockchain/txRunner.js';
import canonicalizer from './canonicalizer.js';
import ipfsService from './ipfsService.js';
import qrService from './qrService.js';
import dbService from './dbService.js';
import logger from '../utils/logger.js';

const parseTokenIdFromReceipt = (receipt, contract) => {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === 'CredentialIssued') {
        return parsed.args.tokenId.toString();
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
};

const parseBatchTokenIdsFromReceipt = (receipt, contract) => {
  const tokenIds = [];
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === 'CredentialIssued') {
        tokenIds.push(parsed.args.tokenId.toString());
      }
    } catch (e) {
      // ignore
    }
  }
  return tokenIds;
};

export const issueSingleCredential = async ({
  studentAddress,
  degreeTitle,
  graduationDate,
  honors = 'None',
  studentName = '',
  studentId = '',
  major = '',
  college = '',
  department = '',
  gpa = '',
  credentialType = 'Diploma',
  nonce = '',
  file = null, // { buffer, originalname, mimetype, size }
  performedBy = 'registrar',
}) => {
  const contract = getRegistrarContract();
  const readContract = getReadOnlyContract();

  let documentInfo = null;
  let docFileHash = null;

  if (file && file.buffer) {
    docFileHash = canonicalizer.hashDocumentBuffer(file.buffer);
    const filePin = await ipfsService.pinFileToIPFS(file.buffer, file.originalname, file.mimetype);
    documentInfo = {
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      cid: filePin.cid,
      url: filePin.gatewayUrl,
      hash: docFileHash,
    };
  }

  const normalized = canonicalizer.normalizeAcademicRecord({
    studentAddress,
    degreeTitle,
    graduationDate,
    honors,
    studentName,
    studentId,
    major,
    college,
    department,
    gpa,
    credentialType,
    nonce,
    documentHash: docFileHash,
  });

  const { canonicalRecord, canonicalString, docHash, studentAddress: normalizedStudent } = normalized;

  const existingTokenId = await readContract.getTokenIdByDocHash(docHash);
  if (existingTokenId && existingTokenId > 0n) {
    throw new Error(`Document hash is already registered under Token ID #${existingTokenId}`);
  }

  const ipfsPin = await ipfsService.pinJSONToIPFS(
    canonicalRecord,
    `academic-credential-${normalizedStudent.substring(0, 8)}`
  );
  const ipfsCID = ipfsPin.cid;

  logger.info(`Broadcasting issueCredential tx for student ${normalizedStudent}...`);
  const receipt = await runExclusiveTx(async (overrides) => {
    const tx = await contract.issueCredential(normalizedStudent, docHash, ipfsCID, overrides);
    return await tx.wait(1);
  });

  const tokenId = parseTokenIdFromReceipt(receipt, contract);
  if (!tokenId) {
    throw new Error('Failed to parse issued tokenId from blockchain transaction logs');
  }

  const qrPayload = qrService.generateVerificationPayload({
    tokenId,
    docHash,
    studentAddress: normalizedStudent,
  });
  const qrDataUrl = await qrService.generateQRCodeDataURL(qrPayload);

  const record = {
    tokenId,
    studentAddress: normalizedStudent,
    docHash,
    ipfsCID,
    canonicalRecord,
    status: 'ACTIVE',
    issuedAt: new Date().toISOString(),
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    qrCode: qrDataUrl,
    fileInfo: documentInfo,
    revocation: null,
    recoveryHistory: [],
  };

  await dbService.saveCredentialRecord(record);

  await dbService.logAudit({
    action: 'CREDENTIAL_ISSUED',
    performedBy,
    targetTokenId: tokenId,
    txHash: receipt.hash,
    details: {
      studentAddress: normalizedStudent,
      degreeTitle,
      docHash,
      ipfsCID,
    },
  });

  logger.success(`Credential SBT #${tokenId} issued to ${normalizedStudent} (tx: ${receipt.hash})`);

  return {
    tokenId,
    studentAddress: normalizedStudent,
    docHash,
    ipfsCID,
    metadataGatewayUrl: ipfsPin.gatewayUrl,
    canonicalRecord,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
    qrCode: qrDataUrl,
    fileInfo: documentInfo,
  };
};

export const issueCohortBatch = async ({ cohortName, records, performedBy = 'registrar' }) => {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('A non-empty array of graduate records is required');
  }

  const contract = getRegistrarContract();
  const readContract = getReadOnlyContract();

  const students = [];
  const docHashes = [];
  const ipfsCIDs = [];
  const processedRecords = [];

  logger.info(`Normalizing and pinning ${records.length} cohort credential records...`);

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    const normalized = canonicalizer.normalizeAcademicRecord(raw);

    const existing = await readContract.getTokenIdByDocHash(normalized.docHash);
    if (existing && existing > 0n) {
      throw new Error(`Record ${i + 1} (${raw.studentName || raw.studentAddress}) hash is already registered under Token ID #${existing}`);
    }

    const pin = await ipfsService.pinJSONToIPFS(
      normalized.canonicalRecord,
      `cohort-${normalized.studentAddress.substring(0, 8)}`
    );

    students.push(normalized.studentAddress);
    docHashes.push(normalized.docHash);
    ipfsCIDs.push(pin.cid);
    processedRecords.push({
      ...normalized,
      ipfsCID: pin.cid,
    });
  }

  logger.info(`Broadcasting issueCredentialBatch for ${students.length} graduates...`);
  const receipt = await runExclusiveTx(async (overrides) => {
    const tx = await contract.issueCredentialBatch(students, docHashes, ipfsCIDs, overrides);
    return await tx.wait(1);
  });

  const tokenIds = parseBatchTokenIdsFromReceipt(receipt, contract);
  if (tokenIds.length !== students.length) {
    throw new Error(`Expected ${students.length} token IDs from receipt, but found ${tokenIds.length}`);
  }

  const cohortRecord = await dbService.saveCohort({
    name: cohortName || `Cohort ${new Date().getFullYear()}`,
    totalCount: tokenIds.length,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    tokenIds,
    issuedBy: performedBy,
  });

  const issuedCredentials = [];

  for (let i = 0; i < tokenIds.length; i++) {
    const tokenId = tokenIds[i];
    const rec = processedRecords[i];

    const qrPayload = qrService.generateVerificationPayload({
      tokenId,
      docHash: rec.docHash,
      studentAddress: rec.studentAddress,
    });
    const qrDataUrl = await qrService.generateQRCodeDataURL(qrPayload);

    const saved = {
      tokenId,
      studentAddress: rec.studentAddress,
      docHash: rec.docHash,
      ipfsCID: rec.ipfsCID,
      canonicalRecord: rec.canonicalRecord,
      status: 'ACTIVE',
      issuedAt: new Date().toISOString(),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      qrCode: qrDataUrl,
      cohortId: cohortRecord.id,
      revocation: null,
      recoveryHistory: [],
    };

    const savedRecord = await dbService.saveCredentialRecord(saved);
    issuedCredentials.push(savedRecord);
  }

  await dbService.logAudit({
    action: 'BATCH_ISSUED',
    performedBy,
    txHash: receipt.hash,
    details: {
      cohortName: cohortRecord.name,
      totalIssued: issuedCredentials.length,
      tokenRange: `${tokenIds[0]} - ${tokenIds[tokenIds.length - 1]}`,
    },
  });

  logger.success(`Batch cohort issued: ${issuedCredentials.length} credentials minted in tx ${receipt.hash}`);

  return {
    cohort: cohortRecord,
    totalIssued: issuedCredentials.length,
    tokenIds,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
    credentials: issuedCredentials,
  };
};

export const revokeCredential = async ({ tokenId, reason, performedBy = 'registrar' }) => {
  if (!tokenId) {
    throw new Error('tokenId is required');
  }
  if (!reason || reason.trim().length === 0) {
    throw new Error('A documented justification/reason for revocation is required');
  }

  const contract = getRegistrarContract();
  const readContract = getReadOnlyContract();

  const onChainRecord = await readContract.getCredential(tokenId);
  if (onChainRecord.isRevoked) {
    throw new Error(`Credential #${tokenId} is already revoked`);
  }

  logger.info(`Revoking Credential #${tokenId} on-chain. Reason: "${reason}"...`);
  const receipt = await runExclusiveTx(async (overrides) => {
    const tx = await contract.revokeCredential(tokenId, reason.trim(), overrides);
    return await tx.wait(1);
  });

  const existing = await dbService.getCredentialByTokenId(tokenId);
  if (existing) {
    existing.status = 'REVOKED';
    existing.revocation = {
      isRevoked: true,
      reason: reason.trim(),
      revokedAt: new Date().toISOString(),
      revokedBy: performedBy,
      txHash: receipt.hash,
    };
    await dbService.saveCredentialRecord(existing);
  }

  await dbService.logAudit({
    action: 'CREDENTIAL_REVOKED',
    performedBy,
    targetTokenId: tokenId,
    txHash: receipt.hash,
    details: { reason },
  });

  return {
    tokenId: tokenId.toString(),
    isRevoked: true,
    reason: reason.trim(),
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber.toString(),
  };
};

export const recoverCredential = async ({ tokenId, newStudentAddress, reason, performedBy = 'registrar' }) => {
  if (!tokenId) {
    throw new Error('tokenId is required');
  }
  if (!newStudentAddress) {
    throw new Error('newStudentAddress is required');
  }
  if (!reason || reason.trim().length === 0) {
    throw new Error('A documented justification/reason for recovery is required');
  }

  const normalizedNewAddress = ethers.getAddress(newStudentAddress.trim());
  const contract = getRegistrarContract();
  const readContract = getReadOnlyContract();

  const currentOwner = await readContract.ownerOf(tokenId);
  if (currentOwner.toLowerCase() === normalizedNewAddress.toLowerCase()) {
    throw new Error('New student address cannot be identical to current owner address');
  }

  logger.info(`Migrating Credential #${tokenId} ownership from ${currentOwner} to ${normalizedNewAddress}...`);
  const receipt = await runExclusiveTx(async (overrides) => {
    const tx = await contract.recoverCredential(tokenId, normalizedNewAddress, reason.trim(), overrides);
    return await tx.wait(1);
  });

  const existing = await dbService.getCredentialByTokenId(tokenId);
  let updatedRecord = null;
  if (existing) {
    existing.studentAddress = normalizedNewAddress;
    if (existing.canonicalRecord) {
      existing.canonicalRecord.studentAddress = normalizedNewAddress;
    }

    if (!existing.recoveryHistory) existing.recoveryHistory = [];
    existing.recoveryHistory.push({
      previousAddress: currentOwner,
      newAddress: normalizedNewAddress,
      reason: reason.trim(),
      recoveredBy: performedBy,
      txHash: receipt.hash,
      timestamp: new Date().toISOString(),
    });

    const qrPayload = qrService.generateVerificationPayload({
      tokenId,
      docHash: existing.docHash,
      studentAddress: normalizedNewAddress,
    });
    existing.qrCode = await qrService.generateQRCodeDataURL(qrPayload);

    updatedRecord = await dbService.saveCredentialRecord(existing);
  }

  await dbService.logAudit({
    action: 'CREDENTIAL_RECOVERED',
    performedBy,
    targetTokenId: tokenId,
    txHash: receipt.hash,
    details: {
      previousAddress: currentOwner,
      newAddress: normalizedNewAddress,
      reason,
    },
  });

  return {
    tokenId: tokenId.toString(),
    previousOwner: currentOwner,
    newOwner: normalizedNewAddress,
    reason: reason.trim(),
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber.toString(),
    credential: updatedRecord,
  };
};

export const getCredentialDetails = async (tokenId) => {
  const readContract = getReadOnlyContract();

  let onChainRecord = null;
  let owner = null;
  let isLocked = false;
  let existsOnChain = false;

  try {
    owner = await readContract.ownerOf(tokenId);
    onChainRecord = await readContract.getCredential(tokenId);
    try {
      isLocked = await readContract.locked(tokenId);
    } catch (e) {
      isLocked = false;
    }
    existsOnChain = true;
  } catch (err) {
    existsOnChain = false;
  }

  const localRecord = await dbService.getCredentialByTokenId(tokenId);

  if (!existsOnChain && !localRecord) {
    return null;
  }

  return {
    tokenId: tokenId.toString(),
    existsOnChain,
    owner,
    onChain: onChainRecord ? {
      docHash: onChainRecord.docHash,
      ipfsCID: onChainRecord.ipfsCID,
      issuedAt: Number(onChainRecord.issuedAt),
      revokedAt: Number(onChainRecord.revokedAt),
      isRevoked: onChainRecord.isRevoked,
      revocationReason: onChainRecord.revocationReason,
      isLocked,
      isSoulbound: isLocked,
    } : null,
    local: localRecord,
  };
};

export const getCredential = getCredentialDetails;

export default {
  issueSingleCredential,
  issueCohortBatch,
  revokeCredential,
  recoverCredential,
  getCredentialDetails,
  getCredential: getCredentialDetails,
};
