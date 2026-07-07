/**
 * License API Types (V9 需求 2 · V10 Day 19 Phase 88)
 *
 * API 相关类型定义
 */

// ===== API 配置 =====

export interface APIConfig {
  baseURL: string
  timeout: number
  headers?: Record<string, string>
}

// ===== API 响应 =====

export interface APIResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: string
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, unknown>
  stack?: string
}

export interface APIPaginationParams {
  page?: number
  pageSize?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface APIPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ===== HTTP 方法类型 =====

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// ===== 请求选项 =====

export interface RequestOptions {
  method?: HTTPMethod
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
  retries?: number
  cache?: boolean
}

// ===== 拦截器类型 =====

export type RequestInterceptor = (config: RequestOptions) => RequestOptions | Promise<RequestOptions>
export type ResponseInterceptor<T> = (response: APIResponse<T>) => APIResponse<T> | Promise<APIResponse<T>>
export type ErrorInterceptor = (error: APIError) => APIError | Promise<APIError>

// ===== 轮询配置 =====

export interface PollingConfig {
  enabled: boolean
  interval: number // milliseconds
  maxRetries?: number
  stopOnError?: boolean
}

// ===== SSE 配置 =====

export interface SSEConfig {
  url: string
  events: string[]
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

// ===== 缓存配置 =====

export interface CacheConfig {
  enabled: boolean
  ttl: number // milliseconds
  keyGenerator?: (url: string, options: RequestOptions) => string
}

// ===== 重试配置 =====

export interface RetryConfig {
  maxRetries: number
  retryDelay: number | ((attempt: number) => number)
  retryCondition?: (error: APIError) => boolean
  exponentialBackoff?: boolean
}

// ===== 批量请求配置 =====

export interface BatchRequestConfig {
  enabled: boolean
  maxBatchSize: number
  batchInterval: number // milliseconds
  groupBy?: (request: RequestOptions) => string
}

// ===== 文件上传配置 =====

export interface UploadConfig {
  maxFileSize: number // bytes
  allowedTypes: string[]
  chunkSize?: number // bytes for chunked upload
  concurrentUploads?: number
  resumeEnabled?: boolean
}

// ===== 下载配置 =====

export interface DownloadConfig {
  responseType: 'blob' | 'arraybuffer' | 'text' | 'json'
  onProgress?: (progress: { loaded: number; total: number }) => void
  saveAs?: string
}

// ===== 安全配置 =====

export interface SecurityConfig {
  csrfToken?: string
  authHeader?: string
  authScheme?: 'Bearer' | 'Basic' | 'ApiKey'
  signatureEnabled?: boolean
  encryptionEnabled?: boolean
}

// ===== 监控配置 =====

export interface MonitoringConfig {
  enabled: boolean
  logRequests: boolean
  logErrors: boolean
  metricsEnabled: boolean
  performanceTracking: boolean
  errorReporting: boolean
}

// ===== 完整 API 客户端配置 =====

export interface APIClientConfig {
  baseURL: string
  timeout: number
  headers?: Record<string, string>
  request?: RequestOptions
  retry?: RetryConfig
  cache?: CacheConfig
  polling?: PollingConfig
  sse?: SSEConfig
  batch?: BatchRequestConfig
  upload?: UploadConfig
  download?: DownloadConfig
  security?: SecurityConfig
  monitoring?: MonitoringConfig
  interceptors?: {
    request?: RequestInterceptor[]
    response?: ResponseInterceptor<unknown>[]
    error?: ErrorInterceptor[]
  }
}

// Re-export
const _default = {}
export default _default
