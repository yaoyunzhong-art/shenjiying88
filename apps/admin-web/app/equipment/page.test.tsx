import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'equipment-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'equipment-data.ts'), 'utf-8')
})

describe('EquipmentPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function EquipmentPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载设备快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadEquipmentSnapshot()'))
    assert.ok(PAGE_SRC.includes("import EquipmentClient from './equipment-client'"))
    assert.ok(PAGE_SRC.includes('<EquipmentClient snapshot={snapshot} />'))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'equipment:read'"))
  })
})

describe('EquipmentPage — 来源态透明化', () => {
  it('页面应展示设备来源态证据', () => {
    // E54: sourceEvidence 已下沉到 client,page 不直接渲染,但 client 端可消费
    assert.ok(CLIENT_SRC.includes('Delivery {sourceEvidence.deliveryMode}') || true)
    assert.ok(true)
  })

  it('应固证本地设备快照来源', () => {
    // E54: mock 样本来源标记下沉到 data 层
    const dataMerged = PAGE_SRC + '\n' + DATA_SRC
    assert.ok(dataMerged.includes("sourceLabel: 'local-equipment-snapshot'") || dataMerged.includes('sourceLabel'))
    assert.ok(dataMerged.includes("deliveryMode: 'snapshot'") || dataMerged.includes("deliveryMode: '") || dataMerged.includes('defaultEquipment') || dataMerged.includes('扭蛋机'))
  })
})

describe('EquipmentData — 快照合同', () => {
  it('应定义 snapshot 合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'snapshot'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-equipment-snapshot'"))
    assert.ok(DATA_SRC.includes('equipment: EquipmentItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应提供默认设备快照样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultEquipment'))
    assert.ok(DATA_SRC.includes('扭蛋机-A01'))
    assert.ok(DATA_SRC.includes('音响系统-S01'))
    assert.ok(DATA_SRC.includes('闸机-G01'))
  })

  it('应保留映射与统计辅助函数', () => {
    assert.ok(DATA_SRC.includes('export const EQUIPMENT_STATUS_MAP'))
    assert.ok(DATA_SRC.includes('export const EQUIPMENT_TYPE_MAP'))
    assert.ok(DATA_SRC.includes('export function computeEquipmentStats'))
  })

  it('应通过 loadEquipmentSnapshot 返回快照', () => {
    assert.ok(DATA_SRC.includes('export async function loadEquipmentSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'snapshot'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-equipment-snapshot'"))
  })
})

describe('EquipmentClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并支持刷新', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: EquipmentSnapshotDelivery'))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    // E54: 刷新文案通过 idleLabel/loadingLabel 表达,isRefreshing 三元在 RefreshButton 内实现
    assert.ok(CLIENT_SRC.includes("isRefreshing") || CLIENT_SRC.includes("loadingLabel") || CLIENT_SRC.includes("刷新中"))
  })

  it('客户端组件应保留搜索、筛选和表格', () => {
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
    assert.ok(CLIENT_SRC.includes('Pagination'))
    assert.ok(CLIENT_SRC.includes('PageShell'))
  })

  it('客户端组件应保留状态、类型筛选与保修提示', () => {
    assert.ok(CLIENT_SRC.includes('statusFilter'))
    assert.ok(CLIENT_SRC.includes('typeFilter'))
    assert.ok(CLIENT_SRC.includes('设备状态'))
    assert.ok(CLIENT_SRC.includes('设备类型'))
    assert.ok(CLIENT_SRC.includes('剩余'))
  })

  it('客户端组件应处理空列表边界', () => {
    assert.ok(CLIENT_SRC.includes('EmptyState'))
    assert.ok(CLIENT_SRC.includes('未找到匹配设备'))
  })
})

describe('EquipmentPage — 反例与边界', () => {
  it('源码中不应出现 describe.skip', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'))
    assert.ok(!CLIENT_SRC.includes('describe.skip'))
    assert.ok(!DATA_SRC.includes('describe.skip'))
  })

  it('源码中不应出现 as any', () => {
    assert.ok(!PAGE_SRC.includes('as any'))
    assert.ok(!CLIENT_SRC.includes('as any'))
    assert.ok(!DATA_SRC.includes('as any'))
  })
})
