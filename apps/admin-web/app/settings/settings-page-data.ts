export type SettingCategory = 'basic' | 'notification' | 'security' | 'advanced'
export type SettingStatus = 'configured' | 'partial' | 'pending'

export interface ConfigModule {
  key: string
  label: string
  href: string
  description: string
  status: SettingStatus
  category: SettingCategory
  itemCount: number
  requiredPermission: string
}

export interface SettingsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-settings-center-snapshot'
  modules: ConfigModule[]
  generatedAt: string
}

export const SETTINGS_MODULES: ConfigModule[] = [
  {
    key: 'payment-config',
    label: '支付配置',
    href: '/settings/payment-config',
    description: '管理支付通道、结算参数与对账入口。',
    status: 'configured',
    category: 'basic',
    itemCount: 3,
    requiredPermission: 'finance:read',
  },
  {
    key: 'membership-levels',
    label: '会员等级',
    href: '/settings/membership-levels',
    description: '维护会员等级体系、积分门槛与权益包。',
    status: 'configured',
    category: 'basic',
    itemCount: 4,
    requiredPermission: 'member:read',
  },
  {
    key: 'promotion-rules',
    label: '促销规则',
    href: '/settings/promotion-rules',
    description: '配置满减、折扣、赠品与包邮规则。',
    status: 'partial',
    category: 'basic',
    itemCount: 3,
    requiredPermission: 'campaign:write',
  },
  {
    key: 'tax-rates',
    label: '税率配置',
    href: '/settings/tax-rates',
    description: '统一商品税率、开票映射与核算口径。',
    status: 'partial',
    category: 'basic',
    itemCount: 4,
    requiredPermission: 'finance:read',
  },
  {
    key: 'system-config',
    label: '系统配置',
    href: '/settings/system-config',
    description: '维护全局系统参数、品牌信息与运行阈值。',
    status: 'configured',
    category: 'basic',
    itemCount: 8,
    requiredPermission: 'settings:read',
  },
  {
    key: 'venue-config',
    label: '场馆配置',
    href: '/settings/venue-config',
    description: '管理营业时间、设施容量与场馆运行状态。',
    status: 'configured',
    category: 'basic',
    itemCount: 4,
    requiredPermission: 'store:read',
  },
  {
    key: 'notifications',
    label: '通知设置',
    href: '/settings/notifications',
    description: '配置通知策略、渠道和静默时段。',
    status: 'partial',
    category: 'notification',
    itemCount: 3,
    requiredPermission: 'notification:read',
  },
  {
    key: 'notification-templates',
    label: '通知模板',
    href: '/settings/notification-templates',
    description: '管理模板变量、签名和业务模板。',
    status: 'configured',
    category: 'notification',
    itemCount: 5,
    requiredPermission: 'notification:write',
  },
  {
    key: 'security',
    label: '安全设置',
    href: '/settings/security',
    description: '查看密码策略、登录保护与审计治理。',
    status: 'configured',
    category: 'security',
    itemCount: 5,
    requiredPermission: 'security:read',
  },
  {
    key: 'permissions',
    label: '权限管理',
    href: '/settings/permissions',
    description: '维护角色矩阵、权限继承与资源授权。',
    status: 'configured',
    category: 'security',
    itemCount: 6,
    requiredPermission: 'identity-access:write',
  },
  {
    key: 'workflow',
    label: '工作流配置',
    href: '/settings/workflow',
    description: '编排审批流、自动化节点和分支策略。',
    status: 'pending',
    category: 'advanced',
    itemCount: 1,
    requiredPermission: 'workflow:write',
  },
]

export const CATEGORY_LABEL: Record<SettingCategory, string> = {
  basic: '基础设置',
  notification: '通知设置',
  security: '安全设置',
  advanced: '高级设置',
}

export const CATEGORY_ORDER: SettingCategory[] = ['basic', 'notification', 'security', 'advanced']

export const STATUS_LABEL: Record<SettingStatus, string> = {
  configured: '已配置',
  partial: '部分配置',
  pending: '待配置',
}

export const STATUS_COLOR: Record<SettingStatus, string> = {
  configured: '#22c55e',
  partial: '#eab308',
  pending: '#ef4444',
}

export async function loadSettingsSnapshot(): Promise<SettingsSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-settings-center-snapshot',
    modules: SETTINGS_MODULES,
    generatedAt: new Date().toISOString(),
  }
}
