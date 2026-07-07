# DR-004 Cross-Store Coupon Design Decision

> 状态: ACCEPTED · 2026-06-26 · Phase-17 Pulse-68

## 背景

神机营 SaaS 优惠券从 V1 (single-store 单一门店) 升级到 V2 (multi-store / tenant-wide 跨门店)。
原 V1 设计在 tenantId 下强制绑定 storeId,导致:
- 总部发券无法跨门店使用
- 多门店品牌运营成本高
- 用户体验差 (同一券在一门店用了,另一门店要重新发)

## 决策

采用 **scope JSONB 字段** 而非 storeId 字段:

```typescript
interface CouponScope {
  type: 'single-store' | 'multi-store' | 'tenant-wide';
  storeIds: string[];
  includeSubordinates: boolean;
}
```

### 选项对比

| 方案 | 优点 | 缺点 | 评分 |
|---|---|---|---|
| **A. scope JSONB (采纳)** | 向后兼容 + 灵活扩展 | 索引复杂 | ⭐⭐⭐⭐ |
| B. 加 scopeType + 多对多 coupon_store 表 | 强关系 + 索引清晰 | 改 schema + 迁移成本 | ⭐⭐⭐ |
| C. 强制 tenant-wide (废弃 single-store) | 最简单 | 破坏现有 V1 数据 | ⭐ |

## 关键设计点

### 1. scope.type 决定匹配策略
- `single-store`: storeIds 必须 1 个,核销时 strict 匹配
- `multi-store`: storeIds 多个,核销时 includes 检查
- `tenant-wide`: storeIds 任意 (空也可),核销时跳过 store 检查

### 2. includeSubordinates 字段预留
- 未来支持店长管理:subordinates 门店也可核销
- V1 不实现,V2 spec §1.1.1

### 3. 复合索引 (tenantId, code) unique
- 保证同租户 code 不重复
- 不在 scope 加索引 (JSONB GIN 是 V2 工作)

### 4. reserve-and-rollback 守卫
- 业务校验失败 throw CouponBusinessError,catch 块识别
- 不直接 return success:false (会导致 quota 不回滚)

## 后果

### 正面
- V1 数据兼容 (旧券 scope 自动迁移为 single-store)
- 跨门店核销上线,E40 P0 闭环
- 总部可统一发券,降低运营成本

### 负面
- scope JSONB 难做 SQL 复杂查询 (V2 可加 GIN 索引)
- 业务代码需处理 3 种 scope type (但类型系统保证)

## 关联

- [cross-store-transaction.md](../patterns/cross-store-transaction.md) · 模式
- [Phase-17 lessons](../lessons-learned/phase-17.md) · 整体复盘
- [coupon.entity.ts](../../apps/api/src/modules/coupon/coupon.entity.ts) · 实现

---

> 决策者: E4 张营销 + E15 内容 · Champion: E5
> 实施: Pulse-68 · commit 84afd6bda
