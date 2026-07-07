/**
 * doc.entity.ts - API文档模块实体定义
 */

/** 支持的文档导出格式 */
export type DocExportFormat =
  | 'openapi-json'
  | 'openapi-yaml'
  | 'redoc-html'
  | 'postman-collection'
  | 'insomnia-export'

/** 文档生成请求 */
export interface DocGenerateRequest {
  title: string
  version: string
  description?: string
  format: DocExportFormat
  servers?: string[]
  tags?: string[]
}

/** 文档生成响应 */
export interface DocGenerateResponse {
  title: string
  version: string
  format: DocExportFormat
  content: string
  generatedAt: string
  sizeBytes: number
}

/** 文档配置 */
export interface DocConfig {
  id: string
  title: string
  description: string
  version: string
  defaultFormat: DocExportFormat
  servers: string[]
  enabledTags: string[]
  securitySchemes: Array<{
    name: string
    type: string
    scheme?: string
    description?: string
  }>
  createdAt: string
  updatedAt: string
}

/** 端点注册信息 */
export interface DocEndpointInfo {
  controllerName: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  summary: string
  description?: string
  deprecated?: boolean
}

/** 文档统计 */
export interface DocStats {
  totalEndpoints: number
  totalSchemas: number
  totalTags: number
  endpointMethods: Record<string, number>
  generatedFormats: DocExportFormat[]
  lastGeneratedAt?: string
}

/** 文档页面选项 */
export interface DocPageOptions {
  title: string
  version: string
  description?: string
  logoUrl?: string
  faviconUrl?: string
  theme?: 'light' | 'dark' | 'auto'
  showTags?: boolean
  sortEndpoints?: 'alpha' | 'method'
}
