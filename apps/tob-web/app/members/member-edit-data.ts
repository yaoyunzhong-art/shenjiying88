import { MOCK_MEMBERS, type MemberItem } from '../members-data';

export interface MemberEditSnapshot {
  deliveryMode: 'fallback';
  generatedAt: string;
  member: MemberItem | null;
  error: string;
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

export async function loadMemberEditSnapshot(memberId: string): Promise<MemberEditSnapshot> {
  const member = MOCK_MEMBERS.find((item) => item.id === memberId) ?? null;

  return {
    deliveryMode: 'fallback',
    generatedAt: new Date().toISOString(),
    member: member ? cloneValue(member) : null,
    error: member
      ? '当前编辑页使用本地会员样本快照，保存仅用于结构验收，不会写回真实会员控制面。'
      : `会员ID ${memberId} 未命中本地会员样本。`,
  };
}
