import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [
        react(),
        visualizer({
            open: false,
            gzipSize: true,
            filename: "dist/stats.html",
            title: "AdminFlow 打包分析",
        }),
    ],
    resolve: {
        alias: { "@": path.resolve(__dirname, "src") },
    },
    server: {
        port: 5173,
        proxy: {
            "/api": { target: "http://localhost:3000", changeOrigin: true },
            "/uploads": { target: "http://localhost:3000", changeOrigin: true },
        },
    },
    preview: {
        port: 4173,
    },
    build: {
        rollupOptions: {
            output: {
                // 精细代码分割
                manualChunks: function (id) {
                    if (id.includes("node_modules")) {
                        if (id.includes("react-dom") || id.includes("react-router") || id.includes("/react/"))
                            return "vendor";
                        if (id.includes("@ant-design") || id.includes("antd"))
                            return "antd";
                        if (id.includes("echarts"))
                            return "echarts";
                        if (id.includes("i18next") || id.includes("react-i18next"))
                            return "i18n";
                    }
                },
            },
        },
        // 生产环境移除 console
        minify: "esbuild",
        // 资源内联阈值
        assetsInlineLimit: 4096,
    },
    // 生产环境移除 console/debugger
    esbuild: {
        drop: ["console", "debugger"],
    },
    // Vitest 配置
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./src/test/setup.ts",
        css: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            reportsDirectory: "./coverage",
        },
    },
});
