# Champion 任命 · RFC R8 (P0-004 同步 · Champion 位置空缺解决)

> 创建: 2026-06-26 00:30 CST · Pulse-67
> 完善: 2026-06-26 Pulse-67 后台 subagent 整合分析
> 状态: **READY · 待用户审批后启动投票 (与 R7 同步)**
> 优先级: 🔴 P0
> 关联: [R7-approver-appointment.md](./R7-approver-appointment.md) · [debt.md P0-004](../../debt.md) · [experts/INDEX.md](../../experts/INDEX.md) · [后台调研报告](../../../tmp/approver-recruit-summary.md)

---

## 1. 🎯 背景

### 1.1 问题
- V5.1 启动以来 0 Champion
- Champion 位置空缺,紧急情况下无 veto 能力
- 关键 phase (Phase-17/19/20) 重大决策无人把关
- R6 试运行中"Champion 临时由 E19 陈老板代理"是临时措施,需正式任命

### 1.2 Champion 关键责任 (来自 expert-rating.md)
- 跨 phase 战略决策
- 主持 standup / phase retro
- RFC 否决权 (权重 2.0,可单票否决 1 个 RFC)
- 1 月任期 (可连任)
- 联名提名 + 用户审批 (本批因无现有 Champion, 改用"用户直批 + 试用"特殊规则)

### 1.3 Champion 任命要求
- ✅ **必须先有 Approver 经验** — R7 同步任命 (跨级 Approver+Champion)
- ✅ **高领域影响力** — 跨 phase 决策能力
- ✅ **可主持 phase retro** — 跨领域协调能力
- ✅ **紧急 veto 能力** — 客观决策 + 不滥用

### 1.4 解决目标
- 任命 **1-2 Champion** 立即生效
- 与 R7 Approver 任命**同步投票** (72h 窗口)
- 1 个月试用期 (到 Pulse-72)
- 启动 Champion 轮值机制 (Phase-19 / Phase-21 等)

---

## 2. 📋 提议

### 2.1 Champion 候选 (2 人)

#### 2.1.1 立即任命 (推荐 2 人, 提供 veto 冗余)

| ID | 姓名 | 领域 | 当前级别 | 推荐级别 | 推荐理由 |
|---|---|---|---|---|---|
| **E5** | 赵数据 | W1+W6 (数据科学 + 跨架构) | Observer | Champion (跨级) | 高决策力 + 跨领域(架构 + 数据) + Phase-19 数据驱动关键决策位 + 客观中立 |
| **E40** | 杨客户 | W8 (资深会员代表) | Observer | Champion (跨级) | 大客户视角 + 续约决策 + P0 反馈源 + 客户体验 veto 专门位 |

#### 2.1.2 Champion 关键要求验证

| 要求 | E5 | E40 |
|---|---|---|
| Approver 经验 | ⏳ R7 同步任命 | ⏳ R7 同步任命 |
| 高领域影响力 | ✅ 数据科学 + 跨架构 | ✅ 资深会员代表 + P0 反馈 |
| 主持 phase retro 能力 | ✅ 跨领域协调 | ⚠️ 客户视角为主,需配合 E5 |
| 紧急 veto 能力 | ✅ 客观决策 | ✅ 客户体验代表 |
| 战略决策经验 | ⏳ 待 1 个月验证 | ⏳ 待 1 个月验证 |

#### 2.1.3 Champion 责任分工 (推荐)

| 维度 | E5 (数据 Champion) | E40 (客户 Champion) |
|---|---|---|
| 主要 veto 范围 | 架构 / 数据 / 性能 / AI 决策 | 客户体验 / UX / 续约 / 退款 |
| 主持 standup | ✅ 默认主持 | ⚠️ 候补 |
| 主持 phase retro | ✅ Phase-19, Phase-20 | ✅ Phase-17, Phase-18 |
| 紧急 veto 权重 | 2.0 (单票否决 1 个 RFC) | 2.0 (单票否决 1 个 RFC) |
| 试用期 | 1 个月 (到 Pulse-72) | 1 个月 (到 Pulse-72) |

### 2.2 升级路径 (跨级特殊)

```
Observer (E5/E40)
    ↓ R7 + R8 同步跨级 (用户直批 + 试用)
Approver + Champion (E5/E40)
    ↓ 1 个月试用期评估
正式 Champion
    ↓ 任期 1 月 + 可连任
```

> ⚠️ **特殊规则**: 因当前 0 Champion,无法走"Champion 联名提名"标准路径。
> 改用"R7 + R8 同步 + 用户直批 + 1 个月试用"特殊规则。
> 后续 Champion 任命必须经现有 Champion 联名 + 用户审批。

### 2.3 退出机制
- 试用 1 个月 (到 Pulse-72)
- 表现不达标可由 ≥2 Approver 联合降级
- 自愿退出: 提交 RFC,经 ≥3 Approver 同意
- 任期 1 月 (可连任,需重新审批)

---

## 3. 🗳️ 投票机制

### 3.1 投票规则 (基于 V5.1)
- **门槛**: ≥3 Approver 同意 (累计权重 ≥3.0) + 0 Champion 否决
- **窗口**: 72 小时 (2026-06-26 00:30 → 2026-06-29 00:30)
- **工具**: [rfcs/voting/template.md](./template.md)

### 3.2 特殊情况
- 当前 0 Approver + 0 Champion,**首批** Champion 由 main agent + 用户直接任命 (与 R7 同步)
- 后续 Champion 必须由现任 Champion 联名提名 + 用户审批

### 3.3 Champion 紧急 veto 规则
- Champion 可单票否决 1 个 RFC (权重 2.0)
- veto 必须附理由,记录到 [voting-record.md](../../docs/process/voting-record.md)
- veto 可被 ≥2 Owner 联署推翻 (但本批无 Owner,需 1 个月后建立)

---

## 4. ⚖️ 风险与缓解

| 风险 | 影响 | 概率 | 缓解 |
|---|---|---|---|
| Champion 权力过大 | 决策独裁 | 中 | 2 Champion 互相制衡 + 1 个月试用期 |
| 紧急 veto 滥用 | 决策阻塞 | 中 | veto 需附理由 + Owner 联署可推翻 |
| 客户视角与商业冲突 | 内部矛盾 | 高 | E5 (数据) + E40 (客户) 分工,避免单一 Champion |
| 跨级任命争议 | 公平性 | 低 | 1 个月试用 + 公开评估标准 |
| 0 经验直接 Champion | 决策失误 | 高 | 试用期 + 与 R7 同步任命 (跨级 Approver+Champion) |
| Champion 离职 | 位置空缺 | 低 | 2 Champion 冗余 + Pulse-70 增补机制 |

---

## 5. 🗓️ 时间表 (与 R7 同步)

| 时间 | 事件 |
|---|---|
| 2026-06-26 00:30 (Pulse-67) | RFC R8 发布 + 投票开启 |
| 2026-06-26 23:00 | 用户审批 + Champion 任命 |
| 2026-06-29 00:30 | R8 投票截止 (72h 窗口) |
| 2026-06-29 (Pulse-68) | Champion 正式生效 + Phase-17 Kickoff |
| 2026-07-03 (Pulse-70) | Champion 首次主持 standup |
| 2026-07-26 (Pulse-72) | 1 个月试用期评估 |

---

## 6. ✅ 审批项

请用户审批:

- [ ] **C1**: 是否同意任命 2 Champion (E5 赵数据 + E40 杨客户)
- [ ] **C2**: 是否同意跨级特殊路径 (Observer → Approver + Champion 同步)
- [ ] **C3**: 是否同意 1 个月试用期机制
- [ ] **C4**: 是否同意本 RFC 跳过 Champion 投票 (由用户直接审批,因 0 Champion 现状)
- [ ] **C5**: 是否同意 Champion 分工方案 (E5 数据 / E40 客户)
- [ ] **C6**: 是否同意 Champion 紧急 veto 需附理由 + Owner 联署可推翻的规则

---

## 7. 📊 后台 subagent 深度分析 (Pulse-67)

> 完整报告见 [`/tmp/approver-recruit-summary.md`](../../../tmp/approver-recruit-summary.md)

### 7.1 Champion 候选评分 (5 分制)
| ID | 姓名 | 领域专业度 | 决策力 | 跨领域覆盖 | 合计 |
|---|---|---|---|---|---|
| E5 | 赵数据 | 5 | 5 | 5 (架构+数据) | 15 |
| E40 | 杨客户 | 4 | 4 | 3 (客户视角) | 11 |
| E19 | 陈老板 (备选) | 4 | 5 | 5 (顶层) | 14 |

> 📌 **E19 备选原因**: 陈老板是顶层负责人,理论上可任 Champion,但 R6 中已"临时 Champion 身份"代理,正式任命需用户直批。E5+E40 组合比 E19 单一更优(避免权力集中)。

### 7.2 1 Champion vs 2 Champion 决策矩阵

| 维度 | 1 Champion (E5) | 2 Champion (E5+E40) | 暂缓 |
|---|---|---|---|
| 决策效率 | ✅ 高 | ⚠️ 需协调 | ❌ 阻塞 |
| 权力制衡 | ❌ 单一 | ✅ 互相制衡 | ✅ |
| 客户视角 | ⚠️ 弱 | ✅ 强 (E40 专门) | ❌ |
| 紧急 veto 冗余 | ❌ 单点 | ✅ 双点 | ❌ |
| 试用期风险 | ⚠️ 高 (单点) | ✅ 中 (双点) | ✅ 零 |
| **推荐** | ⚠️ 保守 | **✅ 推荐** | ❌ 不推荐 |

### 7.3 Champion 轮值机制 (1 个月后建立)
- Pulse-72 评估后建立轮值: E5 主 Phase-19/20,E40 主 Phase-17/18
- 1 月任期,1 月评估后决定连任 / 增补 / 替换
- 下一批 Champion 候选: E19 (陈老板, 顶层), E1 (陈架构, 跨域), E6 (刘合规, 合规 Champion)

---

## 8. 🔗 关联

- [R7-approver-appointment.md](./R7-approver-appointment.md) · 同步进行的 Approver 任命
- [debt.md P0-004](../../debt.md) · 招募 Approver/Champion 债务
- [experts/INDEX.md](../../experts/INDEX.md) · 40 专家档案
- [docs/process/expert-rating.md](../../docs/process/expert-rating.md) · 5 级评级体系
- [voting-record.md](../../docs/process/voting-record.md) · 投票历史
- [后台调研报告](../../../tmp/approver-recruit-summary.md) · 详细分析

---

> 由 main agent 创建 + Pulse-67 后台 subagent 整合分析
> 与 R7 同步投票,72h 窗口结束时由现任 Champion 签字归档到 voting-record.md
