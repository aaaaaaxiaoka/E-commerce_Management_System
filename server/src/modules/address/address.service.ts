import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AddressService {
  /** 获取用户所有地址 */
  async listByUser(userId: number) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
  }

  /** 获取单个地址（校验所有权） */
  async getById(id: number, userId: number) {
    const addr = await prisma.address.findUnique({ where: { id } });
    if (!addr || addr.userId !== userId) {
      throw Object.assign(new Error("地址不存在"), { status: 404 });
    }
    return addr;
  }

  /** 创建地址 */
  async create(userId: number, dto: {
    name: string; phone: string; province: string; city: string;
    district: string; detail: string; zipCode?: string;
    tag?: string; isDefault?: boolean;
  }) {
    const { isDefault, ...data } = dto;
    if (isDefault) {
      await prisma.$transaction(async (tx) => {
        await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
        return tx.address.create({ data: { ...data, userId, isDefault: true } });
      });
      return prisma.address.findFirst({ where: { userId, isDefault: true } })!;
    }
    return prisma.address.create({ data: { ...data, userId } });
  }

  /** 更新地址（校验所有权） */
  async update(id: number, userId: number, dto: {
    name?: string; phone?: string; province?: string; city?: string;
    district?: string; detail?: string; zipCode?: string;
    tag?: string; isDefault?: boolean;
  }) {
    const addr = await prisma.address.findUnique({ where: { id } });
    if (!addr || addr.userId !== userId) {
      throw Object.assign(new Error("地址不存在"), { status: 404 });
    }
    const { isDefault, ...data } = dto;
    if (isDefault) {
      await prisma.$transaction(async (tx) => {
        await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
        return tx.address.update({ where: { id }, data: { ...data, isDefault: true } });
      });
      return prisma.address.findUnique({ where: { id } })!;
    }
    return prisma.address.update({ where: { id }, data });
  }

  /** 删除地址（校验所有权） */
  async delete(id: number, userId: number) {
    const addr = await prisma.address.findUnique({ where: { id } });
    if (!addr || addr.userId !== userId) {
      throw Object.assign(new Error("地址不存在"), { status: 404 });
    }
    return prisma.address.delete({ where: { id } });
  }

  /** 设为默认地址 */
  async setDefault(id: number, userId: number) {
    const addr = await prisma.address.findUnique({ where: { id } });
    if (!addr || addr.userId !== userId) {
      throw Object.assign(new Error("地址不存在"), { status: 404 });
    }
    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return prisma.address.findUnique({ where: { id } });
  }
}
