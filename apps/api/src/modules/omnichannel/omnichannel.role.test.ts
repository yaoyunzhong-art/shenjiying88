import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OmnichannelController } from './omnichannel.controller'
import {
  OmnichannelReachService,
  SMSDualChannelService,
  InternationalEmailService
} from './omnichannel.service'
import type { ReachRequest, SendSmsRequest, SendEmailRequest, SendBulkEmailRequest, RenderTemplateRequest, SetChannelStatusRequest } from './omnichannel.dto'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

function makeController(): OmnichannelController {
  return new OmnichannelController(
    new OmnichannelReachService(),
    new SMSDualChannelService(),
    new InternationalEmailService()
  )
}

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Ops} omnichannel 角色测试`, () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可以发送短信触达（主通道运营）', async () => {
    const result = await ctrl.sendSms({ phone: '+8613800000001', content: '运营监控通知' })
    assert.equal(result.status, 'sent')
    assert.equal(result.channel, 'primary')
  })

  it('运行专员可以查看所有渠道状态', async () => {
    const channels = await ctrl.listChannels()
    assert.equal(channels.length, 4)
    for (const c of channels) {
      assert.ok(['SMS', 'Email', 'Push', 'App'].includes(c.channel))
      assert.equal(c.status, 'available')
    }
  })

  it('运行专员可以设置渠道为维护模式', async () => {
    await ctrl.setChannelStatus('Push', { channel: 'Push', status: 'maintenance' })
    const status = await ctrl.getChannelStatus('Push')
    assert.equal(status.status, 'maintenance')
  })

  it('运行专员可以查看会员触达历史', async () => {
    await ctrl.reach({ memberId: 'ops-m1', channel: 'SMS', content: '运营通知' })
    await ctrl.reach({ memberId: 'ops-m1', channel: 'Email', content: '运营邮件' })
    const result = await ctrl.getHistory('ops-m1', { memberId: 'ops-m1' })
    assert.equal(result.total, 2)
  })

  it('运行专员可以查询短信投递状态', async () => {
    const sent = await ctrl.sendSms({ phone: '+8613800000002', content: '状态测试' })
    const status = await ctrl.getSmsStatus(sent.messageId)
    assert.equal(status.status, 'sent')
  })
})

// ──────────── 👔 店长 ────────────
describe(`${ROLES.TenantAdmin} omnichannel 角色测试`, () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以批量触达会员', async () => {
    const result = await ctrl.reachAll({
      memberIds: ['admin-m1', 'admin-m2', 'admin-m3'],
      channel: 'SMS',
      content: '门店促销通知'
    })
    assert.equal(result.total, 3)
    assert.ok(result.results.every(r => r.success))
  })

  it('店长可以通过SMS备用通道发送紧急通知', async () => {
    const result = await ctrl.sendSmsBackup({ phone: '+8613800000010', content: '紧急通知：门店因暴雨提前关闭' })
    assert.equal(result.status, 'sent')
    assert.equal(result.channel, 'backup')
  })

  it('店长可以发送自动切换通道的短信', async () => {
    const result = await ctrl.sendSmsFallback({ phone: '+8613800000011', content: '自动切换测试' })
    assert.ok(['primary', 'backup'].includes(result.channel))
  })

  it('店长可以发送邮件通知', async () => {
    const result = await ctrl.sendEmail({
      to: 'store@company.com',
      subject: '日报告',
      body: '今日门店运营数据汇总',
      locale: 'zh-CN'
    })
    assert.equal(result.status, 'sent')
    assert.equal(result.locale, 'zh-CN')
  })

  it('店长可以渲染营销活动邮件模板', async () => {
    const result = await ctrl.renderTemplate({
      templateId: 'promotion',
      locale: 'zh-CN',
      data: { name: '门店', discount: '8' }
    })
    assert.ok(result.rendered.includes('8'))
    assert.ok(result.rendered.includes('门店'))
  })
})

// ──────────── 📢 营销 ────────────
describe(`${ROLES.Marketing} omnichannel 角色测试`, () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可以发送批量邮件进行营销推广', async () => {
    const result = await ctrl.sendBulkEmail({
      recipients: ['member1@test.com', 'member2@test.com', 'member3@test.com'],
      subject: '会员专享优惠',
      body: '本月会员日全场8折',
      locale: 'zh-CN'
    })
    assert.equal(result.total, 3)
    assert.ok(result.results.every(r => r.status === 'sent'))
  })

  it('营销可以渲染多个语言的邮件模板', async () => {
    // 中文模板
    const zhResult = await ctrl.renderTemplate({
      templateId: 'welcome',
      locale: 'zh-CN',
      data: { name: '李华' }
    })
    assert.equal(zhResult.rendered, '欢迎 李华 加入我们！')

    // 日文模板
    const jaResult = await ctrl.renderTemplate({
      templateId: 'welcome',
      locale: 'ja-JP',
      data: { name: '田中' }
    })
    assert.equal(jaResult.rendered, '田中様ようこそ！')

    // 英文模板
    const enResult = await ctrl.renderTemplate({
      templateId: 'welcome',
      locale: 'en-US',
      data: { name: 'Alice' }
    })
    assert.equal(enResult.rendered, 'Welcome Alice to our platform!')
  })

  it('营销可以通过所有渠道发送促销通知', async () => {
    for (const channel of ['SMS', 'Email', 'Push', 'App'] as const) {
      const result = await ctrl.reach({
        memberId: 'mkt-promo',
        channel,
        content: `新春促销通过${channel}发送`
      })
      assert.equal(result.success, true)
    }
  })

  it('营销可以按渠道过滤触达历史', async () => {
    await ctrl.reach({ memberId: 'mkt-m1', channel: 'SMS', content: '促销SMS' })
    await ctrl.reach({ memberId: 'mkt-m1', channel: 'Email', content: '促销Email' })
    const smsHistory = await ctrl.getHistory('mkt-m1', { memberId: 'mkt-m1', channel: 'SMS' })
    assert.equal(smsHistory.total, 1)
    assert.equal(smsHistory.deliveries[0].channel, 'SMS')
  })

  it('营销可以查看邮件投递状态', async () => {
    const sent = await ctrl.sendEmail({
      to: 'market@test.com',
      subject: '活动通知',
      body: '促销活动已上线'
    })
    const status = await ctrl.getEmailStatus(sent.messageId)
    assert.equal(status.status, 'sent')
  })
})

// ──────────── 🎮 导玩员 ────────────
describe(`${ROLES.Guide} omnichannel 角色测试`, () => {
  let ctrl: OmnichannelController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以通过App推送触达现场玩家', async () => {
    const result = await ctrl.reach({
      memberId: 'guide-m1',
      channel: 'App',
      content: '您有一张免费游戏券待领取！'
    })
    assert.equal(result.success, true)
    assert.equal(result.channel, 'App')
  })

  it('导玩员可以发送Push推送提醒玩家比赛', async () => {
    const result = await ctrl.reach({
      memberId: 'guide-m2',
      channel: 'Push',
      content: '街头霸王比赛10分钟后开始！'
    })
    assert.equal(result.success, true)
    assert.equal(result.channel, 'Push')
  })

  it('导玩员可以通过SMS发送游戏活动验证码', async () => {
    const result = await ctrl.sendSms({
      phone: '+8613800000020',
      content: '您的验证码是 8848，请于5分钟内验证'
    })
    assert.equal(result.status, 'sent')
    assert.equal(result.channel, 'primary')
  })

  it('导玩员可以查看会员的触达记录', async () => {
    await ctrl.reach({ memberId: 'guide-m3', channel: 'Push', content: '新游戏上线通知' })
    await ctrl.reach({ memberId: 'guide-m3', channel: 'App', content: '来玩新街机' })
    const history = await ctrl.getHistory('guide-m3', { memberId: 'guide-m3' })
    assert.equal(history.total, 2)
  })

  it('导玩员查询无记录的会员返回空', async () => {
    const result = await ctrl.getHistory('nonexistent-member', { memberId: 'nonexistent-member' })
    assert.equal(result.total, 0)
  })
})

// ──────────── 跨角色边界测试 ────────────
describe('多角色 omnichannel 边界测试', () => {
  it('维护中的渠道触达应失败', async () => {
    const ctrl = makeController()
    await ctrl.setChannelStatus('SMS', { channel: 'SMS', status: 'maintenance' })
    const result = await ctrl.reach({ memberId: 'm1', channel: 'SMS', content: '测试' })
    assert.equal(result.success, false)
    assert.ok(result.error?.includes('maintenance'))
  })

  it('失败的渠道触达应失败', async () => {
    const ctrl = makeController()
    await ctrl.setChannelStatus('Email', { channel: 'Email', status: 'failed' })
    const result = await ctrl.reach({ memberId: 'm2', channel: 'Email', content: '测试' })
    assert.equal(result.success, false)
    assert.ok(result.error?.includes('failed'))
  })

  it('批量空数组触达返回0', async () => {
    const ctrl = makeController()
    const result = await ctrl.reachAll({
      memberIds: [],
      channel: 'SMS',
      content: '空批次'
    })
    assert.equal(result.total, 0)
    assert.equal(result.results.length, 0)
  })

  it('未知短信消息ID返回 not_found', async () => {
    const ctrl = makeController()
    const result = await ctrl.getSmsStatus('nonexistent_id')
    assert.equal(result.status, 'not_found')
  })

  it('未知邮件消息ID返回 not_found', async () => {
    const ctrl = makeController()
    const result = await ctrl.getEmailStatus('nonexistent_id')
    assert.equal(result.status, 'not_found')
  })

  it('不存在的模板返回错误', async () => {
    const ctrl = makeController()
    const result = await ctrl.renderTemplate({
      templateId: 'nonexistent',
      locale: 'en-US',
      data: { name: 'Test' }
    })
    assert.ok(result.rendered.includes('not found'))
  })

  it('渠道列表全部默认可用', async () => {
    const ctrl = makeController()
    const channels = await ctrl.listChannels()
    assert.ok(channels.every(c => c.status === 'available'))
  })
})
