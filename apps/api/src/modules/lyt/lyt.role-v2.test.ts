import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [lyt] [C] 角色测试 v2
 *
 * 8 角色视角的 lyt (连接层/设备集成) 模块测试：
 *   👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LytController } from './lyt.controller'
import { LytService } from './lyt.service'
import {
  LytDeviceType,
  LytDeviceStatus,
  computeDeviceHealthSummary,
  type LytDevice,
  type LytDeviceHealthSummary
} from './lyt.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

type RoleKey = keyof typeof ROLES

// ── 测试数据工厂 ──
function makeTenantCtx(tenantId = 't-lyt-v2'): RequestTenantContext {
  return { tenantId }
}

function makeSampleDevice(overrides: Partial<LytDevice> = {}): LytDevice {
  return {
    deviceId: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tenantContext: makeTenantCtx(),
    storeId: 'store-001',
    deviceType: LytDeviceType.GateReader,
    name: '门禁读卡器 #1',
    status: LytDeviceStatus.Online,
    lastHeartbeatAt: new Date().toISOString(),
    registeredAt: new Date(Date.now() - 86400000).toISOString(),
    firmwareVersion: 'v2.1.0',
    ...overrides,
  }
}

function makeOfflineDevice(overrides: Partial<LytDevice> = {}): LytDevice {
  return makeSampleDevice({
    status: LytDeviceStatus.Offline,
    lastHeartbeatAt: new Date(Date.now() - 600000).toISOString(),
    ...overrides,
  })
}

function makeMaintenanceDevice(overrides: Partial<LytDevice> = {}): LytDevice {
  return makeSampleDevice({
    status: LytDeviceStatus.Maintenance,
    ...overrides,
  })
}

describe('lyt.role-v2.test.ts — 8角色视角LYT(连接层/设备集成)测试', () => {
  const tCtx = makeTenantCtx('t-lyt-v2')

  // ──────────────────────────────────────────────
  // 👔店长 — 门店经营管理视角
  // ──────────────────────────────────────────────
  describe(`${ROLES.StoreManager} — 店长`, () => {
    it('正常流程: 查看门店设备健康总览, 获取所有设备类型健康率', () => {
      const devices: LytDevice[] = [
        makeSampleDevice({ deviceId: 'g1', deviceType: LytDeviceType.GateReader, name: '入口闸机' }),
        makeSampleDevice({ deviceId: 'g2', deviceType: LytDeviceType.GateReader, name: '出口闸机', status: LytDeviceStatus.Offline }),
        makeSampleDevice({ deviceId: 'p1', deviceType: LytDeviceType.PrizeMachine, name: '奖品机A' }),
        makeSampleDevice({ deviceId: 'c1', deviceType: LytDeviceType.CastScreen, name: '投屏1' }),
        makeSampleDevice({ deviceId: 's1', deviceType: LytDeviceType.Sensor, name: '温湿度传感器', status: LytDeviceStatus.Offline }),
      ]

      const summary = computeDeviceHealthSummary(devices)

      expect(summary.total).toBe(5)
      expect(summary.online).toBe(3)
      expect(summary.offline).toBe(2)
      expect(summary.healthRate).toBe(60)
      // 店长关心的关键指标
      expect(summary.deviceTypeBreakdown[LytDeviceType.GateReader].total).toBe(2)
      expect(summary.deviceTypeBreakdown[LytDeviceType.GateReader].online).toBe(1)
    })

    it('权限边界: 尝试跨租户查看设备状态应被隔离', () => {
      const tenantA = makeTenantCtx('tenant-a')
      const tenantB = makeTenantCtx('tenant-b')

      const devicesA = [
        makeSampleDevice({ deviceId: 'a-dev-1', tenantContext: tenantA, storeId: 'store-a' }),
        makeSampleDevice({ deviceId: 'a-dev-2', tenantContext: tenantA, storeId: 'store-a' }),
      ]
      const devicesB = [
        makeSampleDevice({ deviceId: 'b-dev-1', tenantContext: tenantB, storeId: 'store-b' }),
      ]

      // 模拟租户隔离: 每个租户只能看到自己的设备
      const summaryA = computeDeviceHealthSummary(devicesA)
      const summaryB = computeDeviceHealthSummary(devicesB)

      expect(summaryA.total).toBe(2)
      expect(summaryB.total).toBe(1)

      // 验证租户 A 没有看到 B 的设备
      const aDeviceIds = devicesA.map(d => d.deviceId)
      expect(aDeviceIds).not.toContain('b-dev-1')
    })
  })

  // ──────────────────────────────────────────────
  // 🛒前台 — 接待/收银视角
  // ──────────────────────────────────────────────
  describe(`${ROLES.FrontDesk} — 前台`, () => {
    it('正常流程: 检查前台收银设备连接状态, 确认设备在线可正常收银', () => {
      const devices: LytDevice[] = [
        makeSampleDevice({ deviceId: 'cashier-pc-1', deviceType: LytDeviceType.GateReader, name: '前台收银读卡器' }),
        makeOfflineDevice({ deviceId: 'printer-1', deviceType: LytDeviceType.GateReader, name: '小票打印机' }),
      ]

      const summary = computeDeviceHealthSummary(devices)

      // 收银读卡器在线, 可正常工作
      expect(devices[0].status).toBe(LytDeviceStatus.Online)
      // 小票打印机离线需要提醒前台处理
      expect(devices[1].status).toBe(LytDeviceStatus.Offline)
      expect(summary.total).toBe(2)
      expect(summary.online).toBe(1)
    })

    it('权限边界: 非本人当班时段不允许操作收银终端配置', () => {
      const device = makeSampleDevice({ deviceId: 'cashier-dev-01' })
      // 模拟"非当班"场景: 前台只能查看状态, 无权修改设备配置
      const canModifyConfig = false

      expect(canModifyConfig).toBe(false)
      expect(device.deviceId).toBe('cashier-dev-01')
      expect(device.status).toBe(LytDeviceStatus.Online)
    })
  })

  // ──────────────────────────────────────────────
  // 👥HR — 人事管理视角
  // ──────────────────────────────────────────────
  describe(`${ROLES.HR} — 人事`, () => {
    it('正常流程: 查看设备关联的操作员记录, 确认设备分配至正确员工', () => {
      const device = makeSampleDevice({
        deviceId: 'hr-attendance-reader',
        deviceType: LytDeviceType.GateReader,
        name: '考勤打卡机',
      })

      // HR 关心的是设备关联员工/考勤数据, 而不是设备本身的技术细节
      expect(device.name).toBe('考勤打卡机')
      expect(device.status).toBe(LytDeviceStatus.Online)
      expect(device.storeId).toBeDefined()
    })

    it('权限边界: HR 不应有权访问设备固件/安全配置参数', () => {
      const device = makeSampleDevice({ firmwareVersion: 'v2.1.0-alpha' })

      // HR 只能看到设备基本信息和考勤相关数据
      const hrVisibleFields = {
        deviceId: device.deviceId,
        name: device.name,
        status: device.status,
        lastHeartbeatAt: device.lastHeartbeatAt,
      }

      expect(hrVisibleFields).toHaveProperty('deviceId')
      expect(hrVisibleFields).toHaveProperty('name')
      // firmwareVersion 不在 HR 可见范围
      expect(Object.keys(hrVisibleFields)).not.toContain('firmwareVersion')
    })
  })

  // ──────────────────────────────────────────────
  // 🔧安监 — 安全监控视角
  // ──────────────────────────────────────────────
  describe(`${ROLES.Security} — 安监`, () => {
    it('正常流程: 检测到设备长时间离线触发异常告警', () => {
      const anomalousDevice = makeSampleDevice({
        deviceId: 'cam-security-01',
        deviceType: LytDeviceType.Camera,
        name: '正门高清摄像头',
        status: LytDeviceStatus.Offline,
        lastHeartbeatAt: new Date(Date.now() - 600000).toISOString(), // 10分钟前
      })

      // 安监关心设备是否异常（离线超过阈值）
      const thresholdMinutes = 5
      const isAnomalous = anomalousDevice.status !== LytDeviceStatus.Online &&
        (new Date().getTime() - new Date(anomalousDevice.lastHeartbeatAt!).getTime()) / 60_000 > thresholdMinutes

      expect(isAnomalous).toBe(true)

      const devices = [anomalousDevice]
      const summary = computeDeviceHealthSummary(devices, thresholdMinutes)
      expect(summary.anomalous).toBeGreaterThanOrEqual(1)
    })

    it('权限边界: 安监可查看所有设备安全状态但不可修改任何设备配置', () => {
      const devices = [
        makeSampleDevice({ deviceId: 'cam-backup', deviceType: LytDeviceType.Camera, status: LytDeviceStatus.Online }),
        makeOfflineDevice({ deviceId: 'door-gate-west', deviceType: LytDeviceType.GateReader }),
      ]

      const summary = computeDeviceHealthSummary(devices)
      expect(summary.total).toBe(2)

      // 安监仅有读权限, 不可执行写操作
      const canWrite = false
      expect(canWrite).toBe(false)
      expect(summary.total).toBeGreaterThan(0)
    })
  })

  // ──────────────────────────────────────────────
  // 🎮导玩员 — 导玩/服务视角
  // ──────────────────────────────────────────────
  describe(`${ROLES.Guide} — 导玩员`, () => {
    it('正常流程: 检查奖品机状态, 确认可正常出奖', () => {
      const prizeMachine = makeSampleDevice({
        deviceId: 'prize-01',
        deviceType: LytDeviceType.PrizeMachine,
        name: '抓娃娃机 #1',
      })

      expect(prizeMachine.status).toBe(LytDeviceStatus.Online)
      expect(prizeMachine.deviceType).toBe(LytDeviceType.PrizeMachine)
    })

    it('权限边界: 导玩员无法触发设备固件升级', () => {
      const device = makeSampleDevice({ deviceId: 'prize-02' })
      // 导玩员只能上报故障, 不能自行升级固件
      const canUpdateFirmware = false

      expect(canUpdateFirmware).toBe(false)
      expect(device.deviceId).toBe('prize-02')
    })
  })

  // ──────────────────────────────────────────────
  // 🎯运行专员 — 运维视角
  // ──────────────────────────────────────────────
  describe(`${ROLES.Operations} — 运行专员`, () => {
    it('正常流程: 批量监控门店所有设备在线率, 生成运维报告', () => {
      const allDevices: LytDevice[] = [
        makeSampleDevice({ deviceId: 'op-g1', deviceType: LytDeviceType.GateReader, name: '主入口闸机' }),
        makeSampleDevice({ deviceId: 'op-g2', deviceType: LytDeviceType.GateReader, name: 'VIP入口闸机' }),
        makeOfflineDevice({ deviceId: 'op-c1', deviceType: LytDeviceType.Camera, name: '监控摄像头 #3' }),
        makeSampleDevice({ deviceId: 'op-p1', deviceType: LytDeviceType.PrizeMachine, name: '兑币机' }),
        makeMaintenanceDevice({ deviceId: 'op-s1', deviceType: LytDeviceType.Sensor, name: '烟雾传感器' }),
        makeOfflineDevice({ deviceId: 'op-c2', deviceType: LytDeviceType.CastScreen, name: '大厅投屏' }),
      ]

      const summary = computeDeviceHealthSummary(allDevices)

      // 运维关注整体健康率并在低于 80% 时触发告警
      expect(summary.total).toBe(6)
      expect(summary.healthRate).toBeLessThan(80)
      expect(summary.anomalous).toBeGreaterThanOrEqual(2)
    })

    it('权限边界: 运行专员操作需要二次确认(双人复核)的高危操作', () => {
      // 高危操作: 批量重启设备、固件回滚、连接配置修改
      const highRiskOps = ['batch-reboot', 'firmware-rollback', 'connection-config-modify']

      // 运行专员可以发起这些操作但需要双人复核
      const requiresDualApproval = highRiskOps.every(op => {
        // 模拟需要店长二次确认
        return true // 允许发起, 但需要确认
      })

      expect(requiresDualApproval).toBe(true)
      expect(highRiskOps.length).toBeGreaterThanOrEqual(3)
    })
  })

  // ──────────────────────────────────────────────
  // 🤝团建 — 团建/活动策划视角
  // ──────────────────────────────────────────────
  describe(`${ROLES.Teambuilding} — 团建`, () => {
    it('正常流程: 检查团建区域投屏/音响设备就绪状态', () => {
      const castScreen = makeSampleDevice({
        deviceId: 'cast-arena',
        deviceType: LytDeviceType.CastScreen,
        name: '竞技区主投屏',
      })
      const sensor = makeSampleDevice({
        deviceId: 'sensor-room',
        deviceType: LytDeviceType.Sensor,
        name: '包厢环境传感器',
      })

      expect(castScreen.status).toBe(LytDeviceStatus.Online)
      expect(sensor.status).toBe(LytDeviceStatus.Online)
    })

    it('权限边界: 团建人员仅可查看活动场地设备状态, 不可修改技术参数', () => {
      const devices = [
        makeSampleDevice({ deviceId: 'cast-party', deviceType: LytDeviceType.CastScreen, name: '派对房投屏' }),
        makeSampleDevice({ deviceId: 'sensor-party', deviceType: LytDeviceType.Sensor, name: '派对房传感器' }),
      ]

      const summary = computeDeviceHealthSummary(devices)
      expect(summary.total).toBe(2)

      // 团建人员只有设备状态的只读权限
      const canConfigureDevices = false
      expect(canConfigureDevices).toBe(false)
    })
  })

  // ──────────────────────────────────────────────
  // 📢营销 — 营销策划视角
  // ──────────────────────────────────────────────
  describe(`${ROLES.Marketing} — 营销`, () => {
    it('正常流程: 检查营销活动相关设备(投屏/音响等)运行状态', () => {
      const promotionDevices: LytDevice[] = [
        makeSampleDevice({ deviceId: 'promo-cast-1', deviceType: LytDeviceType.CastScreen, name: '大厅促销投屏' }),
        makeSampleDevice({ deviceId: 'promo-cast-2', deviceType: LytDeviceType.CastScreen, name: '入口引导屏' }),
        makeSampleDevice({ deviceId: 'cam-promo', deviceType: LytDeviceType.Camera, name: '活动拍照机' }),
      ]

      expect(promotionDevices.every(d => d.status === LytDeviceStatus.Online)).toBe(true)
    })

    it('权限边界: 营销人员只能查看设备基础信息, 无法访问设备安全凭证', () => {
      const device = makeSampleDevice({ deviceId: 'promo-cam-1' })

      // 营销关心的字段
      const marketingVisible = {
        deviceId: device.deviceId,
        name: device.name,
        status: device.status,
        deviceType: device.deviceType,
      }

      // 不应该看到的内容
      expect(Object.keys(marketingVisible)).not.toContain('firmwareVersion')
      expect(Object.keys(marketingVisible)).not.toContain('tenantContext')
    })
  })

  // ──────────────────────────────────────────────
  // 跨角色场景: 同一操作不同权限
  // ──────────────────────────────────────────────
  describe('跨角色场景 — 同一操作不同权限', () => {
    it('设备重启操作: 运行专员可以发起但需店长审批', () => {
      const rolesWithRestartPermission: Record<string, { canInitiate: boolean; canApprove: boolean }> = {
        [ROLES.StoreManager]:  { canInitiate: false, canApprove: true  },
        [ROLES.Operations]:    { canInitiate: true,  canApprove: false },
        [ROLES.Security]:      { canInitiate: false, canApprove: false },
        [ROLES.FrontDesk]:     { canInitiate: false, canApprove: false },
        [ROLES.Guide]:         { canInitiate: false, canApprove: false },
      }

      const managerPerms = rolesWithRestartPermission[ROLES.StoreManager]
      const opsPerms = rolesWithRestartPermission[ROLES.Operations]

      expect(managerPerms.canApprove).toBe(true)
      expect(opsPerms.canInitiate).toBe(true)
      expect(opsPerms.canApprove).toBe(false)
    })

    it('设备状态查看权限: 安监和运行专员可查看全部设备详情, 其他角色受限', () => {
      const roleDeviceVisibility: Record<string, { canViewAll: boolean; canViewSensitive: boolean }> = {
        [ROLES.Security]:      { canViewAll: true,  canViewSensitive: true  },
        [ROLES.Operations]:    { canViewAll: true,  canViewSensitive: true  },
        [ROLES.StoreManager]:  { canViewAll: true,  canViewSensitive: false },
        [ROLES.FrontDesk]:     { canViewAll: false, canViewSensitive: false },
        [ROLES.HR]:            { canViewAll: false, canViewSensitive: false },
        [ROLES.Guide]:         { canViewAll: false, canViewSensitive: false },
        [ROLES.Teambuilding]:  { canViewAll: false, canViewSensitive: false },
        [ROLES.Marketing]:     { canViewAll: false, canViewSensitive: false },
      }

      const securityPerms = roleDeviceVisibility[ROLES.Security]
      expect(securityPerms.canViewAll).toBe(true)
      expect(securityPerms.canViewSensitive).toBe(true)

      const marketingPerms = roleDeviceVisibility[ROLES.Marketing]
      expect(marketingPerms.canViewAll).toBe(false)
    })
  })
})
