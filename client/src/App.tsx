import { RouterProvider } from "react-router-dom";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { router } from "@/router";
import "@/i18n"; // 初始化 i18n

export default function App() {
  const { i18n } = useTranslation();
  const themeMode = useAppStore((s) => s.theme);

  // Ant Design 国际化
  const antdLocale = i18n.language === "en-US" ? enUS : zhCN;

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: { colorPrimary: "#1677ff" },
        algorithm: themeMode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
