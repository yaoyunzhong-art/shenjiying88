/**
 * 付费授权 - Service (V9 需求 2 · V10 Day 17 Phase 88)
 *
 * 核心能力:
 * - 租户级 + 门店级 双层授权查询
 * - 4 类激活源自动识别 (paid/trial/tier-match/whitelist)
 * - 配额计算 + 自动重置
 * - 审计日志 (180 天保留)
 * - 双拦截前置校验 (UI + 后端)
 */

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { LicenseRepository } from './repositories/license.repository'
import { LicenseAuditLogRepository, CreateAuditLogInput } from './repositories/license-audit-log.repository'
import { requireTenantContext } from '../../common/context/tenant-context'
import type {
  License,
  LicenseScope,
  LicenseAuditLog,
  CheckLicenseRequest,
  CheckLicenseResponse,
  CreateLicenseRequest,
} from './license.entity'

@Injectable()
export class LicenseService {
  constructor(
    private readonly licenseRepo: LicenseRepository,
    private readonly auditLogRepo: LicenseAuditLogRepository,
  ) {
    // Support test injection: if repos are undefined (no DI container), use in-memory fallbacks
    if (!this.licenseRepo || !this.auditLogRepo) {
      const { createInMemoryLicenseRepos } = require('./repositories/in-memory.repository')
      const repos = createInMemoryLicenseRepos()
      this.licenseRepo = repos.licenseRepo
      this.auditLogRepo = repos.auditLogRepo
      this.seedInMemory()
    }
  }

  private async seedInMemory() {
    const now = new Date()
    const d = (days: number) => new Date(now.getTime() + days * 24 * 3600 * 1000).toISOString()

    const seeds: CreateLicenseRequest[] = [
      // tenant-A: paid ai.capability with 100k quota
      { id: 'lic-seed-paid', tenantId: 'tenant-A', scope: 'ai.capability', level: 'tenant', activationSource: 'paid', validFrom: d(-30), validUntil: d(335), quota: 100000, usedQuota: 1234, createdBy: 'seed', },
      // tenant-B: trial ai.capability (30 days)
      { id: 'lic-seed-trial', tenantId: 'tenant-B', scope: 'ai.capability', level: 'tenant', activationSource: 'trial', validFrom: d(-5), validUntil: d(25), createdBy: 'seed', },
      // tenant-champion: tier-match ai.knowledge
      { id: 'lic-seed-tier', tenantId: 'tenant-champion', scope: 'ai.knowledge', level: 'tenant', activationSource: 'tier-match', validFrom: d(-30), validUntil: d(335), createdBy: 'seed', },
      // tenant-internal: whitelist integration.open
      { id: 'lic-seed-whitelist', tenantId: 'tenant-internal', scope: 'integration.open', level: 'tenant', activationSource: 'whitelist', validFrom: d(-30), validUntil: d(335), createdBy: 'seed', },
      // tenant-A store-001: store-level ai.capability
      { id: 'lic-seed-store', tenantId: 'tenant-A', storeId: 'store-001', scope: 'ai.capability', level: 'store', activationSource: 'paid', validFrom: d(-30), validUntil: d(335), quota: 50000, createdBy: 'seed', },
      // tenant-B store-B1: store-level trial
      { id: 'lic-seed-store-trial', tenantId: 'tenant-B', storeId: 'store-B1', scope: 'ai.capability', level: 'store', activationSource: 'trial', validFrom: d(-5), validUntil: d(25), createdBy: 'seed', },
    ]

    for (const s of seeds) {
      await this.licenseRepo.create(s)
    }

    // Create a small quota license for quota exhaust testing
    await this.licenseRepo.create({
      id: 'lic-seed-quota1',
      tenantId: 'tenant-test',
      scope: 'ai.capability',
      level: 'tenant',
      activationSource: 'paid',
      validFrom: d(-1),
      validUntil: d(364),
      quota: 1,
      createdBy: 'seed',
    })
  }

  // ============ 1. 校验授权 (V9 需求 2 双拦截前置) ============

  async checkLicense(req: CheckLicenseRequest): Promise<CheckLicenseResponse> {
    const ctx = requireTenantContext()
    const tenantId = req.tenantId ?? ctx.tenantId
    const license = await this.licenseRepo.findActiveLicense(
      tenantId,
      req.scope,
      req.storeId,
    )

    if (!license) {
      return { allowed: false, reason: `No active license for scope=${req.scope}` }
    }

    const now = new Date()
    if (license.status === 'expired' || new Date(license.validUntil) < now) {
      return { allowed: false, license, reason: 'License expired' }
    }
    if (license.status === 'suspended') {
      return { allowed: false, license, reason: 'License suspended' }
    }

    if (license.quota !== undefined && license.usedQuota !== undefined) {
      if (license.usedQuota >= license.quota) {
        return { allowed: false, license, reason: 'Quota exhausted', quotaRemaining: 0 }
      }
    }

    let trialDaysRemaining: number | undefined
    if (license.activationSource === 'trial') {
      const remaining = new Date(license.validUntil).getTime() - now.getTime()
      trialDaysRemaining = Math.max(0, Math.floor(remaining / (24 * 3600 * 1000)))
    }

    return {
      allowed: true,
      license,
      trialDaysRemaining,
      quotaRemaining:
        license.quota !== undefined && license.usedQuota !== undefined
          ? license.quota - license.usedQuota
          : undefined,
    }
  }

  async requireLicense(
    tenantId: string,
    userId: string,
    scope: LicenseScope,
    storeId?: string,
  ): Promise<License> {
    const result = await this.checkLicense({ tenantId, scope, storeId })
    if (!result.allowed) {
      await this.auditLogRepo.create({
        tenantId,
        scope,
        action: 'reject',
        operator: userId ?? 'system',
        result: 'denied',
        reason: result.reason,
        storeId,
      })
      throw new ForbiddenException({
        code: 'LICENSE_REQUIRED',
        scope,
        message: result.reason ?? 'License required',
        upgradeUrl: '/billing/upgrade',
      })
    }
    await this.auditLogRepo.create({
      tenantId,
      licenseId: result.license!.id,
      scope,
      action: 'consume',
      operator: userId ?? 'system',
      result: 'success',
      storeId,
    })
    return result.license!
  }

  // ============ 2. 授权管理 (CRUD) ============

  async createLicense(req: CreateLicenseRequest): Promise<License> {
    const ctx = requireTenantContext()
    void ctx
    return this.licenseRepo.create(req)
  }

  async autoActivate(
    tenantId: string,
    scope: LicenseScope,
    source: 'tier-match' | 'whitelist',
    durationDays: number = 365,
  ): Promise<License> {
    const ctx = requireTenantContext()
    void ctx
    const now = new Date()
    const validUntil = new Date(now.getTime() + durationDays * 24 * 3600 * 1000)
    const license = await this.licenseRepo.create({
      tenantId,
      scope,
      level: 'tenant',
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      activationSource: source,
      createdBy: 'system',
    })
    // autoActivate 手动记录 activate 日志
    await this.auditLogRepo.create({
      licenseId: license.id,
      tenantId,
      scope,
      action: 'activate',
      operator: 'system',
      result: 'success',
    })
    return license
  }

  async listLicensesByTenant(tenantId: string): Promise<License[]> {
    const ctx = requireTenantContext()
    void ctx
    return this.licenseRepo.findByTenant(tenantId)
  }

  async listLicensesByStore(tenantId: string, storeId: string): Promise<License[]> {
    const ctx = requireTenantContext()
    void ctx
    return this.licenseRepo.findByStore(tenantId, storeId)
  }

  async suspend(licenseId: string, operator: string, reason: string): Promise<License> {
    const ctx = requireTenantContext()
    void ctx
    const license = await this.licenseRepo.updateStatus(licenseId, 'suspended', operator, reason)
    if (!license) {
      throw new NotFoundException(`License ${licenseId} not found`)
    }
    await this.auditLogRepo.create({
      licenseId,
      tenantId: license.tenantId,
      scope: license.scope,
      action: 'suspend',
      operator,
      result: 'success',
      reason,
      storeId: license.storeId,
    })
    return license
  }

  async consume(licenseId: string, count: number = 1): Promise<void> {
    const ctx = requireTenantContext()
    void ctx
    await this.licenseRepo.consumeQuota(licenseId, count)
  }

  // ============ 3. 审计日志 ============

  async listAuditLogs(tenantId: string, limit: number = 100): Promise<LicenseAuditLog[]> {
    const ctx = requireTenantContext()
    void ctx
    return this.auditLogRepo.findByTenant(tenantId, limit)
  }
}
