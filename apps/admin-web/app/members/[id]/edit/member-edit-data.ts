import type { MemberDetail } from '../../../members-data';
import { loadAdminMemberDetail } from '../../../members-view-model';

export interface MemberEditPageSnapshot {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: string;
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  memberId: string;
  member: MemberDetail | null;
  error?: string;
}

export async function loadMemberEditPageSnapshot(
  memberId: string
): Promise<MemberEditPageSnapshot> {
  const detail = await loadAdminMemberDetail(memberId);

  return {
    deliveryMode: detail.deliveryMode,
    sourceLabel:
      detail.deliveryMode === 'api'
        ? 'member detail api snapshot'
        : 'member detail fallback snapshot',
    generatedAt: new Date().toISOString(),
    controlPlaneSource:
      detail.deliveryMode === 'api'
        ? 'loadMemberEditPageSnapshot -> loadAdminMemberDetail -> /members/persistent/:id'
        : 'loadMemberEditPageSnapshot -> loadAdminMemberDetail fallback -> MOCK_MEMBER_DETAILS',
    businessDataSource:
      detail.deliveryMode === 'api' ? 'persistent member detail record' : 'local member detail sample',
    refreshPath: 'EditMemberPage -> loadMemberEditPageSnapshot',
    note:
      detail.deliveryMode === 'api'
        ? '当前页面直接消费会员详情服务端快照。'
        : '当前页面已回退到本地会员详情样本，不可作为闭环复签证据。',
    memberId,
    member: detail.member,
    error: detail.member ? undefined : '未找到对应会员档案。',
  };
}
