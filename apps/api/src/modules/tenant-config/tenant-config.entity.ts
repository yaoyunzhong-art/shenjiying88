/**
 * 三级独立配置 - Entity (V9 需求 4 · V10 Day 6 Phase 90)
 *
 * 三级工作台 (Three Workbenches):
 * - W-S (Workbench-Store)   门店级: 操作员日常配置 (POS/打印/小票)
 * - W-T (Workbench-Tenant)  租户级: 店主/连锁管理 (会员/营销/库存)
 * - W-B (Workbench-Brand)   品牌级: 品牌方管控 (合规/标准/灰度)
 *
 * 核心原则 (V9 硬约束):
 * 1. 三级独立: 配置不可越级读写
 * 2. 字段级隔离: 敏感字段 (如费率/密钥) 仅上级可见
 * 3. 实例级隔离: 配置项按 (level, ownerId) 严格隔离
 * 4. 继承可选: 下级可选择性覆盖 (inherits: true/false)
 */

import type { TenantRole } from '../../common/context/tenant-context'

// ============ 跨模块合约补全 ============

/** 租户配置合约实体 (跨模块安全子集) */
export interface TenantConfig {
  tenantId: string
  features: TenantFeature[]
  updatedAt: Date
}

/** 租户特性合约实体 (跨模块安全子集) */
export interface TenantFeature {
  key: string
  enabled: boolean
  config?: Record<string, unknown>
}

/** 配置值合约实体 (跨模块安全子集) */
export interface ConfigValue {
  key: string
  value: string | number | boolean | null
  type: ConfigValueType
  encrypted: boolean
}

// ============ 配置级别 (V9 需求 4 三级) ============

export type ConfigLevel = 'store' | 'tenant' | 'brand'

/** 三级工作台简称 */
export type WorkbenchCode = 'W-S' | 'W-T' | 'W-B'

/** 三级工作台名称 */
export const WORKBENCH_NAMES: Record<WorkbenchCode, string> = {
  'W-S': '门店工作台',
  'W-T': '租户工作台',
  'W-B': '品牌工作台',
}

/** 级别 → 工作台代码映射 */
export const LEVEL_TO_WORKBENCH: Record<ConfigLevel, WorkbenchCode> = {
  store: 'W-S',
  tenant: 'W-T',
  brand: 'W-B',
}

/** 工作台代码 → 级别映射 */
export const WORKBENCH_TO_LEVEL: Record<WorkbenchCode, ConfigLevel> = {
  'W-S': 'store',
  'W-T': 'tenant',
  'W-B': 'brand',
}

// ============ 配置分类 (V9 6 类业务域) ============

export type ConfigCategory =
  | 'pos'          // POS/收银
  | 'print'        // 打印/小票
  | 'member'       // 会员
  | 'marketing'    // 营销
  | 'inventory'    // 库存
  | 'integration'  // 对接
  | 'ai'           // AI 模型
  | 'compliance'   // 合规
  | 'billing'      // 计费
  | 'branding'     // 品牌

/** 三级可见矩阵 (V9 需求 4 字段级隔离) */
export const CATEGORY_LEVEL_MATRIX: Record<ConfigCategory, ConfigLevel[]> = {
  pos: ['store', 'tenant'],
  print: ['store', 'tenant'],
  member: ['store', 'tenant', 'brand'],
  marketing: ['store', 'tenant', 'brand'],
  inventory: ['store', 'tenant', 'brand'],
  integration: ['tenant', 'brand'],
  ai: ['tenant', 'brand'],
  compliance: ['brand'],
  billing: ['brand'],
  branding: ['brand', 'tenant'],
}

// ============ 权限矩阵 (V9 需求 3 + 4) ============

/** 角色可访问的级别 */
export const ROLE_LEVEL_ACCESS: Record<TenantRole, ConfigLevel[]> = {
  super_admin: ['store', 'tenant', 'brand'],
  brand_admin: ['tenant', 'brand'],
  tenant_admin: ['store', 'tenant'],
  store_admin: ['store'],
  operator: ['store'],
  viewer: ['store', 'tenant'],
  auditor: ['store', 'tenant', 'brand'],
}

// ============ 配置项类型 ============

export type ConfigValueType = 'string' | 'number' | 'boolean' | 'json' | 'secret'

export type ConfigSensitivity = 'public' | 'internal' | 'restricted' | 'secret'

/** 配置项定义 (静态 schema) */
export interface ConfigItemDefinition {
  /** 配置 key (e.g. "pos.tax_rate") */
  key: string
  /** 分类 */
  category: ConfigCategory
  /** 所属级别 */
  level: ConfigLevel
  /** 值类型 */
  valueType: ConfigValueType
  /** 敏感度 (字段级隔离依据) */
  sensitivity: ConfigSensitivity
  /** 默认值 */
  defaultValue?: string | number | boolean | null
  /** 允许的角色 (空 = 所有该级别角色) */
  allowedRoles?: TenantRole[]
  /** 是否必填 */
  required?: boolean
  /** 校验规则 (正则 / 范围) */
  validation?: { pattern?: string; min?: number; max?: number; enum?: string[] }
  /** 显示标签 */
  label: string
  /** 描述 */
  description?: string
}

/** 配置实例 (实际存储的值) */
export interface ConfigInstance {
  id: string
  /** 配置 key */
  key: string
  /** 值 (若 sensitivity=secret 则密文存储) */
  value: string
  /** 是否已加密 (避免重复加密 + 解密判断) */
  encrypted: boolean
  /** 分类 */
  category: ConfigCategory
  /** 级别 */
  level: ConfigLevel
  /** 所有者 ID (store_id / tenant_id / brand_id) */
  ownerId: string
  /** 是否继承上级默认值 */
  inherits: boolean
  /** 版本 (用于审计 + 回滚) */
  version: number
  /** 上次更新人 */
  updatedBy: string
  /** 上次更新时间 */
  updatedAt: string
  /** 创建时间 */
  createdAt: string
  /** Phase-FP P0 修复: 标记是否来自 seed(), 是则首次 setConfig 算 create 而非 update */
  fromSeed?: boolean
}

/** 配置审计日志 */
export interface ConfigAuditLog {
  id: string
  configId: string
  key: string
  level: ConfigLevel
  ownerId: string
  /** Phase-FP P0 修复: 记录的 tenant id, 用于 listAuditLogs 跨 store 过滤 */
  tenantId: string
  /** 变更前值 (脱敏) */
  previousValue?: string
  /** 变更后值 (脱敏) */
  newValue?: string
  action: 'create' | 'update' | 'delete' | 'rollback'
  operator: string
  operatorRole: TenantRole
  timestamp: string
  context?: Record<string, unknown>
}

// ============ DTO / Request ============

export interface GetConfigRequest {
  category?: ConfigCategory
  level?: ConfigLevel
  keys?: string[]
}

export interface SetConfigRequest {
  key: string
  value: string
  inherits?: boolean
}

export interface SetConfigBatchRequest {
  items: SetConfigRequest[]
}

export interface EffectiveConfig {
  /** 配置 key */
  key: string
  /** 实际生效值 (考虑继承链) */
  value: string
  /** 值来源级别 */
  sourceLevel: ConfigLevel
  /** 是否继承自上级 */
  inherited: boolean
  /** 敏感度 (用于脱敏) */
  sensitivity: ConfigSensitivity
  /** 是否已脱敏 (仅敏感配置) */
  isMasked: boolean
}

// ============ 内置配置项定义 (V10 Day 6 种子) ============

export const BUILTIN_CONFIG_DEFINITIONS: ConfigItemDefinition[] = [
  // W-S 门店级
  {
    key: 'pos.tax_rate',
    category: 'pos',
    level: 'store',
    valueType: 'number',
    sensitivity: 'public',
    defaultValue: 0.13,
    validation: { min: 0, max: 1 },
    label: '税率',
    description: '门店 POS 税率 (0-1)',
  },
  {
    key: 'pos.receipt_footer',
    category: 'pos',
    level: 'store',
    valueType: 'string',
    sensitivity: 'public',
    defaultValue: '谢谢惠顾',
    label: '小票页脚',
  },
  {
    key: 'print.auto_print_receipt',
    category: 'print',
    level: 'store',
    valueType: 'boolean',
    sensitivity: 'public',
    defaultValue: true,
    label: '自动打印小票',
  },
  {
    key: 'member.daily_checkin_enabled',
    category: 'member',
    level: 'store',
    valueType: 'boolean',
    sensitivity: 'public',
    defaultValue: true,
    label: '允许每日签到',
  },

  // W-T 租户级
  {
    key: 'member.tier_upgrade_threshold',
    category: 'member',
    level: 'tenant',
    valueType: 'number',
    sensitivity: 'internal',
    defaultValue: 1000,
    validation: { min: 0 },
    label: '会员升级积分阈值',
  },
  {
    key: 'marketing.default_campaign_budget',
    category: 'marketing',
    level: 'tenant',
    valueType: 'number',
    sensitivity: 'internal',
    defaultValue: 50000,
    validation: { min: 0 },
    label: '营销活动默认预算 (分)',
  },
  {
    key: 'inventory.low_stock_threshold',
    category: 'inventory',
    level: 'tenant',
    valueType: 'number',
    sensitivity: 'internal',
    defaultValue: 10,
    label: '库存预警阈值',
  },
  {
    key: 'integration.webhook_url',
    category: 'integration',
    level: 'tenant',
    valueType: 'secret',
    sensitivity: 'secret',
    label: 'Webhook URL (加密)',
  },
  {
    key: 'ai.default_model',
    category: 'ai',
    level: 'tenant',
    valueType: 'string',
    sensitivity: 'internal',
    defaultValue: 'gpt-4o-mini',
    validation: { enum: ['gpt-4o-mini', 'gpt-4o', 'claude-3.5-sonnet', 'deepseek-chat'] },
    label: '默认 AI 模型',
  },

  // W-B 品牌级
  {
    key: 'compliance.audit_retention_days',
    category: 'compliance',
    level: 'brand',
    valueType: 'number',
    sensitivity: 'restricted',
    defaultValue: 180,
    validation: { min: 30, max: 2555 },
    label: '审计保留天数 (V9 需求 2: 180 天)',
  },
  {
    key: 'billing.tax_id',
    category: 'billing',
    level: 'brand',
    valueType: 'secret',
    sensitivity: 'secret',
    label: '品牌方税号 (加密)',
  },
  {
    key: 'branding.logo_url',
    category: 'branding',
    level: 'brand',
    valueType: 'string',
    sensitivity: 'public',
    defaultValue: '',
    label: '品牌 Logo URL',
  },
  {
    key: 'branding.primary_color',
    category: 'branding',
    level: 'brand',
    valueType: 'string',
    sensitivity: 'public',
    defaultValue: '#1677ff',
    validation: { pattern: '^#[0-9A-Fa-f]{6}$' },
    label: '品牌主色',
  },
]
