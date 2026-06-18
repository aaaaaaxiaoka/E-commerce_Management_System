const PREFIX = "adminflow_";

export const storage = {
  get<T = any>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: any) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove(key: string) {
    localStorage.removeItem(PREFIX + key);
  },
  clear() {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  },
};
