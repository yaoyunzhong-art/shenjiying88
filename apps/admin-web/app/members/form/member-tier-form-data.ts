export interface MemberTierFormValues {
  tierKey: string;
  tierName: string;
  minPoints: string;
  maxPoints: string;
  discountRate: string;
  benefitTypes: string[];
  status: 'active' | 'inactive';
  notes: string;
}

export interface MemberTierFormPageSnapshot {
  deliveryMode: 'fallback';
  sourceLabel: 'members-form-fallback';
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  benefitOptions: Array<{ value: string; label: string }>;
  formDefaults: MemberTierFormValues;
}

export async function loadMemberTierFormPageSnapshot(): Promise<MemberTierFormPageSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'members-form-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadMemberTierFormPageSnapshot -> local tier form template',
    businessDataSource: 'local member tier benefits schema',
    refreshPath: 'MemberTierFormPage -> loadMemberTierFormPageSnapshot',
    note: '会员等级表单页当前展示的是本地权益配置模板，提交与切换均为 fallback 演示态。',
    benefitOptions: [
      { value: 'discount', label: '折扣优惠' },
      { value: 'points_multiplier', label: '积分倍率' },
      { value: 'free_shipping', label: '免运费' },
      { value: 'birthday_gift', label: '生日礼包' },
    ],
    formDefaults: {
      tierKey: '',
      tierName: '',
      minPoints: '',
      maxPoints: '',
      discountRate: '',
      benefitTypes: [],
      status: 'inactive',
      notes: '',
    },
  };
}
