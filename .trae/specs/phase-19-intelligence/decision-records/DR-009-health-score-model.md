# DR-009 · 健康度评分模型 (4 维度)

> 创建: 2026-06-26 (Phase-19 T34)
> 状态: ✅ Accepted
> 关联: [phase-19/spec.md §Phase 4](../spec.md)

## Context

租户健康度是 SaaS 平台运营的核心指标。
单维度不可靠:性能好但配额超限 = 不健康。

## Decision

**4 维度加权评分**:

### 评分矩阵
| 维度 | 权重 | 满分阈值 | 0 分阈值 |
|---|---|---|---|
| **performance (P95)** | 30% | ≤100ms | >3000ms |
| **reliability (错误率)** | 30% | <0.1% | >10% |
| **quotaHealth (使用率)** | 20% | <50% | >100% |
| **community (Champion)** | 20% | score≥100 | 0 |

### 分级
- HEALTHY ≥ 80
- WARNING 60-79
- CRITICAL < 60

### 自动 recommendations
每个低分组件触发对应建议:
- 性能差 → 慢查询优化
- 错误率高 → 异常排查
- 配额高 → 升级套餐
- 社区低 → 招募/培训 Champion

## Alternatives Considered

### A. 单维度 (P95 only)
- ✅ 简单
- ❌ 漏掉配额/社区风险

### B. 雷达图 (无总分)
- ✅ 直观
- ❌ 难排名,难告警阈值

### C. **4 维加权总分 (选定)**
- ✅ 单一数字便于排名和告警
- ✅ 维度详情便于诊断
- ✅ recommendations 自动生成

## Consequences

- ✅ HealthScore 准确率目标 ≥ 90%
- ⚠️ 阈值需要调优 (用真实数据校准)
- 🔜 Phase-20:接入历史数据校准阈值

## 实施

- [health-score.service.ts](../../../../apps/api/src/modules/health-dashboard/health-score.service.ts)
- [health-dashboard.service.ts](../../../../apps/api/src/modules/health-dashboard/health-dashboard.service.ts)
