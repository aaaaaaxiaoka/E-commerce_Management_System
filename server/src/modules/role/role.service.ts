import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class RoleService {
  async list() {
    return prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(dto: { name: string; label: string; permissionIds?: number[] }) {
    const role = await prisma.role.create({ data: { name: dto.name, label: dto.label } });
    if (dto.permissionIds?.length) {
      await prisma.rolePermission.createMany({
        data: dto.permissionIds.map((pid) => ({ roleId: role.id, permissionId: pid })),
      });
    }
    return role;
  }

  async update(id: number, dto: { label?: string; permissionIds?: number[] }) {
    if (dto.label !== undefined) {
      await prisma.role.update({ where: { id }, data: { label: dto.label } });
    }
    if (dto.permissionIds !== undefined) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (dto.permissionIds.length) {
        await prisma.rolePermission.createMany({
          data: dto.permissionIds.map((pid) => ({ roleId: id, permissionId: pid })),
        });
      }
    }
    return { id };
  }

  async delete(id: number) {
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.userRole.deleteMany({ where: { roleId: id } });
    await prisma.roleMenu.deleteMany({ where: { roleId: id } });
    await prisma.role.delete({ where: { id } });
    return { id };
  }
}
