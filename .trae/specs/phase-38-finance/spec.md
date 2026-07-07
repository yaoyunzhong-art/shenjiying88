# Phase-38 财务对账 Spec · V1 启动版

> **创建时间**: 2026-06-27 22:00 CST
> **创建人**: 🦞 龙虾哥 (后台 22h 大脑级)
> **状态**: 🟡 框架版,等 Phase-37 完成后启动
> **预计**: 1.5 天工期

---

## 0. 现状盘点 (派发前必做 · R-07 V2)

**⚠️ 必须做**:派发 T168 任务卡前,先盘点财务对账模块。

待验证:
- `apps/api/src/modules/finance/` 或 `billing/` 是否存在
- `Reconciliation` / `Ledger` / `Settlement` 实体
- 与 Phase-35 收银台集成现状
- 第三方支付回调处理

---

## 1. 业务目标

财务对账是 SaaS 平台资金安全核心:
- **每日对账**:订单/支付/退款三方数据校验
- **差异处理**:自动找出对账不平订单
- **结算管理**:商家结算周期 + 抽佣计算
- **财务报表**:日/周/月营收报表
- **税务核算**:开票 + 增值税 + 企业所得税

依赖 Phase-35 收银台(订单/支付)+ Phase-36 会员(会员消费)。

---

## 2. 数据模型 (待盘点后详细化)

### ReconciliationRecord (对账记录)
```typescript
interface ReconciliationRecord {
  id: string
  tenantId: string
  brandId: string
  date: string                 // 对账日期 YYYY-MM-DD
  
  // 平台订单数据
  orderCount: number
  orderTotalCents: number
  
  // 支付通道数据
  channelOrderCount: number
  channelTotalCents: number
  
  // 差异
  diffOrderCount: number       // 数量差
  diffTotalCents: number       // 金额差
  
  status: 'PENDING' | 'MATCHED' | 'DISCREPANCY' | 'RESOLVED'
  
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  notes?: string
}
```

### Discrepancy (差异订单)
```typescript
interface Discrepancy {
  id: string
  reconciliationId: string
  orderId: string
  type: 'MISSING_IN_CHANNEL' | 'AMOUNT_MISMATCH' | 'STATUS_MISMATCH'
  expectedAmount: number
  actualAmount?: number
  resolution?: 'IGNORE' | 'MANUAL_REFUND' | 'MANUAL_ADJUST'
  resolvedAt?: string
  resolvedBy?: string
}
```

### Settlement (结算单)
```typescript
interface Settlement {
  id: string
  tenantId: string
  brandId: string
  periodStart: string
  periodEnd: string
  totalSalesCents: number
  totalRefundsCents: number
  netSalesCents: number
  commissionCents: number       // 平台抽佣
  payoutCents: number           // 实际结算
  status: 'PENDING' | 'PAID' | 'FAILED'
  paidAt?: string
  bankAccount?: string
}
```

---

## 3. 任务卡 (T168 · 待拆)

| T-NN | 标题 | 估时 | 依赖 |
|------|------|------|------|
| T168-1 | 对账引擎 + 三方数据校验 | 0.5d | - |
| T168-2 | 差异检测 + 工单处理 | 0.5d | T168-1 |
| T168-3 | 结算周期 + 抽佣计算 | 0.5d | T168-1 |
| T168-4 | 财务报表 + E2E | 0.5d | T168-2 + T168-3 |

**总计**: 2 天

---

## 4. Champion 督导

- **E42 李事业部总经理** (Phase-35~38 多 Phase)
- **E19 王运营总监** (财务 KPI)
- **周会 review**: T168-2 完成后首次

---

## 5. 关键决策待定 (Open Questions)

1. **对账时机**: 每日凌晨 vs 实时?
2. **差异阈值**: 金额差 > 1 元 / 比例 > 0.1% 自动报警?
3. **结算周期**: T+1 / T+7 / 月结?
4. **抽佣比例**: 平台抽 5% / 10% / 阶梯?
5. **税务处理**: 是否需要对接金税系统?

**待大飞哥决策**: 🟡 P1 优先级

---

## 6. 上下游依赖

### 上游 (✅ 已就位)
- Phase-30 SSE 集成层
- Phase-31 多租户隔离
- Phase-33 EventStore
- Phase-35 收银台 (订单 + 支付 + 退款)
- Phase-36 会员 (会员消费记录)
- Phase-37 库存 (销售成本)

### 下游 (待建)
- Phase-39 数据报表 (财务汇总)
- Phase-40 智能推荐 (基于消费力)
- 老板 E41 王董事长 (集团财务 review)

---

## 7. 反模式预引用

- [markpaid-idempotency.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/markpaid-idempotency.md): 对账幂等
- [residual-pending-state.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/residual-pending-state.md): 结算状态机
- [naming-consistency.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/naming-consistency.md): 派发前盘点

---

> 🦞 **"Phase-38 财务 = 资金安全 = 业务深耕第 4 步"**

待 Phase-37 完成后启动 T168。