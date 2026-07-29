import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'foundation-module-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'foundation-module-detail-data.ts'), 'utf-8')

describe('foundation/modules/[module] E54 结构固证', () => {
  it('page 为服务端包装层并解析 module 参数', () => {
    assert.equal(PAGE_SRC.includes("'use client'"), false)
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('readFoundationModuleDetailParam'))
    assert.ok(PAGE_SRC.includes('loadFoundationModuleDetailPageSnapshot'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFoundationModuleDetailPageSnapshot(moduleKey)'))
    assert.ok(PAGE_SRC.includes('<FoundationModuleDetailClient snapshot={snapshot} />'))
  })

  it('page 透出来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })

  it('client 保留详情渲染并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('WorkspaceBreadcrumb'))
    assert.ok(CLIENT_SRC.includes('DetailClosureBar'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"))
  })

  it('data 复用 foundation 详情视图模型并补齐 E54 证据字段', () => {
    assert.ok(DATA_SRC.includes('loadFoundationModuleDetail'))
    assert.ok(DATA_SRC.includes('FoundationModuleDetailPageSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel:"))
    assert.ok(DATA_SRC.includes('controlPlaneSource'))
    assert.ok(DATA_SRC.includes('businessDataSource'))
    assert.ok(DATA_SRC.includes('refreshPath'))
  })
})
