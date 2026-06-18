import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { success } from "../../utils/response";
import { authenticate } from "../../middlewares/auth";

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);

/** GET /api/dashboard/stats — 仪表盘核心指标 */
router.get("/stats", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [productCount, userCount, orderCount, todayOrders, todayRevenue, recentOrders] =
      await Promise.all([
        prisma.product.count({ where: { status: 1 } }),
        prisma.user.count(),
        prisma.order.count(),
        // 今日订单数
        prisma.order.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        // 今日销售额
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            status: { not: 5 },
          },
        }),
        // 最近 10 条订单
        prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true, orderNo: true, totalAmount: true, status: true, createdAt: true,
            user: { select: { username: true } },
          },
        }),
      ]);

    success(res, {
      productCount,
      userCount,
      orderCount,
      todayOrders,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/dashboard/charts — 图表数据 */
router.get("/charts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Number(req.query.days) || 7;

    // 销售趋势（按天）
    const dateList: Date[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      dateList.push(d);
    }

    const trendData: { date: string; orders: number; revenue: number }[] = [];
    for (const date of dateList) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const [count, revenue] = await Promise.all([
        prisma.order.count({
          where: { createdAt: { gte: date, lt: nextDay }, status: { not: 5 } },
        }),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { createdAt: { gte: date, lt: nextDay }, status: { not: 5 } },
        }),
      ]);

      trendData.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        orders: count,
        revenue: Number(revenue._sum.totalAmount || 0),
      });
    }

    // 订单状态分布
    const statusDistribution = await Promise.all(
      [1, 2, 3, 4, 5].map(async (status) => {
        const count = await prisma.order.count({ where: { status } });
        const labels = ["待付款", "待发货", "待收货", "已完成", "已取消"];
        return { status, name: labels[status - 1], count };
      })
    );

    // 分类商品数量
    const categoryDistribution = await prisma.category.findMany({
      select: {
        name: true,
        _count: { select: { products: true } },
      },
    });

    success(res, {
      trend: trendData,
      statusDistribution,
      categoryDistribution: categoryDistribution.map((c) => ({
        name: c.name,
        count: c._count.products,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
