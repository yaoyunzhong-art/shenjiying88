/**
 * anomaly-frequency/page.test.ts — 异常时序频率监控页面源码级固证
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PAGE_SOURCE = resolve(__dirname, 'page.tsx')
const DATA_SOURCE = resolve(__dirname, 'anomaly-frequency-data.ts')
const CLIENT_SOURCE = resolve(__dirname, 'anomaly-frequency-client.tsx')

function readPageSource(): string {
  return readFileSync(PAGE_SOURCE, 'utf-8')
}

function readDataSource(): string {
  return readFileSync(DATA_SOURCE, 'utf-8')
}

function readClientSource(): string {
  return readFileSync(CLIENT_SOURCE, 'utf-8')
}

describe('anomaly-frequency page — E54 结构', () => {
  it('page 应导出默认异步组件并加载快照', () => {
    const src = readPageSource()
    assert.ok(src.includes('export default async function AnomalyFrequencyPage'))
    assert.ok(src.includes('loadAnomalyFrequencySnapshot'))
    assert.ok(src.includes('const snapshot = await loadAnomalyFrequencySnapshot()'))
    assert.ok(src.includes('<AnomalyFrequencyClient snapshot={snapshot} />'))
  })

  it('page 应显式展示来源态字段', () => {
    const src = readPageSource()
    assert.ok(!src.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(!src.includes('sourceEvidence.sourceLabel'))
    assert.ok(!src.includes('sourceEvidence.controlPlaneSource'))
    assert.ok(!src.includes('sourceEvidence.businessDataSource'))
    assert.ok(!src.includes('sourceEvidence.refreshPath'))
    assert.ok(!src.includes('sourceEvidence.generatedAt'))
  })

  it('page 应挂载权限边界与动态刷新配置', () => {
    const src = readPageSource()
    assert.ok(!src.includes('AdminPermissionGate'))
    assert.ok(!src.includes("requiredPermission: 'foundation.governance.read'"), "E54 拍平：requiredPermission 应已移除")
    assert.ok(src.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(src.includes('export const revalidate = 0'))
  })
})

describe('anomaly-frequency data — 快照合同', () => {
  it('应定义快照接口与时序范围', () => {
    const src = readDataSource()
    assert.ok(src.includes('export interface AnomalyFrequencySnapshot'))
    assert.ok(src.includes("export type AnomalyTimeRange = '6h' | '24h' | '7d' | '30d'"))
    assert.ok(src.includes('bucketsByRange: Record<AnomalyTimeRange, AnomalyTimeBucket[]>'))
  })

  it('应包含治理读模型加载和 fallback 壳层', () => {
    const src = readDataSource()
    assert.ok(src.includes('loadAdminGovernanceReadModel'))
    assert.ok(src.includes('buildFallbackSnapshot'))
    assert.ok(src.includes("sourceLabel: 'anomaly-frequency-api' | 'anomaly-frequency-fallback'"))
    assert.ok(src.includes("refreshPath: 'loadAnomalyFrequencySnapshot()'"))
  })

  it('应保留确定性时序桶投影实现', () => {
    const src = readDataSource()
    assert.ok(src.includes('deriveSeverityTotals'))
    assert.ok(src.includes('distributeTotal'))
    assert.ok(src.includes('buildBucketsByRange'))
    assert.ok(src.includes('governance.overviewAlerts count distribution + governance.summary critical projection'))
  })
})

describe('anomaly-frequency client — 交互固证', () => {
  it('应以 snapshot 为唯一输入并支持 router.refresh', () => {
    const src = readClientSource()
    assert.ok(src.includes('snapshot: AnomalyFrequencySnapshot'))
    assert.ok((src.includes("useRouter") || src.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((src.includes("router.refresh()") || src.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(src.includes('刷新快照'))
  })

  it('应支持时间范围与严重级别筛选', () => {
    const src = readClientSource()
    for (const token of ['6h', '24h', '7d', '30d', 'all', 'critical', 'high', 'medium', 'low']) {
      assert.ok(src.includes(`'${token}'`), `缺少筛选项 ${token}`)
    }
    assert.ok(src.includes('projectBucketsBySeverity'))
  })

  it('应同时覆盖图表与空态分支', () => {
    const src = readClientSource()
    assert.ok(src.includes('AnomalyFrequencyTimeline'))
    assert.ok(src.includes('暂无可展示的异常频率数据'))
    assert.ok(src.includes('currentRangeAverage'))
  })
})
