import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'dashboard-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'dashboard-data.ts'), 'utf-8')
})

describe('AdminDashboardPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function AdminDashboardPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应读取 admin dashboard 快照', () => {
    assert.ok(PAGE_SRC.includes("import { loadAdminDashboardSnapshot } from './dashboard-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAdminDashboardSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应展示来源态证据并接入权限门禁', () => {
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'dashboard:read'"))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })
})

describe('AdminDashboardData — 快照合同', () => {
  it('应定义 mock 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('overview: AdminDashboardOverview'))
    assert.ok(DATA_SRC.includes('revenueTrend: RevenueTrendPoint[]'))
    assert.ok(DATA_SRC.includes('regionStats: RegionStat[]'))
    assert.ok(DATA_SRC.includes('newTenantTrend: NewTenantPoint[]'))
    assert.ok(DATA_SRC.includes('alerts: DashboardAlert[]'))
  })

  it('应定义默认样本与加载器', () => {
    assert.ok(DATA_SRC.includes('export const defaultOverview'))
    assert.ok(DATA_SRC.includes('export const defaultRevenueTrend'))
    assert.ok(DATA_SRC.includes('export const defaultRegionStats'))
    assert.ok(DATA_SRC.includes('export const defaultNewTenantTrend'))
    assert.ok(DATA_SRC.includes('export const defaultAlerts'))
    assert.ok(DATA_SRC.includes('export async function loadAdminDashboardSnapshot'))
  })
})

describe('AdminDashboardClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('客户端应保留 tab 切换与快照展示', () => {
    assert.ok(CLIENT_SRC.includes("type DashboardTab = 'overview' | 'trend' | 'distribution'"))
    assert.ok(CLIENT_SRC.includes('activeTab'))
    assert.ok(CLIENT_SRC.includes('snapshot.revenueTrend.map'))
    assert.ok(CLIENT_SRC.includes('snapshot.regionStats.map'))
    assert.ok(CLIENT_SRC.includes('snapshot.newTenantTrend.map'))
    assert.ok(CLIENT_SRC.includes('snapshot.alerts.map'))
  })
})
