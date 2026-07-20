/**
 * push.role-missing.test.ts - [C类] 补全 4 个缺失角色视角测试
 *
 * 8 角色覆盖补全 (已有 👔店长 🛒前台 📢营销 🎯运行专员)
 * 新增: 👥HR · 🔧安监 · 🎮导玩员 · 🤝团建
 * 每角色 ≥ 2 用例 (正常流程 + 权限边界)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { PushController } from './push.controller'
import { APNsService, PushNotificationScheduler, WebSocketService } from './push.service'
import { PushPlatform, PushPriority, PushScheduleStatus, PushStatus } from './push.entity'

// ── 4 个新增角色定义 ──
const ROLES = {
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Teambuilding: '🤝团建',
}

// ── 辅助工厂 ──
function makeController(): PushController {
  const apnsService = new APNsService()
  const wsService = new WebSocketService()
  const scheduler = new PushNotificationScheduler(apnsService)
  return new PushController(apnsService, wsService, scheduler)
}

const tenantContext = {
  tenantId: 't-push',
  brandId: 'b-push',
  storeId: 's-push',
  marketCode: 'zh-cn',
} as any

// ============================================================================
// 👥HR — 人事通知、排班提醒、员工关怀推送
// ============================================================================
describe(`${ROLES.HR} push 人事通知推送角色测试`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR 可以注册人事通知模板（正常流程）', () => {
    const template = ctrl.registerTemplate(tenantContext, {
      code: 'hr_shift_reminder',
      platform: PushPlatform.iOS,
      tenantId: 't-push',
      title: '排班提醒',
      body: '您明天的排班已更新，请查看',
      enabled: true,
    })
    assert.equal(template.code, 'hr_shift_reminder')
    assert.equal(template.title, '排班提醒')
    assert.equal(template.enabled, true)
  })

  it('HR 可以给员工批量发送推送通知（正常流程）', async () => {
    const token1 = 'hr_dev_001_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    const token2 = 'hr_dev_002_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

    const r1 = await ctrl.sendPush(tenantContext, {
      deviceToken: token1,
      platform: PushPlatform.iOS,
      alert: '薪资条已生成，请登录查看',
      priority: PushPriority.Normal,
    })
    const r2 = await ctrl.sendPush(tenantContext, {
      deviceToken: token2,
      platform: PushPlatform.iOS,
      alert: '绩效考核提醒：请于本周五前完成自评',
      priority: PushPriority.Normal,
    })
    assert.equal(r1.success, true)
    assert.equal(r2.success, true)
    assert.ok(r1.recordId)
    assert.ok(r2.recordId)
  })

  it('HR 可以查看员工的推送历史记录（正常流程）', async () => {
    const token = 'hr_dev_history_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    await ctrl.sendPush(tenantContext, {
      deviceToken: token,
      platform: PushPlatform.iOS,
      alert: '入职培训通知',
    })
    await ctrl.sendPush(tenantContext, {
      deviceToken: token,
      platform: PushPlatform.iOS,
      alert: '社保公积金缴纳提醒',
    })

    const history = await ctrl.getPushHistory(token)
    assert.ok(history.length >= 2)
    assert.equal(history[0].payload.alert, '入职培训通知')
    assert.equal(history[1].payload.alert, '社保公积金缴纳提醒')
  })

  it('HR 发送通知时使用空 title 的后备行为（边界）', async () => {
    const token = 'hr_dev_boundary_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    const result = await ctrl.sendPush(tenantContext, {
      deviceToken: token,
      platform: PushPlatform.iOS,
      alert: '',
      priority: PushPriority.Normal,
    })
    // 空 alert 仍可发送，APNsService 不会拒绝对空 alert 的推送
    assert.equal(result.success, true)
  })
})

// ============================================================================
// 🔧安监 — 安全告警推送、设备吊销、紧急事件广播
// ============================================================================
describe(`${ROLES.Safety} push 安全告警推送角色测试`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监可以发送紧急安全告警推送（正常流程）', async () => {
    const token = 'safety_urgent_001_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    const result = await ctrl.sendHighPriority({
      deviceToken: token,
      alert: '⚠️ 安防告警：监控设备离线，请立即检查！',
    })
    assert.equal(result.success, true)
  })

  it('安监可以吊销可疑设备的 token（正常流程）', async () => {
    const token = 'safety_revoke_001_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    const revokeResult = await ctrl.revokeToken({ deviceToken: token })
    assert.equal(revokeResult.success, true)

    const history = await ctrl.getPushHistory(token)
    const revoked = history.filter((r) => r.status === PushStatus.Revoked)
    assert.ok(revoked.length >= 1)
  })

  it('安监可以创建定时安全巡检提醒（正常流程）', () => {
    const futureDate = new Date(Date.now() + 86400000) // 24小时后
    const scheduled = ctrl.schedulePush(tenantContext, {
      memberId: 'member-safety-001',
      tenantId: 't-push',
      content: '今日安全巡检提醒：检查所有消防设备',
      platform: PushPlatform.iOS,
      sendAt: futureDate.toISOString(),
    })
    assert.equal(scheduled.memberId, 'member-safety-001')
    assert.equal(scheduled.content, '今日安全巡检提醒：检查所有消防设备')
    assert.equal(scheduled.status, PushScheduleStatus.Pending)
  })

  it('安监吊销不存在的 token 应返回成功（边界）', async () => {
    const result = await ctrl.revokeToken({ deviceToken: 'nonexistent_token_short' })
    assert.equal(result.success, true)

    // revokeToken 会创建一条 revoked 记录
    const history = await ctrl.getPushHistory('nonexistent_token_short')
    assert.ok(history.length >= 1)
    assert.equal(history[0].status, PushStatus.Revoked)
  })

  it('安监可查询所有在场安全设备连接状态（边界）', () => {
    ctrl.connectWS({ clientId: 'safety-ws-cam-01', userId: 'safety-camera-01' })
    ctrl.connectWS({ clientId: 'safety-ws-cam-02', userId: 'safety-camera-02' })
    ctrl.connectWS({ clientId: 'safety-ws-alarm', userId: 'safety-alarm-01' })

    const connections = ctrl.getWSConnections()
    assert.ok(connections.activeConnections >= 3)
  })
})

// ============================================================================
// 🎮导玩员 — 活动预告推送、会员互动、定时推送管理
// ============================================================================
describe(`${ROLES.Guide} push 导玩员活动推送角色测试`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以创建定时活动推送（正常流程）', () => {
    const futureDate = new Date(Date.now() + 7200000) // 2小时后
    const scheduled = ctrl.schedulePush(tenantContext, {
      memberId: 'member-guide-001',
      tenantId: 't-push',
      content: '🎮 周末电竞赛即将开始，报名从速！',
      platform: PushPlatform.iOS,
      sendAt: futureDate.toISOString(),
    })
    assert.equal(scheduled.memberId, 'member-guide-001')
    assert.equal(scheduled.status, PushScheduleStatus.Pending)
    assert.ok(scheduled.id)
  })

  it('导玩员可以查看已排程的推送列表（正常流程）', () => {
    const future1 = new Date(Date.now() + 3600000)
    const future2 = new Date(Date.now() + 7200000)

    ctrl.schedulePush(tenantContext, {
      memberId: 'member-guide-002',
      tenantId: 't-push',
      content: '下午茶券发放通知',
      platform: PushPlatform.iOS,
      sendAt: future1.toISOString(),
    })
    ctrl.schedulePush(tenantContext, {
      memberId: 'member-guide-002',
      tenantId: 't-push',
      content: '新游戏试玩活动',
      platform: PushPlatform.iOS,
      sendAt: future2.toISOString(),
    })

    const list = ctrl.queryScheduledPushes(tenantContext, 'member-guide-002')
    assert.ok(list.length >= 2)
    list.forEach((s) => {
      assert.equal(s.memberId, 'member-guide-002')
    })
  })

  it('导玩员可以取消已创建的定时推送（正常流程）', () => {
    const futureDate = new Date(Date.now() + 3600000)
    const scheduled = ctrl.schedulePush(tenantContext, {
      memberId: 'member-guide-003',
      tenantId: 't-push',
      content: '周末活动提醒',
      platform: PushPlatform.iOS,
      sendAt: futureDate.toISOString(),
    })
    const cancel = ctrl.cancelScheduledPush({ pushId: scheduled.id })
    assert.equal(cancel.success, true)
  })

  it('导玩员可以发送实时活动通知（正常流程）', async () => {
    const token = 'guide_live_001_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    const result = await ctrl.sendPush(tenantContext, {
      deviceToken: token,
      platform: PushPlatform.iOS,
      alert: '🎉 正在进行的 DJ 打碟比赛，快来参与！',
      priority: PushPriority.High,
    })
    assert.equal(result.success, true)
  })

  it('导玩员取消不存在的定时推送应返回 false（边界）', () => {
    const result = ctrl.cancelScheduledPush({ pushId: 'nonexistent-schedule-id' })
    assert.equal(result.success, false)
  })
})

// ============================================================================
// 🤝团建 — 团建活动通知、团队通知广播
// ============================================================================
describe(`${ROLES.Teambuilding} push 团建通知推送角色测试`, () => {
  let ctrl: PushController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以注册团建通知模板（正常流程）', () => {
    const template = ctrl.registerTemplate(tenantContext, {
      code: 'team_building_notice',
      platform: PushPlatform.iOS,
      tenantId: 't-push',
      title: '团建通知',
      body: '亲爱的同事，本月团建活动安排已发布',
      enabled: true,
    })
    assert.equal(template.code, 'team_building_notice')
    assert.equal(template.body, '亲爱的同事，本月团建活动安排已发布')
  })

  it('团建可以通过 WebSocket 广播团建活动通知（正常流程）', () => {
    ctrl.connectWS({ clientId: 'team-ws-001', userId: 'team-member-01' })
    ctrl.connectWS({ clientId: 'team-ws-002', userId: 'team-member-02' })
    ctrl.connectWS({ clientId: 'team-ws-003', userId: 'team-member-03' })

    const broadcast = ctrl.broadcastWS({
      channel: 'push:team_building',
      data: { title: '团建通知', location: '南山公园', time: '2026-07-12 09:00' },
    })
    assert.ok(broadcast.sent >= 3)
  })

  it('团建可以给指定员工发送个性化推送（正常流程）', async () => {
    const token = 'team_personal_001_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    const result = await ctrl.sendPush(tenantContext, {
      deviceToken: token,
      platform: PushPlatform.iOS,
      alert: '您已成功报名团建活动，集合地点：公司大堂',
      priority: PushPriority.Normal,
    })
    assert.equal(result.success, true)
  })

  it('团建广播到空连接列表应返回 0（边界）', () => {
    // 没有活跃连接时广播
    const broadcast = ctrl.broadcastWS({
      channel: 'push:team_building',
      data: { message: 'no recipients' },
    })
    assert.equal(broadcast.sent, 0)
  })

  it('团建通过 WebSocket 发送消息到不存在的 client 应静默失败（边界）', () => {
    const result = ctrl.sendWS({
      clientId: 'nonexistent-team-client',
      channel: 'push:team_building',
      data: { message: 'ghost message' },
    })
    assert.equal(result.success, false)
  })
})
