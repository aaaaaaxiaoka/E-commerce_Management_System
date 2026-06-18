import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ProductService {
  async list(query: { page?: number; pageSize?: number; keyword?: string; categoryId?: number; status?: number }) {
    const { page = 1, pageSize = 10, keyword, categoryId, status } = query;
    const where: any = {};
    if (keyword) where.name = { contains: keyword };
    if (categoryId) where.categoryId = categoryId;
    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return { list, total };
  }

  async create(dto: { name: string; description?: string; price: number; stock: number; categoryId?: number; images?: string }) {
    return prisma.product.create({ data: dto as any });
  }

  async update(id: number, dto: { name?: string; description?: string; price?: number; stock?: number; status?: number; categoryId?: number; images?: string }) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw Object.assign(new Error("商品不存在"), { status: 404 });
    return prisma.product.update({ where: { id }, data: dto as any });
  }

  async delete(id: number) {
    await prisma.product.delete({ where: { id } });
    return { id };
  }

  async getById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product) throw Object.assign(new Error("商品不存在"), { status: 404 });
    return product;
  }
}
