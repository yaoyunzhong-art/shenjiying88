/**
 * docs.service.ts — Docs Service (canonical name)
 *
 * API 文档模块入口。
 * 统一导出文档生成 & 端点注册的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   DocService             文档生成编排 & 端点/Schema 管理
 *   SwaggerGenService      OpenAPI 规范生成 & 多格式导出
 *
 * 实体类型 ─────────────────────
 *   DocExportFormat        文档导出格式 (openapi-json/yaml, redoc-html, postman, insomnia)
 *   DocGenerateRequest     文档生成请求
 *   DocGenerateResponse    文档生成响应
 *   DocConfig              文档配置 (标题/版本/服务器/安全方案)
 *   DocEndpointInfo        端点注册信息
 *   DocStats               文档统计
 *   DocPageOptions         文档页面选项
 *
 * DTO 类型 ─────────────────────
 *   DocExportFormatEnum    文档格式枚举 (class)
 *   DocGenerateRequestDto  生成请求 DTO
 *   RegisterEndpointRequestDto 注册端点 DTO
 *   RegisterSchemaRequestDto   注册 Schema DTO
 *   DocConfigUpdateDto     配置更新 DTO
 *   AddTagRequestDto       添加标签 DTO
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { DocService, DocExportFormat } from './docs.service'
 *   const svc = app.get(DocService)
 *   const doc = svc.generate('My API', '1.0.0', 'openapi-json')
 *
 * @module Docs
 */

export { DocService } from './doc.service'
export { SwaggerGenService } from './swagger-gen.service'

// ─── 实体类型 ───────────────────────────────────────────────────────────────
export type {
  DocExportFormat,
  DocGenerateRequest,
  DocGenerateResponse,
  DocConfig,
  DocEndpointInfo,
  DocStats,
  DocPageOptions,
} from './doc.entity'

// ─── DTO ────────────────────────────────────────────────────────────────────
export {
  DocExportFormatEnum,
  DocGenerateRequestDto,
  RegisterEndpointRequestDto,
  RegisterSchemaRequestDto,
  DocConfigUpdateDto,
  AddTagRequestDto,
} from './doc.dto'

// ─── 实用常量 ───────────────────────────────────────────────────────────────
export const DEFAULT_DOC_TITLE = 'API Documentation'
export const DEFAULT_DOC_VERSION = '1.0.0'
export const SUPPORTED_EXPORT_FORMATS = [
  'openapi-json',
  'openapi-yaml',
  'redoc-html',
  'postman-collection',
  'insomnia-export',
]
export const DEFAULT_DOC_SERVERS = ['http://localhost:3000']
export const DOC_GENERATION_TIMEOUT_MS = 30_000
export const MAX_ENDPOINTS_PER_PAGE = 100
export const DEFAULT_REDOC_THEME = 'light' as const
export const DOC_SWAGGER_UI_PATH = 'docs'
export const DOC_REDOC_PATH = 'redoc'
export const DOC_OPENAPI_JSON_PATH = 'openapi.json'
export const DOC_OPENAPI_YAML_PATH = 'openapi.yaml'
