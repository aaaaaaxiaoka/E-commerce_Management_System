import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { success } from "../../utils/response";
import { authenticate } from "../../middlewares/auth";

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

/** GET /api/categories — 分类列表（树形） */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.category.findMany({
      include: { children: true },
      where: { parentId: null },
      orderBy: { sort: "asc" },
    });
    success(res, list);
  } catch (err) { next(err); }
});

/** POST /api/categories — 新增 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = z.object({ name: z.string().min(1), parentId: z.number().optional(), sort: z.number().optional() }).parse(req.body);
    const category = await prisma.category.create({ data: dto });
    success(res, category, "创建成功");
  } catch (err) { next(err); }
});

/** DELETE /api/categories/:id — 删除 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.category.delete({ where: { id: Number(req.params.id) } });
    success(res, null, "删除成功");
  } catch (err) { next(err); }
});

export default router;
