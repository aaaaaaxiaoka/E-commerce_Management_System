import request from "./request";

export interface ProductItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: string;
  status: number;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const productApi = {
  list: (params: { page?: number; pageSize?: number; keyword?: string; categoryId?: number; status?: number }) =>
    request.get<{ code: number; data: { list: ProductItem[]; total: number } }>("/products", { params }),

  create: (data: Partial<ProductItem>) => request.post("/products", data),

  update: (id: number, data: Partial<ProductItem>) => request.put(`/products/${id}`, data),

  remove: (id: number) => request.delete(`/products/${id}`),

  getById: (id: number) => request.get<{ code: number; data: ProductItem }>(`/products/${id}`),
};

export interface CategoryItem {
  id: number;
  name: string;
  parentId: number | null;
  children: CategoryItem[];
}

export const categoryApi = {
  list: () => request.get<{ code: number; data: CategoryItem[] }>("/categories"),
};
