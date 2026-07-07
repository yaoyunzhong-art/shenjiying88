/**
 * 付费授权 - Repository 层 (V9 需求 2 · V10 Day 17 Phase 88)
 *
 * 职责:
 * - License 实体的持久化操作
 * - 租户级/门店级双层授权查询
 * - 配额消费与更新
 */

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan, MoreThan, IsNull, Not } from 'typeorm'
import { LicenseOrmEntity } from '../entities/license.orm-entity'
import type {
  License,
  LicenseScope,
  LicenseStatus,
  CreateLicenseRequest,
} from '../license.entity'

@Injectable()
export class LicenseRepository {
  constructor(
    @InjectRepository(LicenseOrmEntity)
    private readonly ormRepo: Repository<LicenseOrmEntity>,
  ) {}

  // ========== 基础 CRUD ==========

  async findById(id: string): Promise<License | null> {
    const entity = await this.ormRepo.findOne({ where: { id } })
    return entity ? this.toDomain(entity) : null
  }

  async findByTenant(tenantId: string): Promise<License[]> {
    const entities = await this.ormRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    })
    return entities.map((e) => this.toDomain(e))
  }

  async findByStore(tenantId: string, storeId: string): Promise<License[]> {
    const entities = await this.ormRepo.find({
      where: { tenantId, storeId },
      order: { createdAt: 'DESC' },
    })
    return entities.map((e) => this.toDomain(e))
  }

  // ========== 授权检查 (核心) ==========

  /**
   * 查找有效授权 (租户级优先，门店级兜底)
   */
  async findActiveLicense(
    tenantId: string,
    scope: LicenseScope,
    storeId?: string,
  ): Promise<License | null> {
    const now = new Date()

    // 1. 优先查找门店级授权
    if (storeId) {
      const storeLicense = await this.ormRepo.findOne({
        where: {
          tenantId,
          storeId,
          scope,
          status: 'active' as LicenseStatus,
          validFrom: LessThan(now),
          validUntil: MoreThan(now),
        },
      })
      if (storeLicense) return this.toDomain(storeLicense)
    }

    // 2. 兜底查找租户级授权
    const tenantLicense = await this.ormRepo.findOne({
      where: {
        tenantId,
        storeId: IsNull(),
        scope,
        status: 'active' as LicenseStatus,
        validFrom: LessThan(now),
        validUntil: MoreThan(now),
      },
    })
    return tenantLicense ? this.toDomain(tenantLicense) : null
  }

  // ========== 创建与更新 ==========

  async create(req: CreateLicenseRequest): Promise<License> {
    const id = `lic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date()

    const entity = this.ormRepo.create({
      id,
      tenantId: req.tenantId,
      storeId: req.storeId,
      scope: req.scope,
      level: req.level,
      status: 'active',
      quota: req.quota,
      usedQuota: 0,
      activationSource: req.activationSource,
      validFrom: new Date(req.validFrom),
      validUntil: new Date(req.validUntil),
      autoRenew: req.autoRenew ?? false,
      priceCents: req.priceCents,
      createdBy: req.createdBy,
      createdAt: now,
      updatedAt: now,
    })

    await this.ormRepo.save(entity)
    return this.toDomain(entity)
  }

  async updateStatus(
    id: string,
    status: LicenseStatus,
    operator: string,
    reason?: string,
  ): Promise<License | null> {
    const entity = await this.ormRepo.findOne({ where: { id } })
    if (!entity) return null

    entity.status = status
    entity.updatedAt = new Date()
    await this.ormRepo.save(entity)

    return this.toDomain(entity)
  }

  async consumeQuota(id: string, count: number = 1): Promise<void> {
    await this.ormRepo.increment({ id }, 'usedQuota', count)
  }

  // ========== 工具方法 ==========

  private toDomain(entity: LicenseOrmEntity): License {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      storeId: entity.storeId ?? undefined,
      scope: entity.scope as License['scope'],
      level: entity.level as License['level'],
      status: entity.status as License['status'],
      quota: entity.quota ?? undefined,
      usedQuota: entity.usedQuota,
      activationSource: entity.activationSource as License['activationSource'],
      validFrom: entity.validFrom.toISOString(),
      validUntil: entity.validUntil.toISOString(),
      autoRenew: entity.autoRenew,
      priceCents: entity.priceCents ?? undefined,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }
  }
}
