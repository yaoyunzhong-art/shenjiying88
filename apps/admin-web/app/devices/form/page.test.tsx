import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'device-form-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'device-form-data.ts'), 'utf-8')

describe('devices/form E54 结构固证', () => {
  it('page 应为 server wrapper，并显式透出来源态证据', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadDeviceFormSnapshot()'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'devices:form:read'"))
    assert.ok(PAGE_SRC.includes('<DeviceFormShellClient snapshot={snapshot} />'))
  })

  it('client 应托管刷新按钮并承接 legacy 交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('<DeviceFormLegacy />'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
  })

  it('data 应定义 E54 snapshot 合同', () => {
    assert.ok(DATA_SRC.includes('export interface DeviceFormSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'devices-form-mock'"))
    assert.ok(DATA_SRC.includes('controlPlaneSource'))
    assert.ok(DATA_SRC.includes('refreshPath'))
    assert.ok(DATA_SRC.includes('note'))
  })
})
