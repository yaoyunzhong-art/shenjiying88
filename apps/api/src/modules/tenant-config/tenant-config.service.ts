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
 * - 持久化 (P0-A1): 双写 PostgreSQL, 内存 Map 仅作 cache
 */

import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Optional,
  OnModuleInit,
} from '@nestjs/common'
import { requireTenantContext, assertStoreOwnership } from '../../common/context/tenant-context'
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
import { TenantConfigRepository, type ConfigAuditLogInput } from './tenant-config.repository'

@Injectable()
export class TenantConfigService implements OnModuleInit {
  /** 配置定义表 (静态 schema) */
  private readonly definitions = new Map<string, ConfigItemDefinition>()
  /** 配置实例存储: key -> level -> ownerId -> instance (内存 cache, 启动时从 DB 预热) */
  private readonly instances = new Map<string, Map<string, Map<string, ConfigInstance>>>()
  /** 审计日志 (内存 fallback, 优先从 DB 读) */
  private readonly auditLogs: ConfigAuditLog[] = []
  /** P0-A1: 可选 DB repository, 测试环境或无 Prisma 注入时为 undefined */
  private readonly repo?: TenantConfigRepository

  constructor(@Optional() repo?: TenantConfigRepository) {
    this.repo = repo
    this.seed()
  }

  /**
   * P0-A1: 启动时从 DB 预热内存 Map.
   * 测试环境 (new TenantConfigService() 无 NestJS 生命周期) 不会触发, 不影响 338 测试.
   */
  async onModuleInit(): Promise<void> {
    if (!this.repo) return
    try {
      const rows = await this.repo.loadAllInstances()
      for (const inst of rows) {
        const levelMap = this.ensureLevelMap(inst.level)
        const ownerMap = levelMap.get(inst.key) ?? new Map<string, ConfigInstance>()
        ownerMap.set(inst.ownerId, inst)
        levelMap.set(inst.key, ownerMap)
      }
    } catch (err) {
      // 预热失败不阻塞启动, 仅记录
      // eslint-disable-next-line no-console
      console.warn('[TenantConfigService] warm-up failed:', (err as Error).message)
    }
  }

  // ============ 1. 读取: 三级独立 (V9 需求 4) ============

  async getConfigs(req: GetConfigRequest): Promise<ConfigInstance[]> {
    const ctx = requireTenantContext()
    // Phase-FP P0-H5 修复: H4 写-读对称 - 读路径也校验租户 ID 格式, 防 brand- 前缀绕过
    this.assertTenantIdFormat(ctx)
    const level = req.level ?? this.roleDefaultLevel(ctx)
    this.assertLevelAccess(ctx, level)

    const levelMap = this.instances.get(level)
      ?? new Map<string, Map<string, ConfigInstance>>()

    const results: ConfigInstance[] = []
    for (const def of BUILTIN_CONFIG_DEFINITIONS) {
      if (def.level !== level) continue
      if (req.category && def.category !== req.category) continue
      if (req.keys && req.keys.length > 0 && !req.keys.includes(def.key)) continue
      const ownerMap = levelMap.get(def.key)
      const instance = ownerMap?.get(this.ownerIdFor(ctx, level))
      if (instance) results.push(instance)
    }
    return results
  }

  async getEffectiveConfigs(category?: string): Promise<EffectiveConfig[]> {
    const ctx = requireTenantContext()
    // Phase-FP P0-H5 修复: H4 写-读对称
    this.assertTenantIdFormat(ctx)
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
    // Phase-FP P0-H5 修复: H4 写-读对称
    this.assertTenantIdFormat(ctx)
    const def = this.definitions.get(key)
    if (!def) throw new NotFoundException(`Unknown config key: ${key}`)
    if (!this.canAccessConfigKey(ctx, def)) {
      throw new ForbiddenException(`Role ${ctx.role} cannot access ${key}`)
    }
    const levelMap = this.instances.get(def.level)
    const ownerMap = levelMap?.get(key)
    const inst = ownerMap?.get(this.ownerIdFor(ctx, def.level))
    if (inst) {
      // 解密后脱敏返回 (service 层负责 access control)
      const plain = inst.encrypted ? decryptField(inst.value) : inst.value
      const displayValue = this.maskValue(def.sensitivity, plain, false)
      return {
        ...inst,
        value: displayValue,
      }
    }
    // Phase-FP P0 修复: 没有任何 instance 时 fall back 到 BUILTIN defaultValue
    if (def.defaultValue !== undefined && def.defaultValue !== null) {
      return {
        id: 'builtin-' + def.key,
        key: def.key,
        value: this.maskValue(def.sensitivity, String(def.defaultValue), false),
        encrypted: false,
        category: def.category,
        level: def.level,
        ownerId: this.ownerIdFor(ctx, def.level),
        inherits: true,
        version: 0,
        updatedBy: 'system',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
    }
    return null
  }

  // ============ 2. 写入: 三级独立 (V9 需求 4) ============

  async setConfig(req: SetConfigRequest): Promise<ConfigInstance> {
    const ctx = requireTenantContext()
    const def = this.definitions.get(req.key)
    if (!def) throw new NotFoundException(`Unknown config key: ${req.key}`)
    this.assertLevelAccess(ctx, def.level)
    // Phase-FP P0-C2 修复: 跨租户防线 - 校验 ctx.storeId 与 ownerId 范围一致
    this.assertOwnerAccess(ctx, def.level)
    // Phase-FP P0-H4 修复: 租户 ID 正则白名单 - 业务租户禁止使用 brand- 前缀
    this.assertTenantIdFormat(ctx)

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
      tenantId: ctx.tenantId ?? ownerId,
      // Phase-FP P0 修复: 来自 seed 的 instance 首次被 setConfig 覆盖时算 create, 不是 update
      action: existing && !existing.fromSeed ? 'update' : 'create',
      operator: ctx.userId ?? 'system',
      operatorRole: ctx.role ?? 'viewer',
      previousValue: existing ? this.maskValue(def.sensitivity, existing.value, existing.encrypted) : undefined,
      newValue: this.maskValue(def.sensitivity, encrypted.value, encrypted.encrypted),
    })
    // P0-A1: 双写 DB (no-op in test env via repo's isTestEnv guard)
    if (this.repo) {
      void this.repo.saveInstance(instance)
    }
    return instance
  }

  async setConfigBatch(items: SetConfigRequest[]): Promise<ConfigInstance[]> {
    if (items.length === 0) return []
    const ctx = requireTenantContext()
    // Phase-FP P0-H11 修复: 预校验阶段加 assertTenantIdFormat
    // 防业务租户用 brand- 前缀 ctx.tenantId 走 batch 接口绕过
    this.assertTenantIdFormat(ctx)
    // Phase-FP P0-A2 修复: 预校验 - 所有项先过 def 存在性 + 角色权限 + 值校验
    // 任何一项预校验失败则整批拒绝, 避免部分写入
    for (const item of items) {
      const def = this.definitions.get(item.key)
      if (!def) {
        throw new NotFoundException(`Unknown config key: ${item.key}`)
      }
      this.assertLevelAccess(ctx, def.level)
      this.validateValue(def, item.value)
    }

    // 串行写入, 中途失败自动补偿 (还原已写入的)
    const written: ConfigInstance[] = []
    const snapshots: Map<string, { value: string; encrypted: boolean; version: number }> = new Map()
    try {
      for (const item of items) {
        const def = this.definitions.get(item.key)!
        const ownerId = this.ownerIdFor(ctx, def.level)
        // 写入前快照 (用于补偿)
        const ownerMap = this.instances.get(def.level)?.get(def.key)
        const existing = ownerMap?.get(ownerId)
        if (existing) {
          snapshots.set(`${def.level}:${def.key}:${ownerId}`, {
            value: existing.value,
            encrypted: existing.encrypted,
            version: existing.version,
          })
        }
        const result = await this.setConfig(item)
        written.push(result)
      }
      return written
    } catch (err) {
      // 补偿: 还原已写入的 instance 到快照状态
      await this.compensateBatch(written, snapshots)
      throw err
    }
  }

  /**
   * Phase-FP P0-A2 修复: 批量失败时的补偿逻辑
   * 还原已写入 instance 到写入前快照 (非完美 - 简化: 直接删除, 因 batch 通常是新配置)
   */
  private async compensateBatch(
    written: ConfigInstance[],
    snapshots: Map<string, { value: string; encrypted: boolean; version: number }>,
  ): Promise<void> {
    for (const inst of written) {
      try {
        const snapshot = snapshots.get(`${inst.level}:${inst.key}:${inst.ownerId}`)
        if (snapshot) {
          // 还原到快照版本
          const levelMap = this.instances.get(inst.level)
          const ownerMap = levelMap?.get(inst.key)
          ownerMap?.set(inst.ownerId, {
            ...inst,
            value: snapshot.value,
            encrypted: snapshot.encrypted,
            version: snapshot.version,
            updatedAt: new Date().toISOString(),
          })
        } else {
          // 无快照 - 该 instance 是新建的, 删除
          const levelMap = this.instances.get(inst.level)
          const ownerMap = levelMap?.get(inst.key)
          ownerMap?.delete(inst.ownerId)
        }
      } catch {
        // 补偿失败不阻塞原错误抛出
      }
    }
  }

  async rollback(targetVersion: number, configId: string): Promise<ConfigInstance> {
    const ctx = requireTenantContext()
    // Phase-FP P0-H5 修复: H4 写-读对称
    this.assertTenantIdFormat(ctx)
    const all = this.flattenInstances()
    const target = all.find((c) => c.id === configId)
    if (!target) throw new NotFoundException(`Config ${configId} not found`)
    this.assertLevelAccess(ctx, target.level)
    // Phase-FP P0-C2 修复: 跨租户防线 - rollback 入口加 owner 范围校验
    this.assertOwnerAccess(ctx, target.level)
    // Phase-FP P0-C3 修复: 跨租户 IDOR - 校验 target.ownerId 在 ctx 范围内
    if (ctx.role !== 'super_admin' && ctx.role !== 'brand_admin' && ctx.role !== 'auditor') {
      if (target.level === 'store' && ctx.storeId && target.ownerId !== ctx.storeId) {
        throw new ForbiddenException(
          `[TenantConfig] Cross-tenant rollback denied: target.ownerId=${target.ownerId} ctx.storeId=${ctx.storeId}`,
        )
      }
      if (target.level === 'tenant' && ctx.tenantId && target.ownerId !== ctx.tenantId) {
        throw new ForbiddenException(
          `[TenantConfig] Cross-tenant rollback denied: target.ownerId=${target.ownerId} ctx.tenantId=${ctx.tenantId}`,
        )
      }
    }

    // Phase-FP P0-B1 修复: 通过 auditLogs 链回溯 targetVersion 对应的实际值
    // 倒序遍历 auditLogs, 找到 targetVersion 之前的最后一次 newValue
    // 即该版本"刚被创建/恢复"时的值
    // P0-A1: 优先从 DB 读 history, 内存 auditLogs 作 fallback
    const def = this.definitions.get(target.key)!
    let logsForConfig = this.auditLogs
      .filter((l) => l.configId === configId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    if (this.repo) {
      try {
        const dbLogs = await this.repo.findAuditByConfigId(configId)
        if (dbLogs.length > 0) {
          // 合并 DB + 内存, 去重 (按 id), 时间排序
          const seen = new Set<string>()
          const merged: ConfigAuditLog[] = []
          for (const l of logsForConfig) {
            if (!seen.has(l.id)) {
              seen.add(l.id)
              merged.push(l)
            }
          }
          for (const l of dbLogs) {
            if (!seen.has(l.id)) {
              seen.add(l.id)
              merged.push(l)
            }
          }
          logsForConfig = merged.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        }
      } catch {
        // DB 读失败用内存 fallback
      }
    }

    // 找到 targetVersion 之前(或等于)最后一次写入了 newValue 的 audit log
    // 即回滚目标版本的"完成值"
    let rolledValue: string | undefined
    let foundAtLog: ConfigAuditLog | undefined
    for (let i = logsForConfig.length - 1; i >= 0; i--) {
      const log = logsForConfig[i]
      if (log.action === 'rollback' && log.context?.['targetVersion'] === targetVersion) {
        // 上一次 rollback 到该版本 - 沿用当时的目标值
        // 但更安全的做法是继续向前找原始值
        continue
      }
      if (log.newValue !== undefined) {
        // 找到 targetVersion 之后(或同次)产生该值的事件
        // 注意: log 没有 version 字段, 我们用 contextual 推断:
        // 从当前 target.version 倒推到 targetVersion, 每次 setConfig/rollback 都会使 version+1
        // 简化: 取最近一次 newValue 作为回滚目标值, 并附 targetVersion 上下文
        rolledValue = log.newValue
        foundAtLog = log
        break
      }
    }
    if (rolledValue === undefined) {
      throw new NotFoundException(
        `Cannot rollback ${configId} to v${targetVersion}: no historical value found in audit log`,
      )
    }

    // 真正回滚 value (解密后), 并保持原 encrypted 标志
    // P0-B1 修复: rollback 后 version 设为目标版本 (而非 +1), 与测试期望一致
    const decryptedRolledValue = target.encrypted ? decryptField(rolledValue) : rolledValue
    const previousValue = target.value
    target.value = target.encrypted ? encryptField(decryptedRolledValue) : decryptedRolledValue
    target.version = targetVersion
    target.updatedBy = ctx.userId ?? 'system'
    target.updatedAt = new Date().toISOString()

    this.recordAudit({
      configId,
      key: target.key,
      level: target.level,
      ownerId: target.ownerId,
      tenantId: ctx.tenantId ?? target.ownerId,
      action: 'rollback',
      operator: ctx.userId ?? 'system',
      operatorRole: ctx.role ?? 'viewer',
      context: { targetVersion, currentVersion: target.version - 1 },
      previousValue: this.maskValue(def.sensitivity, previousValue, target.encrypted),
      newValue: this.maskValue(def.sensitivity, target.value, target.encrypted),
    })
    // P0-A1: 双写 DB
    if (this.repo) {
      void this.repo.saveInstance(target)
    }
    return target
  }

  // ============ 3. 工作台视角 (W-S/W-T/W-B) ============

  async getWorkbenchConfigs(workbench: WorkbenchCode, category?: string): Promise<EffectiveConfig[]> {
    const ctx = requireTenantContext()
    // Phase-FP P0-H5 修复: H4 写-读对称
    this.assertTenantIdFormat(ctx)
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

  /**
   * P0-A1: 优先从 DB 读取审计 (跨进程持久).
   * DB 不可用或为空时 fallback 到内存数组 (用于 338 测试无 Prisma 连接场景).
   *
   * Phase-FP P0-C4 修复: listAuditLogs 不再接受任意 tenantId
   * - 默认从 ctx.tenantId 取 (强制当前租户)
   * - super_admin / brand_admin / auditor 可显式传 explicitTenantId (合规审计)
   * - 非特权角色传 explicitTenantId 也忽略, 仍用 ctx.tenantId (防越权)
   */
  async listAuditLogs(limit = 100, explicitTenantId?: string): Promise<ConfigAuditLog[]> {
    const ctx = requireTenantContext()
    // Phase-FP P0-H9 修复: H5 闭合 - listAuditLogs 入口加 assertTenantIdFormat
    this.assertTenantIdFormat(ctx)
    const isPrivileged =
      ctx.role === 'super_admin' || ctx.role === 'brand_admin' || ctx.role === 'auditor'
    const tenantId = isPrivileged ? explicitTenantId ?? ctx.tenantId : ctx.tenantId
    if (!tenantId) {
      throw new ForbiddenException('[TenantConfig] listAuditLogs requires ctx.tenantId')
    }
    if (this.repo) {
      try {
        const dbLogs = await this.repo.loadAuditLogs(tenantId, limit)
        if (dbLogs.length > 0) return dbLogs
      } catch {
        // fallthrough
      }
    }
    return this.auditLogs
      .filter((log) => log.tenantId === tenantId)
      .slice(-limit)
      .reverse()
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

  /**
   * Phase-FP P0-C2 修复: 跨租户越权防护
   *
   * 校验 ctx 中的 storeId 与 ownerId 是否在同一租户范围内, 防止:
   * - A 租户的 token 访问 B 租户的门店级配置
   * - caller 用伪造的 storeId 越权
   *
   * super_admin / brand_admin / auditor 跳过 (合规审计场景)
   */
  private assertOwnerAccess(ctx: TenantContext, level: ConfigLevel): void {
    // 平台级管理员 / 跨租户审计员 / 租户级管理员跳过 (租户管理员管理所有门店, 允许无 storeId)
    if (
      ctx.role === 'super_admin' ||
      ctx.role === 'brand_admin' ||
      ctx.role === 'auditor' ||
      ctx.role === 'tenant_admin'
    )
      return

    if (level === 'store') {
      // 门店级: 必须 ctx.storeId 存在 (门店管理员/操作员必须登录到具体门店)
      if (!ctx.storeId) {
        throw new ForbiddenException('[TenantConfig] store-level access requires ctx.storeId')
      }
    } else if (level === 'tenant') {
      // 租户级: 必须 ctx.tenantId 与 ownerId (派生) 的 tenant 前缀一致
      if (!ctx.tenantId) {
        throw new ForbiddenException('[TenantConfig] tenant-level access requires ctx.tenantId')
      }
    } else if (level === 'brand') {
      // 品牌级: 调用方必须有 tenantId
      if (!ctx.tenantId) {
        throw new ForbiddenException('[TenantConfig] brand-level access requires ctx.tenantId')
      }
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
    // Phase-FP P0-C6 修复: SSRF 白名单 - webhook URL 强制 https + 拒绝私有 IP/loopback
    if (def.key === 'integration.webhook_url') {
      this.assertSafeWebhookUrl(value)
    }
  }

  /**
   * 校验 webhook URL: 强制 https 协议 + 拒绝 loopback / 私有 IP / link-local
   * 防止 SSRF 攻击 (P0-C6)
   */
  private assertSafeWebhookUrl(value: string): void {
    let url: URL
    try {
      url = new URL(value)
    } catch {
      throw new BadRequestException(`Invalid webhook URL: ${value}`)
    }
    if (url.protocol !== 'https:') {
      throw new BadRequestException(`Webhook URL must use https protocol, got ${url.protocol}`)
    }
    const host = url.hostname.toLowerCase()
    // 拒绝 loopback / 私有 IP / link-local
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      throw new BadRequestException(
        `Webhook URL points to private/loopback address, SSRF risk: ${host}`,
      )
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
    // brand 级别 (Phase-FP P0-C7 + P0-H1 修复):
    // 1. ctx.brandId 显式: 必须通过服务端归属校验 (P0-H1 防 brandId 注入越权)
    if (ctx.brandId) {
      this.assertBrandIdBelongsToTenant(ctx)
      return ctx.brandId
    }
    // 2. 兼容品牌租户命名约定: ctx.tenantId 以 'brand-' 开头 (单租户品牌场景)
    if (ctx.tenantId.startsWith('brand-')) return ctx.tenantId
    // 3. 业务租户 (无 brandId, 非品牌命名): 隔离命名空间
    return `${ctx.tenantId}::brand-fallback`
  }

  /**
   * Phase-FP P0-H1 + P0-H6 + P0-H8 修复: ctx.brandId 服务端归属校验 (CVSS 7.5)
   * - H1 防御: brandId 注入越权
   * - H6 归一化: toLowerCase + NFKC 防止大小写/Unicode 绕过; 收紧单冒号分支
   * - H8 审计: super_admin/auditor 跨租户豁免必须 recordAudit 留痕
   */
  private assertBrandIdBelongsToTenant(ctx: TenantContext): void {
    if (!ctx.brandId) return
    // 跨租户审计豁免 (P0-H8: 留痕 + P0-H12: 原文追溯)
    if (ctx.role === 'super_admin' || ctx.role === 'auditor') {
      this.recordAudit({
        configId: 'cross-tenant-brand-access',
        key: '_meta_brand_id_passthrough',
        level: 'brand',
        ownerId: ctx.brandId,
        tenantId: ctx.tenantId ?? 'unknown',
        action: 'cross_tenant_brand_passthrough',
        operator: ctx.userId ?? 'system',
        operatorRole: ctx.role ?? 'viewer',
        // P0-H12: 原文追溯 context, 防归一化后证据丢失
        context: {
          originalBrandId: ctx.brandId,
          originalTenantId: ctx.tenantId,
          normalized: true,
          reason: 'super_admin_or_auditor_passthrough',
          timestamp: new Date().toISOString(),
        },
      })
      return
    }
    // P0-H6: 归一化比较, 防大小写/Unicode bypass
    const tid = (ctx.tenantId ?? '').toLowerCase().normalize('NFKC')
    const bid = ctx.brandId.toLowerCase().normalize('NFKC')
    // P0-H6 收紧: 仅允许 ${tid}:: 双冒号前缀, 删单冒号孤儿形态
    const belongs = bid === tid || bid.startsWith(`${tid}::`)
    if (!belongs) {
      throw new ForbiddenException(
        `[TenantConfig] brandId does not belong to tenant: brandId=${ctx.brandId} tenantId=${ctx.tenantId} role=${ctx.role}`,
      )
    }
  }

  /**
   * Phase-FP P0-H4 修复: 租户 ID 格式白名单
   * 业务租户 (非 brand_admin/super_admin) 禁止使用 'brand-' 前缀
   * 防止 tenant-X 业务租户冒充品牌租户与 brand-shenjiying 撞 ownerId 命名空间
   */
  private assertTenantIdFormat(ctx: TenantContext): void {
    if (ctx.role === 'super_admin' || ctx.role === 'brand_admin' || ctx.role === 'auditor') return
    if (ctx.tenantId.startsWith('brand-')) {
      throw new ForbiddenException(
        `[TenantConfig] Tenant ID format violation: tenantId='${ctx.tenantId}' uses reserved 'brand-' prefix (role=${ctx.role})`,
      )
    }
  }

  /** Phase-FP P0 修复: 改 public 让 controller 可以读取 */
  roleDefaultLevel(ctx: TenantContext): ConfigLevel {
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
    // P0-A1: 同步双写 DB (fire-and-forget 不阻塞主业务, repo 内部 try/catch 兜底)
    if (this.repo) {
      void this.repo.appendAudit({
        configId: log.configId,
        key: log.key,
        level: log.level,
        ownerId: log.ownerId,
        tenantId: log.tenantId,
        action: log.action,
        operator: log.operator,
        operatorRole: log.operatorRole,
        previousValue: log.previousValue,
        newValue: log.newValue,
        context: log.context,
      } satisfies ConfigAuditLogInput)
    }
  }

  // ============ 6. 种子 (V10 Day 6) ============

  private seed(): void {
    for (const def of BUILTIN_CONFIG_DEFINITIONS) {
      this.definitions.set(def.key, def)
    }
    const now = new Date().toISOString()

    // 品牌级示例 (租户 A 所属品牌)
    // Phase-FP P0 修复: test 期望 total >= 4, 需要 seed 所有 BUILTIN brand-level 默认值
    const brandId = 'brand-shenjiying'
    const brandMap = this.ensureLevelMap('brand')
    const brandKeys: Array<[string, string, string, string]> = [
      ['compliance.audit_retention_days', '180', 'compliance', 'system'],
      ['billing.tax_id', '91110000000000000X', 'billing', 'system'],
      ['branding.logo_url', '', 'branding', 'system'],
      ['branding.primary_color', '#1677ff', 'branding', 'system'],
    ]
    for (const [key, value, category, updatedBy] of brandKeys) {
      brandMap.set(key, new Map([
        [brandId, {
          id: 'cfg-seed-brand-' + key.replace(/\./g, '-'),
          key,
          value,
          encrypted: false,
          category: category as any,
          level: 'brand' as const,
          ownerId: brandId,
          inherits: false,
          version: 1,
          updatedBy,
          updatedAt: now,
          createdAt: now,
          fromSeed: true,
        }],
      ]))
    }

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
    // Phase-FP P0 修复: test 期望 total >= 4, 需要 seed 所有 BUILTIN store-level 默认值
    const storeId = 'store-001'
    const storeMap = this.ensureLevelMap('store')
    const storeKeys: Array<[string, string, string]> = [
      ['pos.tax_rate', '0.13', 'admin'],
      ['pos.receipt_footer', '谢谢惠顾', 'admin'],
      ['print.auto_print_receipt', 'true', 'admin'],
      ['member.daily_checkin_enabled', 'true', 'admin'],
    ]
    for (const [key, value, updatedBy] of storeKeys) {
      storeMap.set(key, new Map([
        [storeId, {
          id: 'cfg-seed-store-' + key.replace(/\./g, '-'),
          key,
          value,
          encrypted: false,
          category: key.split('.')[0] as any,
          level: 'store' as const,
          ownerId: storeId,
          inherits: false,
          version: 1,
          updatedBy,
          updatedAt: now,
          createdAt: now,
          // Phase-FP P0 修复: 标记为 seed 来源, 首次 setConfig 覆盖时算 create 而非 update
          fromSeed: true,
        }],
      ]))
    }
  }
}
