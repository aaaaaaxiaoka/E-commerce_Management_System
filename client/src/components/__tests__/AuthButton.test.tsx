import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthButton from "../auth/AuthButton";

// Mock useAuthStore
vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: (selector: any) => {
    const state = {
      hasPermission: (code: string) => {
        const perms = ["admin", "user:list", "product:create"];
        return perms.includes(code);
      },
    };
    return selector(state);
  },
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  Navigate: () => null,
}));

describe("AuthButton", () => {
  it("should render when user has permission", () => {
    const { container } = render(<AuthButton permission="user:list">编辑</AuthButton>);
    // Ant Design 在中文字符间插入空格，检查按钮存在即可
    expect(container.querySelector("button")).toBeInTheDocument();
    expect(container.querySelector("button")?.textContent?.replace(/\s/g, "")).toBe("编辑");
  });

  it("should not render when user lacks permission", () => {
    const { container } = render(
      <AuthButton permission="order:delete">删除</AuthButton>
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render when no permission required", () => {
    render(<AuthButton>普通按钮</AuthButton>);
    expect(screen.getByText("普通按钮")).toBeInTheDocument();
  });
});
