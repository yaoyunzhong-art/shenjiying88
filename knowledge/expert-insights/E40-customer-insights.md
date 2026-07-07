# E40 杨客户 · 客户视角专家洞察

> 创建: 2026-06-26 · Pulse-68
> 专家: E40 杨客户 (W8-资深会员代表,跨级 Champion 候选)
> 状态: 待 R8 通过后正式 Champion

---

## 1. 🎯 关注领域

- 客户体验 / UX
- 续约决策
- 大客户反馈
- 退款 / 投诉

---

## 2. 💡 核心洞察

### 洞察 1: 大客户要的不是功能,是确定性

**观点**: 续约的关键不是功能多寡,而是**稳定 + 可预期**。

**实践**:
- SLA 文档化 (P95 < 200ms, 可用性 > 99.9%)
- 提前告警 (而非事后解释)
- 大客户专属通道 (紧急响应 < 1h)

---

### 洞察 2: P0 反馈来自一线使用,不是销售

**观点**: 真正的产品问题由日常使用的运营 / 收银员发现,不是销售或高层。

**实践**:
- 月度客户访谈 (真实使用者)
- 关键操作埋点 (哪里卡顿 / 放弃率高)
- NPS + 流失原因分析

---

### 洞察 3: 跨门店优惠券 (P0-005) = 大客户续约命脉

**观点**: 跨门店核销是连锁客户的核心需求,缺失会导致续约失败。

**实践**:
- Phase-17 核心交付
- Coupon V2 + scope.multi-store
- 跨门店核销响应 < 200ms
- 失败快速回滚 (不丢客户信任)

---

## 3. 📋 Phase-17 客户视角 KPI

| KPI | 目标 |
|---|---|
| 跨门店核销成功率 | ≥ 99.5% |
| 核销响应 P95 | < 200ms |
| 大客户续约率 | ≥ 90% |
| NPS 评分 | ≥ 50 |

---

## 4. 🔗 关联

- [decision-records/DR-001-multi-tenant-guard.md](../decision-records/DR-001-multi-tenant-guard.md)
- [patterns/saga-pattern.md](../patterns/saga-pattern.md)
- [best-practices/multi-tenant-isolation.md](../best-practices/multi-tenant-isolation.md)
