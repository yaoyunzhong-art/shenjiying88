/**
 * 🐜 自动: [svip] [A] dto.test.ts 补全
 *
 * 覆盖: SvipTierDto / CreateSvipMemberDto / SvipBenefitDto
 *       SvipUpgradeDto / UseSvipBenefitDto / SvipMemberQueryDto / SvipTierQueryDto
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  SvipTierDto,
  CreateSvipMemberDto,
  SvipBenefitDto,
  SvipUpgradeDto,
  UseSvipBenefitDto,
  SvipMemberQueryDto,
  SvipTierQueryDto
} from './svip.dto'

// ================================================================
// SvipTierDto
// ================================================================

describe('SvipTierDto', () => {
  test('有效输入应通过', async () => {
    const dto = plainToInstance(SvipTierDto, {
      name: '金卡会员',
      level: 2,
      minSpendAmount: 10000,
      minPoints: 2000,
      benefits: ['discount_90', 'priority_queue']
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('缺失必填字段应报错', async () => {
    const dto = plainToInstance(SvipTierDto, {})
    const errors = await validate(dto)
    assert.ok(errors.length >= 4)
    const props = errors.map((e) => e.property)
    assert.ok(props.includes('name'))
    assert.ok(props.includes('level'))
    assert.ok(props.includes('minSpendAmount'))
    assert.ok(props.includes('minPoints'))
  })

  test('level 超出范围(1-5)应报错', async () => {
    const dto = plainToInstance(SvipTierDto, {
      name: '无效等级',
      level: 10,
      minSpendAmount: 5000,
      minPoints: 500,
      benefits: []
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'level'))
  })

  test('level 小于 1 应报错', async () => {
    const dto = plainToInstance(SvipTierDto, {
      name: '负等级',
      level: 0,
      minSpendAmount: 100,
      minPoints: 10,
      benefits: []
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'level'))
  })

  test('负的金额应报错', async () => {
    const dto = plainToInstance(SvipTierDto, {
      name: '负金额',
      level: 1,
      minSpendAmount: -100,
      minPoints: 500,
      benefits: []
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'minSpendAmount'))
  })

  test('负的积分应报错', async () => {
    const dto = plainToInstance(SvipTierDto, {
      name: '负积分',
      level: 1,
      minSpendAmount: 1000,
      minPoints: -10,
      benefits: []
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'minPoints'))
  })

  test('id 和 icon 和 color 为可选', async () => {
    const dto = plainToInstance(SvipTierDto, {
      name: '测试',
      level: 3,
      minSpendAmount: 30000,
      minPoints: 6000,
      benefits: ['discount_88'],
      icon: 'vip-icon',
      color: '#888888'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('benefits 应为字符串数组', async () => {
    const dto = plainToInstance(SvipTierDto, {
      name: '测试',
      level: 1,
      minSpendAmount: 5000,
      minPoints: 500,
      benefits: 'not-an-array'
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'benefits'))
  })
})

// ================================================================
// CreateSvipMemberDto
// ================================================================

describe('CreateSvipMemberDto', () => {
  test('有效输入应通过', async () => {
    const dto = plainToInstance(CreateSvipMemberDto, {
      memberId: 'mem-001',
      tierId: 'tier-001',
      totalSpend: 6000,
      currentPoints: 600,
      expiresAt: '2025-06-01T00:00:00Z'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('缺失必填字段应报错', async () => {
    const dto = plainToInstance(CreateSvipMemberDto, {})
    const errors = await validate(dto)
    assert.ok(errors.length >= 3)
    const props = errors.map((e) => e.property)
    assert.ok(props.includes('memberId'))
    assert.ok(props.includes('tierId'))
  })

  test('无效日期格式应报错', async () => {
    const dto = plainToInstance(CreateSvipMemberDto, {
      memberId: 'mem-002',
      tierId: 'tier-001',
      totalSpend: 5000,
      currentPoints: 500,
      expiresAt: 'not-a-date'
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'expiresAt'))
  })

  test('负消费应报错', async () => {
    const dto = plainToInstance(CreateSvipMemberDto, {
      memberId: 'mem-003',
      tierId: 'tier-001',
      totalSpend: -100,
      currentPoints: 500,
      expiresAt: '2025-06-01T00:00:00Z'
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'totalSpend'))
  })

  test('brandId 和 storeId 为可选', async () => {
    const dto = plainToInstance(CreateSvipMemberDto, {
      memberId: 'mem-004',
      tierId: 'tier-001',
      totalSpend: 5000,
      currentPoints: 500,
      expiresAt: '2025-06-01T00:00:00Z',
      brandId: 'brand-1',
      storeId: 'store-1',
      autoRenew: true
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('joinedAt 可选', async () => {
    const dto = plainToInstance(CreateSvipMemberDto, {
      memberId: 'mem-005',
      tierId: 'tier-001',
      totalSpend: 5000,
      currentPoints: 500,
      expiresAt: '2025-06-01T00:00:00Z',
      joinedAt: '2024-01-01T00:00:00Z'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})

// ================================================================
// SvipBenefitDto
// ================================================================

describe('SvipBenefitDto', () => {
  test('有效输入应通过', async () => {
    const dto = plainToInstance(SvipBenefitDto, {
      tierId: 'tier-001',
      benefitType: 'discount',
      benefitValue: '95%',
      description: '95折优惠'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('缺失必填字段应报错', async () => {
    const dto = plainToInstance(SvipBenefitDto, {})
    const errors = await validate(dto)
    assert.ok(errors.length >= 3)
  })

  test('无效 benefitType 应报错', async () => {
    const dto = plainToInstance(SvipBenefitDto, {
      tierId: 'tier-001',
      benefitType: 'invalid_type',
      benefitValue: '95%',
      description: 'test'
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'benefitType'))
  })

  test('所有有效 benefitType 应通过', async () => {
    const types = ['discount', 'freeUpgrade', 'priorityQueue', 'vipRoom', 'exclusiveEvent']
    for (const bt of types) {
      const dto = plainToInstance(SvipBenefitDto, {
        tierId: 'tier-001',
        benefitType: bt,
        benefitValue: 'test',
        description: 'test'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0, `benefitType ${bt} 应有效`)
    }
  })

  test('id 和 isActive 为可选', async () => {
    const dto = plainToInstance(SvipBenefitDto, {
      tierId: 'tier-001',
      benefitType: 'discount',
      benefitValue: '90%',
      description: '9折',
      isActive: false
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})

// ================================================================
// SvipUpgradeDto
// ================================================================

describe('SvipUpgradeDto', () => {
  test('有效输入应通过 (TargetTierLevel)', async () => {
    const dto = plainToInstance(SvipUpgradeDto, {
      memberId: 'mem-001',
      targetTierLevel: 3,
      reason: '消费达标'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('缺失 memberId 应报错', async () => {
    const dto = plainToInstance(SvipUpgradeDto, { targetTierLevel: 2 })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'memberId'))
  })

  test('targetTierLevel 超出范围应报错', async () => {
    const dto = plainToInstance(SvipUpgradeDto, {
      memberId: 'mem-001',
      targetTierLevel: 10
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'targetTierLevel'))
  })

  test('targetTierLevel 小于 1 应报错', async () => {
    const dto = plainToInstance(SvipUpgradeDto, {
      memberId: 'mem-001',
      targetTierLevel: 0
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'targetTierLevel'))
  })

  test('所有可选字段不提供应通过', async () => {
    const dto = plainToInstance(SvipUpgradeDto, { memberId: 'mem-001' })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('totalSpend 和 currentPoints 可选', async () => {
    const dto = plainToInstance(SvipUpgradeDto, {
      memberId: 'mem-001',
      totalSpend: 30000,
      currentPoints: 6000
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('负的 totalSpend 应报错', async () => {
    const dto = plainToInstance(SvipUpgradeDto, {
      memberId: 'mem-001',
      totalSpend: -100
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'totalSpend'))
  })
})

// ================================================================
// UseSvipBenefitDto
// ================================================================

describe('UseSvipBenefitDto', () => {
  test('有效输入应通过', async () => {
    const dto = plainToInstance(UseSvipBenefitDto, {
      memberId: 'mem-001',
      benefitType: 'discount'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('缺失 memberId 应报错', async () => {
    const dto = plainToInstance(UseSvipBenefitDto, { benefitType: 'discount' })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'memberId'))
  })

  test('缺失 benefitType 应报错', async () => {
    const dto = plainToInstance(UseSvipBenefitDto, { memberId: 'mem-001' })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'benefitType'))
  })

  test('无效 benefitType 应报错', async () => {
    const dto = plainToInstance(UseSvipBenefitDto, {
      memberId: 'mem-001',
      benefitType: 'not_valid'
    })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'benefitType'))
  })

  test('referenceOrderId 和 referencePaymentId 可选', async () => {
    const dto = plainToInstance(UseSvipBenefitDto, {
      memberId: 'mem-001',
      benefitType: 'discount',
      referenceOrderId: 'order-001'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})

// ================================================================
// SvipMemberQueryDto
// ================================================================

describe('SvipMemberQueryDto', () => {
  test('所有字段为空应通过', async () => {
    const dto = plainToInstance(SvipMemberQueryDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('有效 status 应通过', async () => {
    const dto = plainToInstance(SvipMemberQueryDto, { status: 'active' })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('无效 status 应报错', async () => {
    const dto = plainToInstance(SvipMemberQueryDto, { status: 'invalid_status' })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'status'))
  })

  test('有效 tierLevel 应通过', async () => {
    const dto = plainToInstance(SvipMemberQueryDto, { tierLevel: 3 })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('tierLevel 超出范围应报错', async () => {
    const dto = plainToInstance(SvipMemberQueryDto, { tierLevel: 10 })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'tierLevel'))
  })

  test('tierLevel 小于 1 应报错', async () => {
    const dto = plainToInstance(SvipMemberQueryDto, { tierLevel: 0 })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'tierLevel'))
  })

  test('所有有效 status 枚举值应通过', async () => {
    for (const status of ['active', 'expired', 'frozen']) {
      const dto = plainToInstance(SvipMemberQueryDto, { status })
      const errors = await validate(dto)
      assert.equal(errors.length, 0, `status ${status} 应有效`)
    }
  })
})

// ================================================================
// SvipTierQueryDto
// ================================================================

describe('SvipTierQueryDto', () => {
  test('空查询应通过', async () => {
    const dto = plainToInstance(SvipTierQueryDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('有效 level 应通过', async () => {
    const dto = plainToInstance(SvipTierQueryDto, { level: 2 })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('level 小于 1 应报错', async () => {
    const dto = plainToInstance(SvipTierQueryDto, { level: 0 })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'level'))
  })

  test('level 大于 5 应报错', async () => {
    const dto = plainToInstance(SvipTierQueryDto, { level: 6 })
    const errors = await validate(dto)
    assert.ok(errors.some((e) => e.property === 'level'))
  })
})
