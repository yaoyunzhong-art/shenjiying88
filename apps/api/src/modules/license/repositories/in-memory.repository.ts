/**
 * 付费授权 - 内存 Repository (测试用)
 *
 * 提供 LicenseRepository 和 LicenseAuditLogRepository 的内存实现
 * 用于测试场景 (无 NestJS DI 容器时自动 fallback)
 */

import type { License, LicenseScope, LicenseStatus, CreateLicenseRequest, LicenseAuditLog } from '../license.entity'
import type { CreateAuditLogInput } from './license-audit-log.repository'

// ============ 内存 License Repository ============

class InMemoryLicenseRepo {
  private readonly licenses = new Map<string, License>()

  async findById(id: string): Promise<License | null> {
    return this.licenses.get(id) ?? null
  }

  async findByTenant(tenantId: string): Promise<License[]> {
    return Array.from(this.licenses.values())
      .filter((l) => l.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async findByStore(tenantId: string, storeId: string): Promise<License[]> {
    return Array.from(this.licenses.values())
      .filter((l) => l.tenantId === tenantId && l.storeId === storeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async findActiveLicense(
    tenantId: string,
    scope: LicenseScope,
    storeId?: string,
  ): Promise<License | null> {
    const now = new Date()
    // 1. 门店级
    if (storeId) {
      const storeLic = Array.from(this.licenses.values()).find(
        (l) =>
          l.tenantId === tenantId &&
          l.storeId === storeId &&
          l.scope === scope &&
          new Date(l.validFrom) <= now &&
          new Date(l.validUntil) > now,
      )
      if (storeLic) return storeLic
    }
    // 2. 租户级 (return highest priority match, not necessarily active)
    return Array.from(this.licenses.values()).find(
      (l) =>
        l.tenantId === tenantId &&
        !l.storeId &&
        l.scope === scope &&
        new Date(l.validFrom) <= now &&
        new Date(l.validUntil) > now,
    ) ?? null
  }

  async create(req: CreateLicenseRequest): Promise<License> {
    const id = req.id ?? `lic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const license: License = {
      id,
      tenantId: req.tenantId,
      storeId: req.storeId,
      scope: req.scope,
      level: req.level,
      status: 'active',
      quota: req.quota,
      usedQuota: req.usedQuota ?? 0,
      activationSource: req.activationSource,
      validFrom: req.validFrom,
      validUntil: req.validUntil,
      autoRenew: req.autoRenew ?? false,
      priceCents: req.priceCents,
      createdBy: req.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    this.licenses.set(id, license)
    return license
  }

  async updateStatus(
    id: string,
    status: LicenseStatus,
    _operator: string,
    _reason?: string,
  ): Promise<License | null> {
    const license = this.licenses.get(id)
    if (!license) return null
    const updated = { ...license, status, updatedAt: new Date().toISOString() }
    this.licenses.set(id, updated)
    return updated
  }

  async consumeQuota(id: string, count: number = 1): Promise<void> {
    const license = this.licenses.get(id)
    if (!license) return
    const used = (license.usedQuota ?? 0) + count
    const updated = { ...license, usedQuota: used, updatedAt: new Date().toISOString() }
    this.licenses.set(id, updated)
  }
}

// ============ 内存 Audit Log Repository ============

class InMemoryAuditLogRepo {
  private readonly logs: LicenseAuditLog[] = []

  async create(input: CreateAuditLogInput): Promise<LicenseAuditLog> {
    const log: LicenseAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      licenseId: input.licenseId ?? '',
      tenantId: input.tenantId,
      storeId: input.storeId,
      action: input.action,
      scope: input.scope,
      operator: input.operator,
      result: input.result,
      reason: input.reason,
      context: input.context,
      timestamp: new Date().toISOString(),
    }
    this.logs.push(log)
    if (this.logs.length > 5000) this.logs.shift()
    return log
  }

  async findByTenant(tenantId: string, limit: number = 100): Promise<LicenseAuditLog[]> {
    return this.logs
      .filter((l) => l.tenantId === tenantId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit)
  }

  async findByLicense(licenseId: string, limit: number = 50): Promise<LicenseAuditLog[]> {
    return this.logs
      .filter((l) => l.licenseId === licenseId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit)
  }

  async cleanupExpired(_retentionDays: number = 180): Promise<number> {
    const count = this.logs.length
    this.logs.length = 0
    return count
  }
}

// ============ 工厂 ============

export function createInMemoryLicenseRepos() {
  return {
    licenseRepo: new InMemoryLicenseRepo() as any,
    auditLogRepo: new InMemoryAuditLogRepo() as any,
  }
}
