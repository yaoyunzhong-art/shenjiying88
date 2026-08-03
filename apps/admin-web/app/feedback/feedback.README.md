# 用户反馈管理 — Feedback

## 用途概述

用户反馈管理模块为 Admin Web 后台提供门店视角的客户反馈处理能力，面向 **系统管理员** 和 **运营主管**，提供客户反馈的**查看、分类、筛选、搜索、状态流转**。支持多种反馈类型（投诉、建议、表扬、咨询）与处理状态（待处理、处理中、已处理）。

**角色视角:** 👔 系统管理员 / 📢 运营主管 / 📞 客服人员
**权限控制:** `feedback:read`

## 文件结构

```
feedback/
├── feedback.README.md         # 本文件
├── page.tsx                   # 反馈列表页入口 (Server Component, force-dynamic)
├── feedback-client.tsx        # 反馈列表客户端组件 (含搜索、筛选、状态标签)
├── feedback-data.ts           # 数据层：类型定义、常量映射、mock 数据、筛选/统计工具函数
├── page.test.tsx              # E2E 测试
├── error.tsx                  # 错误边界组件
├── loading.tsx                # 加载态骨架
└── not-found.tsx              # 404 页面
```

## 核心数据模型

### FeedbackItem

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 反馈 ID |
| `customerName` | `string` | 客户姓名 |
| `storeName` | `string` | 门店名称 |
| `type` | `FeedbackType` | `complaint` / `suggestion` / `praise` / `inquiry` |
| `rating` | `number` | 评分（1-5 星） |
| `content` | `string` | 反馈内容 |
| `createdAt` | `string` | 创建时间 |
| `status` | `FeedbackStatus` | `pending` / `processing` / `resolved` |
| `handler` | `string` (可选) | 处理人 |
| `remark` | `string` (可选) | 处理备注 |

### 状态流转图

```
  ┌──────────┐   接单   ┌──────────┐   完成   ┌──────────┐
  │ Pending  │ ──────→ │Processing│ ──────→ │ Resolved │
  │ (待处理)  │         │ (处理中)  │         │ (已处理)  │
  └──────────┘         └──────────┘         └──────────┘
```

### 反馈类型说明

| 类型 | 标签 | 颜色 |
|------|------|------|
| `complaint` | 投诉 | 红色 |
| `suggestion` | 建议 | 蓝色 |
| `praise` | 表扬 | 绿色 |
| `inquiry` | 咨询 | 橙色 |

### 回复视角分类

反馈模块提供两套筛选标签体系：

**回复维度 Tabs（`ReplyTab`）：**
| Tab | 筛选逻辑 |
|-----|---------|
| `all` | 全部 |
| `unhandled` | 未处理（status = pending） |
| `handled` | 已处理（status = resolved 且无 remark） |
| `replied` | 已回复（status = processing 或其 status = resolved 且有 remark） |

**状态维度 Tabs（`FeedbackTab`）：**
| Tab | 含义 |
|-----|------|
| `all` | 全部 |
| `pending` | 待处理 |
| `processing` | 处理中 |
| `resolved` | 已处理 |

## 核心功能

### 列表页（`page.tsx` + `feedback-client.tsx`）

- **统计卡片：** 总反馈数、待处理数（红色高亮）、本月平均评分
- **双标签体系：** 回复视角（全部/未处理/已处理/已回复）+ 状态视角（全部/待处理/处理中/已处理）
- **搜索/筛选：** 关键词搜索（客户名、门店名、内容）、反馈类型下拉筛选
- **反馈卡片列表：** 每张卡片展示客户姓名、门店、类型标签（彩色）、状态标签、评分星级、反馈内容、处理人及备注
- **刷新按钮：** 重置筛选条件 + 触发 `router.refresh()`
- **空状态：** 无数据时的引导提示，含重置按钮和 SVG 插画

### 数据流

```
FeedbackPage (Server Component, force-dynamic)
  └─ AdminPermissionGate (requiredPermission: feedback:read)
  └─ loadFeedbackSnapshot() → FeedbackSnapshotDelivery
       ├─ deliveryMode: 'snapshot' (始终为快照模式)
       ├─ feedbacks: FeedbackItem[]
       └─ generatedAt: string
  └─ FeedbackClient (Client Component)
       ├─ 回复维度筛选 (ReplyTab: all/unhandled/handled/replied)
       ├─ 状态维度筛选 (FeedbackTab: all/pending/processing/resolved)
       ├─ 关键词搜索 (客户名/门店名/内容)
       ├─ 类型筛选 (complaint/suggestion/praise/inquiry/all)
       └─ 渲染 FeedbackCard 列表
```

当前模块使用本地 `defaultFeedbacks` mock 数据，`deliveryMode` 固定为 `'snapshot'` 快照模式。

## 数据层函数 (`feedback-data.ts`)

| 函数 | 签名 | 说明 |
|------|------|------|
| `loadFeedbackSnapshot` | `() => Promise<FeedbackSnapshotDelivery>` | 加载反馈快照（始终返回本地 mock） |
| `applyReplyTab` | `(items, tab: ReplyTab) => FeedbackItem[]` | 按回复维度筛选 |
| `filterFeedbackItems` | `(items, replyTab, statusTab, keyword, typeFilter) => FeedbackItem[]` | 全维度组合筛选 |
| `computeFeedbackStats` | `(items: FeedbackItem[]) => FeedbackStats` | 统计总反馈、待处理、处理中、已处理、本月平均评分等 |

## 依赖关系

| 依赖 | 用途 |
|------|------|
| `next/navigation` | `useRouter` 路由刷新 |
| `react` | 客户端状态管理 (`useState`, `useMemo`, `useTransition`) |
| **AdminPermissionGate** | 权限栅栏（`requiredPermission: feedback:read`） |

本模块 **不依赖** `@m5/ui` 组件库，所有 UI 均为内联样式（inline styles）实现。

## 权限节点

| 页面 | 权限 | 说明 |
|------|------|------|
| 列表页 (`/feedback`) | `feedback:read` | 查看用户反馈管理页面 |

未授权时显示权限受限提示卡片。

## 使用指引

### 开发启动

```bash
pnpm --filter @m5/admin-web dev
```

### 访问地址

- 反馈管理: `/feedback`

### 数据对接

当前使用 `defaultFeedbacks` 本地 mock 数据。对接真实后端时需：
1. 修改 `loadFeedbackSnapshot`，调用真实 API 获取反馈列表
2. 更新 `FeedbackSnapshotDelivery` 中的 `deliveryMode` 和 `sourceLabel`
3. `defaultFeedbacks` 可保留作为 fallback

### 测试

```bash
pnpm --filter @m5/admin-web test -- --testPathPattern 'feedback/'
```

## 开发注意事项

1. **内联样式：** 本模块未采用 `@m5/ui` 组件库，所有样式为内联 `React.CSSProperties`，重构时注意统一性
2. **双标签体系：** 模块同时提供回复维度和状态维度两种筛选 Tabs，两者为 AND 关系组合筛选
3. **空状态插画：** 空状态使用内联 SVG 而非外部图片资源
4. **评分渲染：** `renderStars` 函数使用 Unicode ★☆ 字符实现星级展示

## 维护者

- **维护者:** Admin Web 前端团队
- **最后修改:** 2026-07-27

## 交叉引用

- [Admin Web 入口](../../README.md) — Admin Web 应用文档
- [AdminPermissionGate](../components/admin-permission-gate.tsx) — 权限栅栏组件
