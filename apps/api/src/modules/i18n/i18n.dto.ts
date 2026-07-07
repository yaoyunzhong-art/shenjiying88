/**
 * i18n.dto.ts - Phase-20 T44
 * 用途: 国际化模块请求/响应 DTO
 */
import type { Locale } from './i18n.entity'

/**
 * 翻译查询参数 DTO
 */
export class TranslationQueryDto {
  /** 区域筛选 */
  locale?: Locale
  /** 命名空间筛选 */
  namespace?: string
  /** 搜索关键字 (key 或 value 匹配) */
  keyword?: string
  /** 状态筛选 */
  status?: string
  /** 分页页码 */
  page?: number
  /** 每页条数 */
  pageSize?: number
}

/**
 * 创建翻译条目 DTO
 */
export class CreateTranslationDto {
  /** 翻译 key (支持嵌套) */
  key!: string
  /** 目标区域 */
  locale!: Locale
  /** 翻译值 */
  value!: string
  /** 命名空间 */
  namespace?: string
  /** 是否带 plural 规则 */
  hasPlural?: boolean
}

/**
 * 更新翻译条目 DTO
 */
export class UpdateTranslationDto {
  /** 翻译值 */
  value?: string
  /** 状态 */
  status?: string
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 批量注册翻译 DTO
 */
export class BulkRegisterTranslationDto {
  /** 区域 */
  locale!: Locale
  /** key-value 翻译映射 */
  translations!: Record<string, string>
  /** 命名空间 */
  namespace?: string
}

/**
 * 翻译校验请求 DTO
 */
export class ValidateTranslationsDto {
  /** 参考区域 (key 来源) */
  referenceLocale?: Locale
}

/**
 * 翻译校验报告 DTO
 */
export class ValidationReportDto {
  referenceLocale!: string
  totalKeys!: number
  /** 各区域完整性 */
  completeness!: Record<string, {
    present: number
    missing: number
    missingKeys: string[]
  }>
  /** 空值条目 */
  emptyValues!: Record<string, string[]>
}

/**
 * 区域配置更新 DTO
 */
export class UpdateLocaleConfigDto {
  /** 显示名称 */
  displayName?: string
  /** 是否启用 */
  enabled?: boolean
  /** 排序优先级 */
  sortOrder?: number
}

/**
 * 翻译 key 提取 DTO
 */
export class ExtractKeysDto {
  /** 源码内容 */
  source!: string
}

/**
 * 翻译 key 提取结果 DTO
 */
export class ExtractKeysResultDto {
  keys!: string[]
  totalCount!: number
}
