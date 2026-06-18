import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error("[Error]", err);

  // Zod 校验错误
  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 400,
      message: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      data: null,
    });
  }

  // Prisma 唯一约束错误
  if (err.code === "P2002") {
    return res.status(409).json({
      code: 409,
      message: `${err.meta?.target?.[0] ?? "字段"} 已存在`,
      data: null,
    });
  }

  const status = err.status || 500;
  return res.status(status).json({
    code: status,
    message: err.message || "服务器内部错误",
    data: null,
  });
}
