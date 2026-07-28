import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'customers-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'customers-data.ts'), 'utf-8')

describe('Customers page structure', () => {
  it('page 应为最小 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export const dynamic = \'force-dynamic\''))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('export default async function CustomersPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCustomersSnapshot()'))
    assert.ok(PAGE_SRC.includes('<CustomersClient snapshot={snapshot} />'))
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
  })

  it('client 应保留筛选、分页与 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('状态筛选'))
    assert.ok(CLIENT_SRC.includes('会员等级筛选'))
  })

  it('data 应暴露 snapshot loader 与纯逻辑函数', () => {
    assert.ok(DATA_SRC.includes('export interface CustomersPageSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('computeCustomerStats'))
    assert.ok(DATA_SRC.includes('filterCustomers'))
    assert.ok(DATA_SRC.includes('loadCustomersSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'customers-api-live' | 'customers-local-snapshot'"))
  })
})
