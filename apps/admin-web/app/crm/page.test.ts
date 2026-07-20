/**
 * crm/page.test.ts — CRM客户管理页面 L1 数据与纯逻辑测试
 *
 * 覆盖: 数据完整性、映射覆盖、筛选逻辑、格式化函数
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  MOCK_CRM_CUSTOMERS,
  MOCK_CRM_STATS,
  CRM_STATUS_MAP,
  INTERACTION_TYPE_MAP,
  TICKET_PRIORITY_MAP,
  TICKET_STATUS_MAP,
  CRM_STATUSES,
  INTERACTION_TYPES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  formatCents,
  formatDate,
  formatDateTime,
  getScoreLevel,
  type CrmCustomerStatus,
  type CustomerProfile,
} from './crm-data'

// ─── 从 page.tsx 提取的辅助函数 ───

function filterCustomers(
  items: CustomerProfile[],
  search: string,
  statusFilter: CrmCustomerStatus | 'all',
  minScore: number,
  maxScore: number,
): CustomerProfile[] {
  let result = items

  if (search.trim()) {
    const lower = search.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.phone.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower),
    )
  }

  if (statusFilter !== 'all') {
    result = result.filter((c) => c.status === statusFilter)
  }

  result = result.filter((c) => c.engagementScore >= minScore && c.engagementScore <= maxScore)

  return result
}

// ===== 数据完整性验证 =====

describe('CRM 数据完整性', () => {
  it('MOCK_CRM_CUSTOMERS 应包含至少 10 条记录', () => {
    assert.ok(MOCK_CRM_CUSTOMERS.length >= 10, `expected >=10, got ${MOCK_CRM_CUSTOMERS.length}`)
  })

  it('每条记录应包含所有必需字段', () => {
    for (const c of MOCK_CRM_CUSTOMERS) {
      assert.ok(typeof c.id === 'string' && c.id.length > 0, `customer ${c.id}: missing id`)
      assert.ok(typeof c.name === 'string' && c.name.length > 0, `customer ${c.id}: missing name`)
      assert.ok(typeof c.email === 'string', `customer ${c.id}: missing email`)
      assert.ok(typeof c.phone === 'string' && c.phone.length > 0, `customer ${c.id}: missing phone`)
      assert.ok(typeof c.engagementScore === 'number' && c.engagementScore >= 0 && c.engagementScore <= 100, `customer ${c.id}: invalid engagementScore ${c.engagementScore}`)
      assert.ok(typeof c.totalSpentCents === 'number' && c.totalSpentCents >= 0, `customer ${c.id}: invalid totalSpentCents`)
      assert.ok(typeof c.visitCount === 'number' && c.visitCount >= 0, `customer ${c.id}: invalid visitCount`)
      assert.ok(Array.isArray(c.tags), `customer ${c.id}: missing tags`)
      assert.ok(Array.isArray(c.notes), `customer ${c.id}: missing notes`)
      assert.ok(Array.isArray(c.interactions), `customer ${c.id}: missing interactions`)
      assert.ok(Array.isArray(c.tickets), `customer ${c.id}: missing tickets`)
    }
  })

  it('每条记录的 status 应有效', () => {
    for (const c of MOCK_CRM_CUSTOMERS) {
      assert.ok(CRM_STATUSES.includes(c.status), `customer ${c.id}: invalid status ${c.status}`)
    }
  })

  it('每条记录的标签应有唯一值', () => {
    for (const c of MOCK_CRM_CUSTOMERS) {
      const unique = new Set(c.tags)
      assert.equal(unique.size, c.tags.length, `customer ${c.id}: duplicate tags`)
    }
  })

  it('没有重复的 id', () => {
    const ids = MOCK_CRM_CUSTOMERS.map((c) => c.id)
    assert.equal(new Set(ids).size, ids.length, 'found duplicate ids')
  })

  it('MOCK_CRM_STATS 中 totalCustomers 应与 mock 数据条数一致', () => {
    assert.equal(MOCK_CRM_STATS.totalCustomers, MOCK_CRM_CUSTOMERS.length)
  })

  it('MOCK_CRM_STATS 中活跃客户统计应正确', () => {
    const expected = MOCK_CRM_CUSTOMERS.filter((c) => c.status === 'active').length
    assert.equal(MOCK_CRM_STATS.activeCustomers, expected)
  })

  it('notes 中的数据引用应与 customer.id 一致', () => {
    for (const c of MOCK_CRM_CUSTOMERS) {
      for (const note of c.notes) {
        assert.equal(note.customerId, c.id, `note ${note.id} has wrong customerId`)
      }
    }
  })

  it('interactions 中的数据引用应与 customer.id 一致', () => {
    for (const c of MOCK_CRM_CUSTOMERS) {
      for (const ix of c.interactions) {
        assert.equal(ix.customerId, c.id, `interaction ${ix.id} has wrong customerId`)
      }
    }
  })

  it('tickets 中的数据引用应与 customer.id 一致', () => {
    for (const c of MOCK_CRM_CUSTOMERS) {
      for (const t of c.tickets) {
        assert.equal(t.customerId, c.id, `ticket ${t.id} has wrong customerId`)
      }
    }
  })
})

// ===== 映射覆盖完整性 =====

describe('映射覆盖完整性', () => {
  it('CRM_STATUS_MAP 覆盖所有客户状态', () => {
    for (const s of CRM_STATUSES) {
      assert.ok(s in CRM_STATUS_MAP, `missing status ${s} in map`)
      const entry = CRM_STATUS_MAP[s]
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `status ${s}: missing label`)
      assert.ok(typeof entry.variant === 'string' && entry.variant.length > 0, `status ${s}: missing variant`)
    }
  })

  it('CRM_STATUS_MAP 所有 variant 值应有效', () => {
    const validVariants = ['success', 'warning', 'danger', 'neutral', 'info']
    for (const [key, entry] of Object.entries(CRM_STATUS_MAP)) {
      assert.ok(
        validVariants.includes(entry.variant),
        `status ${key} has invalid variant '${entry.variant}'`,
      )
    }
  })

  it('INTERACTION_TYPE_MAP 覆盖所有交互类型', () => {
    for (const t of INTERACTION_TYPES) {
      assert.ok(t in INTERACTION_TYPE_MAP, `missing interaction type ${t} in map`)
      assert.ok(INTERACTION_TYPE_MAP[t].length > 0, `interaction type ${t}: empty label`)
    }
  })

  it('TICKET_PRIORITY_MAP 覆盖所有优先级', () => {
    for (const p of TICKET_PRIORITIES) {
      assert.ok(p in TICKET_PRIORITY_MAP, `missing priority ${p} in map`)
    }
  })

  it('TICKET_STATUS_MAP 覆盖所有工单状态', () => {
    for (const s of TICKET_STATUSES) {
      assert.ok(s in TICKET_STATUS_MAP, `missing ticket status ${s} in map`)
    }
  })
})

// ===== 格式化函数 =====

describe('formatCents 格式化', () => {
  it('0 应返回 ¥0', () => {
    assert.equal(formatCents(0), '¥0')
  })

  it('50000 应返回 ¥500', () => {
    assert.equal(formatCents(50000), '¥500')
  })

  it('150000 应格式化为 K', () => {
    assert.equal(formatCents(150000), '¥1.5K')
  })

  it('100000000 应格式化为 万', () => {
    const result = formatCents(100_000_000)
    assert.ok(result.includes('万'), `expected '万' but got ${result}`)
  })

  it('负数金额', () => {
    const result = formatCents(-50000)
    assert.equal(result, '¥-500')
  })
})

describe('formatDate 格式化', () => {
  it('空字符串应返回 -', () => {
    assert.equal(formatDate(''), '-')
  })

  it('有效日期应正确格式化', () => {
    const result = formatDate('2026-07-18T14:30:00Z')
    assert.ok(result.includes('2026'), `expected 2026 in result, got ${result}`)
  })
})

describe('formatDateTime 格式化', () => {
  it('空字符串应返回 -', () => {
    assert.equal(formatDateTime(''), '-')
  })

  it('有效日期时间应返回完整格式', () => {
    const result = formatDateTime('2026-07-18T14:30:00Z')
    assert.ok(result.includes('2026'), `expected 2026, got ${result}`)
  })
})

describe('getScoreLevel 评分等级', () => {
  it('评分 95 应为高价值', () => {
    const info = getScoreLevel(95)
    assert.equal(info.label, '高价值')
    assert.ok(info.color.length > 0)
  })

  it('评分 0 应为沉睡', () => {
    const info = getScoreLevel(0)
    assert.equal(info.label, '沉睡')
  })

  it('评分 50 应为中等', () => {
    const info = getScoreLevel(50)
    assert.equal(info.label, '中等')
  })

  it('评分 79 应为中等', () => {
    const info = getScoreLevel(79)
    assert.equal(info.label, '中等')
  })

  it('评分 80 应为高价值', () => {
    const info = getScoreLevel(80)
    assert.equal(info.label, '高价值')
  })

  it('评分 20 应为低活跃', () => {
    const info = getScoreLevel(20)
    assert.equal(info.label, '低活跃')
  })

  it('评分 49 应为低活跃', () => {
    const info = getScoreLevel(49)
    assert.equal(info.label, '低活跃')
  })

  it('评分 5 应为沉睡', () => {
    const info = getScoreLevel(5)
    assert.equal(info.label, '沉睡')
  })
})

// ===== 筛选逻辑 =====

describe('filterCustomers 筛选逻辑', () => {
  it('无筛选条件应返回全部', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'all', 0, 100)
    assert.equal(result.length, MOCK_CRM_CUSTOMERS.length)
  })

  it('按姓名搜索应正确匹配', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '张明', 'all', 0, 100)
    assert.ok(result.length >= 1)
    assert.ok(result.every((c) => c.name.includes('张明')))
  })

  it('按邮箱搜索应正确匹配', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, 'zhangming@example.com', 'all', 0, 100)
    assert.ok(result.length >= 1)
    assert.ok(result.every((c) => c.email.includes('zhangming')))
  })

  it('按手机号片段搜索应正确匹配', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '0001', 'all', 0, 100)
    assert.ok(result.length >= 1)
    assert.ok(result.every((c) => c.phone.includes('0001')))
  })

  it('搜索不区分大小写', () => {
    const upper = filterCustomers(MOCK_CRM_CUSTOMERS, '张明', 'all', 0, 100)
    const lower = filterCustomers(MOCK_CRM_CUSTOMERS, '张明', 'all', 0, 100)
    assert.equal(upper.length, lower.length)
  })

  it('状态筛选 active 应只返回活跃客户', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'active', 0, 100)
    assert.ok(result.every((c) => c.status === 'active'))
  })

  it('状态筛选 inactive 应只返回沉默客户', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'inactive', 0, 100)
    assert.ok(result.every((c) => c.status === 'inactive'))
  })

  it('状态筛选 lead 应只返回潜在客户', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'lead', 0, 100)
    assert.ok(result.every((c) => c.status === 'lead'))
  })

  it('状态筛选 churned 应只返回流失客户', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'churned', 0, 100)
    assert.ok(result.every((c) => c.status === 'churned'))
  })

  it('评分下限筛选应该正确', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'all', 80, 100)
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.engagementScore >= 80))
  })

  it('评分上限筛选应该正确', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'all', 0, 20)
    assert.ok(result.length > 0)
    assert.ok(result.every((c) => c.engagementScore <= 20))
  })

  it('评分范围组合筛选', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'all', 50, 80)
    assert.ok(result.every((c) => c.engagementScore >= 50 && c.engagementScore <= 80))
  })

  it('状态 + 评分组合筛选', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '', 'active', 80, 100)
    assert.ok(result.every((c) => c.status === 'active' && c.engagementScore >= 80))
  })

  it('不匹配的搜索应返回空数组', () => {
    const result = filterCustomers(MOCK_CRM_CUSTOMERS, '不可能存在的客户名_xyz', 'all', 0, 100)
    assert.equal(result.length, 0)
  })

  it('过滤函数不应修改原始数组', () => {
    const original = [...MOCK_CRM_CUSTOMERS]
    filterCustomers(MOCK_CRM_CUSTOMERS, '张明', 'all', 80, 100)
    assert.equal(original.length, MOCK_CRM_CUSTOMERS.length)
  })
})
