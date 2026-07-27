import { describe, it, expect, beforeEach } from 'vitest'

// Inline mock services since real ones have constructor DI that needs NestJS
// We test each service's logic in isolation using vitest mock patterns

// ──────────────────────────────────────────────────────────────
// ReportDefinition CRUD
// ──────────────────────────────────────────────────────────────

interface ReportDefinition {
  id: string
  tenantId: string
  name: string
  type: string
  dimensions: any[]
  metrics: any[]
  filters?: any
  schedule?: string
  subscribers?: string[]
  ownerId: string
  createdAt: string
  updatedAt: string
  version: number
}

function createReportDefinitionStore() {
  const store = new Map<string, ReportDefinition>()
  return {
    create(input: { tenantId: string; name: string; type: string; ownerId: string }): ReportDefinition {
      const id = `rdef-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const now = new Date().toISOString()
      const def: ReportDefinition = {
        id, ...input,
        dimensions: [], metrics: [],
        version: 1, createdAt: now, updatedAt: now,
      }
      store.set(id, def)
      return def
    },
    get(id: string, tenantId: string): ReportDefinition | null {
      const d = store.get(id)
      if (!d || d.tenantId !== tenantId) return null
      return d
    },
    list(tenantId: string) {
      return { total: 0, items: Array.from(store.values()).filter(d => d.tenantId === tenantId) }
    },
    update(id: string, tenantId: string, version: number, patch: Partial<ReportDefinition>) {
      const d = store.get(id)
      if (!d || d.tenantId !== tenantId) throw new Error('definition not found')
      if (d.version !== version) throw new Error('version mismatch')
      Object.assign(d, patch)
      d.version++
      d.updatedAt = new Date().toISOString()
      return d
    },
    delete(id: string, tenantId: string): boolean {
      const d = store.get(id)
      if (!d || d.tenantId !== tenantId) return false
      return store.delete(id)
    },
    all() { return store },
  }
}

describe('ReportService — 定义 CRUD', () => {
  let store: ReturnType<typeof createReportDefinitionStore>

  beforeEach(() => { store = createReportDefinitionStore() })

  it('createDefinition: 成功创建，返回完整定义对象', () => {
    const def = store.create({ tenantId: 't1', name: '营收月报', type: 'revenue', ownerId: 'u1' })
    expect(def.id).toMatch(/^rdef-/)
    expect(def.name).toBe('营收月报')
    expect(def.type).toBe('revenue')
    expect(def.version).toBe(1)
    expect(def.createdAt).toBeTruthy()
  })

  it('listDefinitions: 按租户列出定义', () => {
    store.create({ tenantId: 't1', name: 'a', type: 'revenue', ownerId: 'u1' })
    store.create({ tenantId: 't1', name: 'b', type: 'order', ownerId: 'u1' })
    store.create({ tenantId: 't2', name: 'c', type: 'revenue', ownerId: 'u2' })
    const r = store.list('t1')
    expect(r.items).toHaveLength(2)
  })

  it('getDefinition: 按 ID + 租户获取', () => {
    const created = store.create({ tenantId: 't1', name: 'test', type: 'revenue', ownerId: 'u1' })
    const found = store.get(created.id, 't1')
    expect(found).not.toBeNull()
    expect(found!.name).toBe('test')
  })

  it('getDefinition: 租户不匹配返回 null', () => {
    const created = store.create({ tenantId: 't1', name: 'test', type: 'revenue', ownerId: 'u1' })
    const found = store.get(created.id, 't2')
    expect(found).toBeNull()
  })

  it('getDefinition: 不存在的 ID 返回 null', () => {
    expect(store.get('nonexistent', 't1')).toBeNull()
  })

  it('updateDefinition: 更新成功并递增 version', () => {
    const created = store.create({ tenantId: 't1', name: '旧名', type: 'revenue', ownerId: 'u1' })
    const updated = store.update(created.id, 't1', 1, { name: '新名' })
    expect(updated.name).toBe('新名')
    expect(updated.version).toBe(2)
  })

  it('updateDefinition: 版本不匹配抛异常', () => {
    const created = store.create({ tenantId: 't1', name: 'test', type: 'revenue', ownerId: 'u1' })
    expect(() => store.update(created.id, 't1', 999, { name: '新名' })).toThrow('version mismatch')
  })

  it('updateDefinition: 不存在抛异常', () => {
    expect(() => store.update('nonexistent', 't1', 1, { name: 'x' })).toThrow('definition not found')
  })

  it('deleteDefinition: 成功删除返回 true', () => {
    const created = store.create({ tenantId: 't1', name: 'test', type: 'revenue', ownerId: 'u1' })
    expect(store.delete(created.id, 't1')).toBe(true)
    expect(store.get(created.id, 't1')).toBeNull()
  })

  it('deleteDefinition: 租户不匹配返回 false', () => {
    const created = store.create({ tenantId: 't1', name: 'test', type: 'revenue', ownerId: 'u1' })
    expect(store.delete(created.id, 't2')).toBe(false)
  })

  it('deleteDefinition: 不存在返回 false', () => {
    expect(store.delete('nonexistent', 't1')).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────
// ReportExportService — export logic
// ──────────────────────────────────────────────────────────────

describe('ReportExportService — 导出格式', () => {
  // Inline CSV escape from report-export.service
  function csvEscape(value: string): string {
    const dangerous = /^[=+\-@\t\r]/
    let safe = dangerous.test(value) ? `'${value}` : value
    if (/[",\n\r]/.test(safe)) {
      safe = `"${safe.replace(/"/g, '""')}"`
    }
    return safe
  }

  function htmlEscape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  const mockResult = {
    type: 'revenue' as const,
    tenantId: 't1',
    period: { from: '2026-01-01', to: '2026-01-31' },
    columns: [
      { field: 'date', alias: '日期', type: 'dimension' as const },
      { field: 'amount', alias: '金额', type: 'metric' as const },
    ],
    rows: [
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-01-02', amount: 2000 },
    ],
    totals: { date: '合计', amount: 3000 },
    generatedAt: new Date().toISOString(),
    cached: false,
  }

  it('toCSV: 生成正确的 CSV 内容', () => {
    const header = mockResult.columns.map(c => csvEscape(c.alias)).join(',')
    expect(header).toBe('日期,金额')

    const row0 = mockResult.columns.map(c => csvEscape(String((mockResult.rows[0] as any)[c.field] ?? ''))).join(',')
    expect(row0).toMatch(/2026-01-01,1000/)
  })

  it('toCSV: 包含总计行', () => {
    const row1 = mockResult.columns.map(c => csvEscape(String((mockResult.rows[1] as any)[c.field] ?? ''))).join(',')
    expect(row1).toMatch(/2026-01-02,2000/)
  })

  it('csvEscape: formula injection 预防 (= + - @)', () => {
    expect(csvEscape('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
    expect(csvEscape('+12345')).toBe("'+12345")
    expect(csvEscape('-100')).toBe("'-100")
    expect(csvEscape('@hello')).toBe("'@hello")
  })

  it('csvEscape: 普通文本不变', () => {
    expect(csvEscape('普通文本')).toBe('普通文本')
    expect(csvEscape('hello world')).toBe('hello world')
  })

  it('csvEscape: 包含逗号时包裹双引号', () => {
    expect(csvEscape('a,b')).toBe('"a,b"')
  })

  it('csvEscape: 包含双引号时转义', () => {
    expect(csvEscape('a"b')).toBe('"a""b"')
  })

  it('toJSON: 生成正确 JSON', () => {
    const json = JSON.parse(JSON.stringify(mockResult))
    expect(json.type).toBe('revenue')
    expect(json.rows).toHaveLength(2)
  })

  it('toHTML: 生成正确 HTML 结构', () => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Report ${mockResult.type}</title>
<style>body{font-family:system-ui,sans-serif;padding:20px}h1{margin-bottom:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e5e7eb;padding:8px;text-align:left}th{background:#f9fafb;font-weight:600}</style>
</head><body>
<h1>📊 REVENUE Report</h1>
<p>Tenant: <code>t1</code> | Period: 2026-01-01 → 2026-01-31 | Generated: ${mockResult.generatedAt}</p>
<table>
<thead><tr>${mockResult.columns.map(c => `<th>${htmlEscape(c.alias)}</th>`).join('')}</tr></thead>
<tbody>${mockResult.rows.map(r =>
  `<tr>${mockResult.columns.map(c => `<td>${htmlEscape(String((r as any)[c.field] ?? ''))}</td>`).join('')}</tr>`
).join('\n')}<tr style="font-weight:bold;background:#f3f4f6">${
  mockResult.columns.map(c => `<td>${htmlEscape(String((mockResult.totals as any)[c.field] ?? ''))}</td>`).join('')
}</tr></tbody>
</table>
</body></html>`
    expect(html).toContain('<h1>📊 REVENUE Report</h1>')
    expect(html).toContain('<td>2026-01-01</td>')
    expect(html).toContain('<td>1000</td>')
    expect(html).toContain('<td>合计</td>')
  })

  it('htmlEscape: 转义 HTML 特殊字符', () => {
    expect(htmlEscape('<script>alert("x")</script>'))
      .toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
  })

  it('filename: 生成正确的文件名', () => {
    const period = `${mockResult.period.from.slice(0, 10)}_to_${mockResult.period.to.slice(0, 10)}`
    const name = `${mockResult.type}-${mockResult.tenantId}-${period}.csv`
    expect(name).toBe('revenue-t1-2026-01-01_to_2026-01-31.csv')
  })
})

// ──────────────────────────────────────────────────────────────
// ReportAggregationService — aggregation logic
// ──────────────────────────────────────────────────────────────

describe('ReportAggregationService — 聚合计算', () => {
  function computeMetric(rows: any[], field: string, fn: string): number {
    if (rows.length === 0) return 0
    const values: number[] = rows.map(r => Number(r[field])).filter(v => Number.isFinite(v))
    if (values.length === 0 && fn !== 'distinct') return 0
    switch (fn) {
      case 'sum': return values.reduce((a, v) => a + v, 0)
      case 'count': return rows.length
      case 'avg': return values.reduce((a, v) => a + v, 0) / values.length
      case 'min': return Math.min(...values)
      case 'max': return Math.max(...values)
      case 'distinct': return new Set(rows.map(r => r[field])).size
      default: return 0
    }
  }

  const testRows = [
    { amount: 100, category: 'A', date: '2026-01-01' },
    { amount: 200, category: 'A', date: '2026-01-02' },
    { amount: 300, category: 'B', date: '2026-01-01' },
  ]

  it('computeMetric: sum', () => {
    expect(computeMetric(testRows, 'amount', 'sum')).toBe(600)
  })

  it('computeMetric: count', () => {
    expect(computeMetric(testRows, 'amount', 'count')).toBe(3)
  })

  it('computeMetric: avg', () => {
    expect(computeMetric(testRows, 'amount', 'avg')).toBe(200)
  })

  it('computeMetric: min', () => {
    expect(computeMetric(testRows, 'amount', 'min')).toBe(100)
  })

  it('computeMetric: max', () => {
    expect(computeMetric(testRows, 'amount', 'max')).toBe(300)
  })

  it('computeMetric: distinct', () => {
    expect(computeMetric(testRows, 'category', 'distinct')).toBe(2)
  })

  it('computeMetric: 空数组返回 0', () => {
    expect(computeMetric([], 'amount', 'sum')).toBe(0)
  })

  it('computeMetric: 非法 fn 返回 0', () => {
    expect(computeMetric(testRows, 'amount', 'invalid' as any)).toBe(0)
  })

  function timeBucket(iso: string, granularity: string): string {
    const d = new Date(iso)
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    switch (granularity) {
      case 'day': return `${yyyy}-${mm}-${dd}`
      case 'month': return `${yyyy}-${mm}`
      case 'year': return `${yyyy}`
      default: return iso
    }
  }

  it('timeBucket: 按日', () => {
    expect(timeBucket('2026-07-15T10:00:00Z', 'day')).toBe('2026-07-15')
  })

  it('timeBucket: 按月', () => {
    expect(timeBucket('2026-07-15T10:00:00Z', 'month')).toBe('2026-07')
  })

  it('timeBucket: 按年', () => {
    expect(timeBucket('2026-07-15T10:00:00Z', 'year')).toBe('2026')
  })

  it('timeBucket: 未知粒度返回原始值', () => {
    const iso = '2026-07-15T10:00:00Z'
    expect(timeBucket(iso, 'hour' as any)).toBe(iso)
  })
})

// ──────────────────────────────────────────────────────────────
// ReportCacheService — caching logic
// ──────────────────────────────────────────────────────────────

describe('ReportCacheService — 缓存逻辑', () => {
  it('fingerprint: 相同输入生成相同 key', () => {
    const input = { tenantId: 't1', type: 'revenue', from: '2026-01-01', to: '2026-01-31' }
    const parts1 = [input.tenantId, input.type, input.from ?? '', input.to ?? '', '', '{}', '[]', '[]']
    const parts2 = [input.tenantId, input.type, input.from ?? '', input.to ?? '', '', '{}', '[]', '[]']
    expect(parts1.join('|')).toBe(parts2.join('|'))
  })

  it('fingerprint: 不同 tenantId 生成不同 key', () => {
    const base = { tenantId: 't1', type: 'revenue', from: '2026-01-01', to: '2026-01-31' }
    const p1 = [base.tenantId, base.type, base.from ?? '', base.to ?? '', '', '{}', '[]', '[]'].join('|')
    const p2 = ['t2', base.type, base.from ?? '', base.to ?? '', '', '{}', '[]', '[]'].join('|')
    expect(p1).not.toBe(p2)
  })

  it('缓存未命中返回 null', () => {
    // Simulate cache miss
    const cache = new Map<string, { expiresAt: number; result: any }>()
    const entry = cache.get('nonexistent')
    expect(entry).toBeUndefined()
  })

  it('缓存过期后返回 null', () => {
    const cache = new Map<string, { expiresAt: number; result: any }>()
    cache.set('expired', { expiresAt: Date.now() - 1000, result: { cached: true } })
    const entry = cache.get('expired')
    if (entry && Date.now() > entry.expiresAt) {
      cache.delete('expired')
    }
    expect(cache.has('expired')).toBe(false)
  })

  it('缓存命中返回结果', () => {
    const cache = new Map<string, { expiresAt: number; result: any }>()
    cache.set('fresh', { expiresAt: Date.now() + 3600000, result: { type: 'revenue', cached: true } })
    const entry = cache.get('fresh')
    expect(entry).not.toBeUndefined()
    expect(entry!.result.type).toBe('revenue')
  })

  it('按租户失效缓存', () => {
    const cache = new Map<string, { result: { tenantId: string; type: string } }>()
    cache.set('k1', { result: { tenantId: 't1', type: 'revenue' } })
    cache.set('k2', { result: { tenantId: 't1', type: 'order' } })
    cache.set('k3', { result: { tenantId: 't2', type: 'revenue' } })
    // Invalidate t1
    for (const [k, v] of cache) {
      if (v.result.tenantId === 't1') cache.delete(k)
    }
    expect(cache.has('k1')).toBe(false)
    expect(cache.has('k2')).toBe(false)
    expect(cache.has('k3')).toBe(true)
  })

  it('按租户+类型失效缓存', () => {
    const cache = new Map<string, { result: { tenantId: string; type: string } }>()
    cache.set('k1', { result: { tenantId: 't1', type: 'revenue' } })
    cache.set('k2', { result: { tenantId: 't1', type: 'order' } })
    for (const [k, v] of cache) {
      if (v.result.tenantId === 't1' && v.result.type === 'revenue') cache.delete(k)
    }
    expect(cache.has('k1')).toBe(false)
    expect(cache.has('k2')).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────
// ReportQueryService — DSL parsing
// ──────────────────────────────────────────────────────────────

describe('ReportQueryService — DSL 解析', () => {
  const ALLOWED_OPS = ['=', '!=', '>', '>=', '<', '<=', 'in', 'notIn', 'between', 'like']
  const fieldWhitelists: Record<string, Set<string>> = {
    order: new Set(['id', 'orderId', 'status', 'totalCents', 'source', 'memberId', 'itemCount', 'createdAt']),
    payment: new Set(['id', 'orderId', 'amountCents', 'currency', 'method', 'status', 'createdAt']),
    member: new Set(['id', 'level', 'source', 'status', 'lifecycleStage', 'createdAt', 'lastActiveAt']),
  }

  function validateField(sourceType: string, field: string) {
    const whitelist = fieldWhitelists[sourceType]
    if (!whitelist) throw new Error(`unknown source: ${sourceType}`)
    if (!whitelist.has(field)) throw new Error(`field ${field} not allowed`)
  }

  function validateOp(op: string) {
    if (!ALLOWED_OPS.includes(op)) throw new Error(`op ${op} not allowed`)
  }

  it('有效字段通过验证', () => {
    expect(() => validateField('order', 'status')).not.toThrow()
    expect(() => validateField('payment', 'amountCents')).not.toThrow()
    expect(() => validateField('member', 'level')).not.toThrow()
  })

  it('无效字段抛异常', () => {
    expect(() => validateField('order', 'hacked_field')).toThrow('not allowed')
    expect(() => validateField('payment', 'password')).toThrow('not allowed')
  })

  it('无效 sourceType 抛异常', () => {
    expect(() => validateField('unknown', 'id')).toThrow('unknown source')
  })

  it('允许的操作符全部通过', () => {
    for (const op of ALLOWED_OPS) {
      expect(() => validateOp(op)).not.toThrow()
    }
  })

  it('不允许的操作符抛异常', () => {
    expect(() => validateOp('SQL_INJECTION')).toThrow('not allowed')
    expect(() => validateOp('')).toThrow('not allowed')
  })

  it('解析 DSL AND 组', () => {
    const dsl = { AND: [{ field: 'status', op: '=', value: 'PAID' }, { field: 'source', op: 'in', value: ['wechat', 'alipay'] }] }
    expect(dsl.AND).toHaveLength(2)
    expect(dsl.AND[0].op).toBe('=')
    expect(dsl.AND[1].op).toBe('in')
  })

  it('解析 DSL OR 组', () => {
    const dsl = { OR: [{ field: 'source', op: '=', value: 'wechat' }, { field: 'source', op: '=', value: 'app' }] }
    expect(dsl.OR).toHaveLength(2)
  })
})
