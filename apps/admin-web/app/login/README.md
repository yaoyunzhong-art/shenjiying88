# 登录模块 Login

管理员登录页，提供账号密码认证、登录历史追溯、安全评分看板等功能，支持 API 实时模式与本地演练回退模式。

## 核心功能

- **管理员登录认证** — 用户名/密码表单提交，支持"记住我"选项
- **登录历史记录** — 展示最近登录记录（成功/失败），支持搜索与失败过滤
- **安全评分看板** — 综合评估密码策略、失败率等安全指标，可视化展示
- **来源证据展示** — 页面顶部显式标记数据来源模式（API / 回退）、控制面来源与业务数据来源
- **表单校验反馈** — 字段级错误提示、登录成功/失败反馈
- **Session 管理** — 登录成功后通过 `storeAdminSession` 写入本地会话，支持 `clearAdminSession` 退出

## 技术栈

- **Next.js App Router** — Server Components（数据快照加载）、Client Components（交互逻辑）
- **React 19** — `useState` / `useTransition` / `useRouter` 驱动客户端交互
- **TypeScript** — 全模块类型安全，导出 `LoginPageSnapshot` / `LoginResult` 等接口
- **@m5/ui** — 使用 `DataTable`、`FormField`、`SubmitButton`、`StatusBadge` 等通用组件
- **admin-session** — 本地管理员会话管理与权限校验

## 文件结构

```
login/
├── README.md            # 本文件
├── page.tsx             # 服务端页面入口，加载数据快照并传递证据信息
├── login-client.tsx     # 客户端组件：表单、历史、安全看板的交互逻辑
├── login-data.ts        # 数据层：类型定义、登录 API 调用、历史过滤、安全评分
├── loading.tsx          # 加载骨架屏
├── error.tsx            # 错误边界 UI
├── not-found.tsx        # 404 页面
├── page.test.ts         # 测试（数据层）
└── page.test.tsx        # 测试（组件层）
```

## 如何使用

### 页面路由

`/login` — 管理员登录页，无需额外权限即可访问。

### 数据模式

页面支持两种数据交付模式，由 `bootstrap` 层的 `deliveryMode` 控制：

| 模式 | 说明 |
|------|------|
| `api` | 真实调用后端认证接口 & 查询登录历史 |
| `fallback` | 使用本地模拟数据（适用于开发/演示/网络不可达） |

### 开发者操作

1. 页面顶部证据面板清晰标明当前数据来源与刷新路径
2. `login-data.ts` 中的 `loginAdmin()` 函数发送认证请求，可直接对接后端 API
3. 登录历史通过 `filterHistory()` 实现搜索与失败过滤，可替换为真实数据源
