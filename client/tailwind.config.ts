import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  corePlugins: { preflight: false }, // 避免覆盖 Ant Design 样式
  theme: {
    extend: {
      colors: {
        primary: "#1677ff",
      },
    },
  },
  plugins: [],
} satisfies Config;
