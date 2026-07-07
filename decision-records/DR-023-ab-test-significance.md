# DR-023: A/B Test 显著性检验策略

**Status**: Accepted
**Date**: Phase-23 (2026-06-26)
**Context**: Phase-23 T93 A/B 测试框架

## 决策

A/B 测试采用**经典频率统计**方法:
- **分配**: hashToBucket (sha256) + sticky cache
- **二分变量**: `twoProportionZTest` (z-test for proportions)
- **连续变量**: `twoSampleTTest` (t-test for samples)
- **显著性阈值**: p < 0.05

## 背景

A/B 检验有多种方法:
- **频率统计**: z-test, t-test, chi-square (本方案)
- **贝叶斯**: Beta-Binomial model, posterior probability
- **Sequential**: SPRT, mSPRT (边收集边判断)

频率统计最简单且 well-understood,适合 V2 mock 实现。

## 关键设计

### Sticky Assignment
```typescript
const bucket = hashToBucket(unitId, experimentId);  // [0, 1)
if (bucket > trafficSplit) return undefined;  // 部分不参与
const variantBucket = (bucket / trafficSplit) * totalWeight;
```
- sha256 哈希 → 均匀分布
- sticky: 缓存 `experimentId:unitId` → variant

### z-test for Proportions
```
z = (p1 - p2) / sqrt(p_pool * (1-p_pool) * (1/n1 + 1/n2))
p_value = 2 * (1 - Φ(|z|))
```
- `p_pool` 是合并比例 (weighted)
- `Φ` 是标准正态 CDF (Abramowitz 近似)

### t-test for Means
```
t = (mean1 - mean2) / sqrt(stdDev1^2/n1 + stdDev2^2/n2)
p_value = 2 * (1 - Φ(|t|))  // normal approximation for large df
```

### Report 输出
```typescript
{
  variants: VariantStats[],
  winner: 'treatment',  // mean 最高的 variant
  pValues: { treatment: 0.001 },
  significant: { treatment: true },
  lift: { treatment: 50.0 },  // 提升百分比
  totalEvents, totalUnits,
}
```

## 后果

- ✅ 实现简单 (代码 < 200 行)
- ✅ 标准方法,易于解释
- ✅ 支持 binary (转化) + continuous (latency) 指标
- ⚠️ 样本量小 (< 30) 时正态近似不准
- ⚠️ 多重比较需 Bonferroni 校正 (目前未实现)

## 关键测试

- `AC-5 显著差异`: 80% vs 50% → p < 0.05
- `AC-6 无差异`: 50% vs 50% → p > 0.05
- `AC-13 50/50 均匀`: 1000 用户近似 500/500
- `AC-14 trafficSplit 20%`: 1000 用户近似 200 参与
