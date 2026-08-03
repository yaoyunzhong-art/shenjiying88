import type { MemberTier } from '../../members-data';

export interface CreateMemberFormData {
  name: string;
  phone: string;
  email: string;
  tier: MemberTier;
  gender: 'male' | 'female' | 'other';
  birthday: string;
  wechatId: string;
  address: string;
  storeName: string;
  marketCode: string;
  notes: string;
  tags: string;
}

export interface CreateMemberPageSnapshot {
  deliveryMode: 'fallback';
  sourceLabel: 'members-create-fallback';
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  formDefaults: CreateMemberFormData;
  marketOptions: Array<{ value: string; label: string }>;
  tierOptions: Array<{ key: MemberTier; label: string }>;
  duplicatePhoneSamples: string[];
}

export async function loadCreateMemberPageSnapshot(): Promise<CreateMemberPageSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'members-create-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadCreateMemberPageSnapshot -> local onboarding defaults',
    businessDataSource: 'local member create schema + market and tier options',
    refreshPath: 'CreateMemberPage -> loadCreateMemberPageSnapshot',
    note: '新增会员页当前仍使用本地建档模板和显式 fallback 证据，提交结果为演示态。',
    formDefaults: {
      name: '',
      phone: '',
      email: '',
      tier: 'standard',
      gender: 'male',
      birthday: '',
      wechatId: '',
      address: '',
      storeName: '',
      marketCode: 'cn-mainland',
      notes: '',
      tags: '',
    },
    marketOptions: [
      { value: 'cn-mainland', label: '中国大陆' },
      { value: 'us-default', label: '美国' },
      { value: 'uk-default', label: '英国' },
      { value: 'jp-default', label: '日本' },
      { value: 'kr-default', label: '韩国' },
      { value: 'de-default', label: '德国' },
    ],
    tierOptions: [
      { key: 'diamond', label: '钻石卡' },
      { key: 'gold', label: '金卡' },
      { key: 'silver', label: '银卡' },
      { key: 'bronze', label: '铜卡' },
      { key: 'standard', label: '标准' },
    ],
    duplicatePhoneSamples: ['13800000000', '13900002222'],
  };
}
