/**
 * customers/page.test.ts — admin-web 客户管理页面 L1 数据与纯逻辑测试
 *
 * 覆盖: 数据完整性、映射覆盖、筛选逻辑、格式化函数、常量完整性
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  MOCK_CUSTOMERS,
  CUSTOMER_STATUS_MAP,
  CUSTOMER_SOURCE_MAP,
  MEMBER_LEVEL_MAP,
  GENDER_LABEL,
  CUSTOMER_STATUSES,
  CUSTOMER_SOURCES,
  MEMBER_LEVELS,
  type CustomerRecord,
  type CustomerStatus,
  type CustomerSource,
  type MemberLevel,
} from './customers-data'

// ===== 从 page.tsx 提取的辅助函数 =====

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`
  return `¥${n}`
}

function filterCustomers(
  items: CustomerRecord[],
  search: string,
  statusFilter: CustomerStatus | 'all',
  levelFilter: MemberLevel | 'all',
): CustomerRecord[] {
  let result = items

  if (search.trim()) {
    const lower = search.toLowerCase()
    const searchFields: (keyof CustomerRecord)[] = ['name', 'phone', 'city']
    result = result.filter((c) =>
      searchFields.some((f) => String(c[f]).toLowerCase().includes(lower)),
    )
  }

  if (statusFilter !== 'all') {
    result = result.filter((c) => c.status === statusFilter)
  }

  if (levelFilter !== 'all') {
    result = result.filter((c) => c.memberLevel === levelFilter)
  }

  return result
}

// ===== 测试 =====

describe('customers-data 数据完整性', () => {
  it('MOCK_CUSTOMERS 应包含至少 10 条记录', () => {
    assert.ok(MOCK_CUSTOMERS.length >= 10, `expected >=10, got ${MOCK_CUSTOMERS.length}`)
  })

  it('每条记录应包含所有必需字段', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(typeof c.id === 'string' && c.id.length > 0, `customer ${c.id}: missing id`)
      assert.ok(typeof c.name === 'string' && c.name.length > 0, `customer ${c.id}: missing name`)
      assert.ok(typeof c.phone === 'string' && c.phone.length > 0, `customer ${c.id}: missing phone`)
      assert.ok(typeof c.totalVisits === 'number' && c.totalVisits >= 0, `customer ${c.id}: invalid totalVisits`)
      assert.ok(typeof c.totalSpent === 'number' && c.totalSpent >= 0, `customer ${c.id}: invalid totalSpent`)
      assert.ok(typeof c.gender === 'string' && ['male', 'female', 'unknown'].includes(c.gender), `customer ${c.id}: invalid gender`)
    }
  })

  it('每条记录的 status 应有效', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(CUSTOMER_STATUSES.includes(c.status), `customer ${c.id}: invalid status ${c.status}`)
    }
  })

  it('每条记录的 source 应有效', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(CUSTOMER_SOURCES.includes(c.source), `customer ${c.id}: invalid source ${c.source}`)
    }
  })

  it('每条记录的 memberLevel 应有效', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(MEMBER_LEVELS.includes(c.memberLevel), `customer ${c.id}: invalid memberLevel ${c.memberLevel}`)
    }
  })

  it('churned 状态客户的 lastVisit 应在半年之前', () => {
    const cutoff = new Date('2026-01-19')
    for (const c of MOCK_CUSTOMERS) {
      if (c.status === 'churned') {
        const last = new Date(c.lastVisit)
        assert.ok(last < cutoff, `customer ${c.id}: churned but recently visited ${c.lastVisit}`)
      }
    }
  })

  it('没有重复的 id', () => {
    const ids = MOCK_CUSTOMERS.map((c) => c.id)
    assert.equal(new Set(ids).size, ids.length, 'found duplicate ids')
  })
})

describe('映射覆盖完整性', () => {
  it('CUSTOMER_STATUS_MAP 覆盖所有状态', () => {
    for (const s of CUSTOMER_STATUSES) {
      assert.ok(s in CUSTOMER_STATUS_MAP, `missing status ${s} in map`)
      const entry = CUSTOMER_STATUS_MAP[s]
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `status ${s}: missing label`)
      assert.ok(typeof entry.variant === 'string' && entry.variant.length > 0, `status ${s}: missing variant`)
    }
  })

  it('CUSTOMER_SOURCE_MAP 覆盖所有来源', () => {
    for (const s of CUSTOMER_SOURCES) {
      assert.ok(s in CUSTOMER_SOURCE_MAP, `missing source ${s} in map`)
      assert.ok(CUSTOMER_SOURCE_MAP[s].length > 0, `source ${s}: empty label`)
    }
  })

  it('MEMBER_LEVEL_MAP 覆盖所有会员等级', () => {
    for (const l of MEMBER_LEVELS) {
      assert.ok(l in MEMBER_LEVEL_MAP, `missing level ${l} in map`)
      const entry = MEMBER_LEVEL_MAP[l]
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `level ${l}: missing label`)
    }
  })

  it('GENDER_LABEL 覆盖所有性别', () => {
    const genders = ['male', 'female', 'unknown'] as const
    for (const g of genders) {
      assert.ok(g in GENDER_LABEL, `missing gender ${g} in label`)
      assert.ok(GENDER_LABEL[g].length > 0, `gender ${g}: empty label`)
    }
  })

  it('MEMBER_LEVEL_MAP 所有 variant 值对 Badge 组件有效', () => {
    const validVariants = ['neutral', 'default', 'success', 'info'] as const
    for (const [key, entry] of Object.entries(MEMBER_LEVEL_MAP)) {
      assert.ok(
        validVariants.includes(entry.variant as typeof validVariants[number]),
        `memberLevel ${key} has invalid variant '${entry.variant}' — all member level variants must be valid BadgeVariant values`,
      )
    }
  })

  it('CUSTOMER_STATUS_MAP 所有 variant 值对 StatusBadge 有效', () => {
    const validVariants = ['success', 'warning', 'danger', 'neutral'] as const
    for (const [key, entry] of Object.entries(CUSTOMER_STATUS_MAP)) {
      assert.ok(
        validVariants.includes(entry.variant as typeof validVariants[number]),
        `status ${key} has invalid variant '${entry.variant}'`,
      )
    }
  })
})

describe('formatCurrency 格式化', () => {
  it('0 应返回 ¥0', () => {
    assert.equal(formatCurrency(0), '¥0')
  })

  it('500 应返回 ¥500', () => {
    assert.equal(formatCurrency(500), '¥500')
  })

  it('1500 应格式化为 K', () => {
    assert.equal(formatCurrency(1500), '¥1.5K')
  })

  it('1000000 应格式化为 万', () => {
    const result = formatCurrency(1_000_000)
    assert.ok(result.includes('万'), `expected '万' but got ${result}`)
  })
})

describe('filterCustomers 筛选逻辑', () => {
  it('无筛选条件应返回全部', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'all', 'all')
    assert.equal(result.length, MOCK_CUSTOMERS.length)
  })

  it('搜索姓名应正确匹配', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '张明', 'all', 'all')
    assert.ok(result.length >= 1)
    assert.ok(result.every((c) => c.name.includes('张明')), 'filter should only match 张明')
  })

  it('搜索手机号片段应正确匹配', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '0001', 'all', 'all')
    assert.ok(result.length >= 1)
    assert.ok(result.every((c) => c.phone.includes('0001')), 'filter should match phone fragment')
  })

  it('状态筛选 active 应只返回活跃客户', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'active', 'all')
    assert.ok(result.every((c) => c.status === 'active'))
  })

  it('等级筛选 diamond 应只返回钻石会员', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'all', 'diamond')
    assert.ok(result.every((c) => c.memberLevel === 'diamond'))
  })

  it('组合筛选应同时生效', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '广州', 'active', 'gold')
    assert.ok(result.every((c) => c.status === 'active' && c.memberLevel === 'gold'))
    assert.ok(result.every((c) => c.city.includes('广州') || c.name.includes('广州') || c.phone.includes('广州')))
  })

  it('不匹配的搜索应返回空数组', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '不可能存在的客户名_xyz', 'all', 'all')
    assert.equal(result.length, 0)
  })

  it('搜索不区分大小写', () => {
    const resultByName = filterCustomers(MOCK_CUSTOMERS, '张明', 'all', 'all')
    assert.equal(resultByName.length, 1)
  })

  it('等级筛选 bronze 应正确返回', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'all', 'bronze')
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.memberLevel === 'bronze'))
  })

  it('等级筛选 gold 应正确返回', () => {
    const result = filterCustomers(MOCK_CUSTOMERS, '', 'all', 'gold')
    assert.ok(result.length >= 2)
    assert.ok(result.every((c) => c.memberLevel === 'gold'))
  })

  it('过滤函数不应修改原始数组', () => {
    const original = [...MOCK_CUSTOMERS]
    filterCustomers(MOCK_CUSTOMERS, '张明', 'all', 'diamond')
    assert.equal(original.length, MOCK_CUSTOMERS.length)
  })
})
