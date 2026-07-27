import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'alert-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'alert-detail-data.ts'), 'utf-8')
const PRESENTER_SRC = readFileSync(resolve(DIR, 'detail-presenter.tsx'), 'utf-8')

describe('alerts/[id] 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAlertDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<AlertDetailClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })

  it('client 应保留 router.refresh 并复用 detail presenter', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('AdminAlertDetailRouteView'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
  })

  it('data 应定义治理快照加载合同', () => {
    assert.ok(DATA_SRC.includes('loadAdminGovernanceReadModel'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'alert-detail-governance'"))
    assert.ok(DATA_SRC.includes('loadAlertDetailSnapshot'))
  })

  it('presenter 应保留 fallback 明细构建能力', () => {
    assert.ok(PRESENTER_SRC.includes('buildAdminAlertFallbackDetailViewModel'))
    assert.ok(PRESENTER_SRC.includes('AdminAlertDetailRouteView'))
  })
})
