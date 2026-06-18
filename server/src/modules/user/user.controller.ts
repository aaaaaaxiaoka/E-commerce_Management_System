import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UserService } from "./user.service";
import { success, page as pageResponse, fail } from "../../utils/response";
import { authenticate } from "../../middlewares/auth";

const router = Router();
const userService = new UserService();

// 全部接口需要登录
router.use(authenticate);

const createSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  roleIds: z.array(z.number()).optional(),
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  status: z.number().min(0).max(1).optional(),
  roleIds: z.array(z.number()).optional(),
});

/** GET /api/users — 分页列表 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, keyword, status } = req.query;
    const result = await userService.list({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      keyword: keyword as string,
      status: status !== undefined ? Number(status) : undefined,
    });
    pageResponse(res, result.list, result.total, Number(page) || 1, Number(pageSize) || 10);
  } catch (err) { next(err); }
});

/** GET /api/users/:id — 详情 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getById(Number(req.params.id));
    success(res, user);
  } catch (err) { next(err); }
});

/** POST /api/users — 新增 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createSchema.parse(req.body);
    const user = await userService.create(dto);
    success(res, user, "创建成功");
  } catch (err) { next(err); }
});

/** PUT /api/users/:id — 编辑 */
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = updateSchema.parse(req.body);
    await userService.update(Number(req.params.id), dto);
    success(res, null, "更新成功");
  } catch (err) { next(err); }
});

/** DELETE /api/users/:id — 删除 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.delete(Number(req.params.id));
    success(res, null, "删除成功");
  } catch (err) { next(err); }
});

export default router;
