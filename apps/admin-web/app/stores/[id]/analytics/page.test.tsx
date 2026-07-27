import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'analytics-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'analytics-data.ts'), 'utf-8')

describe('stores/[id]/analytics/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载经营分析快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function AnalyticsPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAnalyticsSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<AnalyticsClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"))
  })
})

describe('stores/[id]/analytics data/client 结构固证', () => {
  it('snapshot loader 应固化经营分析合同、诊断与刷新字段', () => {
    assert.ok(DATA_SRC.includes('export interface AnalyticsSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-analytics-fallback'"))
    assert.ok(DATA_SRC.includes('diagnostics: AnalyticsDiagnostic[]'))
    assert.ok(DATA_SRC.includes('buildAnalyticsSummary'))
    assert.ok(DATA_SRC.includes('loadAnalyticsSnapshot'))
  })

  it('client renderer 应承载交互、明细与 router.refresh 刷新链路', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot.topDevices'))
    assert.ok(CLIENT_SRC.includes('snapshot.diagnostics'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('setDetailPoint'))
    assert.ok(CLIENT_SRC.includes('导出报告'))
  })
})
