import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'crm-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'crm-data.ts'), 'utf-8')
})

describe('crm/page.test — 结构固证', () => {
  it('服务端壳层应存在', () => {
    assert.ok(PAGE_SRC.includes('export default async function CrmPage()'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCrmSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
  })

  it('来源态证据应完整透出', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('loadCrmSnapshot -> crm/customers + crm/stats'))
    assert.ok(PAGE_SRC.includes('loadCrmSnapshot -> MOCK_CRM_CUSTOMERS / MOCK_CRM_STATS fallback'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('客户端展示层应承接交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot: CrmSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('DetailDialog'))
    assert.ok(CLIENT_SRC.includes('filterCustomers('))
  })

  it('快照 loader 应包含 fallback 合同', () => {
    assert.ok(DATA_SRC.includes('export interface CrmSnapshotDelivery'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('CRM 实时接口不可达，已切换到 fallback 样本数据。'))
  })
})
