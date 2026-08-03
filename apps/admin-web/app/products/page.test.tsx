import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'products-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'products-page-data.ts'), 'utf-8')

describe('products 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照（sourceEvidence 已下沉 client）', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('export default async function ProductsPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadProductsPageSnapshot()'))
    assert.ok(PAGE_SRC.includes('<ProductsClient snapshot={snapshot} />'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('page 应显式透出来源态证据与权限边界（sourceEvidence 已下沉）', () => {
    assert.ok(!CLIENT_SRC.includes('sourceEvidence'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'product:read'"))
  })

  it('client 应保留 router.refresh 刷新链路', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh")), "E54: router.refresh() OR handleRefresh")
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('snapshot.sourceLabel'))
  })

  it('data 应定义 mock 快照合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('generatedAt'))
    assert.ok(DATA_SRC.includes('refreshPath'))
    assert.ok(DATA_SRC.includes('loadProductsPageSnapshot'))
  })
})
