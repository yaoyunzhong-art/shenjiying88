import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PointsController } from './points.controller'
import { PointsAtomicService, resetTestState } from './points-atomic.service'
import { PointsRiskService } from './points-risk.service'

const ROLES = { TenantAdmin: 'SM', Reception: 'RC', HR: 'HR', Safety: 'SF', Guide: 'GD', Ops: 'OP', Teambuilding: 'TB', Marketing: 'MK' }

function makeCtrl() {
  const atomic = new PointsAtomicService()
  const risk = new PointsRiskService()
  const ctrl = new PointsController(atomic, risk)
  return { ctrl, atomic, risk }
}

let txId = 0
function nextTx() { return 'tx-' + (++txId).toString().padStart(4, '0') }

// ──────────── 👔店长 ────────────
describe(`${ROLES.TenantAdmin} Points`, () => {
  beforeEach(() => { resetTestState(); txId = 0 })

  it('add points to member - happy path', async () => {
    const { ctrl } = makeCtrl()
    const r = await ctrl.transaction({ memberId: 'm-001', delta: 500, reason: 'birthday bonus', transactionId: nextTx() })
    assert.ok(r.success)
    assert.equal(r.data!.newBalance, 500)
  })

  it('deduct from member with insufficient balance - negative', async () => {
    const { ctrl } = makeCtrl()
    const r = await ctrl.deduct({ memberId: 'm-empty', amount: 100, orderId: 'ord-empty', reason: 'no-funds' })
    assert.ok(!r.success)
    assert.ok(r.error)
  })

  it('overdraft blocked - boundary', async () => {
    const { ctrl } = makeCtrl()
    const r = await ctrl.transaction({ memberId: 'm-001', delta: -99999, reason: 'overdraft', transactionId: nextTx() })
    assert.ok(!r.success)
  })
})

// ──────────── 🛒前台 ────────────
describe(`${ROLES.Reception} Points`, () => {
  beforeEach(() => { resetTestState(); txId = 0 })

  it('check member balance', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-002', delta: 200, reason: 'sign-in', transactionId: nextTx() })
    const r = ctrl.getBalance('m-002')
    assert.ok(r.success)
    assert.equal(r.data.balance, 200)
  })

  it('deduct points for order', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-003', delta: 300, reason: 'earn', transactionId: nextTx() })
    const r = await ctrl.deduct({ memberId: 'm-003', amount: 100, orderId: 'ord-001', reason: 'discount' })
    assert.ok(r.success)
    assert.equal(r.data!.newBalance, 200)
    assert.equal(r.data!.alreadyProcessed, false)
  })

  it('insufficient balance for deduction - negative', async () => {
    const { ctrl } = makeCtrl()
    const r = await ctrl.deduct({ memberId: 'm-nofunds', amount: 100, orderId: 'ord-002', reason: 'no-funds' })
    assert.ok(!r.success)
  })

  it('idempotent deduction - same orderId processed twice', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-004', delta: 500, reason: 'topup', transactionId: nextTx() })
    const r1 = await ctrl.deduct({ memberId: 'm-004', amount: 100, orderId: 'ord-003', reason: 'use1' })
    assert.ok(r1.success)
    assert.equal(r1.data!.alreadyProcessed, false)
    const r2 = await ctrl.deduct({ memberId: 'm-004', amount: 100, orderId: 'ord-003', reason: 'duplicate' })
    assert.ok(r2.success)
    assert.equal(r2.data!.alreadyProcessed, true)
    assert.equal(r2.data!.newBalance, 400)
  })
})

// ──────────── 👥HR ────────────
describe(`${ROLES.HR} Points`, () => {
  beforeEach(() => { resetTestState(); txId = 0 })

  it('view points records', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-hr1', delta: 100, reason: 'referral', transactionId: nextTx() })
    await ctrl.transaction({ memberId: 'm-hr1', delta: 50, reason: 'bonus', transactionId: nextTx() })
    const r = ctrl.getRecords({ memberId: 'm-hr1' })
    assert.ok(r.success)
    assert.ok(r.data.length >= 2)
  })

  it('filter records by type', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-hr2', delta: 200, reason: 'earn', transactionId: nextTx() })
    await ctrl.deduct({ memberId: 'm-hr2', amount: 50, orderId: 'ord-hr1', reason: 'spend' })
    const awardRecs = ctrl.getRecords({ memberId: 'm-hr2', type: 'award' })
    assert.ok(awardRecs.success)
    assert.ok(awardRecs.data.every((r: any) => r.type === 'award'))
  })
})

// ──────────── 🔧安监 ────────────
describe(`${ROLES.Safety} Points`, () => {
  beforeEach(() => { resetTestState(); txId = 0 })

  it('monitor risk status', async () => {
    const { ctrl } = makeCtrl()
    for (let i = 0; i < 3; i++)
      await ctrl.transaction({ memberId: 'm-risk' + i, delta: 10000, reason: 'large award', transactionId: nextTx() })
    const risk = ctrl.getRiskStatus()
    assert.ok(risk.success)
    assert.ok(risk.data.inflationIndex !== undefined)
    assert.ok(risk.data.circuitStatuses.length > 0)
    assert.ok(Array.isArray(risk.data.recentAlerts))
  })

  it('reset risk state', async () => {
    const { ctrl } = makeCtrl()
    const r = ctrl.resetRisk()
    assert.ok(r.success)
    assert.equal(r.message, '风控状态已重置')
  })

  it('schedule expiration reminder', async () => {
    const { ctrl } = makeCtrl()
    const s = ctrl.scheduleReminder({ memberId: 'm-expire', points: 500, expireAt: '2026-12-31T23:59:59Z' })
    assert.ok(s.success)
    const riskSt = ctrl.getRiskStatus()
    assert.ok(riskSt.data.activeReminders >= 1)
  })
})

// ──────────── 🎮导玩员 ────────────
describe(`${ROLES.Guide} Points`, () => {
  beforeEach(() => { resetTestState(); txId = 0 })

  it('transfer points between members', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-from', delta: 300, reason: 'earn', transactionId: nextTx() })
    const r = await ctrl.transfer({ fromMemberId: 'm-from', toMemberId: 'm-to', amount: 100, reason: 'gift', transactionId: nextTx() })
    assert.ok(r.success)
    assert.equal(r.data!.fromNewBalance, 200)
    assert.equal(r.data!.toNewBalance, 100)
  })

  it('insufficient funds blocks transfer - negative', async () => {
    const { ctrl } = makeCtrl()
    const r = await ctrl.transfer({ fromMemberId: 'm-poor', toMemberId: 'm-rich', amount: 999, reason: 'nope', transactionId: nextTx() })
    assert.ok(!r.success)
  })

  it('batch award multiple members', async () => {
    const { ctrl } = makeCtrl()
    const r = await ctrl.batchAward({ memberIds: ['m-b1', 'm-b2', 'm-b3'], pointsEach: 100, reason: 'batch bonus', transactionId: nextTx() })
    assert.ok(r.success)
    assert.equal(r.data!.awardedCount, 3)
    assert.equal(ctrl.getBalance('m-b1').data.balance, 100)
    assert.equal(ctrl.getBalance('m-b2').data.balance, 100)
    assert.equal(ctrl.getBalance('m-b3').data.balance, 100)
  })
})

// ──────────── 🎯运行专员 ────────────
describe(`${ROLES.Ops} Points`, () => {
  beforeEach(() => { resetTestState(); txId = 0 })

  it('reconcile total awarded', async () => {
    const { ctrl } = makeCtrl()
    for (let i = 0; i < 3; i++)
      await ctrl.transaction({ memberId: 'm-v' + i, delta: 1000, reason: 'op-issue', transactionId: nextTx() })
    let totalAwarded = 0
    for (let i = 0; i < 3; i++) {
      const recs = ctrl.getRecords({ memberId: 'm-v' + i, type: 'award' })
      totalAwarded += recs.data.reduce((s: number, r: any) => s + r.delta, 0)
    }
    assert.ok(totalAwarded >= 3000)
  })

  it('balance matches earn minus spend', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-op1', delta: 500, reason: 'earn', transactionId: nextTx() })
    await ctrl.deduct({ memberId: 'm-op1', amount: 200, orderId: 'ord-op1', reason: 'use' })
    const recs = ctrl.getRecords({ memberId: 'm-op1' })
    const totalEarn = recs.data.filter((r: any) => r.delta > 0).reduce((s: number, r: any) => s + r.delta, 0)
    const totalSpend = recs.data.filter((r: any) => r.delta < 0).reduce((s: number, r: any) => s + Math.abs(r.delta), 0)
    assert.equal(totalEarn - totalSpend, 300)
  })

  it('export records with date filter', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-op2', delta: 200, reason: 'act', transactionId: nextTx() })
    const recs = ctrl.getRecords({ memberId: 'm-op2', startDate: '2026-01-01T00:00:00Z' })
    assert.ok(recs.success)
    assert.ok(recs.data.length >= 1)
  })
})

// ──────────── 🤝团建 ────────────
describe(`${ROLES.Teambuilding} Points`, () => {
  beforeEach(() => { resetTestState(); txId = 0 })

  it('send manual expiration reminder', async () => {
    const { ctrl } = makeCtrl()
    ctrl.scheduleReminder({ memberId: 'm-tb1', points: 100, expireAt: '2026-12-01T00:00:00Z' })
    const r = ctrl.sendReminder({ memberId: 'm-tb1', points: 100 })
    assert.ok(r.success)
    assert.ok(r.sent)
  })

  it('transfer to multiple team members', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-leader', delta: 1000, reason: 'team fund', transactionId: nextTx() })
    const r1 = await ctrl.transfer({ fromMemberId: 'm-leader', toMemberId: 'm-tb2', amount: 200, reason: 'team reward', transactionId: nextTx() })
    const r2 = await ctrl.transfer({ fromMemberId: 'm-leader', toMemberId: 'm-tb3', amount: 200, reason: 'team reward', transactionId: nextTx() })
    assert.ok(r1.success && r2.success)
    const bal = ctrl.getBalance('m-leader')
    assert.equal(bal.data.balance, 600)
  })
})

// ──────────── 📢营销 ────────────
describe(`${ROLES.Marketing} Points`, () => {
  beforeEach(() => { resetTestState(); txId = 0 })

  it('bulk awards for promo campaign', async () => {
    const { ctrl } = makeCtrl()
    const ids = Array.from({ length: 10 }, (_, i) => 'm-mkt' + i)
    const r = await ctrl.batchAward({ memberIds: ids, pointsEach: 50, reason: 'promo Q3', transactionId: nextTx() })
    assert.ok(r.success)
    assert.equal(r.data!.awardedCount, 10)
  })

  it('verify promo points distributed correctly', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.batchAward({ memberIds: ['m-verify1', 'm-verify2', 'm-verify3'], pointsEach: 100, reason: 'verify', transactionId: nextTx() })
    assert.equal(ctrl.getBalance('m-verify1').data.balance, 100)
    assert.equal(ctrl.getBalance('m-verify2').data.balance, 100)
    assert.equal(ctrl.getBalance('m-verify3').data.balance, 100)
  })

  it('deduct points for coupon usage', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-coupon', delta: 500, reason: 'earn', transactionId: nextTx() })
    const r = await ctrl.deduct({ memberId: 'm-coupon', amount: 300, orderId: 'ord-cpn', reason: 'coupon redemption' })
    assert.ok(r.success)
    assert.equal(r.data!.newBalance, 200)
  })
})

// ──────────── 数据隔离 ────────────
describe('Points Isolation', () => {
  beforeEach(() => { resetTestState(); txId = 0 })

  it('balances isolated per member', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-alpha', delta: 1000, reason: 'fund', transactionId: nextTx() })
    await ctrl.transaction({ memberId: 'm-beta', delta: 200, reason: 'fund', transactionId: nextTx() })
    assert.equal(ctrl.getBalance('m-alpha').data.balance, 1000)
    assert.equal(ctrl.getBalance('m-beta').data.balance, 200)
    assert.notEqual(ctrl.getBalance('m-alpha').data.balance, ctrl.getBalance('m-beta').data.balance)
  })

  it('records scoped per member', async () => {
    const { ctrl } = makeCtrl()
    await ctrl.transaction({ memberId: 'm-only1', delta: 100, reason: 'x', transactionId: nextTx() })
    const recs = ctrl.getRecords({ memberId: 'm-only1' })
    assert.ok(recs.data.every((r: any) => r.memberId === 'm-only1'))
  })
})
