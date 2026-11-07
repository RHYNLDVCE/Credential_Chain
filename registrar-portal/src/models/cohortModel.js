import prisma from '../lib/prisma.js';

export const CohortModel = {
  async findMany({ skip = 0, take = 50 } = {}) {
    return await prisma.cohort.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        records: true,
        credentials: true,
      },
    });
  },

  async findById(id) {
    return await prisma.cohort.findUnique({
      where: { id },
      include: {
        records: true,
        credentials: true,
      },
    });
  },

  async createWithRecords({ name, createdBy, records }) {
    return await prisma.cohort.create({
      data: {
        name,
        createdBy,
        records: {
          create: records.map((r) => ({
            studentAddress: r.studentAddress.toLowerCase(),
            studentName: r.studentName,
            studentId: r.studentId,
            degreeTitle: r.degreeTitle,
            graduationDate: r.graduationDate,
            honors: r.honors || null,
            major: r.major || null,
            docHash: r.docHash,
            ipfsCID: r.ipfsCID,
            status: r.status || 'PENDING',
          })),
        },
      },
      include: { records: true },
    });
  },

  async updateRecordStatus(recordId, status, error = null) {
    return await prisma.cohortRecord.update({
      where: { id: recordId },
      data: { status, error },
    });
  },

  async count() {
    return await prisma.cohort.count();
  },
};

export default CohortModel;
