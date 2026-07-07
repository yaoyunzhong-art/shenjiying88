# Phase-17 Checklist · 验收清单

> 创建: 2026-06-26 00:20 CST · Pulse-66
> 配套: [./spec.md](./spec.md) + [./tasks.md](./tasks.md)

---

## 🚦 阶段验收门禁

### Pulse-68 · E40 P0 跨门店优惠券核心
- [ ] **AC-1**: CouponV2 实体支持 `scope.multi-store` (storeIds: string[])
- [ ] **AC-2**: CouponRedemptionLog 实体完整(订单 + 门店 + 用户关联)
- [ ] **AC-3**: CouponService.redeemCrossStore 实现 lifecycle + quota 双守卫
- [ ] **AC-4**: 5 个 e2e 场景全部通过
- [ ] **AC-5**: 100 并发核销 p95 < 200ms
- [ ] **AC-6**: P0-005 债务标记闭环

### Pulse-69 · 营销触发器
- [ ] **AC-7**: marketing-trigger 模块创建并注册
- [ ] **AC-8**: 4 类触发器(Event/Time/Campaign/AI-stub)全部上线
- [ ] **AC-9**: 营销 e2e 测试 ≥5 场景通过
- [ ] **AC-10**: NotificationService 集成 + 退订机制
- [ ] **AC-11**: 营销触发响应 < 100ms (p95)

### Pulse-70 · 社群裂变 + 满月复盘
- [ ] **AC-12**: ReferralService.track(parentId, childId) 实现
- [ ] **AC-13**: 裂变追踪率 ≥95% (e2e 验证)
- [ ] **AC-14**: 微信分享 + 小程序扫码集成
- [ ] **AC-15**: 40 专家满月复盘完成
  - [ ] Approver 数量 ≥5
  - [ ] Champion 任命 ≥1
  - [ ] 专家反馈 ≥10

### Pulse-71 · 招商 + 仪表板 + Retro
- [ ] **AC-16**: 渠道招商 webhook + 自动分配
- [ ] **AC-17**: N 天未跟进自动提醒
- [ ] **AC-18**: Prometheus metrics 暴露(coupon/campaign/referral)
- [ ] **AC-19**: Grafana dashboard 上线
- [ ] **AC-20**: Phase-17 Retro 完成
  - [ ] lessons-learned/phase-17.md 写入
  - [ ] decision-records/DR-004-cross-store-coupon.md 创建
  - [ ] patterns/cross-store-transaction.md 创建

---

## 📊 KPI 验收

| 指标 | 目标 | 测量方式 |
|---|---|---|
| 跨门店核销响应 | < 200ms (p95) | k6 压测 |
| 营销触发响应 | < 100ms (p95) | 单测 + 集成测试 |
| 社群裂变追踪率 | ≥95% | e2e + production 统计 |
| e2e 测试通过率 | 100% | `pnpm test:e2e` |
| 单测覆盖率 | ≥85% | `pnpm test:cov` |
| 业务 service 接入 guard | 8/29 (新增 Coupon) | debt.md |
| TSC 错误 | 0 | `pnpm typecheck` |

---

## ⚠️ 风险门禁

### 高风险(必须监控)
- [ ] **R-1**: 跨门店事务一致性 → 2PC + 幂等键
- [ ] **R-2**: 大客户并发核销 → Redis 缓存
- [ ] **R-3**: 营销误触发 → 频次控制 + 退订

### 中风险(每周 review)
- [ ] **R-4**: 社群裂变漏斗准确性 → EventBus 重试
- [ ] **R-5**: 渠道招商合规 → 数据脱敏
- [ ] **R-6**: 营销 ROI 真实性 → 多渠道归因模型

---

## 🧪 测试矩阵

### 单元测试
- [ ] CouponV2 entity scope JSON 验证
- [ ] CouponService.redeemCrossStore 各分支
- [ ] ReferralService.track 链路
- [ ] MarketingTriggerService.fire 各类型

### E2E 测试
- [ ] 跨门店核销 5 场景
- [ ] 营销触发 5 场景
- [ ] 社群裂变 3 场景(A→B→C)
- [ ] 渠道招商 2 场景(webhook + 分配)

### 集成测试
- [ ] Campaign → Coupon → Notification 联动
- [ ] Referral → Reward → Notification 联动

### 性能测试
- [ ] 跨门店 100 并发 < 200ms
- [ ] 营销 1000 并发 < 100ms
- [ ] 裂变追踪 10000 关系查询 < 500ms

---

## 🔄 与 Phase-19 后台并行检查

- [ ] Phase-19 后台调研完成(LLM 选型 + RAG + lint) ✅
- [ ] Phase-19 Kickoff 2026-07-09 不冲突
- [ ] Phase-17 Retro 与 Phase-19 Kickoff 衔接

---

## ✅ 最终验收 (Phase-17 收尾)

- [ ] 所有 AC-1 ~ AC-20 通过
- [ ] 所有 KPI 达标
- [ ] 所有 R-1 ~ R-6 风险缓解方案落地
- [ ] Phase-17 Retro 文档完成
- [ ] dev-roadmap.md 更新 Phase-18 准备
- [ ] debt.md P0-005 标记闭环

---

> 由 main agent 创建,每个 Pulse 收尾时勾选对应 AC
> 全部 ✅ 后,Phase-17 视为全面闭环