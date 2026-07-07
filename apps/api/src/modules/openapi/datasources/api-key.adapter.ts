import type {
  APIKey,
  APIKeyEnvironment,
  APIKeyStatus,
  TenantId,
  APIKeyScope
} from '../openapi.entity'

/**
 * Phase-44 T174: APIKey Adapter
 *
 * 职责:
 *  - API Key 持久化 (内存版, 含 tenantId 索引)
 *  - 查询: byKeyId / byTenant / byStatus
 *  - 撤销: 标记 status = REVOKED
 *
 * 反模式 v4 openapi-design:
 *  - 私钥哈希存储, 不存明文
 *  - tenantId 索引隔离
 *  - 撤销不可逆 (状态机)
 */
export class APIKeyAdapter {
  private store = new Map<string, APIKey>()           // keyId -> APIKey
  private tenantIndex = new Map<TenantId, Set<string>>()  // tenantId -> Set<keyId>

  save(key: APIKey): APIKey {
    this.store.set(key.keyId, { ...key })
    if (!this.tenantIndex.has(key.tenantId)) {
      this.tenantIndex.set(key.tenantId, new Set())
    }
    this.tenantIndex.get(key.tenantId)!.add(key.keyId)
    return key
  }

  queryByKeyId(keyId: string): APIKey | null {
    return this.store.get(keyId) || null
  }

  query(tenantId: TenantId, keyId: string): APIKey | null {
    const k = this.store.get(keyId)
    return k && k.tenantId === tenantId ? k : null
  }

  queryByTenant(tenantId: TenantId, environment?: APIKeyEnvironment): APIKey[] {
    const keyIds = this.tenantIndex.get(tenantId) || new Set()
    const result: APIKey[] = []
    for (const id of keyIds) {
      const k = this.store.get(id)
      if (k && (!environment || k.environment === environment)) {
        result.push(k)
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  queryByStatus(tenantId: TenantId, status: APIKeyStatus): APIKey[] {
    return this.queryByTenant(tenantId).filter(k => k.status === status)
  }

  revoke(tenantId: TenantId, keyId: string, reason: string): APIKey | null {
    const k = this.query(tenantId, keyId)
    if (!k) return null
    k.status = 'REVOKED'
    k.revokedAt = new Date().toISOString()
    k.revokedReason = reason
    this.store.set(keyId, k)
    return k
  }

  count(tenantId: TenantId): number {
    return (this.tenantIndex.get(tenantId) || new Set()).size
  }

  countByStatus(tenantId: TenantId): Record<APIKeyStatus, number> {
    const keys = this.queryByTenant(tenantId)
    const counts: Record<APIKeyStatus, number> = { ACTIVE: 0, REVOKED: 0, EXPIRED: 0 }
    for (const k of keys) counts[k.status]++
    return counts
  }

  /** 测试用: 种子 */
  seed(keys: APIKey[]): void {
    for (const k of keys) this.save(k)
  }

  /** 测试用: 重置 */
  reset(): void {
    this.store.clear()
    this.tenantIndex.clear()
  }
}