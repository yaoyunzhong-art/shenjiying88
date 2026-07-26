# 市场管理中心模块 (Markets)

## 功能概述

市场管理中心模块 (`markets`) 负责管理 M5 多租户平台在全球范围内的市场配置，包括市场基础信息、语言本地化、货币结算、时区设置、区域覆盖和部署状态。该模块是支撑平台全球化扩展的核心配置管理入口。

> **注意：** 数据层 (`markets-data.ts`) 位于 `apps/admin-web/app/` 父级，与 `markets/page.tsx` 共享。

## 目录结构

```
markets/
├── README.md          # 本文件 — 模块文档
├── page.tsx           # 服务端页面组件（SSR）
├── page.test.ts       # 页面测试（旧版）
├── page.test.tsx      # 页面测试（新版）
├── markets-client.tsx # 客户端交互组件（使用 @m5/ui 组件库）
├── [id]/              # 市场详情动态路由目录
│   └── ...            # 单个市场详情页
├── loading.tsx        # 加载态 UI
├── error.tsx          # 错误边界 UI
└── not-found.tsx      # 404 占位

（数据层文件位于上级目录）
../markets-data.ts     # 共享数据层：类型定义、mock 数据、API 获取
```

## 核心功能

| 功能 | 说明 |
|------|------|
| 市场列表 | 展示所有市场，支持搜索（编码/名称/区域/货币/时区）、排序、分页 |
| 状态筛选 | Tab 切换：全部、运营中、待激活、已停用 |
| 区域筛选 | 二级 Tab 按亚太/北美/欧洲/中东/拉美筛选 |
| 快速统计 | 市场总数、运营中数量、待激活数量、已部署资源数 |
| 搜索过滤 | 支持多字段模糊搜索，实时过滤 |
| FilterChips | 已选筛选条件可视化展示，支持单条清除和全部清除 |
| 市场详情 | 点击市场名称跳转 `/markets/[id]` 查看详细配置 |
| 数据刷新 | 客户端一键刷新触发服务端重新获取 |
| 容灾降级 | API 不可用时自动回退到本地 15 个市场样本数据 |

### 区域覆盖

| 区域代码 | 区域名称 | 示例市场 |
|----------|----------|----------|
| `asia-pacific` | 亚太 | 中国大陆、中国香港、日本、韩国、新加坡 |
| `north-america` | 北美 | 美国、加拿大 |
| `europe` | 欧洲 | 英国、德国、法国 |
| `middle-east` | 中东 | 阿联酋 |
| `latin-america` | 拉美 | 巴西 |

### 市场状态

- **active** — 运营中（绿色标识）
- **pending** — 待激活（黄色标识）
- **inactive** — 已停用（灰色标识）

## 依赖关系

| 依赖 | 关联模块 | 说明 |
|------|----------|------|
| `@m5/ui` | 内部 UI 组件库 | DataTable、Pagination、Tabs、QuickStats、StatusBadge、SearchFilterInput、FilterChips、EmptyState、PageShell、usePagination、useSearchFilter、useSortedItems |
| `AdminPermissionGate` | `components/` | 权限管控门组件，需 `dashboard:read` 权限 |
| `../markets-data` | 共享数据层 | 类型定义 `MarketItem`、`MarketDetail`、区域/状态映射常量、mock 数据、API 获取函数 |
| `next/navigation` | Next.js | `useRouter` 实现页面导航与刷新 |

## 使用方法

### 路由访问

```
/admin-web/app/markets
/admin-web/app/markets/[id]  （市场详情页）
```

### 权限要求

页面已接入管理员权限管控，需具备 `dashboard:read` 权限的账号方可访问。

### API 配置

模块自动从以下环境变量解析后端 API 地址（按优先级）：

1. `M5_API_BASE_URL`
2. `NEXT_PUBLIC_M5_API_BASE_URL`
3. `NEXT_PUBLIC_API_URL`
4. 缺省值: `http://localhost:3001`

最终请求地址：`{baseUrl}/markets`

### 数据流

```
page.tsx (SSR)
  └─ loadMarketsSnapshot() (位于 ../markets-data.ts)
       ├─ fetchMarkets()       → GET /api/v1/markets
       │    └─ mapApiMarket()  后端字段标准化
       └─ fallback              → MOCK_MARKETS (15 条样本)
  └─ MarketsClient (client component)
       └─ 用户交互（搜索 / 状态筛选 / 区域筛选 / 排序 / 分页 / 刷新 / 跳转详情）
```

### 搜索与筛选

- **搜索框**：支持按 `code`、`name`、`region`、`currency`、`timezone` 字段模糊搜索
- **状态 Tab**：`全部` / `运营中` / `待激活` / `已停用`
- **区域 Tab**：`全部` / `亚太` / `北美` / `欧洲` / `中东` / `拉美`
- **排序**：所有列均支持点击排序，支持多级排序配置
- **分页**：支持 5/10/15/20 条/页

### 容灾降级

当后端 API 不可达时，自动使用 `MOCK_MARKETS`（15 个市场样本），页面顶部展示黄色降级提示条。

> **注意：** fallback 模式下数据不可作为闭环复签证据，仅用于 UI 展示和开发调试。
