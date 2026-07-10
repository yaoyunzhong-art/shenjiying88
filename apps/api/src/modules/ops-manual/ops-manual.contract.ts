/**
 * 🐜 自动: [ops-manual] [D] contract 补全
 *
 * 运营手册模块：跨模块合约类型
 * 定义 ops-manual 模块对外暴露的稳定合约接口，
 * 供 bootstrap, report, training, content, agent 等模块消费。
 */

import type {
  OpsManualRole,
  OpsManualRecord,
  OpsManualSearchLog,
} from './ops-manual.entity'
import type { OpsManualExportFormat } from './ops-manual.entity'
import type { GenerateManualDto, ExportManualResponseDto } from './ops-manual.dto'

/**
 * 手册生成请求合约（跨模块安全子集）
 */
export interface ManualGenerateContract {
  role: OpsManualRole
  tenantId: string
  exportFormat?: OpsManualExportFormat
  generatedBy?: string
}

/**
 * 手册导出请求合约
 */
export interface ManualExportContract {
  role: OpsManualRole
  format: OpsManualExportFormat
  tenantId?: string
}

/**
 * 手册搜索请求合约
 */
export interface ManualSearchContract {
  role: OpsManualRole
  keyword: string
  tenantId?: string
  searchedBy?: string
}

/**
 * 搜索条目合约
 */
export interface SearchEntryContract {
  sectionId: string
  title: string
  matchedContent: string
}

/**
 * 手册元信息响应合约
 */
export interface ManualInfoContract {
  title: string
  version: string
  sections: number
  estimatedReadTime: number
  lastUpdated: string
}

/**
 * SOP 步骤合约
 */
export interface SOPStepContract {
  step: number
  action: string
  script: string
  tips?: string
}

/**
 * 运营手册记录合约（数据库持久化子集）
 */
export interface ManualRecordContract {
  id: string
  tenantId: string
  role: string
  title: string
  version: string
  exportFormat: string
  content?: string
  totalSections: number
  totalPages: number
  estimatedReadTime: number
  generatedBy?: string
  createdAt: string
  updatedAt: string
}

/**
 * 运营手册模块对外合约导出索引
 */
export type {
  OpsManualRole,
  OpsManualExportFormat,
  OpsManualRecord,
  OpsManualSearchLog,
}

/**
 * OpsManualRole 角色字面量合约
 */
export const OPS_MANUAL_ROLES: OpsManualRole[] = [
  'store_manager',
  'sales_staff',
  'cashier',
  'customer_service',
] as const

/**
 * OpsManualExportFormat 导出格式字面量合约
 */
export const OPS_MANUAL_EXPORT_FORMATS: OpsManualExportFormat[] = [
  'markdown',
  'html',
  'pdf-json',
  'checklist',
] as const

/**
 * 运营手册模块合约常量
 */
export const OPS_MANUAL_CONSTANTS = {
  DEFAULT_VERSION: '1.0.0',
  MAX_SEARCH_RESULTS: 50,
  DEFAULT_PAGE_SIZE: 10,
  MIN_KEYWORD_LENGTH: 2,
} as const
