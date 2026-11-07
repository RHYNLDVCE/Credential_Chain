import prisma from '../lib/prisma.js';

export const UserModel = {
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });
  },

  async findMany() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async create(data) {
    return await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: data.password,
        name: data.name,
        role: data.role || 'OFFICER',
        department: data.department || null,
      },
    });
  },

  async count() {
    return await prisma.user.count();
  },
};

export default UserModel;
