import request from "./request";

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  nickname: string | null;
  realName: string | null;
  idNumber: string | null;
  gender: number;
  birthday: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  status: number;
  createdAt: string;
  roles: string[];
  permissions: string[];
  menus: MenuItem[];
}

export type ProfileUpdateData = Partial<{
  email: string;
  phone: string;
  avatar: string;
  nickname: string;
  realName: string;
  idNumber: string;
  gender: number;
  birthday: string;
  province: string;
  city: string;
  district: string;
}>;

export interface MenuItem {
  id: number;
  parentId: number | null;
  name: string;
  path: string | null;
  icon: string | null;
  sort: number;
  hidden: boolean;
  permission: string | null;
  children?: MenuItem[];
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export const authApi = {
  login: (params: LoginParams) =>
    request.post<{ code: number; data: LoginResult }>("/auth/login", params),

  register: (params: RegisterParams) =>
    request.post<{ code: number; data: any }>("/auth/register", params),

  refresh: (refreshToken: string) =>
    request.post<{ code: number; data: { accessToken: string; refreshToken: string } }>(
      "/auth/refresh",
      { refreshToken }
    ),

  logout: () => request.post("/auth/logout"),

  getProfile: () =>
    request.get<{ code: number; data: UserInfo }>("/auth/profile"),

  updateProfile: (data: ProfileUpdateData) =>
    request.patch<{ code: number; data: UserInfo; message: string }>("/auth/profile", data),
};
