export type DiscountRuleStatus = 'active' | 'scheduled' | 'inactive' | 'expired'
export type DiscountRuleType = 'percentage' | 'fixed' | 'bundle' | 'shipping'

export interface DiscountRuleRecord {
  id: string
  name: string
  type: DiscountRuleType
  status: DiscountRuleStatus
  scope: string
  benefitLabel: string
  usageCount: number
  quota: number
  startsAt: string
  endsAt: string
}

export interface DiscountRulesSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-discount-rules-snapshot'
  rules: DiscountRuleRecord[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export const SHOP_DISCOUNT_RULES: DiscountRuleRecord[] = [
  {
    id: 'dr-001',
    name: '新客首单 9 折',
    type: 'percentage',
    status: 'active',
    scope: '全场首单',
    benefitLabel: '订单金额 10% off，上限 ¥50',
    usageCount: 1280,
    quota: 5000,
    startsAt: '2026-07-01',
    endsAt: '2026-08-31',
  },
  {
    id: 'dr-002',
    name: '满 200 减 30',
    type: 'fixed',
    status: 'active',
    scope: '购物车满额',
    benefitLabel: '每单立减 ¥30',
    usageCount: 4260,
    quota: 9999,
    startsAt: '2026-07-01',
    endsAt: '2026-09-30',
  },
  {
    id: 'dr-003',
    name: '暑期买二赠一',
    type: 'bundle',
    status: 'scheduled',
    scope: '玩具类商品',
    benefitLabel: '指定 SKU 买二赠一',
    usageCount: 0,
    quota: 2400,
    startsAt: '2026-08-01',
    endsAt: '2026-08-20',
  },
  {
    id: 'dr-004',
    name: 'VIP 包邮',
    type: 'shipping',
    status: 'inactive',
    scope: '会员标签 VIP',
    benefitLabel: '订单免基础运费',
    usageCount: 860,
    quota: 12000,
    startsAt: '2026-06-01',
    endsAt: '2026-12-31',
  },
  {
    id: 'dr-005',
    name: '春季复购券',
    type: 'fixed',
    status: 'expired',
    scope: '复购用户',
    benefitLabel: '满 ¥150 减 ¥20',
    usageCount: 532,
    quota: 1800,
    startsAt: '2026-03-01',
    endsAt: '2026-05-31',
  },
]

export async function loadDiscountRulesSnapshot(): Promise<DiscountRulesSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-discount-rules-snapshot',
    rules: SHOP_DISCOUNT_RULES,
    generatedAt: '2026-07-27T09:40:00.000Z',
    controlPlaneSource: 'loadDiscountRulesSnapshot -> SHOP_DISCOUNT_RULES',
    businessDataSource: 'local discount rule sample records',
    refreshPath: 'DiscountRulesPage -> loadDiscountRulesSnapshot',
    note: '当前页面消费本地折扣规则快照，适用于结构固证与列表交互演示。',
  }
}
