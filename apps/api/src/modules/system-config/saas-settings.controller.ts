/**
 * 🐜 V23 SaaS 配置设置 - Controller
 *
 * 系统级配置/SaaS Settings 管理接口 (V23 PRD 需求)
 *
 * 核心能力:
 * - 全局功能开关管理 (Feature Flags)
 * - 平台级系统设置 CRUD (rate limit / maintenance / whitelist)
 * - 租户配置默认值 (SaaS 预设)
 * - 配置变更审计 (30 天保留)
 *
 * 与 tenant-config 的关系:
 * - tenant-config: 租户内三级配置 (W-S / W-T / W-B), 按 level+ownerId 隔离
 * - system-config: 全局系统/平台级配置, 跨租户共享
 *
 * 安全:
 * - 所有变更操作 (POST/PUT/DELETE) 需 super_admin 权限
 * - 查询 GET 开放给 super_admin / brand_admin / auditor
 * - 操作审计日志记录 operator + timestamp
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { requireTenantContext } from '../../common/context/tenant-context'
import { TenantGuard } from '../agent/tenant.guard'

// ============ 类型定义 ============

/** SaaS 系统设置分类 */
export type SystemSettingCategory =
  | 'feature_flag'       // 功能开关
  | 'rate_limit'         // 限流
  | 'maintenance'        // 维护模式
  | 'whitelist'          // IP/域名白名单
  | 'sso'                // SSO 认证
  | 'notification'       // 通知
  | 'platform'           // 平台级设置

/** SaaS 系统设置项值类型 */
export type SystemSettingValueType = 'boolean' | 'number' | 'string' | 'json' | 'json_array'

/** SaaS 系统设置项 */
export interface SystemSetting {
  /** 设置键 (e.g. "feature_flag.auto_approve_new_tenant") */
  key: string
  /** 分类 */
  category: SystemSettingCategory
  /** 值 (统一字符串化存储) */
  value: string
  /** 值类型 (用于反序列化校验) */
  valueType: SystemSettingValueType
  /** 描述 */
  description: string
  /** 默认值 */
  defaultValue: string
  /** 修改人 */
  updatedBy: string
  /** 修改时间 */
  updatedAt: string
  /** 版本 (乐观锁, 递增) */
  version: number
}

/** 功能开关项 */
export interface FeatureFlag extends SystemSetting {
  /** 所属租户 (空 = 全局) */
  tenantId?: string
  /** 是否启用 */
  enabled: boolean
}

export interface SystemSettingAuditLog {
  id: string
  key: string
  category: SystemSettingCategory
  previousValue: string
  newValue: string
  operator: string
  operatorRole: string
  timestamp: string
}

// ============ 内置 SaaS 系统设置定义 ============

const BUILTIN_SETTINGS: Map<string, SystemSetting> = new Map([
  [
    'feature_flag.auto_approve_new_tenant',
    {
      key: 'feature_flag.auto_approve_new_tenant',
      category: 'feature_flag',
      value: 'false',
      valueType: 'boolean',
      description: '新租户注册自动审核开关 (true=自动批准, false=需管理员确认)',
      defaultValue: 'false',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'feature_flag.platform_whitelist_enabled',
    {
      key: 'feature_flag.platform_whitelist_enabled',
      category: 'feature_flag',
      value: 'false',
      valueType: 'boolean',
      description: 'IP 白名单功能总开关',
      defaultValue: 'false',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'rate_limit.api_global',
    {
      key: 'rate_limit.api_global',
      category: 'rate_limit',
      value: '1000',
      valueType: 'number',
      description: '全局 API 限流 (QPS)',
      defaultValue: '1000',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'rate_limit.api_per_tenant',
    {
      key: 'rate_limit.api_per_tenant',
      category: 'rate_limit',
      value: '100',
      valueType: 'number',
      description: '每租户 API 限流 (QPS)',
      defaultValue: '100',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'maintenance.mode',
    {
      key: 'maintenance.mode',
      category: 'maintenance',
      value: 'false',
      valueType: 'boolean',
      description: '平台维护模式 (true=仅 super_admin 可访问)',
      defaultValue: 'false',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'maintenance.message',
    {
      key: 'maintenance.message',
      category: 'maintenance',
      value: '系统维护中，请稍后访问',
      valueType: 'string',
      description: '维护模式提示消息',
      defaultValue: '系统维护中，请稍后访问',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'whitelist.allowed_ips',
    {
      key: 'whitelist.allowed_ips',
      category: 'whitelist',
      value: '[]',
      valueType: 'json_array',
      description: '平台级 IP 白名单 (JSON 数组, 仅当 platform_whitelist_enabled=true 时生效)',
      defaultValue: '[]',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'whitelist.allowed_domains',
    {
      key: 'whitelist.allowed_domains',
      category: 'whitelist',
      value: '["shenjiying.com"]',
      valueType: 'json_array',
      description: '允许的 CORS 域名白名单',
      defaultValue: '["shenjiying.com"]',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'sso.default_provider',
    {
      key: 'sso.default_provider',
      category: 'sso',
      value: 'internal',
      valueType: 'string',
      description: '默认 SSO 提供商 (internal / wechat / dingtalk / custom)',
      defaultValue: 'internal',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'notification.email_global_enabled',
    {
      key: 'notification.email_global_enabled',
      category: 'notification',
      value: 'true',
      valueType: 'boolean',
      description: '全局邮件通知开关',
      defaultValue: 'true',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'notification.sms_global_enabled',
    {
      key: 'notification.sms_global_enabled',
      category: 'notification',
      value: 'true',
      valueType: 'boolean',
      description: '全局短信通知开关',
      defaultValue: 'true',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'platform.default_locale',
    {
      key: 'platform.default_locale',
      category: 'platform',
      value: 'zh-CN',
      valueType: 'string',
      description: '平台默认语言',
      defaultValue: 'zh-CN',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
  [
    'platform.session_timeout_minutes',
    {
      key: 'platform.session_timeout_minutes',
      category: 'platform',
      value: '1440',
      valueType: 'number',
      description: '会话超时时间 (分钟, 默认 24h)',
      defaultValue: '1440',
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ],
])

const ALLOWED_ADMIN_CATEGORIES: SystemSettingCategory[] = [
  'feature_flag',
  'rate_limit',
  'maintenance',
  'whitelist',
  'sso',
  'notification',
  'platform',
]

const ALLOWED_VALUE_TYPES: SystemSettingValueType[] = [
  'boolean',
  'number',
  'string',
  'json',
  'json_array',
]

// ============ Controller ============

@Controller('system-config')
@UseGuards(TenantGuard)
export class SystemConfigController {
  /** 内存存储 (生产环境应替换为数据库持久化) */
  private readonly settings: Map<string, SystemSetting> = new Map()
  /** 审计日志 */
  private readonly auditLogs: SystemSettingAuditLog[] = []

  constructor() {
    // 启动时复制内置设置
    for (const [key, setting] of BUILTIN_SETTINGS) {
      this.settings.set(key, { ...setting })
    }
  }

  // ============ GET /system-config ============

  /**
   * GET /system-config
   * 列出所有系统配置 (按分类过滤)
   */
  @Get()
  listSettings(
    @Query('category') category?: string,
  ): { items: SystemSetting[]; total: number; categories: SystemSettingCategory[] } {
    this.assertAdminOrAuditor()
    let items: SystemSetting[] = Array.from(this.settings.values())
    if (category && ALLOWED_ADMIN_CATEGORIES.includes(category as SystemSettingCategory)) {
      items = items.filter((s) => s.category === category)
    }
    return {
      items,
      total: items.length,
      categories: ALLOWED_ADMIN_CATEGORIES,
    }
  }

  // ============ GET /system-config/:key ============

  /**
   * GET /system-config/:key
   * 查询单个系统配置
   */
  @Get(':key')
  getSetting(@Param('key') key: string): SystemSetting {
    this.assertAdminOrAuditor()
    const setting = this.settings.get(key)
    if (!setting) {
      throw new NotFoundException(`System setting not found: ${key}`)
    }
    return setting
  }

  // ============ PUT /system-config/:key ============

  /**
   * PUT /system-config/:key
   * 更新系统配置 (仅 super_admin)
   */
  @Put(':key')
  @HttpCode(HttpStatus.OK)
  updateSetting(
    @Param('key') key: string,
    @Body() body: { value: string },
  ): SystemSetting {
    this.assertSuperAdmin()
    const existing = this.settings.get(key)
    if (!existing) {
      throw new NotFoundException(`System setting not found: ${key}`)
    }
    const prevValue = existing.value
    this.validateSystemValue(existing.valueType, body.value)
    existing.value = body.value
    existing.version += 1
    existing.updatedBy = this.getCurrentUserId()
    existing.updatedAt = new Date().toISOString()

    // 记录审计
    this.recordAudit(key, existing.category, prevValue, body.value)
    return { ...existing }
  }

  // ============ POST /system-config ============

  /**
   * POST /system-config
   * 创建新的系统配置 (仅 super_admin)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSetting(
    @Body() body: {
      key: string
      category: SystemSettingCategory
      value: string
      valueType: SystemSettingValueType
      description: string
    },
  ): SystemSetting {
    this.assertSuperAdmin()
    if (this.settings.has(body.key)) {
      throw new BadRequestException(`System setting already exists: ${body.key}`)
    }
    if (!ALLOWED_ADMIN_CATEGORIES.includes(body.category)) {
      throw new BadRequestException(
        `Invalid category: ${body.category}. Allowed: ${ALLOWED_ADMIN_CATEGORIES.join(', ')}`,
      )
    }
    if (!ALLOWED_VALUE_TYPES.includes(body.valueType)) {
      throw new BadRequestException(
        `Invalid valueType: ${body.valueType}. Allowed: ${ALLOWED_VALUE_TYPES.join(', ')}`,
      )
    }
    this.validateSystemValue(body.valueType, body.value)

    const now = new Date().toISOString()
    const setting: SystemSetting = {
      key: body.key,
      category: body.category,
      value: body.value,
      valueType: body.valueType,
      description: body.description,
      defaultValue: body.value,
      updatedBy: this.getCurrentUserId(),
      updatedAt: now,
      version: 1,
    }
    this.settings.set(body.key, setting)
    this.recordAudit(body.key, body.category, '', body.value)
    return { ...setting }
  }

  // ============ DELETE /system-config/:key ============

  /**
   * DELETE /system-config/:key
   * 删除系统配置 (仅 super_admin, 重置回默认值)
   */
  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  resetSetting(@Param('key') key: string): SystemSetting {
    this.assertSuperAdmin()
    const existing = this.settings.get(key)
    if (!existing) {
      throw new NotFoundException(`System setting not found: ${key}`)
    }
    const prevValue = existing.value
    existing.value = existing.defaultValue
    existing.version += 1
    existing.updatedBy = this.getCurrentUserId()
    existing.updatedAt = new Date().toISOString()

    this.recordAudit(key, existing.category, prevValue, existing.defaultValue)
    return { ...existing }
  }

  // ============ GET /system-config/meta/categories ============

  /**
   * GET /system-config/meta/categories
   * 获取系统配置分类列表
   */
  @Get('meta/categories')
  getCategories(): { categories: SystemSettingCategory[] } {
    return { categories: ALLOWED_ADMIN_CATEGORIES }
  }

  // ============ GET /system-config/meta/audit-log ============

  /**
   * GET /system-config/meta/audit-log
   * 获取系统配置变更审计日志 (仅 super_admin / auditor)
   */
  @Get('meta/audit-log')
  getAuditLog(
    @Query('limit') limit?: string,
  ): { items: SystemSettingAuditLog[]; total: number } {
    this.assertAdminOrAuditor()
    const maxLimit = Math.min(Math.max(Number(limit) || 50, 1), 200)
    const items = this.auditLogs.slice(-maxLimit).reverse()
    return { items, total: this.auditLogs.length }
  }

  // ============ 内部方法 ============

  private validateSystemValue(valueType: SystemSettingValueType, value: string): void {
    if (!value && valueType !== 'string') {
      throw new BadRequestException(`Value is required for type ${valueType}`)
    }
    switch (valueType) {
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          throw new BadRequestException(`Boolean value must be 'true' or 'false', got: ${value}`)
        }
        break
      case 'number': {
        const num = Number(value)
        if (Number.isNaN(num)) {
          throw new BadRequestException(`Number value must be numeric, got: ${value}`)
        }
        break
      }
      case 'json':
      case 'json_array':
        try {
          const parsed = JSON.parse(value)
          if (valueType === 'json_array' && !Array.isArray(parsed)) {
            throw new BadRequestException(`JSON array value must be an array, got: ${value}`)
          }
        } catch (e) {
          const message = e instanceof SyntaxError ? e.message : 'Invalid JSON'
          throw new BadRequestException(`Invalid ${valueType}: ${message}`)
        }
        break
      default:
        break
    }
  }

  private assertSuperAdmin(): void {
    const ctx = requireTenantContext()
    if (ctx.role !== 'super_admin') {
      throw new ForbiddenException(
        `[SystemConfig] Only super_admin can modify system settings, current role: ${ctx.role}`,
      )
    }
  }

  private assertAdminOrAuditor(): void {
    const ctx = requireTenantContext()
    if (
      ctx.role !== 'super_admin' &&
      ctx.role !== 'brand_admin' &&
      ctx.role !== 'auditor'
    ) {
      throw new ForbiddenException(
        `[SystemConfig] Insufficient role: ${ctx.role} (requires super_admin/brand_admin/auditor)`,
      )
    }
  }

  private getCurrentUserId(): string {
    try {
      const ctx = requireTenantContext()
      return ctx.userId ?? 'system'
    } catch {
      return 'system'
    }
  }

  private recordAudit(
    key: string,
    category: SystemSettingCategory,
    previousValue: string,
    newValue: string,
  ): void {
    const ctx = requireTenantContext()
    this.auditLogs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      key,
      category,
      previousValue,
      newValue,
      operator: ctx.userId ?? 'system',
      operatorRole: ctx.role ?? 'viewer',
      timestamp: new Date().toISOString(),
    })
    // 仅保留最近 1000 条
    if (this.auditLogs.length > 1000) {
      this.auditLogs.splice(0, this.auditLogs.length - 1000)
    }
  }
}
