import { MOCK_MEMBER_LEVEL_CONFIGS, type MemberLevelConfig } from '../../members-data';

export interface MemberTiersPageSnapshot {
  deliveryMode: 'fallback';
  sourceLabel: 'members-tiers-fallback';
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  tiers: MemberLevelConfig[];
}

export async function loadMemberTiersPageSnapshot(): Promise<MemberTiersPageSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'members-tiers-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadMemberTiersPageSnapshot -> MOCK_MEMBER_LEVEL_CONFIGS',
    businessDataSource: 'local member tier configs',
    refreshPath: 'MemberTiersPage -> loadMemberTiersPageSnapshot',
    note: '会员等级列表页当前展示本地等级配置快照，支持显式来源态证据和 fallback 刷新。',
    tiers: MOCK_MEMBER_LEVEL_CONFIGS,
  };
}
