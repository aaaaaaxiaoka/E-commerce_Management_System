import { Response } from "express";

/**
 * 统一响应格式
 */
export function success(res: Response, data: any = null, message = "ok") {
  return res.json({ code: 200, message, data });
}

export function page(res: Response, list: any[], total: number, page: number, pageSize: number) {
  return res.json({ code: 200, message: "ok", data: { list, total, page, pageSize } });
}

export function fail(res: Response, message = "error", code = 400) {
  return res.status(code).json({ code, message, data: null });
}
