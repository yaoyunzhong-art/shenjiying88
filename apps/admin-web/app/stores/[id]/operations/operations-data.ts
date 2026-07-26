export type SettingValue = string | number | boolean;
export type SettingType = 'time' | 'number' | 'switch';
export type OperationDiagnosticStatus = 'stable' | 'watch' | 'risk';

export interface OperationSetting {
  key: string;
  label: string;
  type: SettingType;
  value: SettingValue;
  desc: string;
  category: string;
}

export interface OperationRealtimeMetric {
  label: string;
  value: string | number;
  suffix?: string;
  prefix?: string;
  color: string;
}

export interface OperationDiagnostic {
  id: string;
  title: string;
  status: OperationDiagnosticStatus;
  detail: string;
}

export interface OperationsSnapshotSummary {
  settingCount: number;
  categoryCount: number;
  automationEnabledCount: number;
  lowCapacityRiskCount: number;
}

export interface OperationsSnapshot {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'store-operations-api' | 'store-operations-fallback';
  storeId: string;
  settings: OperationSetting[];
  categories: string[];
  realtime: OperationRealtimeMetric[];
  diagnostics: OperationDiagnostic[];
  summary: OperationsSnapshotSummary;
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

export const SETTINGS: OperationSetting[] = [
  { key: 'open_time', label: '营业开始时间', type: 'time', value: '10:00', desc: '门店每日营业开始时间', category: '营业时间' },
  { key: 'close_time', label: '营业结束时间', type: 'time', value: '22:00', desc: '门店每日营业结束时间', category: '营业时间' },
  { key: 'max_capacity', label: '最大容纳人数', type: 'number', value: 200, desc: '门店同时容纳最大客流量', category: '客流' },
  { key: 'auto_close', label: '自动关店', type: 'switch', value: true, desc: '营业结束后自动关闭 POS 系统', category: '自动化' },
  { key: 'member_discount', label: '会员折扣率', type: 'number', value: 0.9, desc: '会员消费默认折扣(0-1)', category: '优惠' },
  { key: 'min_recharge', label: '最低充值金额', type: 'number', value: 50, desc: '会员最低充值金额', category: '财务' },
  { key: 'min_game_charge', label: '最低游戏充值', type: 'number', value: 20, desc: '游戏充值最低金额', category: '财务' },
  { key: 'auto_assign', label: '自动派单', type: 'switch', value: true, desc: '新订单自动指派导玩员', category: '自动化' },
  { key: 'enable_vip_room', label: 'VIP 包间启用', type: 'switch', value: true, desc: 'VIP 包间是否对外开放', category: '营业' },
  { key: 'peak_start', label: '高峰开始时间', type: 'time', value: '18:00', desc: '工作日高峰时段起始', category: '客流' },
  { key: 'peak_end', label: '高峰结束时间', type: 'time', value: '21:00', desc: '工作日高峰时段结束', category: '客流' },
  { key: 'peak_rate', label: '高峰加价率', type: 'number', value: 1.2, desc: '高峰时段价格倍率', category: '财务' },
  { key: 'weekend_peak_start', label: '周末高峰开始', type: 'time', value: '10:00', desc: '周末高峰时段起始', category: '客流' },
  { key: 'weekend_peak_end', label: '周末高峰结束', type: 'time', value: '21:00', desc: '周末高峰时段结束', category: '客流' },
  { key: 'min_group_size', label: '团预约最低人数', type: 'number', value: 10, desc: '团预约最低人数要求', category: '营业' },
];

export const CATEGORIES = ['营业时间', '客流', '财务', '自动化', '优惠', '营业'];

export const REAL_TIME_METRICS: OperationRealtimeMetric[] = [
  { label: '当前客流', value: 156, suffix: '人', color: '#fbbf24' },
  { label: '当前上座率', value: '65%', color: '#34d399' },
  { label: '今日总客流', value: 328, suffix: '人', color: '#6366f1' },
  { label: '峰值时段', value: '14-16', color: '#f59e0b' },
  { label: '今日营收', value: 12800, prefix: '¥', color: '#34d399' },
];

export function groupSettingsByCategory(settings: OperationSetting[], categories: string[]) {
  return categories.map((category) => ({
    category,
    items: settings.filter((setting) => setting.category === category),
  }));
}

export function buildOperationsSummary(settings: OperationSetting[]): OperationsSnapshotSummary {
  return {
    settingCount: settings.length,
    categoryCount: new Set(settings.map((setting) => setting.category)).size,
    automationEnabledCount: settings.filter(
      (setting) => setting.category === '自动化' && setting.value === true,
    ).length,
    lowCapacityRiskCount: settings.filter(
      (setting) => setting.key === 'max_capacity' && typeof setting.value === 'number' && setting.value < 240,
    ).length,
  };
}

function buildOperationsDiagnostics(storeId: string): OperationDiagnostic[] {
  return [
    {
      id: 'source-transparency',
      title: '来源态已显式透出',
      status: 'stable',
      detail: `门店 ${storeId} 当前通过 server wrapper 首屏下发本地运营快照。`,
    },
    {
      id: 'capacity-watch',
      title: '客流上限需复核',
      status: 'watch',
      detail: '最大容纳人数仍为样本值 200，尚未与实时客流预测闭环联调。',
    },
    {
      id: 'automation-risk',
      title: '自动化配置待实链接入',
      status: 'risk',
      detail: '自动关店与自动派单仅完成结构固证，尚未接入真实配置写链路。',
    },
  ];
}

export async function loadOperationsSnapshot(storeId: string): Promise<OperationsSnapshot> {
  const settings = SETTINGS.map((setting) => ({ ...setting }));
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'store-operations-fallback',
    storeId,
    settings,
    categories: CATEGORIES,
    realtime: REAL_TIME_METRICS,
    diagnostics: buildOperationsDiagnostics(storeId),
    summary: buildOperationsSummary(settings),
    generatedAt: '2026-07-27T09:30:00.000Z',
    controlPlaneSource: 'loadOperationsSnapshot fallback -> SETTINGS + REAL_TIME_METRICS',
    businessDataSource: 'local operations samples + derived diagnostics',
    refreshPath: 'OperationsPage -> loadOperationsSnapshot',
    note: '当前页面消费本地 snapshot loader，适用于来源态固证与交互演示，不作为实时营业闭环复签证据。',
    error: '门店运营参数尚未接入实时控制面，当前展示 fallback 样本快照。',
  };
}
