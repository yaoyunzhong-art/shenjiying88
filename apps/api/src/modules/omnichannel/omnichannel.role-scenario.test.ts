/**
 * omnichannel.role-scenario.test.ts — 全渠道触达场景驱动测试
 *
 * 跨角色场景模拟实际业务流:
 *   S1: 店长创建营销活动 → 营销执行批量触达 → 前台查看历史
 *   S2: 运行专员维护渠道 → 短信主通道切换 → 恢复后再上线
 *   S3: 团建 + HR 协同: HR 编辑模板 → 团建发起活动邀约
 *   S4: 安监发现异常 → 限制渠道 → 通知运行专员
 *   S5: 导玩员个人化触达 → 前台补充 → 店长复盘统计
 *
 * 每个场景 ≥ 2 角色参与, 覆盖正常流程 + 异常/边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { OmnichannelController } from './omnichannel.controller'
import {
  OmnichannelReachService,
  SMSDualChannelService,
  InternationalEmailService,
} from './omnichannel.service'
import type { ReachRequest, SendEmailRequest, SetChannelStatusRequest } from './omnichannel.dto'
import { DEFAULT_CHANNEL_CONFIGS } from './omnichannel.entity'

// ── 辅助: 创建干净 Controller ──
function makeController(): OmnichannelController {
  return new OmnichannelController(
    new OmnichannelReachService(),
    new SMSDualChannelService(),
    new InternationalEmailService(),
  )
}

// ========================================================================
// S1 · 店长 + 营销 + 前台 → 批量营销活动
// ========================================================================
describe('👔【场景 S1】店长发起营销 → 📢营销执行批量触达 → 🛒前台查看触达历史', () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('S1-正常流程: 店长批准 → 营销批量发送短信 → 前台验证触达成功', async () => {
    // 1. 店长检查渠道状态（确保 SMS 可用）
    const smsStatus = await ctrl.getChannelStatus('SMS')
    expect(smsStatus.status).toBe('available')

    // 2. 营销执行批量触达
    const memberIds = ['m001', 'm002', 'm003']
    const result = await ctrl.reachAll({ memberIds, channel: 'SMS', content: '新活动: 周末特惠!' })
    expect(result.results).toHaveLength(3)
    for (const r of result.results) {
      expect(r.success).toBe(true)
      expect(r.channel).toBe('SMS')
    }
    expect(result.total).toBe(3)

    // 3. 前台查看会员 m002 触达历史
    const history = await ctrl.getHistory('m002', { memberId: 'm002' })
    expect(history.total).toBeGreaterThanOrEqual(1)
    expect(history.deliveries[0].channel).toBe('SMS')
    expect(history.deliveries[0].content).toContain('周末特惠')
  })

  it('S1-边界: 营销使用已维护的渠道应失败', async () => {
    // 运行专员设置 Push 为维护
    await ctrl.setChannelStatus('Push', { channel: 'Push', status: 'maintenance' })

    // 营销尝试通过 Push 发送失败
    const result = await ctrl.reach({ memberId: 'm999', channel: 'Push', content: '推送测试' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('maintenance')
  })
})

// ========================================================================
// S2 · 运行专员 + 短信双通道 → 主通道故障 → 备用切换 → 恢复
// ========================================================================
describe('🎯【场景 S2】运行专员维护短信双通道: 主通道故障 → 备用 → 恢复', () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('S2-正常流程: 主通道发送成功', async () => {
    const result = await ctrl.sendSms({ phone: '+8613800000100', content: 'S2 主通道测试' })
    expect(result.status).toBe('sent')
    expect(result.channel).toBe('primary')

    // 验证投递状态
    const status = await ctrl.getSmsStatus(result.messageId)
    expect(status.status).toBe('sent')
    expect(status.channel).toBe('primary')
  })

  it('S2-备用通道发送', async () => {
    const result = await ctrl.sendSmsBackup({ phone: '+8613800000101', content: 'S2 备用通道测试' })
    expect(result.status).toBe('sent')
    expect(result.channel).toBe('backup')
  })

  it('S2-自动切换: 发送 fallback 使用主通道', async () => {
    const result = await ctrl.sendSmsFallback({ phone: '+8613800000102', content: 'S2 fallback 测试' })
    // fallback 先试主通道, 主通道正常则走主通道
    expect(result.status).toBe('sent')
    expect(result.channel).toBe('primary')
  })

  it('S2-投递状态查询: 不存在的 ID 返回 not_found', async () => {
    const result = await ctrl.getSmsStatus('nonexistent-id-12345')
    expect(result.status).toBe('not_found')
  })
})

// ========================================================================
// S3 · 团建 + HR → 编辑模板 → 发送活动邀约邮件
// ========================================================================
describe('🤝【场景 S3】HR编辑模板 → 🤝团建发起活动邀约邮件', () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('S3-正常流程: 渲染 welcome 模板 → 团建发送邀约邮件', async () => {
    // 1. HR 渲染 welcome 模板 (服务端预置)
    const rendered = await ctrl.renderTemplate({
      templateId: 'welcome',
      locale: 'zh-CN',
      data: { name: '春季拓展团建' },
    })
    expect(rendered.rendered).toContain('春季拓展团建')

    // 2. 团建发送邀约邮件
    const result = await ctrl.sendEmail({
      to: 'team@example.com',
      subject: '春季拓展活动邀请',
      body: rendered.rendered,
      locale: 'zh-CN',
    })
    expect(result.status).toBe('sent')
  })

  it('S3-边界: 渲染不存在的模板 ID 返回错误提示', async () => {
    const result = await ctrl.renderTemplate({
      templateId: 'non-existent-template',
      locale: 'en-US',
      data: {},
    })
    // 服务端返回 "Template xxx not found"
    expect(result.rendered).toContain('not found')
  })

  it('S3-多语言: 渲染各语言的 promotion 模板', async () => {
    const locales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'es-ES'] as const
    for (const locale of locales) {
      const result = await ctrl.renderTemplate({
        templateId: 'promotion',
        locale,
        data: { name: 'VIP客户', discount: '30' },
      })
      expect(result.rendered).toBeTruthy()
      // 各语言本地化内容不应为空
      expect(result.rendered.length).toBeGreaterThan(5)
    }
  })
})

// ========================================================================
// S4 · 安监 → 发现异常 → 限制渠道 → 通知运行专员
// ========================================================================
describe('🔧【场景 S4】安监发现异常 → 限制渠道 → 🎯通知运行专员', () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('S4-正常流程: 安监设置渠道状态后, 运行专员确认状态变更', async () => {
    // 1. 安监设置 SMS 渠道状态为 failed
    await ctrl.setChannelStatus('SMS', { channel: 'SMS', status: 'failed' })

    // 2. 验证 SMS 渠道状态
    const status = await ctrl.getChannelStatus('SMS')
    expect(status.status).toBe('failed')

    // 3. 此时通过 reach 发送应失败(渠道级别的 reach 检查状态)
    const result = await ctrl.reach({ memberId: 'm004', channel: 'SMS', content: '异常时通过SMS触达' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('failed')
  })

  it('S4-边界: 使用未知渠道名应返回 failed 状态(默认行为)', async () => {
    // @ts-expect-error 测试非法渠道类型
    const result = await ctrl.getChannelStatus('WeChat')
    expect(result.status).toBe('failed')
  })

  it('S4-恢复流程: 安监恢复渠道后, reach 恢复正常', async () => {
    // 先设维护
    await ctrl.setChannelStatus('SMS', { channel: 'SMS', status: 'maintenance' })
    const failedResult = await ctrl.reach({ memberId: 'm005', channel: 'SMS', content: '维护中测试' })
    expect(failedResult.success).toBe(false)

    // 恢复
    await ctrl.setChannelStatus('SMS', { channel: 'SMS', status: 'available' })
    const okResult = await ctrl.reach({ memberId: 'm006', channel: 'SMS', content: '恢复后测试' })
    expect(okResult.success).toBe(true)
    expect(okResult.channel).toBe('SMS')
  })
})

// ========================================================================
// S5 · 导玩员 → 前台 → 店长复盘 → 完整触达追踪
// ========================================================================
describe('🎮【场景 S5】导玩员触达会员 → 🛒前台补充通知 → 👔店长复盘统计', () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('S5-正常流程: 导玩员发送个人化通知 → 前台补充 → 店长查看渠道总览', async () => {
    const memberId = 'm-vip-001'

    // 1. 导玩员通过 App 推送发送个人化消息
    const guideReach = await ctrl.reach({
      memberId,
      channel: 'App',
      content: '🎮 您有新的游戏成就待领取!',
    })
    expect(guideReach.success).toBe(true)
    expect(guideReach.channel).toBe('App')

    // 2. 前台通过 SMS 补充通知
    const frontReach = await ctrl.reach({
      memberId,
      channel: 'SMS',
      content: '🛒 前台提醒: 您的卡包有未兑换优惠券',
    })
    expect(frontReach.success).toBe(true)
    expect(frontReach.channel).toBe('SMS')

    // 3. 店长查看该会员完整触达历史
    const history = await ctrl.getHistory(memberId, { memberId })
    expect(history.total).toBe(2)
    const channels = history.deliveries.map((d: { channel: string }) => d.channel)
    expect(channels).toContain('App')
    expect(channels).toContain('SMS')
  })

  it('S5-边界: 导玩员发送空内容应成功（服务端未限制空内容）', async () => {
    const result = await ctrl.reach({
      memberId: 'm-empty',
      channel: 'Push',
      content: '',
    })
    // 服务端允许空内容, 只是生成消息 ID
    expect(result.success).toBe(true)
    expect(result.messageId).toBeTruthy()
  })
})

// ========================================================================
// S6 · 批量邮件 + 国际多语言 (👥HR + 📢营销)
// ========================================================================
describe('👥【场景 S6】HR + 📢营销 → 批量国际邮件发送', () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('S6-正常流程: 批量发送英文邮件', async () => {
    const result = await ctrl.sendBulkEmail({
      recipients: ['alice@example.com', 'bob@example.com'],
      subject: 'Monthly Newsletter',
      body: '<h1>July Update</h1><p>New features available!</p>',
      locale: 'en-US',
    })
    expect(result.total).toBe(2)
    expect(result.results).toHaveLength(2)
    for (const r of result.results) {
      expect(r.status).toBe('sent')
    }
  })

  it('S6-边界: 批量发送空收件人列表应返回空结果', async () => {
    const result = await ctrl.sendBulkEmail({
      recipients: [],
      subject: 'Empty Test',
      body: 'No recipients',
      locale: 'zh-CN',
    })
    expect(result.total).toBe(0)
    expect(result.results).toHaveLength(0)
  })

  it('S6-西班牙语邮件发送', async () => {
    const result = await ctrl.sendEmail({
      to: 'cliente@example.es',
      subject: 'Oferta especial',
      body: '¡No te pierdas nuestras ofertas!',
      locale: 'es-ES',
    })
    expect(result.status).toBe('sent')
  })
})

// ========================================================================
// S7 · 所有渠道总览 (👔店长仪表盘)
// ========================================================================
describe('👔【场景 S7】店长查看全渠道总览', () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('S7-正常流程: 列出所有渠道及其状态和优先级', async () => {
    const channels = await ctrl.listChannels()
    expect(channels).toHaveLength(DEFAULT_CHANNEL_CONFIGS.length)

    for (const ch of channels) {
      expect(ch.status).toBe('available')
      expect(ch.priority).toBeGreaterThanOrEqual(1)
      expect(ch.fallbackChannels).toBeInstanceOf(Array)
    }

    // SMS 应该是最高的优先级(1)
    const sms = channels.find((c: { channel: string }) => c.channel === 'SMS')
    expect(sms?.priority).toBe(1)
  })

  it('S7-边界: 渠道全部可用时状态均为 available', async () => {
    const channels = await ctrl.listChannels()
    for (const ch of channels) {
      expect(ch.status).toBe('available')
    }
  })
})
