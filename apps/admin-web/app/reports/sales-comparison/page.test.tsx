import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'sales-comparison-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'sales-comparison-data.ts'), 'utf-8')

describe('reports/sales-comparison/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载销售对比快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function SalesComparisonPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSalesComparisonSnapshot()'))
    assert.ok(PAGE_SRC.includes('<SalesComparisonClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'dashboard:read'"))
  })
})

describe('reports/sales-comparison/client 结构固证', () => {
  it('client 应保留筛选、导出与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('useMemo'))
    assert.ok(CLIENT_SRC.includes('搜索指标/周期'))
    assert.ok(CLIENT_SRC.includes('导出对比快照'))
    assert.ok(CLIENT_SRC.includes('增长率'))
  })
})

describe('reports/sales-comparison/data 结构固证', () => {
  it('data 应定义销售对比快照合同与样本数据', () => {
    assert.ok(DATA_SRC.includes('export interface SalesComparisonSnapshot'))
    assert.ok(DATA_SRC.includes('SALES_COMPARISON_RECORDS'))
    assert.ok(DATA_SRC.includes('SalesComparisonPeriod'))
    assert.ok(DATA_SRC.includes('loadSalesComparisonSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'reports-sales-comparison-mock'"))
  })
})
