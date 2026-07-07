/**
 * 付费授权 - 审计日志 Repository (V9 需求 2 · V10 Day 17 Phase 88)
 *
 * 职责:
 * - 授权操作审计日志记录
 * - 180 天保留策略
 * - 审计查询支持
 */

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { LicenseAuditLogOrmEntity } from '../entities/license-audit-log.orm-entity'
import type { LicenseAuditLog, LicenseScope } from '../license.entity'

export interface CreateAuditLogInput {
  licenseId?: string
  tenantId: string
  storeId?: string
  scope: LicenseScope
  action: LicenseAuditLog['action']
  operator: string
  result: 'success' | 'denied'
  reason?: string
  context?: Record<string, unknown>
}

@Injectable()
export class LicenseAuditLogRepository {
  constructor(
    @InjectRepository(LicenseAuditLogOrmEntity)
    private readonly ormRepo: Repository<LicenseAuditLogOrmEntity>,
  ) {}

  /**
   * 创建审计日志
   */
  async create(input: CreateAuditLogInput): Promise<LicenseAuditLog> {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    
    const entity = this.ormRepo.create({
      id,
      licenseId: input.licenseId ?? '',
      tenantId: input.tenantId,
      storeId: input.storeId,
      action: input.action,
      scope: input.scope,
      operator: input.operator,
      result: input.result,
      reason: input.reason,
      context: input.context,
      timestamp: new Date(),
    })

    await this.ormRepo.save(entity)
    return this.toDomain(entity)
  }

  /**
   * 查询租户审计日志
   */
  async findByTenant(tenantId: string, limit: number = 100): Promise<LicenseAuditLog[]> {
    const entities = await this.ormRepo.find({
      where: { tenantId },
      order: { timestamp: 'DESC' },
      take: limit,
    })
    return entities.map((e) => this.toDomain(e))
  }

  /**
   * 查询授权相关日志
   */
  async findByLicense(licenseId: string, limit: number = 50): Promise<LicenseAuditLog[]> {
    const entities = await this.ormRepo.find({
      where: { licenseId },
      order: { timestamp: 'DESC' },
      take: limit,
    })
    return entities.map((e) => this.toDomain(e))
  }

  /**
   * 清理过期日志 (180天)
   */
  async cleanupExpired(retentionDays: number = 180): Promise<number> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)
    
    const result = await this.ormRepo.delete({
      timestamp: LessThan(cutoff),
    })
    
    return result.affected ?? 0
  }

  private toDomain(entity: LicenseAuditLogOrmEntity): LicenseAuditLog {
    return {
      id: entity.id,
      licenseId: entity.licenseId,
      tenantId: entity.tenantId,
      storeId: entity.storeId ?? undefined,
      action: entity.action as LicenseAuditLog['action'],
      scope: entity.scope as LicenseScope,
      operator: entity.operator,
      result: entity.result as 'success' | 'denied',
      reason: entity.reason ?? undefined,
      context: entity.context ?? undefined,
      timestamp: entity.timestamp.toISOString(),
    }
  }
}
