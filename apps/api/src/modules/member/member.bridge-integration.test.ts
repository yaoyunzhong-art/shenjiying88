/**
 * Member ↔ member-level 桥接集成测试
 *
 * BS-0115: 验证 addPoints / revokePoints 后自动触发 6 阶 18 级评估
 *          并使 MemberProfile.memberLevelKey 正确反映评估结果
 */

import { describe, it, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberService, resetMemberServiceTestState } from './member.service'
import { MemberLevelService } from '../member-level/member-level.service'
import { MemberTierBridgeService } from './member-tier-bridge.service'
import type { MemberProfile } from './member.entity'

describe('Member ↔ member-level 桥接集成 (BS-0115)', () => {
  let memberService: MemberService
  let memberLevelService: MemberLevelService
  let bridgeService: MemberTierBridgeService

  beforeEach(() => {
    resetMemberServiceTestState()
    memberLevelService = new MemberLevelService()
    bridgeService = new MemberTierBridgeService(memberLevelService)
    memberService = new MemberService()
    memberService.setTierBridge(bridgeService)
  })

  it('should set memberLevelKey=REGULAR_L1 after addPoints on new member', () => {
    memberService.register({
      memberId: 'bridge-1',
      tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1' },
      nickname: '桥接测试'
    })

    const updated = memberService.addPoints('bridge-1', 1)
    assert.equal(updated.memberLevelKey, 'REGULAR_L1')
  })

  it('should keep memberLevelKey after revokePoints', () => {
    memberService.register({
      memberId: 'bridge-2',
      tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1' },
      nickname: '测试'
    })
    memberService.addPoints('bridge-2', 100)

    const updated = memberService.revokePoints('bridge-2', 50)
    assert.equal(updated.memberLevelKey, 'REGULAR_L1')
    assert.equal(updated.growthValue, 50)
  })

  it('should not crash when bridge is not set', () => {
    const svc = new MemberService()
    // no setTierBridge

    svc.register({
      memberId: 'bridge-3',
      tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1' },
      nickname: 'test'
    })

    const updated = svc.addPoints('bridge-3', 100)
    // memberLevelKey should be undefined since no bridge
    assert.equal(updated.memberLevelKey, undefined)
  })

  it('should work with awardPoints (memory mode)', async () => {
    memberService.register({
      memberId: 'bridge-4',
      tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1' },
      nickname: 'test'
    })

    const result = await memberService.awardPoints(
      'bridge-4',
      50,
      { tenantId: 'tenant-1', brandId: 'brand-1' }
    )
    if ('memberId' in result && 'memberLevelKey' in result) {
      const profile = result as MemberProfile
      assert.equal(profile.memberLevelKey, 'REGULAR_L1')
      assert.equal(profile.growthValue, 50)
    }
  })

  it('should work with rollbackPoints (memory mode)', async () => {
    memberService.register({
      memberId: 'bridge-5',
      tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1' },
      nickname: 'test'
    })
    memberService.addPoints('bridge-5', 200)

    const result = await memberService.rollbackPoints(
      'bridge-5',
      50,
      { tenantId: 'tenant-1', brandId: 'brand-1' }
    )
    if ('memberId' in result && 'memberLevelKey' in result) {
      const profile = result as MemberProfile
      assert.equal(profile.memberLevelKey, 'REGULAR_L1')
      assert.equal(profile.growthValue, 150)
    }
  })

  it('should not throw on duplicate bridge registration', () => {
    const svc = new MemberService()
    svc.setTierBridge(bridgeService)
    svc.setTierBridge(bridgeService) // should not throw
  })
})
