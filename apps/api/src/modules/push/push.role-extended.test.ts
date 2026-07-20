/**
 * push.role-extended.test.ts · 推送管理扩展角色视角测试
 *
 * 覆盖剩余 4 角色:
 *   👥 HR    - 人力推送管理（员工通知、组织架构推送）
 *   🔧 安监  - 安全监控警报推送
 *   🎮 导玩员 - 活动预告与游戏通知推送
 *   🤝 团建  - 团建活动推送、批量排程管理
 *
 * 每角色 ≥ 2 测试用例 (正常流程 + 权限/边界)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { PushController } from './push.controller'
import { APNsService, PushNotificationScheduler, WebSocketService } from './push.service'
import { PushPlatform, PushPriority, PushStatus, PushScheduleStatus } from './push.entity'

// ── 角色定义 ──
const ROLES = {
  HR: '👥HR',
  Security: '🔧安监',
  GameGuide: '🎮导玩员',
  TeamBuilding: '🤝团建',
}

// ── 辅助函数 ──
function makeController(): PushController {
  const apnsService = new APNsService()
  const wsService = new WebSocketService()
  const scheduler = new PushNotificationScheduler(apnsService)
  return new PushController(apnsService, wsService, scheduler)
}

// 模拟 tenant context
const tenantContext = {
  tenantId: 't-push-ext',
  brandId: 'b-push-ext',
  storeId: 's-push-ext',
  marketCode: 'zh-cn',
} as any

// ──────── 👥 HR · 人力推送管理 ────────
describe(`${ROLES.HR} push 人力推送管理角色测试`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR 可以发送员工通知推送（正常流程）', async () => {
    const result = await ctrl.sendPush(tenantContext, {
      deviceToken: 'device_token_hr_001_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      platform: PushPlatform.iOS,
      alert: '本月工资条已生成，请查看',
      priority: PushPriority.High,
    })
    assert.equal(result.success, true)
    assert.ok(result.recordId)
  })

  it('HR 可以注册组织架构推送模板（正常流程）', () => {
    const template = ctrl.registerTemplate(tenantContext, {
      code: 'org_notice',
      platform: PushPlatform.iOS,
      tenantId: 't-push-ext',
      title: '组织通知',
      body: '{{dept}} 部门会议提醒',
      enabled: true,
    })
    assert.equal(template.code, 'org_notice')
    assert.equal(template.title, '组织通知')
    assert.equal(template.enabled, true)
  })

  it('HR 可以查看已发送通知的历史记录（正常流程）', async () => {
    const deviceToken = 'device_token_hr_002_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    await ctrl.sendPush(tenantContext, {
      deviceToken,
      platform: PushPlatform.iOS,
      alert: '培训通知：本周五下午有安全培训',
    })

    const history = await ctrl.getPushHistory(deviceToken)
    assert.ok(history.length >= 1)
    assert.equal(history[0].payload.alert, '培训通知：本周五下午有安全培训')
  })

  it('HR 尝试发送空内容推送应返回 success（边界）', async () => {
    // 空 alert 在 APNsService 层不会抛异常，但实际不会发送
    const result = await ctrl.sendPush(tenantContext, {
      deviceToken: 'device_token_hr_empty_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      platform: PushPlatform.iOS,
      alert: '',
    })
    assert.equal(result.success, true)
  })
})

// ──────── 🔧 安监 · 安全监控警报推送 ────────
describe(`${ROLES.Security} push 安全监控警报推送角色测试`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监可以吊销异常设备的 token（正常流程）', async () => {
    const deviceToken = 'device_token_sec_revoke_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    // 先发送一条正常推送
    await ctrl.sendPush(tenantContext, {
      deviceToken,
      platform: PushPlatform.iOS,
      alert: '测试推送',
    })

    // 吊销 token
    const result = await ctrl.revokeToken({ deviceToken })
    assert.equal(result.success, true)

    // 验证推送历史中标记为 Revoked
    const history = await ctrl.getPushHistory(deviceToken)
    assert.ok(history.some((r) => r.status === PushStatus.Revoked))
  })

  it('安监可以发送紧急安全警报（高优先级）（正常流程）', async () => {
    const result = await ctrl.sendHighPriority({
      deviceToken: 'device_token_sec_urgent_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      alert: '安全警报：检测到异常登录行为，请立即处理！',
    })
    assert.equal(result.success, true)
  })

  it('安监可以发送 WebSocket 安全通知到前台客户端（正常流程）', () => {
    ctrl.connectWS({ clientId: 'sec-ws-001', userId: 'security-user-01' })
    const result = ctrl.sendWS({
      clientId: 'sec-ws-001',
      channel: 'push:security_alert',
      data: { type: 'intrusion_detected', severity: 'high', location: '正门入口' },
    })
    assert.equal(result.success, true)
  })

  it('安监吊销不存在的 token 不应报错（边界）', async () => {
    const result = await ctrl.revokeToken({
      deviceToken: 'non_existent_device_token_12345',
    })
    assert.equal(result.success, true)
  })

  it('安监可以向所有设备广播安全公告（正常流程）', () => {
    ctrl.connectWS({ clientId: 'sec-bc-1', userId: 'sec-user' })
    ctrl.connectWS({ clientId: 'sec-bc-2', userId: 'sec-user' })
    ctrl.connectWS({ clientId: 'sec-bc-3', userId: 'sec-user' })

    const broadcast = ctrl.broadcastWS({
      channel: 'push:security_broadcast',
      data: { title: '紧急撤离通知', message: '所有人员请按指引有序撤离！' },
    })
    assert.ok(broadcast.sent >= 3)
  })
})

// ──────── 🎮 导玩员 · 活动预告与游戏通知推送 ────────
describe(`${ROLES.GameGuide} push 导玩员活动推送角色测试`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以创建定时推送活动预告（正常流程）', () => {
    const futureDate = new Date(Date.now() + 86400000) // 24小时后
    const scheduled = ctrl.schedulePush(tenantContext, {
      memberId: 'member-gg-001',
      tenantId: 't-push-ext',
      content: '🎮 周末电竞赛报名已开启，点击参与赢大奖！',
      platform: PushPlatform.iOS,
      sendAt: futureDate.toISOString(),
    })
    assert.equal(scheduled.memberId, 'member-gg-001')
    assert.equal(scheduled.status, PushScheduleStatus.Pending)
    assert.ok(scheduled.sendAt)
  })

  it('导玩员可以查询已排程的活动推送（正常流程）', () => {
    const tomorrow = new Date(Date.now() + 86400000)
    const dayAfter = new Date(Date.now() + 172800000)

    ctrl.schedulePush(tenantContext, {
      memberId: 'member-gg-002',
      tenantId: 't-push-ext',
      content: '本周街机挑战赛预告',
      platform: PushPlatform.iOS,
      sendAt: tomorrow.toISOString(),
    })
    ctrl.schedulePush(tenantContext, {
      memberId: 'member-gg-002',
      tenantId: 't-push-ext',
      content: '下月新游上线通知',
      platform: PushPlatform.iOS,
      sendAt: dayAfter.toISOString(),
    })

    const list = ctrl.queryScheduledPushes(tenantContext, 'member-gg-002')
    assert.ok(list.length >= 2)
  })

  it('导玩员可以发送即时游戏通知（正常流程）', async () => {
    const result = await ctrl.sendPush(tenantContext, {
      deviceToken: 'device_token_gg_001_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      platform: PushPlatform.iOS,
      alert: '🎯 限时挑战：今晚 8 点双倍积分活动开始！',
      badge: 1,
      priority: PushPriority.High,
    })
    assert.equal(result.success, true)
  })

  it('导玩员取消不存在的定时推送应返回 false（边界）', () => {
    const result = ctrl.cancelScheduledPush({ pushId: 'nonexistent_schedule_gg' })
    assert.equal(result.success, false)
  })

  it('导玩员可以注册游戏活动模板（正常流程）', () => {
    const template = ctrl.registerTemplate(tenantContext, {
      code: 'game_event',
      platform: PushPlatform.iOS,
      tenantId: 't-push-ext',
      title: '🎪 活动提醒',
      body: '{{gameName}} {{eventType}} 即将开始！',
      extra: { category: 'game_event' },
      enabled: true,
    })
    assert.equal(template.code, 'game_event')
    assert.equal(template.extra?.category, 'game_event')
  })
})

// ──────── 🤝 团建 · 团建活动推送批量管理 ────────
describe(`${ROLES.TeamBuilding} push 团建活动推送角色测试`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以创建批量定时推送（正常流程）', () => {
    const futureDate = new Date(Date.now() + 3600000)
    const scheduled1 = ctrl.schedulePush(tenantContext, {
      memberId: 'member-tb-001',
      tenantId: 't-push-ext',
      content: '🤝 团建活动：下周户外拓展训练通知',
      platform: PushPlatform.iOS,
      sendAt: futureDate.toISOString(),
    })
    const scheduled2 = ctrl.schedulePush(tenantContext, {
      memberId: 'member-tb-002',
      tenantId: 't-push-ext',
      content: '🎉 团建聚餐：周五晚上 6 点集合',
      platform: PushPlatform.iOS,
      sendAt: futureDate.toISOString(),
    })
    assert.equal(scheduled1.memberId, 'member-tb-001')
    assert.equal(scheduled2.memberId, 'member-tb-002')
    assert.equal(scheduled1.status, PushScheduleStatus.Pending)
    assert.equal(scheduled2.status, PushScheduleStatus.Pending)
  })

  it('团建可以取消单个团建推送排程（正常流程）', () => {
    const futureDate = new Date(Date.now() + 7200000)
    const scheduled = ctrl.schedulePush(tenantContext, {
      memberId: 'member-tb-003',
      tenantId: 't-push-ext',
      content: '团建预告：三季度旅游计划',
      platform: PushPlatform.iOS,
      sendAt: futureDate.toISOString(),
    })

    const cancelResult = ctrl.cancelScheduledPush({ pushId: scheduled.id })
    assert.equal(cancelResult.success, true)

    // 验证取消后排程列表不再包含该任务
    const list = ctrl.queryScheduledPushes(tenantContext, 'member-tb-003')
    const stillExists = list.some((s) => s.id === scheduled.id)
    assert.equal(stillExists, false)
  })

  it('团建可以发送团建活动即时通知（正常流程）', async () => {
    const result = await ctrl.sendPush(tenantContext, {
      deviceToken: 'device_token_tb_001_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      platform: PushPlatform.iOS,
      alert: '🏕️ 团建集合通知：请于明天上午 8:00 在门店大厅集合',
      extra: { eventType: 'team_building', eventId: 'tb-2026-q3' },
    })
    assert.equal(result.success, true)
  })

  it('团建可以注册团建活动推送模板（正常流程）', () => {
    const template = ctrl.registerTemplate(tenantContext, {
      code: 'team_building_invite',
      platform: PushPlatform.iOS,
      tenantId: 't-push-ext',
      title: '🤝 团建邀请',
      body: '您已被邀请参加 {{eventName}}，时间：{{eventTime}}',
      sound: 'default',
      enabled: true,
    })
    assert.equal(template.code, 'team_building_invite')
    assert.equal(template.title, '🤝 团建邀请')
  })

  it('团建可以查询已发送团建推送历史（正常流程）', async () => {
    const deviceToken = 'device_token_tb_history_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    await ctrl.sendPush(tenantContext, {
      deviceToken,
      platform: PushPlatform.iOS,
      alert: '团建活动提醒：明早 8 点集合',
    })

    const history = await ctrl.getPushHistory(deviceToken)
    assert.ok(history.length >= 1)
    assert.ok(history[0].id)
    assert.ok(history[0].status)
  })

  it('团建批量排程后查询空会员列表返回空数组（边界）', () => {
    const list = ctrl.queryScheduledPushes(tenantContext, 'nonexistent_member_tb')
    assert.equal(list.length, 0)
  })
})
