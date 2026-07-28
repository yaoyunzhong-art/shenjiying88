import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'tax-report-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'tax-report-data.ts'), 'utf-8')
})

describe('tax-report — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function TaxReportPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载税务快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadTaxReportSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('tax-report — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(PAGE_SRC.includes("requiredPermission: 'dashboard:read'"))
  })
})

describe('tax-report-data — 快照合同', () => {
  it('应定义税务快照结构与 fallback 样本', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('records: TaxRecord[]'))
    assert.ok(DATA_SRC.includes('export const MOCK_TAX_RECORDS'))
    assert.ok(DATA_SRC.includes('computeTaxReportStats'))
  })

  it('应尝试请求实时 tax-report 接口并保留 fallback', () => {
    assert.ok(DATA_SRC.includes("new URL('reports/tax-report', resolveTaxReportApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('loadTaxReportSnapshot -> reports/tax-report'))
    assert.ok(DATA_SRC.includes('loadTaxReportSnapshot -> MOCK_TAX_RECORDS fallback'))
    assert.ok(DATA_SRC.includes('税务报表实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('tax-report-client — 客户端渲染', () => {
  it('客户端组件应声明 use client 并消费 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot: TaxReportSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('snapshot.records'))
  })

  it('客户端组件应提供刷新能力', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留标题、筛选、统计和表格', () => {
    assert.ok(CLIENT_SRC.includes('税务报表'))
    assert.ok(CLIENT_SRC.includes('纳税明细'))
    assert.ok(CLIENT_SRC.includes('filterTaxRecords'))
    assert.ok(CLIENT_SRC.includes('平均税率'))
    assert.ok(CLIENT_SRC.includes('暂无数据'))
  })
})
