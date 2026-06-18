import { create } from "zustand";
import { storage } from "@/utils/storage";

type ThemeMode = "light" | "dark";

interface AppState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: storage.get<ThemeMode>("theme") || "light",

  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    storage.set("theme", next);
    set({ theme: next });
  },

  setTheme: (theme: ThemeMode) => {
    storage.set("theme", theme);
    set({ theme });
  },
}));
