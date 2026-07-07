# 反模式: 时序聚合 (Time-Series Aggregation)

> **T169 / Phase-39 / DR-39**
> 创建: 2026-06-28
> 适用: 所有 BI 报表 / 时序数据分析 / Dashboard

## 概述

报表按时间维度聚合 (day / week / month / year) 时,常见的 8 个反模式会导致
**跨月/跨年数据错位**、**缓存命中率 0%**、**租户串号**、**OLAP 计算超时** 等问题。

---

## 8 个反模式 (Anti-Patterns)

### AP-1: 字符串拼接构造 GROUP BY 字段

**反模式 (❌)**
```sql
SELECT
  CONCAT(YEAR(createdAt), '-', MONTH(createdAt)) AS period,
  SUM(amount) AS revenue
FROM orders
GROUP BY period
```

**问题**:
- 索引失效,全表扫描
- 数据库不识别这是"日期维度",无法做 partition pruning
- 月份数字无前导零 (`2024-6` vs `2024-06`),导致字符串排序错乱

**正解 (✅)**
```typescript
// 应用层截断 ISO 时间到目标粒度
timeBucket(iso: string, granularity: 'day' | 'week' | 'month' | 'year'): string {
  const d = new Date(iso)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  switch (granularity) {
    case 'day':   return `${yyyy}-${mm}-${dd}`
    case 'month': return `${yyyy}-${mm}`
    case 'year':  return `${yyyy}`
  }
}
```

### AP-2: ISO 周归属错误 (跨年周)

**反模式 (❌)**
```typescript
// 错误: 假设周从周一开始, 1月1日所在周就是 W01
const weekNo = Math.ceil(dayOfYear / 7)
```

**问题**:
- 2024-12-30 (周一) 在错误算法中属于 `2024-W53`
- ISO 8601 标准: 2024-12-30 应归属 `2025-W01` (周四所在周)
- 跨年数据会出现在两个年份中,图表出现断崖

**正解 (✅)**
```typescript
// ISO 8601 周算法: 周一是一周的开始, 周四所在周就是该年的周
case 'week': {
  const tmp = new Date(d)
  tmp.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
```

### AP-3: 时区未指定 (UTC vs Local)

**反模式 (❌)**
```typescript
const day = new Date(iso).getDate()  // 本地时区, 跨时区部署错乱
```

**正解 (✅)**
```typescript
const day = new Date(iso).getUTCDate()  // 永远 UTC
```

### AP-4: 缓存 key 含时间戳导致命中率 0

**反模式 (❌)**
```typescript
const cacheKey = `report:${tenantId}:${type}:${Date.now()}`  // 永不命中
```

**正解 (✅)**
```typescript
// 缓存 key 只含 输入参数,不含生成时间
const cacheKey = sha256(`${tenantId}|${type}|${from}|${to}|${granularity}|${JSON.stringify(filters)}`).slice(0, 32)
```

### AP-5: 无租户隔离 (跨租户串号)

**反模式 (❌)**
```typescript
const data = await db.order.findMany()  // 缺 tenantId
const report = aggregate(data, [...])
```

**正解 (✅)**
```typescript
const data = await orderAdapter.query(tenantId, from, to)  // 强制 tenantId
const report = aggregate(data, [...])
```

### AP-6: 全维度笛卡尔积 (维度爆炸)

**反模式 (❌)**
```typescript
// 用户传 5 个维度 → 4 个时间段 × 5 个支付方式 × 3 个状态 × ... → 几万行
aggregate(rows, userProvidedDimensions, metrics)
```

**正解 (✅)**
```typescript
// 强制维度白名单, 拒绝未授权维度
const ALLOWED_DIMENSIONS = ['createdAt', 'method', 'status']
if (!ALLOWED_DIMENSIONS.includes(dim.field)) throw new BadRequest()
```

### AP-7: 没有 totals 行

**反模式 (❌)**
```typescript
return {
  columns: [...],
  rows: aggregated  // 没有总计
}
```

**正解 (✅)**
```typescript
const totals = computeMetricsForGroup(allRows, metrics)  // 在原始数据上算
return {
  columns: [...],
  rows: aggregated,
  totals
}
```

### AP-8: 同步计算 + 大数据量 → 请求超时

**反模式 (❌)**
```typescript
@Get('revenue')
revenueReport(@Query() q) {
  // 同步聚合 100万行, 30 秒超时
  return aggregate(loadAll(q), ...)
}
```

**正解 (✅)**
```typescript
// 缓存命中 (5min TTL) + 离线预计算 + 物化视图
@Get('revenue')
async revenueReport(@Query() q) {
  const cached = cache.get(fingerprint(q))
  if (cached) return cached
  // ... compute + cache.set(...)
}
```

---

## 8 项 Checklist

实施 BI / 时序报表前,逐条对照:

- [ ] **AP-1**: 维度字段在应用层截断, 不用 `CONCAT` 拼字符串
- [ ] **AP-2**: ISO 8601 周算法 (周四所在周归属规则)
- [ ] **AP-3**: 全部使用 UTC (`getUTC*` 而非 `get*`)
- [ ] **AP-4**: 缓存 key 不含 `Date.now()`, 仅含输入参数 hash
- [ ] **AP-5**: adapter.query() 强制 `tenantId` 作为第一个参数
- [ ] **AP-6**: 维度白名单 (`ALLOWED_DIMENSIONS = [...]`)
- [ ] **AP-7**: 返回结果包含 `totals` 行 (原始数据聚合)
- [ ] **AP-8**: 命中缓存立即返回, 大数据量异步预计算

---

## T169 实战映射 (Phase-39)

`apps/api/src/modules/reports/`:

- **AP-1/2/3 落地**: `report-aggregation.service.ts` `timeBucket()` (line 64-83)
- **AP-4 落地**: `report-cache.service.ts` `fingerprint()` (line 35-56)
- **AP-5 落地**: 5 个 adapter `query(tenantId, ...)` 第一个参数强制 tenantId
- **AP-6 落地**: 维度白名单在 controller 层校验
- **AP-7 落地**: `revenue-report.service.ts` 计算 totals
- **AP-8 落地**: `revenue-report.service.ts` cache.get → set 5min TTL

---

## 反例来源

真实事故案例:
- 2024-12-30 营收掉零 (跨年周错误归属)
- 2025-01-03 时段热力图全是0 (缓存键含时间戳)
- 2025-03-15 客户投诉看到其他租户订单 (无 tenantId 隔离)

均已在 T169 修复并落入反模式库 v4。