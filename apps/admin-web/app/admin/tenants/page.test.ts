import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'tenants-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, '../../tenants-data.ts'), 'utf-8')
})



describe('TenantsData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('tenants: TenantItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留默认 fallback 样本与列表预设', () => {
    assert.ok(DATA_SRC.includes('export const MOCK_TENANTS'))
    assert.ok(DATA_SRC.includes('TENANT_LIST_PRESET'))
    assert.ok(DATA_SRC.includes('TENANT_STATUS_MAP'))
    assert.ok(DATA_SRC.includes('华润万象生活'))
  })

  it('应尝试读取上游 tenants 接口', () => {
    assert.ok(DATA_SRC.includes('tenant/lifecycle/${tenantId}/status'))
    assert.ok(DATA_SRC.includes('tenant/quota/${tenantId}'))
    assert.ok(DATA_SRC.includes('fetchTenantRecord'))
    assert.ok(DATA_SRC.includes('mapLifecycleStatus'))
    assert.ok(DATA_SRC.includes('mapQuotaTier'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('租户治理实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('TenantsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: TenantsSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留筛选、表格和分页结构', () => {
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('FilterChips'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
    assert.ok(CLIENT_SRC.includes('Pagination'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
  })

  it('客户端组件应保留租户统计与多维筛选', () => {
    assert.ok(CLIENT_SRC.includes('租户总数'))
    assert.ok(CLIENT_SRC.includes('企业版'))
    assert.ok(CLIENT_SRC.includes("useState<TenantBillingMode | 'ALL'>('ALL')"))
    assert.ok(CLIENT_SRC.includes("useState<string>('ALL')"))
    assert.ok(CLIENT_SRC.includes('computeTenantStats'))
  })
})

describe('Tenants — 反例与边界', () => {
  it('源码中不应出现 describe.skip', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'))
    assert.ok(!CLIENT_SRC.includes('describe.skip'))
    assert.ok(!DATA_SRC.includes('describe.skip'))
  })

  it('源码中不应出现 as any', () => {
    assert.ok(!PAGE_SRC.includes('as any'))
    assert.ok(!CLIENT_SRC.includes('as any'))
    assert.ok(!DATA_SRC.includes('as any'))
  })

  it('客户端应保留 ALL 默认筛选与市场维度', () => {
    assert.ok(CLIENT_SRC.includes("'ALL'"))
    assert.ok(CLIENT_SRC.includes('tenant.marketCode === marketFilter'))
    assert.ok(CLIENT_SRC.includes("label: '全部状态'"))
    assert.ok(CLIENT_SRC.includes('最新快照时间 {snapshot.generatedAt}'))
  })
})
