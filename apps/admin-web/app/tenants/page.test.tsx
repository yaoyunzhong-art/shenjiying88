import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(__dirname, 'tenants-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(__dirname, '../tenants-data.ts'), 'utf-8')
})

describe('TenantsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function TenantsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载租户快照并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadTenantsSnapshot()'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })
})

describe('TenantsData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('tenants: TenantItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留租户样本与 fallback 提示', () => {
    assert.ok(DATA_SRC.includes('MOCK_TENANTS'))
    assert.ok(DATA_SRC.includes('TNT-001'))
    assert.ok(DATA_SRC.includes('租户治理实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('TenantsClient — 客户端渲染层', () => {
  it('应声明 use client 并触发 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('应保留筛选、表格与分页结构', () => {
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('FilterChips'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
    assert.ok(CLIENT_SRC.includes('Pagination'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
  })
})
