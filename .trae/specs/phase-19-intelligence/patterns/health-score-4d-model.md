# 健康度 4 维度评分模式

> 创建: 2026-06-26 (Phase-19 T34)
> 关联: [DR-009](./DR-009-health-score-model.md)

## 4 维度加权

```typescript
const WEIGHTS = {
  performance: 0.3,
  reliability: 0.3,
  quotaHealth: 0.2,
  community: 0.2,
};

function healthScore(input) {
  const components = {
    performance: scorePerformance(input.p95Ms),
    reliability: scoreReliability(input.errorRate),
    quotaHealth: scoreQuota(input.quotaUsagePercent),
    community: scoreCommunity(input.championActivityScore),
  };
  const score = sum(Object.entries(components).map(([k, v]) => v * WEIGHTS[k]));
  return { score, components, status: scoreToStatus(score) };
}
```

## 维度设计原则

1. **互不重叠** - 性能 vs 可靠性 vs 配额 vs 社区独立
2. **可解释** - 每个维度有明确阈值和业务含义
3. **可改进** - 每个低分维度对应可执行建议
4. **可观测** - 每个维度独立上报,便于 dashboard drill-down

## Anti-patterns

- ❌ 单维度 (P95 only) → 漏掉其他风险
- ❌ 无权重 (所有维度等权) → 重要维度被稀释
- ❌ 不可解释 (黑盒模型) → 运维无法理解
- ❌ 无 recommendations → 告警但无行动指引
