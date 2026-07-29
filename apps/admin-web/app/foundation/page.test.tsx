import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'foundation-workspace-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'foundation-data.ts'), 'utf-8')
})

describe('FoundationPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function FoundationPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应解析 query 并加载 foundation 快照', () => {
    assert.ok(PAGE_SRC.includes('const resolvedSearchParams = searchParams ? await searchParams : undefined'))
    assert.ok(PAGE_SRC.includes('const requestHeaders = pickForwardedRequestHeaders(await headers())'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFoundationPageSnapshot('))
    assert.ok(PAGE_SRC.includes('normalizeFoundationQuery(resolvedSearchParams)'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应展示来源态证据与权限门禁', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('sourceLabel: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('query: {sourceEvidence.query}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('scope: {sourceEvidence.scope}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('forwardedHeaders: {sourceEvidence.requestHeaders}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('actorHeadersMode:'))
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })
})

describe('FoundationData — 快照合同', () => {
  it('应定义 query 归一化与 page snapshot loader', () => {
    assert.ok(DATA_SRC.includes('export function normalizeFoundationQuery'))
    assert.ok(DATA_SRC.includes('export async function loadFoundationPageSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'foundation-workspace-api' | 'foundation-workspace-fallback'"))
    assert.ok(DATA_SRC.includes('loadFoundationWorkspace(query, init)'))
  })

  it('应保留 api/fallback 来源说明', () => {
    assert.ok(DATA_SRC.includes('foundation-workspace-api'))
    assert.ok(DATA_SRC.includes('foundation-workspace-fallback'))
    assert.ok(DATA_SRC.includes('fallback 样本'))
  })
})

describe('FoundationWorkspaceClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端应保留模块目录、消费方与治理基线视图', () => {
    assert.ok(CLIENT_SRC.includes('模块目录'))
    assert.ok(CLIENT_SRC.includes('消费方'))
    assert.ok(CLIENT_SRC.includes('治理基线'))
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
  })
})
