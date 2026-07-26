# 营销活动模块 (Campaigns)

## 功能概述

营销活动模块 (`campaigns`) 负责品牌营销活动的全生命周期管理，包括活动创建、状态跟踪、预算监控与投放效果分析。支持多类型营销活动（促销、拉新、推荐、季节、清仓），覆盖小程序、公众号、抖音、短信、门店等投放渠道。

## 目录结构

```
campaigns/
├── README.md              # 本文件 — 模块文档
├── page.tsx               # 服务端页面组件（SSR）
├── page.test.tsx          # 页面测试
├── campaigns-client.tsx   # 客户端交互组件
├── campaigns-data.ts      # 数据层（类型定义 + API 获取 + fallback）
├── loading.tsx            # 加载态 UI
├── error.tsx              # 错误边界 UI
└── not-found.tsx          # 404 占位
```

## 核心功能

| 功能 | 说明 |
|------|------|
| 活动列表 | 按状态筛选（进行中 / 草稿 / 已完成 / 全部），支持分页浏览 |
| 活动看板 | 展示活动总数、进行中数量、总预算、已花费等关键指标 |
| 活动详情 | 显示活动基本信息、投放渠道、进度条和目标达成率 |
| 新建活动 | 通过 Modal 表单创建活动，支持名称、类型、日期、预算、目标指标、渠道 |
| 数据刷新 | 客户端一键刷新，触发服务端重新获取实时数据 |
| 容灾降级 | API 不可用时自动回退到本地 fallback 样本数据 |

### 活动类型

- **promotion** — 促销活动（折扣、满减）
- **new-member** — 拉新活动（注册送礼）
- **referral** — 推荐有礼（老带新）
- **seasonal** — 季节活动（节日限定）
- **clearance** — 清仓活动（换季出清）

### 活动状态

- `draft` → `active` → `paused` / `completed` / `cancelled`

## 依赖关系

| 依赖 | 关联模块 | 说明 |
|------|----------|------|
| `@m5/ui` | 内部 UI 库（如使用） | 按钮、表格、标签等基础组件 |
| `antd` | 第三方 UI | Modal、Form、DatePicker、Select、InputNumber |
| `dayjs` | 第三方工具 | 日期格式化与校验 |
| `AdminPermissionGate` | `components/` | 权限管控门组件，需 `campaigns:read` 权限 |
| `next/navigation` | Next.js | useRouter 页面导航与刷新 |

## 使用方法

### 路由访问

```
/admin-web/app/campaigns
```

### 权限要求

页面已接入管理员权限管控，需具备 `campaigns:read` 权限的账号方可访问。

### API 配置

模块自动从以下环境变量解析后端 API 地址（按优先级）：

1. `M5_API_BASE_URL`
2. `NEXT_PUBLIC_M5_API_BASE_URL`
3. `NEXT_PUBLIC_API_URL`
4. 缺省值: `http://localhost:3001`

最终请求地址：`{baseUrl}/brand/campaigns`

### 数据流

```
page.tsx (SSR)
  └─ loadCampaignsSnapshot()
       ├─ fetchCampaigns()   → GET /api/v1/brand/campaigns
       └─ fallback           → defaultCampaigns (5 条样本)
  └─ CampaignsClient (client component)
       └─ 用户交互（筛选 / 创建 / 刷新）
```

### 新建活动

点击「+ 新建活动」打开表单 Modal，填写以下必填字段：

- 活动名称（最长 50 字）
- 活动类型
- 开始 / 结束日期
- 预算（元）
- 目标指标与目标值
- 投放渠道（可多选）

提交后调用 `POST /api/brand/campaigns`，成功后自动刷新页面。

### 错误处理

- API 请求失败 → 页面顶部展示黄色警告条 + 自动切换 fallback 数据
- 表单校验失败 → Ant Design Form 内联提示，不提交
- 网络异常 → 错误消息通过 `message.error` 展示
