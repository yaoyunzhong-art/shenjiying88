import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * i18n.role-extended.test.ts — 深度角色测试 (8角色 × i18n)
 *
 * 从以下8个角色视角, 测试国际化模块的多语言翻译、Locale 路由协商和翻译管理:
 *   👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖 I18nService 和 LocaleRouterService 的核心交互场景
 * 每个角色至少 3 个测试用例 (正常流程 + 异常边界 + 权限场景)
 */

import assert from 'node:assert/strict'
import { I18nService } from './i18n.service'
import { LocaleRouterService } from './locale-router.service'

// ── 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 工厂函数 ──
function setupFullI18n(): { i18n: I18nService; router: LocaleRouterService } {
  const i18n = new I18nService()
  i18n.registerBulk({
    'zh-CN': {
      store: {
        dashboard: { title: '门店看板', revenue: '营收', footfall: '客流' },
        report: { daily: '日报', weekly: '周报', monthly: '月报' },
        settings: { name: '门店名称', update: '更新门店信息' },
      },
      reception: {
        greeting: '欢迎光临',
        queue: { number: '您的排队号是 {number}', waiting: '前面还有 {count} 位' },
        checkout: { total: '合计 {amount} 元' },
      },
      hr: {
        employee: { list: '员工列表', add: '添加员工', remove: '移除员工' },
        shift: { schedule: '排班表', swap: '调班申请' },
        payroll: { title: '薪资管理', month: '{month} 月薪资' },
      },
      security: {
        camera: { title: '监控画面', feed: '实时画面 {id}', playback: '回放' },
        alert: { fire: '火警警报', intrusion: '入侵检测', report: '安全检查报告' },
      },
      guide: {
        game: { intro: '游戏介绍', rules: '游戏规则', prize: '奖品说明' },
        tour: { start: '导玩开始', end: '导玩结束', duration: '{min} 分钟' },
        feedback: { title: '反馈', rate: '评分 {score}' },
      },
      ops: {
        device: { status: '设备状态', maintenance: '维护计划', fault: '故障报告' },
        metrics: { uptime: '运行时间', cpu: 'CPU 使用率', memory: '内存占用' },
        batch: { processed: '已处理 {count} 条', failed: '失败 {fail} 条' },
      },
      team: {
        event: { create: '创建团建活动', list: '活动列表', detail: '活动详情' },
        budget: { total: '总预算 {amount} 元', spent: '已使用 {used}' },
        poll: { title: '投票', option: '选项 {opt}' },
      },
      marketing: {
        campaign: { create: '创建活动', list: '活动列表', stats: '活动数据' },
        coupon: { title: '优惠券', issue: '发放优惠券', redeem: '核销' },
        push: { title: '推送通知', send: '发送', schedule: '定时推送' },
      },
    },
    'en-US': {
      store: {
        dashboard: { title: 'Store Dashboard', revenue: 'Revenue', footfall: 'Footfall' },
        report: { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' },
      },
      reception: {
        greeting: 'Welcome',
        queue: { waiting: '{count} people ahead' },
        checkout: { total: 'Total ${amount}' },
      },
      hr: {
        employee: { list: 'Employee List', add: 'Add Employee' },
        payroll: { title: 'Payroll', month: 'Payroll for {month}' },
      },
      marketing: {
        campaign: { create: 'Create Campaign', list: 'Campaign List' },
        push: { title: 'Push Notification', send: 'Send', schedule: 'Schedule' },
      },
    },
    'ja-JP': {
      store: { dashboard: { title: '店舗ダッシュボード' } },
      reception: { greeting: 'いらっしゃいませ' },
      marketing: { campaign: { create: 'キャンペーン作成' } },
    },
  })
  const router = new LocaleRouterService(i18n)
  return { i18n, router }
}

function setupEmptyI18n(): { i18n: I18nService; router: LocaleRouterService } {
  const i18n = new I18nService()
  const router = new LocaleRouterService(i18n)
  return { i18n, router }
}

// ===================================================================
// 👔 店长 (Store Manager)
// ===================================================================
describe(`${ROLES.TenantAdmin} i18n 深度角色测试`, () => {
  it('店长通过 URL 前缀 /zh-CN 路由访问中文门店看板', () => {
    const { router, i18n } = setupFullI18n()
    const resolved = router.resolve('/zh-CN/api/dashboard')
    assert.equal(resolved.locale, 'zh-CN')
    assert.equal(resolved.source, 'url')

    const title = i18n.t('store.dashboard.title', undefined, resolved.locale)
    assert.equal(title, '门店看板')
  })

  it('店长通过 URL 前缀 /en-US 路由访问英文门店看板', () => {
    const { router, i18n } = setupFullI18n()
    const resolved = router.resolve('/en-US/api/dashboard')
    assert.equal(resolved.locale, 'en-US')
    assert.equal(resolved.source, 'url')

    const title = i18n.t('store.dashboard.title', undefined, resolved.locale)
    assert.equal(title, 'Store Dashboard')
  })

  it('店长查看完整月度报告多语言翻译差异', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('store.report.monthly', undefined, 'zh-CN'), '月报')
    assert.equal(i18n.t('store.report.monthly', undefined, 'en-US'), 'Monthly')
    // ja-JP 缺失 store.report → fallback
    const jaMonthly = i18n.t('store.report.monthly', undefined, 'ja-JP')
    assert.ok(jaMonthly === 'Monthly' || jaMonthly === '月报', `ja-JP monthly fallback: got ${jaMonthly}`)
  })

  it('店长更新门店名称翻译后立即生效', () => {
    const { i18n } = setupFullI18n()
    const before = i18n.t('store.settings.name', undefined, 'zh-CN')
    assert.equal(before, '门店名称')

    // 模拟店长更新翻译
    i18n.registerTranslations('zh-CN', { store: { settings: { name: '超级门店' } } })
    const after = i18n.t('store.settings.name', undefined, 'zh-CN')
    assert.equal(after, '超级门店')
  })
})

// ===================================================================
// 🛒 前台 (Reception)
// ===================================================================
describe(`${ROLES.Reception} i18n 深度角色测试`, () => {
  it('前台接待时用中文向顾客问候', () => {
    const { router, i18n } = setupFullI18n()
    // 前台页面默认 zh-CN
    const resolved = router.resolve('/api/cashier', { 'accept-language': 'zh-CN' })
    assert.equal(resolved.locale, 'zh-CN')

    const greeting = i18n.t('reception.greeting', undefined, resolved.locale)
    assert.equal(greeting, '欢迎光临')
  })

  it('前台接待外籍顾客时,通过 Accept-Language 切换为英文问候', () => {
    const { router, i18n } = setupFullI18n()
    const resolved = router.resolve('/api/cashier', { 'accept-language': 'en-US,ja-JP;q=0.5' })
    assert.equal(resolved.locale, 'en-US')

    const greeting = i18n.t('reception.greeting', undefined, resolved.locale)
    assert.equal(greeting, 'Welcome')
  })

  it('前台使用排队号功能,参数插值正确', () => {
    const { i18n } = setupFullI18n()
    const numberMsg = i18n.t('reception.queue.number', { number: 'A042' }, 'zh-CN')
    assert.equal(numberMsg, '您的排队号是 A042')

    const waitingMsg = i18n.t('reception.queue.waiting', { count: 5 }, 'zh-CN')
    assert.equal(waitingMsg, '前面还有 5 位')
  })

  it('前台金额显示使用正确的 locale 格式', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('reception.checkout.total', { amount: 128 }, 'zh-CN'), '合计 128 元')
    assert.equal(i18n.t('reception.checkout.total', { amount: 50.5 }, 'en-US'), 'Total $50.5')
  })

  it('前台使用 ja-JP 问候日本顾客', () => {
    const { i18n } = setupFullI18n()
    const greeting = i18n.t('reception.greeting', undefined, 'ja-JP')
    assert.equal(greeting, 'いらっしゃいませ')
  })
})

// ===================================================================
// 👥 HR (人力资源)
// ===================================================================
describe(`${ROLES.HR} i18n 深度角色测试`, () => {
  it('HR 查看中英文员工列表翻译', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('hr.employee.list', undefined, 'zh-CN'), '员工列表')
    assert.equal(i18n.t('hr.employee.list', undefined, 'en-US'), 'Employee List')
  })

  it('HR 查看薪资管理带月份参数', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('hr.payroll.month', { month: '6' }, 'zh-CN'), '6 月薪资')
    assert.equal(i18n.t('hr.payroll.month', { month: 'June' }, 'en-US'), 'Payroll for June')
  })

  it('HR 切换班表用语 — ja-JP 缺失时使用 fallback', () => {
    const { i18n } = setupFullI18n()
    // hr.shift.schedule 只在 zh-CN
    const enFallback = i18n.t('hr.shift.schedule', undefined, 'en-US')
    assert.equal(enFallback, '排班表', 'en-US 缺失 hr.shift.schedule 时应 fallback 到 zh-CN')

    const jaFallback = i18n.t('hr.shift.schedule', undefined, 'ja-JP')
    assert.equal(jaFallback, '排班表', 'ja-JP 缺失时也应 fallback')
  })

  it('HR 可校验员工管理模块所有 locale 的翻译完整性', () => {
    const { i18n } = setupFullI18n()
    const completeness = i18n.validateCompleteness('zh-CN')
    // zh-CN 作为参考, 不应缺 key
    assert.equal(completeness['zh-CN'].length, 0)
    // en-US 缺少 z-CN 中的部分 key
    assert.ok(completeness['en-US'].length > 0, 'en-US 应有缺失 key')
    // ja-JP 缺失更多
    assert.ok(completeness['ja-JP'].length > completeness['en-US'].length,
      'ja-JP 缺失 key 数应多于 en-US')
  })
})

// ===================================================================
// 🔧 安监 (Safety/Security)
// ===================================================================
describe(`${ROLES.Safety} i18n 深度角色测试`, () => {
  it('安监查看中文安全告警翻译', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('security.alert.fire', undefined, 'zh-CN'), '火警警报')
    assert.equal(i18n.t('security.alert.intrusion', undefined, 'zh-CN'), '入侵检测')
    assert.equal(i18n.t('security.alert.report', undefined, 'zh-CN'), '安全检查报告')
  })

  it('安监用 URL 前缀切换为英文告警, 安全模块英文未注册应 fallback', () => {
    const { router, i18n } = setupFullI18n()
    const resolved = router.resolve('/en-US/api/security/alerts', {})
    assert.equal(resolved.locale, 'en-US')

    // security 模块英文无翻译 → fallback
    const enAlert = i18n.t('security.alert.fire', undefined, resolved.locale)
    assert.equal(enAlert, '火警警报', '英文安全模块缺失时 fallback 到中文')

    const enIntrusion = i18n.t('security.alert.intrusion', undefined, resolved.locale)
    assert.equal(enIntrusion, '入侵检测')
  })

  it('安监检查多路语言的安全告警优先级', () => {
    const { router } = setupFullI18n()
    // URL 前缀优先于 header
    const resolved = router.resolve('/ja-JP/api/alerts', {
      'accept-language': 'zh-CN,en;q=0.5',
    })
    assert.equal(resolved.locale, 'ja-JP')
    assert.equal(resolved.source, 'url')
  })

  it('安监管通过 X-Locale header 强制指定日文告警', () => {
    const { router, i18n } = setupFullI18n()
    const resolved = router.resolve('/api/alerts', { 'x-locale': 'ja-JP' })
    assert.equal(resolved.locale, 'ja-JP')
    assert.equal(resolved.source, 'header-x-locale')

    const title = i18n.t('store.dashboard.title', undefined, resolved.locale)
    assert.equal(title, '店舗ダッシュボード')
  })
})

// ===================================================================
// 🎮 导玩员 (Game Guide)
// ===================================================================
describe(`${ROLES.Guide} i18n 深度角色测试`, () => {
  it('导玩员用中文提供游戏介绍和规则', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('guide.game.intro', undefined, 'zh-CN'), '游戏介绍')
    assert.equal(i18n.t('guide.game.rules', undefined, 'zh-CN'), '游戏规则')
    assert.equal(i18n.t('guide.game.prize', undefined, 'zh-CN'), '奖品说明')
  })

  it('导玩员记录导玩时长, 参数插值准确', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('guide.tour.start', undefined, 'zh-CN'), '导玩开始')
    assert.equal(i18n.t('guide.tour.duration', { min: 30 }, 'zh-CN'), '30 分钟')
    assert.equal(i18n.t('guide.tour.duration', { min: 0 }, 'zh-CN'), '0 分钟')
    assert.equal(i18n.t('guide.tour.duration', { min: 120 }, 'zh-CN'), '120 分钟')
  })

  it('导玩员评价评分, 边界值正确', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('guide.feedback.rate', { score: 1 }, 'zh-CN'), '评分 1')
    assert.equal(i18n.t('guide.feedback.rate', { score: 5 }, 'zh-CN'), '评分 5')
    assert.equal(i18n.t('guide.feedback.rate', { score: 10 }, 'zh-CN'), '评分 10')
  })

  it('导玩员接受外籍顾客时, 用 ja-JP 应答基本短语', () => {
    const { i18n } = setupFullI18n()
    // guide 模块仅有 zh-CN 注册, en-US/ja-JP 缺失
    const enIntro = i18n.t('guide.game.intro', undefined, 'en-US')
    assert.equal(enIntro, '游戏介绍', 'en-US 缺失 guide 模块时 fallback')
    const jaIntro = i18n.t('guide.game.intro', undefined, 'ja-JP')
    assert.equal(jaIntro, '游戏介绍', 'ja-JP 缺失 guide 模块时 fallback')
  })
})

// ===================================================================
// 🎯 运行专员 (Operations Specialist)
// ===================================================================
describe(`${ROLES.Ops} i18n 深度角色测试`, () => {
  it('运行专员查看设备状态多语言翻译', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('ops.device.status', undefined, 'zh-CN'), '设备状态')
    assert.equal(i18n.t('ops.device.maintenance', undefined, 'zh-CN'), '维护计划')
    assert.equal(i18n.t('ops.device.fault', undefined, 'zh-CN'), '故障报告')
  })

  it('运行专员查看系统指标翻译', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('ops.metrics.uptime', undefined, 'zh-CN'), '运行时间')
    assert.equal(i18n.t('ops.metrics.cpu', undefined, 'zh-CN'), 'CPU 使用率')
    assert.equal(i18n.t('ops.metrics.memory', undefined, 'zh-CN'), '内存占用')
  })

  it('运行专员使用批量处理状态并传入参数', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('ops.batch.processed', { count: 100 }, 'zh-CN'), '已处理 100 条')
    assert.equal(i18n.t('ops.batch.processed', { count: 0 }, 'zh-CN'), '已处理 0 条')
    assert.equal(i18n.t('ops.batch.processed', { count: 999999 }, 'zh-CN'), '已处理 999999 条')
    assert.equal(i18n.t('ops.batch.failed', { fail: 3 }, 'zh-CN'), '失败 3 条')
  })

  it('运行专员 ops 模块英文翻译缺失时正确 fallback', () => {
    const { i18n } = setupFullI18n()
    // ops 模块只注册了 zh-CN
    const enStatus = i18n.t('ops.device.status', undefined, 'en-US')
    assert.equal(enStatus, '设备状态', 'en-US ops 缺失时 fallback')

    const jaCPU = i18n.t('ops.metrics.cpu', undefined, 'ja-JP')
    assert.equal(jaCPU, 'CPU 使用率', 'ja-JP ops 缺失时 fallback')
  })

  it('运行专员通过 Accept-Language en 语言族匹配到 en-US', () => {
    const { router } = setupFullI18n()
    const resolved = router.resolve('/api/ops/metrics', { 'accept-language': 'en' })
    assert.equal(resolved.locale, 'en-US')
    assert.equal(resolved.source, 'header-accept-language')
  })
})

// ===================================================================
// 🤝 团建 (Team Building)
// ===================================================================
describe(`${ROLES.Teambuilding} i18n 深度角色测试`, () => {
  it('团建组织者创建活动并使用中文翻译', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('team.event.create', undefined, 'zh-CN'), '创建团建活动')
    assert.equal(i18n.t('team.event.list', undefined, 'zh-CN'), '活动列表')
    assert.equal(i18n.t('team.event.detail', undefined, 'zh-CN'), '活动详情')
  })

  it('团建预算管理参数插值', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('team.budget.total', { amount: 5000 }, 'zh-CN'), '总预算 5000 元')
    assert.equal(i18n.t('team.budget.total', { amount: 0 }, 'zh-CN'), '总预算 0 元')
    assert.equal(i18n.t('team.budget.total', { amount: 99999.99 }, 'zh-CN'), '总预算 99999.99 元')
    assert.equal(i18n.t('team.budget.spent', { used: 3200 }, 'zh-CN'), '已使用 3200')
  })

  it('团建投票选项参数插值', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('team.poll.title', undefined, 'zh-CN'), '投票')
    assert.equal(i18n.t('team.poll.option', { opt: 'A' }, 'zh-CN'), '选项 A')
    assert.equal(i18n.t('team.poll.option', { opt: '晚餐' }, 'zh-CN'), '选项 晚餐')
  })

  it('团建模块国际化 fallback (仅 zh-CN)', () => {
    const { i18n } = setupFullI18n()
    // team 模块仅 zh-CN
    assert.equal(i18n.t('team.event.list', undefined, 'en-US'), '活动列表', 'en-US fallback')
    assert.equal(i18n.t('team.event.create', undefined, 'ja-JP'), '创建团建活动', 'ja-JP fallback')
  })
})

// ===================================================================
// 📢 营销 (Marketing)
// ===================================================================
describe(`${ROLES.Marketing} i18n 深度角色测试`, () => {
  it('营销查看多语言活动创建翻译', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('marketing.campaign.create', undefined, 'zh-CN'), '创建活动')
    assert.equal(i18n.t('marketing.campaign.create', undefined, 'en-US'), 'Create Campaign')
    assert.equal(i18n.t('marketing.campaign.create', undefined, 'ja-JP'), 'キャンペーン作成')
  })

  it('营销查看活动列表翻译差异', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('marketing.campaign.list', undefined, 'zh-CN'), '活动列表')
    assert.equal(i18n.t('marketing.campaign.list', undefined, 'en-US'), 'Campaign List')
    // ja-JP 缺失 campaign.list → fallback
    const jaList = i18n.t('marketing.campaign.list', undefined, 'ja-JP')
    assert.ok(jaList === 'Campaign List' || jaList === '活动列表', `ja-JP fallback: got ${jaList}`)
  })

  it('营销的优惠券模块仅中文可用, 英文和日文正确 fallback', () => {
    const { i18n } = setupFullI18n()
    // coupon 模块仅 zh-CN
    assert.equal(i18n.t('marketing.coupon.title', undefined, 'zh-CN'), '优惠券')
    assert.equal(i18n.t('marketing.coupon.issue', undefined, 'en-US'), '发放优惠券')
    assert.equal(i18n.t('marketing.coupon.redeem', undefined, 'ja-JP'), '核销')
  })

  it('营销使用推送通知定时功能翻译', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('marketing.push.title', undefined, 'zh-CN'), '推送通知')
    assert.equal(i18n.t('marketing.push.send', undefined, 'zh-CN'), '发送')
    assert.equal(i18n.t('marketing.push.schedule', undefined, 'zh-CN'), '定时推送')
    assert.equal(i18n.t('marketing.push.send', undefined, 'en-US'), 'Send')
    assert.equal(i18n.t('marketing.push.schedule', undefined, 'en-US'), 'Schedule')
  })

  it('营销在 Locale 协商中 URL 前缀高于 header', () => {
    const { router } = setupFullI18n()
    // 即使 accept-language 是 en-US, URL /zh-CN 强制中文
    const resolved = router.resolve('/zh-CN/api/campaigns', { 'accept-language': 'en-US' })
    assert.equal(resolved.locale, 'zh-CN')
    assert.equal(resolved.source, 'url')
  })

  it('营销查看活动统计数据翻译 (en-US 缺失时的 fallback 链)', () => {
    const { i18n } = setupFullI18n()
    // marketing.campaign.stats 仅 zh-CN
    const enFallback = i18n.t('marketing.campaign.stats', undefined, 'en-US')
    assert.equal(enFallback, '活动数据', 'en-US 应 fallback 到 zh-CN')

    const jaFallback = i18n.t('marketing.campaign.stats', undefined, 'ja-JP')
    assert.equal(jaFallback, '活动数据', 'ja-JP 应 fallback 到 zh-CN')
  })
})

// ===================================================================
// 🏭 跨角色边界与异常场景
// ===================================================================
describe('跨角色边界与异常场景', () => {
  it('不支持的 locale 走 fallback 链: fr-FR → en-US (有翻译)', () => {
    const { i18n } = setupFullI18n()
    // 不支持的 'fr-FR' locale, 实际走 fr-FR → en-US → zh-CN 链,
    // en-US 有 'Store Dashboard' 因此返回英文而非默认中文
    const result = (i18n as any).t('store.dashboard.title', undefined, 'fr-FR')
    assert.equal(result, 'Store Dashboard', 'fr-FR 应 fallback 到 en-US')
  })

  it('不存在的 key 兜底返回 key 本身', () => {
    const { i18n } = setupFullI18n()
    const result = i18n.t('nonexistent.key.path', undefined, 'zh-CN')
    assert.equal(result, 'nonexistent.key.path')
  })

  it('缺失参数保留占位符原样', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('reception.queue.number', undefined, 'zh-CN'), '您的排队号是 {number}')
    assert.equal(i18n.t('reception.queue.waiting', {}, 'zh-CN'), '前面还有 {count} 位')
  })

  it('空字符串参数值正确处理', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.t('guide.feedback.rate', { score: '' }, 'zh-CN'), '评分 ')
  })

  it('无任何翻译注册时所有结果 fallback 到 key', () => {
    const { i18n } = setupEmptyI18n()
    assert.equal(i18n.t('any.key', undefined, 'zh-CN'), 'any.key')
    assert.equal(i18n.t('any.key', { param: 1 }, 'zh-CN'), 'any.key')
  })

  it('无任何翻译注册时 validate 返回空数组', () => {
    const { i18n } = setupEmptyI18n()
    const result = i18n.validateCompleteness('zh-CN')
    assert.equal(result['zh-CN'].length, 0)
    assert.equal(result['en-US'].length, 0)
    assert.equal(result['ja-JP'].length, 0)
  })

  it('LocaleRouterService.resolve 无任何 header 时使用默认 locale', () => {
    const { router } = setupFullI18n()
    const resolved = router.resolve('/api/unknown')
    assert.equal(resolved.locale, 'zh-CN')
    assert.equal(resolved.source, 'default')
  })

  it('LocaleRouterService.resolve 语言族匹配: zh → zh-CN', () => {
    const { router } = setupFullI18n()
    const resolved = router.resolve('/api/test', { 'accept-language': 'zh' })
    assert.equal(resolved.locale, 'zh-CN', 'zh 语言族应匹配到 zh-CN')
  })

  it('LocaleRouterService.resolve 语言族匹配: ja → ja-JP', () => {
    const { router } = setupFullI18n()
    const resolved = router.resolve('/api/test', { 'accept-language': 'ja' })
    assert.equal(resolved.locale, 'ja-JP', 'ja 语言族应匹配到 ja-JP')
  })

  it('LocaleRouterService 构建 URL 前缀正确', () => {
    const { router } = setupFullI18n()
    assert.equal(router.buildUrl('/api/orders', 'en-US'), '/en-US/api/orders')
    assert.equal(router.buildUrl('api/orders', 'ja-JP'), '/ja-JP/api/orders')
    assert.equal(router.buildUrl('/', 'zh-CN'), '/zh-CN/')
  })

  it('LocaleRouterService.listSupportedPrefixes 返回所有前缀', () => {
    const { router } = setupFullI18n()
    const prefixes = router.listSupportedPrefixes()
    assert.equal(prefixes.length, 3)
    assert.ok(prefixes.some(p => p.prefix === '/zh-CN' && p.locale === 'zh-CN'))
    assert.ok(prefixes.some(p => p.prefix === '/en-US' && p.locale === 'en-US'))
    assert.ok(prefixes.some(p => p.prefix === '/ja-JP' && p.locale === 'ja-JP'))
  })

  it('多个 key 批量注册后 extractKeys 返回所有 key', () => {
    const { i18n } = setupFullI18n()
    const keys = i18n.extractKeys('zh-CN')
    // 我们的注册包含 store.*, reception.*, hr.*, security.*, guide.*, ops.*, team.*, marketing.*
    const storeKeys = keys.filter(k => k.startsWith('store.'))
    assert.ok(storeKeys.length >= 6, `应有至少6个 store key, 实际 ${storeKeys.length}`)

    const marketingKeys = keys.filter(k => k.startsWith('marketing.'))
    assert.ok(marketingKeys.length >= 8, `应有至少8个 marketing key, 实际 ${marketingKeys.length}`)
  })

  it('registerTranslations 合并而非覆盖已有翻译', () => {
    const { i18n } = setupFullI18n()
    i18n.registerTranslations('zh-CN', { custom: { newKey: '新值' } })
    // 已有翻译应保留
    assert.equal(i18n.t('store.dashboard.title', undefined, 'zh-CN'), '门店看板')
    // 新注册的 key 也应存在
    assert.equal(i18n.t('custom.newKey', undefined, 'zh-CN'), '新值')
  })

  it('hasKey 正确判断 key 是否存在', () => {
    const { i18n } = setupFullI18n()
    assert.equal(i18n.hasKey('store.dashboard.title', 'zh-CN'), true)
    assert.equal(i18n.hasKey('store.dashboard.title', 'en-US'), true)
    assert.equal(i18n.hasKey('store.dashboard.title', 'ja-JP'), true)
    assert.equal(i18n.hasKey('nonexistent', 'zh-CN'), false)
    assert.equal(i18n.hasKey('store.dashboard.title', 'fr-FR' as any), false)
  })
})
