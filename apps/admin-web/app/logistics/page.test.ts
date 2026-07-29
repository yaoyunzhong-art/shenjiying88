import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./logistics-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./logistics-client.tsx', import.meta.url), 'utf8')

test('logistics page.test.ts 补充固证: page 为服务端 wrapper', () => {
  assert.ok(PAGE_SRC.includes('export default async function LogisticsPage'))
  assert.ok(PAGE_SRC.includes('const snapshot = await loadLogisticsSnapshot()'))
  assert.ok(!PAGE_SRC.includes("'use client'"))
})

test('logistics page.test.ts 补充固证: data 保留快照合同和样本', () => {
  assert.ok(DATA_SRC.includes("sourceLabel: 'local-logistics-snapshot'"))
  assert.ok(DATA_SRC.includes('LOGISTICS_ORDERS'))
  assert.ok(DATA_SRC.includes('LOGISTICS_STATUS_LABEL'))
  assert.ok(DATA_SRC.includes('LOGISTICS_URGENCY_LABEL'))
})

test('logistics page.test.ts 补充固证: client 保留刷新、筛选和详情', () => {
  assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  assert.ok(CLIENT_SRC.includes('activeStatus'))
  assert.ok(CLIENT_SRC.includes('配送订单列表'))
  assert.ok(CLIENT_SRC.includes('配送详情'))
})
