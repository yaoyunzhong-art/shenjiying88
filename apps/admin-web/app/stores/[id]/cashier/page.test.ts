import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const DATA_SRC = readFileSync(resolve(DIR, 'cashier-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'cashier-client.tsx'), 'utf-8')

describe('stores/[id]/cashier data/client 结构固证', () => {
  it('snapshot loader 应固化收银快照合同、诊断与回退检索链路', () => {
    assert.ok(DATA_SRC.includes('export interface CashierSnapshot'))
    assert.ok(DATA_SRC.includes('export interface MemberProfile'))
    assert.ok(DATA_SRC.includes('searchMember'))
    assert.ok(DATA_SRC.includes('fetchConsumptionHistory'))
    assert.ok(DATA_SRC.includes('getBizClient'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-cashier-fallback'"))
  })

  it('client renderer 应承载检索、消费记录与 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('CashierPanel'))
    assert.ok(CLIENT_SRC.includes('handleSearch'))
    assert.ok(CLIENT_SRC.includes('fetchConsumptionHistory'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('收银结账'))
  })
})
