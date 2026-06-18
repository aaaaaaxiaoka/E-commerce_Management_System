import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class OrderService {
  async list(query: { page?: number; pageSize?: number; orderNo?: string; status?: number }) {
    const { page = 1, pageSize = 10, orderNo, status } = query;
    const where: any = {};
    if (orderNo) where.orderNo = { contains: orderNo };
    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, username: true } },
          items: { include: { product: { select: { id: true, name: true, images: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return { list, total };
  }

  async create(dto: {
    userId: number;
    totalAmount: number;
    address: string; // JSON string
    remark?: string;
    items: Array<{ productId: number; quantity: number; price: number }>;
  }) {
    // 生成订单号
    const orderNo = "ORD" + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();

    const order = await prisma.order.create({
      data: {
        orderNo,
        userId: dto.userId,
        totalAmount: dto.totalAmount,
        address: dto.address,
        remark: dto.remark,
        status: 1,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });

    // 扣减库存
    for (const item of dto.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return order;
  }

  async listByUser(query: { userId: number; page?: number; pageSize?: number; status?: number }) {
    const { userId, page = 1, pageSize = 10, status } = query;
    const where: any = { userId };
    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: { include: { product: { select: { id: true, name: true, images: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return { list, total };
  }

  async getById(id: number) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
      },
    });
    if (!order) throw Object.assign(new Error("订单不存在"), { status: 404 });
    return order;
  }

  async updateStatus(id: number, status: number) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw Object.assign(new Error("订单不存在"), { status: 404 });

    // 状态流转校验
    const validTransitions: Record<number, number[]> = {
      1: [2, 5], // 待付款 → 待发货 / 取消
      2: [3],    // 待发货 → 待收货
      3: [4],    // 待收货 → 已完成
      4: [],     // 已完成 → 不可变更
      5: [],     // 已取消 → 不可变更
    };

    if (!validTransitions[order.status].includes(status)) {
      throw Object.assign(new Error("订单状态不允许此操作"), { status: 400 });
    }

    // 取消时恢复库存
    if (status === 5) {
      const orderItems = await prisma.orderItem.findMany({ where: { orderId: id } });
      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return prisma.order.update({ where: { id }, data: { status } });
  }
}
