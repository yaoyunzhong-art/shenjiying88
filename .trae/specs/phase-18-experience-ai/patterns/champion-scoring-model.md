# Champion 评分模型 · 5 维度贡献

> 创建: 2026-06-26 (Phase-18 T19)
> 状态: ✅ Established
> 关联: [phase-18/spec.md §3](../spec.md)

## Context

Champion Dashboard 需要量化每个 Champion 的知识贡献,激励持续输出。
手工统计工作量大且主观,需要透明、可解释的评分模型。

## 模型

### 5 个贡献维度

| 维度 | 单次分数 | 含义 |
|---|---|---|
| **COMMIT** | 2 | 代码 commit (持续输出) |
| **REVIEW** | 3 | PR / 决策 review (质量把关) |
| **RFC** | 8 | 重大决策记录 (DR-xxx) (高价值决策) |
| **PULSE_REVIEW** | 4 | Pulse 周期复盘提交 (结构化反思) |
| **RETRO** | 6 | 月度/季度复盘文档 (系统性总结) |

### 评分逻辑

```typescript
totalScore = Σ(contribution.weight)
```

### 角色分布

| 角色 | 典型贡献 | 月度分数区间 (估) |
|---|---|---|
| **APPROVER** | RFC + RETRO + REVIEW | 30-60 |
| **CHAMPION** | COMMIT + REVIEW + PULSE_REVIEW | 20-40 |
| **OBSERVER** | 偶尔参与 | 0-10 |

## 设计原则

1. **高价值决策重奖** - RFC 8 分 vs COMMIT 2 分 (4x 差距)
   - 鼓励 Champion 主动发起决策,而不只是被动执行
2. **反思输出加权** - PULSE_REVIEW 4 + RETRO 6 = 10 分/月
   - 系统化反思是组织学习核心
3. **执行可量化** - COMMIT 2 分虽然低,但是持续输出
   - 高频执行 Champion 仍能积累

## Anti-patterns

- ❌ 单纯按 commit 数排名 → 鼓励刷 commit,质量下降
- ❌ 主观打分 → 不透明,Champion 不信任
- ❌ 无时间衰减 → 老 Champion 永远靠前,新 Champion 无上升空间

## Phase-19 调优方向

- 用真实 3 个月数据校准权重
- 加入时间衰减因子 (90 天前的贡献权重 × 0.5)
- 增加 RFC 影响因子 (被引用次数 × 0.1)

## 实施

- [champion.service.ts](../../../../apps/api/src/modules/champion/champion.service.ts)