import { Button, ButtonProps, Popconfirm } from "antd";
import { useAuthStore } from "@/store/useAuthStore";

interface AuthButtonProps extends ButtonProps {
  /** 所需权限码，如 "user:delete" */
  permission?: string;
  /** 是否显示确认弹窗 */
  confirm?: string;
  onConfirm?: () => void;
}

/**
 * 带权限控制的按钮：无权限时不渲染
 */
export default function AuthButton({ permission, confirm, onConfirm, children, ...props }: AuthButtonProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (permission && !hasPermission(permission)) {
    return null;
  }

  if (confirm) {
    return (
      <Popconfirm title={confirm} onConfirm={onConfirm || (props.onClick as any)} okText="确认" cancelText="取消">
        <Button {...props} onClick={undefined}>{children}</Button>
      </Popconfirm>
    );
  }

  return <Button {...props}>{children}</Button>;
}
