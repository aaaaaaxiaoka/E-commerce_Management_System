import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { success } from "../../utils/response";
import { authenticate } from "../../middlewares/auth";

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

/** GET /api/permissions — 全部权限列表（用于角色分配） */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.permission.findMany({ orderBy: { code: "asc" } });
    success(res, list);
  } catch (err) { next(err); }
});

export default router;
