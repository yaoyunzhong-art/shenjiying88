# R7 + R8 用户直批清单 (Day 4 准备)

> 创建: Pulse-68 Day 4 (2026-06-29)
> 目的: 在 0 Approver / 0 Champion 状态下,通过用户直接审批完成 R7/R8 RFC 归档
> 依据: V5.1 启动期特殊规则 (rfcs/voting/R7 §3.2 + R8 §1.4)

---

## ⚠️ 关键发现

之前我 (main agent) 在 Day 3 准备的 `champion-review-checklist.md` 中误将 R7/R8 理解为 Phase-17/Phase-19 RFC,实际:

| 真实 RFC | 真实内容 | 当前投票状态 |
|---|---|---|
| **R6** | **Phase-17 计划** | ✅ 已通过 (4.5 权重, 5 票, 试运行通过) |
| **R7** | **Approver 招募** | 🟡 投票中 (0 票,但 0 Approver 无法投票) |
| **R8** | **Champion 任命** | 🟡 投票中 (0 票,但 0 Champion 无法投票) |

**结论**: R7/R8 采用 V5.1 启动期"用户直批 + 1 个月试用"特殊规则。

---

## 🎯 R7 用户直批 5 Checkbox

> 来源: [rfcs/voting/R7-approver-appointment.md §6](../rfcs/voting/R7-approver-appointment.md)

### R7-R1: 是否同意立即任命 5 Approver?

候选清单 (来自 R7 §2.1.1):

| ID | 姓名 | 领域 | 当前级别 | 推荐级别 | 推荐理由 |
|---|---|---|---|---|---|
| **E1** | 陈架构 | W1-架构 | Reviewer | Approver | 40 专家矩阵核心,所有 RFC 必经其 review |
| **E6** | 刘合规 | W7-安全/法律 | Reviewer | Approver | 合规 + 安全 + 法务三领域覆盖,RFC R6 主导者 |
| **E9** | 吴AI | W7-AI/数据 | Reviewer | Approver | AI/智能化决策专家,Phase-19 Kickoff 关键 |
| **E10** | 郑财务 | W7-财务 | Reviewer | Approver | 财务/支付安全专家,跨门店优惠券必经 review |
| **E16** | 郑社群 | W6-数据 | Reviewer | Approver | RFC R6 主导者,Phase-17 社群 + 裂变负责人 |

评分明细 (来自 R7 §7.3,5 分制):

| ID | 领域专业度 | 升级路径 | 合计 | 备注 |
|---|---|---|---|---|
| E1 | 5 | 4 | 9 | 最高,Phase-15 核心 |
| E6 | 4 | 4 | 8 | 跨法务+合规+安全 |
| E9 | 4 | 4 | 8 | 跨 AI+数据 |
| E10 | 4 | 4 | 8 | 跨财务+风控 |
| E16 | 4 | 4 | 8 | R6 主导者,有实操 |

- [ ] ✅ 同意任命 5 Approver
- [ ] 🔴 拒绝 (原因: \_\_\_\_\_\_\_\_\_\_\_\_)

### R7-R2: 是否同意 Champion 候选 (E5 赵数据, E40 杨客户)?

> 详见 R8 §2.1.1

- [ ] ✅ 同意 E5 赵数据为 Champion 候选
- [ ] ✅ 同意 E40 杨客户为 Champion 候选
- [ ] 🔴 部分同意 (请注明: \_\_\_\_\_\_\_\_\_\_\_\_)

### R7-R3: 是否同意 1 个月试用期机制?

试用条款 (R7 §3.3):
- 试用 1 个月 (到 Pulse-72 = 2026-07-26)
- 表现不达标可由 ≥2 Champion 联合降级
- 自愿退出: 提交 RFC,经 ≥3 Approver 同意

- [ ] ✅ 同意 1 个月试用
- [ ] 🔴 拒绝 (原因: \_\_\_\_\_\_\_\_\_\_\_\_)

### R7-R4: 是否同意本 RFC 跳过 Approver 投票(由用户直接审批)?

依据: V5.1 启动期 0 Approver,无法启动投票机制,采用"用户直批"特殊规则。

- [ ] ✅ 同意跳过 Approver 投票,采用用户直批
- [ ] 🔴 拒绝 (原因: \_\_\_\_\_\_\_\_\_\_\_\_)

### R7-R5: 是否同意 Approver 在 Phase-17 主导任务?

具体授权 (R7 §2.1 + §3.3):
- E1 主导 Phase-17 架构层决策
- E6 主导 Phase-17 合规层决策
- E16 主导 Phase-17 社群 + 裂变执行

- [ ] ✅ 同意 Approver 在 Phase-17 主导
- [ ] 🔴 拒绝 (原因: \_\_\_\_\_\_\_\_\_\_\_\_)

---

## 🎯 R8 用户直批 Checkbox

> 来源: [rfcs/voting/R8-champion-appointment.md §2.1.1](../rfcs/voting/R8-champion-appointment.md)

### R8-R1: 是否同意立即任命 2 Champion?

候选清单:

| ID | 姓名 | 领域 | 当前级别 | 推荐级别 | 推荐理由 |
|---|---|---|---|---|---|
| **E5** | 赵数据 | W1+W6 | Observer | Champion (跨级) | 高决策力 + 跨领域(架构+数据) + Phase-19 关键 + 客观中立 |
| **E40** | 杨客户 | W8-后勤 | Observer | Champion (跨级) | 大客户视角 + 续约决策 + P0 反馈源 + 客户体验 veto |

- [ ] ✅ 同意任命 2 Champion
- [ ] 🔴 拒绝 (原因: \_\_\_\_\_\_\_\_\_\_\_\_)

### R8-R2: 是否同意 V5.1 启动期跨级特殊路径?

依据: V5.1 启动期 0 Champion,允许 Observer → Champion 跨级升级(评分 E5=10, E40=8)。

- [ ] ✅ 同意跨级特殊路径 (1 个月试用)
- [ ] 🔴 拒绝 (原因: \_\_\_\_\_\_\_\_\_\_\_\_)

### R8-R3: 是否同意 Champion 单票否决权?

权重: 2.0/票 (一票否决任意 RFC)

- [ ] ✅ 同意单票否决权
- [ ] 🔴 拒绝 (原因: \_\_\_\_\_\_\_\_\_\_\_\_)

---

## 🚀 实施步骤 (用户批准后)

### Step 1: 任命 Approver

```bash
bash scripts/approver-appoint.sh --dry-run    # 预览
bash scripts/approver-appoint.sh              # 实际任命
```

效果:
- 5 位 Approver 等级升级 Reviewer → Approver
- 创建 `docs/operations/approver-appointment-certificate.md`
- 更新 `experts/INDEX.md`

### Step 2: 任命 Champion

```bash
bash scripts/champion-appoint.sh --dry-run    # 预览
bash scripts/champion-appoint.sh              # 实际任命
```

效果:
- 2 位 Champion 等级升级 Observer → Champion (跨级)
- 创建 `docs/operations/champion-appointment-certificate.md`
- 启用 veto 权 (权重 2.0)

### Step 3: 触发 Phase-17 Kickoff

```bash
# R6 已通过 + R7 完成 + R8 完成 = Phase-17 Kickoff 条件就绪
bash scripts/phase-17-kickoff.sh
```

### Step 4: Git Commit

```bash
git add scripts/ docs/operations/ experts/
git commit -F .tmp-commit.txt
```

---

## 📊 当前状态汇总

| 项目 | 状态 |
|---|---|
| R6 (Phase-17 计划) | ✅ 已通过 (4.5 权重, 5 票) |
| R7 (Approver 招募) | 🟡 等待用户直批 5 checkbox |
| R8 (Champion 任命) | 🟡 等待用户直批 3 checkbox |
| Phase-17 Kickoff | ⏳ 等待 R7 + R8 完成 |

---

## 🔗 关联文档

- [rfcs/voting/R7-approver-appointment.md](../rfcs/voting/R7-approver-appointment.md) · R7 全文
- [rfcs/voting/R8-champion-appointment.md](../rfcs/voting/R8-champion-appointment.md) · R8 全文
- [.trae/specs/phase-17-marketing-community/kickoff.md](../../.trae/specs/phase-17-marketing-community/kickoff.md) · Phase-17 Kickoff
- [scripts/approver-appoint.sh](../../scripts/approver-appoint.sh) · Approver 任命脚本
- [scripts/champion-appoint.sh](../../scripts/champion-appoint.sh) · Champion 任命脚本

---

**等待用户审批 8 个 checkbox (R7 5 + R8 3) → 实施任命 → Phase-17 Kickoff**