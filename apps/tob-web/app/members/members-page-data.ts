import { MOCK_MEMBERS, type MemberItem } from '../members-data';

export interface MembersPageSnapshot {
  deliveryMode: 'fallback';
  generatedAt: string;
  members: MemberItem[];
  error: string;
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

export async function loadMembersSnapshot(): Promise<MembersPageSnapshot> {
  return {
    deliveryMode: 'fallback',
    generatedAt: new Date().toISOString(),
    members: cloneValue(MOCK_MEMBERS),
    error: '当前页面展示本地会员样本快照，来源态仅可用于结构验收，不可作为闭环复签证据。',
  };
}
