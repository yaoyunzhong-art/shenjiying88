import { Injectable } from '@nestjs/common'
import { SandboxAdapter } from '../datasources/sandbox.adapter'
import type {
  SandboxEnvironment,
  SandboxStatus,
  TenantId
} from '../openapi.entity'

/**
 * Phase-44 T174: SandboxService (沙箱业务层)
 *
 * 业务职责:
 *  - 创建沙箱 (前缀 t-sandbox-)
 *  - 数据脱敏开关
 *  - 生命周期管理 (active/expired/purged)
 *  - 关联生产租户
 */
@Injectable()
export class SandboxService {
  constructor(private readonly adapter: SandboxAdapter) {}

  /**
   * 创建沙箱
   */
  create(input: {
    parentTenantId: TenantId
    name: string
    ttlDays?: number
    dataMaskingEnabled?: boolean
  }): SandboxEnvironment {
    const sandboxId = `t-sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const ttl = input.ttlDays || 30
    const now = Date.now()

    const env: SandboxEnvironment = {
      id: `sb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: sandboxId,
      parentTenantId: input.parentTenantId,
      name: input.name,
      status: 'ACTIVE',
      ttlDays: ttl,
      dataMaskingEnabled: input.dataMaskingEnabled ?? true,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttl * 86400000).toISOString()
    }

    return this.adapter.save(env)
  }

  /**
   * 查询沙箱
   */
  get(sandboxTenantId: TenantId): SandboxEnvironment | null {
    return this.adapter.queryByTenant(sandboxTenantId)
  }

  /**
   * 列出关联的所有沙箱
   */
  listByParent(parentTenantId: TenantId): SandboxEnvironment[] {
    return this.adapter.queryByParent(parentTenantId)
  }

  /**
   * 切换沙箱状态
   */
  setStatus(sandboxTenantId: TenantId, status: SandboxStatus): SandboxEnvironment | null {
    const env = this.adapter.queryByTenant(sandboxTenantId)
    if (!env) return null
    return this.adapter.updateStatus(env.tenantId, env.id, status)
  }

  /**
   * 数据脱敏 (与 event-tracking 反模式联动)
   */
  maskData(data: Record<string, any>): Record<string, any> {
    if (!data) return data
    const result = { ...data }
    const piiKeys = ['email', 'phone', 'idCard', 'password', 'token', 'ssn', 'creditCard']
    for (const key of Object.keys(result)) {
      if (piiKeys.includes(key)) {
        result[key] = '***MASKED***'
      }
    }
    return result
  }

  /**
   * 清理过期沙箱
   */
  cleanupExpired(): { cleaned: number; sandboxIds: string[] } {
    const expired = this.adapter.queryExpired()
    const ids: string[] = []
    for (const env of expired) {
      this.adapter.updateStatus(env.tenantId, env.id, 'PURGED')
      ids.push(env.tenantId)
    }
    return { cleaned: ids.length, sandboxIds: ids }
  }

  /**
   * 检测是否是沙箱
   */
  isSandbox(tenantId: TenantId): boolean {
    return this.adapter.isSandbox(tenantId)
  }

  /**
   * 检查是否过期
   */
  isExpired(env: SandboxEnvironment, now: number = Date.now()): boolean {
    return new Date(env.expiresAt).getTime() < now
  }
}