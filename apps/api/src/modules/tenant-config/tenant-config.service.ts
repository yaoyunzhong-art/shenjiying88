/**
 * 三级独立配置 - Service (V9 需求 4 · V10 Day 6 Phase 90)
 *
 * 核心能力:
 * - 三级独立读写 (W-S / W-T / W-B)
 * - 字段级隔离 (按 sensitivity 脱敏)
 * - 实例级隔离 (按 ownerId + level)
 * - 角色权限校验 (ROLE_LEVEL_ACCESS)
 * - 继承链解析 (effective config)
 * - 审计日志 (V9 需求 2: 180 天)
 */

import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { requireTenantContext } from '../../common/context/tenant-context'
import { encryptField, decryptField } from '../ai-model-config/encryption.util'
import type { TenantContext, TenantRole } from '../../common/context/tenant-context'
import {
  BUILTIN_CONFIG_DEFINITIONS,
  CATEGORY_LEVEL_MATRIX,
  ROLE_LEVEL_ACCESS,
  WORKBENCH_TO_LEVEL,
  type ConfigInstance,
  type ConfigAuditLog,
  type ConfigItemDefinition,
  type ConfigLevel,
  type ConfigSensitivity,
  type EffectiveConfig,
  type GetConfigRequest,
  type SetConfigRequest,
  type WorkbenchCode,
} from './tenant-config.entity'

@Injectable()
export class TenantConfigService {
  /** 配置定义表 (静态 schema) */
  private readonly definitions = new Map<string, ConfigItemDefinition>()
  /** 配置实例存储: key -> level -> ownerId -> instance */
  private readonly instances = new Map<string, Map<string, Map<string, ConfigInstance>>>()
  /** 审计日志 */
  private readonly auditLogs: ConfigAuditLog[] = []

  constructor() {
    this.seed()
  }

  // ============ 1. 读取: 三级独立 (V9 需求 4) ============

  async getConfigs(req: GetConfigRequest): Promise<ConfigInstance[]> {
    const ctx = requireTenantContext()
    const level = req.level ?? this.roleDefaultLevel(ctx)
    this.assertLevelAccess(ctx, level)

    const levelMap = this.instances.get(level)
      ?? new Map<string, Map<string, ConfigInstance>>()

    const results: ConfigInstance[] = []
    for (const def of BUILTIN_CONFIG_DEFINITIONS) {
      if (def.level !== level) continue
      if (req.category && def.category !== req.category) continue
      if (req.keys && !req.keys.includes(def.key)) continue
      const ownerMap = levelMap.get(def.key)
      const instance = ownerMap?.get(this.ownerIdFor(ctx, level))
      if (instance) results.push(instance)
    }
    return results
  }

  async getEffectiveConfigs(category?: string): Promise<EffectiveConfig[]> {
    const ctx = requireTenantContext()
    const results: EffectiveConfig[] = []
    for (const def of BUILTIN_CONFIG_DEFINITIONS) {
      if (category && def.category !== category) continue
      if (!this.canAccessConfigKey(ctx, def)) continue
      const effective = this.resolveEffective(ctx, def)
      if (effective) {
        const masked = this.maskValue(def.sensitivity, effective.value)
        results.push({
          key: def.key,
          value: masked,
          sourceLevel: effective.sourceLevel,
          inherited: effective.inherited,
          sensitivity: def.sensitivity,
          isMasked: def.sensitivity === 'secret' || def.sensitivity === 'restricted',
        })
      }
    }
    return results
  }

  async getConfig(key: string): Promise<ConfigInstance | null> {
    const ctx = requireTenantContext()
    const def = this.definitions.get(key)
    if (!def) throw new NotFoundException(`Unknown config key: ${key}`)
    if (!this.canAccessConfigKey(ctx, def)) {
      throw new ForbiddenException(`Role ${ctx.role} cannot access ${key}`)
    }
    const levelMap = this.instances.get(def.level)
    const ownerMap = levelMap?.get(key)
    const inst = ownerMap?.get(this.ownerIdFor(ctx, def.level))
    if (!inst) return null
    // 解密后脱敏返回 (service 层负责 access control)
    const plain = inst.encrypted ? decryptField(inst.value) : inst.value
    const displayValue = this.maskValue(def.sensitivity, plain, false)
    return {
      ...inst,
      value: displayValue,
    }
  }

  // ============ 2. 写入: 三级独立 (V9 需求 4) ============

  async setConfig(req: SetConfigRequest): Promise<ConfigInstance> {
    const ctx = requireTenantContext()
    const def = this.definitions.get(req.key)
    if (!def) throw new NotFoundException(`Unknown config key: ${req.key}`)
    this.assertLevelAccess(ctx, def.level)

    this.validateValue(def, req.value)
    const ownerId = this.ownerIdFor(ctx, def.level)
    const encrypted = this.encryptIfSecret(def.sensitivity, req.value)

    const levelMap = this.ensureLevelMap(def.level)
    const ownerMap = levelMap.get(def.key) ?? new Map<string, ConfigInstance>()
    const existing = ownerMap.get(ownerId)
    const now = new Date().toISOString()

    const instance: ConfigInstance = existing
      ? {
          ...existing,
          value: encrypted.value,
          encrypted: encrypted.encrypted,
          version: existing.version + 1,
          inherits: req.inherits ?? existing.inherits,
          updatedBy: ctx.userId ?? 'system',
          updatedAt: now,
        }
      : {
          id: `cfg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          key: def.key,
          value: encrypted.value,
          encrypted: encrypted.encrypted,
          category: def.category,
          level: def.level,
          ownerId,
          inherits: req.inherits ?? false,
          version: 1,
          updatedBy: ctx.userId ?? 'system',
          updatedAt: now,
          createdAt: now,
        }

    ownerMap.set(ownerId, instance)
    levelMap.set(def.key, ownerMap)
    this.recordAudit({
      configId: instance.id,
      key: def.key,
      level: def.level,
      ownerId,
      action: existing ? 'update' : 'create',
      operator: ctx.userId ?? 'system',
      operatorRole: ctx.role ?? 'viewer',
      previousValue: existing ? this.maskValue(def.sensitivity, existing.value, existing.encrypted) : undefined,
      newValue: this.maskValue(def.sensitivity, encrypted.value, encrypted.encrypted),
    })
    return instance
  }

  async setConfigBatch(items: SetConfigRequest[]): Promise<ConfigInstance[]> {
    const results: ConfigInstance[] = []
    for (const item of items) {
      results.push(await this.setConfig(item))
    }
    return results
  }

  async rollback(targetVersion: number, configId: string): Promise<ConfigInstance> {
    const ctx = requireTenantContext()
    const all = this.flattenInstances()
    const target = all.find((c) => c.id === configId)
    if (!target) throw new NotFoundException(`Config ${configId} not found`)
    this.assertLevelAccess(ctx, target.level)

    const def = this.definitions.get(target.key)!
    target.version = targetVersion
    target.updatedBy = ctx.userId ?? 'system'
    target.updatedAt = new Date().toISOString()

    this.recordAudit({
      configId,
      key: target.key,
      level: target.level,
      ownerId: target.ownerId,
      action: 'rollback',
      operator: ctx.userId ?? 'system',
      operatorRole: ctx.role ?? 'viewer',
      context: { targetVersion },
    })
    return target
  }

  // ============ 3. 工作台视角 (W-S/W-T/W-B) ============

  async getWorkbenchConfigs(workbench: WorkbenchCode, category?: string): Promise<EffectiveConfig[]> {
    const ctx = requireTenantContext()
    const level = WORKBENCH_TO_LEVEL[workbench]
    this.assertLevelAccess(ctx, level)

    const results: EffectiveConfig[] = []
    for (const def of BUILTIN_CONFIG_DEFINITIONS) {
      if (def.level !== level) continue
      if (category && def.category !== category) continue
      const effective = this.resolveEffective(ctx, def)
      if (effective) {
        results.push({
          key: def.key,
          value: this.maskValue(def.sensitivity, effective.value),
          sourceLevel: effective.sourceLevel,
          inherited: effective.inherited,
          sensitivity: def.sensitivity,
          isMasked: def.sensitivity === 'secret' || def.sensitivity === 'restricted',
        })
      }
    }
    return results
  }

  // ============ 4. 审计日志 (V9 需求 2 180 天) ============

  listAuditLogs(tenantId: string, limit = 100): ConfigAuditLog[] {
    return this.auditLogs.filter((log) => log.ownerId.startsWith(tenantId)).slice(-limit).reverse()
  }

  // ============ 5. 内部工具 ============

  private assertLevelAccess(ctx: TenantContext, level: ConfigLevel): void {
    if (!ctx.role) {
      throw new ForbiddenException('[TenantConfig] Missing role in context')
    }
    const allowed = ROLE_LEVEL_ACCESS[ctx.role]
    if (!allowed.includes(level)) {
      throw new ForbiddenException(
        `[TenantConfig] Role ${ctx.role} cannot access level=${level} (allowed: ${allowed.join(',')})`,
      )
    }
  }

  private canAccessConfigKey(ctx: TenantContext, def: ConfigItemDefinition): boolean {
    const role = ctx.role ?? 'viewer'
    if (!ROLE_LEVEL_ACCESS[role].includes(def.level)) return false
    if (def.allowedRoles && !def.allowedRoles.includes(role)) return false
    return true
  }

  private validateValue(def: ConfigItemDefinition, value: string): void {
    if (def.required && (value === null || value === undefined || value === '')) {
      throw new BadRequestException(`Config ${def.key} is required`)
    }
    const v = def.validation
    if (!v) return
    if (v.pattern) {
      if (!new RegExp(v.pattern).test(value)) {
        throw new BadRequestException(`Config ${def.key} does not match pattern ${v.pattern}`)
      }
    }
    if (v.enum && !v.enum.includes(value)) {
      throw new BadRequestException(`Config ${def.key} must be one of ${v.enum.join(',')}`)
    }
    if (def.valueType === 'number') {
      const num = Number(value)
      if (Number.isNaN(num)) throw new BadRequestException(`Config ${def.key} must be a number`)
      if (v.min !== undefined && num < v.min) {
        throw new BadRequestException(`Config ${def.key} must be >= ${v.min}`)
      }
      if (v.max !== undefined && num > v.max) {
        throw new BadRequestException(`Config ${def.key} must be <= ${v.max}`)
      }
    }
  }

  private resolveEffective(
    ctx: TenantContext,
    def: ConfigItemDefinition,
  ): { value: string; sourceLevel: ConfigLevel; inherited: boolean } | null {
    const levelOrder: ConfigLevel[] = ['store', 'tenant', 'brand']
    const ownIdx = levelOrder.indexOf(def.level)
    const owners = levelOrder
      .slice(ownIdx)
      .map((lv) => ({ level: lv, ownerId: this.ownerIdFor(ctx, lv) }))

    for (const { level, ownerId } of owners) {
      const map = this.instances.get(level)?.get(def.key)
      const inst = map?.get(ownerId)
      if (inst && !inst.inherits) {
        const plain = inst.encrypted ? decryptField(inst.value) : inst.value
        return { value: plain, sourceLevel: level, inherited: false }
      }
    }
    if (def.defaultValue !== undefined && def.defaultValue !== null) {
      return { value: String(def.defaultValue), sourceLevel: def.level, inherited: true }
    }
    return null
  }

  private encryptIfSecret(sensitivity: ConfigSensitivity, value: string): { value: string; encrypted: boolean } {
    if (sensitivity === 'secret') return { value: encryptField(value), encrypted: true }
    return { value, encrypted: false }
  }

  private maskValue(sensitivity: ConfigSensitivity, value: string, encrypted: boolean = false): string {
    if (!value) return ''
    if (sensitivity === 'secret') {
      const plain = encrypted ? decryptField(value) : value
      return `***-${plain.slice(-4)}`
    }
    return value
  }

  private ownerIdFor(ctx: TenantContext, level: ConfigLevel): string {
    if (level === 'store') return ctx.storeId ?? 'store-default'
    if (level === 'tenant') return ctx.tenantId
    // brand 级别: 用 tenantId 前缀推导 brandId (V10 Day 6 简化)
    const tenantId = ctx.tenantId
    return tenantId.startsWith('brand-') ? tenantId : `brand-${tenantId.split('-')[0]}`
  }

  private roleDefaultLevel(ctx: TenantContext): ConfigLevel {
    const role = ctx.role ?? 'viewer'
    if (role === 'store_admin' || role === 'operator') return 'store'
    if (role === 'tenant_admin' || role === 'brand_admin') return 'tenant'
    return 'brand'
  }

  private ensureLevelMap(level: ConfigLevel): Map<string, Map<string, ConfigInstance>> {
    let m = this.instances.get(level)
    if (!m) {
      m = new Map<string, Map<string, ConfigInstance>>()
      this.instances.set(level, m)
    }
    return m
  }

  private flattenInstances(): ConfigInstance[] {
    const out: ConfigInstance[] = []
    for (const levelMap of this.instances.values()) {
      for (const ownerMap of levelMap.values()) {
        for (const inst of ownerMap.values()) out.push(inst)
      }
    }
    return out
  }

  private recordAudit(input: Omit<ConfigAuditLog, 'id' | 'timestamp'>): void {
    const log: ConfigAuditLog = {
      ...input,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    }
    this.auditLogs.push(log)
    if (this.auditLogs.length > 10000) this.auditLogs.splice(0, this.auditLogs.length - 10000)
  }

  // ============ 6. 种子 (V10 Day 6) ============

  private seed(): void {
    for (const def of BUILTIN_CONFIG_DEFINITIONS) {
      this.definitions.set(def.key, def)
    }
    const now = new Date().toISOString()

    // 品牌级示例 (租户 A 所属品牌)
    const brandId = 'brand-shenjiying'
    this.ensureLevelMap('brand').set('compliance.audit_retention_days', new Map([
      [brandId, {
        id: 'cfg-seed-brand-audit', key: 'compliance.audit_retention_days',
        value: '180', encrypted: false, category: 'compliance', level: 'brand', ownerId: brandId,
        inherits: false, version: 1, updatedBy: 'system', updatedAt: now, createdAt: now,
      }],
    ]))
    this.ensureLevelMap('brand').set('branding.primary_color', new Map([
      [brandId, {
        id: 'cfg-seed-brand-color', key: 'branding.primary_color',
        value: '#1677ff', encrypted: false, category: 'branding', level: 'brand', ownerId: brandId,
        inherits: false, version: 1, updatedBy: 'system', updatedAt: now, createdAt: now,
      }],
    ]))

    // 租户级示例 (tenant-A)
    const tenantId = 'tenant-A'
    this.ensureLevelMap('tenant').set('member.tier_upgrade_threshold', new Map([
      [tenantId, {
        id: 'cfg-seed-tenant-tier', key: 'member.tier_upgrade_threshold',
        value: '1000', encrypted: false, category: 'member', level: 'tenant', ownerId: tenantId,
        inherits: false, version: 1, updatedBy: 'admin', updatedAt: now, createdAt: now,
      }],
    ]))
    this.ensureLevelMap('tenant').set('ai.default_model', new Map([
      [tenantId, {
        id: 'cfg-seed-tenant-ai', key: 'ai.default_model',
        value: 'gpt-4o-mini', encrypted: false, category: 'ai', level: 'tenant', ownerId: tenantId,
        inherits: false, version: 1, updatedBy: 'admin', updatedAt: now, createdAt: now,
      }],
    ]))
    this.ensureLevelMap('tenant').set('marketing.default_campaign_budget', new Map([
      [tenantId, {
        id: 'cfg-seed-tenant-marketing', key: 'marketing.default_campaign_budget',
        value: '50000', encrypted: false, category: 'marketing', level: 'tenant', ownerId: tenantId,
        inherits: false, version: 1, updatedBy: 'admin', updatedAt: now, createdAt: now,
      }],
    ]))

    // 门店级示例 (store-001 属于 tenant-A)
    this.ensureLevelMap('store').set('pos.tax_rate', new Map([
      ['store-001', {
        id: 'cfg-seed-store-tax', key: 'pos.tax_rate',
        value: '0.13', encrypted: false, category: 'pos', level: 'store', ownerId: 'store-001',
        inherits: false, version: 1, updatedBy: 'admin', updatedAt: now, createdAt: now,
      }],
    ]))
  }
}
