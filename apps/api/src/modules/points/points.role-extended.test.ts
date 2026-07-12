import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * 🐜 自动: [points] [C] 角色测试扩展
 *
 * 8 角色视角的盲盒积分模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import { PointsController } from './points.controller'
import { PointsAtomicService, resetTestState } from './points-atomic.service'
import { PointsRiskService } from './points-risk.service'

// ── 角色名称 ──

const ROLE_STORE_MANAGER = '👔店长'
const ROLE_FRONT_DESK = '🛒前台'
const ROLE_HR = '👥HR'
const ROLE_SECURITY = '🔧安监'
const ROLE_GUIDE = '🎮导玩员'
const ROLE_OPERATIONS = '🎯运行专员'
const ROLE_TEAMBUILDING = '🤝团建'
const ROLE_MARKETING = '📢营销'

// ── 测试辅助 ──

function createController(): PointsController {
  const atomic = new PointsAtomicService()
  const risk = new PointsRiskService()
  return new PointsController(atomic, risk)
}

function makeTransaction(controller: PointsController, memberId: string, delta: number, reason: string) {
  return controller.transaction({
    memberId,
    delta,
    reason,
    transactionId: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  })
}

function makeTransfer(controller: PointsController, from: string, to: string, amount: number, reason: string) {
  return controller.transfer({
    fromMemberId: from,
    toMemberId: to,
    amount,
    reason,
    transactionId: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  })
}

beforeEach(() => {
  resetTestState()
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👔 店长视角 — 积分体系运营者
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe(`${ROLE_STORE_MANAGER} 店长积分运营`, () => {

  it('[正常流程] 店长批量发放积分给全体会员（如周年庆）', async () => {
    const controller = createController()
    const memberIds = ['member_001', 'member_002', 'member_003']

    const result = await controller.batchAward({
      memberIds,
      pointsEach: 500,
      reason: '周年庆积分发放',
      transactionId: 'anniversary_batch_001',
    })

    expect(result.success).toBe(true)
    expect(result.data!.awardedCount).toBe(3)

    // 校验每人余额
    for (const id of memberIds) {
      const balance = await controller.getBalance(id)
      expect(balance.data.balance).toBe(500)
    }
  })

  it('[权限边界] 店长查看积分统计数据了解经营情况', async () => {
    const controller = createController()

    // 先做几笔发币操作
    await makeTransaction(controller, 'mem_a', 1000, '签到奖励')
    await makeTransaction(controller, 'mem_b', 2000, '消费积分')
    await makeTransaction(controller, 'mem_a', -300, '兑换优惠券')

    // 查看风控面板（店长关心的整体经营指标）
    const riskStatus = await controller.getRiskStatus()
    expect(riskStatus.success).toBe(true)
    expect(typeof riskStatus.data.inflationIndex).toBe('number')
    expect(Array.isArray(riskStatus.data.circuitStatuses)).toBe(true)
  })

  it('[权限边界] 店长无法将积分转给超出业务限制的账户', async () => {
    const controller = createController()
    // 先给 from 账户充值
    await makeTransaction(controller, 'store_acc', 100, '初始余额')
    // 转给自己
    const result = await makeTransfer(controller, 'store_acc', 'store_acc', 50, '自转测试')
    // 虽然 controller 层面会成功——但底层 atomic 会拒绝
    // 这里验证 controller 的逻辑能正确处理
    expect(result.success).toBeFalsy()
    expect(result.error).toContain('Cannot transfer')
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛒 前台视角 — 日常积分交互
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe(`${ROLE_FRONT_DESK} 前台积分操作`, () => {

  it('[正常流程] 前台为顾客签到发放积分', async () => {
    const controller = createController()
    const result = await makeTransaction(controller, 'guest_01', 10, '签到奖励')
    expect(result.success).toBe(true)
    expect(result.data!.newBalance).toBe(10)
  })

  it('[正常流程] 前台为顾客查询积分余额', async () => {
    const controller = createController()
    await makeTransaction(controller, 'guest_02', 200, '消费赠送')
    const balance = await controller.getBalance('guest_02')
    expect(balance.success).toBe(true)
    expect(balance.data.balance).toBe(200)
  })

  it('[权限边界] 前台尝试扣减顾客超出余额的积分', async () => {
    const controller = createController()
    await makeTransaction(controller, 'guest_03', 50, '初始充值')
    const result = await makeTransaction(controller, 'guest_03', -100, '超额扣除')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Insufficient balance')
  })

  it('[权限边界] 前台为不存在的会员查询余额（余额为 0）', async () => {
    const controller = createController()
    const balance = await controller.getBalance('nonexistent_member')
    expect(balance.data.balance).toBe(0)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 HR 视角 — 员工积分福利管理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe(`${ROLE_HR} HR员工积分福利`, () => {

  it('[正常流程] HR 批量发放员工节日积分', async () => {
    const controller = createController()
    const staffIds = ['emp_01', 'emp_02', 'emp_03', 'emp_04', 'emp_05']
    const result = await controller.batchAward({
      memberIds: staffIds,
      pointsEach: 200,
      reason: '中秋节福利',
      transactionId: 'mid_autumn_2026',
    })
    expect(result.success).toBe(true)
    expect(result.data!.awardedCount).toBe(5)
  })

  it('[权限边界] HR 尝试转账积分，但转账金额不得超过余额', async () => {
    const controller = createController()
    // emp_a 只有 100 分
    await makeTransaction(controller, 'emp_a', 100, '入职奖励')
    const result = await makeTransfer(controller, 'emp_a', 'emp_b', 999, '超额转账')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Insufficient balance')
  })

  it('[权限边界] HR 处理离职员工积分冻结', async () => {
    const controller = createController()
    // 正常状态下扣减到 0
    await makeTransaction(controller, 'emp_leave', 300, '年度绩效')
    const deduct = await controller.deduct({
      memberId: 'emp_leave',
      amount: 300,
      orderId: 'leave_settle_001',
      reason: '离职结算',
    })
    expect(deduct.success).toBe(true)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 安监视角 — 积分安全与风控
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe(`${ROLE_SECURITY} 安监积分风控`, () => {

  it('[正常流程] 安监查看风控面板监控通胀指数', async () => {
    const controller = createController()
    // 模拟大量发币
    for (let i = 0; i < 10; i++) {
      await makeTransaction(controller, `member_${i}`, 1000, '刷活跃')
    }
    // 少量回收
    await makeTransaction(controller, 'member_0', -50, '小额兑换')

    const riskStatus = await controller.getRiskStatus()
    expect(riskStatus.success).toBe(true)
    // 发币远大于回收，通胀指数应 > 1.2
    expect(riskStatus.data.inflating).toBe(true)
  })

  it('[权限边界] 安监在熔断触发后查看各端点状态', async () => {
    const controller = createController()
    const risk = controller['riskService']
    // 模拟熔断触发
    for (let i = 0; i < 6; i++) {
      risk.circuitBreaker.recordFailure('transaction')
    }

    const status = await controller.getRiskStatus()
    const txCircuit = status.data.circuitStatuses.find(c => c.endpoint === 'transaction')
    expect(txCircuit).toBeDefined()
    expect(txCircuit!.state).toBe('open')
    expect(txCircuit!.failures).toBeGreaterThanOrEqual(5)
  })

  it('[权限边界] 安监主动重置风控恢复服务', async () => {
    const controller = createController()
    // 模拟风控异常
    const risk = controller['riskService']
    risk.circuitBreaker.recordFailure('evaluateMemberLevel')
    risk.circuitBreaker.recordFailure('evaluateMemberLevel')

    const resetResult = await controller.resetRisk()
    expect(resetResult.success).toBe(true)

    const status = await controller.getRiskStatus()
    const cb = status.data.circuitStatuses.find(c => c.endpoint === 'evaluateMemberLevel')
    expect(cb!.state).toBe('closed')
    expect(cb!.failures).toBe(0)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎮 导玩员视角 — 游戏奖励积分发放
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe(`${ROLE_GUIDE} 导玩员游戏奖励发放`, () => {

  it('[正常流程] 导玩员为游戏获胜玩家增加积分', async () => {
    const controller = createController()
    const result = await makeTransaction(controller, 'player_win', 100, '抓娃娃机大奖')
    expect(result.success).toBe(true)
    expect(result.data!.newBalance).toBe(100)
  })

  it('[权限边界] 导玩员尝试同设备重复发奖被幂等拦截', async () => {
    const controller = createController()
    const dto = {
      memberId: 'player_double',
      amount: 50,
      orderId: 'game_round_042',
      reason: '每日首次游戏奖励',
    }
    // 第一次扣减
    await makeTransaction(controller, dto.memberId, 100, '初始余额')
    const first = await controller.deduct({ ...dto })
    expect(first.success).toBe(true)
    expect(first.data!.alreadyProcessed).toBe(false)

    // 第二次相同 orderId，应该幂等拦截
    const second = await controller.deduct({ ...dto })
    expect(second.success).toBe(true)
    expect(second.data!.alreadyProcessed).toBe(true)
  })

  it('[权限边界] 导玩员发放负值积分无效', async () => {
    const controller = createController()
    const result = await makeTransaction(controller, 'player_neg', -10, '错误操作')
    // 由于没有初始余额，负值等同于扣减——余额不足
    expect(result.success).toBe(false)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 运行专员视角 — 系统运维与配置
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe(`${ROLE_OPERATIONS} 运行专员积分运维`, () => {

  it('[正常流程] 运行专员查看积分流水追踪异常', async () => {
    const controller = createController()
    await makeTransaction(controller, 'ops_member', 500, '测试发放')
    await makeTransaction(controller, 'ops_member', -100, '测试扣减')

    const records = await controller.getRecords({
      memberId: 'ops_member',
      page: 1,
      limit: 10,
    })
    expect(records.success).toBe(true)
    expect(records.data.length).toBe(2)
  })

  it('[权限边界] 运行专员安排积分过期提醒', async () => {
    const controller = createController()
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const result = await controller.scheduleReminder({
      memberId: 'remind_user',
      points: 500,
      expireAt: future.toISOString(),
    })
    expect(result.success).toBe(true)

    // 再次安排同一用户应无影响（幂等）
    const dup = await controller.scheduleReminder({
      memberId: 'remind_user',
      points: 500,
      expireAt: future.toISOString(),
    })
    expect(dup.success).toBe(true)

    // 触发提醒
    const send = await controller.sendReminder({
      memberId: 'remind_user',
      points: 500,
    })
    expect(send.sent).toBe(true)
  })

  it('[权限边界] 运行专员尝试安排过期提醒但缺少必须字段', () => {
    const controller = createController()
    // 缺少 points — scheduleReminder is sync and throws BadRequestException
    expect(() =>
      controller.scheduleReminder({ memberId: 'bad', points: undefined as any, expireAt: '2026-08-01' })
    ).toThrow()
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤝 团建视角 — 团队活动奖励
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe(`${ROLE_TEAMBUILDING} 团建积分活动`, () => {

  it('[正常流程] 团建活动为团队发放积分', async () => {
    const controller = createController()
    const teamIds = ['team_a_01', 'team_a_02', 'team_a_03']
    const result = await controller.batchAward({
      memberIds: teamIds,
      pointsEach: 300,
      reason: '团建竞赛一等奖',
      transactionId: 'team_building_2026_q3',
    })
    expect(result.success).toBe(true)
    expect(result.data!.awardedCount).toBe(3)
  })

  it('[正常流程] 团建成员之间转账积分', async () => {
    const controller = createController()
    await makeTransaction(controller, 'alice', 500, '团建基础分')
    const result = await makeTransfer(controller, 'alice', 'bob', 200, '团建合作贡献')
    expect(result.success).toBe(true)
    expect(result.data!.fromNewBalance).toBe(300)
    expect(result.data!.toNewBalance).toBe(200)
  })

  it('[权限边界] 团建结束清零积分', async () => {
    const controller = createController()
    await makeTransaction(controller, 'teamer_x', 100, '团建分')
    const result = await makeTransaction(controller, 'teamer_x', -100, '团建结束清零')
    expect(result.success).toBe(true)
    expect(result.data!.newBalance).toBe(0)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📢 营销视角 — 积分营销活动
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe(`${ROLE_MARKETING} 营销积分活动`, () => {

  it('[正常流程] 营销活动积分兑换扣除', async () => {
    const controller = createController()
    await makeTransaction(controller, 'vip_member', 1000, '活动发放')
    const result = await controller.deduct({
      memberId: 'vip_member',
      amount: 500,
      orderId: 'promo_exchange_001',
      reason: '双倍积分兑换',
    })
    expect(result.success).toBe(true)
    expect(result.data!.newBalance).toBe(500)
  })

  it('[权限边界] 营销活动积分兑换超额', async () => {
    const controller = createController()
    await makeTransaction(controller, 'normal_member', 200, '基础积分')
    const result = await controller.deduct({
      memberId: 'normal_member',
      amount: 999,
      orderId: 'promo_exchange_002',
      reason: '超出余额兑换',
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Insufficient balance')
  })

  it('[权限边界] 营销批量发放空列表', async () => {
    const controller = createController()
    const result = await controller.batchAward({
      memberIds: [],
      pointsEach: 100,
      reason: '空发放测试',
      transactionId: 'empty_batch_test',
    })
    // 空列表返回成功且积分为0
    expect(result.success).toBe(true)
    expect(result.data!.awardedCount).toBe(0)
  })

  it('[权限边界] 营销活动结束后批量发放无效', async () => {
    const controller = createController()
    const result = await controller.batchAward({
      memberIds: ['m1', 'm2'],
      pointsEach: 0,
      reason: '零积分发放',
      transactionId: 'zero_batch_test',
    })
    expect(result.success).toBe(false)
  })
})
