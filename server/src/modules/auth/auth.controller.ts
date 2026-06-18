import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { success, fail } from "../../utils/response";
import { authenticate } from "../../middlewares/auth";

const router = Router();
const authService = new AuthService();

// 输入校验
const registerSchema = z.object({
  username: z.string().min(3, "用户名至少3位").max(30),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6位"),
});

const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

/**
 * POST /api/auth/register — 注册
 */
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = registerSchema.parse(req.body);
    const user = await authService.register(dto);
    success(res, user, "注册成功");
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login — 登录
 */
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = loginSchema.parse(req.body);
    const result = await authService.login(dto);
    success(res, result, "登录成功");
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh — 刷新 Token
 */
router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return fail(res, "缺少 Refresh Token", 400);
    }
    const tokens = await authService.refresh(refreshToken);
    success(res, tokens, "刷新成功");
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout — 登出
 */
router.post("/logout", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logout(req.user!.userId);
    success(res, null, "已登出");
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/profile — 获取当前用户信息
 */
router.get("/profile", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getProfile(req.user!.userId);
    success(res, user);
  } catch (err) {
    next(err);
  }
});

// 个人信息更新校验
const updateProfileSchema = z.object({
  email: z.string().email("邮箱格式不正确").optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确").optional(),
  avatar: z.string().optional(),
  nickname: z.string().max(30, "昵称最长30位").optional(),
  realName: z.string().max(50, "真实姓名最长50位").optional(),
  idNumber: z.string().regex(/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, "身份证号格式不正确").optional(),
  gender: z.number().int().min(0).max(2).optional(),
  birthday: z.string().datetime().optional(),
  province: z.string().max(50).optional(),
  city: z.string().max(50).optional(),
  district: z.string().max(50).optional(),
});

/**
 * PATCH /api/auth/profile — 更新当前用户个人信息
 */
router.patch("/profile", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user!.userId, dto);
    success(res, user, "个人信息更新成功");
  } catch (err) {
    next(err);
  }
});

export default router;
