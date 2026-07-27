import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(
    resolve(import.meta.dirname, 'integration-orchestration-event-detail-client.tsx'),
    'utf-8'
  )
  DATA_SRC = readFileSync(
    resolve(import.meta.dirname, 'integration-orchestration-event-detail-data.ts'),
    'utf-8'
  )
})

describe('IntegrationOrchestrationEventDetailPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function IntegrationOrchestrationEventDetailPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应解析 envelopeId 并加载服务端快照', () => {
    assert.ok(PAGE_SRC.includes('readIntegrationOrchestrationEventDetailParam'))
    assert.ok(PAGE_SRC.includes('const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])'))
    assert.ok(PAGE_SRC.includes('const envelopeId = readEnvelopeId(resolvedParams.envelopeId)'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadIntegrationOrchestrationEventDetailPageSnapshot(envelopeId ?? \'\', {'))
  })

  it('页面应渲染权限门禁、来源态证据和客户端详情组件', () => {
    assert.ok(PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode} / {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('refreshPath: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('<IntegrationOrchestrationEventDetailClient snapshot={snapshot.detail} />'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('IntegrationOrchestrationEventDetailData — 快照合同', () => {
  it('应通过 no-store 详情 loader 构建快照', () => {
    assert.ok(
      DATA_SRC.includes(
        "const detail = await loadIntegrationOrchestrationEventDetail(envelopeId, query, { cache: 'no-store' })"
      )
    )
    assert.ok(DATA_SRC.includes("sourceLabel: `integration-orchestration-event-detail:${detail.deliveryMode}`"))
    assert.ok(DATA_SRC.includes('detail,'))
  })
})

describe('IntegrationOrchestrationEventDetailClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('客户端组件应保留详情收口与关联幂等展示', () => {
    assert.ok(CLIENT_SRC.includes('DetailClosureBar'))
    assert.ok(CLIENT_SRC.includes('DetailActionBar'))
    assert.ok(CLIENT_SRC.includes('snapshot.matchedIdempotency'))
    assert.ok(CLIENT_SRC.includes('buildIntegrationOrchestrationIdempotencyDetailHref'))
  })
})
