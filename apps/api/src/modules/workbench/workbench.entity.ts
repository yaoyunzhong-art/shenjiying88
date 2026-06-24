import type { RoleWorkbench, WorkbenchNavItem, ClientChannel } from '@m5/domain'

/**
 * 工作台引导状态实体
 */
export interface WorkbenchBootstrapState {
  /** 引导版本 */
  version: string
  /** 角色工作台集合 */
  workbenches: RoleWorkbench[]
  /** 是否已初始化 */
  initialized: boolean
  /** 最后刷新时间 */
  refreshedAt?: string
}

/**
 * 导航项优先级枚举
 */
export enum NavItemPriority {
  High = 'HIGH',
  Medium = 'MEDIUM',
  Low = 'LOW'
}

/**
 * 拓展导航项，包含运行时元数据
 */
export interface WorkbenchNavItemRich extends WorkbenchNavItem {
  /** 导航优先级 */
  priority: NavItemPriority
  /** 是否需要特定能力 */
  requiredCapability?: string
  /** 是否仅在特定客户端可用 */
  clientRestriction?: ClientChannel[]
}

/**
 * 角色工作台能力标识
 */
export const WORKBENCH_CAPABILITIES = [
  'tenant-management',
  'brand-matrix',
  'channel-orchestration',
  'member-crm',
  'checkout-nuclear',
  'offline-fallback',
  'daily-report',
  'field-scheduling',
  'promo-conversion',
  'audit-center',
  'market-governance',
  'regional-config',
  'portal-management',
  'campaign-execution'
] as const

/** 角色工作台能力类型 */
export type WorkbenchCapability = (typeof WORKBENCH_CAPABILITIES)[number]

/**
 * 角色-能力映射表
 */
export const ROLE_CAPABILITY_MAP: Record<string, WorkbenchCapability[]> = {
  SUPER_ADMIN: ['tenant-management', 'audit-center', 'market-governance'],
  TENANT_ADMIN: ['brand-matrix', 'channel-orchestration', 'regional-config', 'portal-management'],
  BRAND_MANAGER: ['member-crm', 'campaign-execution', 'regional-config'],
  STORE_MANAGER: ['daily-report', 'field-scheduling'],
  GUIDE: ['member-crm', 'promo-conversion'],
  CASHIER: ['checkout-nuclear', 'offline-fallback'],
  OPERATIONS: ['market-governance', 'field-scheduling', 'tenant-management', 'audit-center'],
  FINANCE: ['regional-config', 'market-governance', 'audit-center'],
  WAREHOUSE: ['brand-matrix', 'tenant-management', 'daily-report', 'market-governance', 'audit-center'],
  COACH: ['member-crm', 'promo-conversion', 'audit-center']
}

/**
 * 判断角色是否拥有某能力
 */
export function hasCapability(role: string, capability: WorkbenchCapability): boolean {
  const caps = ROLE_CAPABILITY_MAP[role]
  if (!caps) return false
  return caps.includes(capability)
}

/**
 * 构造默认引导状态
 */
export function makeWorkbenchBootstrapState(
  workbenches: RoleWorkbench[],
  overrides: Partial<Omit<WorkbenchBootstrapState, 'workbenches'>> = {}
): WorkbenchBootstrapState {
  return {
    version: '1.0.0',
    workbenches,
    initialized: true,
    refreshedAt: new Date().toISOString(),
    ...overrides
  }
}

// ── 角色扩展引导配置 ────────────────────────────────────────────────

/** 待办卡片类型 */
export interface TodoCardType {
  key: string
  label: string
  description: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

/** 权限矩阵片段 */
export interface PermissionSnippet {
  resource: string
  actions: string[]
  scope: 'platform' | 'tenant' | 'brand' | 'store'
}

/** 角色引导配置 */
export interface RoleBootstrapConfig {
  role: string
  homePath: string
  extendedNavItems: WorkbenchNavItemRich[]
  todoCardTypes: TodoCardType[]
  permissionSnippets: PermissionSnippet[]
}

// ── SUPER_ADMIN ──
export const SUPER_ADMIN_BOOTSTRAP: RoleBootstrapConfig = {
  role: 'SUPER_ADMIN',
  homePath: '/admin/dashboard',
  extendedNavItems: [
    {
      key: 'tenants', label: '租户管理', href: '/admin/tenants',
      description: '租户开通、关停和能力授权', priority: NavItemPriority.High,
      requiredCapability: 'tenant-management'
    },
    {
      key: 'identity-access', label: '身份与授权', href: '/admin/identity-access',
      description: 'Actor 上下文、角色、权限与租户边界校验', priority: NavItemPriority.High
    },
    {
      key: 'configuration', label: '全局配置', href: '/admin/configuration',
      description: '系统级功能开关、密钥、证书与审批', priority: NavItemPriority.High
    },
    {
      key: 'audit', label: '审计中心', href: '/admin/audit-trail',
      description: '全局日志、风控与可疑行为回溯', priority: NavItemPriority.High,
      requiredCapability: 'audit-center'
    },
    {
      key: 'markets', label: '国际化治理', href: '/admin/markets',
      description: '市场默认值、网络区、邮箱与税务策略', priority: NavItemPriority.Medium,
      requiredCapability: 'market-governance'
    },
    {
      key: 'resilience', label: '强韧性作战台', href: '/admin/resilience',
      description: '可观测信号、重试策略与恢复计划', priority: NavItemPriority.Medium
    },
    {
      key: 'integration', label: '集成编排', href: '/admin/integration',
      description: 'Webhook 来源、事件信封与幂等编排总览', priority: NavItemPriority.Low
    }
  ],
  todoCardTypes: [
    { key: 'system-health', label: '系统健康', description: '集群状态、节点存活与资源水位', priority: 'HIGH' },
    { key: 'tenant-alerts', label: '租户告警', description: '租户异常事件、配额超限与安全风险', priority: 'HIGH' },
    { key: 'security-audits', label: '安全审计', description: '敏感操作审计、权限变更记录', priority: 'MEDIUM' },
    { key: 'config-pending', label: '配置待审', description: '待审批的全局配置变更', priority: 'MEDIUM' }
  ],
  permissionSnippets: [
    { resource: 'tenant', actions: ['create', 'read', 'update', 'delete', 'suspend'], scope: 'platform' },
    { resource: 'audit', actions: ['read', 'export', 'archive'], scope: 'platform' },
    { resource: 'configuration', actions: ['read', 'write', 'approve'], scope: 'platform' }
  ]
}

// ── OPERATIONS ──
export const OPERATIONS_BOOTSTRAP: RoleBootstrapConfig = {
  role: 'OPERATIONS',
  homePath: '/ops/dashboard',
  extendedNavItems: [
    {
      key: 'kpi-dashboard', label: 'KPI 看板', href: '/ops/kpi',
      description: '全渠道营收、转化率与增长指标实时总览', priority: NavItemPriority.High
    },
    {
      key: 'traffic-analysis', label: '客流分析', href: '/ops/traffic',
      description: '门店客流、热力分布与停留时长分析', priority: NavItemPriority.High
    },
    {
      key: 'campaign-effects', label: '活动效果', href: '/ops/campaigns',
      description: '营销活动ROI、券核销率与裂变漏斗', priority: NavItemPriority.High
    },
    {
      key: 'operations', label: '运营回执', href: '/ops/receipts',
      description: 'Runtime 运营回执统一收口与复盘', priority: NavItemPriority.Medium,
      requiredCapability: 'field-scheduling'
    },
    {
      key: 'approvals', label: '治理审批', href: '/ops/approvals',
      description: '跨租户 / 平台级高风险审批单', priority: NavItemPriority.Medium,
      requiredCapability: 'tenant-management'
    },
    {
      key: 'alerts', label: '告警分诊', href: '/ops/alerts',
      description: '告警分诊、抑制与升级', priority: NavItemPriority.Medium
    },
    {
      key: 'audit', label: '审计中心', href: '/ops/audit-trail',
      description: '运营动作留痕与可疑行为回放', priority: NavItemPriority.Low,
      requiredCapability: 'audit-center'
    }
  ],
  todoCardTypes: [
    { key: 'kpi-anomaly', label: '指标异常', description: 'KPI 偏离阈值自动告警', priority: 'HIGH' },
    { key: 'campaign-review', label: '活动复盘', description: '待复盘营销活动列表', priority: 'HIGH' },
    { key: 'approval-pending', label: '待审批', description: '待处理的治理审批单', priority: 'MEDIUM' },
    { key: 'traffic-report', label: '客流日报', description: '每日客流汇总报告', priority: 'LOW' }
  ],
  permissionSnippets: [
    { resource: 'analytics', actions: ['read', 'export', 'configure'], scope: 'tenant' },
    { resource: 'operations', actions: ['read', 'write', 'approve'], scope: 'tenant' },
    { resource: 'campaign', actions: ['read', 'export'], scope: 'brand' }
  ]
}

// ── FINANCE ──
export const FINANCE_BOOTSTRAP: RoleBootstrapConfig = {
  role: 'FINANCE',
  homePath: '/finance/dashboard',
  extendedNavItems: [
    {
      key: 'reconciliation', label: '对账中心', href: '/finance/reconciliation',
      description: '收单、退款、储值流水自动对账', priority: NavItemPriority.High
    },
    {
      key: 'settlements', label: '结算报表', href: '/finance/settlements',
      description: '日结、周结、月结财务报表', priority: NavItemPriority.High
    },
    {
      key: 'invoices', label: '发票管理', href: '/finance/invoices',
      description: '电子发票开具、查验与归档', priority: NavItemPriority.High
    },
    {
      key: 'rate-limits', label: '限流与配额', href: '/finance/rate-limits',
      description: '租户级与平台级限流策略、配额账本', priority: NavItemPriority.Medium,
      requiredCapability: 'regional-config'
    },
    {
      key: 'configuration', label: '配置治理', href: '/finance/configuration',
      description: '税务、币种、汇率等配置中心接入', priority: NavItemPriority.Medium,
      requiredCapability: 'market-governance'
    },
    {
      key: 'audit', label: '审计追踪', href: '/finance/audit-trail',
      description: '财务动作留痕、交易回放与风控审计', priority: NavItemPriority.Medium,
      requiredCapability: 'audit-center'
    },
    {
      key: 'resilience', label: '对账重试', href: '/finance/resilience',
      description: '对账失败重试、回收计划与异常信号', priority: NavItemPriority.Low
    }
  ],
  todoCardTypes: [
    { key: 'reconciliation-errors', label: '对账异常', description: '自动对账未平账项', priority: 'HIGH' },
    { key: 'invoice-pending', label: '待开发票', description: '待处理的发票申请', priority: 'HIGH' },
    { key: 'settlement-daily', label: '日结待审', description: '待审核的日结报表', priority: 'MEDIUM' },
    { key: 'tax-filing', label: '税务申报', description: '临近截止的税务申报提醒', priority: 'MEDIUM' }
  ],
  permissionSnippets: [
    { resource: 'finance', actions: ['read', 'export', 'reconcile', 'approve'], scope: 'tenant' },
    { resource: 'invoice', actions: ['create', 'read', 'void', 'export'], scope: 'tenant' },
    { resource: 'audit', actions: ['read', 'export'], scope: 'tenant' }
  ]
}

// ── WAREHOUSE ──
export const WAREHOUSE_BOOTSTRAP: RoleBootstrapConfig = {
  role: 'WAREHOUSE',
  homePath: '/warehouse/dashboard',
  extendedNavItems: [
    {
      key: 'inventory-dashboard', label: '库存看板', href: '/warehouse/inventory',
      description: '实时库存水位、效期预警与安全库存', priority: NavItemPriority.High
    },
    {
      key: 'purchase-orders', label: '采购订单', href: '/warehouse/purchase',
      description: '采购申请、审批与供应商对接', priority: NavItemPriority.High
    },
    {
      key: 'stock-movement', label: '进销存', href: '/warehouse/movement',
      description: '入库、出库、调拨与盘点流水', priority: NavItemPriority.High
    },
    {
      key: 'suppliers', label: '供应商管理', href: '/warehouse/suppliers',
      description: '供应商资质、合同与履约评分', priority: NavItemPriority.Medium
    },
    {
      key: 'stores', label: '门店网络', href: '/warehouse/stores',
      description: '门店库存水位与异常预警', priority: NavItemPriority.Medium,
      requiredCapability: 'daily-report'
    },
    {
      key: 'operations', label: '运营回执', href: '/warehouse/receipts',
      description: '出入库回执、损耗复盘', priority: NavItemPriority.Medium
    },
    {
      key: 'audit', label: '审计追踪', href: '/warehouse/audit-trail',
      description: '仓储动作留痕与异常审计', priority: NavItemPriority.Low,
      requiredCapability: 'audit-center'
    }
  ],
  todoCardTypes: [
    { key: 'inventory-alerts', label: '库存告警', description: '低于安全库存的商品清单', priority: 'HIGH' },
    { key: 'purchase-pending', label: '待采购', description: '待审批的采购申请', priority: 'HIGH' },
    { key: 'expiry-warning', label: '效期预警', description: '临近保质期商品提醒', priority: 'MEDIUM' },
    { key: 'stocktake-due', label: '待盘点', description: '本周待执行的盘点任务', priority: 'MEDIUM' }
  ],
  permissionSnippets: [
    { resource: 'warehouse', actions: ['read', 'write', 'transfer', 'adjust'], scope: 'tenant' },
    { resource: 'inventory', actions: ['read', 'write', 'export'], scope: 'brand' },
    { resource: 'supplier', actions: ['read', 'write'], scope: 'tenant' }
  ]
}

// ── COACH ──
export const COACH_BOOTSTRAP: RoleBootstrapConfig = {
  role: 'COACH',
  homePath: '/coach/dashboard',
  extendedNavItems: [
    {
      key: 'class-schedule', label: '课程安排', href: '/coach/schedule',
      description: '排课日历、时段管理与容量设置', priority: NavItemPriority.High
    },
    {
      key: 'students', label: '学员管理', href: '/coach/students',
      description: '学员档案、学习进度与评估记录', priority: NavItemPriority.High
    },
    {
      key: 'teaching-records', label: '教学记录', href: '/coach/records',
      description: '授课日志、考勤签到与课后反馈', priority: NavItemPriority.High
    },
    {
      key: 'crm', label: '会员接待', href: '/coach/crm',
      description: '私教会员画像、标签与回访', priority: NavItemPriority.Medium,
      requiredCapability: 'member-crm'
    },
    {
      key: 'promo', label: '推广转化', href: '/coach/promo',
      description: '推广码、活动分享与线索转化', priority: NavItemPriority.Medium,
      requiredCapability: 'promo-conversion'
    },
    {
      key: 'operations', label: '运营回执', href: '/coach/receipts',
      description: '课程预约、签到、考勤回执', priority: NavItemPriority.Medium
    },
    {
      key: 'audit', label: '审计留痕', href: '/coach/audit-trail',
      description: '教练动作留痕与会员隐私审计', priority: NavItemPriority.Low,
      requiredCapability: 'audit-center'
    }
  ],
  todoCardTypes: [
    { key: 'class-reminder', label: '课时提醒', description: '今日待授课时列表', priority: 'HIGH' },
    { key: 'student-followup', label: '学员跟进', description: '待回访与跟进学员清单', priority: 'HIGH' },
    { key: 'attendance-pending', label: '未签到', description: '已开课但未签到的学员', priority: 'MEDIUM' },
    { key: 'evaluation-due', label: '待评估', description: '课程结束后待提交的学员评估', priority: 'MEDIUM' }
  ],
  permissionSnippets: [
    { resource: 'class', actions: ['read', 'create', 'update', 'cancel'], scope: 'store' },
    { resource: 'student', actions: ['read', 'write', 'evaluate'], scope: 'store' },
    { resource: 'member', actions: ['read', 'tag', 'followup'], scope: 'store' }
  ]
}

/** 所有角色引导配置聚合 */
export const ROLE_BOOTSTRAP_CONFIGS: Record<string, RoleBootstrapConfig> = {
  SUPER_ADMIN: SUPER_ADMIN_BOOTSTRAP,
  OPERATIONS: OPERATIONS_BOOTSTRAP,
  FINANCE: FINANCE_BOOTSTRAP,
  WAREHOUSE: WAREHOUSE_BOOTSTRAP,
  COACH: COACH_BOOTSTRAP
}

/**
 * 获取角色引导配置
 */
export function getRoleBootstrapConfig(role: string): RoleBootstrapConfig | undefined {
  return ROLE_BOOTSTRAP_CONFIGS[role]
}

/**
 * 检查角色是否可访问目标角色的菜单（越权检查）
 */
export function canAccessRoleMenu(actorRole: string, targetMenuRole: string): boolean {
  // 自角色可访问
  if (actorRole === targetMenuRole) return true
  // SUPER_ADMIN 可访问所有
  if (actorRole === 'SUPER_ADMIN') return true
  // 其他默认不可越权
  return false
}
