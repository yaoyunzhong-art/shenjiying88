import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'settlement-reconciliation-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'settlement-reconciliation-data.ts'), 'utf-8')

describe('reports/settlement-reconciliation/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载结算对账快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function SettlementReconciliationPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSettlementReconciliationSnapshot()'))
    assert.ok(PAGE_SRC.includes('<SettlementReconciliationClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'dashboard:read'"))
  })
})

describe('reports/settlement-reconciliation/client 结构固证', () => {
  it('client 应保留筛选、批量结算与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('useMemo'))
    assert.ok(CLIENT_SRC.includes('搜索门店/单号'))
    assert.ok(CLIENT_SRC.includes('发起批量结算'))
    assert.ok(CLIENT_SRC.includes('平台费用'))
  })
})

describe('reports/settlement-reconciliation/data 结构固证', () => {
  it('data 应定义结算对账快照合同与样本数据', () => {
    assert.ok(DATA_SRC.includes('export interface SettlementReconciliationSnapshot'))
    assert.ok(DATA_SRC.includes('SETTLEMENT_RECONCILIATION_RECORDS'))
    assert.ok(DATA_SRC.includes('SettlementReconciliationRecord'))
    assert.ok(DATA_SRC.includes('loadSettlementReconciliationSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'reports-settlement-reconciliation-mock'"))
  })
})
