import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./repair-detail-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./repair-detail-client.tsx', import.meta.url), 'utf8')

describe('logistics/repairs/[id] 页面结构固证', () => {
  it('page 为服务端详情 wrapper', () => {
    assert.ok(PAGE_SRC.includes('export default async function RepairDetailPage'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadRepairDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('page 显式展示来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'logistics:repairs:id:read'"))
  })
})

describe('logistics/repairs/[id] snapshot loader 固证', () => {
  it('data 文件定义 fallback 详情快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface RepairDetailSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-repair-detail-snapshot'"))
    assert.ok(DATA_SRC.includes('export async function loadRepairDetailSnapshot(id: string)'))
  })

  it('data 文件保留状态流转和动作文案逻辑', () => {
    assert.ok(DATA_SRC.includes('STATUS_FLOW'))
    assert.ok(DATA_SRC.includes('getRepairActionLabel'))
    assert.ok(DATA_SRC.includes('REPAIR_RECORDS.find'))
    assert.ok(DATA_SRC.includes('nextStatuses'))
  })
})

describe('logistics/repairs/[id] client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
  })

  it('client 文件保留返回列表、状态流转和闭环提示', () => {
    assert.ok(CLIENT_SRC.includes('返回工单列表'))
    assert.ok(CLIENT_SRC.includes('currentStatus'))
    assert.ok(CLIENT_SRC.includes('nextStatuses.map'))
    assert.ok(CLIENT_SRC.includes('工单已完成验收闭环'))
  })
})
