export type PromotionRuleStatus = 'active' | 'scheduled' | 'draft'

export interface PromotionRule {
  id: string
  name: string
  type: string
  status: PromotionRuleStatus
  period: string
  condition: string
  owner: string
}

export interface PromotionTypeInfo {
  name: string
  description: string
  channel: string
}

export interface PromotionRulesSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-promotion-rules-snapshot'
  rules: PromotionRule[]
  promotionTypes: PromotionTypeInfo[]
  generatedAt: string
}

export const PROMOTION_RULES: PromotionRule[] = [
  { id: 'pr-001', name: '618 满 200 减 50', type: '满减', status: 'active', period: '2026-06-18 ~ 2026-06-20', condition: '订单满 200 元减 50 元', owner: '运营中台' },
  { id: 'pr-002', name: '全场 9 折', type: '折扣', status: 'active', period: '2026-07-01 ~ 2026-07-31', condition: '全场商品 9 折，最高减 50 元', owner: '会员营销组' },
  { id: 'pr-003', name: '满 99 包邮', type: '包邮', status: 'scheduled', period: '2026-08-01 ~ 2026-08-31', condition: '订单满 99 元免运费', owner: '电商履约组' },
  { id: 'pr-004', name: '周末秒杀', type: '秒杀', status: 'draft', period: '待排期', condition: '指定 SKU 限时特价', owner: '商品运营组' },
]

export const PROMOTION_TYPES: PromotionTypeInfo[] = [
  { name: '满减', description: '订单满额立减固定金额。', channel: '线上商城 / 收银台' },
  { name: '折扣', description: '按百分比打折，可设置封顶金额。', channel: '全渠道' },
  { name: '赠品', description: '满足条件赠送指定商品或礼品券。', channel: '门店活动 / 会员日' },
  { name: '包邮', description: '订单满额或指定区域免运费。', channel: '电商履约' },
  { name: '加价购', description: '加价换购指定商品，提高连带率。', channel: '门店 / 小程序' },
  { name: '秒杀', description: '限时限量特价活动，需库存联动。', channel: '线上大促' },
]

export function filterPromotionRules(
  rules: PromotionRule[],
  activeStatus: PromotionRuleStatus | 'all',
  searchText: string,
) {
  return rules.filter((rule) => {
    if (activeStatus !== 'all' && rule.status !== activeStatus) return false
    if (!searchText) return true
    const query = searchText.toLowerCase()
    return (
      rule.name.toLowerCase().includes(query) ||
      rule.type.toLowerCase().includes(query) ||
      rule.condition.toLowerCase().includes(query)
    )
  })
}

export async function loadPromotionRulesSnapshot(): Promise<PromotionRulesSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-promotion-rules-snapshot',
    rules: PROMOTION_RULES,
    promotionTypes: PROMOTION_TYPES,
    generatedAt: new Date().toISOString(),
  }
}
