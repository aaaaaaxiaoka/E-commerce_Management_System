import request from "./request";

export interface RoleItem {
  id: number;
  name: string;
  label: string;
  status: number;
  permissions: { roleId: number; permissionId: number; permission: { id: number; code: string; name: string } }[];
  _count: { users: number };
}

export const roleApi = {
  list: () => request.get<{ code: number; data: RoleItem[] }>("/roles"),

  create: (data: { name: string; label: string; permissionIds?: number[] }) =>
    request.post("/roles", data),

  update: (id: number, data: { label?: string; permissionIds?: number[] }) =>
    request.put(`/roles/${id}`, data),

  remove: (id: number) => request.delete(`/roles/${id}`),
};

export const permissionApi = {
  list: () => request.get<{ code: number; data: { id: number; code: string; name: string }[] }>("/permissions"),
};
