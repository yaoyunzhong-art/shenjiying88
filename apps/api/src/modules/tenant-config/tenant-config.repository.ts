/**
 * 三级独立配置 - Repository (P0-A1 零持久化修复)
 *
 * 将 in-memory Map 替换为 PostgreSQL 持久化层:
 * - loadAllInstances()    启动时预热 cache
 * - saveInstance()        写时双写 DB (upsert by [level, ownerId, key])
 * - appendAudit()         审计日志持久化
 * - loadAuditLogs()       按 tenant 读取审计
 * - findAuditByConfigId() 按 configId 链回溯 (P0-B1 rollback 链回溯)
 *
 * 测试模式 (NODE_ENV=test) 下所有写操作都是 no-op, 避免测试污染 DB.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import type { ConfigInstance, ConfigAuditLog, ConfigLevel } from './tenant-config.entity'

/** 写入时的审计日志载荷 (与 ConfigAuditLog 字段对齐, 但不带 id/timestamp) */
export interface ConfigAuditLogInput {
  configId: string
  key: string
  level: ConfigLevel
  ownerId: string
  tenantId: string
  action: 'create' | 'update' | 'delete' | 'rollback' | 'cross_tenant_brand_passthrough'
  operator: string
  operatorRole: string
  previousValue?: string
  newValue?: string
  context?: Record<string, unknown>
}

@Injectable()
export class TenantConfigRepository {
  private readonly logger = new Logger(TenantConfigRepository.name)
  /** 测试环境标记, 用于跳过 DB 写 (避免 338 测试无 Prisma 连接时崩溃) */
  private readonly isTestEnv = process.env.NODE_ENV === 'test'

  constructor(private readonly prisma: PrismaService) {}

  // ============ ConfigInstance ============

  /**
   * 加载所有配置实例 (启动时预热 cache).
   * 返回的 row 已经按 (level, ownerId, key) 排好, 方便上层重建嵌套 Map.
   */
  async loadAllInstances(): Promise<ConfigInstance[]> {
    if (this.isTestEnv) return []
    try {
      const rows = await this.prisma.configInstance.findMany({
        orderBy: [{ level: 'asc' }, { ownerId: 'asc' }, { key: 'asc' }],
      })
      return rows.map(this.rowToInstance)
    } catch (err) {
      if (this.shouldUsePersistenceFallback(err)) {
        this.logger.log(`[loadAllInstances] skipped persistence preload: ${this.describePersistenceFallback(err)}`)
        return []
      }
      this.logger.error(`[loadAllInstances] failed: ${(err as Error).message}`)
      return []
    }
  }

  /**
   * 持久化单个 instance. 使用 upsert by (level, ownerId, key).
   * 如果 row 已存在, version+1; 不存在则创建.
   */
  async saveInstance(instance: ConfigInstance): Promise<void> {
    if (this.isTestEnv) return
    try {
      await this.prisma.configInstance.upsert({
        where: {
          level_ownerId_key: {
            level: instance.level,
            ownerId: instance.ownerId,
            key: instance.key,
          },
        },
        create: {
          id: instance.id,
          key: instance.key,
          value: instance.value,
          encrypted: instance.encrypted,
          category: instance.category,
          level: instance.level,
          ownerId: instance.ownerId,
          inherits: instance.inherits,
          version: instance.version,
          updatedBy: instance.updatedBy,
          fromSeed: instance.fromSeed ?? false,
        },
        update: {
          value: instance.value,
          encrypted: instance.encrypted,
          inherits: instance.inherits,
          version: instance.version,
          updatedBy: instance.updatedBy,
          fromSeed: instance.fromSeed ?? false,
        },
      })
    } catch (err) {
      this.logger.error(`[saveInstance] failed for ${instance.id}: ${(err as Error).message}`)
    }
  }

  /**
   * P1-F1-6: 删除单个 instance (V17 新增, 配合 deleteConfig).
   * 按 id 删, 找不到时 no-op (避免抛错阻塞主流程).
   */
  async deleteInstance(id: string): Promise<void> {
    if (this.isTestEnv) return
    try {
      await this.prisma.configInstance.delete({
        where: { id },
      })
    } catch (err) {
      // P1-F1-6: 找不到时 (P2025) 不视为错误
      const code = (err as { code?: string }).code
      if (code !== 'P2025') {
        this.logger.error(`[deleteInstance] failed for ${id}: ${(err as Error).message}`)
      }
    }
  }

  // ============ ConfigAuditLog ============

  /**
   * 追加一条审计日志. 不抛错, 仅 log, 避免审计失败阻塞主业务.
   */
  async appendAudit(log: ConfigAuditLogInput): Promise<void> {
    if (this.isTestEnv) return
    try {
      await this.prisma.configAuditLog.create({
        data: {
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
          context: (log.context ?? null) as Prisma.InputJsonValue,
        },
      })
    } catch (err) {
      this.logger.error(`[appendAudit] failed for ${log.configId}: ${(err as Error).message}`)
    }
  }

  /**
   * 按 tenantId 读取审计 (按 timestamp 倒序, 取最近 limit 条).
   * 用于 listAuditLogs 优先从 DB 读, 内存 fallback.
   */
  async loadAuditLogs(tenantId: string, limit = 100): Promise<ConfigAuditLog[]> {
    if (this.isTestEnv) return []
    try {
      const rows = await this.prisma.configAuditLog.findMany({
        where: { tenantId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      })
      return rows.map(this.rowToAuditLog)
    } catch (err) {
      if (this.shouldUsePersistenceFallback(err)) {
        this.logger.warn(`[loadAuditLogs] skipped DB audit read for tenant=${tenantId}: ${this.describePersistenceFallback(err)}`)
        return []
      }
      this.logger.error(`[loadAuditLogs] failed for tenant=${tenantId}: ${(err as Error).message}`)
      return []
    }
  }

  /**
   * 按 configId 读取审计 (按 timestamp 升序, 全量).
   * 用于 P0-B1 rollback 链回溯: 倒序遍历该 config 的所有 history, 找到 targetVersion 对应 value.
   */
  async findAuditByConfigId(configId: string): Promise<ConfigAuditLog[]> {
    if (this.isTestEnv) return []
    try {
      const rows = await this.prisma.configAuditLog.findMany({
        where: { configId },
        orderBy: { timestamp: 'asc' },
      })
      return rows.map(this.rowToAuditLog)
    } catch (err) {
      if (this.shouldUsePersistenceFallback(err)) {
        this.logger.warn(`[findAuditByConfigId] skipped DB audit read for ${configId}: ${this.describePersistenceFallback(err)}`)
        return []
      }
      this.logger.error(`[findAuditByConfigId] failed for ${configId}: ${(err as Error).message}`)
      return []
    }
  }

  private shouldUsePersistenceFallback(error: unknown): boolean {
    const code =
      typeof error === 'object' && error && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined
    return code === 'P2021' || code === 'P1010' || code === 'P1001'
  }

  private describePersistenceFallback(error: unknown): string {
    const code =
      typeof error === 'object' && error && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined
    const message =
      typeof error === 'object' && error && 'message' in error
        ? (error as { message?: unknown }).message
        : undefined

    if (typeof message === 'string' && message.trim().length > 0) {
      const tableMessage = message.match(/The table `[^`]+` does not exist in the current database\./)?.[0]
      if (tableMessage) return tableMessage
      return message.replace(/\s+/g, ' ').trim()
    }
    if (typeof code === 'string' && code.length > 0) {
      return `Prisma persistence unavailable (${code})`
    }
    return 'Prisma persistence unavailable'
  }

  // ============ Row → Entity Mappers ============

  private rowToInstance = (row: {
    id: string
    key: string
    value: string
    encrypted: boolean
    category: string
    level: string
    ownerId: string
    inherits: boolean
    version: number
    updatedBy: string
    fromSeed: boolean
    createdAt: Date
    updatedAt: Date
  }): ConfigInstance => ({
    id: row.id,
    key: row.key,
    value: row.value,
    encrypted: row.encrypted,
    category: row.category as ConfigInstance['category'],
    level: row.level as ConfigLevel,
    ownerId: row.ownerId,
    inherits: row.inherits,
    version: row.version,
    updatedBy: row.updatedBy,
    fromSeed: row.fromSeed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })

  private rowToAuditLog = (row: {
    id: string
    configId: string
    key: string
    level: string
    ownerId: string
    tenantId: string
    action: string
    operator: string
    operatorRole: string
    previousValue: string | null
    newValue: string | null
    context: unknown
    timestamp: Date
  }): ConfigAuditLog => ({
    id: row.id,
    configId: row.configId,
    key: row.key,
    level: row.level as ConfigLevel,
    ownerId: row.ownerId,
    tenantId: row.tenantId,
    action: row.action as ConfigAuditLog['action'],
    operator: row.operator,
    operatorRole: row.operatorRole as ConfigAuditLog['operatorRole'],
    previousValue: row.previousValue ?? undefined,
    newValue: row.newValue ?? undefined,
    context: (row.context as Record<string, unknown> | null) ?? undefined,
    timestamp: row.timestamp.toISOString(),
  })
}
