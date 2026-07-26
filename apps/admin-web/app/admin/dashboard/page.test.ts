import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'dashboard-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'dashboard-data.ts'), 'utf-8')

describe('admin/dashboard — 来源态固证', () => {
  it('page 应展示 mock 来源链路', () => {
    assert.ok(PAGE_SRC.includes('loadAdminDashboardSnapshot -> defaultOverview/defaultRevenueTrend/defaultRegionStats/defaultNewTenantTrend/defaultAlerts'))
    assert.ok(PAGE_SRC.includes('local admin dashboard HQ samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })

  it('data 应固化总部样本字段', () => {
    assert.ok(DATA_SRC.includes('export const defaultOverview'))
    assert.ok(DATA_SRC.includes('export const defaultRevenueTrend'))
    assert.ok(DATA_SRC.includes('export const defaultRegionStats'))
    assert.ok(DATA_SRC.includes('export const defaultNewTenantTrend'))
    assert.ok(DATA_SRC.includes('export const defaultAlerts'))
  })

  it('client 应保留总览、趋势、分布三个视图', () => {
    assert.ok(CLIENT_SRC.includes("'overview' | 'trend' | 'distribution'"))
    assert.ok(CLIENT_SRC.includes('全局分析仪表盘'))
    assert.ok(CLIENT_SRC.includes('区域分布'))
    assert.ok(CLIENT_SRC.includes('系统告警'))
  })
})
