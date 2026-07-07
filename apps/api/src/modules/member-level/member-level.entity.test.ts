import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * member-level entity 测试
 * 验证 6阶18级枚举、阈值、等级信息等类型定义
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberLevelTier, MemberLevelSub, MemberLevelTier as Tier, MemberLevelSub as Sub } from './member-level.entity'

describe('MemberLevelEntity - 枚举与类型定义', () => {
  describe('MemberLevelTier 枚举', () => {
    it('应包含全部6个阶', () => {
      const tiers = Object.values(MemberLevelTier) as string[]
      assert.equal(tiers.length, 6)
      assert.ok(tiers.includes('REGULAR'))
      assert.ok(tiers.includes('VIP'))
      assert.ok(tiers.includes('SVIP'))
      assert.ok(tiers.includes('DIAMOND'))
      assert.ok(tiers.includes('LEGEND'))
      assert.ok(tiers.includes('MYTH'))
    })
  })

  describe('MemberLevelSub 枚举', () => {
    it('应包含3个子级', () => {
      const subs = Object.values(MemberLevelSub) as string[]
      assert.equal(subs.length, 3)
      assert.ok(subs.includes('L1'))
      assert.ok(subs.includes('L2'))
      assert.ok(subs.includes('L3'))
    })
  })

  describe('类型组合', () => {
    it('MemberLevelKey 应为 tier_sub 格式', () => {
      const key: `${Tier}_${Sub}` = `${Tier.VIP}_${Sub.L2}`
      assert.equal(key, 'VIP_L2')
    })

    it('所有可能的等级KEY应合法', () => {
      const allKeys: string[] = []
      for (const tier of Object.values(Tier)) {
        for (const sub of Object.values(Sub)) {
          allKeys.push(`${tier}_${sub}`)
        }
      }
      assert.equal(allKeys.length, 18)
      assert.ok(allKeys.includes('REGULAR_L1'))
      assert.ok(allKeys.includes('MYTH_L3'))
    })
  })
})
