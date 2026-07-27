import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'devices-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'devices-data.ts'), 'utf-8')

describe('stores/[id]/devices/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载设备快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function DevicesPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadDevicesSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<DevicesClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"))
  })
})

describe('stores/[id]/devices data/client 结构固证', () => {
  it('snapshot loader 应固化设备快照合同、状态映射与统计函数', () => {
    assert.ok(DATA_SRC.includes('export interface DevicesSnapshot'))
    assert.ok(DATA_SRC.includes('DEVICE_STATUS_META'))
    assert.ok(DATA_SRC.includes('STORE_DEVICES'))
    assert.ok(DATA_SRC.includes('buildDevicesSummary'))
    assert.ok(DATA_SRC.includes('loadDevicesSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-devices-fallback'"))
  })

  it('client renderer 应承载筛选、维护动作与 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('filteredDevices'))
    assert.ok(CLIENT_SRC.includes('snapshot.maintenanceLogs'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('setShowMaint'))
    assert.ok(CLIENT_SRC.includes('添加设备'))
  })
})
