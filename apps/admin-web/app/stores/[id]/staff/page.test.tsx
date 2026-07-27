import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'staff-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'staff-data.ts'), 'utf-8')

describe('stores/[id]/staff/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载员工快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function StaffPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadStaffSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<StaffClient snapshot={snapshot} />'))
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

describe('stores/[id]/staff/client 结构固证', () => {
  it('client 应保留筛选、详情、建档与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('setShowAdd'))
    assert.ok(CLIENT_SRC.includes('setDetailEmployee'))
    assert.ok(CLIENT_SRC.includes('导出排班表'))
    assert.ok(CLIENT_SRC.includes('员工详情'))
  })
})

describe('stores/[id]/staff/data 结构固证', () => {
  it('data 应定义员工快照合同与样本数据', () => {
    assert.ok(DATA_SRC.includes('export interface StaffSnapshot'))
    assert.ok(DATA_SRC.includes('STAFF_EMPLOYEES'))
    assert.ok(DATA_SRC.includes('buildRoleDistribution'))
    assert.ok(DATA_SRC.includes('buildTodaySchedule'))
    assert.ok(DATA_SRC.includes('loadStaffSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-staff-mock'"))
  })
})
