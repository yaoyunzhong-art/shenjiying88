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
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
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
