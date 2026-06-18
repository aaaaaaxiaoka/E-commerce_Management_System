import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { RoleService } from "./role.service";
import { success } from "../../utils/response";
import { authenticate } from "../../middlewares/auth";

const router = Router();
const roleService = new RoleService();
router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(2).max(30),
  label: z.string().min(2).max(30),
  permissionIds: z.array(z.number()).optional(),
});

/** GET /api/roles — 列表 */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await roleService.list();
    success(res, list);
  } catch (err) { next(err); }
});

/** POST /api/roles — 新增 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createSchema.parse(req.body);
    const role = await roleService.create(dto);
    success(res, role, "创建成功");
  } catch (err) { next(err); }
});

/** PUT /api/roles/:id — 编辑 */
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createSchema.partial().parse(req.body);
    await roleService.update(Number(req.params.id), dto);
    success(res, null, "更新成功");
  } catch (err) { next(err); }
});

/** DELETE /api/roles/:id — 删除 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await roleService.delete(Number(req.params.id));
    success(res, null, "删除成功");
  } catch (err) { next(err); }
});

export default router;
