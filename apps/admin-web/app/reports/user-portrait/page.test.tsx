import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'user-portrait-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'user-portrait-data.ts'), 'utf-8')
})

describe('user-portrait — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function UserPortraitPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载画像快照并展示来源态', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadUserPortraitSnapshot()'))
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
  })
})

describe('user-portrait-data — 快照合同', () => {
  it('应定义画像快照结构与 fallback 样本', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('records: UserRecord[]'))
    assert.ok(DATA_SRC.includes('export const MOCK_USER_RECORDS'))
    assert.ok(DATA_SRC.includes('computeUserPortraitStats'))
  })

  it('应尝试请求实时 user-portrait 接口并保留 fallback', () => {
    assert.ok(DATA_SRC.includes("new URL('reports/user-portrait', resolveUserPortraitApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('loadUserPortraitSnapshot -> reports/user-portrait'))
    assert.ok(DATA_SRC.includes('loadUserPortraitSnapshot -> MOCK_USER_RECORDS fallback'))
    assert.ok(DATA_SRC.includes('用户画像实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('user-portrait-client — 客户端渲染', () => {
  it('客户端组件应声明 use client 并消费 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot: UserPortraitSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('USER_LEVEL_OPTIONS'))
  })

  it('客户端组件应提供刷新能力与筛选', () => {
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('filterUserPortraitRecords'))
    assert.ok(CLIENT_SRC.includes('全部等级'))
  })

  it('客户端组件应保留标题、统计与用户列表', () => {
    assert.ok(CLIENT_SRC.includes('用户画像报表'))
    assert.ok(CLIENT_SRC.includes('用户列表'))
    assert.ok(CLIENT_SRC.includes('总消费额'))
    assert.ok(CLIENT_SRC.includes('暂无数据'))
  })
})
