# Phase-37 库存管理 Spec · V1 启动版

> **创建时间**: 2026-06-27 21:54 CST (后台规划)
> **创建人**: 🦞 龙虾哥 (后台 22h 大脑级)
> **状态**: 🟡 框架版,等 Phase-36 T166-1/2/3 完成后启动
> **预计**: 1.5 天工期

---

## 0. 现状盘点 (派发前必做 · R-07 V2)

**⚠️ 必须做**:派发 T167 任务卡前,先盘点库存管理模块。

待验证:
- `apps/api/src/modules/inventory/` 是否存在
- `Product` / `Stock` / `Warehouse` 实体
- 与 Phase-35 订单集成现状
- 多租户 SKU 隔离

---

## 1. 业务目标

库存管理是 SaaS 平台核心运营模块:
- **SKU 管理**:商品多规格(颜色/尺寸/版本)
- **库存盘点**:实时数量 + 仓库分布
- **入库出库**:采购入库 + 销售出库
- **库存预警**:低于阈值自动报警
- **批次管理**:生产日期 / 过期日期

依赖 Phase-35 收银台(下单减库存)+ Phase-36 会员(会员价)。

---

## 2. 数据模型 (待盘点后详细化)

### Product (商品主数据)
```typescript
interface Product {
  id: string
  tenantId: string
  brandId: string
  sku: string                 // 商品编码
  title: string
  description?: string
  priceCents: number
  memberPriceCents?: number   // 会员价
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  category: string
  images: string[]
  createdAt: string
  updatedAt: string
}
```

### Stock (库存记录)
```typescript
interface Stock {
  id: string
  productId: string
  warehouseId: string
  quantity: number            // 当前数量
  reserved: number            // 已预订 (订单未付款)
  threshold: number           // 预警阈值
  lastCountAt?: string        // 上次盘点
}
```

### Warehouse (仓库)
```typescript
interface Warehouse {
  id: string
  tenantId: string
  brandId: string
  storeId?: string
  name: string
  address?: string
  isDefault: boolean
}
```

### StockMovement (流水)
```typescript
interface StockMovement {
  id: string
  productId: string
  warehouseId: string
  type: 'INBOUND' | 'OUTBOUND' | 'RESERVE' | 'RELEASE' | 'ADJUST'
  quantity: number            // 正负
  refOrderId?: string         // 关联订单
  reason?: string
  operatorId: string
  createdAt: string
}
```

---

## 3. 任务卡 (T167-T170 · 待拆)

| T-NN | 标题 | 估时 | 依赖 |
|------|------|------|------|
| T167-1 | Product 实体 + 多租户 SKU 索引 | 0.5d | - |
| T167-2 | Warehouse + Stock 库存盘点 | 0.5d | T167-1 |
| T167-3 | Phase-35 订单集成 (下单减库存) | 0.5d | T167-2 |
| T167-4 | 库存预警 + 报表 | 0.5d | T167-2 |

**总计**: 2 天

---

## 4. Champion 督导

- **E42 李事业部总经理** (Phase-35 + 36 + 37 三 Phase)
- **E19 王运营总监** (库存 KPI 督导)
- **周会 review**: T167-2 完成后首次

---

## 5. 关键决策待定 (Open Questions)

1. **多规格 SKU**: 颜色/尺寸/版本用 JSON 字段 vs 单独子表?
2. **库存扣减时机**: 下单减 vs 付款减 vs 发货减?
3. **会员价策略**: 会员等级折扣 vs 单独 memberPrice 字段?
4. **库存预警阈值**: 全局阈值 vs 按 SKU 设置?
5. **批次管理**: 是否需要?(餐饮/生鲜需要,台球不需要)

**待大飞哥决策**: 🟡 P1 优先级

---

## 6. 上下游依赖

### 上游 (✅ 已就位)
- Phase-30 SSE 集成层
- Phase-31 多租户隔离
- Phase-33 EventStore
- Phase-35 收银台 (订单创建 → 库存扣减)
- Phase-36 会员 (会员价 + 会员库存优先级)

### 下游 (待建)
- Phase-38 财务对账 (销售成本核算)
- Phase-39 数据报表 (库存周转率)
- Phase-40 智能推荐 (基于购买历史)

---

## 7. 反模式预引用

- [markpaid-idempotency.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/markpaid-idempotency.md): 库存操作幂等
- [residual-pending-state.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/residual-pending-state.md): 库存状态机闭合
- [naming-consistency.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/naming-consistency.md): 派发前盘点

---

> 🦞 **"Phase-37 库存 = SaaS 核心运营 = 业务深耕第 3 步"**

待 Phase-36 T166-1/2/3 完成后启动 T167。