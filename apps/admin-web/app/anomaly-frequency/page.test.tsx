import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'anomaly-frequency-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'anomaly-frequency-client.tsx'), 'utf-8')

describe('anomaly-frequency E54 结构固证', () => {
  it('page 已收口为 server wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export const dynamic = \'force-dynamic\''))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('export default async function AnomalyFrequencyPage()'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAnomalyFrequencySnapshot()'))
    assert.ok(PAGE_SRC.includes('<AnomalyFrequencyClient snapshot={snapshot} />'))
  })

  it('page 显式透出来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('data 层定义快照合同与 API/fallback 双路径', () => {
    assert.ok(DATA_SRC.includes('export interface AnomalyFrequencySnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'anomaly-frequency-api' | 'anomaly-frequency-fallback'"))
    assert.ok(DATA_SRC.includes('loadAdminGovernanceReadModel'))
    assert.ok(DATA_SRC.includes('buildBucketsByRange'))
    assert.ok(DATA_SRC.includes('buildFallbackSnapshot'))
    assert.ok(DATA_SRC.includes("refreshPath: 'loadAnomalyFrequencySnapshot()'"))
  })

  it('data 层保留治理读模型到时序桶的投影证据', () => {
    assert.ok(DATA_SRC.includes('deriveSeverityTotals'))
    assert.ok(DATA_SRC.includes('distributeTotal'))
    assert.ok(DATA_SRC.includes('governance.overviewAlerts count distribution + governance.summary critical projection'))
    assert.ok(DATA_SRC.includes('hasData: stats.totalAlerts > 0'))
  })

  it('client 层保留筛选、渲染与刷新交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('projectBucketsBySeverity'))
    assert.ok(CLIENT_SRC.includes('AnomalyFrequencyTimeline'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
  })
})
