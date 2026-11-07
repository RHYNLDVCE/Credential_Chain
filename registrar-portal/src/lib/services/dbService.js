import prisma from '../prisma.js';
import logger from '../utils/logger.js';

if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

// In-memory fallback store when PostgreSQL server is temporarily disconnected
const memoryUsers = new Map();
const memoryCredentials = new Map();
const memoryCohorts = new Map();
const memoryAuditLogs = [];

export const initDb = async () => {
  try {
    await prisma.$connect();
    logger.success('Connected to PostgreSQL database via Prisma ORM.');
  } catch (err) {
    logger.warn('PostgreSQL database connection pending or offline: ' + err.message);
  }
};

const formatCredential = (cred) => {
  if (!cred) return null;
  return {
    ...cred,
    blockNumber: cred.blockNumber ? cred.blockNumber.toString() : null,
  };
};

export const findUserByEmail = async (email) => {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  try {
    return await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
  } catch (err) {
    logger.warn(`PostgreSQL unreachable in findUserByEmail (${cleanEmail}): ${err.message}. Checking in-memory fallback.`);
    return memoryUsers.get(cleanEmail) || null;
  }
};

export const findUserById = async (id) => {
  if (!id) return null;
  try {
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch (err) {
    logger.warn(`PostgreSQL unreachable in findUserById (${id}): ${err.message}. Checking in-memory fallback.`);
    return memoryUsers.get(id) || null;
  }
};

export const saveUser = async (user) => {
  const email = user.email.toLowerCase().trim();
  const id = user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const memoryRecord = {
    id,
    email,
    name: user.name,
    role: user.role,
    department: user.department,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt || new Date(),
    updatedAt: new Date(),
  };

  // Cache in fallback memory
  memoryUsers.set(email, memoryRecord);
  memoryUsers.set(id, memoryRecord);

  try {
    return await prisma.user.upsert({
      where: { email },
      update: {
        name: user.name,
        role: user.role,
        department: user.department,
        passwordHash: user.passwordHash,
      },
      create: {
        id,
        email,
        name: user.name,
        role: user.role,
        department: user.department,
        passwordHash: user.passwordHash,
      },
    });
  } catch (err) {
    logger.warn(`PostgreSQL unreachable in saveUser (${email}): ${err.message}. Preserved in fallback memory.`);
    return memoryRecord;
  }
};

export const listUsers = async () => {
  try {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    logger.warn('PostgreSQL unreachable in listUsers: ' + err.message);
    const users = Array.from(new Set(Array.from(memoryUsers.values()))).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      department: u.department,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    return users;
  }
};

export const saveCredentialRecord = async (credential) => {
  const tokenId = credential.tokenId.toString();
  const docHash = credential.docHash.toLowerCase();
  const blockNumberBigInt = credential.blockNumber ? BigInt(credential.blockNumber.toString()) : BigInt(0);

  const data = {
    tokenId,
    studentAddress: credential.studentAddress,
    docHash,
    ipfsCID: credential.ipfsCID,
    canonicalRecord: credential.canonicalRecord || {},
    status: credential.status || 'ACTIVE',
    txHash: credential.txHash,
    blockNumber: blockNumberBigInt,
    gasUsed: credential.gasUsed ? credential.gasUsed.toString() : null,
    qrCode: credential.qrCode || null,
    fileInfo: credential.fileInfo || null,
    revocation: credential.revocation || null,
    recoveryHistory: credential.recoveryHistory || [],
    cohortId: credential.cohortId || null,
  };

  const saved = await prisma.credential.upsert({
    where: { tokenId },
    update: data,
    create: {
      ...data,
      issuedAt: credential.issuedAt ? new Date(credential.issuedAt) : new Date(),
    },
  });

  return formatCredential(saved);
};

export const getCredentialByTokenId = async (tokenId) => {
  if (!tokenId) return null;
  const record = await prisma.credential.findUnique({
    where: { tokenId: tokenId.toString() },
  });
  return formatCredential(record);
};

export const getCredentialByDocHash = async (docHash) => {
  if (!docHash) return null;
  const normalized = String(docHash).toLowerCase().trim();
  const with0x = normalized.startsWith('0x') ? normalized : `0x${normalized}`;
  const without0x = normalized.startsWith('0x') ? normalized.slice(2) : normalized;

  const record = await prisma.credential.findFirst({
    where: {
      OR: [
        { docHash: with0x },
        { docHash: without0x },
        { fileInfo: { path: ['hash'], equals: with0x } },
        { fileInfo: { path: ['hash'], equals: without0x } },
        { canonicalRecord: { path: ['documentHash'], equals: with0x } },
        { canonicalRecord: { path: ['documentHash'], equals: without0x } },
      ],
    },
  });
  return formatCredential(record);
};

export const queryCredentials = async ({
  search = '',
  status = '',
  degree = '',
  studentAddress = '',
  page = 1,
  limit = 20,
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (status) {
    where.status = { equals: status.toUpperCase(), mode: 'insensitive' };
  }

  if (studentAddress) {
    where.studentAddress = { equals: studentAddress, mode: 'insensitive' };
  }

  if (degree) {
    where.canonicalRecord = {
      path: ['degreeTitle'],
      string_contains: degree,
    };
  }

  if (search) {
    const s = search.trim();
    where.OR = [
      { tokenId: { contains: s, mode: 'insensitive' } },
      { studentAddress: { contains: s, mode: 'insensitive' } },
      { docHash: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.credential.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { issuedAt: 'desc' },
    }),
    prisma.credential.count({ where }),
  ]);

  return {
    items: items.map(formatCredential),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const saveCohort = async (cohort) => {
  const id = cohort.id || `cohort_${Date.now()}`;
  const blockNumberBigInt = cohort.blockNumber ? BigInt(cohort.blockNumber.toString()) : null;

  return await prisma.cohort.create({
    data: {
      id,
      name: cohort.name,
      totalCount: cohort.totalCount || 0,
      txHash: cohort.txHash || null,
      blockNumber: blockNumberBigInt,
      tokenIds: cohort.tokenIds || [],
      issuedBy: cohort.issuedBy || null,
    },
  });
};

export const listCohorts = async () => {
  return await prisma.cohort.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const getCohortById = async (id) => {
  if (!id) return null;
  return await prisma.cohort.findUnique({
    where: { id },
    include: { credentials: true },
  });
};

export const logAudit = async ({ action, performedBy, targetTokenId = null, txHash = null, details = {} }) => {
  const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tokenIdStr = targetTokenId ? targetTokenId.toString() : null;

  try {
    let validTokenId = null;
    if (tokenIdStr) {
      const exists = await prisma.credential.findUnique({ where: { tokenId: tokenIdStr }, select: { tokenId: true } });
      if (exists) {
        validTokenId = tokenIdStr;
      }
    }

    const entry = await prisma.auditLog.create({
      data: {
        id,
        action,
        performedBy,
        targetTokenId: validTokenId,
        txHash,
        details: details || {},
      },
    });

    return entry;
  } catch (err) {
    logger.warn(`Could not save audit log to PostgreSQL (${err.message}). Storing in memory fallback.`);
    const fallbackEntry = { id, action, performedBy, targetTokenId: tokenIdStr, txHash, details, createdAt: new Date() };
    memoryAuditLogs.unshift(fallbackEntry);
    return fallbackEntry;
  }
};

export const listAuditLogs = async ({ tokenId = null, action = null, limit = 50 } = {}) => {
  const where = {};
  if (tokenId) {
    where.targetTokenId = tokenId.toString();
  }
  if (action) {
    where.action = action;
  }

  try {
    return await prisma.auditLog.findMany({
      where,
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    logger.warn('PostgreSQL unreachable in listAuditLogs: ' + err.message);
    return memoryAuditLogs.slice(0, parseInt(limit, 10));
  }
};

export const getRegistryStats = async () => {
  try {
    const [totalCredentials, totalCohorts, totalAuditLogs, credentials] = await Promise.all([
      prisma.credential.count(),
      prisma.cohort.count(),
      prisma.auditLog.count(),
      prisma.credential.findMany({
        select: { canonicalRecord: true },
      }),
    ]);

    const honorsDistribution = {};
    const degreeDistribution = {};

    credentials.forEach((c) => {
      const rec = c.canonicalRecord || {};
      const h = rec.honors || 'None';
      honorsDistribution[h] = (honorsDistribution[h] || 0) + 1;

      const d = rec.degreeTitle || 'Unknown';
      degreeDistribution[d] = (degreeDistribution[d] || 0) + 1;
    });

    return {
      totalRegistered: totalCredentials,
      totalCohorts,
      totalAuditLogs,
      honorsDistribution,
      degreeDistribution,
    };
  } catch (err) {
    logger.warn('PostgreSQL unreachable in getRegistryStats: ' + err.message);
    return {
      totalRegistered: memoryCredentials.size,
      totalCohorts: memoryCohorts.size,
      totalAuditLogs: memoryAuditLogs.length,
      honorsDistribution: {},
      degreeDistribution: {},
    };
  }
};

export default {
  initDb,
  findUserByEmail,
  findUserById,
  saveUser,
  listUsers,
  saveCredentialRecord,
  getCredentialByTokenId,
  getCredentialByDocHash,
  queryCredentials,
  saveCohort,
  listCohorts,
  getCohortById,
  logAudit,
  listAuditLogs,
  getRegistryStats,
};
