# DR-007 · 异常检测算法选择 (3σ + IQR + EWMA)

> 创建: 2026-06-26 (Phase-19 T26)
> 状态: ✅ Accepted
> 关联: [phase-19/spec.md §Phase 1](../spec.md)

## Context

异常检测是 AutoRollback 触发器,误报会导致误回滚,漏报会导致事故。
单算法不可靠:3σ 对漂移不敏感,IQR 对极端值不敏感,EWMA 对瞬时不敏感。

## Decision

**3 算法协同 + 综合 score**:

### 算法矩阵
| 算法 | 优势 | 劣势 | 适用 |
|---|---|---|---|
| **3σ (Z-score)** | 经典、统计意义清晰 | 假设正态分布 | 瞬时异常 |
| **IQR (Tukey fence)** | 无分布假设,抗异常污染 | 极端值检测弱 | 极端异常 |
| **EWMA** | 捕捉缓慢漂移 | 需预热 baseline | 趋势异常 |

### 综合 score
```
detectorMax = max(zScore_normalized, iqr_normalized, ewma_normalized)
confidenceBonus = detectorCount >= 2 ? 0.2 : 0
score = min(1, detectorMax + confidenceBonus)
```

### 阈值
- WARNING >= 0.5
- CRITICAL >= 0.8

### 白名单
已知业务波动 (月底/周末) 优先于检测,不报警。

## Alternatives Considered

### A. 机器学习模型 (Isolation Forest / One-Class SVM)
- ✅ 自适应,无需调参
- ❌ 黑盒,运维难以理解和调优
- ❌ 训练数据稀缺 (SaaS 多租户各异)
- ❌ 推理成本高

### B. 单算法 (3σ)
- ✅ 简单
- ❌ 漏报率高 (对漂移不敏感)
- ❌ 误报率高 (对非正态分布不友好)

### C. **3 算法协同 (选定)**
- ✅ 各算法互补,准确率高
- ✅ 透明可解释
- ✅ 白名单可控
- ⚠️ 需要维护 3 个状态

## Consequences

- ✅ Anomaly 检测召回率目标 ≥ 95%
- ⚠️ 多检测器状态管理稍复杂
- 🔜 Phase-20:接入 ML 模型作为 4th detector

## 实施

- [anomaly-detector.service.ts](../../../../apps/api/src/modules/anomaly-detector/anomaly-detector.service.ts)
- [anomaly-detector.e2e.test.ts](../../../../apps/api/src/modules/anomaly-detector/anomaly-detector.e2e.test.ts) (6/6 PASS)
