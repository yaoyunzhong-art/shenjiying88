import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'license-renewal-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'license-renewal-client.tsx'), 'utf-8')

describe('LicenseRenewalPage structure', () => {
  it('应为 async server component 并加载快照', () => {
    assert.match(PAGE_SRC, /export default async function LicenseRenewalPage/)
    assert.ok(PAGE_SRC.includes('loadLicenseRenewalSnapshot'))
    assert.ok(PAGE_SRC.includes("import LicenseRenewalClient from './license-renewal-client'"))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('数据层应保留来源态与 mock 合同', () => {
    assert.ok(DATA_SRC.includes('deliveryMode: \'mock\''))
    assert.ok(DATA_SRC.includes('controlPlaneSource'))
    assert.ok(DATA_SRC.includes('businessDataSource'))
    assert.ok(DATA_SRC.includes('reminderTimeline: REMINDER_TIMELINE'))
  })

  it('客户端层应保留刷新、tab 与本地交互', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('handleSaveStrategy'))
    assert.ok(CLIENT_SRC.includes('handleToggleStrategy'))
    assert.ok(CLIENT_SRC.includes('handleToggleAutoRenewal'))
  })
})
