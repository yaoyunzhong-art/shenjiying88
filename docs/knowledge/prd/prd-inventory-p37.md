# PRD-008: 库存采购 — Inventory & Procurement (P-37)

> 版本: v1.0 · 签发人: 🦞 龙虾哥 · 对接专家: E35 供应链
> 发布日期: 2026-07-13 · 状态: 🟢 已签发
> 关联Phase: P-37

---

## 1. 业务背景

店A有商品库存（饮品/零食/文创），需要管理进销存。当前无系统，店长用手记。

## 2. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-37-01 | 商品库存管理 | P0 | 增删改商品(名称/单价/库存量/品类) |
| RQ-37-02 | 入库记录 | P0 | 采购入库: 商品+数量+采购价+入库时间 |
| RQ-37-03 | 出库扣减 | P0 | 销售自动扣减库存 |
| RQ-37-04 | 库存预警 | P1 | 库存<下限自动标记"需补货" |
| RQ-37-05 | 采购单 | P1 | 创建采购单->审批->入库 |
| RQ-37-06 | 库存盘点 | P2 | 手动盘点+差异记录 |

## 3. 验收卡

| 卡ID | 场景 | 前置 | 预期 |
|:----|:-----|:-----|:-----|
| AC-37-01 | 创建商品 | 品类"饮品" | 商品创建成功, 库存=0 |
| AC-37-02 | 入库+100 | 商品存在 | 库存从0→100 |
| AC-37-03 | 销售扣减 | 库存100, 卖出2 | 库存98 |
| AC-37-04 | 库存不足 | 库存1, 卖出2 | 提示"库存不足, 仅剩1" |
| AC-37-05 | 预警: 下限5, 库存3 | 库存3 | 标记"需补货" |

## 4. 数据模型

```typescript
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;     // 售价(分)
  stock: number;
  minStock: number;      // 预警下限
  updatedAt: Date;
}

interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  unitCost?: number;     // 采购成本价
  orderId?: string;
  remark: string;
  createdAt: Date;
}
```
