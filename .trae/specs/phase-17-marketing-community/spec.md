# Phase-17 Spec · 营销 + 社群 + 跨门店优惠券

> 创建: 2026-06-26 00:15 CST · Pulse-66
> 状态: **DRAFT · 待 Pulse-67 启动**
> Owner: E4 张营销 + E16 社群 + E15 内容
> 关联 RFC: [R6-phase-17.md](../../../rfcs/voting/R6-phase-17.md) (已通过)
> 优先级: 🔴 P0 (含 E40 杨客户 P0 反馈)

---

## 0. 🎯 背景

### 0.1 业务驱动 (E40 杨客户 P0 反馈)
- **核心痛点**: 大型连锁客户跨门店会员优惠券无法核销
- **影响**: 大客户续约风险 + 新租户增长受阻
- **紧急度**: 🔴 P0(已纳入 debt.md P0-005)

### 0.2 RFC R6 投票结果
- **投票时间**: Pulse-64 (2026-06-25)
- **结果**: ✅ 通过 (≥3 Approver 同意 + 0 Champion 否决)
- **决议**: 启动 Phase-17 营销 + 社群 + 内容联动

### 0.3 与其他 Phase 的关系
- **前置依赖**: Phase-15 ~ 16 业务守卫已闭环 ✅
- **后续衔接**: Phase-18 体验优化 (E7 孙体验) + Phase-19 智能化引擎
- **冲突避免**: 与 Phase-19 后台并行(双线策略)

---

## 1. 🏗️ 架构设计

### 1.1 跨门店优惠券服务 (E40 P0)

#### 1.1.1 数据模型扩展
```typescript
// apps/api/src/modules/coupon/coupon.entity.ts 扩展

@Entity('coupon_v2')
export class CouponV2 {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  scope: {
    type: 'single-store' | 'multi-store' | 'tenant-wide';
    storeIds: string[];  // 支持多门店 ID 列表
    includeSubordinates: boolean;  // 是否包含子门店
  };

  @Column({ type: 'jsonb' })
  redemptionRules: {
    minAmount?: number;
    applicableCategories?: string[];
    excludeItems?: string[];
    userSegments?: string[];  // 支持 SVIP / 新客 / 老客
  };

  @Column()
  expiresAt: Date;

  @Column({ default: 'active' })
  status: 'active' | 'paused' | 'expired' | 'exhausted';
}

@Entity('coupon_redemption_log')
export class CouponRedemptionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  couponId: string;

  @Column()
  userId: string;

  @Column()
  storeId: string;  // 实际核销门店(可能与发放门店不同)

  @Column({ type: 'decimal' })
  amount: number;

  @Column()
  orderId: string;

  @CreateDateColumn()
  redeemedAt: Date;
}
```

#### 1.1.2 服务接口
```typescript
// apps/api/src/modules/coupon/coupon.service.ts

export class CouponService {
  // 跨门店核销 (E40 P0 核心)
  async redeemCrossStore(
    userId: string,
    couponCode: string,
    storeId: string,
    orderAmount: number,
  ): Promise<RedemptionResult> {
    // 1. lifecycle 守卫 (lifecycle.assertCanWriteResource)
    // 2. quota 守卫 (QuotaResourceKind.Coupon, increment)
    // 3. 业务校验:
    //    - coupon.scope.storeIds.includes(storeId) || scope.includeSubordinates
    //    - 订单金额 >= redemptionRules.minAmount
    //    - 用户符合 userSegments
    // 4. 事务: 更新 coupon.status + 写 coupon_redemption_log
    // 5. 失败回滚: quotaService.decrement()
  }

  // 批量核销(订单合并支付场景)
  async batchRedeem(
    redemptions: RedemptionRequest[],
  ): Promise<RedemptionResult[]>;

  // 营销触发(新)
  async triggerByCampaign(
    campaignId: string,
    userSegment: string,
  ): Promise<CouponDistributionResult>;
}
```

### 1.2 营销活动触发器

#### 1.2.1 模块位置
- **新模块**: `apps/api/src/modules/marketing-trigger/`
- **依赖**: campaign.service + coupon.service + notification.service

#### 1.2.2 触发器类型
| 类型 | 描述 | 实现 |
|---|---|---|
| **Event-based** | 用户行为触发(注册/购买/分享) | EventBus 监听 |
| **Time-based** | 定时触发(节日/会员日) | cron job |
| **Campaign-based** | 营销活动手动触发 | CampaignService.fire() |
| **AI-based (Phase-19)** | LLM 推荐触发 | RAG + 业务 metrics |

### 1.3 社群裂变追踪 (E16 社群)

#### 1.3.1 追踪链路
```
用户 A 分享链接 → 用户 B 点击 → 注册/下单 → 关联 userId
                                                    ↓
                                  ReferralService.track(parentId, childId)
                                                    ↓
                                  计算 reward(积分/优惠券)
```

#### 1.3.2 数据模型
```typescript
@Entity('referral_relation')
export class ReferralRelation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  parentUserId: string;  // 分享者

  @Column()
  childUserId: string;  // 注册者

  @Column()
  shareCode: string;

  @Column()
  shareChannel: 'wechat' | 'qrcode' | 'link';

  @CreateDateColumn()
  createdAt: Date;
}
```

### 1.4 渠道招商自动化 (E24)

#### 1.4.1 自动化场景
- **线索接入**: webhook 接收外部渠道(抖音/小红书/百度)线索
- **自动分配**: 根据地域 + 门店容量分配给店长
- **自动跟进**: N 天未跟进自动提醒 + 升级到区域经理
- **转化追踪**: 漏斗模型(线索 → 体验 → 成交 → 续费)

---

## 2. 📦 交付清单 (按优先级)

### P0 核心 (E40 杨客户)
- [ ] **T1**: CouponV2 实体 + scope.multi-store 支持
- [ ] **T2**: CouponService.redeemCrossStore 实现
- [ ] **T3**: 跨门店核销 e2e 测试 (≥5 场景)
- [ ] **T4**: 性能验证:跨门店核销响应 < 200ms

### P1 业务深化
- [ ] **T5**: 营销触发器模块 marketing-trigger
- [ ] **T6**: CampaignService.fire() 集成 coupon 发放
- [ ] **T7**: 营销触发 e2e 测试 (≥5 场景)
- [ ] **T8**: 社群裂变 ReferralService + 追踪率 ≥95%

### P2 增值
- [ ] **T9**: 渠道招商自动化(线索接入 + 自动分配)
- [ ] **T10**: 内容日历联动 (E15 内容)
- [ ] **T11**: 营销 ROI 仪表板
- [ ] **T12**: 社群裂变追踪率 ≥95% 验证

---

## 3. 🧪 测试策略

### 3.1 单元测试 (单测)
- CouponV2 entity 验证 (scope JSON 结构)
- CouponService.redeemCrossStore 各分支
- ReferralService.track 链路
- 覆盖率目标: ≥85%

### 3.2 E2E 测试 (验收)
- **E40 P0**: 跨门店核销
  - single-store → multi-store 迁移场景
  - 同一租户 3 门店联动核销
  - 跨租户隔离(防止越权)
  - 事务一致性(部分失败回滚)
  - 性能压测:100 并发核销 < 200ms

### 3.3 集成测试
- Campaign → Coupon 联动
- Notification → Coupon 触发提醒
- Quota guard 集成 (QuotaResourceKind.Coupon)

---

## 4. 📅 时间表

| Pulse | 任务 | Owner |
|---|---|---|
| **Pulse-67** | Spec 三件套完成 + RFC R6 公告 + 招募 Approver | main + E1 |
| **Pulse-68** | T1-T3 跨门店优惠券核心 + e2e | E4 + E11 |
| **Pulse-69** | T4-T5 营销触发器 + 性能验证 | E4 + W2-L2 |
| **Pulse-70** | T6-T8 营销 + 社群 (40 专家满月复盘) | E16 + E15 |
| **Pulse-71** | T9-T12 渠道招商 + 仪表板 + Retro | E24 + W6-L4 |

**预计结束**: 2026-07-08 (5 个 pulse, 10 天)

---

## 5. ⚠️ 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 跨门店事务一致性 | 数据不一致 | 2PC + 幂等键 |
| 大客户并发核销 | 性能瓶颈 | Redis 缓存 + 异步写日志 |
| 社群裂变追踪率 | 漏斗不准确 | EventBus + 重试机制 |
| 营销触发误触发 | 用户投诉 | 频次控制 + 取消订阅 |

---

## 6. 🔗 关联文档

- [RFC R6-phase-17.md](../../../rfcs/voting/R6-phase-17.md) · 投票决议
- [debt.md P0-005](../../../debt.md) · E40 P0 反馈
- [dev-roadmap.md §3](../../../dev-roadmap.md) · Phase 路线
- [knowledge/patterns/quota-guard.md](../../patterns/quota-guard.md) · 双守卫模式(必读)
- [knowledge/patterns/reserve-rollback.md](../../patterns/reserve-rollback.md) · 回滚模式
- [knowledge/decision-records/DR-001-multi-tenant-guard.md](../../decision-records/DR-001-multi-tenant-guard.md) · 多租户守卫
- [knowledge/lessons-learned/phase-15.md](../../lessons-learned/phase-15.md) · Phase-15 经验

---

## 7. ✅ 审批项

请用户审批:

- [ ] **R1**: 是否同意 T1-T4 (E40 P0) 立即启动
- [ ] **R2**: 是否同意 T5-T8 (营销 + 社群) 与 T9-T12 (招商 + 仪表板) 同步推进
- [ ] **R3**: 是否同意引入新 QuotaResourceKind.Coupon
- [ ] **R4**: 是否同意时间表 (Pulse-68 ~ 71, 4 个 pulse)
- [ ] **R5**: 是否同意 Owner: E4 张营销 + 副 Owner: E16 社群

---

> 由 Pulse-66 创建,等待 Pulse-67 Spec 审批后启动实施
> Spec 模式: spec.md (本文件) → tasks.md → checklist.md