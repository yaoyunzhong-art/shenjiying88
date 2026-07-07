/**
 * Phase 98 CDN 缓存 Service (V10 Sprint 2 Day 29)
 *
 * 核心能力:
 * 1. 缓存规则 CRUD + URL pattern 匹配
 * 2. 边缘节点管理
 * 3. 主动失效 (url/pattern)
 * 4. 缓存命中率统计
 * 5. Cache-Control 头构造
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { requireTenantContext } from '../../common/context/tenant-context'
import {
  CdnCacheRule,
  EdgeNode,
  CdnCacheEntry,
  CacheInvalidation,
  CacheStrategy,
  CacheableMethod,
  generateRuleId,
  generateNodeId,
  generateInvalidationId,
  matchUrl,
  buildCacheControlHeader,
  buildCacheKey,
  computeHitRate,
} from './cdn.entity'
import type {
  CreateRuleDto, UpdateRuleDto, InvalidateDto, AddEdgeNodeDto,
  EdgeNodeStatsResponse,
} from './cdn.dto'

@Injectable()
export class CdnCacheService {
  /** 规则存储 */
  private readonly rules = new Map<string, CdnCacheRule>()
  /** tenantId → ruleIds */
  private readonly rulesByTenant = new Map<string, Set<string>>()
  /** 边缘节点 (全局共享, 不分租户) */
  private readonly edgeNodes = new Map<string, EdgeNode>()
  /** 缓存条目 */
  private readonly cacheEntries = new Map<string, CdnCacheEntry>()
  /** 失效记录 */
  private readonly invalidations = new Map<string, CacheInvalidation>()

  /** 命中/未命中计数 (按 tenant) */
  private readonly hitCounts = new Map<string, { hits: number; misses: number }>()

  // ============ 1. 规则 CRUD ============

  async createRule(dto: CreateRuleDto): Promise<CdnCacheRule> {
    const ctx = requireTenantContext()
    if (!dto.urlPattern) throw new BadRequestException('urlPattern 必填')
    try {
      matchUrl(dto.urlPattern, '/test') // 校验 pattern 合法
    } catch {
      throw new BadRequestException('urlPattern 不是合法模式')
    }

    const now = new Date().toISOString()
    const rule: CdnCacheRule = {
      id: generateRuleId(),
      tenantId: ctx.tenantId,
      name: dto.name,
      urlPattern: dto.urlPattern,
      methods: dto.methods ?? ['GET', 'HEAD'],
      strategy: dto.strategy ?? 'public',
      maxAge: dto.maxAge ?? 3600,
      staleWhileRevalidate: dto.staleWhileRevalidate ?? 86400,
      enableETag: dto.enableETag ?? true,
      enableGzip: dto.enableGzip ?? true,
      enableBrotli: dto.enableBrotli ?? false,
      varyHeaders: dto.varyHeaders ?? ['Accept-Encoding'],
      cacheableStatusCodes: dto.cacheableStatusCodes ?? [200, 301, 404],
      priority: dto.priority ?? 0,
      enabled: dto.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    }
    this.rules.set(rule.id, rule)
    if (!this.rulesByTenant.has(ctx.tenantId)) {
      this.rulesByTenant.set(ctx.tenantId, new Set())
    }
    this.rulesByTenant.get(ctx.tenantId)!.add(rule.id)
    return rule
  }

  async listRules(): Promise<CdnCacheRule[]> {
    const ctx = requireTenantContext()
    const ids = this.rulesByTenant.get(ctx.tenantId) ?? new Set()
    return Array.from(ids)
      .map((id) => this.rules.get(id))
      .filter((r): r is CdnCacheRule => r != null)
      .sort((a, b) => b.priority - a.priority)
  }

  async getRule(id: string): Promise<CdnCacheRule> {
    const ctx = requireTenantContext()
    const rule = this.rules.get(id)
    if (!rule || rule.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`缓存规则 ${id} 不存在`)
    }
    return rule
  }

  async updateRule(id: string, dto: UpdateRuleDto): Promise<CdnCacheRule> {
    const rule = await this.getRule(id)
    Object.assign(rule, dto)
    rule.updatedAt = new Date().toISOString()
    return rule
  }

  async deleteRule(id: string): Promise<void> {
    const rule = await this.getRule(id)
    this.rules.delete(id)
    this.rulesByTenant.get(rule.tenantId)?.delete(id)
  }

  // ============ 2. URL → 规则匹配 ============

  async matchRule(url: string, method: string = 'GET'): Promise<CdnCacheRule | null> {
    const ctx = requireTenantContext()
    const rules = await this.listRules()
    // 按优先级匹配
    for (const rule of rules) {
      if (!rule.enabled) continue
      if (!rule.methods.includes(method as CacheableMethod)) continue
      const result = matchUrl(rule.urlPattern, url)
      if (result.match) return rule
    }
    return null
  }

  /**
   * 计算请求的 Cache-Control 头 (网关/CDN 调用)
   */
  async getCacheControlForUrl(url: string, method: string = 'GET'): Promise<string | null> {
    const rule = await this.matchRule(url, method)
    if (!rule) return null
    return buildCacheControlHeader(rule)
  }

  // ============ 3. 边缘节点管理 ============

  async addEdgeNode(dto: AddEdgeNodeDto): Promise<EdgeNode> {
    if (!dto.name || !dto.region || !dto.endpoint) {
      throw new BadRequestException('name/region/endpoint 必填')
    }
    const node: EdgeNode = {
      id: generateNodeId(),
      name: dto.name,
      region: dto.region,
      endpoint: dto.endpoint,
      status: 'online',
      capacityBytes: dto.capacityBytes,
      usedBytes: 0,
      hitRate: 0,
      avgLatencyMs: 0,
      lastHeartbeatAt: new Date().toISOString(),
    }
    this.edgeNodes.set(node.id, node)
    return node
  }

  async listEdgeNodes(): Promise<EdgeNode[]> {
    return Array.from(this.edgeNodes.values())
  }

  async removeEdgeNode(id: string): Promise<void> {
    if (!this.edgeNodes.has(id)) throw new NotFoundException(`边缘节点 ${id} 不存在`)
    this.edgeNodes.delete(id)
  }

  async recordHeartbeat(id: string, hitRate: number, avgLatencyMs: number, usedBytes: number): Promise<EdgeNode> {
    const node = this.edgeNodes.get(id)
    if (!node) throw new NotFoundException(`边缘节点 ${id} 不存在`)
    node.hitRate = hitRate
    node.avgLatencyMs = avgLatencyMs
    node.usedBytes = usedBytes
    node.lastHeartbeatAt = new Date().toISOString()
    return node
  }

  // ============ 4. 主动失效 ============

  async invalidate(dto: InvalidateDto): Promise<CacheInvalidation> {
    const ctx = requireTenantContext()
    if (dto.mode === 'pattern') {
      try { matchUrl(dto.target, '/test') } catch { throw new BadRequestException('pattern 不合法') }
    }
    const targetNodeIds = dto.edgeNodeIds?.length ? dto.edgeNodeIds : Array.from(this.edgeNodes.keys())

    const now = new Date().toISOString()
    const inv: CacheInvalidation = {
      id: generateInvalidationId(),
      mode: dto.mode,
      target: dto.target,
      edgeNodeIds: targetNodeIds,
      status: 'pending',
      affectedEntries: 0,
      triggeredAt: now,
      triggeredBy: ctx.userId ?? 'system',
    }
    this.invalidations.set(inv.id, inv)

    // 计算影响条目
    let count = 0
    for (const [key, entry] of this.cacheEntries.entries()) {
      let hit = false
      if (dto.mode === 'url') {
        hit = entry.url === dto.target
      } else {
        // pattern: 把 URL 视为 path
        const result = matchUrl(dto.target, entry.url)
        hit = result.match
      }
      if (hit) {
        this.cacheEntries.delete(key)
        count++
      }
    }
    inv.affectedEntries = count
    inv.status = 'completed'
    inv.completedAt = new Date().toISOString()
    return inv
  }

  async listInvalidations(): Promise<CacheInvalidation[]> {
    return Array.from(this.invalidations.values())
      .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
  }

  // ============ 5. 缓存命中/未命中统计 (测试可调) ============

  recordHit(tenantId: string): void {
    const counts = this.hitCounts.get(tenantId) ?? { hits: 0, misses: 0 }
    counts.hits++
    this.hitCounts.set(tenantId, counts)
  }
  recordMiss(tenantId: string): void {
    const counts = this.hitCounts.get(tenantId) ?? { hits: 0, misses: 0 }
    counts.misses++
    this.hitCounts.set(tenantId, counts)
  }
  getHitRate(tenantId: string): number {
    const counts = this.hitCounts.get(tenantId) ?? { hits: 0, misses: 0 }
    return computeHitRate(counts.hits, counts.misses)
  }

  // ============ 6. 测试用工具 ============

  // 暴露给测试添加/移除缓存条目
  addCacheEntryForTesting(entry: CdnCacheEntry): void {
    this.cacheEntries.set(entry.key, entry)
  }
  removeCacheEntryForTesting(key: string): void {
    this.cacheEntries.delete(key)
  }
  listCacheEntriesForTesting(): CdnCacheEntry[] {
    return Array.from(this.cacheEntries.values())
  }

  getEdgeNodeStats(): EdgeNodeStatsResponse {
    const nodes = Array.from(this.edgeNodes.values())
    const online = nodes.filter((n) => n.status === 'online')
    const totalCapacity = nodes.reduce((s, n) => s + n.capacityBytes, 0)
    const totalUsed = nodes.reduce((s, n) => s + n.usedBytes, 0)
    const avgHitRate = online.length > 0 ? online.reduce((s, n) => s + n.hitRate, 0) / online.length : 0
    const avgLatency = online.length > 0 ? online.reduce((s, n) => s + n.avgLatencyMs, 0) / online.length : 0
    return {
      totalNodes: nodes.length,
      onlineNodes: online.length,
      totalCapacityBytes: totalCapacity,
      totalUsedBytes: totalUsed,
      averageHitRate: avgHitRate,
      averageLatencyMs: avgLatency,
    }
  }

  countRules(): number { return this.rules.size }
  countEdgeNodes(): number { return this.edgeNodes.size }
}