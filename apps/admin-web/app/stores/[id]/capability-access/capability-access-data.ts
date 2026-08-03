export type RoleStatus = 'active' | 'draft' | 'disabled';
export type RoleScope = '全局' | '门店';
export type CapabilityDiagnosticStatus = 'stable' | 'watch' | 'risk';

export interface RoleRecord {
  id: string;
  name: string;
  users: number;
  permissions: string;
  desc: string;
  scope: RoleScope;
  status: RoleStatus;
}

export interface CapabilityUserDigest {
  id: string;
  name: string;
  role: string;
  scope: RoleScope;
  status: 'active' | 'pending';
}

export interface CapabilityAuditFinding {
  id: string;
  title: string;
  level: 'pass' | 'watch' | 'risk';
  detail: string;
}

export interface CapabilityDiagnostic {
  id: string;
  title: string;
  status: CapabilityDiagnosticStatus;
  detail: string;
}

export interface CapabilityAccessSummary {
  totalRoles: number;
  totalUsers: number;
  activeUsers: number;
  draftRoles: number;
  globalRoles: number;
  storeRoles: number;
}

export interface CapabilityAccessSnapshot {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'store-capability-access-api' | 'store-capability-access-fallback';
  storeId: string;
  roles: RoleRecord[];
  userDigest: CapabilityUserDigest[];
  auditFindings: CapabilityAuditFinding[];
  diagnostics: CapabilityDiagnostic[];
  summary: CapabilityAccessSummary;
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

export const ROLE_DATA: RoleRecord[] = [
  { id: 'R-01', name: '超级管理员', users: 2, permissions: '全部权限', desc: '系统级管理', scope: '全局', status: 'active' },
  { id: 'R-02', name: '店长', users: 5, permissions: '门店全部', desc: '门店运营管理', scope: '门店', status: 'active' },
  { id: 'R-03', name: '收银员', users: 8, permissions: '收银/开卡', desc: '前台收银操作', scope: '门店', status: 'active' },
  { id: 'R-04', name: '库管员', users: 3, permissions: '出入库', desc: '仓库管理操作', scope: '门店', status: 'active' },
  { id: 'R-05', name: '导玩员', users: 12, permissions: '活动引导', desc: '现场服务', scope: '门店', status: 'active' },
  { id: 'R-06', name: '财务审计', users: 2, permissions: '财务/审计', desc: '财务对账审核', scope: '全局', status: 'active' },
  { id: 'R-07', name: '临时工', users: 0, permissions: '基本操作', desc: '临时权限(草稿)', scope: '门店', status: 'draft' },
];

export const STATUS_MAP: Record<RoleStatus, { color: string; label: string }> = {
  active: { color: 'green', label: '启用' },
  draft: { color: 'orange', label: '草稿' },
  disabled: { color: 'default', label: '停用' },
};

export const USER_DIGEST: CapabilityUserDigest[] = [
  { id: 'u-001', name: '周星', role: '超级管理员', scope: '全局', status: 'active' },
  { id: 'u-002', name: '林语', role: '店长', scope: '门店', status: 'active' },
  { id: 'u-003', name: '陈行', role: '收银员', scope: '门店', status: 'active' },
  { id: 'u-004', name: '许青', role: '导玩员', scope: '门店', status: 'active' },
  { id: 'u-005', name: '王岚', role: '财务审计', scope: '全局', status: 'pending' },
];

export const ACCESS_AUDIT_FINDINGS: CapabilityAuditFinding[] = [
  { id: 'least-privilege', title: '最小权限原则', level: 'pass', detail: '当前 7 个角色均已落入最小权限口径，未发现超级权限外溢。' },
  { id: 'sod', title: '敏感权限分离', level: 'pass', detail: '财务审计与门店运营角色已完成职责分离。' },
  { id: 'draft-role', title: '草稿角色待收敛', level: 'watch', detail: '临时工角色仍处于草稿态，需确认是否进入正式发布。' },
];

export function buildCapabilitySummary(roles: RoleRecord[]): CapabilityAccessSummary {
  return {
    totalRoles: roles.length,
    totalUsers: roles.reduce((sum, role) => sum + role.users, 0),
    activeUsers: roles.filter((role) => role.status === 'active').reduce((sum, role) => sum + role.users, 0),
    draftRoles: roles.filter((role) => role.status === 'draft').length,
    globalRoles: roles.filter((role) => role.scope === '全局').length,
    storeRoles: roles.filter((role) => role.scope === '门店').length,
  };
}

function buildCapabilityDiagnostics(storeId: string): CapabilityDiagnostic[] {
  return [
    {
      id: 'source-transparency',
      title: '来源态已固定',
      status: 'stable',
      detail: `门店 ${storeId} 当前能力访问页由 server wrapper 首屏下发角色与审计快照。`,
    },
    {
      id: 'user-sync',
      title: '用户映射待同步',
      status: 'watch',
      detail: '用户-角色绑定仍为本地样本，尚未接入实时账号中心。',
    },
    {
      id: 'write-chain',
      title: '角色写链待打通',
      status: 'risk',
      detail: '新建角色、启停用动作当前仅做交互壳层演示，不可作为正式授权凭证。',
    },
  ];
}

export async function loadCapabilityAccessSnapshot(storeId: string): Promise<CapabilityAccessSnapshot> {
  const roles = ROLE_DATA.map((role) => ({ ...role }));
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'store-capability-access-fallback',
    storeId,
    roles,
    userDigest: USER_DIGEST,
    auditFindings: ACCESS_AUDIT_FINDINGS,
    diagnostics: buildCapabilityDiagnostics(storeId),
    summary: buildCapabilitySummary(roles),
    generatedAt: '2026-07-27T10:20:00.000Z',
    controlPlaneSource: 'loadCapabilityAccessSnapshot fallback -> ROLE_DATA + USER_DIGEST',
    businessDataSource: 'local role samples + capability audit findings',
    refreshPath: 'CapabilityAccessPage -> loadCapabilityAccessSnapshot',
    note: '当前页面消费本地角色快照，适用于来源态透明化、权限结构固证与交互演示。',
    error: '门店能力访问尚未接入实时 IAM 控制面，当前展示 fallback 样本快照。',
  };
}
