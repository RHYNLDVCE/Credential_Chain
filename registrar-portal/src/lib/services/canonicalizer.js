import crypto from 'crypto';
import { ethers } from 'ethers';
import config from '../config.js';
import { lookupAcademicHierarchy } from '../data/academicStructure.js';

/**
 * Stage 1: Canonical Metadata Normalization & SHA-256 Digest
 */

export const sortObjectKeys = (obj) => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const sorted = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      sorted[key] = sortObjectKeys(val);
    } else if (Array.isArray(val)) {
      sorted[key] = val.map((item) => (typeof item === 'object' && item !== null ? sortObjectKeys(item) : item));
    } else {
      sorted[key] = val;
    }
  }

  return sorted;
};

export const canonicalizeJSON = (data) => {
  const sorted = sortObjectKeys(data);
  return JSON.stringify(sorted);
};

export const computeSHA256 = (input) => {
  const hash = crypto.createHash('sha256');
  if (Buffer.isBuffer(input)) {
    hash.update(input);
  } else {
    hash.update(String(input), 'utf8');
  }
  return `0x${hash.digest('hex')}`;
};

export const hashDocumentBuffer = (buffer) => {
  return computeSHA256(buffer);
};

export const normalizeAcademicRecord = (input) => {
  if (!input.studentAddress) {
    throw new Error('studentAddress is required for academic record canonicalization');
  }
  if (!input.degreeTitle) {
    throw new Error('degreeTitle is required for academic record canonicalization');
  }
  if (!input.graduationDate) {
    throw new Error('graduationDate is required for academic record canonicalization');
  }

  let normalizedAddress;
  try {
    normalizedAddress = ethers.getAddress(input.studentAddress.trim());
  } catch (err) {
    throw new Error(`Invalid studentAddress Ethereum format: ${input.studentAddress}`);
  }

  const nonce = input.nonce && String(input.nonce).trim().length > 0
    ? String(input.nonce).trim()
    : crypto.randomBytes(16).toString('hex');

  const validTypes = ['Diploma', 'Transcript of Records (TOR)', 'Certificate of Graduation'];
  const credentialType = input.credentialType && validTypes.includes(input.credentialType.trim())
    ? input.credentialType.trim()
    : 'Diploma';

  const lookup = lookupAcademicHierarchy(input.degreeTitle);
  const college = input.college ? String(input.college).trim() : (lookup?.college || '');
  const department = input.department ? String(input.department).trim() : (lookup?.department || config.departmentName);

  const canonicalRecord = {
    credentialType,
    degreeTitle: String(input.degreeTitle).trim(),
    graduationDate: String(input.graduationDate).trim(),
    honors: String(input.honors || 'None').trim(),
    institutionId: String(input.institutionId || config.institutionId).trim(),
    nonce,
    studentAddress: normalizedAddress,
  };

  if (college) canonicalRecord.college = college;
  if (department) canonicalRecord.department = department;
  if (input.studentId) canonicalRecord.studentId = String(input.studentId).trim();
  if (input.studentName) canonicalRecord.studentName = String(input.studentName).trim();
  if (input.major) canonicalRecord.major = String(input.major).trim();
  if (input.gpa) canonicalRecord.gpa = String(input.gpa).trim();
  if (input.documentHash) canonicalRecord.documentHash = String(input.documentHash).trim();

  const canonicalString = canonicalizeJSON(canonicalRecord);
  const docHash = computeSHA256(canonicalString);

  return {
    canonicalRecord,
    canonicalString,
    docHash,
    studentAddress: normalizedAddress,
  };
};

export default {
  sortObjectKeys,
  canonicalizeJSON,
  computeSHA256,
  hashDocumentBuffer,
  normalizeAcademicRecord,
};
