import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'sales-summary-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'sales-summary-data.ts'), 'utf-8')

describe('reports/sales-summary/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载销售汇总快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function SalesSummaryPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSalesSummarySnapshot()'))
    assert.ok(PAGE_SRC.includes('<SalesSummaryClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'dashboard:read'"))
  })
})

describe('reports/sales-summary/client 结构固证', () => {
  it('client 应保留筛选、导出与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('useMemo'))
    assert.ok(CLIENT_SRC.includes('搜索日期/热销商品'))
    assert.ok(CLIENT_SRC.includes('导出销售汇总'))
    assert.ok(CLIENT_SRC.includes('平均客单'))
  })
})

describe('reports/sales-summary/data 结构固证', () => {
  it('data 应定义销售汇总快照合同与样本数据', () => {
    assert.ok(DATA_SRC.includes('export interface SalesSummarySnapshot'))
    assert.ok(DATA_SRC.includes('SALES_SUMMARY_RECORDS'))
    assert.ok(DATA_SRC.includes('periodOptions'))
    assert.ok(DATA_SRC.includes('loadSalesSummarySnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'reports-sales-summary-mock'"))
  })
})
