export type AuditResult = 'success' | 'failure' | 'denied'

export type AuditActionType =
  | 'login'
  | 'logout'
  | 'data_modify'
  | 'permission_change'
  | 'system_setting'
  | 'export'

export interface AuditLogEntry {
  id: string
  time: string
  operator: string
  actionType: AuditActionType
  target: string
  ip: string
  result: AuditResult
  detail: string
}

export interface AuditLogStats {
  total: number
  today: number
  todayFailures: number
}

export interface AuditLogsPageSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'audit-logs-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  logs: AuditLogEntry[]
  stats: AuditLogStats
  failureCount: number
}

export const ACTION_TYPE_LABEL: Record<AuditActionType, string> = {
  login: '登录',
  logout: '登出',
  data_modify: '数据修改',
  permission_change: '权限变更',
  system_setting: '系统设置',
  export: '导出',
}

export const RESULT_LABEL: Record<AuditResult, string> = {
  success: '成功',
  failure: '失败',
  denied: '拒绝',
}

export const RESULT_COLOR: Record<AuditResult, string> = {
  success: '#22c55e',
  failure: '#ef4444',
  denied: '#eab308',
}

export const RESULT_BG: Record<AuditResult, string> = {
  success: 'rgba(34,197,94,0.1)',
  failure: 'rgba(239,68,68,0.1)',
  denied: 'rgba(234,179,8,0.1)',
}

export const DEFAULT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    time: '2026-07-18 14:32:10',
    operator: 'admin@demo.com',
    actionType: 'login',
    target: '管理后台',
    ip: '192.168.1.100',
    result: 'success',
    detail: '管理员登录管理后台',
  },
  {
    id: 'log-002',
    time: '2026-07-18 13:15:00',
    operator: 'zhang@demo.com',
    actionType: 'data_modify',
    target: '商品信息(ID: PD-1024)',
    ip: '10.0.0.55',
    result: 'success',
    detail: '修改商品售价 128 → 99',
  },
  {
    id: 'log-003',
    time: '2026-07-18 11:20:30',
    operator: 'li@demo.com',
    actionType: 'permission_change',
    target: '用户角色(ID: role-admin)',
    ip: '192.168.1.88',
    result: 'failure',
    detail: '尝试提升用户权限但权限不足',
  },
  {
    id: 'log-004',
    time: '2026-07-18 10:05:45',
    operator: 'wang@demo.com',
    actionType: 'system_setting',
    target: '系统参数-限流配置',
    ip: '10.0.1.22',
    result: 'success',
    detail: '更新 API 限流阈值 100 → 200 QPS',
  },
  {
    id: 'log-005',
    time: '2026-07-18 09:30:00',
    operator: 'system',
    actionType: 'login',
    target: '系统自动任务',
    ip: '127.0.0.1',
    result: 'failure',
    detail: '自动登录超时，令牌已过期',
  },
  {
    id: 'log-006',
    time: '2026-07-17 18:00:00',
    operator: 'admin@demo.com',
    actionType: 'logout',
    target: '管理后台',
    ip: '192.168.1.100',
    result: 'success',
    detail: '管理员安全登出',
  },
  {
    id: 'log-007',
    time: '2026-07-17 16:45:20',
    operator: 'zhang@demo.com',
    actionType: 'export',
    target: '销售报表-2026Q2',
    ip: '10.0.0.55',
    result: 'success',
    detail: '导出 Q2 销售报表 (CSV 格式)',
  },
  {
    id: 'log-008',
    time: '2026-07-17 15:10:00',
    operator: 'li@demo.com',
    actionType: 'data_modify',
    target: '订单状态(ID: ORD-8921)',
    ip: '192.168.1.88',
    result: 'denied',
    detail: '尝试修改已发货订单状态被拒绝',
  },
  {
    id: 'log-009',
    time: '2026-07-17 14:00:00',
    operator: 'admin@demo.com',
    actionType: 'system_setting',
    target: '通知模板-短信',
    ip: '192.168.1.100',
    result: 'success',
    detail: '更新短信通知模板内容',
  },
  {
    id: 'log-010',
    time: '2026-07-17 11:30:00',
    operator: 'wang@demo.com',
    actionType: 'export',
    target: '会员清单',
    ip: '10.0.1.22',
    result: 'success',
    detail: '导出活跃会员清单',
  },
]

export const AUDIT_LOG_TODAY = '2026-07-18'

export function isToday(time: string): boolean {
  return time.startsWith(AUDIT_LOG_TODAY)
}

export function computeStats(logs: AuditLogEntry[]): AuditLogStats {
  return {
    total: logs.length,
    today: logs.filter((entry) => isToday(entry.time)).length,
    todayFailures: logs.filter(
      (entry) => isToday(entry.time) && entry.result === 'failure',
    ).length,
  }
}

export function filterLogs(
  logs: AuditLogEntry[],
  tab: 'all' | 'failure',
  searchQuery: string,
): AuditLogEntry[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return logs.filter((entry) => {
    const matchTab = tab === 'all' || entry.result === 'failure'
    const matchQuery =
      normalizedQuery.length === 0 ||
      entry.operator.toLowerCase().includes(normalizedQuery)

    return matchTab && matchQuery
  })
}

export async function loadAuditLogsPageSnapshot(): Promise<AuditLogsPageSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'audit-logs-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadAuditLogsPageSnapshot -> local audit samples',
    businessDataSource: 'DEFAULT_LOGS local snapshot samples',
    refreshPath: 'AuditLogsPage -> loadAuditLogsPageSnapshot',
    note: '当前页面仍以本地审计样本渲染为主，本轮完成 E54 三层拆分、来源态透明化与结构固证。',
    logs: DEFAULT_LOGS,
    stats: computeStats(DEFAULT_LOGS),
    failureCount: DEFAULT_LOGS.filter((entry) => entry.result === 'failure').length,
  }
}
