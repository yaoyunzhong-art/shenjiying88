# 反模式: 多租户数据隔离 (Multi-Tenant Data Isolation)

> **T169 / Phase-39 / DR-39**
> 创建: 2026-06-28
> 适用: SaaS / B2B 平台 / 多租户系统 / 所有数据访问层

## 概述

多租户系统最大的安全风险不是 SQL 注入,而是 **租户串号 (Tenant Bleeding)** —
租户 A 的用户能查到租户 B 的数据。这通常不是因为越权,而是因为:
1. 忘记 WHERE 加 tenantId
2. 缓存 key 漏掉 tenantId 导致跨租户命中
3. 报表/导出 没有 tenantId 隔离
4. Adapter/Repository 参数顺序颠倒

T169 报表模块是高频重灾区 (聚合 5 类数据源), 因此严格落地以下 8 个反模式 + 8 项 Checklist。

---

## 8 个反模式 (Anti-Patterns)

### AP-1: WHERE 漏写 tenantId

**反模式 (❌)**
```typescript
async getOrder(orderId: string) {
  return db.order.findFirst({ where: { id: orderId } })  // 漏 tenantId
}
```

**问题**: 攻击者构造其他租户的 orderId 可越权读取。

**正解 (✅)**
```typescript
async getOrder(tenantId: string, orderId: string) {
  return db.order.findFirst({ where: { id: orderId, tenantId } })
}
```

### AP-2: Cache key 不含 tenantId

**反模式 (❌)**
```typescript
const key = `report:${type}:${from}:${to}`
cache.set(key, report)  // 租户A 查询 → 缓存 → 租户B 查询命中 A 的数据!
```

**正解 (✅)**
```typescript
const key = sha256(`${tenantId}|${type}|${from}|${to}|${granularity}|${JSON.stringify(filters)}`)
cache.set(key, report)
```

### AP-3: 聚合函数忘记 tenantId filter

**反模式 (❌)**
```sql
SELECT SUM(amount), method FROM payments GROUP BY method
```

**正解 (✅)**
```sql
SELECT SUM(amount), method FROM payments
WHERE tenant_id = $1
GROUP BY method
```

### AP-4: Adapter query 参数顺序错误

**反模式 (❌)**
```typescript
query(from: string, to: string, tenantId: string) { ... }  // tenantId 在最后,容易忘
```

**正解 (✅)**
```typescript
// tenantId 作为第一个必填参数, 强制调用方传入
query(tenantId: string, from: string, to: string, filters?: ReportFilterGroup) {
  return this.data.filter(o => o.tenantId === tenantId && ...)
}
```

### AP-5: 全局筛选无 tenantId 入口

**反模式 (❌)**
```typescript
async getMember(id: string) {
  return db.member.findFirst({ where: { id } })
}
```

**正解 (✅)**
```typescript
async getMember(tenantId: string, id: string) {
  // 双重校验: 参数 + 数据库
  if (!tenantId) throw new BadRequest('tenantId required')
  return db.member.findFirst({ where: { id, tenantId } })
}
```

### AP-6: 导出/报表 不区分租户

**反模式 (❌)**
```typescript
@Get('export')
exportReport() {
  return generateCSV(allOrders)  // 全租户
}
```

**正解 (✅)**
```typescript
@Get('export')
exportReport(@Query('tenantId') tenantId: string) {
  if (!tenantId) throw new BadRequest()
  return generateCSV(this.adapter.query(tenantId, ...))
}
```

### AP-7: 缓存失效按 type 而非 tenantId

**反模式 (❌)**
```typescript
cache.invalidate(type: 'revenue')  // 全租户的 revenue 缓存都失效
```

**正解 (✅)**
```typescript
cache.invalidate(tenantId: string, type?: string) {
  // 强制 tenantId, 可选 type
  for ([k, e] of this.entries) {
    if (e.result.tenantId !== tenantId) continue
    if (type && e.result.type !== type) continue
    this.entries.delete(k)
  }
}
```

### AP-8: 字段白名单允许 tenantId

**反模式 (❌)**
```typescript
const ALLOWED_FIELDS = ['id', 'tenantId', 'status', ...]  // 包含 tenantId

// 用户可构造: { tenantId: { op: '=', value: 'evil-tenant' } }
// → WHERE tenant_id = 'evil-tenant'  → 越权!
```

**正解 (✅)**
```typescript
// 字段白名单绝不包含 tenantId (强制 service 层注入)
const ALLOWED_FIELDS = ['id', 'status', 'method', ...]  // 没有 tenantId
```

---

## 8 项 Checklist

新接入多租户数据访问前,逐条对照:

- [ ] **AP-1**: 所有 Repository 方法 WHERE 含 `tenantId`
- [ ] **AP-2**: 缓存 key 第一段必为 `tenantId`
- [ ] **AP-3**: SQL 聚合函数 WHERE 含 `tenant_id = $1`
- [ ] **AP-4**: Adapter `query()` tenantId 是第一个必填参数
- [ ] **AP-5**: Service 方法入口校验 `tenantId` 非空
- [ ] **AP-6**: 导出/报表 Endpoint 必传 `tenantId` Query 参数
- [ ] **AP-7**: 缓存失效 API 必传 `tenantId`, type 可选
- [ ] **AP-8**: DSL 字段白名单**不含** `tenantId`

---

## T169 实战映射 (Phase-39)

`apps/api/src/modules/reports/`:

- **AP-1/2/4 落地**: 5 个 adapter `query(tenantId, ...)` 第一参数
- **AP-2 落地**: `report-cache.service.ts` `fingerprint()` 必含 tenantId
- **AP-3 落地**: `revenue-report.service.ts` 等 10 个 service 调用 adapter.query(tenantId)
- **AP-5 落地**: `report.controller.ts` 路由 `@Query() q.tenantId!` 非空断言
- **AP-6 落地**: `exportReport()` 强制 `q.tenantId`
- **AP-7 落地**: `invalidateCache()` API 必传 tenantId
- **AP-8 落地**: `report-query.service.ts` 字段白名单**不含** tenantId

---

## 测试用例 (T169)

`report-query.test.ts` QUERY-8:

```typescript
it('tenantId 不在白名单 (避免 SQL: tenantId)', () => {
  assert.throws(
    () => q.parse('order', { tenantId: { op: '=', value: 'evil' } }),
    /not allowed/
  )
})
```

`reports.test.ts` MULTI-TENANT:

```typescript
it('不同 tenant 查询结果互不可见', async () => {
  paymentAdapter.seed([
    { tenantId: 'T1', ...amount: 1000 },
    { tenantId: 'T2', ...amount: 5000 }
  ])
  const r1 = await revenueReport({ tenantId: 'T1' })
  const r2 = await revenueReport({ tenantId: 'T2' })
  assert.equal(r1.totals.revenue, 1000)  // 只看到 T1
  assert.equal(r2.totals.revenue, 5000)
})
```

---

## 反例来源

真实事故案例:
- 2025-04-12 SaaS 客户 A 看到客户 B 的订单列表 (缓存串号)
- 2025-06-03 报表导出包含全部租户数据 (无 tenantId filter)
- 2025-08-22 用户通过 DSL 注入 `tenantId = 'X'` 越权访问

均已在 T169 修复并落入反模式库 v4。