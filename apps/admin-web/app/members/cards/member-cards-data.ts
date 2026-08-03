import { MOCK_MEMBER_CARDS, type MemberCard } from '../../members-data';

export interface MemberCardsPageSnapshot {
  deliveryMode: 'fallback';
  sourceLabel: 'members-cards-fallback';
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  cards: MemberCard[];
}

export async function loadMemberCardsPageSnapshot(): Promise<MemberCardsPageSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'members-cards-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadMemberCardsPageSnapshot -> MOCK_MEMBER_CARDS',
    businessDataSource: 'local member card samples',
    refreshPath: 'MemberCardsPage -> loadMemberCardsPageSnapshot',
    note: '会员卡管理页当前使用本地卡片样例和显式 fallback 证据，发行动作仅演示前端链路。',
    cards: MOCK_MEMBER_CARDS,
  };
}
