import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'resilience-retry-policy-detail-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'resilience-retry-policy-detail-data.ts'), 'utf-8')
})

describe('ResilienceRetryPolicyDetailPage — 服务端壳层', () => {
  it('应解析 key 并加载 no-store 快照', () => {
    assert.ok(PAGE_SRC.includes('readResilienceRetryPolicyDetailParam'))
    assert.ok(PAGE_SRC.includes("const snapshot = await loadResilienceRetryPolicyDetailPageSnapshot(key ?? '', {"))
    assert.ok(PAGE_SRC.includes('capability: readQueryParam(resolvedSearch.capability)'))
    assert.ok(PAGE_SRC.includes('status: readQueryParam(resolvedSearch.status)'))
  })

  it('应渲染权限门禁、来源态证据和客户端组件', () => {
    assert.ok(PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('<ResilienceRetryPolicyDetailClient snapshot={snapshot.detail} />'))
  })
})

describe('ResilienceRetryPolicyDetailData — 快照合同', () => {
  it('应通过 view-model loader 构建详情快照', () => {
    assert.ok(
      DATA_SRC.includes(
        "const detail = await loadResilienceRetryPolicyDetail(key, query, { cache: 'no-store' })"
      )
    )
    assert.ok(DATA_SRC.includes("sourceLabel: `resilience-retry-detail:${detail.deliveryMode}`"))
  })
})

describe('ResilienceRetryPolicyDetailClient — 客户端展示层', () => {
  it('应保留 notFound 面板与闭环跳转', () => {
    assert.ok(CLIENT_SRC.includes('NotFoundPanel'))
    assert.ok(CLIENT_SRC.includes('DetailClosureBar'))
    assert.ok(CLIENT_SRC.includes('WorkspaceBreadcrumb'))
  })
})
