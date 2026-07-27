import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'finance-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'finance-data.ts'), 'utf-8')

describe('stores/[id]/finance/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载财务快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function FinancePage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFinanceSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<FinanceClient snapshot={snapshot} />'))
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

describe('stores/[id]/finance/client 结构固证', () => {
  it('client 应保留交互、筛选与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('useMemo'))
    assert.ok(CLIENT_SRC.includes('setShowSettle'))
    assert.ok(CLIENT_SRC.includes('导出月度报表'))
    assert.ok(CLIENT_SRC.includes('日结确认'))
  })
})

describe('stores/[id]/finance/data 结构固证', () => {
  it('data 应定义财务快照合同与样本数据', () => {
    assert.ok(DATA_SRC.includes('export interface FinanceSnapshot'))
    assert.ok(DATA_SRC.includes('FINANCE_TRANSACTIONS'))
    assert.ok(DATA_SRC.includes('buildFinanceSummary'))
    assert.ok(DATA_SRC.includes('loadFinanceSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-finance-mock'"))
  })
})
