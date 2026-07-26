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

describe('AdminTenantsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function AdminTenantsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 tenants 快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadTenantsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadTenantsSnapshot } from '../../tenants-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'tenant:read'"))
  })
})

describe('AdminTenantsPage — 来源态透明化', () => {
  it('页面应展示租户来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(
      PAGE_SRC.includes(
        'loadTenantsSnapshot -> tenant/lifecycle/:tenantId/status + tenant/quota/:tenantId'
      )
    )
    assert.ok(PAGE_SRC.includes('loadTenantsSnapshot -> MOCK_TENANTS fallback'))
    assert.ok(PAGE_SRC.includes('local tenant samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
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
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
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
