export interface MembershipLevel {
  level: number
  name: string
  minPoints: number
  discount: string
  benefits: string
  serviceLevel: string
}

export interface MembershipRule {
  title: string
  description: string
}

export interface MembershipLevelsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-membership-levels-snapshot'
  levels: MembershipLevel[]
  rules: MembershipRule[]
  generatedAt: string
}

export const MEMBERSHIP_LEVELS: MembershipLevel[] = [
  { level: 1, name: '普通会员', minPoints: 0, discount: '无折扣', benefits: '基础服务、生日礼券', serviceLevel: '标准服务' },
  { level: 2, name: '银卡会员', minPoints: 1000, discount: '9.5 折', benefits: '基础服务、生日礼券、折扣优惠', serviceLevel: '优先排队' },
  { level: 3, name: '金卡会员', minPoints: 5000, discount: '9 折', benefits: '折扣优惠、免运费、优先服务', serviceLevel: '专属客服' },
  { level: 4, name: '钻石会员', minPoints: 20000, discount: '8.5 折', benefits: '全部特权、专属客服、生日礼物', serviceLevel: 'VIP 绿色通道' },
]

export const MEMBERSHIP_RULES: MembershipRule[] = [
  { title: '升级门槛', description: '积分达到阈值或累计消费达到指定金额后自动升级。' },
  { title: '降级保护', description: '等级每 12 个月重评，未达标则自动降级一级。' },
  { title: '权益刷新', description: '等级变化后次日 00:00 同步权益包与折扣合同。' },
  { title: '人工兜底', description: '门店店长可申请临时保级，但需运营中心审批。' },
]

export function summarizeMembershipLevels(levels: MembershipLevel[]) {
  const highestLevel = levels[levels.length - 1]
  return {
    totalLevels: levels.length,
    highestThreshold: highestLevel?.minPoints ?? 0,
    exclusiveServiceCount: levels.filter((item) => item.serviceLevel.includes('专属') || item.serviceLevel.includes('VIP')).length,
  }
}

export async function loadMembershipLevelsSnapshot(): Promise<MembershipLevelsSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-membership-levels-snapshot',
    levels: MEMBERSHIP_LEVELS,
    rules: MEMBERSHIP_RULES,
    generatedAt: new Date().toISOString(),
  }
}
