import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ProductService } from "./product.service";
import { success, page as pageResponse } from "../../utils/response";
import { authenticate } from "../../middlewares/auth";

const router = Router();
const productService = new ProductService();
router.use(authenticate);

const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  categoryId: z.number().optional(),
  images: z.string().optional(),
});

/** GET /api/products — 列表 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, keyword, categoryId, status } = req.query;
    const result = await productService.list({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      keyword: keyword as string,
      categoryId: categoryId ? Number(categoryId) : undefined,
      status: status !== undefined ? Number(status) : undefined,
    });
    pageResponse(res, result.list, result.total, Number(page) || 1, Number(pageSize) || 10);
  } catch (err) { next(err); }
});

/** GET /api/products/:id — 详情 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getById(Number(req.params.id));
    success(res, product);
  } catch (err) { next(err); }
});

/** POST /api/products — 新增 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = productSchema.parse(req.body);
    const product = await productService.create(dto);
    success(res, product, "创建成功");
  } catch (err) { next(err); }
});

/** PUT /api/products/:id — 编辑 */
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = productSchema.partial().parse(req.body);
    await productService.update(Number(req.params.id), dto);
    success(res, null, "更新成功");
  } catch (err) { next(err); }
});

/** DELETE /api/products/:id — 删除 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await productService.delete(Number(req.params.id));
    success(res, null, "删除成功");
  } catch (err) { next(err); }
});

export default router;
