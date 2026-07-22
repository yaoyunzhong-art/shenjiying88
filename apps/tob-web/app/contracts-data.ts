/**
 * contracts-data.ts — 合同管理 mock 数据 (ToB)
 */

export type ContractStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'expiring_soon'
  | 'suspended'
  | 'terminated';

export type ContractType = 'subscription' | 'service' | 'license' | 'maintenance' | 'project';

export interface ContractItem {
  id: string;
  contractNo: string;
  title: string;
  /** 客户公司名称 */
  companyName: string;
  companyId: string;
  type: ContractType;
  status: ContractStatus;
  /** 合同金额 (元) */
  amount: number;
  /** 已付款金额 */
  paid: number;
  startDate: string;
  endDate: string;
  /** 签约人 */
  signatory: string;
  /** 续约次数 */
  renewalCount: number;
  /** 最近操作时间 */
  updatedAt: string;
  description?: string;
}

export const CONTRACT_STATUS_MAP: Record<
  ContractStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }
> = {
  draft: { label: '草稿', variant: 'neutral' },
  pending_approval: { label: '待审批', variant: 'info' },
  active: { label: '执行中', variant: 'success' },
  expiring_soon: { label: '即将到期', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
  terminated: { label: '已终止', variant: 'neutral' },
};

export const CONTRACT_TYPE_MAP: Record<ContractType, string> = {
  subscription: '订阅服务',
  service: '服务合同',
  license: '授权许可',
  maintenance: '维护合同',
  project: '项目合同',
};

export const CONTRACT_STATUSES: ContractStatus[] = [
  'draft',
  'pending_approval',
  'active',
  'expiring_soon',
  'suspended',
  'terminated',
];

export const CONTRACT_TYPES: ContractType[] = [
  'subscription',
  'service',
  'license',
  'maintenance',
  'project',
];

export function fmtAmount(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1_000).toFixed(1)}K`;
  return `¥${n}`;
}

export function daysUntil(dateStr: string): number {
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export const MOCK_CONTRACTS: ContractItem[] = [
  {
    id: 'co-001',
    contractNo: 'CT-2026-0001',
    title: '云帆科技 SaaS 订阅年度合同',
    companyName: '云帆科技集团有限公司',
    companyId: 'c-001',
    type: 'subscription',
    status: 'active',
    amount: 480000,
    paid: 480000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    signatory: '张伟',
    renewalCount: 3,
    updatedAt: '2026-06-23 14:30:00',
    description: '企业版全功能订阅，包含 500 用户席，月度数据分析报表等增值服务。',
  },
  {
    id: 'co-002',
    contractNo: 'CT-2026-0002',
    title: '星辰连锁门店管理系统',
    companyName: '星辰连锁超市',
    companyId: 'c-002',
    type: 'service',
    status: 'active',
    amount: 360000,
    paid: 180000,
    startDate: '2026-02-01',
    endDate: '2026-08-31',
    signatory: '李芳',
    renewalCount: 1,
    updatedAt: '2026-06-22 10:15:00',
    description: '连锁门店统一管理平台，覆盖 12 家门店的进销存和人员调度。',
  },
  {
    id: 'co-003',
    contractNo: 'CT-2026-0003',
    title: '汇通金融 API 授权许可',
    companyName: '汇通金融信息有限公司',
    companyId: 'c-003',
    type: 'license',
    status: 'active',
    amount: 960000,
    paid: 480000,
    startDate: '2026-03-15',
    endDate: '2027-03-14',
    signatory: '王强',
    renewalCount: 3,
    updatedAt: '2026-06-24 09:00:00',
    description: '高级 API 调用许可，每日 1000 万次调用配额，含 7×24 技术支持。',
  },
  {
    id: 'co-004',
    contractNo: 'CT-2026-0004',
    title: '明德教育数据中台项目',
    companyName: '明德教育科技有限公司',
    companyId: 'c-004',
    type: 'project',
    status: 'pending_approval',
    amount: 280000,
    paid: 0,
    startDate: '2026-07-01',
    endDate: '2026-10-31',
    signatory: '赵敏',
    renewalCount: 0,
    updatedAt: '2026-06-18 16:20:00',
    description: '教育数据中台一期项目，含数据采集、清洗和可视化大屏。',
  },
  {
    id: 'co-005',
    contractNo: 'CT-2026-0005',
    title: '博康医疗设备维护合同',
    companyName: '博康医疗器械有限公司',
    companyId: 'c-005',
    type: 'maintenance',
    status: 'expiring_soon',
    amount: 120000,
    paid: 120000,
    startDate: '2025-07-01',
    endDate: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })(),
    signatory: '刘洋',
    renewalCount: 1,
    updatedAt: '2026-06-21 11:45:00',
    description: '年度设备维护及软件更新服务，覆盖 45 台医疗终端。',
  },
  {
    id: 'co-006',
    contractNo: 'CT-2026-0006',
    title: '鼎新制造供应链升级服务',
    companyName: '鼎新制造集团',
    companyId: 'c-006',
    type: 'service',
    status: 'active',
    amount: 450000,
    paid: 225000,
    startDate: '2026-04-01',
    endDate: '2026-12-31',
    signatory: '陈军',
    renewalCount: 0,
    updatedAt: '2026-06-20 14:10:00',
    description: '供应链管理系统升级，含 12 家供应商对接和自动化采购流程。',
  },
  {
    id: 'co-007',
    contractNo: 'CT-2025-0034',
    title: '瑞丰便利店 POS 授权',
    companyName: '瑞丰连锁便利店',
    companyId: 'c-007',
    type: 'license',
    status: 'suspended',
    amount: 48000,
    paid: 24000,
    startDate: '2025-10-01',
    endDate: '2026-09-30',
    signatory: '周丽',
    renewalCount: 0,
    updatedAt: '2026-05-30 08:00:00',
    description: '因欠费暂停服务，POS 系统授权已被临时冻结。',
  },
  {
    id: 'co-008',
    contractNo: 'CT-2026-0008',
    title: '天翼云基础设施订阅',
    companyName: '天翼信息技术有限公司',
    companyId: 'c-008',
    type: 'subscription',
    status: 'active',
    amount: 156000,
    paid: 156000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    signatory: '孙浩',
    renewalCount: 1,
    updatedAt: '2026-06-19 09:30:00',
    description: '云服务器及 CDN 加速服务年度套餐，含 5TB 流量包。',
  },
  {
    id: 'co-009',
    contractNo: 'CT-2026-0009',
    title: '华泰金融风控系统项目',
    companyName: '华泰金融控股',
    companyId: 'c-009',
    type: 'project',
    status: 'active',
    amount: 1800000,
    paid: 900000,
    startDate: '2026-02-01',
    endDate: '2026-11-30',
    signatory: '吴杰',
    renewalCount: 0,
    updatedAt: '2026-06-24 10:20:00',
    description: '智能风控系统二期开发，含实时交易监控和多维度风险评估模块。',
  },
  {
    id: 'co-010',
    contractNo: 'CT-2026-0010',
    title: '华泰金融基础维护合同',
    companyName: '华泰金融控股',
    companyId: 'c-009',
    type: 'maintenance',
    status: 'active',
    amount: 240000,
    paid: 240000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    signatory: '吴杰',
    renewalCount: 5,
    updatedAt: '2026-06-22 16:00:00',
    description: '基础架构维护及应急响应用年约。',
  },
  {
    id: 'co-011',
    contractNo: 'CT-2026-0011',
    title: '阳光教育教务系统订阅',
    companyName: '阳光教育集团',
    companyId: 'c-011',
    type: 'subscription',
    status: 'active',
    amount: 216000,
    paid: 216000,
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    signatory: '黄磊',
    renewalCount: 1,
    updatedAt: '2026-06-20 11:00:00',
    description: '教务管理系统 SaaS 订阅，3 所校区共 120 个教室。',
  },
  {
    id: 'co-012',
    contractNo: 'CT-2026-0012',
    title: '仁心医疗 HIS 系统升级',
    companyName: '仁心医疗科技',
    companyId: 'c-013',
    type: 'project',
    status: 'pending_approval',
    amount: 680000,
    paid: 0,
    startDate: '2026-08-01',
    endDate: '2027-01-31',
    signatory: '林琳',
    renewalCount: 0,
    updatedAt: '2026-06-22 15:30:00',
    description: 'HIS 系统全面升级，含电子病历、药房管理和医保对接模块。',
  },
  {
    id: 'co-013',
    contractNo: 'CT-2025-0028',
    title: '远见零售促销管理服务',
    companyName: '远见零售管理',
    companyId: 'c-014',
    type: 'service',
    status: 'active',
    amount: 84000,
    paid: 42000,
    startDate: '2025-11-01',
    endDate: '2026-07-31',
    signatory: '马超',
    renewalCount: 0,
    updatedAt: '2026-06-17 14:00:00',
    description: '促销活动管理平台，含优惠券发放、会员积分和数据分析。',
  },
  {
    id: 'co-014',
    contractNo: 'CT-2025-0015',
    title: '中科智造 ERP 项目（已结项）',
    companyName: '中科智造',
    companyId: 'c-012',
    type: 'project',
    status: 'terminated',
    amount: 550000,
    paid: 550000,
    startDate: '2025-04-01',
    endDate: '2025-09-30',
    signatory: '何明',
    renewalCount: 0,
    updatedAt: '2025-10-01 09:00:00',
    description: 'ERP 系统实施项目，已完成验收交付。客户已流失。',
  },
  {
    id: 'co-015',
    contractNo: 'CT-2026-0015',
    title: '碧源环保 IoT 接入服务',
    companyName: '碧源环保科技',
    companyId: 'c-010',
    type: 'service',
    status: 'draft',
    amount: 65000,
    paid: 0,
    startDate: '2026-07-15',
    endDate: '2026-10-15',
    signatory: '郑洁',
    renewalCount: 0,
    updatedAt: '2026-06-15 10:00:00',
    description: 'IoT 设备接入和数据采集服务，80 台监测终端。',
  },
  {
    id: 'co-016',
    contractNo: 'CT-2026-0016',
    title: '创云软件开发工具授权',
    companyName: '创云软件开发',
    companyId: 'c-015',
    type: 'license',
    status: 'expiring_soon',
    amount: 96000,
    paid: 96000,
    startDate: '2025-07-01',
    endDate: (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().slice(0, 10); })(),
    signatory: '韩雪',
    renewalCount: 2,
    updatedAt: '2026-06-16 09:00:00',
    description: 'IDE 开发工具及 DevOps 平台授权，25 个开发席位。即将到期。',
  },
];
