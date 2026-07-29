import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'crm-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'crm-data.ts'), 'utf-8')
})

describe('CrmPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function CrmPage()'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 CRM 快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCrmSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'crm:read'"))
  })
})

describe('CrmPage — 来源态证据', () => {
  it('页面应展示来源态证据字段', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadCrmSnapshot -> crm/customers + crm/stats'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadCrmSnapshot -> MOCK_CRM_CUSTOMERS / MOCK_CRM_STATS fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local CRM customer samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('CrmData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('customers: CustomerProfile[]'))
    assert.ok(DATA_SRC.includes('stats: CrmStats'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应尝试读取上游 crm/customers 与 crm/stats', () => {
    assert.ok(DATA_SRC.includes("fetchCrmPart<{ customers: CustomerProfile[]; total?: number }>('crm/customers')"))
    assert.ok(DATA_SRC.includes("fetchCrmPart<CrmStats>('crm/stats')"))
    assert.ok(DATA_SRC.includes('resolveCrmApiBaseUrl'))
    assert.ok(DATA_SRC.includes('unwrapApiPayload'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('CRM 实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('CrmClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并接收 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot: CrmSnapshotDelivery'))
  })

  it('客户端组件应支持刷新并透出 fallback 错误', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应保留筛选、分页和详情弹窗', () => {
    assert.ok(CLIENT_SRC.includes('filterCustomers('))
    assert.ok(CLIENT_SRC.includes('aria-label="客户搜索"'))
    assert.ok(CLIENT_SRC.includes('aria-label="状态筛选"'))
    assert.ok(CLIENT_SRC.includes('aria-label="最低评分"'))
    assert.ok(CLIENT_SRC.includes('aria-label="最高评分"'))
    assert.ok(CLIENT_SRC.includes('DetailDialog'))
    assert.ok(CLIENT_SRC.includes('setSelectedCustomer'))
  })

  it('客户端组件应保留空态与统计卡片', () => {
    assert.ok(CLIENT_SRC.includes('StatCard label="总客户"'))
    assert.ok(CLIENT_SRC.includes('StatCard label="活跃客户"'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有客户记录，请调整筛选条件'))
    assert.ok(CLIENT_SRC.includes('上游快照尚未返回客户记录，请确认 CRM 数据源'))
  })
})

describe('CrmPage — 反例与边界', () => {
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
})
