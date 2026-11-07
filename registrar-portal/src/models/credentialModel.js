import prisma from '../lib/prisma.js';

export const CredentialModel = {
  async findMany({ skip = 0, take = 20, where = {}, orderBy = { issuedAt: 'desc' } } = {}) {
    return await prisma.credential.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        fileInfo: true,
        revocation: true,
        recoveryHistory: { orderBy: { timestamp: 'desc' } },
      },
    });
  },

  async count(where = {}) {
    return await prisma.credential.count({ where });
  },

  async findByTokenId(tokenId) {
    return await prisma.credential.findUnique({
      where: { tokenId: BigInt(tokenId) },
      include: {
        fileInfo: true,
        revocation: true,
        recoveryHistory: { orderBy: { timestamp: 'desc' } },
      },
    });
  },

  async findByDocHash(docHash) {
    return await prisma.credential.findFirst({
      where: { docHash },
      include: {
        fileInfo: true,
        revocation: true,
      },
    });
  },

  async findByStudentAddress(studentAddress) {
    return await prisma.credential.findMany({
      where: { studentAddress: studentAddress.toLowerCase() },
      orderBy: { issuedAt: 'desc' },
      include: { fileInfo: true, revocation: true },
    });
  },

  async create(data) {
    return await prisma.credential.create({
      data: {
        tokenId: BigInt(data.tokenId),
        studentAddress: data.studentAddress.toLowerCase(),
        studentName: data.studentName,
        studentId: data.studentId,
        degreeTitle: data.degreeTitle,
        major: data.major || null,
        honors: data.honors || null,
        graduationDate: data.graduationDate,
        docHash: data.docHash,
        ipfsCID: data.ipfsCID,
        institutionId: data.institutionId || 'MSU-TCTO',
        txHash: data.txHash,
        blockNumber: data.blockNumber ? BigInt(data.blockNumber) : null,
        issuedBy: data.issuedBy,
        cohortId: data.cohortId || null,
      },
    });
  },

  async revoke(tokenId, { reason, txHash, blockNumber, revokedBy }) {
    return await prisma.$transaction([
      prisma.credential.update({
        where: { tokenId: BigInt(tokenId) },
        data: { isRevoked: true },
      }),
      prisma.revocation.create({
        data: {
          credentialId: BigInt(tokenId),
          reason,
          txHash,
          blockNumber: blockNumber ? BigInt(blockNumber) : null,
          revokedBy,
        },
      }),
    ]);
  },

  async recordRecovery(tokenId, { previousAddress, newAddress, txHash, blockNumber, reason, recoveredBy }) {
    return await prisma.$transaction([
      prisma.credential.update({
        where: { tokenId: BigInt(tokenId) },
        data: { studentAddress: newAddress.toLowerCase() },
      }),
      prisma.keyRecovery.create({
        data: {
          credentialId: BigInt(tokenId),
          previousAddress: previousAddress.toLowerCase(),
          newAddress: newAddress.toLowerCase(),
          txHash,
          blockNumber: blockNumber ? BigInt(blockNumber) : null,
          reason,
          recoveredBy,
        },
      }),
    ]);
  },

  async getHonorsDistribution() {
    const records = await prisma.credential.findMany({
      where: { isRevoked: false },
      select: { honors: true },
    });
    return records.reduce((acc, c) => {
      const h = c.honors || 'None';
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {});
  },

  async getDegreeDistribution() {
    const records = await prisma.credential.findMany({
      where: { isRevoked: false },
      select: { degreeTitle: true },
    });
    return records.reduce((acc, c) => {
      acc[c.degreeTitle] = (acc[c.degreeTitle] || 0) + 1;
      return acc;
    }, {});
  },
};

export default CredentialModel;
