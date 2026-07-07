# Phase-17 Tasks · 营销 + 社群 + 跨门店优惠券

> 创建: 2026-06-26 00:20 CST · Pulse-66
> 配套 Spec: [./spec.md](./spec.md)
> Owner: E4 张营销 + E16 社群 + E15 内容
> 时间: Pulse-68 → Pulse-71 (4 个 pulse)

---

## Phase 1 · Pulse-68 · E40 P0 跨门店优惠券核心

### T1: 数据模型扩展
- [ ] 创建 `CouponV2` 实体 (含 scope.multi-store 字段)
- [ ] 创建 `CouponRedemptionLog` 实体 (审计日志)
- [ ] Prisma migration 生成 + 应用
- [ ] 单测: scope JSON 验证 (≥3 场景)

### T2: CouponService.redeemCrossStore 实现
- [ ] lifecycle 守卫 (TenantLifecycle.assertCanWriteResource)
- [ ] quota 守卫 (新加 QuotaResourceKind.Coupon, reserve-and-rollback)
- [ ] 业务校验 (storeIds 范围 / minAmount / userSegments)
- [ ] 事务: 更新 coupon.status + 写 redemption_log
- [ ] 失败回滚: quotaService.decrement()

### T3: 跨门店核销 e2e 测试
- [ ] single-store → multi-store 迁移
- [ ] 同一租户 3 门店联动核销
- [ ] 跨租户隔离(防止越权)
- [ ] 事务一致性(部分失败回滚)
- [ ] idempotency:同一订单重复核销不重复扣减

### T4: 性能验证
- [ ] 100 并发核销 < 200ms (p95)
- [ ] Redis 缓存热点 coupon
- [ ] 异步写 redemption_log

**Pulse-68 验收**: E40 P0 闭环 + 跨门店核销可上线

---

## Phase 2 · Pulse-69 · 营销触发器

### T5: 营销触发器模块
- [ ] 创建 `apps/api/src/modules/marketing-trigger/`
- [ ] EventBus 监听 (member.registered / order.completed / share.clicked)
- [ ] CampaignService.fire() 集成 coupon 发放
- [ ] 单测: 4 类触发器各 ≥3 用例

### T6: 营销触发 e2e
- [ ] 用户注册触发新人优惠券
- [ ] 订单完成触发积分翻倍
- [ ] 分享链接触发双方奖励
- [ ] 节日定时触发全员推送
- [ ] 频次控制(同一用户每日 ≤1 次)

### T7: NotificationService 集成
- [ ] 优惠券到账通知(微信/短信)
- [ ] 营销活动提醒
- [ ] 退订机制

**Pulse-69 验收**: 营销触发器可触发 4 类场景,响应 < 100ms

---

## Phase 3 · Pulse-70 · 社群裂变 (40 专家满月复盘)

### T8: ReferralService 实现
- [ ] 分享链接生成 (短码 + 二维码)
- [ ] ReferralService.track(parentId, childId)
- [ ] 奖励计算(积分/优惠券)
- [ ] 追踪率 ≥95% 验证
- [ ] e2e: A → B → C 三级裂变

### T9: 社群渠道集成
- [ ] 微信分享接口
- [ ] 小程序扫码追踪
- [ ] 数据脱敏(隐私合规)

### T10: 40 专家满月复盘
- [ ] Approver 数量统计(目标 ≥5)
- [ ] Champion 任命(目标 ≥1)
- [ ] 专家反馈统计(目标 ≥10)
- [ ] 调整学习方向 + 知识库更新

**Pulse-70 验收**: 社群裂变追踪 + 满月复盘完成

---

## Phase 4 · Pulse-71 · 渠道招商 + 仪表板 + Retro

### T11: 渠道招商自动化
- [ ] webhook 接收外部线索(抖音/小红书/百度)
- [ ] 自动分配(地域 + 门店容量)
- [ ] N 天未跟进自动提醒
- [ ] 漏斗模型(线索 → 体验 → 成交 → 续费)

### T12: 营销 ROI 仪表板
- [ ] Prometheus metrics: coupon_redemption_total / campaign_trigger_total
- [ ] Grafana dashboard: 营销 ROI / 渠道转化 / 裂变追踪
- [ ] tenant dashboard: 单租户营销数据

### T13: Phase-17 Retro
- [ ] lessons-learned/phase-17.md
- [ ] decision-records/DR-004-cross-store-coupon.md
- [ ] patterns/cross-store-transaction.md
- [ ] anti-patterns(如有)
- [ ] dev-roadmap.md 更新 Phase-18 准备

**Pulse-71 验收**: Phase-17 全面闭环 + 衔接 Phase-18 (E7 体验优化)

---

## 📊 任务统计

| 优先级 | 任务数 | Pulse |
|---|---|---|
| **P0** (E40) | 4 (T1-T4) | 68 |
| **P1** (营销) | 3 (T5-T7) | 69 |
| **P1** (社群) | 3 (T8-T10) | 70 |
| **P2** (招商 + 仪表板) | 3 (T11-T13) | 71 |
| **总计** | **13 任务** | **4 pulse** |

---

## 🔗 关联

- [spec.md](./spec.md) · Spec 详情
- [checklist.md](./checklist.md) · 验收清单
- [../../../rfcs/voting/R6-phase-17.md](../../../rfcs/voting/R6-phase-17.md) · RFC 投票
- [../../../debt.md P0-005](../../../debt.md) · E40 P0

---

> 由 main agent 创建,Pulse-67 启动后开始执行 T1
> 每日 standup 更新进度,Phase-17 Retro 写入 lessons-learned/phase-17.md