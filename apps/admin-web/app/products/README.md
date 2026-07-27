# 商品管理中心（Products）

统一商品 SKU 管理与运营视图，支持多市场、多品类商品的列表检索、状态筛选、毛利率分析和详情查看。

## 功能概述

- **商品列表** — 展示全部商品，含 SKU、名称、品类、售价、成本、毛利率、库存、品牌、市场、门店和状态
- **搜索过滤** — 支持按 SKU、商品名称、品牌、门店进行模糊搜索
- **状态筛选** — 在售 / 下架 / 停产 / 草稿四种商品状态快速切换
- **品类筛选** — 食品 / 饮料 / 日用品 / 电子 / 服装等多品类选择
- **市场筛选** — 按市场代码过滤商品
- **毛利率分层** — 高毛利（≥50%）、中等（30%~50%）、低毛利（<30%）快速归类
- **排序** — 支持任意列名的升序/降序排序
- **分页** — 可调页大小（5/10/15/20）的分页组件
- **商品详情页** — `/products/[id]` 查看详情，支持状态流转操作（上架/下架/停产/草稿）
- **Capability Gating** — 库存与货架相关操作接入 capability access，根据门店能力决定可用性
- **统计卡片** — 商品总数、在售商品、低库存预警、缺货数量、平均毛利率

## 目录结构

```
products/
├── [id]/
│   ├── page.tsx              # 商品详情页（客户端组件 + 状态流转表单）
│   ├── page.test.ts          # 详情页测试
│   ├── page.test.tsx         # 详情页测试
│   └── loading.tsx           # 详情页加载态
├── page.tsx                  # 商品列表页（表格 + 筛选 + CUD 操作）
├── page.test.ts              # 列表页测试
├── page.test.tsx             # 列表页测试
├── error.tsx                 # 错误边界
├── loading.tsx               # 加载态骨架屏
├── not-found.tsx             # 404 占位页
└── README.md
```

## 主要组件

| 组件 | 说明 |
|---|---|
| `ProductsPage` | 服务端权限门控 + Suspense 包装的入口 |
| `ProductsPageContent` | 客户端商品列表核心组件（搜索、筛选、排序、分页） |
| 商品详情页 `[id]/page.tsx` | 商品详情查看与状态流转编辑表单 |

## 核心数据模型

| 类型/导出 | 说明 |
|---|---|
| `ProductItem` | 商品实体（SKU、名称、品类、售价、成本、库存等） |
| `ProductStatus` | 商品状态枚举：`active` / `inactive` / `discontinued` / `draft` |
| `ProductCategory` | 品类枚举：`food` / `beverage` / `daily` / `electronics` / `clothing` / `other` |
| `MOCK_PRODUCTS` | 本地 Mock 商品数据（45 条样本） |
| `VALID_TRANSITIONS` | 状态流转规则字典 |

## 相关 API

- **数据来源**: `products-data.ts` 中的 `MOCK_PRODUCTS` 本地样本数据
- **详情操作**: 商品状态变更、基本信息编辑表单均通过客户端表单提交

## 权限控制

需 `product:read` 权限，通过 `AdminPermissionGate` 实现 Route Guard。库存/货架相关操作依赖 `inventory` 和 `shelf` capability gating。

## 使用示例

```tsx
// 服务端 page.tsx
<AdminPermissionGate requiredPermission="product:read" title="商品管理访问受限" description="...">
  <Suspense fallback={...}>
    <ProductsPageContent />
  </Suspense>
</AdminPermissionGate>
```
