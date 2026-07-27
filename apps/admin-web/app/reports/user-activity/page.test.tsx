import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'user-activity-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'user-activity-data.ts'), 'utf-8')
})

describe('user-activity — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function UserActivityPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载活跃快照并展示来源态', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadUserActivitySnapshot()'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode} / {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource} / 业务数据: {sourceEvidence.businessDataSource}'))
  })
})

describe('user-activity-data — 快照合同', () => {
  it('应定义活跃快照结构与 fallback 样本', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('records: ActivityRecord[]'))
    assert.ok(DATA_SRC.includes('export const MOCK_ACTIVITY_RECORDS'))
    assert.ok(DATA_SRC.includes('computeUserActivityStats'))
  })

  it('应尝试请求实时 user-activity 接口并保留 fallback', () => {
    assert.ok(DATA_SRC.includes("new URL('reports/user-activity', resolveUserActivityApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('loadUserActivitySnapshot -> reports/user-activity'))
    assert.ok(DATA_SRC.includes('loadUserActivitySnapshot -> MOCK_ACTIVITY_RECORDS fallback'))
    assert.ok(DATA_SRC.includes('用户活跃实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('user-activity-client — 客户端渲染', () => {
  it('客户端组件应声明 use client 并消费 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot: UserActivitySnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('snapshot.records.slice(-7)'))
  })

  it('客户端组件应提供刷新能力', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('客户端组件应保留标题、趋势和明细表格', () => {
    assert.ok(CLIENT_SRC.includes('用户活跃报表'))
    assert.ok(CLIENT_SRC.includes('活跃趋势'))
    assert.ok(CLIENT_SRC.includes('每日活跃明细'))
    assert.ok(CLIENT_SRC.includes('filterUserActivityRecords'))
    assert.ok(CLIENT_SRC.includes('暂无数据'))
  })
})
