import type {
  SandboxEnvironment,
  SandboxStatus,
  TenantId
} from '../openapi.entity'

/**
 * Phase-44 T174: Sandbox Adapter
 *
 * 职责:
 *  - 沙箱环境生命周期 (创建/激活/过期/清除)
 *  - 沙箱识别: tenantId 前缀 `t-sandbox-`
 *  - 数据脱敏标记
 *
 * 反模式 v4 sandbox-isolation:
 *  - 沙箱租户 ≠ 生产租户 (parent 关联)
 *  - 过期自动 PURGED (90 天后)
 *  - 沙箱数据脱敏 (PII)
 */
export class SandboxAdapter {
  private store = new Map<string, SandboxEnvironment>()  // id -> env
  private tenantIndex = new Map<TenantId, string>()       // tenantId -> id

  save(env: SandboxEnvironment): SandboxEnvironment {
    this.store.set(env.id, { ...env })
    this.tenantIndex.set(env.tenantId, env.id)
    return env
  }

  query(tenantId: TenantId, id: string): SandboxEnvironment | null {
    const e = this.store.get(id)
    return e && e.tenantId === tenantId ? e : null
  }

  queryByTenant(tenantId: TenantId): SandboxEnvironment | null {
    const id = this.tenantIndex.get(tenantId)
    return id ? this.store.get(id) || null : null
  }

  queryByParent(parentTenantId: TenantId): SandboxEnvironment[] {
    const result: SandboxEnvironment[] = []
    for (const e of this.store.values()) {
      if (e.parentTenantId === parentTenantId) {
        result.push(e)
      }
    }
    return result
  }

  updateStatus(tenantId: TenantId, id: string, status: SandboxStatus): SandboxEnvironment | null {
    const e = this.query(tenantId, id)
    if (!e) return null
    e.status = status
    if (status === 'PURGED') e.purgedAt = new Date().toISOString()
    this.store.set(id, e)
    return e
  }

  /** 检测 tenantId 是否沙箱 */
  isSandbox(tenantId: TenantId): boolean {
    return tenantId.startsWith('t-sandbox-')
  }

  /** 获取过期沙箱 (自动清理候选) */
  queryExpired(now: number = Date.now()): SandboxEnvironment[] {
    const result: SandboxEnvironment[] = []
    for (const e of this.store.values()) {
      if (e.status === 'EXPIRED' || new Date(e.expiresAt).getTime() < now) {
        result.push(e)
      }
    }
    return result
  }

  count(tenantId: TenantId): number {
    return this.queryByParent(tenantId).length
  }

  /** 测试用 */
  seed(envs: SandboxEnvironment[]): void {
    for (const e of envs) this.save(e)
  }
  reset(): void {
    this.store.clear()
    this.tenantIndex.clear()
  }
}