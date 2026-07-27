import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'logistics-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'logistics-data.ts'), 'utf-8')

describe('stores/[id]/logistics/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载后勤快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function LogisticsPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadLogisticsSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<LogisticsClient snapshot={snapshot} />'))
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

describe('stores/[id]/logistics/client 结构固证', () => {
  it('client 应保留刷新、物流筛选与新建预约能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('useMemo'))
    assert.ok(CLIENT_SRC.includes('物流台账'))
    assert.ok(CLIENT_SRC.includes('新建预约'))
    assert.ok(CLIENT_SRC.includes('物流状态:'))
  })
})

describe('stores/[id]/logistics/data 结构固证', () => {
  it('data 应定义后勤快照合同与物流样本', () => {
    assert.ok(DATA_SRC.includes('export interface LogisticsSnapshot'))
    assert.ok(DATA_SRC.includes('LOGISTICS_RESERVATIONS'))
    assert.ok(DATA_SRC.includes('SHIPMENT_RECORDS'))
    assert.ok(DATA_SRC.includes('buildLogisticsSummary'))
    assert.ok(DATA_SRC.includes('loadLogisticsSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-logistics-mock'"))
  })
})
