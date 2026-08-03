# ⚙️ 系统设置模块 — Settings

## 模块用途

系统设置模块为门店管理员提供集中化管理门店系统各项配置的界面。当前实现为前端 Mock 数据演示，包含通用设置、通知设置、安全设置和账单设置四个分类，支持按 Tab 切换查看与编辑（保存操作为模拟）。

## 核心页面/功能

| 分类 | Tab Key | 字段示例 |
|---|---|---|
| 通用设置 | `general` | 门店名称、地址、联系电话、营业时间 |
| 通知设置 | `notifications` | 低库存预警、订单通知、员工排班变更、系统更新通知 |
| 安全设置 | `security` | 双因素认证、登录会话时长、密码过期天数、登录 IP 白名单 |
| 账单设置 | `billing` | 当前套餐、月费、下次续费日期、发票抬头 |

### 字段类型

| 类型 | 渲染方式 | 示例 |
|---|---|---|
| `text` | 文字展示（灰色） | 门店名称、地址 |
| `toggle` | 开关状态展示（绿色/关闭） | 低库存预警（开启/关闭） |
| `select` | 选中值展示 | 登录会话时长（24小时） |

## 主要组件与数据流

### 组件结构

- **`page.tsx`** — 页面主入口（`'use client'`），管理 Tab 切换与数据加载
- **`loading.tsx`** — 页面级加载状态展示
- **`page.test.ts`** — L1 源码分析测试（Node test）
- **`page.vitest.tsx`** — L1 Vitest 集成测试渲染

### 状态管理

| 状态 | 类型 | 用途 |
|---|---|---|
| `loading` / `error` | boolean / Error | TriState 数据加载状态 |
| `sections` | SettingSection[] | 设置分类与字段数据 |
| `pageReady` | boolean | 首次数据加载完成标志 |
| `activeTab` | SettingsTab | 当前激活的分类 Tab |

### 复用组件

- `useTriState` — `app/_components/useTriState` — 通用加载/错误/空状态 Hook
- `TriStateRenderer` — `app/_components/TriStateRenderer` — 三态渲染器

### 数据流

```
┌──────────────────────────────────────┐
│           SettingsPage                │
│                                       │
│  useEffect → 模拟 300ms 延迟加载       │
│       ↓                              │
│  TriStateRenderer                    │
│   ├─ loading → "加载中…"             │
│   ├─ error   → 错误提示 + 重试按钮   │
│   └─ 正常    → Tab 导航 + 内容面板   │
│                                       │
│  ┌────────┐  ┌────────────────────┐  │
│  │ Tabs   │  │ 内容面板（字段列表） │  │
│  │ pills  │  │ text/toggle/select │  │
│  └────────┘  └────────────────────┘  │
│                                       │
│  保存按钮（模拟 → alert）            │
└──────────────────────────────────────┘
```

## 依赖的服务/API

当前为**纯前端 Mock 实现**，无真实 API 依赖：

- `@m5/ui` — `PageShell`, `Tabs`（pills 变体）
- `app/_components/useTriState` — 数据加载状态 Hook
- `app/_components/TriStateRenderer` — 三态渲染器

### 预期接入的 API（待实现）

| 接口 | 用途 |
|---|---|
| `GET /api/settings` | 获取门店设置数据 |
| `PUT /api/settings/{section}` | 更新指定分类的设置 |
| `PUT /api/settings/{section}/field` | 更新单个字段值 |

## 权限要求

- 管理员角色或具有 `storefront:settings:write` 权限
- 不同 Tab 可能有不同的细粒度权限（如安全设置仅超级管理员可编辑）

## 注意点/常见问题

1. **目前为 Mock 实现**：所有设置数据硬编码在 `MOCK_SETTINGS` 常量中，保存操作为 `alert` 模拟，**不可持久化**到后端
2. **没有使用 Router**：当前版本为单页内 Tab 切换，无路由变化，刷新后会回到 `general` Tab
3. **样式主题**：沿用 dark 主题色系（slate-900 背景 + 蓝色主色 `#2563eb`），与 storefront-web 统一
4. **扩展建议**：新增分类只需在 `SettingsTab` 类型中添加 key，并在 `MOCK_SETTINGS` 中添加对应 section 即可
5. **TS 类型对齐**：测试文件（`page.test.ts`）中维护了独立的类型定义和常量映射，如修改页面类型需同步更新测试
