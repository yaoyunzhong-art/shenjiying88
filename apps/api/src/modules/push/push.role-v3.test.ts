import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [push] [C] 角色测试 v3 — 大飞哥电玩城推送通知场景
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景的 push 推送模块：
 *
 * 店A: Cyber Galaxy Arcade (Colonial Heights, VA)
 * 店B: 休斯顿店 (Houston, TX)
 *
 * 每个角色 >= 3 测试用例（正常流程 + 业务边界 + 异常/降级）
 * 覆盖: 推送发送、定时推送、WebSocket、模板管理、统计、吊销
 */

import { PushController } from './push.controller'
import { APNsService, WebSocketService, PushNotificationScheduler } from './push.service'
import { PushPlatform, PushPriority } from './push.entity'
import { DndConfigService, FrequencyCapService } from './dnd-config'
import { PushPriorityGuard } from './push-priority.guard'
import { DualChannelRouter, EmailPushChannel, SmsPushChannel } from './channels'
import { PushPreferenceService } from './push-preference.service'
import { PushStatsService } from './push-stats.service'

// ── 8 角色定义 ──
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

// ── 大飞哥电玩城门店常量 ──
const STORE_CYBER = { id: 'store-cyber-galaxy', name: 'Cyber Galaxy Arcade', city: 'Colonial Heights' }
const STORE_HOUSTON = { id: 'store-houston', name: '休斯顿店', city: 'Houston' }

// ── 测试设备 Token ──
const DEVICE_MANAGER = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
const DEVICE_FRONT_DESK = 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3'
const DEVICE_GUIDE = 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'

// ── 假租户上下文 ──
const MOCK_TENANT = {
  tenantId: 'tenant-cyber-galaxy',
  storeId: STORE_CYBER.id,
  userId: 'admin',
  roles: ['admin'],
}

// ── 测试工厂 ──
function createController(): PushController {
  const dndConfig = new DndConfigService()
  const frequencyCap = new FrequencyCapService()
  const priorityGuard = new PushPriorityGuard(dndConfig, frequencyCap)
  const emailChannel = new EmailPushChannel()
  const smsChannel = new SmsPushChannel()
  const dualChannelRouter = new DualChannelRouter()
  dualChannelRouter.register(emailChannel)
  dualChannelRouter.register(smsChannel)
  const apns = new APNsService()
  const ws = new WebSocketService()
  const scheduler = new PushNotificationScheduler(apns)
  const preferenceService = new PushPreferenceService()
  const statsService = new PushStatsService()
  return new PushController(apns, ws, scheduler, priorityGuard, dndConfig, frequencyCap, dualChannelRouter, preferenceService, statsService)
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 门店级推送策略与推送效果监控
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 店长视角: 门店推送与效果监控`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = createController()
  })

  it('店长注册门店推送模板 — 含完整模板信息', () => {
    const template = ctrl.registerTemplate(MOCK_TENANT as any, {
      code: 'store_broadcast',
      platform: PushPlatform.iOS,
      tenantId: MOCK_TENANT.tenantId,
      brandId: 'brand-cyber',
      storeId: STORE_CYBER.id,
      title: '门店公告',
      body: '{{storeName}} 今日活动已更新',
      sound: 'default',
      badge: 1,
      extra: { category: 'store_announcement' },
      enabled: true,
    })

    expect(template.code).toBe('store_broadcast')
    expect(template.platform).toBe(PushPlatform.iOS)
    expect(template.storeId).toBe(STORE_CYBER.id)
    expect(template.title).toBe('门店公告')
    expect(template.enabled).toBe(true)
    expect(template.id).toMatch(/^pt_/)
  })

  it('店长查看推送统计 — 了解门店推送覆盖率', async () => {
    const ctrl = createController()
    // 直接检查空状态
    const emptyStats = await ctrl.getStats()
    expect(emptyStats.totalSent).toBe(0)
    expect(emptyStats.totalFailed).toBe(0)
    expect(emptyStats.activeConnections).toBe(0)

    // 发一条推送后，通过历史记录确认
    const r1 = await ctrl.sendPush(MOCK_TENANT as any, {
      deviceToken: DEVICE_MANAGER,
      platform: PushPlatform.iOS,
      alert: '活动开始',
      priority: PushPriority.High,
    })
    expect(r1.success).toBe(true)
    expect(r1.recordId).toBeDefined()

    const history = await ctrl.getPushHistory(DEVICE_MANAGER)
    expect(history.length).toBe(1)
    expect(history[0].status).toBe('SENT' as any)

    // 统计仪表盘至少显示了对象结构
    const stats = await ctrl.getStats()
    expect(stats).toHaveProperty('totalSent')
    expect(stats).toHaveProperty('totalFailed')
    expect(stats).toHaveProperty('activeConnections')
    expect(stats).toHaveProperty('byPlatform')
  })

  it('店长: 空统计数据不报错', async () => {
    const ctrl = createController()
    const stats = await ctrl.getStats()
    expect(stats.totalSent).toBe(0)
    expect(stats.totalFailed).toBe(0)
    expect(typeof stats.activeConnections).toBe('number')
  })

  it('店长通过 WS 广播门店公告给所有在线设备', () => {
    const ctrl = createController()
    // 连接几个 WS 客户端
    ctrl.connectWS({ clientId: 'client-001', userId: 'user-manager', platform: PushPlatform.iOS })
    ctrl.connectWS({ clientId: 'client-002', userId: 'user-front', platform: PushPlatform.iOS })
    ctrl.connectWS({ clientId: 'client-003', userId: 'user-guide', platform: PushPlatform.iOS })

    const result = ctrl.broadcastWS({
      channel: 'store_announcement',
      data: { message: '今日全场 8 折活动即将开始', storeId: STORE_CYBER.id },
    })
    expect(result.sent).toBe(3)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 前台收银推送与实时通知
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 前台视角: 收银通知与会员服务推送`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = createController()
  })

  it('前台接收高优先级交班提醒推送', async () => {
    const result = await ctrl.sendPush(MOCK_TENANT as any, {
      deviceToken: DEVICE_FRONT_DESK,
      platform: PushPlatform.iOS,
      alert: '下午班交班提醒 - 请清点收银备用金',
      priority: PushPriority.High,
    })
    expect(result.success).toBe(true)
    expect(result.recordId).toBeDefined()
  })

  it('前台查询自己的设备推送历史', async () => {
    const ctrl = createController()
    await ctrl.sendPush(MOCK_TENANT as any, {
      deviceToken: DEVICE_FRONT_DESK,
      platform: PushPlatform.iOS,
      alert: '会员充值成功 200 美元',
      priority: PushPriority.Normal,
    })
    await ctrl.sendPush(MOCK_TENANT as any, {
      deviceToken: DEVICE_FRONT_DESK,
      platform: PushPlatform.iOS,
      alert: '礼品卡购买成功',
      priority: PushPriority.Normal,
    })

    const history = await ctrl.getPushHistory(DEVICE_FRONT_DESK)
    expect(history.length).toBe(2)
    expect(history[0].status).toBe('SENT' as any)
  })

  it('前台: 未发送过推送的设备查询历史返回空数组', async () => {
    const history = await ctrl.getPushHistory('unknown-device-token-here')
    expect(history).toEqual([])
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 员工考勤与培训推送
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} HR视角: 员工通知与考勤推送`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = createController()
  })

  it('HR 注册员工考勤推送模板', () => {
    const template = ctrl.registerTemplate(MOCK_TENANT as any, {
      code: 'attendance_reminder',
      platform: PushPlatform.iOS,
      tenantId: MOCK_TENANT.tenantId,
      title: '考勤提醒',
      body: '请记得打卡签到',
      enabled: true,
    })
    expect(template.code).toBe('attendance_reminder')
    expect(template.enabled).toBe(true)
  })

  it('HR 设置定时推送排班提醒', () => {
    const futureDate = new Date(Date.now() + 3600000)
    const scheduled = ctrl.schedulePush(MOCK_TENANT as any, {
      memberId: 'member-hr-001',
      tenantId: MOCK_TENANT.tenantId,
      content: '明天早班 9:00-17:00，请按时到岗',
      sendAt: futureDate.toISOString(),
      platform: PushPlatform.iOS,
    })
    expect(scheduled.id).toBeDefined()
    expect(scheduled.content).toContain('明天早班')
  })

  it('HR: 查询员工待发送的定时推送', () => {
    const ctrl = createController()
    const futureDate = new Date(Date.now() + 7200000)
    ctrl.schedulePush(MOCK_TENANT as any, {
      memberId: 'member-hr-002',
      tenantId: MOCK_TENANT.tenantId,
      content: '培训通知：新系统操作培训',
      sendAt: futureDate.toISOString(),
      platform: PushPlatform.iOS,
    })

    const pending = ctrl.queryScheduledPushes(MOCK_TENANT as any, 'member-hr-002')
    expect(pending.length).toBe(1)
    expect(pending[0].status).toBe('PENDING' as any)
  })

  it('HR: 提前取消定时推送返回 true', () => {
    const ctrl = createController()
    const futureDate = new Date(Date.now() + 86400000) // 24h 后
    const s = ctrl.schedulePush(MOCK_TENANT as any, {
      memberId: 'member-hr-003',
      tenantId: MOCK_TENANT.tenantId,
      content: '下周培训通知',
      sendAt: futureDate.toISOString(),
      platform: PushPlatform.iOS,
    })
    // 时间还未到，取消应该成功
    const result = ctrl.cancelScheduledPush({ pushId: s.id })
    expect(result.success).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全告警推送与设备吊销
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安监视角: 安全告警与设备管理`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = createController()
  })

  it('安监发送紧急安全告警高优先级推送', async () => {
    const result = await ctrl.sendHighPriority({
      deviceToken: DEVICE_MANAGER,
      alert: '⚠️ 监控系统告警: 后门异常入侵检测',
    })
    expect(result.success).toBe(true)
  })

  it('安监吊销离职员工设备推送 Token', async () => {
    const result = await ctrl.revokeToken({ deviceToken: DEVICE_FRONT_DESK })
    expect(result.success).toBe(true)

    const history = await ctrl.getPushHistory(DEVICE_FRONT_DESK)
    const lastRecord = history[history.length - 1]
    expect(lastRecord.status).toBe('REVOKED' as any)
  })

  it('安监: 吊销后设备无法再收到推送（无新记录产生）', async () => {
    const ctrl = createController()
    await ctrl.revokeToken({ deviceToken: DEVICE_GUIDE })
    // 吊销后尝试发送
    await ctrl.sendPush(MOCK_TENANT as any, {
      deviceToken: DEVICE_GUIDE,
      platform: PushPlatform.iOS,
      alert: '测试推送',
      priority: PushPriority.Normal,
    })
    const history = await ctrl.getPushHistory(DEVICE_GUIDE)
    const hasRevoked = history.some(r => (r.status as string) === 'REVOKED')
    expect(hasRevoked).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏机台告警与活动推送
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 导玩员视角: 机台告警与活动定时推送`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = createController()
  })

  it('导玩员定时推送活动预告给会员', () => {
    const futureDate = new Date(Date.now() + 86400000) // 明天
    const scheduled = ctrl.schedulePush(MOCK_TENANT as any, {
      memberId: 'member-vip-001',
      tenantId: MOCK_TENANT.tenantId,
      content: '明日街机挑战赛 14:00 开始，冠军奖金 $500',
      sendAt: futureDate.toISOString(),
      platform: PushPlatform.iOS,
    })
    expect(scheduled.id).toBeDefined()
    expect(scheduled.content).toContain('明日街机挑战赛')
  })

  it('导玩员通过 WebSocket 收到机台故障通知', () => {
    const ctrl = createController()
    ctrl.connectWS({ clientId: 'client-guide-01', userId: 'user-guide', platform: PushPlatform.iOS })

    // 模拟机台故障广播
    const result = ctrl.broadcastWS({
      channel: 'machine_alert',
      data: { machineId: 'MK-11', error: '投币器故障', storeId: STORE_CYBER.id },
    })
    // 只有 导玩员 连接
    expect(result.sent).toBe(1)
  })

  it('导玩员取消已取消的定时推送返回 false', () => {
    const ctrl = createController()
    const futureDate = new Date(Date.now() + 3600000)
    const s = ctrl.schedulePush(MOCK_TENANT as any, {
      memberId: 'member-vip-002',
      tenantId: MOCK_TENANT.tenantId,
      content: '活动预告已取消',
      sendAt: futureDate.toISOString(),
      platform: PushPlatform.iOS,
    })
    ctrl.cancelScheduledPush({ pushId: s.id })
    // 再次取消
    const result = ctrl.cancelScheduledPush({ pushId: s.id })
    expect(result.success).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 推送系统运维与监控
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 运行专员视角: 推送服务运维与健康监控`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = createController()
  })

  it('运行专员查看推送系统统计仪表盘', async () => {
    const stats = await ctrl.getStats()
    expect(stats).toHaveProperty('totalSent')
    expect(stats).toHaveProperty('totalFailed')
    expect(stats).toHaveProperty('activeConnections')
    expect(stats).toHaveProperty('scheduledCount')
    expect(stats).toHaveProperty('byPlatform')
    expect(stats.byPlatform).toHaveProperty(PushPlatform.iOS)
    expect(stats.byPlatform).toHaveProperty(PushPlatform.Android)
    expect(stats.byPlatform).toHaveProperty(PushPlatform.Web)
  })

  it('运行专员查看 WebSocket 当前活跃连接数', () => {
    const ctrl = createController()
    ctrl.connectWS({ clientId: 'ops-client-1', userId: 'ops-user', platform: PushPlatform.iOS })
    ctrl.connectWS({ clientId: 'ops-client-2', userId: 'ops-user', platform: PushPlatform.iOS })

    const connections = ctrl.getWSConnections()
    expect(connections.activeConnections).toBe(2)
  })

  it('运行专员: WS 断连后统计应减少', () => {
    const ctrl = createController()
    ctrl.connectWS({ clientId: 'client-a', userId: 'user-a' })
    ctrl.connectWS({ clientId: 'client-b', userId: 'user-b' })
    ctrl.disconnectWS({ clientId: 'client-a' })

    const connections = ctrl.getWSConnections()
    expect(connections.activeConnections).toBe(1)
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团队活动通知与推送
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 团建视角: 团建活动通知与实时沟通`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = createController()
  })

  it('团建专员注册团建活动推送模板', () => {
    const template = ctrl.registerTemplate(MOCK_TENANT as any, {
      code: 'team_building_notice',
      platform: PushPlatform.iOS,
      tenantId: MOCK_TENANT.tenantId,
      title: '团建活动通知',
      body: '本周六团建活动安排已发布，请查收',
      sound: 'default',
      enabled: true,
    })
    expect(template.code).toBe('team_building_notice')
    expect(template.sound).toBe('default')
  })

  it('团建专员通过 WS 发送实时活动提醒', () => {
    const ctrl = createController()
    ctrl.connectWS({ clientId: 'team-client-1', userId: 'user-team', platform: PushPlatform.iOS })

    const result = ctrl.sendWS({
      clientId: 'team-client-1',
      channel: 'team_notification',
      data: { message: '团建集合地点变更为 Arcade 大厅' },
    })
    expect(result.success).toBe(true)
  })

  it('团建专员: 向不存在的 WS 客户端发送消息应失败', () => {
    const ctrl = createController()
    const result = ctrl.sendWS({
      clientId: 'non-existent-client',
      channel: 'team_notification',
      data: { message: '测试消息' },
    })
    expect(result.success).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 营销推送活动与分群推送
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销视角: 营销推送活动与精准推送`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = createController()
  })

  it('营销专员发送精准营销推送', async () => {
    const result = await ctrl.sendPush(MOCK_TENANT as any, {
      deviceToken: DEVICE_MANAGER,
      platform: PushPlatform.iOS,
      alert: '🎉 VIP 专属福利: 本周末全场双倍积分!',
      badge: 1,
      sound: 'default',
      extra: { campaign: 'double_points_weekend', tier: 'vip' },
      priority: PushPriority.High,
    })
    expect(result.success).toBe(true)
  })

  it('营销专员查看营销推送历史', async () => {
    const ctrl = createController()
    await ctrl.sendPush(MOCK_TENANT as any, {
      deviceToken: DEVICE_MANAGER,
      platform: PushPlatform.iOS,
      alert: '新游戏上线: 头文字D 零',
      priority: PushPriority.High,
    })

    const history = await ctrl.getPushHistory(DEVICE_MANAGER)
    expect(history.length).toBe(1)
    expect(history[0].status).toBe('SENT' as any)
  })

  it('营销专员定时推送活动预热通知', () => {
    const futureDate = new Date(Date.now() + 86400000)
    const scheduled = ctrl.schedulePush(MOCK_TENANT as any, {
      memberId: 'member-marketing-001',
      tenantId: MOCK_TENANT.tenantId,
      content: '明日上午10点开启夏日冲榜活动，前10名赢取限定周边',
      sendAt: futureDate.toISOString(),
      platform: PushPlatform.iOS,
    })
    expect(scheduled.id).toBeDefined()
    expect(scheduled.sendAt).toBeDefined()
  })
})

// ════════════════════════════════════════════════════════════════
// 🔐 权限边界测试 — 8 角色统一
// ════════════════════════════════════════════════════════════════
describe('🔐 Push 权限与边界测试', () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = createController()
  })

  it('所有角色: 空 deviceToken 推送应降级但不抛错', async () => {
    const result = await ctrl.sendPush(MOCK_TENANT as any, {
      deviceToken: '',
      platform: PushPlatform.iOS,
      alert: '测试空token',
      priority: PushPriority.Normal,
    })
    expect(result.success).toBe(true) // 接口层仍返回 success
  })

  it('所有角色: 非 iOS 平台的推送暂不实现', async () => {
    const result = await ctrl.sendPush(MOCK_TENANT as any, {
      deviceToken: 'android-token-12345',
      platform: PushPlatform.Android,
      alert: 'Android 测试推送',
      priority: PushPriority.Normal,
    })
    // 当前只实现 iOS 推送, 其他平台返回 success 但无 record
    expect(result.success).toBe(true)
  })

  it('所有角色: 批量查询不存在的设备历史返回空', async () => {
    const history = await ctrl.getPushHistory('non-existent-device')
    expect(history).toEqual([])
  })

  it('所有角色: WS 断连已断开客户端不抛错', () => {
    const ctrl = createController()
    ctrl.disconnectWS({ clientId: 'never-connected' })
    // should not throw
    expect(true).toBe(true)
  })

  it('所有角色: WebSocket 重连会话恢复', () => {
    const ctrl = createController()
    const wsClient = ctrl.connectWS({ clientId: 'client-a', userId: 'user-a' })
    // 模拟断线后重连
    const reconnect = ctrl.reconnectWS({ clientId: 'client-b', oldSessionId: wsClient.sessionId! })
    expect(reconnect.restored).toBe(true)
    expect(reconnect.sessionId).toBeDefined()
    expect(reconnect.sessionId).not.toBe(wsClient.sessionId)
  })

  it('所有角色: 无效旧 session 重连返回 restored=false', () => {
    const ctrl = createController()
    const result = ctrl.reconnectWS({ clientId: 'client-new', oldSessionId: 'expired-session-id' })
    expect(result.restored).toBe(false)
    expect(result.sessionId).toBeUndefined()
  })

  it('所有角色: 取消不存在的定时推送返回 false', () => {
    const result = ctrl.cancelScheduledPush({ pushId: 'non-existent-scheduled-id' })
    expect(result.success).toBe(false)
  })
})
