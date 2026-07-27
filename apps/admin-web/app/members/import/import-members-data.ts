import type { MemberStatus, MemberTier } from '../../members-data';

export type ImportStage = 'upload' | 'preview' | 'confirming' | 'result';

export interface ImportRecord {
  row: number;
  name: string;
  phone: string;
  email: string;
  tier: string;
  storeName: string;
  marketCode: string;
  notes: string;
  validationErrors: string[];
  isValid: boolean;
}

export interface ImportProgress {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export interface ImportConfig {
  duplicateCheck: 'phone' | 'name' | 'none';
  defaultTier: MemberTier;
  defaultStatus: MemberStatus;
  defaultMarket: string;
  sendWelcomeMessage: boolean;
}

export interface ImportMembersPageSnapshot {
  deliveryMode: 'fallback';
  sourceLabel: 'members-import-fallback';
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  defaultConfig: ImportConfig;
  templateHeaders: string[];
  previewRecords: ImportRecord[];
}

export async function loadImportMembersPageSnapshot(): Promise<ImportMembersPageSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'members-import-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadImportMembersPageSnapshot -> local import schema defaults',
    businessDataSource: 'local import preview rows + config presets',
    refreshPath: 'ImportMembersPage -> loadImportMembersPageSnapshot',
    note: '批量导入页当前使用本地预览样例和显式 fallback 证据，导入执行仅演示校验与结果聚合。',
    defaultConfig: {
      duplicateCheck: 'phone',
      defaultTier: 'standard',
      defaultStatus: 'active',
      defaultMarket: 'cn-mainland',
      sendWelcomeMessage: false,
    },
    templateHeaders: ['姓名', '手机号', '邮箱', '等级', '门店', '市场', '备注'],
    previewRecords: [
      { row: 1, name: '张三', phone: '13800001111', email: 'zhangsan@example.com', tier: 'gold', storeName: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', notes: '新入职员工推荐', validationErrors: [], isValid: true },
      { row: 2, name: '李四', phone: '13900002222', email: 'lisi@example.com', tier: 'silver', storeName: '上海陆家嘴中心店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
      { row: 3, name: '', phone: '13600004444', email: 'test@', tier: 'diamond', storeName: '广州天河城店', marketCode: 'cn-mainland', notes: '', validationErrors: ['姓名为空'], isValid: false },
      { row: 4, name: '赵六', phone: '13500005555', email: 'zhaoliu@example.com', tier: 'invalid', storeName: '成都太古里体验店', marketCode: 'cn-mainland', notes: '', validationErrors: ['等级值无效'], isValid: false },
    ],
  };
}
