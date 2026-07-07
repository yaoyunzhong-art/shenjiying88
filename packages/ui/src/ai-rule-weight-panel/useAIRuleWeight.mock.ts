import type { RuleWeightItem } from './types';

export function mockRuleWeights(): RuleWeightItem[] {
  return [
    { id: 'rule-1', name: '风控拦截', description: '高风险交易实时拦截权重', currentWeight: 85, adjustable: true, category: 'risk', enabled: true },
    { id: 'rule-2', name: '会员折扣阈值', description: '会员等级折扣触发阈值权重', currentWeight: 70, adjustable: true, category: 'member', enabled: true },
    { id: 'rule-3', name: '优惠券发放优先级', description: '优惠券人群发放优先级权重', currentWeight: 60, adjustable: true, category: 'promotion', enabled: true },
    { id: 'rule-4', name: '库存预警', description: '安全库存预警触发权重', currentWeight: 90, adjustable: false, category: 'stock', enabled: true },
    { id: 'rule-5', name: '排班倾向', description: '员工排班智能推荐权重', currentWeight: 40, adjustable: true, category: 'staff', enabled: false },
    { id: 'rule-6', name: '大促叠加策略', description: '大促期间优惠叠加策略权重', currentWeight: 55, adjustable: true, category: 'promotion', enabled: true },
  ];
}

export function useAIRuleWeight() {
  return {
    rules: mockRuleWeights(),
    loading: false,
    error: null,
  };
}
