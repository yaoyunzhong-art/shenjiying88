/**
 * 三级独立配置 - 类型 (V9 需求 4 · V10 Day 6)
 *
 * 5 端共享类型定义 (PC/H5/APP/Pad/小程序)
 */

export type ConfigLevel = 'store' | 'tenant' | 'brand'

export type WorkbenchCode = 'W-S' | 'W-T' | 'W-B'

export type ConfigCategory =
  | 'pos' | 'print' | 'member' | 'marketing' | 'inventory'
  | 'integration' | 'ai' | 'compliance' | 'billing' | 'branding'

export type ConfigSensitivity = 'public' | 'internal' | 'restricted' | 'secret'

export type ConfigValueType = 'string' | 'number' | 'boolean' | 'json' | 'secret'

/** 配置项定义 */
export interface ConfigItemDefinition {
  key: string
  category: ConfigCategory
  level: ConfigLevel
  valueType: ConfigValueType
  sensitivity: ConfigSensitivity
  defaultValue?: string | number | boolean | null
  allowedRoles?: string[]
  required?: boolean
  validation?: { pattern?: string; min?: number; max?: number; enum?: string[] }
  label: string
  description?: string
}

/** 配置实例 */
export interface ConfigResponse {
  id: string
  key: string
  value: string
  category: ConfigCategory
  level: ConfigLevel
  ownerId: string
  inherits: boolean
  version: number
  updatedBy: string
  updatedAt: string
  isMasked?: boolean
}

/** 生效配置 (考虑继承) */
export interface EffectiveConfig {
  key: string
  value: string
  sourceLevel: ConfigLevel
  inherited: boolean
  isMasked?: boolean
}

/** 工作台显示卡片 */
export interface WorkbenchCard {
  workbench: WorkbenchCode
  title: string
  description: string
  level: ConfigLevel
  configCount: number
  categories: ConfigCategory[]
  color: string
  icon: string
}

/** 三级工作台元数据 */
export const WORKBENCH_CARDS: WorkbenchCard[] = [
  {
    workbench: 'W-S',
    title: '门店工作台',
    description: '门店操作员日常配置:POS/打印/会员签到',
    level: 'store',
    configCount: 4,
    categories: ['pos', 'print', 'member'],
    color: '#52c41a',
    icon: 'shop',
  },
  {
    workbench: 'W-T',
    title: '租户工作台',
    description: '连锁租户管理:会员体系/营销/库存/AI',
    level: 'tenant',
    configCount: 5,
    categories: ['member', 'marketing', 'inventory', 'integration', 'ai'],
    color: '#1677ff',
    icon: 'cluster',
  },
  {
    workbench: 'W-B',
    title: '品牌工作台',
    description: '品牌方管控:合规/计费/品牌标准',
    level: 'brand',
    configCount: 4,
    categories: ['compliance', 'billing', 'branding'],
    color: '#722ed1',
    icon: 'crown',
  },
]

/** 三级分类标签 */
export const CATEGORY_LABELS: Record<ConfigCategory, string> = {
  pos: 'POS/收银',
  print: '打印/小票',
  member: '会员',
  marketing: '营销',
  inventory: '库存',
  integration: '对接',
  ai: 'AI 模型',
  compliance: '合规',
  billing: '计费',
  branding: '品牌',
}

/** 敏感度标签 */
export const SENSITIVITY_LABELS: Record<ConfigSensitivity, string> = {
  public: '公开',
  internal: '内部',
  restricted: '受限',
  secret: '密钥',
}

/** 敏感度颜色 */
export const SENSITIVITY_COLORS: Record<ConfigSensitivity, string> = {
  public: '#52c41a',
  internal: '#1677ff',
  restricted: '#fa8c16',
  secret: '#f5222d',
}
