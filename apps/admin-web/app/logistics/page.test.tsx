import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./logistics-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./logistics-client.tsx', import.meta.url), 'utf8')

describe('logistics 页面结构固证', () => {
  it('page 为 server wrapper 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function LogisticsPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadLogisticsSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('page 显式展示来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'logistics:read'"))
  })
})

describe('logistics snapshot loader 固证', () => {
  it('data 文件定义 fallback 快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface LogisticsSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-logistics-snapshot'"))
    assert.ok(DATA_SRC.includes('export async function loadLogisticsSnapshot()'))
  })

  it('data 文件保留订单样本、状态映射和过滤统计逻辑', () => {
    assert.ok(DATA_SRC.includes('LOGISTICS_ORDERS'))
    assert.ok(DATA_SRC.includes('LOGISTICS_STATUS_LABEL'))
    assert.ok(DATA_SRC.includes('LOGISTICS_URGENCY_LABEL'))
    assert.ok(DATA_SRC.includes('LOG-2026-0001'))
    assert.ok(DATA_SRC.includes('filterLogisticsOrders'))
    assert.ok(DATA_SRC.includes('computeLogisticsStats'))
  })
})

describe('logistics client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('client 文件保留状态筛选、订单表格和详情卡', () => {
    assert.ok(CLIENT_SRC.includes('activeStatus'))
    assert.ok(CLIENT_SRC.includes('searchText'))
    assert.ok(CLIENT_SRC.includes('配送订单列表'))
    assert.ok(CLIENT_SRC.includes('filteredOrders.map'))
    assert.ok(CLIENT_SRC.includes('配送详情'))
  })
})
