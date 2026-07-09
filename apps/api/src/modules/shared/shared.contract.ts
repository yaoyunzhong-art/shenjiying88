/**
 * 🐜 自动: [shared] [A] contract 补全
 *
 * Shared：跨模块合约类型
 * 定义 shared 模块对外暴露的稳定合约接口。
 */
import type {
  PaginatedResult,
  ApiResponse,
  SortDirection,
} from './shared.entity'

export interface PaginatedResultContract<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponseContract<T> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
  timestamp: string
}

export function toPaginatedResultContract<T>(full: PaginatedResult<T>): PaginatedResultContract<T> {
  return {
    data: full.data,
    total: full.total,
    page: full.page,
    pageSize: full.pageSize,
    totalPages: Math.ceil(full.total / full.pageSize),
  }
}

export function toApiResponseContract<T>(data: T): ApiResponseContract<T> {
  return { success: true, data, timestamp: new Date().toISOString() }
}

export function toErrorApiResponseContract(error: string, errorCode?: string): ApiResponseContract<never> {
  return { success: false, error, errorCode, timestamp: new Date().toISOString() }
}

export type { PaginatedResult, ApiResponse, SortDirection }
