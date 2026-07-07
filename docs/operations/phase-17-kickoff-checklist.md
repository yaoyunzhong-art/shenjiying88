# Phase-17 Kickoff 检查清单 (Day 4 启动)

> 创建: Pulse-68 Day 4 准备
> 适用: R6 通过 + R7/R8 完成后立即启动
> 关联: [.trae/specs/phase-17-marketing-community/kickoff.md](../../.trae/specs/phase-17-marketing-community/kickoff.md)

---

## ✅ 启动前置条件 (Pre-Kickoff Gate)

- [x] **R6 (Phase-17 计划)** ✅ 已通过 (4.5 权重, 5 票)
- [ ] **R7 (Approver 招募)** ⏳ 等待用户直批
- [ ] **R8 (Champion 任命)** ⏳ 等待用户直批
- [ ] **脚手架就绪** ✅ CouponV2 + RetrievalModule + RFC 自动化
- [ ] **72h 等待期** ⏳ 截止 2026-06-29 00:30 CST

---

## 📋 Kickoff 议程 (2026-06-29 09:30 CST)

### Part 1: 状态汇报 (10 min)
- [ ] R6/R7/R8 投票结果回顾
- [ ] Phase-17 三件套 (spec.md / tasks.md / checklist.md) 状态
- [ ] 知识库全景 (78 文件 / 9905 行)

### Part 2: 团队分工 (15 min)
- [ ] Owner 任命: E16 郑社群 (主) + E1 陈架构 (副)
- [ ] Approver 对接: E1/E6/E9/E10/E16 (5 人)
- [ ] Champion 对接: E5 赵数据 + E40 杨客户
- [ ] Kickoff Owner 选定

### Part 3: 13 任务拆解 (20 min)
- [ ] T1-T4 (Pulse-68): Coupon 跨门店实施 + 营销脚手架
- [ ] T5-T7 (Pulse-69): 营销触发器 + 转化漏斗
- [ ] T8-T10 (Pulse-70): 社群裂变 + 招商漏斗
- [ ] T11-T13 (Pulse-71): 招商 + 仪表板 + Retro

### Part 4: 风险与缓解 (5 min)
- [ ] R7-R8 风险 (任命冲突)
- [ ] Phase-17 风险 (K-factor < 1.0)
- [ ] 双线并行风险 (Phase-17 + Phase-19 资源竞争)

### Part 5: 下一步行动 (10 min)
- [ ] 立即启动 T1 (CouponV2 redeemCrossStore 实施)
- [ ] 启动 Phase-19 RAG 索引 (Pulse-71)
- [ ] 24h 内召开第一次 Standup

---

## 🎯 T1-T4 详细任务 (Pulse-68)

> 来源: [tasks.md](../../.trae/specs/phase-17-marketing-community/tasks.md)

### T1: CouponV2 实体 (2026-06-29 10:00 - 14:00)
- [ ] entity 已完成 (Phase-15E 已有)
- [ ] 索引优化 (tenant_id + coupon_code 复合)
- [ ] 单测覆盖 (cross-store quota guard)

### T2: redeemCrossStore 业务逻辑 (2026-06-29 14:00 - 18:00)
- [ ] 头部 assertCanWriteResource (lifecycle 守卫)
- [ ] 中部 reserve 跨门店 quota
- [ ] 尾部 increment quota + 失败 rollback
- [ ] 单测 + e2e

### T3: 营销活动脚手架 (2026-06-30 09:00 - 18:00)
- [ ] Campaign entity
- [ ] CampaignService CRUD
- [ ] 跨门店触发器接口

### T4: Approver review 节点 (2026-07-01 09:00 - 12:00)
- [ ] T1-T3 提交 PR
- [ ] E1/E6/E9 review
- [ ] E5 Champion 签字
- [ ] merge + tag pulse-68

---

## 📊 启动 KPI

| 指标 | 目标 | 测量方式 |
|---|---|---|
| T1-T4 完成率 | 100% | tasks.md 勾选 |
| 单测覆盖率 | ≥80% | vitest --coverage |
| Approver review 通过率 | 100% | PR approval |
| Champion 签字 | 2/2 | 全部 Pulse 结束 |
| 文档同步 | 100% | knowledge/ 更新 |

---

## 🛡️ 风险缓解

| 风险 | 等级 | 缓解 |
|---|---|---|
| T2 业务复杂度过高 | 🟠 中高 | Owner E16 + Approver E1 实时 review |
| Approver 投票疲劳 | 🟡 中 | Champion 督促 + Standup 同步 |
| Phase-19 资源抢占 | 🟡 中 | 双线分工明确: 主 Phase-17,辅 Phase-19 索引器 |
| T3 营销活动与现有冲突 | 🟡 中 | T1 完成后立即做现有 Campaign 模块审计 |

---

## 🔗 关联文档

- [.trae/specs/phase-17-marketing-community/spec.md](../../.trae/specs/phase-17-marketing-community/spec.md) · Phase-17 Spec
- [.trae/specs/phase-17-marketing-community/tasks.md](../../.trae/specs/phase-17-marketing-community/tasks.md) · 13 任务
- [.trae/specs/phase-17-marketing-community/checklist.md](../../.trae/specs/phase-17-marketing-community/checklist.md) · 20 AC
- [.trae/specs/phase-17-marketing-community/kickoff.md](../../.trae/specs/phase-17-marketing-community/kickoff.md) · Kickoff 原文
- [docs/operations/r7-r8-approval-checklist.md](r7-r8-approval-checklist.md) · R7/R8 用户直批清单

---

**Phase-17 Kickoff 启动条件**: R6 ✅ + R7 ⏳ + R8 ⏳ + 用户批准 → 立即 kickoff (2026-06-29 09:30 CST)