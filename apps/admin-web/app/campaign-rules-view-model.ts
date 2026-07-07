import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import type {
  PaginationMeta,
} from '@m5/types';
import type {
  RuleExecutionStatus,
} from '@m5/ui';

const FALLBACK_TENANT_ID = 'tenant-demo';
const FALLBACK_BRAND_ID = 'brand-demo';

export interface CampaignDecisionRule {
  id: string;
  name: string;
  description: string;
  status: RuleExecutionStatus;
  priority: number;
  condition: string;
  action: string;
  createdAt: string;
  updatedAt: string;
  hitCount: number;
  enabled: boolean;
}

export interface CampaignRulesQuery {
  search?: string;
  status?: RuleExecutionStatus | '';
  page?: number;
  pageSize?: number;
}

export interface CampaignRulesWorkspace {
  rules: CampaignDecisionRule[];
  pagination: PaginationMeta;
}

export interface CampaignRulesSnapshot {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: CampaignRulesQuery;
  workspace: CampaignRulesWorkspace;
}

function createClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID,
    brandId: FALLBACK_BRAND_ID,
    storeId: 'store-001',
    marketCode: 'cn-mainland',
  });
}

function buildFallbackRules(
  query: CampaignRulesQuery,
): CampaignDecisionRule[] {
  const allRules: CampaignDecisionRule[] = [
    { id: 'rule-001', name: '首单折扣规则', description: '会员首单自动享受 8 折优惠', status: 'passed' as RuleExecutionStatus, priority: 1, condition: 'isFirstOrder === true && memberLevel >= 1', action: 'applyDiscount(0.8)', createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-06-20T10:30:00Z', hitCount: 3421, enabled: true },
    { id: 'rule-002', name: '高消费返券规则', description: '单笔消费满 500 元返 50 元券', status: 'passed' as RuleExecutionStatus, priority: 2, condition: 'orderAmount >= 500', action: 'issueCoupon(coupon-50)', createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-06-18T14:00:00Z', hitCount: 1890, enabled: true },
    { id: 'rule-003', name: '生日月双倍积分', description: '会员生日月消费享双倍积分', status: 'passed' as RuleExecutionStatus, priority: 3, condition: 'isBirthdayMonth === true', action: 'multiplyPoints(2)', createdAt: '2026-01-10T07:00:00Z', updatedAt: '2026-06-15T09:00:00Z', hitCount: 567, enabled: true },
    { id: 'rule-004', name: '流失预警关怀规则', description: '30 天未活跃会员发送关怀消息', status: 'warning' as RuleExecutionStatus, priority: 4, condition: 'daysSinceLastVisit >= 30 && isMember === true', action: 'sendCareMessage()', createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-06-22T11:00:00Z', hitCount: 234, enabled: true },
    { id: 'rule-005', name: '大额订单审批规则', description: '单笔金额超 10000 元需人工审批', status: 'failed' as RuleExecutionStatus, priority: 5, condition: 'orderAmount > 10000', action: 'triggerApproval()', createdAt: '2026-02-15T08:00:00Z', updatedAt: '2026-06-10T16:00:00Z', hitCount: 45, enabled: false },
    { id: 'rule-006', name: '新客注册礼包规则', description: '新注册会员自动发放注册礼包', status: 'passed' as RuleExecutionStatus, priority: 6, condition: 'isNewRegistration === true', action: 'sendGiftPack()', createdAt: '2026-01-05T06:00:00Z', updatedAt: '2026-06-01T12:00:00Z', hitCount: 8765, enabled: true },
    { id: 'rule-007', name: '季节性促销规则', description: '换季商品自动触发促销活动', status: 'pending' as RuleExecutionStatus, priority: 7, condition: 'seasonalTag === "clearance" && stock > 100', action: 'startPromotion(15)', createdAt: '2026-05-01T08:00:00Z', updatedAt: '2026-06-25T08:00:00Z', hitCount: 0, enabled: false },
    { id: 'rule-008', name: 'VIP 专属折扣规则', description: '黄金及以上会员享 85 折', status: 'passed' as RuleExecutionStatus, priority: 8, condition: 'memberLevel >= 3', action: 'applyDiscount(0.85)', createdAt: '2026-01-20T07:00:00Z', updatedAt: '2026-06-19T15:00:00Z', hitCount: 1234, enabled: true },
    { id: 'rule-009', name: '库存预警补货规则', description: '库存低于安全水位自动发起补货', status: 'warning' as RuleExecutionStatus, priority: 9, condition: 'stockLevel < safetyStock', action: 'createReplenishmentOrder()', createdAt: '2026-04-10T09:00:00Z', updatedAt: '2026-06-23T10:00:00Z', hitCount: 89, enabled: true },
    { id: 'rule-010', name: '欺诈风险拦截规则', description: '短时间内多次下单触发风险拦截', status: 'failed' as RuleExecutionStatus, priority: 10, condition: 'orderCountInHour >= 5 && totalAmount > 2000', action: 'blockOrderAndNotify()', createdAt: '2026-03-15T10:00:00Z', updatedAt: '2026-06-24T17:00:00Z', hitCount: 12, enabled: false },
  ];

  let filtered = allRules;
  if (query.search?.trim()) {
    const q = query.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }
  if (query.status) {
    filtered = filtered.filter((r) => r.status === query.status);
  }

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return paged;
}

export async function loadCampaignRulesWorkspace(
  query: CampaignRulesQuery = {},
  init: RequestInit = {},
): Promise<CampaignRulesSnapshot> {
  const client = createClient();
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;

  try {
    const result = await client.getData<CampaignRulesWorkspace>('/campaign-rules', init);
    return {
      deliveryMode: 'api',
      generatedAt: new Date().toISOString(),
      query,
      workspace: result,
    };
  } catch {
    const rules = buildFallbackRules(query);
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      query,
      workspace: {
        rules,
        pagination: { page, pageSize, total: rules.length },
      },
    };
  }
}
