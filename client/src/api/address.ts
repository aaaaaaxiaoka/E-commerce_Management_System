import request from "./request";

export interface AddressItem {
  id: number;
  userId: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  zipCode: string | null;
  tag: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddressFormData = Omit<AddressItem, "id" | "userId" | "createdAt" | "updatedAt">;

export const addressApi = {
  list: () => request.get<{ code: number; data: AddressItem[] }>("/addresses"),

  getById: (id: number) =>
    request.get<{ code: number; data: AddressItem }>(`/addresses/${id}`),

  create: (data: AddressFormData) =>
    request.post<{ code: number; data: AddressItem }>("/addresses", data),

  update: (id: number, data: Partial<AddressFormData>) =>
    request.put<{ code: number; data: AddressItem }>(`/addresses/${id}`, data),

  remove: (id: number) => request.delete(`/addresses/${id}`),

  setDefault: (id: number) =>
    request.put<{ code: number; data: AddressItem }>(`/addresses/${id}/default`),
};
