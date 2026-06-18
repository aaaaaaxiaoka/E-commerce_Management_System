import express from "express";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./modules/auth/auth.controller";
import userRoutes from "./modules/user/user.controller";
import roleRoutes from "./modules/role/role.controller";
import permissionRoutes from "./modules/role/permission.controller";
import productRoutes from "./modules/product/product.controller";
import categoryRoutes from "./modules/product/category.controller";
import orderRoutes from "./modules/order/order.controller";
import uploadRoutes from "./modules/upload/upload.controller";
import dashboardRoutes from "./modules/common/dashboard.controller";
import addressRoutes from "./modules/address/address.controller";
import path from "path";

const app = express();

// -------- 全局中间件 --------
app.use(compression()); // gzip 压缩响应
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API 限流：15 分钟内最多 1000 次
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { code: 429, message: "请求过于频繁，请稍后再试", data: null },
}));

// 静态文件服务（上传的图片）
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// -------- 路由 --------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/addresses", addressRoutes);

// 健康检查
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// -------- 错误处理（必须在路由之后）--------
app.use(errorHandler);

// -------- 启动 --------
app.listen(config.port, () => {
  console.log(`🚀 Server running at http://localhost:${config.port}`);
});

export default app;
