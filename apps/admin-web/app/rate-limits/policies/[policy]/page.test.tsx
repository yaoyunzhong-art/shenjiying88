import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'rate-limits-policy-detail-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'rate-limits-policy-detail-data.ts'), 'utf-8')
})

describe('RateLimitsPolicyDetailPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function RateLimitsPolicyDetailPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应解析 policyId 并加载服务端快照', () => {
    assert.ok(PAGE_SRC.includes('readRateLimitsPolicyDetailParam'))
    assert.ok(PAGE_SRC.includes('const policyId = readPolicyId(resolvedParams.policy)'))
    assert.ok(PAGE_SRC.includes("const snapshot = await loadRateLimitsPolicyDetailPageSnapshot(policyId ?? '', {"))
    assert.ok(PAGE_SRC.includes('tenantId: readQueryParam(resolvedSearch.tenantId)'))
    assert.ok(PAGE_SRC.includes('status: readQueryParam(resolvedSearch.status)'))
  })

  it('页面应渲染权限门禁、来源态证据和客户端详情组件', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode} / {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('refreshPath: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('<RateLimitsPolicyDetailClient snapshot={snapshot.detail} />'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('RateLimitsPolicyDetailData — 快照合同', () => {
  it('应通过 no-store 详情 loader 构建快照', () => {
    assert.ok(
      DATA_SRC.includes("const detail = await loadRateLimitsPolicyDetail(policyId, query, { cache: 'no-store' })")
    )
    assert.ok(DATA_SRC.includes("sourceLabel: `rate-limits-policy-detail:${detail.deliveryMode}`"))
    assert.ok(DATA_SRC.includes('detail,'))
  })
})

describe('RateLimitsPolicyDetailClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端组件应保留详情收口与关联账本展示', () => {
    assert.ok(CLIENT_SRC.includes('DetailClosureBar'))
    assert.ok(CLIENT_SRC.includes('DetailActionBar'))
    assert.ok(CLIENT_SRC.includes('snapshot.matchedLedgers'))
    assert.ok(CLIENT_SRC.includes('buildRateLimitsLedgerDetailHref'))
  })
})
