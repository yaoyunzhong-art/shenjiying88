import { Injectable } from '@nestjs/common'
import { KeyGenerator } from '../key-generator'
import { APIKeyAdapter } from '../datasources/api-key.adapter'
import type {
  APIKey,
  APIKeyEnvironment,
  APIKeyScope,
  TenantId
} from '../openapi.entity'

/**
 * Phase-44 T174: APIKeyService (API Key 业务层)
 *
 * 业务职责:
 *  - 创建 API Key (一次性返回明文)
 *  - 列表 + 撤销
 *  - 状态变更 (active/revoked/expired)
 *  - 使用统计
 */
@Injectable()
export class APIKeyService {
  constructor(
    private readonly keyGen: KeyGenerator,
    private readonly adapter: APIKeyAdapter
  ) {}

  /**
   * 创建 API Key
   */
  create(input: {
    tenantId: TenantId
    environment: APIKeyEnvironment
    name: string
    scopes: APIKeyScope[]
    createdBy: string
    expiresAt?: string
  }): { apiKey: APIKey; plaintextSecret: string } {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('name_required')
    }
    if (!input.scopes || input.scopes.length === 0) {
      throw new Error('scopes_required')
    }

    const result = this.keyGen.generate(input)
    this.adapter.save(result.apiKey)
    return result
  }

  /**
   * 列出 API Key
   */
  list(tenantId: TenantId, environment?: APIKeyEnvironment): APIKey[] {
    return this.adapter.queryByTenant(tenantId, environment)
  }

  /**
   * 查询单个
   */
  get(tenantId: TenantId, keyId: string): APIKey | null {
    return this.adapter.query(tenantId, keyId)
  }

  /**
   * 撤销
   */
  revoke(tenantId: TenantId, keyId: string, reason: string): APIKey | null {
    const k = this.adapter.query(tenantId, keyId)
    if (!k) return null
    if (k.status !== 'ACTIVE') {
      throw new Error(`cannot_revoke_${k.status.toLowerCase()}`)
    }
    return this.adapter.revoke(tenantId, keyId, reason)
  }

  /**
   * 验证 API Key 是否可用 (active + 未过期 + scope 检查)
   */
  validate(tenantId: TenantId, keyId: string, resource: string, action: string): {
    valid: boolean
    apiKey?: APIKey
    reason?: 'not_found' | 'revoked' | 'expired' | 'scope_mismatch'
  } {
    const k = this.adapter.query(tenantId, keyId)
    if (!k) return { valid: false, reason: 'not_found' }
    if (k.status === 'REVOKED') return { valid: false, apiKey: k, reason: 'revoked' }
    if (this.keyGen.isExpired(k)) return { valid: false, apiKey: k, reason: 'expired' }
    if (!this.keyGen.hasScope(k, resource, action)) return { valid: false, apiKey: k, reason: 'scope_mismatch' }
    return { valid: true, apiKey: k }
  }

  /**
   * 更新使用时间
   */
  touchUsage(tenantId: TenantId, keyId: string): void {
    const k = this.adapter.query(tenantId, keyId)
    if (k) {
      k.lastUsedAt = new Date().toISOString()
      this.adapter.save(k)
    }
  }

  /**
   * 统计
   */
  stats(tenantId: TenantId): {
    total: number
    byStatus: Record<string, number>
    byEnvironment: Record<string, number>
  } {
    const keys = this.adapter.queryByTenant(tenantId)
    const byStatus: Record<string, number> = { ACTIVE: 0, REVOKED: 0, EXPIRED: 0 }
    const byEnvironment: Record<string, number> = { LIVE: 0, TEST: 0, SANDBOX: 0 }
    for (const k of keys) {
      byStatus[k.status] = (byStatus[k.status] || 0) + 1
      byEnvironment[k.environment] = (byEnvironment[k.environment] || 0) + 1
    }
    return { total: keys.length, byStatus, byEnvironment }
  }

  /**
   * 检测环境 (通过 keyId 前缀)
   */
  detectEnvironment(keyId: string): APIKeyEnvironment | null {
    if (keyId.startsWith('sk_live_')) return 'LIVE'
    if (keyId.startsWith('sk_test_')) return 'TEST'
    if (keyId.startsWith('sk_sandbox_')) return 'SANDBOX'
    return null
  }
}