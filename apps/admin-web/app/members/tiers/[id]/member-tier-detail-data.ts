import { MOCK_MEMBER_LEVEL_CONFIGS, type MemberLevelConfig } from '../../../members-data';

export interface MemberTierDetailPageSnapshot {
  deliveryMode: 'fallback';
  sourceLabel: 'members-tier-detail-fallback';
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  tierId: string;
  tier: MemberLevelConfig | null;
  error?: string;
}

export async function loadMemberTierDetailPageSnapshot(tierId: string): Promise<MemberTierDetailPageSnapshot> {
  const tier = MOCK_MEMBER_LEVEL_CONFIGS.find((item) => item.id === tierId || item.key === tierId) ?? null;
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'members-tier-detail-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadMemberTierDetailPageSnapshot -> MOCK_MEMBER_LEVEL_CONFIGS',
    businessDataSource: tier ? 'local member tier detail sample' : 'local member tier detail miss',
    refreshPath: 'MemberTierDetailPage -> loadMemberTierDetailPageSnapshot',
    note: tier ? '等级详情页当前展示本地等级配置快照。' : '当前未命中等级详情，页面保留显式 fallback 缺失态证据。',
    tierId,
    tier,
    error: tier ? undefined : `未找到标识为 ${tierId} 的会员等级。`,
  };
}
