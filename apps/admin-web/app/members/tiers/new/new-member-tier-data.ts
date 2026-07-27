export interface NewMemberTierFormData {
  key: string;
  name: string;
  minPoints: string;
  maxPoints: string;
  discountRate: string;
  notes: string;
}

export interface NewMemberTierPageSnapshot {
  deliveryMode: 'fallback';
  sourceLabel: 'members-tier-new-fallback';
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  formDefaults: NewMemberTierFormData;
}

export async function loadNewMemberTierPageSnapshot(): Promise<NewMemberTierPageSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'members-tier-new-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadNewMemberTierPageSnapshot -> local tier create template',
    businessDataSource: 'local new tier form defaults',
    refreshPath: 'NewMemberTierPage -> loadNewMemberTierPageSnapshot',
    note: '新建会员等级页当前仍使用本地等级模板和显式 fallback 证据。',
    formDefaults: { key: '', name: '', minPoints: '', maxPoints: '', discountRate: '', notes: '' },
  };
}
