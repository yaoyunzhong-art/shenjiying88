import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'stock-transfer-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'stock-transfer-detail-data.ts'), 'utf-8')

describe('stock-transfer/[id] 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadStockTransferDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<StockTransferDetailClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'stock-transfer:read'"))
  })

  it('page 不应再承载旧的 suspense 与 error boundary 壳层', () => {
    assert.ok(!PAGE_SRC.includes('Suspense'))
    assert.ok(!PAGE_SRC.includes('ErrorBoundary'))
    assert.ok(!PAGE_SRC.includes('dangerouslySetInnerHTML'))
    assert.ok(!PAGE_SRC.includes('transferId={id}'))
  })

  it('client 应承接刷新、详情渲染与状态交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('useFormSubmit'))
    assert.ok(CLIENT_SRC.includes('Timeline'))
    assert.ok(CLIENT_SRC.includes('STATUS_FLOW'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
  })

  it('data 应定义调拨详情快照合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'stock-transfer-detail-mock'"))
    assert.ok(DATA_SRC.includes('export interface StockTransferDetailSnapshot'))
    assert.ok(DATA_SRC.includes('findStockTransferById'))
    assert.ok(DATA_SRC.includes('loadStockTransferDetailSnapshot'))
  })
})
