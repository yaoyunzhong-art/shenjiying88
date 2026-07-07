# Cohort Bias 反模式 (Phase-43 T173)

> 反模式 v4 = 38 个文件 (37 → 38, +cohort-bias-pattern)
> 适用: 同期群分析、留存率计算、A/B 实验、漏斗分析
> 防御: periodKey 固定 + cohort_size ≥ 10 + 失活 ≠ 流失 + 跨期归一化

---

## 5 大反模式 (Anti-patterns)

### 1. 🔴 时间窗偏差 (Period Drift)

**症状**: 同期群对比时, 起始日不固定, 导致对比失真 (e.g. 周末注册的 cohort 留存天然偏低)。

**根因**: cohort 起始日 = 任意注册日, 没有按 周/月 对齐。

**错误示例**:
```typescript
// ❌ 每个用户注册日 = cohort 起始日
const periodKey = registrationDate.toISOString().slice(0, 10)  // 2025-06-15
```

**正确做法**:
```typescript
// ✅ 按 ISO 周 (周四所在周) 或 月 对齐
function periodKey(date: Date, period: 'WEEKLY' | 'MONTHLY'): string {
  if (period === 'MONTHLY') {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  }
  // WEEKLY: ISO 周编号 (周四所在周归属)
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = (tmp.getUTCDay() + 6) % 7  // 周一=0
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((tmp.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
```

**清单**:
- [ ] WEEKLY 用 ISO 周 (周一~周日, 归属周四所在周)
- [ ] MONTHLY 用 YYYY-MM (固定 1 日为起点)
- [ ] 同一周期用户 → 同一 cohort
- [ ] cohort 起始日固定 = 周一 / 月初

---

### 2. 🔴 样本不足 (Insufficient Sample)

**症状**: cohort_size = 3 的留存率是 100%, 误导业务决策, 误以为留存很好。

**根因**: 没有最小样本阈值, 小样本直接当作有效数据。

**错误示例**:
```typescript
// ❌ 小样本直接计算
const retention = activeCount / cohortSize  // 1/1 = 100% 误导
```

**正确做法**:
```typescript
const MIN_RELIABLE_COHORT_SIZE = 10

function isReliable(cohort: CohortGroup): boolean {
  return cohort.cohortSize >= MIN_RELIABLE_COHORT_SIZE
}

// 报告分桶
function getReliabilityReport(tenantId: string, period: string) {
  const cohorts = cohortAdapter.queryByPeriod(tenantId, period)
  return {
    total: cohorts.length,
    reliable: cohorts.filter(c => isReliable(c)).length,
    unreliable: cohorts.filter(c => !isReliable(c)).length,
    unreliableCohorts: cohorts.filter(c => !isReliable(c)).map(c => ({
      id: c.id, periodKey: c.periodKey, size: c.cohortSize
    }))
  }
}
```

**清单**:
- [ ] MIN_RELIABLE_COHORT_SIZE = 10 默认
- [ ] 报告区分 reliable / unreliable
- [ ] UI 标记小样本 (灰色 + tooltip)
- [ ] 聚合平均时只统计 reliable cohorts

---

### 3. 🔴 同期混淆 (Period Contamination)

**症状**: 跨周期对比时, 把不同 periodKey 的数据混在一起, 留存率失真。

**根因**: 不同周期 cohort 混入同一查询, 或 retention 计算累加错。

**错误示例**:
```typescript
// ❌ 不区分 periodKey
const allCohorts = cohortAdapter.queryByTenant(tenantId)  // 包含 WEEKLY + MONTHLY
const avg = allCohorts.reduce((s, c) => s + c.retention[1], 0) / allCohorts.length
```

**正确做法**:
```typescript
// ✅ 严格按 period + periodKey 隔离
function queryByPeriod(tenantId: string, period: CohortPeriod): CohortGroup[] {
  return cohortAdapter.queryByTenant(tenantId)
    .filter(c => c.period === period)
    .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
}

// 留存率独立计算每日 (不累加)
function getAvgRetention(tenantId: string, period: CohortPeriod) {
  const cohorts = cohortAdapter.queryByPeriod(tenantId, period)
  let sumD1 = 0, nD1 = 0
  for (const c of cohorts) {
    if (c.retention[1] >= 0) {  // -1 = 未到
      sumD1 += c.retention[1]
      nD1++
    }
  }
  return { d1: nD1 > 0 ? sumD1 / nD1 : 0 }
}
```

**清单**:
- [ ] 不同 period 严格隔离 (WEEKLY ≠ MONTHLY)
- [ ] 留存按天独立计算 (D1 ≠ D0 + D7 累加)
- [ ] retention[i] = -1 表示未到观察期
- [ ] 跨期对比归一化 (cohort_size 加权)

---

### 4. 🟡 退出偏差 (Attrition Bias)

**症状**: 失活用户 = 流失, 但实际上失活可能短期休眠, 30 天后才回来。

**根因**: 失活 ≠ 流失的混淆, 没有休眠期观察窗口。

**错误示例**:
```typescript
// ❌ 30 天无活跃 = 流失
if (daysSinceLastActive > 30) {
  markAsChurned(member)
}
```

**正确做法**:
```typescript
// ✅ 90 天观察期 + 失活 ≠ 流失
const DORMANCY_THRESHOLD_DAYS = 90

function classifyMember(member: Member, now: number): 'ACTIVE' | 'DORMANT' | 'CHURNED' {
  const daysSinceActive = (now - new Date(member.lastActiveAt).getTime()) / 86400000
  if (daysSinceActive <= 7) return 'ACTIVE'
  if (daysSinceActive <= DORMANCY_THRESHOLD_DAYS) return 'DORMANT'  // 休眠
  return 'CHURNED'  // 真流失
}

// 留存分析只关注 ACTIVE, DORMANT 不计入失活
```

**清单**:
- [ ] 区分 ACTIVE / DORMANT / CHURNED 三态
- [ ] 90 天休眠期后才判流失
- [ ] DORMANT 用户进入"唤醒流程"
- [ ] 留存曲线截止到 D90 (D180+ 数据噪声大)

---

### 5. 🟡 跨期对比 (Cross-period Comparison)

**症状**: 不同时期的 cohort_size 差异大, 简单平均导致大 cohort 主导。

**根因**: 没有 cohort_size 归一化, 1000 人 cohort 与 10 人 cohort 同等权重。

**错误示例**:
```typescript
// ❌ 简单算术平均 (被大 cohort 主导)
const avgD1 = (c1.cohortSize * c1.retention[1] + c2.cohortSize * c2.retention[1]) / (c1.cohortSize + c2.cohortSize)
// 上面的公式实际上是对的加权平均, 错误的是简单平均:
// const avgD1 = (c1.retention[1] + c2.retention[1]) / 2  // ❌ 简单平均
```

**正确做法**:
```typescript
// ✅ 按 cohort_size 加权
function weightedAverageRetention(cohorts: CohortGroup[], dayIndex: number): number {
  let totalRetained = 0
  let totalSize = 0
  for (const c of cohorts) {
    if (c.retention[dayIndex] >= 0) {
      totalRetained += c.retention[dayIndex] * c.cohortSize
      totalSize += c.cohortSize
    }
  }
  return totalSize > 0 ? totalRetained / totalSize : 0
}
```

**清单**:
- [ ] cohort_size 加权平均 (不是简单算术)
- [ ] UI 显示 cohort_size 标签
- [ ] 对比时归一化 (留存率 × cohort_size)
- [ ] 大 cohort 主导但小 cohort 不被淹没

---

## Funnel Bias 关联

漏斗分析与 cohort 分析共享部分反模式:

| Funnel 反模式 | 触发 | 防御 |
|---------------|------|------|
| 步骤顺序错乱 | steps 配置乱序 | 严格按 step[i] → step[i+1] |
| 时间窗口过长 | windowDays > 30 | 默认 7d, 防跨期污染 |
| 重复进入 | 同一 member 多次算 | 同 member 只算首次 |
| 步骤过多 | > 5 步 | isOverComplex() 警告 |

---

## 检测工具 (Heuristics)

```typescript
// 反模式检测 API
function detectCohortBias(cohort: CohortGroup, allCohorts: CohortGroup[]): BiasReport {
  return {
    timeDrift: !isISOWeekAligned(cohort.periodKey),
    insufficientSample: cohort.cohortSize < 10,
    periodContamination: hasOtherPeriods(allCohorts),
    attritionBias: false,  // 业务判断
    crossPeriodBias: !hasWeightedAverage(allCohorts)
  }
}
```

---

## 神机营实施

- `apps/api/src/modules/analytics-v2/cohort-analyzer.ts` (130 行): periodKey + ISO 周 + 加权平均
- `apps/api/src/modules/analytics-v2/services/retention.service.ts` (115 行): 健康度评分 + 反模式检测
- 单测: `cohort-analyzer.test.ts` 18 PASS + `analytics-v2-services.test.ts` 24 PASS
- E2E: `scripts/phase43-e2e-analytics.ts` 31 PASS (含 reliability 报告 + D0/D1/D7/D30 留存)

---

## Funnel Bias 子节 (补充)

由于漏斗分析复用 cohort 分析的反模式:

```typescript
// 漏斗反模式检测
function detectFunnelBias(funnel: FunnelResult): BiasReport {
  return {
    timeWindowTooLong: funnel.windowDays > 30,
    stepOrderMismatch: hasOutOfOrderSteps(funnel.steps),
    duplicateEntries: hasDuplicateMembers(funnel.stepResults),
    overComplexSteps: funnel.steps.length > 5
  }
}
```

---

> **"cohort 留存 = periodKey 对齐 + 样本 ≥ 10 + 失活 ≠ 流失 + 加权平均 = 0 时间窗偏差 + 0 样本误导 + 0 同期混淆"**