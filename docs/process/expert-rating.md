# Expert Rating System · 专家评级体系

> 创建日期: 2026-06-25 · Pulse-64

## 5 级评级

### Observer (观察员) — 默认初始级
- **权限**: 阅读,standup 可发言无投票权
- **来源**: 新入职 / 评级降级
- **晋升条件**: 连续 7 天有效反馈 + 采纳率 ≥50%

### Reviewer (评审员)
- **权限**: 投票否决权 (veto) + RFC 评论权
- **晋升条件**: 累计投票 10 次 + 采纳率 ≥60%

### Approver (审批员)
- **权限**: RFC 通过所需的 3 票之一 + 紧急 veto 协同权
- **晋升条件**: 主导 1 个 phase 完整生命周期 (kickoff/mid/retro 全部参与)

### Owner (责任人)
- **权限**: 负责 1 个 phase 完整生命周期 + 召集相关专家
- **晋升条件**: 3 次 Owner 经历 + 1 次 Champion 联名提名

### Champion (倡导者)
- **权限**: 跨 phase 战略决策 + 主持 standup + RFC 否决权
- **任期**: 1 月 (可连任)
- **任命**: 由现有 Champion 联名提名 + 用户审批

## 量化升级规则

| 升级路径 | 条件 |
|---|---|
| Observer → Reviewer | 连续 7 天有效反馈 + 采纳率 ≥50% |
| Reviewer → Approver | 累计投票 10 次 + 采纳率 ≥60% |
| Approver → Owner | 主导 1 个 phase (kickoff + mid + retro 全签字) |
| Owner → Champion | 3 次 Owner + Champion 联名提名 + 用户审批 |

## 降级规则
- 30 天无活动 → 自动降到 Observer
- 连续 3 次被否决的 veto → 警告
- 5 次否决 → 降级 1 级

## 投票权重
| 级别 | 投票权重 | 否决权 |
|---|---|---|
| Observer | 0 | 无 |
| Reviewer | 0.5 | 单人 veto (软) |
| Approver | 1.0 | 单人 veto (硬) |
| Owner | 1.5 | 单人 veto (硬) |
| Champion | 2.0 | 单人 veto (硬) + 否决 1 个 RFC |

## RFC 通过条件
- 总投票权重 ≥ 3
- 0 Champion 否决
- 投票窗口 72 小时

## 关联脚本
- `scripts/rate-experts.py` - 自动计算评级分布
- 评级数据持久化在每个 `experts/E*.md` 档案的"元信息"段