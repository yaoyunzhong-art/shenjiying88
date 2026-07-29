import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'license-renewal-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'license-renewal-client.tsx'), 'utf-8')

describe('license-renewal page', () => {
  it('page 已迁移为 E54 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("import { loadLicenseRenewalSnapshot } from './license-renewal-data'"))
    assert.ok(PAGE_SRC.includes('<LicenseRenewalClient snapshot={snapshot} />'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'license-renewal:read'"))
  })

  it('data 固证 mock 来源与快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface LicenseRenewalSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'license-renewal-mock'"))
    assert.ok(DATA_SRC.includes('statistics: buildStatistics(STRATEGIES, RECORDS)'))
    assert.ok(DATA_SRC.includes('licenseHealth: buildLicenseHealth(RECORDS)'))
  })

  it('client 保留交互与刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
    assert.ok(CLIENT_SRC.includes('创建套餐'))
    assert.ok(CLIENT_SRC.includes('handleToggleAutoRenewal'))
  })
})
