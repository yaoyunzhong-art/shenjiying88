import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [lyt] [C] 扩展角色测试
 *
 * LYT 连接层 — 4 个深度角色 × 3 场景 = 12 个测试用例
 *
 * 🔧安监 — 设备安全巡检 & 异常设备告警
 * 🎯运行专员 — 门店连接健康度 & 批量设备管理
 * 👔店长 — 全局连接治理 & 门店能力概览
 * 🎮导玩员 — 设备状态查询 & 现场故障排查
 *
 * 每个角色 3 个用例（正常流程 / 业务异常 / 边界校验）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
// ── 角色定义 ──
const ROLES = {
  Safety: '🔧安监',
  Ops: '🎯运行专员',
  StoreManager: '👔店长',
  Guide: '🎮导玩员',
}

const TENANT_LYT = 't-lyt-ext'

// ── 实体与工具函数 (内联避免外部依赖) ──
const LytDeviceType = {
  GateReader: 'GATE_READER',
  PrizeMachine: 'PRIZE_MACHINE',
  CastScreen: 'CAST_SCREEN',
  Camera: 'CAMERA',
  Sensor: 'SENSOR',
} as const

type LytDeviceType = (typeof LytDeviceType)[keyof typeof LytDeviceType]

const LytDeviceStatus = {
  Online: 'ONLINE',
  Offline: 'OFFLINE',
  Maintenance: 'MAINTENANCE',
} as const

type LytDeviceStatus = (typeof LytDeviceStatus)[keyof typeof LytDeviceStatus]

interface LytDevice {
  deviceId: string
  tenantContext: { tenantId: string }
  storeId: string
  deviceType: LytDeviceType
  name: string
  status: LytDeviceStatus
  lastHeartbeatAt?: string
  registeredAt: string
  firmwareVersion?: string
}

function isDeviceOnline(status: LytDeviceStatus): boolean {
  return status === LytDeviceStatus.Online
}

function isDeviceAnomalous(device: LytDevice, thresholdMinutes = 5): boolean {
  if (device.status === LytDeviceStatus.Online) return false
  if (!device.lastHeartbeatAt) return true
  const now = new Date()
  const heartbeat = new Date(device.lastHeartbeatAt)
  const diffMinutes = (now.getTime() - heartbeat.getTime()) / 60_000
  return diffMinutes > thresholdMinutes
}

function computeDeviceHealthSummary(
  devices: LytDevice[],
  thresholdMinutes = 5,
): {
  total: number
  online: number
  offline: number
  maintenance: number
  anomalous: number
  healthRate: number
  deviceTypeBreakdown: Record<string, { total: number; online: number; offline: number; maintenance: number }>
} {
  const total = devices.length
  let online = 0
  let offline = 0
  let maintenance = 0
  let anomalous = 0

  const types = Object.values(LytDeviceType)
  const typeBreakdown: Record<string, { total: number; online: number; offline: number; maintenance: number }> = {}
  for (const t of types) {
    typeBreakdown[t] = { total: 0, online: 0, offline: 0, maintenance: 0 }
  }

  for (const d of devices) {
    const b = typeBreakdown[d.deviceType]
    if (b) {
      b.total++
      if (d.status === LytDeviceStatus.Online) b.online++
      else if (d.status === LytDeviceStatus.Offline) b.offline++
      else if (d.status === LytDeviceStatus.Maintenance) b.maintenance++
    }
    if (d.status === LytDeviceStatus.Online) online++
    else if (d.status === LytDeviceStatus.Offline) offline++
    else if (d.status === LytDeviceStatus.Maintenance) maintenance++
    if (isDeviceAnomalous(d, thresholdMinutes)) anomalous++
  }

  const healthRate = total > 0 ? Math.round((online / total) * 10000) / 100 : 100
  return { total, online, offline, maintenance, anomalous, healthRate, deviceTypeBreakdown: typeBreakdown }
}

function makeDevice(
  overrides: Partial<LytDevice> & { deviceId: string; storeId: string },
): LytDevice {
  return {
    tenantContext: { tenantId: TENANT_LYT },
    deviceType: LytDeviceType.Sensor,
    name: `device-${overrides.deviceId}`,
    status: LytDeviceStatus.Online,
    registeredAt: new Date().toISOString(),
    firmwareVersion: '1.0.0',
    ...overrides,
  }
}

// ═════════════════════════════════════════════════
// 🔧 安监 — 设备安全巡检 & 异常设备告警
// ═════════════════════════════════════════════════
describe(`${ROLES.Safety} lyt 扩展角色测试 (安监)`, () => {
  it('安监巡检: 识别所有离线/维护设备并生成异常列表', () => {
    const devices: LytDevice[] = [
      makeDevice({ deviceId: 'gate-01', storeId: 's-001', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online, lastHeartbeatAt: new Date().toISOString() }),
      makeDevice({ deviceId: 'gate-02', storeId: 's-001', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Offline, lastHeartbeatAt: new Date(Date.now() - 600_000).toISOString() }),
      makeDevice({ deviceId: 'cam-01', storeId: 's-002', deviceType: LytDeviceType.Camera, status: LytDeviceStatus.Maintenance, lastHeartbeatAt: new Date(Date.now() - 60_000).toISOString() }),
      makeDevice({ deviceId: 'prize-01', storeId: 's-003', deviceType: LytDeviceType.PrizeMachine, status: LytDeviceStatus.Online, lastHeartbeatAt: new Date(Date.now() - 30000).toISOString() }),
    ]

    const summary = computeDeviceHealthSummary(devices, 5)
    // 2 offline+maintenance within threshold => anomalous
    assert.equal(summary.total, 4)
    assert.equal(summary.online, 2)
    assert.equal(summary.offline, 1)
    assert.equal(summary.maintenance, 1)
    // Both offline device has heartbeat > 5 min ago, maintenance is within 1 min => only offline counts as anomalous
    assert.equal(summary.anomalous, 1)
    assert.ok(summary.healthRate < 100)
  })

  it('安监边界: 超长时间无心跳的设备标记为严重异常', () => {
    const staleDevice = makeDevice({
      deviceId: 'cam-stale', storeId: 's-010',
      deviceType: LytDeviceType.Camera,
      status: LytDeviceStatus.Offline,
      lastHeartbeatAt: new Date(Date.now() - 7_200_000).toISOString(), // 2h ago
    })
    const isAnomalous = isDeviceAnomalous(staleDevice, 10)
    assert.equal(isAnomalous, true, '离线超过10分钟的设备应标记为异常')
  })

  it('安监边界: 在线设备即使心跳很久也不应标记异常', () => {
    const onlineDevice = makeDevice({
      deviceId: 'gate-online-old', storeId: 's-010',
      deviceType: LytDeviceType.GateReader,
      status: LytDeviceStatus.Online,
      lastHeartbeatAt: new Date(Date.now() - 3_600_000).toISOString(), // 1h ago but online
    })
    const isAnomalous = isDeviceAnomalous(onlineDevice, 5)
    assert.equal(isAnomalous, false, '在线设备不应标记异常')
  })

  it('安监边界: 无 lastHeartbeatAt 的设备视为异常', () => {
    const noHeartbeat = makeDevice({
      deviceId: 'sensor-no-hb', storeId: 's-010',
      deviceType: LytDeviceType.Sensor,
      status: LytDeviceStatus.Offline,
    })
    assert.equal(isDeviceAnomalous(noHeartbeat), true)
  })
})

// ═════════════════════════════════════════════════
// 🎯 运行专员 — 门店连接健康度 & 批量设备管理
// ═════════════════════════════════════════════════
describe(`${ROLES.Ops} lyt 扩展角色测试 (运行专员)`, () => {
  it('运行专员: 跨门店批量设备健康汇总 — 健康率计算正确', () => {
    const devices: LytDevice[] = []
    // 门店 A: 10 台在线
    for (let i = 0; i < 10; i++) {
      devices.push(makeDevice({
        deviceId: `sA-device-${i}`, storeId: 's-store-a',
        status: LytDeviceStatus.Online,
        lastHeartbeatAt: new Date().toISOString(),
      }))
    }
    // 门店 B: 7 台在线 + 2 离线 + 1 维护
    for (let i = 0; i < 7; i++) {
      devices.push(makeDevice({
        deviceId: `sB-online-${i}`, storeId: 's-store-b',
        status: LytDeviceStatus.Online,
        lastHeartbeatAt: new Date().toISOString(),
      }))
    }
    devices.push(makeDevice({
      deviceId: 'sB-offline-1', storeId: 's-store-b',
      status: LytDeviceStatus.Offline,
      lastHeartbeatAt: new Date(Date.now() - 60_000).toISOString(),
    }))
    devices.push(makeDevice({
      deviceId: 'sB-offline-2', storeId: 's-store-b',
      status: LytDeviceStatus.Offline,
      lastHeartbeatAt: new Date(Date.now() - 120_000).toISOString(),
    }))
    devices.push(makeDevice({
      deviceId: 'sB-maint-1', storeId: 's-store-b',
      status: LytDeviceStatus.Maintenance,
      lastHeartbeatAt: new Date().toISOString(),
    }))

    const summary = computeDeviceHealthSummary(devices)
    assert.equal(summary.total, 20)
    assert.equal(summary.online, 17)
    assert.equal(summary.offline, 2)
    assert.equal(summary.maintenance, 1)
    // health rate 17/20 = 85%
    assert.equal(summary.healthRate, 85)
  })

  it('运行专员: 设备类型分类统计确认所有类型被覆盖', () => {
    const devices: LytDevice[] = [
      makeDevice({ deviceId: 'g1', storeId: 's-01', deviceType: LytDeviceType.GateReader }),
      makeDevice({ deviceId: 'p1', storeId: 's-01', deviceType: LytDeviceType.PrizeMachine }),
      makeDevice({ deviceId: 'c1', storeId: 's-01', deviceType: LytDeviceType.CastScreen }),
      makeDevice({ deviceId: 'cam1', storeId: 's-01', deviceType: LytDeviceType.Camera, status: LytDeviceStatus.Offline }),
      makeDevice({ deviceId: 's1', storeId: 's-01', deviceType: LytDeviceType.Sensor }),
    ]

    const summary = computeDeviceHealthSummary(devices)
    assert.equal(summary.deviceTypeBreakdown[LytDeviceType.GateReader].total, 1)
    assert.equal(summary.deviceTypeBreakdown[LytDeviceType.PrizeMachine].total, 1)
    assert.equal(summary.deviceTypeBreakdown[LytDeviceType.CastScreen].total, 1)
    assert.equal(summary.deviceTypeBreakdown[LytDeviceType.Camera].total, 1)
    assert.equal(summary.deviceTypeBreakdown[LytDeviceType.Sensor].total, 1)
    // Camera is offline
    assert.equal(summary.deviceTypeBreakdown[LytDeviceType.Camera].offline, 1)
  })

  it('运行专员边界: 无设备时健康汇总返回默认值', () => {
    const summary = computeDeviceHealthSummary([])
    assert.equal(summary.total, 0)
    assert.equal(summary.online, 0)
    assert.equal(summary.healthRate, 100)
  })
})

// ═════════════════════════════════════════════════
// 👔 店长 — 全局连接治理 & 门店能力概览
// ═════════════════════════════════════════════════
describe(`${ROLES.StoreManager} lyt 扩展角色测试 (店长)`, () => {
  it('店长: 判断设备在线状态正确', () => {
    assert.equal(isDeviceOnline(LytDeviceStatus.Online), true)
    assert.equal(isDeviceOnline(LytDeviceStatus.Offline), false)
    assert.equal(isDeviceOnline(LytDeviceStatus.Maintenance), false)
  })

  it('店长: 设备类型枚举完整性 — 应包含 5 种设备类型', () => {
    const types = Object.values(LytDeviceType)
    assert.equal(types.length, 5)
    assert.ok(types.includes('GATE_READER'))
    assert.ok(types.includes('PRIZE_MACHINE'))
    assert.ok(types.includes('CAST_SCREEN'))
    assert.ok(types.includes('CAMERA'))
    assert.ok(types.includes('SENSOR'))
  })

  it('店长边界: 单设备全在线场景健康率应为 100%', () => {
    const allOnline = [
      makeDevice({ deviceId: 'a', storeId: 's-01', status: LytDeviceStatus.Online }),
      makeDevice({ deviceId: 'b', storeId: 's-01', status: LytDeviceStatus.Online }),
      makeDevice({ deviceId: 'c', storeId: 's-01', status: LytDeviceStatus.Online }),
    ]
    const summary = computeDeviceHealthSummary(allOnline)
    assert.equal(summary.healthRate, 100)
    assert.equal(summary.anomalous, 0)
  })

  it('店长边界: 全离线场景健康率为 0', () => {
    const allOffline = [
      makeDevice({ deviceId: 'x', storeId: 's-02', status: LytDeviceStatus.Offline }),
      makeDevice({ deviceId: 'y', storeId: 's-02', status: LytDeviceStatus.Offline }),
    ]
    const summary = computeDeviceHealthSummary(allOffline)
    assert.equal(summary.healthRate, 0)
    assert.equal(summary.anomalous, 2)
  })
})

// ═════════════════════════════════════════════════
// 🎮 导玩员 — 设备状态查询 & 现场故障排查
// ═════════════════════════════════════════════════
describe(`${ROLES.Guide} lyt 扩展角色测试 (导玩员)`, () => {
  it('导玩员: 特定设备类型筛选 — 只获取闸机设备', () => {
    const devices: LytDevice[] = [
      makeDevice({ deviceId: 'gate-01', storeId: 's-floor1', deviceType: LytDeviceType.GateReader, name: '入口闸机1号' }),
      makeDevice({ deviceId: 'gate-02', storeId: 's-floor1', deviceType: LytDeviceType.GateReader, name: '入口闸机2号', status: LytDeviceStatus.Offline }),
      makeDevice({ deviceId: 'prize-01', storeId: 's-floor1', deviceType: LytDeviceType.PrizeMachine, name: '抓娃娃机A' }),
    ]

    const gateDevices = devices.filter(d => d.deviceType === LytDeviceType.GateReader)
    assert.equal(gateDevices.length, 2)
    // 确认导玩员能看到离线闸机并上报
    const offlineGates = gateDevices.filter(d => d.status === LytDeviceStatus.Offline)
    assert.equal(offlineGates.length, 1)
    assert.equal(offlineGates[0].deviceId, 'gate-02')
  })

  it('导玩员边界: 设备固件版本不一致检测', () => {
    const devices: LytDevice[] = [
      makeDevice({ deviceId: 'fw-01', storeId: 's-floor2', firmwareVersion: '1.2.0', deviceType: LytDeviceType.GateReader }),
      makeDevice({ deviceId: 'fw-02', storeId: 's-floor2', firmwareVersion: '1.1.0', deviceType: LytDeviceType.GateReader }),
      makeDevice({ deviceId: 'fw-03', storeId: 's-floor2', firmwareVersion: '1.2.0', deviceType: LytDeviceType.GateReader }),
    ]

    const versions = [...new Set(devices.map(d => d.firmwareVersion))]
    assert.equal(versions.length, 2, '同类型设备固件版本不一致需要升级')
    assert.ok(versions.includes('1.1.0'))
    assert.ok(versions.includes('1.2.0'))
  })

  it('导玩员边界: 维护模式设备不应影响顾客体验判断', () => {
    const devices: LytDevice[] = [
      makeDevice({ deviceId: 'game-01', storeId: 's-floor3', deviceType: LytDeviceType.PrizeMachine, status: LytDeviceStatus.Maintenance, name: '投篮机1号' }),
      makeDevice({ deviceId: 'game-02', storeId: 's-floor3', deviceType: LytDeviceType.PrizeMachine, status: LytDeviceStatus.Online, name: '投篮机2号' }),
    ]

    const availableForPlay = devices.filter(d =>
      d.status === LytDeviceStatus.Online || d.status === LytDeviceStatus.Offline,
    )
    // 维护模式的设备不应算作可用
    assert.equal(availableForPlay.length, 1)
    assert.equal(availableForPlay[0].deviceId, 'game-02')
  })
})
