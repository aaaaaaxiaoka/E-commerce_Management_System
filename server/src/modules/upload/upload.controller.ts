import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { success } from "../../utils/response";
import { authenticate } from "../../middlewares/auth";

const router = Router();
router.use(authenticate);

// 确保上传目录存在
const uploadDir = path.resolve(__dirname, "../../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// multer 配置
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 jpg/png/gif/webp/svg 格式"));
    }
  },
});

/** POST /api/upload — 单文件上传 */
router.post("/", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: "请选择文件", data: null });
  }
  const url = `/uploads/${req.file.filename}`;
  success(res, { url, filename: req.file.filename, size: req.file.size }, "上传成功");
});

/** POST /api/upload/multiple — 多文件上传 */
router.post("/multiple", upload.array("files", 9), (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[])?.map((f) => ({
    url: `/uploads/${f.filename}`,
    filename: f.filename,
    size: f.size,
  }));
  success(res, files, "上传成功");
});

export default router;
