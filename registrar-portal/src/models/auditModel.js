import prisma from '../lib/prisma.js';

export const AuditModel = {
  async log({ action, entityType, entityId = null, actor = 'SYSTEM', details = null, ipAddress = null }) {
    return await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId: entityId ? entityId.toString() : null,
        actor,
        details: details ? (typeof details === 'string' ? JSON.parse(details) : details) : null,
        ipAddress,
      },
    });
  },

  async findMany({ skip = 0, take = 100, where = {} } = {}) {
    return await prisma.auditLog.findMany({
      skip,
      take,
      where,
      orderBy: { timestamp: 'desc' },
    });
  },

  async count(where = {}) {
    return await prisma.auditLog.count({ where });
  },
};

export default AuditModel;
