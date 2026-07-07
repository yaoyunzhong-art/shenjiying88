import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  BlindBoxStatus,
  DrawType,
  type BlindBoxPrize,
  type BlindBoxTier,
  type BlindBoxPlan,
  type BlindBoxDrawRecord,
} from './blindbox.entity'

// ── BlindBoxStatus enum ───────────────────────────────────────
describe('blindbox.entity: BlindBoxStatus', () => {
  it('defines ACTIVE status', () => {
    assert.equal(BlindBoxStatus.ACTIVE, 'active')
  })

  it('defines DRAFT status', () => {
    assert.equal(BlindBoxStatus.DRAFT, 'draft')
  })

  it('defines PAUSED status', () => {
    assert.equal(BlindBoxStatus.PAUSED, 'paused')
  })

  it('covers all expected status values', () => {
    const all = Object.values(BlindBoxStatus)
    assert.equal(all.length, 3)
    assert.ok(all.includes('active' as BlindBoxStatus))
    assert.ok(all.includes('draft' as BlindBoxStatus))
    assert.ok(all.includes('paused' as BlindBoxStatus))
  })
})

// ── DrawType enum ─────────────────────────────────────────────
describe('blindbox.entity: DrawType', () => {
  it('defines SINGLE draw', () => {
    assert.equal(DrawType.SINGLE, 'single')
  })

  it('defines BATCH10 draw', () => {
    assert.equal(DrawType.BATCH10, 'batch10')
  })
})

// ── BlindBoxPrize interface ───────────────────────────────────
describe('blindbox.entity: BlindBoxPrize', () => {
  it('creates a valid prize with all required fields', () => {
    const prize: BlindBoxPrize = {
      prizeId: 'p1',
      tierId: 't1',
      name: '一等奖奖品',
      description: '稀有道具',
      stock: 10,
      weight: 1,
      isMythic: false,
    }

    assert.equal(prize.prizeId, 'p1')
    assert.equal(prize.tierId, 't1')
    assert.equal(prize.name, '一等奖奖品')
    assert.equal(prize.description, '稀有道具')
    assert.equal(prize.stock, 10)
    assert.equal(prize.weight, 1)
    assert.equal(prize.isMythic, false)
  })

  it('supports isMythic flag for rare items', () => {
    const mythic: BlindBoxPrize = {
      prizeId: 'p-legend',
      tierId: 't1',
      name: '传说限定',
      description: '限定款',
      stock: 1,
      weight: 0.1,
      isMythic: true,
    }

    assert.equal(mythic.isMythic, true)
  })

  it('weight can be any positive number', () => {
    const heavy: BlindBoxPrize = {
      prizeId: 'p-heavy',
      tierId: 't2',
      name: '高权重奖品',
      description: '高概率',
      stock: 100,
      weight: 50,
      isMythic: false,
    }
    assert.ok(heavy.weight > 0)
  })

  it('stock can be zero representing out of stock', () => {
    const empty: BlindBoxPrize = {
      prizeId: 'p-empty',
      tierId: 't3',
      name: '缺货',
      description: '',
      stock: 0,
      weight: 1,
      isMythic: false,
    }
    assert.equal(empty.stock, 0)
  })
})

// ── BlindBoxTier interface ────────────────────────────────────
describe('blindbox.entity: BlindBoxTier', () => {
  it('creates a valid tier with prizes', () => {
    const tier: BlindBoxTier = {
      tierId: 't1',
      name: 'SSR',
      probability: 0.05,
      prizes: [
        { prizeId: 'p1', name: 'SSR剑', stock: 3, weight: 1 },
        { prizeId: 'p2', name: 'SSR盾', stock: 2, weight: 1 },
      ],
    }

    assert.equal(tier.tierId, 't1')
    assert.equal(tier.name, 'SSR')
    assert.equal(tier.probability, 0.05)
    assert.equal(tier.prizes.length, 2)
  })

  it('probability is within valid range 0-1', () => {
    const high: BlindBoxTier = {
      tierId: 't3',
      name: '普通',
      probability: 0.7,
      prizes: [{ prizeId: 'p-n', name: '普通', stock: 100, weight: 1 }],
    }
    assert.ok(high.probability >= 0 && high.probability <= 1)
  })

  it('can have a single prize', () => {
    const single: BlindBoxTier = {
      tierId: 't-single',
      name: '唯一',
      probability: 1,
      prizes: [{ prizeId: 'p-only', name: '唯一奖品', stock: 1, weight: 1 }],
    }
    assert.equal(single.prizes.length, 1)
  })

  it('prizes array can have zero-weight items', () => {
    const zeroWeight: BlindBoxTier = {
      tierId: 't-zw',
      name: '零权重层',
      probability: 0.001,
      prizes: [{ prizeId: 'p-zw', name: '隐藏', stock: 1, weight: 0 }],
    }
    assert.equal(zeroWeight.prizes[0].weight, 0)
  })
})

// ── BlindBoxPlan interface ────────────────────────────────────
describe('blindbox.entity: BlindBoxPlan', () => {
  it('creates a valid plan with all fields', () => {
    const now = new Date()
    const plan: BlindBoxPlan = {
      planId: 'plan-001',
      name: '夏日限定',
      tiers: [],
      guaranteePityCount: 10,
      status: BlindBoxStatus.ACTIVE,
      createdAt: now,
    }

    assert.equal(plan.planId, 'plan-001')
    assert.equal(plan.name, '夏日限定')
    assert.equal(plan.guaranteePityCount, 10)
    assert.equal(plan.status, BlindBoxStatus.ACTIVE)
    assert.equal(plan.createdAt, now)
  })

  it('supports DRAFT status', () => {
    const draft: BlindBoxPlan = {
      planId: 'plan-draft',
      name: '未发布',
      tiers: [],
      guaranteePityCount: 5,
      status: BlindBoxStatus.DRAFT,
      createdAt: new Date(),
    }
    assert.equal(draft.status, BlindBoxStatus.DRAFT)
  })

  it('supports PAUSED status', () => {
    const paused: BlindBoxPlan = {
      planId: 'plan-paused',
      name: '暂停',
      tiers: [],
      guaranteePityCount: 10,
      status: BlindBoxStatus.PAUSED,
      createdAt: new Date(),
    }
    assert.equal(paused.status, BlindBoxStatus.PAUSED)
  })

  it('guaranteePityCount is a positive integer', () => {
    const min: BlindBoxPlan = {
      planId: 'plan-min',
      name: '最小保底',
      tiers: [],
      guaranteePityCount: 1,
      status: BlindBoxStatus.ACTIVE,
      createdAt: new Date(),
    }
    assert.ok(min.guaranteePityCount >= 1)

    const plan: BlindBoxPlan = {
      planId: 'plan-high',
      name: '高保底',
      tiers: [],
      guaranteePityCount: 100,
      status: BlindBoxStatus.ACTIVE,
      createdAt: new Date(),
    }
    assert.equal(plan.guaranteePityCount, 100)
  })

  it('tiers can be an empty array', () => {
    const plan: BlindBoxPlan = {
      planId: 'plan-empty',
      name: '空计划',
      tiers: [],
      guaranteePityCount: 10,
      status: BlindBoxStatus.DRAFT,
      createdAt: new Date(),
    }
    assert.equal(plan.tiers.length, 0)
  })
})

// ── BlindBoxDrawRecord interface ──────────────────────────────
describe('blindbox.entity: BlindBoxDrawRecord', () => {
  it('creates a valid single draw record', () => {
    const record: BlindBoxDrawRecord = {
      recordId: 'rec-001',
      planId: 'plan-001',
      userId: 'user-123',
      tier: 'SSR',
      prizeId: 'p1',
      prizeName: 'SSR剑',
      drawType: DrawType.SINGLE,
      createdAt: new Date(),
    }

    assert.equal(record.recordId, 'rec-001')
    assert.equal(record.planId, 'plan-001')
    assert.equal(record.userId, 'user-123')
    assert.equal(record.tier, 'SSR')
    assert.equal(record.prizeId, 'p1')
    assert.equal(record.prizeName, 'SSR剑')
    assert.equal(record.drawType, DrawType.SINGLE)
    assert.ok(record.createdAt instanceof Date)
  })

  it('creates a valid batch10 draw record', () => {
    const batch: BlindBoxDrawRecord = {
      recordId: 'rec-batch',
      planId: 'plan-001',
      userId: 'user-456',
      tier: 'R',
      prizeId: 'p-common',
      prizeName: '普通',
      drawType: DrawType.BATCH10,
      createdAt: new Date(),
    }
    assert.equal(batch.drawType, DrawType.BATCH10)
  })

  it('recordId is unique per record', () => {
    const r1: BlindBoxDrawRecord = {
      recordId: 'rec-u1',
      planId: 'plan-001',
      userId: 'user-1',
      tier: 'SR',
      prizeId: 'p-sr',
      prizeName: 'SR',
      drawType: DrawType.SINGLE,
      createdAt: new Date(),
    }
    const r2: BlindBoxDrawRecord = {
      recordId: 'rec-u2',
      planId: 'plan-002',
      userId: 'user-1',
      tier: 'SSR',
      prizeId: 'p-ssr',
      prizeName: 'SSR',
      drawType: DrawType.SINGLE,
      createdAt: new Date(),
    }
    assert.notEqual(r1.recordId, r2.recordId)
  })

  it('createdAt is a Date object representing draw time', () => {
    const before = new Date()
    const record: BlindBoxDrawRecord = {
      recordId: 'rec-time',
      planId: 'plan-001',
      userId: 'user-1',
      tier: 'N',
      prizeId: 'p-n',
      prizeName: '普通',
      drawType: DrawType.SINGLE,
      createdAt: before,
    }
    assert.ok(record.createdAt.getTime() <= before.getTime())
  })
})

// ── Cross-interface contract checks ───────────────────────────
describe('blindbox.entity: cross-interface contracts', () => {
  it('BlindBoxPlan tier items conform to BlindBoxTier', () => {
    const tier: BlindBoxTier = {
      tierId: 't1',
      name: 'SR',
      probability: 0.2,
      prizes: [{ prizeId: 'p1', name: '刀', stock: 10, weight: 1 }],
    }
    const plan: BlindBoxPlan = {
      planId: 'plan-x',
      name: '合同验证',
      tiers: [tier],
      guaranteePityCount: 10,
      status: BlindBoxStatus.ACTIVE,
      createdAt: new Date(),
    }

    assert.equal(plan.tiers[0].prizes[0].prizeId, 'p1')
    assert.equal(plan.tiers[0].probability, 0.2)
  })

  it('BlindBoxDrawRecord references planId from BlindBoxPlan', () => {
    const plan: BlindBoxPlan = {
      planId: 'plan-ref',
      name: '引用',
      tiers: [],
      guaranteePityCount: 10,
      status: BlindBoxStatus.ACTIVE,
      createdAt: new Date(),
    }
    const record: BlindBoxDrawRecord = {
      recordId: 'rec-ref',
      planId: plan.planId,
      userId: 'user-1',
      tier: 'N',
      prizeId: 'p-n',
      prizeName: '普通',
      drawType: DrawType.SINGLE,
      createdAt: new Date(),
    }

    assert.equal(record.planId, plan.planId)
  })
})
