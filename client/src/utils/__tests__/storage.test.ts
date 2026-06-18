import { describe, it, expect, beforeEach } from "vitest";
import { storage } from "../storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should set and get values", () => {
    storage.set("test", { name: "admin" });
    expect(storage.get("test")).toEqual({ name: "admin" });
  });

  it("should return null for missing keys", () => {
    expect(storage.get("nonexistent")).toBeNull();
  });

  it("should remove values", () => {
    storage.set("test", "value");
    storage.remove("test");
    expect(storage.get("test")).toBeNull();
  });

  it("should clear only prefixed keys", () => {
    localStorage.setItem("other", "keep");
    storage.set("key1", 1);
    storage.set("key2", 2);
    storage.clear();
    expect(storage.get("key1")).toBeNull();
    expect(storage.get("key2")).toBeNull();
    expect(localStorage.getItem("other")).toBe("keep");
  });
});
