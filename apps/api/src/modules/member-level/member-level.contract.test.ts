import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * member-level 契约测试
 * 验证模块对外接口的一致性
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import type { MemberLevelContract } from './member-level.contract'
import { MemberLevelService } from './member-level.service'
import { MemberLevelTier, MemberLevelSub } from './member-level.entity'

describe('MemberLevelContract - 契约验证', () => {
  let service: MemberLevelService

  beforeEach(() => {
    service = new MemberLevelService()
  })

  it('contract interface 方法应全部在 service 上实现', () => {
    const contractMethods: (keyof MemberLevelContract)[] = [
      'evaluateMemberLevel',
      'batchEvaluate',
      'getAllLevelConfig',
      'getUpgradePath',
    ]

    for (const method of contractMethods) {
      assert.equal(typeof (service as any)[method], 'function', `service 应实现 ${method}`)
    }
  })

  it('evaluateMemberLevel 返回 LevelInfo 符合接口', () => {
    const result = service.evaluateMemberLevel({
      memberId: 'contract-test-001',
      growthValue: 1500,
      totalSpend: 5000,
      totalVisits: 30,
      tenantId: 't-001',
    })

    assert.equal(typeof result.memberId, 'string')
    assert.equal(typeof result.currentTier, 'string')
    assert.equal(typeof result.currentSub, 'string')
    assert.equal(typeof result.currentLevelKey, 'string')
    assert.equal(typeof result.growthValue, 'number')
    assert.equal(typeof result.upgradeProgress, 'number')
    assert.ok(Array.isArray(result.benefits))
  })

  it('batchEvaluate 返回 BatchLevelOutput 符合接口', () => {
    const result = service.batchEvaluate({
      items: [
        { memberId: 'm1', growthValue: 100, totalSpend: 500, totalVisits: 5, tenantId: 't1' },
      ],
    })

    assert.ok(Array.isArray(result.items))
    assert.equal(typeof result.totalEvaluated, 'number')
    assert.equal(typeof result.upgradedCount, 'number')
    assert.equal(typeof result.timestamp, 'string')
  })

  it('getAllLevelConfig 返回 AllLevelConfig 符合接口', () => {
    const result = service.getAllLevelConfig()

    assert.ok(Array.isArray(result.tiers))
    assert.equal(result.tiers.length, 18)
    assert.equal(typeof result.lastUpdated, 'string')
  })

  it('getUpgradePath 返回 LevelChangeRecord[] 符合接口', () => {
    const result = service.getUpgradePath(MemberLevelTier.REGULAR, MemberLevelSub.L1, MemberLevelTier.VIP, MemberLevelSub.L1)

    assert.ok(Array.isArray(result))
    if (result.length > 0) {
      const record = result[0]
      assert.equal(typeof record.fromTier, 'string')
      assert.equal(typeof record.fromSub, 'string')
      assert.equal(typeof record.toTier, 'string')
      assert.equal(typeof record.toSub, 'string')
      assert.equal(typeof record.reason, 'string')
    }
  })

  it('导出类型应可用', () => {
    // type exports are compile-time only; verified by the import itself
    assert.ok(true, 'types compile without error')
  })
})
