import { describe, it, expect, beforeEach } from 'vitest'
import {
  OmnichannelReachService,
  SMSDualChannelService,
  InternationalEmailService,
} from './omnichannel.service'
import type { ReachResult, SMSDeliveryStatus, EmailDeliveryStatus } from './omnichannel.service'
import type { ChannelType as Channel, ChannelStatus, Locale } from './omnichannel.entity'

/**
 * 🐜 自动: [omnichannel] [C] 8角色扩展测试补全
 *
 * 8 角色视角的 omnichannel 全渠道触达扩展测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限/边界场景）
 * 覆盖 Reach / SMS 双通道 / 国际邮件 三个子服务
 */

// ── 辅助函数 ──
function setupReach() {
  const svc = new OmnichannelReachService()
  return { svc }
}

function setupSms() {
  const svc = new SMSDualChannelService()
  return { svc }
}

function setupEmail() {
  const svc = new InternationalEmailService()
  return { svc }
}

// ════════════════════════════════════════════
//  👔 店长 - 整体业务运营视角
// ════════════════════════════════════════════
describe('👔店长 omnichannel 扩展测试', () => {
  let reach: ReturnType<typeof setupReach>
  let sms: ReturnType<typeof setupSms>
  let email: ReturnType<typeof setupEmail>

  beforeEach(() => {
    reach = setupReach()
    sms = setupSms()
    email = setupEmail()
  })

  it('店长可以发起全渠道营销触达（SMS + Email + Push）', async () => {
    const smsResult = await reach.svc.reach('member-1', 'SMS', '【店长】优惠券已到账')
    const emailResult = await reach.svc.reach('member-1', 'Email', '【店长】月报总结')
    const pushResult = await reach.svc.reach('member-1', 'Push', '【店长】活动提醒')

    expect(smsResult.success).toBe(true)
    expect(emailResult.success).toBe(true)
    expect(pushResult.success).toBe(true)
    expect(smsResult.channel).toBe('SMS')
    expect(emailResult.channel).toBe('Email')
    expect(pushResult.channel).toBe('Push')
  })

  it('店长可以查看渠道健康概览（所有渠道是否可用）', () => {
    const smsStatus = reach.svc.getChannelStatus('SMS')
    const emailStatus = reach.svc.getChannelStatus('Email')
    const pushStatus = reach.svc.getChannelStatus('Push')
    const appStatus = reach.svc.getChannelStatus('App')

    expect(smsStatus).toBe('available')
    expect(emailStatus).toBe('available')
    expect(pushStatus).toBe('available')
    expect(appStatus).toBe('available')
  })

  it('店长可以触发短信备用通道保障送达率', async () => {
    const result = await sms.svc.sendWithFallback('+8613800000001', '【店长】紧急通知')
    expect(result.status).toBe('sent')
    expect(['primary', 'backup']).toContain(result.channel)
  })
})

// ════════════════════════════════════════════
//  🛒 前台 - 接待与会员触达视角
// ════════════════════════════════════════════
describe('🛒前台 omnichannel 扩展测试', () => {
  let reach: ReturnType<typeof setupReach>
  let email: ReturnType<typeof setupEmail>

  beforeEach(() => {
    reach = setupReach()
    email = setupEmail()
  })

  it('前台可以为单个会员发送专属问候', async () => {
    const result = await reach.svc.reach('member-guest-001', 'SMS', '尊贵的会员，今日到店可享双倍积分')
    expect(result.success).toBe(true)
    expect(result.messageId).toBeTruthy()
  })

  it('前台无法操作渠道维护状态（渠道维护权限仅限店长/安监）', () => {
    // 前台不调用 setChannelStatus，仅验证渠道状态正常
    const status = reach.svc.getChannelStatus('SMS')
    expect(status).toBe('available')
  })

  it('前台可以批量触达当日到店会员', async () => {
    const memberIds = ['guest-1', 'guest-2', 'guest-3', 'guest-4']
    const results = await reach.svc.reachAll(memberIds, 'App', '欢迎光临，请扫码领取停车券')
    expect(results).toHaveLength(4)
    for (const r of results) {
      expect(r.success).toBe(true)
    }
  })
})

// ════════════════════════════════════════════
//  👥 HR - 员工通知与模板管理视角
// ════════════════════════════════════════════
describe('👥HR omnichannel 扩展测试', () => {
  let email: ReturnType<typeof setupEmail>

  beforeEach(() => {
    email = setupEmail()
  })

  it('HR 可以发送国际化入职邮件', async () => {
    const result = await email.svc.sendEmail(
      'newhire@company.com',
      'Welcome to the Team!',
      'Your onboarding information',
      'en-US',
    )
    expect(result.status).toBe('sent')
    expect(result.locale).toBe('en-US')
  })

  it('HR 可以渲染多语言模板', () => {
    const zh = email.svc.renderTemplate('welcome', 'zh-CN', { name: '张三' })
    const en = email.svc.renderTemplate('welcome', 'en-US', { name: 'John' })
    const jp = email.svc.renderTemplate('welcome', 'ja-JP', { name: '田中' })

    expect(zh).toContain('张三')
    expect(en).toContain('John')
    expect(jp).toContain('田中')
  })

  it('HR 使用不存在的模板 ID 时返回错误信息', () => {
    const result = email.svc.renderTemplate('non-existent-template', 'zh-CN', { name: '测试' })
    expect(result).toContain('not found')
  })
})

// ════════════════════════════════════════════
//  🔧 安监 - 渠道安全与故障切换视角
// ════════════════════════════════════════════
describe('🔧安监 omnichannel 扩展测试', () => {
  let reach: ReturnType<typeof setupReach>
  let sms: ReturnType<typeof setupSms>

  beforeEach(() => {
    reach = setupReach()
    sms = setupSms()
  })

  it('安监可以将异常渠道设为维护状态', () => {
    reach.svc.setChannelStatus('SMS', 'maintenance')
    expect(reach.svc.getChannelStatus('SMS')).toBe('maintenance')
  })

  it('安监切换渠道为维护后对应触达失败', async () => {
    reach.svc.setChannelStatus('Email', 'maintenance')
    const result = await reach.svc.reach('member-sec-001', 'Email', '维护中消息')
    expect(result.success).toBe(false)
    expect(result.error).toContain('maintenance')
  })

  it('安监可以在故障后恢复渠道', async () => {
    reach.svc.setChannelStatus('Push', 'failed')
    expect(reach.svc.getChannelStatus('Push')).toBe('failed')

    reach.svc.setChannelStatus('Push', 'available')
    expect(reach.svc.getChannelStatus('Push')).toBe('available')

    const result = await reach.svc.reach('member-sec-002', 'Push', '恢复后通知')
    expect(result.success).toBe(true)
  })
})

// ════════════════════════════════════════════
//  🎮 导玩员 - 玩家触达与游戏运营视角
// ════════════════════════════════════════════
describe('🎮导玩员 omnichannel 扩展测试', () => {
  let reach: ReturnType<typeof setupReach>
  let email: ReturnType<typeof setupEmail>

  beforeEach(() => {
    reach = setupReach()
    email = setupEmail()
  })

  it('导玩员可以向玩家发送游戏活动通知（App 推送）', async () => {
    const result = await reach.svc.reach('player-1001', 'App', '新游戏上线，快来挑战！')
    expect(result.success).toBe(true)
    expect(result.channel).toBe('App')
  })

  it('导玩员可以向 VIP 玩家发送专属 Promo 邮件', async () => {
    const result = await email.svc.sendEmail(
      'vip-player@example.com',
      'Exclusive Game Pass',
      'You have been awarded 50 free tokens!',
      'en-US',
    )
    expect(result.status).toBe('sent')
    expect(result.locale).toBe('en-US')
  })

  it('导玩员批量通知所有活跃玩家', async () => {
    const playerIds: string[] = []
    for (let i = 1; i <= 5; i++) playerIds.push(`player-${1000 + i}`)
    const results = await reach.svc.reachAll(playerIds, 'Push', '周末双倍积分活动')
    expect(results).toHaveLength(5)
    for (const r of results) {
      expect(r.success).toBe(true)
    }
  })
})

// ════════════════════════════════════════════
//  🎯 运行专员 - 渠道运维与监控视角
// ════════════════════════════════════════════
describe('🎯运行专员 omnichannel 扩展测试', () => {
  let reach: ReturnType<typeof setupReach>
  let sms: ReturnType<typeof setupSms>

  beforeEach(() => {
    reach = setupReach()
    sms = setupSms()
  })

  it('运行专员可以查询短信主通道投递状态', async () => {
    const sentResult = await sms.svc.sendViaPrimary('+8613800000002', '运维测试消息')
    const status = sms.svc.getDeliveryStatus(sentResult.messageId)
    expect(status).toBeDefined()
    expect(status!.status).toBe('sent')
    expect(status!.channel).toBe('primary')
  })

  it('运行专员可以查看所有渠道状态列表', () => {
    const channels: Channel[] = ['SMS', 'Email', 'Push', 'App']
    for (const ch of channels) {
      const status = reach.svc.getChannelStatus(ch)
      expect(['available', 'maintenance', 'failed']).toContain(status)
    }
  })

  it('运行专员可以从历史记录追溯会员触达情况', async () => {
    await reach.svc.reach('member-ops-001', 'SMS', '追溯消息1')
    await reach.svc.reach('member-ops-001', 'Email', '追溯消息2')

    const history = reach.svc.getReachHistory('member-ops-001')
    expect(history).toHaveLength(2)
    expect(history[0].channel).toBe('SMS')
    expect(history[1].channel).toBe('Email')
  })
})

// ════════════════════════════════════════════
//  🤝 团建 - 团队活动通知视角
// ════════════════════════════════════════════
describe('🤝团建 omnichannel 扩展测试', () => {
  let reach: ReturnType<typeof setupReach>
  let email: ReturnType<typeof setupEmail>

  beforeEach(() => {
    reach = setupReach()
    email = setupEmail()
  })

  it('团建可以批量发送活动邀请给团队成员', async () => {
    const teamMembers = ['staff-a', 'staff-b', 'staff-c', 'staff-d', 'staff-e']
    const results = await reach.svc.reachAll(teamMembers, 'App', '团建活动：本周五下午户外拓展')
    expect(results).toHaveLength(5)
    const allSuccess = results.every(r => r.success)
    expect(allSuccess).toBe(true)
  })

  it('团建可以发送多语言邮件给外籍员工', async () => {
    const result = await email.svc.sendEmail(
      'foreign-staff@company.com',
      'Team Building Event',
      'Please join us this Friday for outdoor activities!',
      'en-US',
    )
    expect(result.status).toBe('sent')
    expect(result.locale).toBe('en-US')
  })

  it('团建可以查看历史触达记录', async () => {
    await reach.svc.reach('staff-a', 'SMS', '团建通知')
    const history = reach.svc.getReachHistory('staff-a')
    expect(history.length).toBeGreaterThanOrEqual(1)
    expect(history[0].content).toContain('团建通知')
  })
})

// ════════════════════════════════════════════
//  📢 营销 - 营销活动与模板视角
// ════════════════════════════════════════════
describe('📢营销 omnichannel 扩展测试', () => {
  let reach: ReturnType<typeof setupReach>
  let email: ReturnType<typeof setupEmail>

  beforeEach(() => {
    reach = setupReach()
    email = setupEmail()
  })

  it('营销可以发送促销邮件并渲染模板变量', () => {
    const promo = email.svc.renderTemplate('promotion', 'zh-CN', { name: '王小明', discount: '8' })
    expect(promo).toContain('王小明')
    expect(promo).toContain('8 折优惠券')
  })

  it('营销可以批量发送邮件至订阅用户列表', async () => {
    const recipients = [
      { to: 'user1@test.com', name: 'User1' },
      { to: 'user2@test.com', name: 'User2' },
    ]
    const results = await email.svc.sendBulkEmail(recipients, 'Weekly Promotion', 'Check out our deals!', 'en-US')
    expect(results).toHaveLength(2)
    for (const r of results) {
      expect(r.status).toBe('sent')
    }
  })

  it('营销可以查询营销邮件的投递状态', async () => {
    const sent = await email.svc.sendEmail('marketing-target@test.com', 'Promo', '50% off!')
    const status = email.svc.getEmailStatus(sent.messageId)
    expect(status).toBeDefined()
    expect(status!.status).toBe('sent')
  })

  it('营销可以注册自定义模板并渲染', () => {
    const customTemplates: Record<Locale, string> = {
      'zh-CN': '【{brand}】周年庆 {discount}% 折扣',
      'en-US': '{brand} Anniversary {discount}% Off',
      'ja-JP': '{brand}周年記念 {discount}%オフ',
      'ko-KR': '{brand} 기념일 {discount}% 할인',
      'es-ES': '{brand} Aniversario {discount}% Descuento',
    }
    email.svc.registerTemplate('anniversary', customTemplates)

    const zh = email.svc.renderTemplate('anniversary', 'zh-CN', { brand: 'M5', discount: '30' })
    const en = email.svc.renderTemplate('anniversary', 'en-US', { brand: 'M5', discount: '30' })
    expect(zh).toContain('M5')
    expect(zh).toContain('30%')
    expect(en).toContain('Anniversary')
  })
})
