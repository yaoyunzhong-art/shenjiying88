/**
 * i18n.entity.ts - Phase-20 T44
 * 用途: 国际化实体定义
 *
 * 核心实体:
 * - TranslationEntry: 单条翻译条目
 * - LocaleConfig: 区域配置
 * - TranslationNamespace: 翻译命名空间 (用于模块隔离)
 */
import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * 支持的区域 (locale) 枚举
 */
export type Locale = 'zh-CN' | 'en-US' | 'ja-JP'

/**
 * 翻译条目状态
 */
export enum TranslationEntryStatus {
  /** 已翻译 */
  Translated = 'TRANSLATED',
  /** 待翻译 */
  Pending = 'PENDING',
  /** 未填写 (占位) */
  Empty = 'EMPTY',
}

/**
 * 单条翻译条目
 */
export interface TranslationEntry {
  /** 翻译条目 ID */
  id: string
  /** 翻译 key (支持嵌套: 'order.status.paid') */
  key: string
  /** 目标区域 */
  locale: Locale
  /** 翻译值 */
  value: string
  /** 状态 */
  status: TranslationEntryStatus
  /** 命名空间 (模块名, 用于隔离) */
  namespace: string
  /** 是否带 plural 规则 */
  hasPlural: boolean
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 租户上下文 */
  tenantContext: RequestTenantContext
}

/**
 * 翻译命名空间
 */
export interface TranslationNamespace {
  /** 命名空间 ID */
  id: string
  /** 名称 (如 'order', 'member', 'payment') */
  name: string
  /** 描述 */
  description?: string
  /** 负责人 */
  owner?: string
  /** 模块类型 */
  moduleType: 'core' | 'feature' | 'ui'
  /** key 总数 */
  totalKeys: number
  /** 已翻译数 */
  translatedCount: number
  /** 启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: string
}

/**
 * 区域配置
 */
export interface LocaleConfig {
  /** 区域 */
  locale: Locale
  /** 显示名称 */
  displayName: string
  /** 原生名称 */
  nativeName: string
  /** 是否启用 */
  enabled: boolean
  /** 排序优先级 */
  sortOrder: number
  /** 是否右到左布局 */
  rtl: boolean
}

/**
 * 默认的区域配置
 */
export const DEFAULT_LOCALE_CONFIGS: LocaleConfig[] = [
  { locale: 'zh-CN', displayName: '简体中文', nativeName: '简体中文', enabled: true, sortOrder: 1, rtl: false },
  { locale: 'en-US', displayName: 'English (US)', nativeName: 'English (US)', enabled: true, sortOrder: 2, rtl: false },
  { locale: 'ja-JP', displayName: '日本語', nativeName: '日本語', enabled: true, sortOrder: 3, rtl: false },
]

/**
 * 支持的 locale 列表
 */
export const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en-US', 'ja-JP']

/**
 * 默认 locale
 */
export const DEFAULT_LOCALE: Locale = 'zh-CN'
