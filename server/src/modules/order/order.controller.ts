import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { OrderService } from "./order.service";
import { success, page as pageResponse } from "../../utils/response";
import { authenticate } from "../../middlewares/auth";

const router = Router();
const orderService = new OrderService();
router.use(authenticate);

/** GET /api/orders/my — 当前用户订单列表 */
router.get("/my", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, status } = req.query;
    const result = await orderService.listByUser({
      userId: req.user!.userId,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      status: status !== undefined ? Number(status) : undefined,
    });
    pageResponse(res, result.list, result.total, Number(page) || 1, Number(pageSize) || 10);
  } catch (err) { next(err); }
});

/** GET /api/orders — 列表（管理端） */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, orderNo, status } = req.query;
    const result = await orderService.list({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      orderNo: orderNo as string,
      status: status !== undefined ? Number(status) : undefined,
    });
    pageResponse(res, result.list, result.total, Number(page) || 1, Number(pageSize) || 10);
  } catch (err) { next(err); }
});

/** GET /api/orders/:id — 详情 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getById(Number(req.params.id));
    success(res, order);
  } catch (err) { next(err); }
});

/** POST /api/orders — 创建订单（用户下单） */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      totalAmount: z.number().min(0),
      address: z.string(),
      remark: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().int().min(1),
        price: z.number().min(0),
      })),
    });
    const dto = schema.parse(req.body);
    const order = await orderService.create({
      ...dto,
      userId: req.user!.userId,
    });
    success(res, order, "下单成功");
  } catch (err) { next(err); }
});

/** PUT /api/orders/:id/status — 变更状态（发货/完成/取消） */
router.put("/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({ status: z.number().int().min(1).max(5) }).parse(req.body);
    await orderService.updateStatus(Number(req.params.id), status);
    success(res, null, "操作成功");
  } catch (err) { next(err); }
});

export default router;
