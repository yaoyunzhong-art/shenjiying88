# inventory — 库存管理模块

> 多租户零售平台库存全链路管理中枢
> Phase-37 T167 库存管理核心交付模块

**路径**: `apps/admin-web/app/inventory/`

---

## 模块概述

库存管理模块负责商品库存的全生命周期管理，涵盖入库、出库、库存操作、低库存预警、状态流转等核心功能。支持多租户隔离（TenantGuard），采用乐观锁（version）保证并发写入一致性，提供实时库存查询与调整能力。与采购、销售、订单等模块深度联动，实现库存数据的实时同步。

---

## 核心功能

| 功能 | 说明 |
|------|------|
| **库存总览** | 库存列表展示，含 SKU、名称、总量、可用量、预留量、单价、状态 |
| **入库操作** | 指定商品、数量、原因，执行入库（STOCK_IN） |
| **出库操作** | 指定商品、数量、原因，执行出库（STOCK_OUT） |
| **状态流转** | ACTIVE ↔ INACTIVE ↔ ARCHIVED 三级状态管理 |
| **低库存预警** | 自动检测可用量 ≤ 阈值，分级告警（critical / warning / normal） |
| **库存详情** | 单 SKU 完整信息查看（基本信息、库存信息、出入记录） |
| **出入记录** | 完整的库存变动流水历史，含操作人、时间、原因 |
| **库存编辑** | 修改商品名称、计量单位、低库存阈值、单价 |
| **乐观锁并发控制** | version 字段保证写入一致性 |
| **多租户隔离** | TenantGuard: 强制 tenantId，数据严格隔离 |
| **搜索与筛选** | 按名称 / SKU 模糊搜索，按状态筛选 |
| **库存总值计算** | 自动计算可用库存 × 单价的库存总值 |

---

## 目录结构

```
inventory/
├── [id]/                       # 库存详情页
│   ├── loading.tsx             # 骨架屏加载态
│   ├── page.test.ts            # Node Test 单元测试
│   ├── page.test.tsx           # React Testing Library 组件测试
│   └── page.tsx                # 单 SKU 完整详情（概览/出入记录/编辑 Tab）
├── rules/                      # 库存规则配置
│   ├── loading.tsx
│   ├── page.test.ts
│   ├── page.test.tsx
│   └── page.tsx
├── loading.tsx                 # 页面级加载态
├── not-found.tsx               # 404 页面
├── error.tsx                   # ErrorBoundary 兜底
├── page.tsx                    # 库存列表主页
├── page.test.ts                # Node Test 页面测试
├── page.test.tsx               # React Testing Library 测试
├── inventory.test.ts           # 核心业务逻辑单元测试
└── README.md                   # 本文件
```

---

## 核心数据模型

### InventoryItem

```typescript
interface InventoryItem {
  id: string              // 库存项 ID
  tenantId: string        // 租户 ID（多租户隔离）
  sku: string             // SKU 编码
  name: string            // 商品名称
  unit: string            // 计量单位（台/个/瓶/袋/副）
  totalQty: number        // 总数量
  reservedQty: number     // 预留/锁定数量
  availableQty: number    // 可用数量（= totalQty - reservedQty）
  lowStockThreshold: number  // 低库存预警阈值
  unitPriceCents: number  // 单价（分）
  status: ItemStatus      // 状态: ACTIVE | INACTIVE | ARCHIVED
  version: number         // 乐观锁版本号
}
```

### StockMovement

```typescript
interface StockMovement {
  id: string              // 流水记录 ID
  type: 'STOCK_IN' | 'STOCK_OUT'  // 入/出库类型
  qty: number             // 变动数量
  reason: string          // 变动原因（如"采购到货"、"销售出库"、"盘点调整"）
  performedBy: string     // 操作人
  createdAt: string       // 操作时间
}
```

### 低库存预警分级

| 条件 | 严重程度 | 说明 |
|------|----------|------|
| `availableQty === 0` | critical | 库存已耗尽 |
| `availableQty <= lowStockThreshold * 0.5` | critical | 严重偏低，必须立即补货 |
| `availableQty <= lowStockThreshold` | warning | 偏低预警，建议补货 |
| `availableQty > lowStockThreshold` | normal | 正常 |

### 状态流转

```
ACTIVE ←──→ INACTIVE
  │              │
  └──→ ARCHIVED ←┘
  ↑──────────────┘

ACTIVE   → deactivate →  INACTIVE → archive →  ARCHIVED
ACTIVE   → archive    →  ARCHIVED
INACTIVE → activate   →  ACTIVE
ARCHIVED → activate   →  ACTIVE
```

---

## API 端点

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/api/inventory?tenantId={id}` | 获取库存列表 |
| POST | `/api/inventory` | 新建库存项 |
| GET | `/api/inventory/{id}?tenantId={id}` | 单 SKU 库存详情 |
| PUT | `/api/inventory/{id}` | 更新库存信息（需传 version） |
| DELETE | `/api/inventory/{id}` | 删除库存项（需传 version） |
| POST | `/api/inventory/{id}/stock-in` | 入库操作 |
| POST | `/api/inventory/{id}/stock-out` | 出库操作 |
| PATCH | `/api/inventory/{id}/status` | 状态变更（需传 version） |
| GET | `/api/inventory/{id}/movements?tenantId={id}&limit=50` | 出入记录流水 |

---

## 依赖关系

| 依赖 | 用途 |
|------|------|
| `@m5/ui` | UI 组件库（含骨架屏组件） |
| `@m5/sdk` | API 客户端 |
| `@m5/types` | 库存业务类型定义 |
| `apps/admin-web/app/bootstrap` | 应用引导、租户上下文 |
| `apps/admin-web/app/components` | 通用组件 |

---

## 使用示例

### 创建库存验证

```typescript
validateCreateItem({ sku: '', name: '商品', totalQty: 10, unitPriceCents: 1000 })
// → "SKU 不能为空"

validateCreateItem({ sku: 'NEW-001', name: '新商品', totalQty: 100, unitPriceCents: 10000 })
// → null（合法）

validateCreateItem({ sku: 'S001', name: '', totalQty: 10, unitPriceCents: 1000 })
// → "商品名称不能为空"

validateCreateItem({ sku: 'S001', name: '商品', totalQty: -1, unitPriceCents: 1000 })
// → "总数量不能为负数"

validateCreateItem({ sku: 'S001', name: '商品', totalQty: 0, unitPriceCents: 1000 })
// → "总数量不能为 0"
```

### 低库存检测

```typescript
const item: InventoryItem = { availableQty: 2, lowStockThreshold: 5, ... }
isLowStock(item)        // → true（2 <= 5）
isOutOfStock(item)      // → false
  
lowStockSeverity(item)  // → 'critical'（2 <= 5*0.5=2.5）

const edgeItem = { ...item, availableQty: 3, lowStockThreshold: 3 }
lowStockSeverity(edgeItem)  // → 'warning'（3 <= 3 但 > 1.5）
```

### 搜索

```typescript
searchItems(items, '投篮')      // → [投篮机]
searchItems(items, 'SKU-003')   // → [毛绒公仔]
searchItems(items, '')          // → 全部（空查询回退）
searchItems(items, 'XXXXXXXX')  // → []（无匹配）
```

### 库存总值计算

```typescript
calculateTotalValue(items)  // → 各商品 availableQty × unitPriceCents 之和
```

---

## 测试说明

### 测试文件

| 文件 | 类型 | 覆盖范围 |
|------|------|----------|
| `inventory.test.ts` | Node Test (node:test) | 正例 10+ / 反例 8 / 边界 5 — 核心业务逻辑 |
| `page.test.ts` | Node Test | 页面级数据流、搜索筛选、分页 |
| `page.test.tsx` | React Testing Library | UI 组件渲染、操作交互 |
| `[id]/page.test.ts` | Node Test | 详情页详情加载、编辑验证、状态流转 |
| `[id]/page.test.tsx` | React Testing Library | 详情页渲染测试 |

### 运行测试

```bash
# 运行核心库存测试
node --test apps/admin-web/app/inventory/inventory.test.ts

# 运行所有库存测试
find apps/admin-web/app/inventory -name '*.test.ts' -o -name '*.test.tsx' | xargs node --test
```

### 测试覆盖

- ✅ **isLowStock / isOutOfStock / lowStockSeverity** — 完整覆盖阈值分级
- ✅ **searchItems** — 名称/SKU/ID 搜索、大小写不敏感、空查询
- ✅ **filterItemsByStatus** — 状态筛选、不存在的状态返回空
- ✅ **validateCreateItem** — 空值、负数、0 值等全部反例覆盖
- ✅ **calculateTotalValue** — 正常、空数组、大量数据
- ✅ **availableQty === totalQty - reservedQty** 一致性验证

---

## 安全基线 (Security Baseline)

- ✅ **乐观锁 (version)** — 所有 update/delete 操作必须传入当前 version
- ✅ **多租户隔离 (TenantGuard)** — tenantId 作为核心隔离字段
- ✅ **状态流转限制** — ACTIVE/INACTIVE/ARCHIVED 三级状态机，非法转换直接拒绝
- ✅ **输入校验** — 数量非负、名称非空、单价非负、阈值非负
- ✅ **离开确认 (beforeunload)** — 编辑未保存时拦截离开
- ✅ **边界三态覆盖** — loading / error / not-found 每页面全覆盖

---

## 注意事项

1. **乐观锁必传**: 所有 update/delete/status-change 操作必须传入 `version`，version 不匹配返回 409
2. **availableQty 公式**: `availableQty = totalQty - reservedQty`，不要直接修改 availableQty
3. **入库出库**: 必须提供 reason（原因），便于审计追溯
4. **金额分单位**: `unitPriceCents` 以分存储，展示需 format（`¥${(cents/100).toFixed(2)}`）
5. **低库存阈值**: 设定时需结合商品周转周期，过低的阈值可能导致补货滞后
6. **ARCHIVED 状态**: 归档商品不可编辑基本信息，只能恢复为 ACTIVE
7. **删除确认**: 删除操作不可撤销，需二次弹窗确认
8. **搜索性能**: 大型库存列表建议后端分页搜索，前端搜索仅适用于缓存数据
