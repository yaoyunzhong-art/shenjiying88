import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'order-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'order-detail-data.ts'), 'utf-8')

describe('orders/[id] 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadOrderDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<OrderDetailClient snapshot={snapshot} />'))
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
  })

  it('client 应保留 router.refresh 与详情交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('DetailActionBar'))
    assert.ok(CLIENT_SRC.includes("message.warning('状态流转 API 尚未接入，暂无法操作')"))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
  })

  it('data 应定义 mock 快照合同并收敛格式化工具', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'order-detail-mock'"))
    assert.ok(DATA_SRC.includes('loadOrderDetailSnapshot'))
    assert.ok(DATA_SRC.includes('formatAmount'))
  })
})
