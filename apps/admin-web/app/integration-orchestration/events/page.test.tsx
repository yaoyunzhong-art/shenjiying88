import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'integration-orchestration-events-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'integration-orchestration-events-data.ts'), 'utf-8')
})

describe('IntegrationOrchestrationEventsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function IntegrationOrchestrationEventsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载事件快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes("import { loadIntegrationOrchestrationEventsPageSnapshot } from './integration-orchestration-events-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadIntegrationOrchestrationEventsPageSnapshot({'))
    assert.ok(PAGE_SRC.includes('<IntegrationOrchestrationEventsClient events={snapshot.events} sources={snapshot.sources} />'))
  })

  it('页面应接入管理员权限边界与动态渲染', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('IntegrationOrchestrationEventsPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode} / {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('refreshPath: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })
})

describe('IntegrationOrchestrationEventsData — 快照合同', () => {
  it('应使用 workspace loader 的 no-store 快照', () => {
    assert.ok(DATA_SRC.includes("loadIntegrationOrchestrationWorkspace(query, { cache: 'no-store' })"))
    assert.ok(DATA_SRC.includes('events: workspaceSnapshot.workspace.events'))
    assert.ok(DATA_SRC.includes('sources: workspaceSnapshot.workspace.sources'))
    assert.ok(DATA_SRC.includes('sourceLabel: `integration-orchestration-events:${workspaceSnapshot.deliveryMode}`'))
  })
})

describe('IntegrationOrchestrationEventsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('客户端组件应保留搜索、来源筛选与分页', () => {
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('setSourceFilter'))
    assert.ok(CLIENT_SRC.includes('Pagination'))
    assert.ok(CLIENT_SRC.includes('Select'))
  })
})
