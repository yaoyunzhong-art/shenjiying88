import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'shift-handover-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'shift-handover-data.ts'), 'utf-8')

describe('stores/[id]/shift-handover/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载交接班快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function ShiftHandoverPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadShiftHandoverSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<ShiftHandoverClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"))
  })
})

describe('stores/[id]/shift-handover/client 结构固证', () => {
  it('client 应保留筛选、发起交接与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('setShowStart'))
    assert.ok(CLIENT_SRC.includes('开始交接'))
    assert.ok(CLIENT_SRC.includes('交接规则'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
  })
})

describe('stores/[id]/shift-handover/data 结构固证', () => {
  it('data 应定义交接班快照合同与样本数据', () => {
    assert.ok(DATA_SRC.includes('export interface ShiftHandoverSnapshot'))
    assert.ok(DATA_SRC.includes('HANDOVER_RECORDS'))
    assert.ok(DATA_SRC.includes('HANDOVER_RULES'))
    assert.ok(DATA_SRC.includes('buildShiftHandoverSummary'))
    assert.ok(DATA_SRC.includes('loadShiftHandoverSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-shift-handover-mock'"))
  })
})
