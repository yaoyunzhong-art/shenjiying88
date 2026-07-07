import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * i18n.role.test.ts - Phase-20 T44
 * 用途: 国际化模块 8 角色测试
 * 角色: 店长 / 前台 / HR / 安监 / 导玩员 / 运行专员 / 团建 / 营销
 * 每个角色 2 个测试用例 (正常流程 + 权限边界)
 */
import assert from 'node:assert/strict'
import { I18nService, type Locale } from './i18n.service'

// ── Setup: 预注册各模块翻译资源 ──
function setupFullI18n(): I18nService {
  const svc = new I18nService()
  svc.registerBulk({
    'zh-CN': {
      // 店长
      store: {
        dashboard: { title: '门店看板', revenue: '营收', footfall: '客流' },
        report: { daily: '日报', weekly: '周报', monthly: '月报' },
        settings: { name: '门店名称', update: '更新门店信息' },
      },
      // 前台
      reception: {
        greeting: '欢迎光临',
        queue: { number: '您的排队号是 {number}', waiting: '前面还有 {count} 位' },
        checkout: { total: '合计 {amount} 元' },
      },
      // HR
      hr: {
        employee: { list: '员工列表', add: '添加员工', remove: '移除员工' },
        shift: { schedule: '排班表', swap: '调班申请' },
        payroll: { title: '薪资管理', month: '{month} 月薪资' },
      },
      // 安监
      security: {
        camera: { title: '监控画面', feed: '实时画面 {id}', playback: '回放' },
        alert: {
          fire: '火警警报',
          intrusion: '入侵检测',
          report: '安全检查报告',
        },
      },
      // 导玩员
      guide: {
        game: { intro: '游戏介绍', rules: '游戏规则', prize: '奖品说明' },
        tour: { start: '导玩开始', end: '导玩结束', duration: '{min} 分钟' },
        feedback: { title: '反馈', rate: '评分 {score}' },
      },
      // 运行专员
      ops: {
        device: { status: '设备状态', maintenance: '维护计划', fault: '故障报告' },
        metrics: { uptime: '运行时间', cpu: 'CPU 使用率', memory: '内存占用' },
        batch: { processed: '已处理 {count} 条', failed: '失败 {fail} 条' },
      },
      // 团建
      team: {
        event: { create: '创建团建活动', list: '活动列表', detail: '活动详情' },
        budget: { total: '总预算 {amount} 元', spent: '已使用 {used}' },
        poll: { title: '投票', option: '选项 {opt}' },
      },
      // 营销
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
  return svc
}

// ── 👔 店长 (Store Manager) ──
describe('👔 店长 — i18n', () => {
  it('正常: 获取门店看板多语言标题', () => {
    const svc = setupFullI18n()
    assert.equal(svc.t('store.dashboard.title', undefined, 'zh-CN'), '门店看板')
    assert.equal(svc.t('store.dashboard.title', undefined, 'en-US'), 'Store Dashboard')
    assert.equal(svc.t('store.dashboard.title', undefined, 'ja-JP'), '店舗ダッシュボード')
  })

  it('边界: 未翻译的 locale 使用 fallback', () => {
    const svc = setupFullI18n()
    // weekly 只在 zh-CN/en-US 存在, ja-JP 没有 → fallback en-US → zh-CN
    const jaValue = svc.t('store.report.weekly', undefined, 'ja-JP')
    assert.ok(jaValue === 'Weekly' || jaValue === '周报',
      `ja-JP weekly should fallback: got ${jaValue}`)
  })
})

// ── 🛒 前台 (Reception) ──
describe('🛒 前台 — i18n', () => {
  it('正常: 排队提示含参数插值', () => {
    const svc = setupFullI18n()
    assert.equal(svc.t('reception.queue.waiting', { count: 3 }, 'zh-CN'), '前面还有 3 位')
    assert.equal(svc.t('reception.queue.waiting', { count: 5 }, 'en-US'), '5 people ahead')
  })

  it('边界: 缺失参数保留占位符', () => {
    const svc = setupFullI18n()
    // checkout.total 需要 amount 参数
    const result = svc.t('reception.checkout.total', undefined, 'zh-CN')
    assert.equal(result, '合计 {amount} 元')
  })
})

// ── 👥 HR ──
describe('👥 HR — i18n', () => {
  it('正常: 获取薪资管理带月份参数', () => {
    const svc = setupFullI18n()
    assert.equal(svc.t('hr.payroll.month', { month: '6' }, 'zh-CN'), '6 月薪资')
    assert.equal(svc.t('hr.payroll.month', { month: 'June' }, 'en-US'), 'Payroll for June')
  })

  it('边界: HR 英文缺少某些 key 时的 fallback', () => {
    const svc = setupFullI18n()
    // shift.schedule 只在 zh-CN 注册, en-US 没有
    const enValue = svc.t('hr.shift.schedule', undefined, 'en-US')
    // Should fallback to zh-CN since en-US missing
    assert.equal(enValue, '排班表')
  })
})

// ── 🔧 安监 (Security) ──
describe('🔧 安监 — i18n', () => {
  it('正常: 获取安全相关翻译', () => {
    const svc = setupFullI18n()
    assert.equal(svc.t('security.alert.fire', undefined, 'zh-CN'), '火警警报')
    assert.equal(svc.t('security.alert.intrusion', undefined, 'zh-CN'), '入侵检测')
    assert.equal(svc.t('security.camera.playback', undefined, 'zh-CN'), '回放')
  })

  it('边界: 安监模块英文无翻译时兜底', () => {
    const svc = setupFullI18n()
    // security 模块在 en-US 未注册
    const enAlert = svc.t('security.alert.fire', undefined, 'en-US')
    assert.equal(enAlert, '火警警报') // fallback zh-CN
  })
})

// ── 🎮 导玩员 (Guide) ──
describe('🎮 导玩员 — i18n', () => {
  it('正常: 导玩时长含参数插值', () => {
    const svc = setupFullI18n()
    assert.equal(svc.t('guide.tour.duration', { min: 30 }, 'zh-CN'), '30 分钟')
  })

  it('边界: 评分参数边界值', () => {
    const svc = setupFullI18n()
    assert.equal(svc.t('guide.feedback.rate', { score: 0 }, 'zh-CN'), '评分 0')
    assert.equal(svc.t('guide.feedback.rate', { score: 5 }, 'zh-CN'), '评分 5')
    assert.equal(svc.t('guide.feedback.rate', { score: 10 }, 'zh-CN'), '评分 10')
  })
})

// ── 🎯 运行专员 (Ops) ──
describe('🎯 运行专员 — i18n', () => {
  it('正常: 批量处理状态含参数', () => {
    const svc = setupFullI18n()
    assert.equal(svc.t('ops.batch.processed', { count: 100 }, 'zh-CN'), '已处理 100 条')
    assert.equal(svc.t('ops.batch.failed', { fail: 3 }, 'zh-CN'), '失败 3 条')
  })

  it('边界: device status key 在非 zh-CN 不存在时的 fallback', () => {
    const svc = setupFullI18n()
    // device.status 只在 zh-CN
    const enStatus = svc.t('ops.device.status', undefined, 'en-US')
    assert.equal(enStatus, '设备状态')
  })
})

// ── 🤝 团建 (Team Building) ──
describe('🤝 团建 — i18n', () => {
  it('正常: 团建预算含参数', () => {
    const svc = setupFullI18n()
    assert.equal(svc.t('team.budget.total', { amount: 5000 }, 'zh-CN'), '总预算 5000 元')
    assert.equal(svc.t('team.budget.spent', { used: 3200 }, 'zh-CN'), '已使用 3200')
  })

  it('边界: 团建模块英文无翻译时正确 fallback', () => {
    const svc = setupFullI18n()
    // team 模块只注册了 zh-CN
    assert.equal(svc.t('team.event.list', undefined, 'en-US'), '活动列表')
    assert.equal(svc.t('team.event.detail', undefined, 'ja-JP'), '活动详情')
  })
})

// ── 📢 营销 (Marketing) ──
describe('📢 营销 — i18n', () => {
  it('正常: 获取营销多语言翻译', () => {
    const svc = setupFullI18n()
    assert.equal(svc.t('marketing.campaign.create', undefined, 'zh-CN'), '创建活动')
    assert.equal(svc.t('marketing.campaign.create', undefined, 'en-US'), 'Create Campaign')
    assert.equal(svc.t('marketing.campaign.create', undefined, 'ja-JP'), 'キャンペーン作成')
  })

  it('边界: coupon 模块只在 zh-CN 注册, 其他 locale fallback', () => {
    const svc = setupFullI18n()
    const enCoupon = svc.t('marketing.coupon.issue', undefined, 'en-US')
    assert.equal(enCoupon, '发放优惠券') // fallback zh-CN
    const jaCoupon = svc.t('marketing.coupon.redeem', undefined, 'ja-JP')
    assert.equal(jaCoupon, '核销') // fallback zh-CN
  })
})
