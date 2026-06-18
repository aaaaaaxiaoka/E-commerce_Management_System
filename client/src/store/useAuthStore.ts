import { create } from "zustand";
import type { UserInfo, LoginParams, MenuItem, ProfileUpdateData } from "@/api/auth";
import { authApi } from "@/api/auth";
import { storage } from "@/utils/storage";
import { useCartStore } from "./useCartStore";

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  permissions: string[];
  menuTree: MenuItem[];

  // actions
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  /**
   * 权限判断
   */
  hasPermission: (code: string) => boolean;
  /**
   * 管理员判断
   */
  isAdmin: () => boolean;
  /**
   * 更新个人信息
   */
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: storage.get<string>("accessToken"),
  user: storage.get<UserInfo>("user"),
  permissions: storage.get<string[]>("permissions") || [],
  menuTree: storage.get<MenuItem[]>("menuTree") || [],

  login: async (params: LoginParams) => {
    const res = await authApi.login(params);
    const { accessToken, refreshToken, user } = res.data.data;

    // 持久化 Token + 用户信息（刷新页面时恢复）
    storage.set("accessToken", accessToken);
    storage.set("refreshToken", refreshToken);
    storage.set("permissions", user.permissions || []);

    // 构建菜单树（将扁平菜单转为嵌套结构）
    const menuTree = buildMenuTree(user.menus || []);
    storage.set("menuTree", menuTree);

    // 清理敏感字段后持久化用户信息
    const { menus, permissions: _perms, ...safeUser } = user;
    storage.set("user", safeUser);

    set({
      token: accessToken,
      user,
      permissions: user.permissions || [],
      menuTree,
    });

    // 切换购物车到当前用户：写入用户标识 → 重新加载该用户的购物车
    localStorage.setItem("adminflow_cart_user", String(user.id));
    useCartStore.persist.rehydrate();
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      storage.clear();
      set({ token: null, user: null, permissions: [], menuTree: [] });
      // 清空当前购物车（内存中），数据仍保留在该用户的 localStorage key 下
      useCartStore.setState({ items: [] });
      localStorage.removeItem("adminflow_cart_user");
    }
  },

  fetchProfile: async () => {
    try {
      const res = await authApi.getProfile();
      // profile 不返回 menus/permissions，需要用 login 时的数据
      const current = get();
      const user = { ...current.user, ...res.data.data } as UserInfo;
      storage.set("user", user);
      set({ user });
    } catch {
      // Token 失效了，清空状态
      storage.clear();
      set({ token: null, user: null, permissions: [], menuTree: [] });
    }
  },

  hasPermission: (code: string) => {
    const { permissions } = get();
    return permissions.includes("admin") || permissions.includes(code);
  },

  isAdmin: () => {
    return get().permissions.includes("admin");
  },

  updateProfile: async (data: ProfileUpdateData) => {
    const res = await authApi.updateProfile(data);
    const updatedUser = res.data.data;
    const current = get().user;
    if (current) {
      const user = { ...current, ...updatedUser } as UserInfo;
      storage.set("user", user);
      set({ user });
    }
  },
}));

// -------- 工具函数：扁平菜单 → 嵌套菜单 --------

function buildMenuTree(flatList: MenuItem[]): MenuItem[] {
  const map = new Map<number, MenuItem>();
  const tree: MenuItem[] = [];

  flatList
    .sort((a, b) => a.sort - b.sort)
    .forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

  map.forEach((item) => {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(item);
    } else if (!item.parentId) {
      tree.push(item);
    }
  });

  // 清理空的 children
  const cleanEmpty = (nodes: MenuItem[]) => {
    for (const node of nodes) {
      if (node.children?.length === 0) delete node.children;
      if (node.children) cleanEmpty(node.children);
    }
  };
  cleanEmpty(tree);

  return tree;
}

// 启动时自动加载用户信息（页面刷新后恢复）
const token = storage.get<string>("accessToken");
if (token) {
  useAuthStore.getState().fetchProfile();
}
