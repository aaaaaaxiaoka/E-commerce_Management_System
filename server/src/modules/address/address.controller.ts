import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AddressService } from "./address.service";
import { success } from "../../utils/response";
import { authenticate } from "../../middlewares/auth";

const router = Router();
const addressService = new AddressService();
router.use(authenticate);

// 地址校验 Schema
const addressSchema = z.object({
  name: z.string().min(1, "请输入收货人"),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确"),
  province: z.string().min(1, "请选择省份"),
  city: z.string().min(1, "请选择城市"),
  district: z.string().min(1, "请选择区县"),
  detail: z.string().min(1, "请输入详细地址"),
  zipCode: z.string().optional(),
  tag: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const addressUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  province: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  detail: z.string().min(1).optional(),
  zipCode: z.string().optional(),
  tag: z.string().optional(),
  isDefault: z.boolean().optional(),
});

/** GET /api/addresses — 我的地址列表 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await addressService.listByUser(req.user!.userId);
    success(res, list);
  } catch (err) { next(err); }
});

/** GET /api/addresses/:id — 地址详情 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addr = await addressService.getById(Number(req.params.id), req.user!.userId);
    success(res, addr);
  } catch (err) { next(err); }
});

/** POST /api/addresses — 新增地址 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = addressSchema.parse(req.body);
    const addr = await addressService.create(req.user!.userId, dto);
    success(res, addr, "地址添加成功");
  } catch (err) { next(err); }
});

/** PUT /api/addresses/:id — 更新地址 */
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = addressUpdateSchema.parse(req.body);
    const addr = await addressService.update(Number(req.params.id), req.user!.userId, dto);
    success(res, addr, "地址更新成功");
  } catch (err) { next(err); }
});

/** DELETE /api/addresses/:id — 删除地址 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await addressService.delete(Number(req.params.id), req.user!.userId);
    success(res, null, "地址删除成功");
  } catch (err) { next(err); }
});

/** PUT /api/addresses/:id/default — 设为默认 */
router.put("/:id/default", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addr = await addressService.setDefault(Number(req.params.id), req.user!.userId);
    success(res, addr, "已设为默认地址");
  } catch (err) { next(err); }
});

export default router;
