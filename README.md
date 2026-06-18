# AdminFlow — 商品订单管理系统

全栈企业级后台管理系统，作为求职面试的项目展示。

## 🏗 架构

```
client (React 18 + TypeScript + Ant Design + Zustand)
   │
   │  HTTP /api/*
   ▼
server (Express + TypeScript + Prisma + PostgreSQL)
   │
   ▼
PostgreSQL + Redis
```

## 📁 目录结构

```
adminflow/
├── client/                # React 前端
│   └── src/
│       ├── api/           # Axios 封装 + 接口
│       ├── components/    # 通用组件 (AuthGuard, ProTable)
│       ├── hooks/         # 自定义 Hooks
│       ├── layouts/       # 布局组件
│       ├── pages/         # 页面组件
│       ├── router/        # 路由 (含权限)
│       ├── store/         # Zustand 状态管理
│       └── utils/         # 工具函数
├── server/                # Express 后端
│   └── src/
│       ├── modules/       # 功能模块 (auth, user, role, menu, product, order)
│       ├── middlewares/   # 中间件 (JWT 认证, 错误处理)
│       ├── prisma/        # 数据库 Schema + 种子数据
│       ├── config/        # 配置
│       └── utils/         # 工具 (JWT, 响应格式化)
└── docker-compose.yml     # 一键启动全部服务
```

## 🚀 快速启动

### 1. 安装依赖

```bash
# 服务端
cd server && npm install

# 客户端
cd client && npm install
```

### 2. 启动数据库

```bash
docker-compose up -d postgres redis
```

### 3. 初始化数据库

```bash
cd server
npx prisma db push
npm run db:seed
```

### 4. 启动开发服务

```bash
# 终端 1：启动后端
cd server && npm run dev

# 终端 2：启动前端
cd client && npm run dev
```

### 5. 打开浏览器

访问 http://localhost:5173

## 👤 测试账号

| 角色   | 用户名 | 密码   | 权限范围     |
| ------ | ------ | ------ | ------------ |
| 管理员 | admin  | 123456 | 全部功能     |
| 编辑   | editor | 123456 | 商品+订单管理 |
| 访客   | guest  | 123456 | 仅查看       |

## 🔑 技术亮点

### 认证方案
- **JWT 双 Token 机制**：Access Token（15min）+ Refresh Token（7 天）
- **无感刷新**：401 时自动用 Refresh Token 换新，并发请求排队等待
- **Token 会话管理**：登出时废弃 Refresh Token

### 权限控制
- **RBAC 模型**：用户 → 角色 → 权限
- **页面级**：动态路由生成，无权限菜单不可见
- **按钮级**：`<AuthButton permission="product:delete" />` 自动控制显隐
- **后端守卫**：JWT Guard + Roles Guard 双重校验

### 性能优化
- **路由懒加载 + 代码分割**：React.lazy + Vite chunk 分组（vendor/antd/echarts/i18n 独立打包）
- **ECharts 按需引入**：仅注册 LineChart/PieChart/BarChart，减少 ~200KB
- **虚拟列表**：react-virtuoso 渲染 10000+ 条数据，DOM 节点恒定 ~20 个
- **服务端压缩**：compression 中间件 gzip 响应
- **Nginx 缓存**：静态资源 immutable + 1 年缓存，HTML no-cache
- **API 限流**：express-rate-limit 15 分钟 1000 次
- **生产构建**：Terser 压缩 + console 移除
- **打包分析**：rollup-plugin-visualizer 生成 stats.html
- React Query 请求缓存
- 虚拟列表（长列表场景）
- 图片懒加载 + WebP

## 📊 进度

| 周次 | 内容                                       | 状态 |
| ---- | ------------------------------------------ | ---- |
| W1   | 项目骨架 + JWT 认证 + 登录页               | ✅ |
| W2   | RBAC 完整实现 + 商品/订单 CRUD             | ✅ |
| W3   | 文件上传 + 图表大屏 + i18n + 暗黑模式      | ✅ |
| W4   | 性能优化 + 测试 + Docker 部署 + CI/CD      | ✅ |

## 🛠 技术栈

| 层级     | 技术                                        |
| -------- | ------------------------------------------- |
| 前端框架 | React 18 + TypeScript                       |
| 构建工具 | Vite 5                                      |
| UI 库    | Ant Design 5 + Tailwind CSS                 |
| 状态管理 | Zustand                                     |
| 路由     | React Router v6 (懒加载)                    |
| 请求     | Axios (拦截器 + 无感刷新)                   |
| 后端     | Express + TypeScript                        |
| ORM      | Prisma                                      |
| 校验     | Zod                                         |
| 数据库   | PostgreSQL 16                               |
| 缓存     | Redis 7                                     |
| 部署     | Docker + Docker Compose + GitHub Actions    |
