import request from "./request";

export interface OrderItem {
  id: number;
  orderNo: string;
  userId: number;
  user: { id: number; username: string };
  totalAmount: number;
  status: number;
  address: string;
  remark: string | null;
  items: Array<{
    id: number;
    productId: number;
    product: { id: number; name: string; images: string };
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const orderApi = {
  list: (params: { page?: number; pageSize?: number; orderNo?: string; status?: number }) =>
    request.get<{ code: number; data: { list: OrderItem[]; total: number } }>("/orders", { params }),

  detail: (id: number) => request.get<{ code: number; data: OrderItem }>(`/orders/${id}`),

  create: (data: {
    totalAmount: number;
    address: string;
    remark?: string;
    items: Array<{ productId: number; quantity: number; price: number }>;
  }) => request.post<{ code: number; data: OrderItem; message: string }>("/orders", data),

  myOrders: (params?: { page?: number; pageSize?: number; status?: number }) =>
    request.get<{ code: number; data: { list: OrderItem[]; total: number } }>("/orders/my", { params }),

  updateStatus: (id: number, status: number) => request.put(`/orders/${id}/status`, { status }),
};
