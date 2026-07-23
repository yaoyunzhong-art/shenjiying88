# 📦 库存管理模块 — Inventory

## 模块用途

库存管理模块为门店管理员提供商品库存的集中查看与监控界面。支持按状态/分类过滤、关键词搜索、表格列排序、统计概览及分页浏览，帮助运营人员实时掌握库存水位和价值。

## 核心功能

| 功能 | 说明 |
|---|---|
| 📊 统计概览 | 商品总数、库存总价值、低库存/缺货数量、商品分类数 |
| 🔍 关键词搜索 | 按名称、SKU、分类、供应商、存放位置模糊搜索 |
| 🏷️ 状态 Tab 过滤 | 全部 / 库存充足 / 库存偏低 / 缺货 / 库存过剩 |
| 📋 数据表格 | 商品名、SKU、分类、数量、单价、总价值、存放位置、最近补货、状态 |
| ↕️ 列排序 | 点击表头可按列升降序排列 |
| 📄 分页 | 每页 8 条，支持页码跳转 |

### 库存状态定义

| 状态 | 常量 | 变体 | 含义 |
|---|---|---|---|
| 库存充足 | `in_stock` | success 🟢 | quantity ≥ minThreshold |
| 库存偏低 | `low_stock` | warning 🟡 | quantity < minThreshold |
| 缺货 | `out_of_stock` | danger 🔴 | quantity = 0 |
| 库存过剩 | `overstocked` | info 🔵 | quantity > maxThreshold |

### 商品分类

| 分类 | key | 示例 |
|---|---|---|
| 设备 | `equipment` | 咖啡机、磨豆机 |
| 耗材 | `consumable` | 咖啡豆、牛奶、抹茶粉 |
| 商品 | `merchandise` | 品牌马克杯、环保购物袋 |
| 配件 | `accessory` | 杯盖 |

## 主要组件与数据流

### 组件结构

- **`page.tsx`** — 页面主入口（`'use client'`），全部逻辑内聚
- **`loading.tsx`** — 页面级加载状态展示
- **`page.test.ts`** — L1 源码分析测试（Node test）
- **`page.test.tsx`** — L1 React 渲染测试（RTL + Vitest）
- **`page.vitest.tsx`** — L1 集成测试（Vitest）

### 子组件

- `StatBadge` — 统计卡片组件（展示总数/价值/低库存数/分类数）
- `DataTable` — 来自 `@m5/ui` 的数据表格组件
- `Tabs`（pills 变体）— 来自 `@m5/ui` 的状态过滤 tabs
- `SearchFilterInput` — 来自 `@m5/ui` 的关键词搜索输入框
- `Pagination` — 来自 `@m5/ui` 的分页组件

### 数据流

```
┌────────────────────────────────────────────────────┐
│                   InventoryListPage                  │
│                                                      │
│  useEffect → 模拟 300ms 加载 MOCK_INVENTORY          │
│       ↓                                             │
│  TriStateRenderer                                   │
│   ├─ loading → 加载中...                            │
│   ├─ error   → 错误提示 + 重试                      │
│   └─ 正常    → 页面内容                             │
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌─────────┐         │
│  │ 统计卡片  │   │ 搜索过滤  │   │ 状态Tab  │         │
│  └──────────┘   └──────────┘   └─────────┘         │
│       │              │              │               │
│       ▼              ▼              ▼               │
│  ┌──────────────────────────────────────┐          │
│  │          DataTable (数据表格)         │          │
│  │  列渲染: 名称/SKU/分类/数量/单价/   │          │
│  │  总价值/存放位置/补货时间/状态      │          │
│  │  支持: 排序(useSortedItems)          │          │
│  └──────────────────────────────────────┘          │
│                       │                              │
│                       ▼                              │
│  ┌──────────────────────────────────────┐          │
│  │    Pagination (分页, 8条/页)         │          │
│  └──────────────────────────────────────┘          │
└────────────────────────────────────────────────────┘
```

### 数据管道

`MOCK_INVENTORY(8条)` → `useSearchFilter(搜索)` → `statusFilter(状态Tab)` → `useSortedItems(排序)` → `Pagination(分页)` → `DataTable(渲染)`

### 复用组件

- `useTriState` — `app/_components/useTriState` — 通用加载/错误/空状态 Hook
- `TriStateRenderer` — `app/_components/TriStateRenderer` — 三态渲染器

## 依赖的服务/API

当前为**纯前端 Mock 实现**，无真实 API 依赖：

- `@m5/ui` — `DataTable`, `PageShell`, `Pagination`, `SearchFilterInput`, `StatusBadge`, `Tabs`, `usePagination`, `useSearchFilter`, `useSortedItems`
- `app/_components/useTriState` — 数据加载状态 Hook
- `app/_components/TriStateRenderer` — 三态渲染器

### 预期接入的 API

| 接口 | 用途 |
|---|---|
| `GET /api/inventory` | 分页查询库存列表（支持搜索、排序、过滤） |
| `GET /api/inventory/stats` | 库存统计概览（总数/价值/低库存数/分类数） |
| `GET /api/inventory/{id}` | 单商品库存详情 |
| `PUT /api/inventory/{id}` | 更新库存信息（补货、调拨、报废） |

## 权限要求

- 门店管理员或库存专员角色可查看
- 数据写入操作（补货/调整）可能需要 `storefront:inventory:write` 权限

## 注意点/常见问题

1. **Mock 数据**：当前 8 条示例数据硬编码在 `MOCK_INVENTORY` 中，300ms 延迟模拟加载，**不可用于生产**
2. **空结果处理**：所有过滤条件下的空结果均显示"未找到匹配的库存记录"的虚线边框提示
3. **状态优先级**：`statusFilter` 在搜索词之后生效——仅对搜索过滤后的数据再做状态过滤
4. **统计计算对象**：统计卡片基于原始 `pageData`（未过滤）计算，而非经过搜索/过滤后的子集
5. **分页限制**：每页固定 8 条（`pagination.usePagination(len, 8)`），如需调整需改代码
6. **搜索字段**：搜索覆盖 `name`, `sku`, `category`, `supplier`, `storageLocation` 共 5 个字段，新增搜索字段需同时更新 `searchFields`
7. **颜色编码**：库存数量颜色随状态变化：
   - 缺货 → `#f87171`（红色）
   - 库存偏低 → `#facc15`（黄色）
   - 正常/过剩 → `#e2e8f0`（默认）
