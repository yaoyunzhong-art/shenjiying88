/**
 * Tenant-Config 审计日志视图模型 (P0-E1 修复)
 *
 * 把后端 ConfigAuditLog (来自 GET /tenant-config/audit-logs) 转成审计 UI 需要的
 * AuditLog 形状,以便复用既有审计页 UI 结构 (表格 / 分页 / 搜索)。
 *
 * 注: 后端 service.listAuditLogs 已存在,但 controller 暂未直接暴露 audit-logs 端点;
 * 本 view-model 会按调用约定请求 audit-logs,失败时回退到空数组,前端不会假数据渲染。
 */

import { ApiClient, getDefaultApiBaseUrl, type TenantConfigAuditLog } from '@m5/sdk';
import { FRONTEND_TO_BACKEND_ROLE, mapToBackendRole } from '@m5/types';

export interface TenantConfigAuditView {
  id: string;
  time: string;
  user: string;
  role: string;
  action: AuditAction;
  module: AuditModule;
  target: string;
  detail: string;
  ip: string;
  result: AuditResult;
  duration: number;
  /** 原始 log,用于详情回放 */
  raw: TenantConfigAuditLog;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'approve' | 'reject' | 'view';
export type AuditModule = 'member' | 'order' | 'inventory' | 'finance' | 'settings' | 'auth' | 'device' | 'report' | 'staff';
export type AuditResult = 'success' | 'failure' | 'blocked' | 'pending';

/**
 * 把后端 snake_case role (e.g. super_admin) 翻译成中文展示标签
 */
const BACKEND_ROLE_LABEL: Record<string, string> = {
  super_admin: '超级管理员',
  brand_admin: '品牌管理员',
  tenant_admin: '租户管理员',
  store_admin: '门店管理员',
  operator: '运营操作员',
  viewer: '只读观察员',
  auditor: '合规审计员',
  system: '系统',
};

function presentRole(role: string): string {
  return BACKEND_ROLE_LABEL[role] ?? role;
}

/**
 * 角色转换工具: 把前端 Workbench role (e.g. SUPER_ADMIN) 转换成后端 snake_case
 * (e.g. super_admin),供 tenant-config API 调用前的角色归一化使用。
 */
export function normalizeRoleForTenantConfig(frontendRole: string): string {
  return mapToBackendRole(frontendRole) ?? FRONTEND_TO_BACKEND_ROLE[frontendRole] ?? frontendRole;
}

const MODULE_FROM_KEY = (key: string): AuditModule => {
  if (key.startsWith('pos.') || key.startsWith('order.') || key.startsWith('inventory.')) {
    if (key.startsWith('pos.')) return 'order';
    if (key.startsWith('inventory.')) return 'inventory';
    return 'order';
  }
  if (key.startsWith('member.')) return 'member';
  if (key.startsWith('print.') || key.startsWith('device.')) return 'device';
  if (key.startsWith('marketing.')) return 'report';
  if (key.startsWith('billing.') || key.startsWith('compliance.')) return 'finance';
  if (key.startsWith('branding.') || key.startsWith('integration.')) return 'settings';
  if (key.startsWith('ai.')) return 'auth';
  return 'settings';
};

const ACTION_TO_RESULT: Record<'create' | 'update' | 'delete' | 'rollback', AuditResult> = {
  create: 'success',
  update: 'success',
  delete: 'success',
  rollback: 'success',
};

function mapLogToView(log: TenantConfigAuditLog): TenantConfigAuditView {
  const time = log.timestamp;
  const action: AuditAction =
    log.action === 'create' ? 'create'
    : log.action === 'update' ? 'update'
    : log.action === 'delete' ? 'delete'
    : log.action === 'rollback' ? 'approve'
    : 'view';
  const detail = log.newValue
    ? `将 ${log.key} 更新为 ${log.newValue}${log.previousValue ? ` (前值 ${log.previousValue})` : ''}`
    : `操作 ${log.key}`;
  return {
    id: log.id,
    time,
    user: log.operator,
    role: log.operatorRole,
    action,
    module: MODULE_FROM_KEY(log.key),
    target: log.key,
    detail,
    ip: '—',
    result: ACTION_TO_RESULT[log.action] ?? 'success',
    duration: 0,
    raw: log,
  };
}

const FALLBACK_TENANT_ID = 'tenant-demo';

function createClient(): ApiClient {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID,
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
  });
}

export interface TenantConfigAuditDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  tenantId: string;
  records: TenantConfigAuditView[];
  total: number;
  error?: string;
}

export async function loadTenantConfigAuditTrail(
  tenantId: string = FALLBACK_TENANT_ID,
  limit: number = 200,
  init: RequestInit = {}
): Promise<TenantConfigAuditDelivery> {
  const client = createClient();
  try {
    const logs = await client.listTenantConfigAuditLogs(tenantId, limit, init);
    const records = (logs ?? []).map(mapLogToView);
    return {
      deliveryMode: 'api',
      generatedAt: new Date().toISOString(),
      tenantId,
      records,
      total: records.length,
    };
  } catch (err) {
    // 后端尚未暴露该 endpoint (404) 或网络异常 → 优雅空态
    const error = err instanceof Error ? err.message : String(err);
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      tenantId,
      records: [],
      total: 0,
      error,
    };
  }
}

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  create: '新增',
  update: '修改',
  delete: '删除',
  login: '登录',
  logout: '登出',
  export: '导出',
  approve: '审批通过',
  reject: '审批驳回',
  view: '查看',
};

export const AUDIT_MODULE_LABEL: Record<AuditModule, string> = {
  member: '会员',
  order: '订单',
  inventory: '库存',
  finance: '财务',
  settings: '设置',
  auth: '认证',
  device: '设备',
  report: '报表',
  staff: '员工',
};

export const AUDIT_RESULT_PRESENTATION: Record<AuditResult, { label: string; variant: 'success' | 'danger' | 'neutral' | 'warning' }> = {
  success: { label: '成功', variant: 'success' },
  failure: { label: '失败', variant: 'danger' },
  blocked: { label: '拦截', variant: 'neutral' },
  pending: { label: '待审批', variant: 'warning' },
};
