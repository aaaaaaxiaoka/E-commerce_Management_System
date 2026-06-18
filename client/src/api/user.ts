import request from "./request";

export interface UserItem {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  status: number;
  createdAt: string;
  roles: { id: number; name: string; label: string }[];
}

export const userApi = {
  list: (params: { page?: number; pageSize?: number; keyword?: string; status?: number }) =>
    request.get<{ code: number; data: { list: UserItem[]; total: number } }>("/users", { params }),

  create: (data: { username: string; email: string; password: string; roleIds?: number[] }) =>
    request.post("/users", data),

  update: (id: number, data: { email?: string; status?: number; roleIds?: number[] }) =>
    request.put(`/users/${id}`, data),

  remove: (id: number) => request.delete(`/users/${id}`),
};
