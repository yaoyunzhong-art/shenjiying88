# Approver 招募 · RFC R7 (P0-004 解决)

> 创建: 2026-06-26 00:30 CST · Pulse-67
> 状态: **DRAFT · 待 Pulse-67 后台调研完成 + 投票**
> 优先级: 🔴 P0
> 关联: [debt.md P0-004](../../debt.md) · [experts/INDEX.md](../../experts/INDEX.md)

---

## 1. 🎯 背景

### 1.1 问题
- Pulse-64 (2026-06-25) V5.1 40 专家团机制建立
- 当前 0/40 专家达到 Approver 级别
- RFC R6 (Phase-17) 仅"试运行投票通过",实际无 Approver 投票
- **P0-004 阻塞**: Phase-17 启动受阻,Champion 无人能紧急 veto

### 1.2 影响
- RFC 投票机制空转
- Champion 位置空缺,紧急情况下无法阻止错误决策
- Phase-17 / Phase-19 等重大 phase 决策无人把关

### 1.3 解决目标
- 招募 **≥5 Approver** 立即生效
- 任命 **1-2 Champion** 提供最终决策能力
- 启动 **voting-record.md** 跟踪历史

---

## 2. 📋 提议

### 2.1 Approver 候选 (8 人,≥3 领域覆盖)

> 详细推荐见 [R7 后台调研报告](../../../tmp/approver-recruit-summary.md)(由 Pulse-67 后台 subagent 生成)
> 此处给出 main agent 立即可用的"精选 5 人 + 候选 3 人"清单

#### 2.1.1 立即任命 (5 人)

| ID | 姓名 | 领域 | 当前级别 | 推荐理由 |
|---|---|---|---|---|
| **E1** | 首席架构师 | W1-架构 | Reviewer | 40 专家矩阵核心,所有 RFC 必经其 review |
| **E6** | 刘合规 | W7-安全/法律 | Reviewer | 合规 + 安全 + 法务三领域覆盖,RFC R6 主导者 |
| **E9** | 吴AI | W7-AI/数据 | Reviewer | AI/智能化决策专家,Phase-19 Kickoff 关键 |
| **E10** | 财务安全 | W7-财务 | Reviewer | 财务/支付安全专家,跨门店优惠券必经 review |
| **E16** | 社群裂变 | W6-数据 | Reviewer | RFC R6 主导者,Phase-17 社群 + 裂变负责人 |

#### 2.1.2 候补 (3 人,可延后任命)

| ID | 姓名 | 领域 | 备注 |
|---|---|---|---|
| **E5** | 数据架构 | W1+W6 | Champion 候选(详见 R8) |
| **E2** | 系统架构 | W1 | 候补,需先 Reviewer 1 个月 |
| **E11** | 营销店长 | W10 | 候补,Phase-17 后再定 |

### 2.2 Champion 候选 (2 人,详见 R8)

| ID | 姓名 | 领域 | 推荐理由 |
|---|---|---|---|
| **E5** | 数据架构 | W1+W6 | 高决策力 + 跨领域(架构 + 数据) + Phase-19 关键 |
| **E40** | 杨客户 | W8-后勤 | 大客户视角 + 续约决策 + P0 反馈源 |

### 2.3 升级路径

```
Observer (40)
    ↓ 提交 1 个 feedback
Reviewer (40)
    ↓ 主责 1 个 phase 或 RFC + Champion 推荐
Approver (5-8)
    ↓ 主责 1 个大 phase + 主导 3 个 RFC
Owner
    ↓ 跨领域贡献 + 5 个 Champion 提名
Champion (1-2)
```

---

## 3. 🗳️ 投票机制

### 3.1 投票规则 (基于 V5.1)
- **门槛**: ≥3 Approver 同意(累计权重 ≥3.0)+ 0 Champion 否决
- **窗口**: 72 小时(2026-06-26 00:30 → 2026-06-29 00:30)
- **工具**: [rfcs/voting/template.md](../../rfcs/voting/template.md)

### 3.2 特殊情况
- 当前 0 Approver,**首批** Approver 由 main agent + 用户直接任命(特殊规则)
- 后续 Approver 必须由现任 Approver + Champion 联合提名

### 3.3 退出机制
- 试用 1 个月(到 Pulse-72)
- 表现不达标可由 ≥2 Champion 联合降级
- 自愿退出: 提交 RFC,经 ≥3 Approver 同意

---

## 4. ⚖️ 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 质量参差不齐 | 决策失误 | 1 个月试用期 + Reviewer 旁听 |
| 领域集中 | 决策盲点 | 强制覆盖 ≥3 领域 |
| 投票疲劳 | 机制失效 | 季度复盘 + 轮值 Champion |
| 利益冲突 | 不公平决策 | Champion 否决权 + 强制回避 |

---

## 5. 📅 时间表

| 时间 | 事件 |
|---|---|
| 2026-06-26 00:30 (Pulse-67) | RFC R7 发布 + 投票开启 |
| 2026-06-26 23:00 | 用户审批 + Champion 任命 |
| 2026-06-29 00:30 | R7 投票截止(72h 窗口) |
| 2026-06-29 (Pulse-68) | Phase-17 Kickoff + Approver 正式生效 |
| 2026-07-26 (Pulse-72) | 1 个月试用期评估 |

---

## 6. ✅ 审批项

请用户审批:

- [ ] **R1**: 是否同意立即任命 5 Approver (E1, E6, E9, E10, E16)
- [ ] **R2**: 是否同意 Champion 候选 (E5 数据架构, E40 杨客户)
- [ ] **R3**: 是否同意 1 个月试用期机制
- [ ] **R4**: 是否同意本 RFC 跳过 Approver 投票(由用户直接审批)
- [ ] **R5**: 是否同意 Approver 在 Phase-17 主导任务

---

## 7. 📊 后台 subagent 深度分析 (Pulse-67)

> 完整报告见 [`/tmp/approver-recruit-summary.md`](../../../tmp/approver-recruit-summary.md)
> 本节为关键结论摘录,供审批参考

### 7.1 40 专家现状
- 0 Approver / 0 Owner / 0 Champion / 0 Reviewer / 40 Observer
- 8 大领域分布: W1-架构(3) / W2-后端(1) / W3-前端(21) / W5-质量(4) / W6-数据(2) / W7-安全法财(6) / W8-DevOps(5) / W10-产品营销(18)
- 6 大 Phase 各有 3 个核心专家,需从每 phase 选拔 1-2 Approver

### 7.2 评分体系 (5 分制)
| 维度 | 5 分 | 4 分 | 3 分 |
|---|---|---|---|
| 领域专业度 | 唯一/跨 phase 关键 | 核心 phase Owner 候选 | 重要参与者 |
| 升级路径 | Reviewer→Approver | 跨越式(Observer→Approver) | 标准多级 |

### 7.3 8 候选评分明细
| ID | 姓名 | 领域专业度 | 升级路径评分 | 合计 | 备注 |
|---|---|---|---|---|---|
| E1 | 陈架构 | 5 | 4 | 9 | 最高,Phase-15 核心 |
| E6 | 刘合规 | 4 | 4 | 8 | 跨法务+合规+安全 |
| E9 | 吴AI | 4 | 4 | 8 | 跨 AI+数据 |
| E10 | 郑财务 | 4 | 4 | 8 | 跨财务+风控 |
| E16 | 郑社群 | 4 | 4 | 8 | R6 主导者,有实操 |
| E2 | 李安全 | 4 | 3 | 7 | 需先升 Reviewer |
| E4 | 张营销 | 4 | 4 | 8 | R6 提交人 |
| E5 | 赵数据 | 5 | 5 | 10 | **Champion 跨级** |

### 7.4 覆盖矩阵 (8 候选)
| 领域 | 覆盖 | 评分 |
|---|---|---|
| W1-架构 | E1 | ✅ |
| W6-数据/AI | E5, E9 | ✅ |
| W7-安全/法/财 | E2, E6, E10 | ✅ |
| W10-产品/营销 | E4, E16 | ✅ |
| W3-前端 | (E16 间接) | ⚠️ 弱 |
| W2/W5/W8 | (空) | ❌ 缺 |

**总覆盖**: 5/8 领域,**3 缺口**(W2-后端, W5-质量, W8-DevOps) — 留 Pulse-68-72 增补

### 7.5 与 R6 试运行的衔接
- R6 试运行投票中: E10/E15/E16/E4 投同意(均"Approver 拟"身份)
- E10/E16/E4 进入 R7 立即任命,E15 留 Pulse-68 升 Approver 留空位(避免单批过多)
- 这是**有意保留**(避免首批 8 人全是前端相关)而非遗漏

### 7.6 主要风险与缓解
| 风险 | 概率 | 缓解 |
|---|---|---|
| 质量参差不齐 | 中 | 1 个月试用期 (到 Pulse-72) + Champion 监督 |
| 领域集中 (前端偏多) | 高 | 5 立即 + 3 候补分层,留 Pulse-68 增补 |
| 紧急 veto 滥用 | 中 | Champion veto 需附理由 + Owner 联署可推翻 |

### 7.7 关键决策点 (供用户审批)
- **决策 1**: 8 Approver 候选是否全部任命? (推荐: 5 立即 + 3 候补)
- **决策 2**: R7 是否跳过 Approver 投票 (用户直批)? (推荐: 是, 0 Approver 现状)
- **决策 3**: 试用期长度? (推荐: 1 个月, 到 Pulse-72)

---

## 8. 🔗 关联

- [debt.md P0-004](../../debt.md) · 招募 Approver 债务
- [experts/INDEX.md](../../experts/INDEX.md) · 40 专家档案
- [docs/process/expert-rating.md](../../docs/process/expert-rating.md) · 5 级评级体系
- [R6-phase-17.md](../../rfcs/voting/R6-phase-17.md) · RFC R6 试运行参考
- [R8-champion-appointment.md](../../rfcs/voting/R8-champion-appointment.md) · 同步进行的 Champion 任命
- [voting-record.md](../../docs/process/voting-record.md) · 投票历史
- [后台调研报告](../../../tmp/approver-recruit-summary.md) · 详细分析

---

> 由 main agent 创建 + Pulse-67 后台 subagent 整合分析
> 投票启动后由 Champion 在窗口结束时签字归档到 voting-record.md