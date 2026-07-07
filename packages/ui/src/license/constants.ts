/**
 * License Constants (V9 需求 2 · V10 Day 19 Phase 88)
 *
 * 付费授权模块常量定义
 */

// ===== 授权范围定义 =====

export const LICENSE_SCOPES = {
  // AI 能力
  AI_CAPABILITY: 'ai.capability',
  AI_CHAT: 'ai.chat',
  AI_VISION: 'ai.vision',
  AI_EMBEDDING: 'ai.embedding',

  // 数据分析
  ANALYTICS: 'analytics',
  ANALYTICS_REALTIME: 'analytics.realtime',
  ANALYTICS_REPORT: 'analytics.report',

  // 存储服务
  STORAGE: 'storage',
  STORAGE_FILE: 'storage.file',
  STORAGE_DB: 'storage.db',

  // API 调用
  API: 'api',
  API_RATE: 'api.rate',
  API_WEBHOOK: 'api.webhook',

  // 集成服务
  INTEGRATION: 'integration',
  INTEGRATION_EXPORT: 'integration.export',
  INTEGRATION_IMPORT: 'integration.import',
} as const

// ===== 授权范围标签 =====

export const LICENSE_SCOPE_LABELS: Record<string, string> = {
  [LICENSE_SCOPES.AI_CAPABILITY]: 'AI 能力',
  [LICENSE_SCOPES.AI_CHAT]: 'AI 对话',
  [LICENSE_SCOPES.AI_VISION]: 'AI 视觉',
  [LICENSE_SCOPES.AI_EMBEDDING]: 'AI 嵌入',
  [LICENSE_SCOPES.ANALYTICS]: '数据分析',
  [LICENSE_SCOPES.ANALYTICS_REALTIME]: '实时分析',
  [LICENSE_SCOPES.ANALYTICS_REPORT]: '报表分析',
  [LICENSE_SCOPES.STORAGE]: '存储服务',
  [LICENSE_SCOPES.STORAGE_FILE]: '文件存储',
  [LICENSE_SCOPES.STORAGE_DB]: '数据库存储',
  [LICENSE_SCOPES.API]: 'API 调用',
  [LICENSE_SCOPES.API_RATE]: 'API 限流',
  [LICENSE_SCOPES.API_WEBHOOK]: 'Webhook',
  [LICENSE_SCOPES.INTEGRATION]: '集成服务',
  [LICENSE_SCOPES.INTEGRATION_EXPORT]: '数据导出',
  [LICENSE_SCOPES.INTEGRATION_IMPORT]: '数据导入',
}

// ===== 授权状态标签 =====

export const LICENSE_STATUS_LABELS: Record<string, string> = {
  active: '有效',
  suspended: '已暂停',
  expired: '已过期',
  trial: '试用中',
}

// ===== 授权状态颜色 =====

export const LICENSE_STATUS_COLORS: Record<string, string> = {
  active: '#52c41a',
  suspended: '#faad14',
  expired: '#ff4d4f',
  trial: '#1890ff',
}

// ===== 授权级别标签 =====

export const LICENSE_LEVEL_LABELS: Record<string, string> = {
  tenant: '租户级',
  store: '门店级',
}

// ===== 默认配置 =====

export const LICENSE_DEFAULT_TTL = 300 // 5分钟 (秒)

export const LICENSE_DEFAULT_NULL_TTL = 60 // 1分钟 (秒)

export const LICENSE_DEFAULT_FALLBACK_TIMEOUT = 100 // 100毫秒

export const LICENSE_DEFAULT_KEY_PREFIX = 'license:'

// ===== 分页配置 =====

export const LICENSE_DEFAULT_PAGE_SIZE = 10

export const LICENSE_MAX_PAGE_SIZE = 100

// ===== 缓存配置 =====

export const LICENSE_CACHE_TTL = 5 * 60 * 1000 // 5分钟 (毫秒)

export const LICENSE_CACHE_MAX_SIZE = 100 // 最大缓存条目数

// ===== 激活码配置 =====

export const ACTIVATION_CODE_PATTERN = /^LIC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

export const ACTIVATION_CODE_MAX_ATTEMPTS = 5

export const ACTIVATION_CODE_BLOCK_DURATION = 5 * 60 // 5分钟 (秒)

// ===== 配额警告阈值 =====

export const QUOTA_WARNING_THRESHOLD = 70 // 70%

export const QUOTA_CRITICAL_THRESHOLD = 90 // 90%

export const QUOTA_EXHAUSTED_THRESHOLD = 100 // 100%

// ===== 提醒阈值 =====

export const EXPIRY_WARNING_DAYS = 7 // 7天

export const EXPIRY_CRITICAL_DAYS = 3 // 3天

// ===== 默认授权期限 =====

export const LICENSE_DEFAULT_DURATION_DAYS = 365 // 1年

export const TRIAL_DEFAULT_DURATION_DAYS = 14 // 14天

// ===== 审计日志配置 =====

export const AUDIT_LOG_RETENTION_DAYS = 180 // 180天

export const AUDIT_LOG_MAX_QUERY_LIMIT = 500

// ===== 错误码 =====

export const LICENSE_ERROR_CODES = {
  INVALID_LICENSE: 'INVALID_LICENSE',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  LICENSE_SUSPENDED: 'LICENSE_SUSPENDED',
  LICENSE_NOT_FOUND: 'LICENSE_NOT_FOUND',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_CODE: 'INVALID_CODE',
  CODE_EXPIRED: 'CODE_EXPIRED',
  CODE_ALREADY_USED: 'CODE_ALREADY_USED',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  SCOPE_MISMATCH: 'SCOPE_MISMATCH',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
} as const

// ===== 事件类型 =====

export const LICENSE_EVENT_TYPES = {
  LICENSE_ACTIVATED: 'license:activated',
  LICENSE_SUSPENDED: 'license:suspended',
  LICENSE_EXPIRED: 'license:expired',
  LICENSE_RENEWED: 'license:renewed',
  QUOTA_EXCEEDED: 'license:quota:exceeded',
} as const

// ===== 默认导出 =====

const _default = {}
export default _default
