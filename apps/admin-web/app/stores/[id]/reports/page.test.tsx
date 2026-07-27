import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'reports-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'reports-data.ts'), 'utf-8')

describe('stores/[id]/reports/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载报表快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function ReportsPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadReportsSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<ReportsClient snapshot={snapshot} />'))
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

describe('stores/[id]/reports/client 结构固证', () => {
  it('client 应保留概览、自动报表、自定义报表与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('useMemo'))
    assert.ok(CLIENT_SRC.includes('概览'))
    assert.ok(CLIENT_SRC.includes('自定义报表'))
    assert.ok(CLIENT_SRC.includes('新建报表'))
  })
})

describe('stores/[id]/reports/data 结构固证', () => {
  it('data 应定义报表快照合同与分类样本', () => {
    assert.ok(DATA_SRC.includes('export interface ReportsSnapshot'))
    assert.ok(DATA_SRC.includes('AUTO_REPORT_RECORDS'))
    assert.ok(DATA_SRC.includes('CUSTOM_REPORT_RECORDS'))
    assert.ok(DATA_SRC.includes('buildReportsSummary'))
    assert.ok(DATA_SRC.includes('loadReportsSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-reports-mock'"))
  })
})
