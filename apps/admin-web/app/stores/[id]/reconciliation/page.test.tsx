import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'reconciliation-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'reconciliation-data.ts'), 'utf-8')

describe('stores/[id]/reconciliation/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载对账快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function ReconciliationPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadReconciliationSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<ReconciliationClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"))
  })
})

describe('stores/[id]/reconciliation/client 结构固证', () => {
  it('client 应保留筛选、执行对账、差异详情与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('useMemo'))
    assert.ok(CLIENT_SRC.includes('执行对账'))
    assert.ok(CLIENT_SRC.includes('差异详情'))
    assert.ok(CLIENT_SRC.includes('提交审核'))
  })
})

describe('stores/[id]/reconciliation/data 结构固证', () => {
  it('data 应定义对账快照合同与派生汇总', () => {
    assert.ok(DATA_SRC.includes('export interface ReconciliationSnapshot'))
    assert.ok(DATA_SRC.includes('RECONCILIATION_RECORDS'))
    assert.ok(DATA_SRC.includes('buildReconciliationSummary'))
    assert.ok(DATA_SRC.includes('buildMethodSummary'))
    assert.ok(DATA_SRC.includes('loadReconciliationSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-reconciliation-mock'"))
  })
})
