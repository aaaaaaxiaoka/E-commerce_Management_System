import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";

const prisma = new PrismaClient();

export class AuthService {
  /**
   * 注册
   */
  async register(dto: { username: string; email: string; password: string }) {
    // 检查是否已存在
    const existed = await prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });
    if (existed) {
      throw Object.assign(new Error("用户名或邮箱已存在"), { status: 409 });
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await prisma.user.create({
      data: { username: dto.username, email: dto.email, password: hashed },
    });

    // 默认赋予 guest 角色
    const guestRole = await prisma.role.findUnique({ where: { name: "guest" } });
    if (guestRole) {
      await prisma.userRole.create({ data: { userId: user.id, roleId: guestRole.id } });
    }

    return { id: user.id, username: user.username, email: user.email };
  }

  /**
   * 登录
   */
  async login(dto: { username: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) {
      throw Object.assign(new Error("用户不存在，请先注册"), { status: 401, code: "USER_NOT_FOUND" });
    }

    if (user.status === 0) {
      throw Object.assign(new Error("账号已被禁用"), { status: 403 });
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw Object.assign(new Error("用户名或密码错误"), { status: 401 });
    }

    const payload = { userId: user.id, username: user.username };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // 存储 Refresh Token（用于无感刷新和登出）
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // 查询用户角色和权限
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
                menus: { include: { menu: true } },
              },
            },
          },
        },
      },
    });

    const permissions: string[] = [];
    const menus: any[] = [];
    const roles: string[] = [];
    const seenPermissions = new Set<string>();
    const seenMenus = new Set<number>();

    for (const ur of userWithRoles?.roles ?? []) {
      roles.push(ur.role.name);
      for (const rp of ur.role.permissions) {
        if (!seenPermissions.has(rp.permission.code)) {
          permissions.push(rp.permission.code);
          seenPermissions.add(rp.permission.code);
        }
      }
      for (const rm of ur.role.menus) {
        if (!seenMenus.has(rm.menu.id)) {
          menus.push(rm.menu);
          seenMenus.add(rm.menu.id);
        }
      }
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        roles,
        permissions,
        menus,
      },
    };
  }

  /**
   * 刷新 Token（无感刷新）
   */
  async refresh(token: string) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw Object.assign(new Error("Refresh Token 已过期，请重新登录"), { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== token) {
      throw Object.assign(new Error("Refresh Token 无效"), { status: 401 });
    }

    const newPayload = { userId: user.id, username: user.username };
    const accessToken = signAccessToken(newPayload);
    const refreshToken = signRefreshToken(newPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }

  /**
   * 登出
   */
  async logout(userId: number) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * 获取当前用户信息
   */
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, email: true, avatar: true, status: true, createdAt: true,
        phone: true, nickname: true, realName: true, gender: true, birthday: true,
        province: true, city: true, district: true,
      },
    });
    return user;
  }

  /**
   * 更新当前用户个人信息
   */
  async updateProfile(userId: number, dto: {
    email?: string; phone?: string; avatar?: string;
    nickname?: string; realName?: string; idNumber?: string;
    gender?: number; birthday?: string;
    province?: string; city?: string; district?: string;
  }) {
    return prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true, username: true, email: true, avatar: true, status: true, createdAt: true,
        phone: true, nickname: true, realName: true, gender: true, birthday: true,
        province: true, city: true, district: true,
      },
    });
  }
}
