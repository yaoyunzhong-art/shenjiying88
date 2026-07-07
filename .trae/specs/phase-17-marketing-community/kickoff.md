# Phase-17 Kickoff · 跨门店优惠券 + 营销触发器

> 创建: 2026-06-26 00:40 CST · Pulse-67
> 状态: **READY · 待 Approver 任命(R7)通过后正式 Kickoff**
> Owner: E4 张营销 + E16 郑社群 + E15 吴内容
> P0 关联: **E40 杨客户** · 跨门店优惠券核销
> 时间: Pulse-68 (2026-06-29) Kickoff

---

## 1. 🎯 Kickoff 目标

### 1.1 P0 核心 (E40 杨客户)
- **跨门店会员优惠券核销服务**
- 大客户续约风险 → Phase-17 第一交付
- 详见 [spec.md §1.1](./spec.md)

### 1.2 P1 业务深化
- 营销活动触发器 (4 类)
- 社群裂变追踪 (ReferralService)
- 营销 ROI 仪表板

### 1.3 P2 增值
- 渠道招商自动化
- 内容日历联动
- 完整营销漏斗

---

## 2. 👥 角色分配 (基于 RFC R7 任命)

| 角色 | 专家 | 备注 |
|---|---|---|
| **Owner (主)** | E4 张营销 | RFC R6 提交人,R7 Approver |
| **副 Owner** | E16 郑社群 | R7 Approver,社群 + 裂变主导 |
| **内容负责人** | E15 吴内容 | R7 Approver,内容日历 |
| **P0 Reviewer** | E10 郑财务 | R7 Approver,财务对账 + 优惠券金额 |
| **P0 Reviewer** | E6 刘合规 | R7 Approver,合规 + 隐私 |
| **数据 Champion** | E5 赵数据 | R8 Champion,架构 + 数据 veto |
| **客户 Champion** | E40 杨客户 | R8 Champion,客户视角 veto |
| **技术 Champion** | E9 吴AI | R7 Approver,Phase-19 衔接 |

---

## 3. 📅 Kickoff 时间表

### 3.1 Pulse-67 (今日) · Kickoff 准备
- [x] RFC R7 起草 + 发布
- [x] RFC R8 起草 + 发布
- [x] voting-record.md 初始化
- [x] lint CI 接入 (GitHub Actions + pre-commit)
- [x] Phase-17 Spec 三件套完成
- [ ] 用户审批 R7/R8 (72h 窗口)
- [ ] Approver 投票 (E1/E6/E9/E10/E16 + Champion E5/E40)

### 3.2 Pulse-68 (2026-06-29) · 正式 Kickoff
- [ ] 09:00 - Approver 任命公告
- [ ] 09:30 - Phase-17 Kickoff 会议
  - 议程 1: spec.md 评审
  - 议程 2: tasks.md 拆解
  - 议程 3: checklist.md 验收标准对齐
- [ ] 10:00 - T1 启动 (CouponV2 实体)
- [ ] 14:00 - T2 启动 (CouponService.redeemCrossStore)

### 3.3 Pulse-69 ~ 71 (持续)
- 详见 [tasks.md](./tasks.md)

---

## 4. 🎯 验收标准

### 4.1 Pulse-68 验收 (E40 P0 闭环)
- [ ] CouponV2 实体支持 multi-store
- [ ] CouponService.redeemCrossStore 集成双守卫
- [ ] 5 个 e2e 测试通过
- [ ] 100 并发核销 < 200ms (p95)
- [ ] **P0-005 债务闭环**

### 4.2 Phase-17 全 Phase 验收
- [ ] 13 任务全部完成
- [ ] 20 AC 全部通过
- [ ] KPI 全部达标
- [ ] lessons-learned/phase-17.md 写入
- [ ] decision-records/DR-004-cross-store-coupon.md 创建

---

## 5. ⚠️ 风险与缓解

| 风险 | 影响 | 缓解 | Owner |
|---|---|---|---|
| 跨门店事务一致性 | 数据不一致 | 2PC + 幂等键 | E1 陈架构 |
| 大客户并发核销 | 性能瓶颈 | Redis 缓存 + 异步日志 | E9 吴AI |
| 营销误触发 | 用户投诉 | 频次控制 + 退订 | E4 张营销 |
| 社群裂变追踪漏 | 漏斗不准 | EventBus 重试 | E16 郑社群 |
| R7/R8 投票未通过 | Kickoff 延期 | 用户直批兜底 | main agent |

---

## 6. 🔄 与 Phase-19 后台并行

- Phase-17 (前台): 业务核心
- Phase-19 (后台): 智能化引擎调研已完成,2026-07-09 Kickoff
- 风险: 资源分散 → 缓解: 业务主线优先,智能化后台异步

---

## 7. 📞 Standup 节奏

### 7.1 每日 Standup (15 min)
- 时间: 每日 09:00 (工作日)
- 主持: E5 赵数据 (数据 Champion)
- 工具: [docs/process/daily-standup.md](../../docs/process/daily-standup.md)

### 7.2 Mid-Phase Review (Pulse-69 末)
- 主持: E5 + E40 (双 Champion)
- 议程: T5-T7 营销触发器进展 + Phase-19 准备情况

### 7.3 Phase Retro (Pulse-71 末)
- 主持: E5 + E40
- 输出: lessons-learned/phase-17.md

---

## 8. 🔗 关联文档

- [./spec.md](./spec.md) · Phase-17 详细规格
- [./tasks.md](./tasks.md) · 13 任务拆解
- [./checklist.md](./checklist.md) · 20 AC + 7 KPI
- [../../rfcs/voting/R6-phase-17.md](../../rfcs/voting/R6-phase-17.md) · RFC R6 决议
- [../../rfcs/voting/R7-approver-appointment.md](../../rfcs/voting/R7-approver-appointment.md) · Approver 任命
- [../../rfcs/voting/R8-champion-appointment.md](../../rfcs/voting/R8-champion-appointment.md) · Champion 任命
- [../../debt.md P0-005](../../debt.md) · E40 P0 反馈
- [../../dev-roadmap.md §3](../../dev-roadmap.md) · Phase 路线
- [../../knowledge/lessons-learned/pulse-65.md](../../knowledge/lessons-learned/pulse-65.md) · Pulse-65 retro

---

> 由 main agent 创建,等待 R7/R8 通过后正式启动 Phase-17
> 启动后此文件移到 `kickoff.md` → `kickoff-completed.md` 归档