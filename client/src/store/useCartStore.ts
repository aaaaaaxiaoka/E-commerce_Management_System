import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string; // first image URL
  quantity: number;
}

interface CartState {
  items: CartItem[];

  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalCount: () => number;
  totalAmount: () => number;
}

/**
 * 获取当前用户 ID（登录时由 useAuthStore 写入）
 */
function getCurrentUserId(): string | null {
  try {
    return localStorage.getItem("adminflow_cart_user");
  } catch {
    return null;
  }
}

/**
 * 用户隔离的 localStorage 适配器
 * - 已登录：读写 shop-cart-{userId}
 * - 未登录：读写 shop-cart-guest（临时，不会跨用户泄漏）
 */
const scopedStorage = createJSONStorage<CartState>(() => {
  const storage = localStorage;
  return {
    getItem: (baseName: string) => {
      const userId = getCurrentUserId();
      const key = userId ? `${baseName}-${userId}` : `${baseName}-guest`;
      return storage.getItem(key);
    },
    setItem: (baseName: string, value: string) => {
      const userId = getCurrentUserId();
      const key = userId ? `${baseName}-${userId}` : `${baseName}-guest`;
      storage.setItem(key, value);
    },
    removeItem: (baseName: string) => {
      const userId = getCurrentUserId();
      const key = userId ? `${baseName}-${userId}` : `${baseName}-guest`;
      storage.removeItem(key);
    },
  };
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        const existing = items.find((i) => i.productId === item.productId);
        const qty = item.quantity ?? 1;

        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + qty }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: qty }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalAmount: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "shop-cart",
      storage: scopedStorage,
    }
  )
);
