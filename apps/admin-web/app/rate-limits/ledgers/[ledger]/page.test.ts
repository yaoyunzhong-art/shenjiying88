import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'rate-limits-ledger-detail-data.ts'), 'utf-8')

test('rate-limits/ledgers/[ledger]: 使用服务端 page + data + client 三层结构', () => {
  assert.ok(PAGE_SRC.includes('RateLimitsLedgerDetailClient'))
  assert.ok(PAGE_SRC.includes('loadRateLimitsLedgerDetailPageSnapshot'))
  assert.ok(DATA_SRC.includes('export async function loadRateLimitsLedgerDetailPageSnapshot'))
})
