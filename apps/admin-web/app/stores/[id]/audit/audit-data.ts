export type AuditLevel = 'info' | 'warn' | 'error';
export type AuditDiagnosticStatus = 'stable' | 'watch' | 'risk';

export interface AuditRecord {
  id: string;
  operator: string;
  action: string;
  target: string;
  detail: string;
  time: string;
  level: AuditLevel;
}

export interface AuditDiagnostic {
  id: string;
  title: string;
  status: AuditDiagnosticStatus;
  detail: string;
}

export interface AuditSummary {
  total: number;
  infoCount: number;
  warnCount: number;
  errorCount: number;
  uniqueOperators: number;
}

export interface AuditActionStat {
  label: string;
  count: number;
}

export interface AuditSnapshot {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'store-audit-api' | 'store-audit-fallback';
  storeId: string;
  records: AuditRecord[];
  summary: AuditSummary;
  actionStats: AuditActionStat[];
  diagnostics: AuditDiagnostic[];
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

export const LEVEL_CONFIG: Record<AuditLevel, { color: string; label: string }> = {
  info: { color: 'blue', label: '普通' },
  warn: { color: 'orange', label: '警告' },
  error: { color: 'red', label: '错误' },
};

export const DEFAULT_AUDIT_RECORDS: AuditRecord[] = [
  { id: 'AL-001', operator: '系统', action: '登录', target: 'admin-web', detail: 'IP: 192.168.1.100', time: '2026-07-13 22:00', level: 'info' },
  { id: 'AL-002', operator: '张三(店长)', action: '修改价格', target: '收银 P-35', detail: '商品 SKU-001 ￥25→￥22', time: '2026-07-13 21:30', level: 'warn' },
  { id: 'AL-003', operator: '李四(财务)', action: '审核退款', target: '财务 P-38', detail: '订单 OR-2026-0713 退款￥88', time: '2026-07-13 20:15', level: 'info' },
  { id: 'AL-004', operator: '系统', action: '自动备份', target: '数据库', detail: '完整备份 2.3GB', time: '2026-07-13 20:00', level: 'info' },
  { id: 'AL-005', operator: '王五(管理员)', action: '配置变更', target: '权限', detail: '新增角色: 临时工', time: '2026-07-13 19:45', level: 'warn' },
  { id: 'AL-006', operator: '系统', action: '告警触发', target: '库存', detail: '抹茶粉低于安全库存', time: '2026-07-13 19:00', level: 'error' },
  { id: 'AL-007', operator: '赵六(HR)', action: '离职处理', target: '员工', detail: '员工 EMP-089 已离职', time: '2026-07-13 18:00', level: 'info' },
  { id: 'AL-008', operator: '张三(店长)', action: '设备关机', target: '设备-03', detail: 'VR 设备异常关机', time: '2026-07-13 17:00', level: 'error' },
  { id: 'AL-009', operator: '系统', action: '调度任务', target: '侦察兵', detail: '夜间竞品采集完成', time: '2026-07-13 04:00', level: 'info' },
  { id: 'AL-010', operator: '系统', action: '自动升级', target: 'API 服务', detail: 'v17.0.3→v17.0.4', time: '2026-07-13 03:00', level: 'info' },
  { id: 'AL-011', operator: '李四(财务)', action: '导出报表', target: '月报', detail: '2026-06 月度营收报表', time: '2026-07-13 10:00', level: 'info' },
  { id: 'AL-012', operator: '系统', action: '备份完成', target: '数据', detail: '增量备份 450MB', time: '2026-07-12 20:00', level: 'info' },
];

export function buildAuditSummary(records: AuditRecord[]): AuditSummary {
  return {
    total: records.length,
    infoCount: records.filter((record) => record.level === 'info').length,
    warnCount: records.filter((record) => record.level === 'warn').length,
    errorCount: records.filter((record) => record.level === 'error').length,
    uniqueOperators: new Set(records.map((record) => record.operator)).size,
  };
}

export function buildAuditActionStats(records: AuditRecord[]): AuditActionStat[] {
  return [
    { label: '登录', count: records.filter((record) => record.action.includes('登录')).length },
    { label: '配置变更', count: records.filter((record) => record.action.includes('修改') || record.action.includes('配置')).length },
    { label: '告警', count: records.filter((record) => record.action.includes('告警')).length },
    { label: '备份', count: records.filter((record) => record.action.includes('备份')).length },
  ];
}

function buildAuditDiagnostics(storeId: string): AuditDiagnostic[] {
  return [
    {
      id: 'store-scope',
      title: '门店范围已固定',
      status: 'stable',
      detail: `门店 ${storeId} 当前审计页以 server snapshot 首屏下发样本记录。`,
    },
    {
      id: 'stream-gap',
      title: '实时写链待接入',
      status: 'watch',
      detail: '尚未接入实时审计流，刷新仅重拉结构固证快照。',
    },
    {
      id: 'report-proof',
      title: '报告导出仍为演示链路',
      status: 'risk',
      detail: '导出审计报告当前仅验证交互壳层，不可作为正式审计归档凭证。',
    },
  ];
}

function getLatestAuditTime(records: AuditRecord[]): string {
  return records.map((record) => record.time).sort().at(-1) ?? new Date().toISOString();
}

export async function loadAuditSnapshot(storeId: string): Promise<AuditSnapshot> {
  const records = DEFAULT_AUDIT_RECORDS.map((record) => ({ ...record }));
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'store-audit-fallback',
    storeId,
    records,
    summary: buildAuditSummary(records),
    actionStats: buildAuditActionStats(records),
    diagnostics: buildAuditDiagnostics(storeId),
    generatedAt: getLatestAuditTime(records),
    controlPlaneSource: 'loadAuditSnapshot fallback -> DEFAULT_AUDIT_RECORDS',
    businessDataSource: 'local audit samples + derived analysis cards',
    refreshPath: 'AuditPage -> loadAuditSnapshot',
    note: '当前页面消费本地审计样本，适用于来源态固证与结构验收，不作为实时追溯闭环复签证据。',
    error: '门店审计实时流尚未接入，当前展示 fallback 审计样本。',
  };
}
