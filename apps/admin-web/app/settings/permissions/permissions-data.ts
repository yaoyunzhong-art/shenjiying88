export interface PermissionRolePreview {
  name: string
  description: string
  isSystem: boolean
  resourceCount: number
  owners: string[]
  updatedAt: string
}

export interface PermissionsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'permissions-fallback'
  generatedAt: string
  roles: PermissionRolePreview[]
  inheritanceRules: string[]
  governanceNotes: string[]
  coverageSummary: {
    systemRoles: number
    customRoles: number
    governedResources: number
  }
  error?: string
}

export const DEFAULT_PERMISSION_ROLES: PermissionRolePreview[] = [
  {
    name: '系统管理员',
    description: '全部权限，系统内置角色，负责全域治理收口。',
    isSystem: true,
    resourceCount: 7,
    owners: ['foundation', 'security'],
    updatedAt: '2026-07-26T09:00:00.000Z',
  },
  {
    name: '运营经理',
    description: '订单、报表、用户管理权限，具备跨门店协同能力。',
    isSystem: false,
    resourceCount: 5,
    owners: ['operations', 'report'],
    updatedAt: '2026-07-25T21:30:00.000Z',
  },
  {
    name: '运营专员',
    description: '面向日常执行的受限角色，保留订单查看与处理权限。',
    isSystem: false,
    resourceCount: 3,
    owners: ['operations'],
    updatedAt: '2026-07-24T18:15:00.000Z',
  },
  {
    name: '浏览者',
    description: '只读查看权限，用于审计陪跑与风险复盘。',
    isSystem: false,
    resourceCount: 2,
    owners: ['audit'],
    updatedAt: '2026-07-23T16:45:00.000Z',
  },
]

export const DEFAULT_INHERITANCE_RULES = [
  '子角色自动继承父角色的全部权限，变更按租户边界逐级传播。',
  '新增资源权限进入审批后，系统角色会先收到预览变更，再同步至下级角色。',
  '系统管理员不受继承限制，但高风险写权限仍需保留审计留痕。',
  '系统会阻止循环继承链并输出风险提示，避免隐式扩大授权面。',
]

export const DEFAULT_GOVERNANCE_NOTES = [
  '角色权限样本目前来自前端治理基线，不是实时回读接口。',
  '后续应以 identity-access / rbac bootstrap 快照替换本地样本。',
  '刷新按钮仅通过 router.refresh() 触发服务端重新装配快照。',
]

function getLatestPermissionTimestamp(roles: PermissionRolePreview[]): string {
  return [...roles]
    .map((item) => item.updatedAt)
    .sort((left, right) => left.localeCompare(right))
    .at(-1) ?? '2026-07-26T09:00:00.000Z'
}

export async function loadPermissionsSnapshot(): Promise<PermissionsSnapshotDelivery> {
  const generatedAt = getLatestPermissionTimestamp(DEFAULT_PERMISSION_ROLES)

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'permissions-fallback',
    generatedAt,
    roles: DEFAULT_PERMISSION_ROLES.map((item) => ({
      ...item,
      owners: [...item.owners],
    })),
    inheritanceRules: [...DEFAULT_INHERITANCE_RULES],
    governanceNotes: [...DEFAULT_GOVERNANCE_NOTES],
    coverageSummary: {
      systemRoles: DEFAULT_PERMISSION_ROLES.filter((item) => item.isSystem).length,
      customRoles: DEFAULT_PERMISSION_ROLES.filter((item) => !item.isSystem).length,
      governedResources: Math.max(...DEFAULT_PERMISSION_ROLES.map((item) => item.resourceCount)),
    },
    error: '权限治理实时接口尚未接入，当前展示 fallback 样本，不可作为闭环复签证据。',
  }
}
