import { Injectable } from '@nestjs/common'
import { CacheTierService } from './cache-tier.service'
import { DBOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'
import { K8sScaleService } from './k8s-scale.service'
import type {
  CacheStats, GlobalCacheStats, CacheEntry, MultiLevelConfig, CacheTier,
  QueryAnalysis, QueryExecutionPlan, IndexCandidate, PoolStats, RewriteResult, ConnectionPoolConfig,
  LoadTestConfig, LoadTestEndpoint, LoadTestResult, AggregateMetrics,
  HPAPolicy, ReplicaMetrics, ScalingDecision, DeploymentHealth,
  ScaleHistoryEntry, CostEstimate, OptimizationSuggestion, DeploymentListEntry,
} from './performance.entity'

@Injectable()
export class PerformanceService {
  constructor(
    private readonly cacheTierService: CacheTierService,
    private readonly dbOptimizeService: DBOptimizeService,
    private readonly k6RunnerService: K6RunnerService,
    private readonly k8sScaleService: K8sScaleService,
  ) {}

  // ── 缓存代理 ──────────────────────────────────────────────────

  configureCache(config: MultiLevelConfig): void {
    this.cacheTierService.configure(config)
  }

  getCacheConfig(): MultiLevelConfig | null {
    try {
      return this.cacheTierService.getConfig()
    } catch {
      return null
    }
  }

  cacheGet<T = unknown>(key: string): T | null {
    return this.cacheTierService.get<T>(key)
  }

  cacheSet(key: string, value: unknown, options?: { ttlMs?: number; tags?: string[] }): void {
    this.cacheTierService.set(key, value, options)
  }

  cacheMGet<T = unknown>(keys: string[]): (T | null)[] {
    return this.cacheTierService.mget<T>(keys)
  }

  cacheDelete(key: string): void {
    this.cacheTierService.delete(key)
  }

  cacheFlush(tier?: CacheTier): void {
    this.cacheTierService.flush(tier)
  }

  cacheHas(key: string): boolean {
    return this.cacheTierService.has(key)
  }

  cacheGetTTL(key: string): number {
    return this.cacheTierService.getTTL(key)
  }

  cacheExpire(key: string, ttlMs: number): void {
    this.cacheTierService.expire(key, ttlMs)
  }

  cacheDeleteByTag(tag: string): number {
    return this.cacheTierService.deleteByTag(tag)
  }

  cacheWarm(keys: string[], loader: (keys: string[]) => Map<string, unknown>): void {
    this.cacheTierService.warm(keys, loader)
  }

  cacheGetStats(): CacheStats[] {
    return this.cacheTierService.getStats()
  }

  cacheGetGlobalStats(): GlobalCacheStats {
    return this.cacheTierService.getGlobalStats()
  }

  cacheResetStats(): void {
    this.cacheTierService.resetStats()
  }

  // ── 数据库优化代理 ────────────────────────────────────────────

  dbAnalyzeQuery(query: string): QueryAnalysis {
    return this.dbOptimizeService.analyzeQuery(query)
  }

  dbAnalyzeQueries(queries: string[]): QueryAnalysis[] {
    return this.dbOptimizeService.analyzeQueries(queries)
  }

  dbExplainPlan(query: string): QueryExecutionPlan {
    return this.dbOptimizeService.explainPlan(query)
  }

  dbRecommendIndexes(
    queries: string[],
    tableStats: Record<string, { rowCount: number; columnCardinality: Record<string, number> }>,
  ): IndexCandidate[] {
    return this.dbOptimizeService.recommendIndexes(queries, tableStats)
  }

  dbAnalyzeIndexUsage(indexName: string, tableName: string): unknown {
    return this.dbOptimizeService.analyzeIndexUsage(indexName, tableName)
  }

  dbRebuildIndex(indexName: string): void {
    this.dbOptimizeService.rebuildIndex(indexName)
  }

  dbInitPool(config: ConnectionPoolConfig): void {
    this.dbOptimizeService.initPool(config)
  }

  dbGetPoolStats(): PoolStats {
    return this.dbOptimizeService.getPoolStats()
  }

  dbRewriteQuery(query: string): RewriteResult {
    return this.dbOptimizeService.rewriteQuery(query)
  }

  dbCacheResult(key: string, result: unknown, ttlSeconds: number): void {
    this.dbOptimizeService.cacheResult(key, result, ttlSeconds)
  }

  async dbExecuteQuery(sql: string): Promise<{ rows: unknown[]; time: number }> {
    return this.dbOptimizeService.executeQuery(sql)
  }

  // ── 压测代理 ──────────────────────────────────────────────────

  async runLoadTest(
    config: LoadTestConfig,
    endpoints: LoadTestEndpoint[],
  ): Promise<LoadTestResult> {
    return this.k6RunnerService.runLoadTest(config, endpoints)
  }

  async runRampTest(
    config: LoadTestConfig,
    stages: { duration: number; vu: number }[],
  ): Promise<LoadTestResult> {
    return this.k6RunnerService.runRampTest(config, stages)
  }

  getRealtimeMetrics(): AggregateMetrics {
    return this.k6RunnerService.getRealtimeMetrics()
  }

  getLoadTestResult(testId: string): LoadTestResult | null {
    return this.k6RunnerService.getResult(testId)
  }

  suggestOptimizations(bottlenecks: string[]): OptimizationSuggestion[] {
    // 将 K6RunnerService 的返回类型转换为统一的 OptimizationSuggestion[]
    const raw = this.k6RunnerService.suggestOptimizations(bottlenecks)
    return raw as unknown as OptimizationSuggestion[]
  }

  // ── 弹性伸缩代理 ──────────────────────────────────────────────

  createHPAPolicy(policy: HPAPolicy): HPAPolicy {
    return this.k8sScaleService.createHPAPolicy(policy)
  }

  getHPAPolicy(name: string): HPAPolicy | null {
    return this.k8sScaleService.getHPAPolicy(name)
  }

  listHPAPolicies(): HPAPolicy[] {
    return this.k8sScaleService.listHPAPolicies()
  }

  updateHPAPolicy(name: string, updates: Partial<HPAPolicy>): HPAPolicy {
    return this.k8sScaleService.updateHPAPolicy(name, updates)
  }

  deleteHPAPolicy(name: string): void {
    this.k8sScaleService.deleteHPAPolicy(name)
  }

  collectMetrics(): ReplicaMetrics {
    return this.k8sScaleService.collectMetrics()
  }

  evaluateScaling(metrics: ReplicaMetrics): ScalingDecision[] {
    return this.k8sScaleService.evaluateScaling(metrics)
  }

  scaleDeployment(name: string, targetReplicas: number): DeploymentHealth {
    return this.k8sScaleService.scale(name, targetReplicas)
  }

  autoScale(name: string): ScalingDecision {
    return this.k8sScaleService.autoScale(name)
  }

  checkDeploymentHealth(name: string): DeploymentHealth {
    return this.k8sScaleService.checkHealth(name)
  }

  listDeployments(): DeploymentListEntry[] {
    return this.k8sScaleService.listDeployments()
  }

  restartPod(name: string): void {
    this.k8sScaleService.restartPod(name)
  }

  recommendReplicas(name: string, windowMinutes: number = 30): number {
    return this.k8sScaleService.recommendReplicas(name, windowMinutes)
  }

  analyzeBottlenecks(name: string): string[] {
    const metrics = this.k8sScaleService.collectMetrics()
    return this.k8sScaleService.analyzeBottleneck(metrics)
  }

  getScaleHistory(name: string, limit: number = 10): ScaleHistoryEntry[] {
    return this.k8sScaleService.getScaleHistory(name, limit)
  }

  estimateCost(name: string): CostEstimate {
    return this.k8sScaleService.estimateCost(name)
  }
}
