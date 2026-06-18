import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export class UserService {
  async list(query: { page?: number; pageSize?: number; keyword?: string; status?: number }) {
    const { page = 1, pageSize = 10, keyword, status } = query;
    const where: any = {};
    if (keyword) where.OR = [{ username: { contains: keyword } }, { email: { contains: keyword } }];
    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, username: true, email: true, avatar: true, status: true,
          createdAt: true,
          roles: { include: { role: { select: { id: true, name: true, label: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { list: list.map((u) => ({ ...u, roles: u.roles.map((r) => r.role) })), total };
  }

  async create(dto: { username: string; email: string; password: string; roleIds?: number[] }) {
    const existed = await prisma.user.findFirst({ where: { OR: [{ username: dto.username }, { email: dto.email }] } });
    if (existed) throw Object.assign(new Error("用户名或邮箱已存在"), { status: 409 });

    const user = await prisma.user.create({
      data: { username: dto.username, email: dto.email, password: await bcrypt.hash(dto.password, 10) },
    });

    if (dto.roleIds?.length) {
      await prisma.userRole.createMany({
        data: dto.roleIds.map((roleId) => ({ userId: user.id, roleId })),
      });
    }

    return { id: user.id, username: user.username, email: user.email };
  }

  async update(id: number, dto: { email?: string; status?: number; roleIds?: number[] }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw Object.assign(new Error("用户不存在"), { status: 404 });

    const data: any = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.status !== undefined) data.status = dto.status;

    if (Object.keys(data).length) {
      await prisma.user.update({ where: { id }, data });
    }

    // 更新角色
    if (dto.roleIds !== undefined) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      if (dto.roleIds.length) {
        await prisma.userRole.createMany({ data: dto.roleIds.map((roleId) => ({ userId: id, roleId })) });
      }
    }

    return { id };
  }

  async delete(id: number) {
    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    return { id };
  }

  async getById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, email: true, avatar: true, status: true, createdAt: true,
        roles: { include: { role: true } },
      },
    });
    if (!user) throw Object.assign(new Error("用户不存在"), { status: 404 });
    return { ...user, roles: user.roles.map((r) => r.role) };
  }
}
