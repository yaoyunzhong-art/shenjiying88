import {
  Controller, Get, Post, Body, Param, Query,
  UsePipes, ValidationPipe, Delete, Patch,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common'
import { PerformanceService } from './performance.service'
import {
  MultiLevelConfigDto, SetCacheDto, MSetCacheDto, MGetCacheDto,
  CacheTagDeleteDto, CacheWarmDto, CacheFlushDto,
  AnalyzeQueryDto, AnalyzeQueriesDto, RecommendIndexesDto,
  InitPoolDto, CacheResultDto,
  RunLoadTestDto, RampTestDto, LoadTestConfigDto,
  CreateHPAPolicyDto, UpdateHPAPolicyDto,
  ScaleDeploymentDto, AutoScaleDto, DeploymentRecommendReplicasDto,
} from './performance.dto'
import type {
  CacheStats, GlobalCacheStats, CacheEntry,
  QueryAnalysis, QueryExecutionPlan, IndexCandidate,
  PoolStats, RewriteResult,
  LoadTestConfig, LoadTestEndpoint, LoadTestResult,
  HPAPolicy, ReplicaMetrics, ScalingDecision, DeploymentHealth,
  ScaleHistoryEntry, CostEstimate, OptimizationSuggestion,
} from './performance.entity'

@UseGuards(TenantGuard)
@Controller('performance')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // ── 缓存 ──────────────────────────────────────────────────────

  @Post('cache/configure')
  configureCache(@Body() config: MultiLevelConfigDto): { message: string } {
    this.performanceService.configureCache(config)
    return { message: '缓存配置已应用' }
  }

  @Get('cache/config')
  getCacheConfig(): unknown {
    return this.performanceService.getCacheConfig()
  }

  @Post('cache/get')
  getCache(@Body() body: { key: string }): { value: unknown } {
    const value = this.performanceService.cacheGet(body.key)
    return { value }
  }

  @Post('cache/set')
  setCache(@Body() body: SetCacheDto): { message: string } {
    this.performanceService.cacheSet(body.key, body.value, body)
    return { message: `缓存键 ${body.key} 已设置` }
  }

  @Post('cache/mset')
  msetCache(@Body() body: MSetCacheDto): { message: string } {
    for (const entry of body.entries) {
      this.performanceService.cacheSet(entry.key, entry.value, entry)
    }
    return { message: `批量设置了 ${body.entries.length} 个缓存键` }
  }

  @Post('cache/mget')
  mgetCache(@Body() body: MGetCacheDto): { values: unknown[] } {
    const values = this.performanceService.cacheMGet(body.keys)
    return { values }
  }

  @Post('cache/has')
  hasCache(@Body() body: { key: string }): { exists: boolean } {
    return { exists: this.performanceService.cacheHas(body.key) }
  }

  @Delete('cache/:key')
  deleteCache(@Param('key') key: string): { message: string } {
    this.performanceService.cacheDelete(key)
    return { message: `缓存键 ${key} 已删除` }
  }

  @Post('cache/flush')
  flushCache(@Body() body: CacheFlushDto): { message: string } {
    this.performanceService.cacheFlush(body.tier)
    return { message: `缓存${body.tier ? ` (${body.tier})` : ''}已清空` }
  }

  @Get('cache/stats')
  getCacheStats(): CacheStats[] {
    return this.performanceService.cacheGetStats()
  }

  @Get('cache/global-stats')
  getGlobalCacheStats(): GlobalCacheStats {
    return this.performanceService.cacheGetGlobalStats()
  }

  @Post('cache/reset-stats')
  resetCacheStats(): { message: string } {
    this.performanceService.cacheResetStats()
    return { message: '缓存统计已重置' }
  }

  @Post('cache/warm')
  warmCache(@Body() body: CacheWarmDto): { message: string } {
    this.performanceService.cacheWarm(body.keys, (keys) => {
      const map = new Map<string, unknown>()
      for (const key of keys) {
        map.set(key, `preloaded-${key}`)
      }
      return map
    })
    return { message: `预热了 ${body.keys.length} 个缓存键` }
  }

  @Get('cache/ttl')
  getCacheTTL(@Query('key') key: string): { ttl: number } {
    return { ttl: this.performanceService.cacheGetTTL(key) }
  }

  @Post('cache/expire')
  expireCache(@Body() body: { key: string; ttlMs: number }): { message: string } {
    this.performanceService.cacheExpire(body.key, body.ttlMs)
    return { message: `缓存键 ${body.key} 的 TTL 已更新` }
  }

  @Delete('cache/tag/:tag')
  deleteCacheByTag(@Param('tag') tag: string): { deleted: number } {
    const deleted = this.performanceService.cacheDeleteByTag(tag)
    return { deleted }
  }

  // ── 数据库优化 ────────────────────────────────────────────────

  @Post('db/analyze')
  analyzeQuery(@Body() body: AnalyzeQueryDto): QueryAnalysis {
    return this.performanceService.dbAnalyzeQuery(body.query)
  }

  @Post('db/analyze-batch')
  analyzeQueries(@Body() body: AnalyzeQueriesDto): QueryAnalysis[] {
    return this.performanceService.dbAnalyzeQueries(body.queries)
  }

  @Post('db/explain')
  explainQuery(@Body() body: AnalyzeQueryDto): QueryExecutionPlan {
    return this.performanceService.dbExplainPlan(body.query)
  }

  @Post('db/recommend-indexes')
  recommendIndexes(@Body() body: RecommendIndexesDto): IndexCandidate[] {
    return this.performanceService.dbRecommendIndexes(body.queries, body.tableStats)
  }

  @Get('db/index-usage')
  analyzeIndexUsage(
    @Query('indexName') indexName: string,
    @Query('tableName') tableName: string,
  ): unknown {
    return this.performanceService.dbAnalyzeIndexUsage(indexName, tableName)
  }

  @Post('db/rebuild-index')
  rebuildIndex(@Body() body: { indexName: string }): { message: string } {
    this.performanceService.dbRebuildIndex(body.indexName)
    return { message: `索引 ${body.indexName} 已重建` }
  }

  @Post('db/init-pool')
  initPool(@Body() body: InitPoolDto): { message: string } {
    this.performanceService.dbInitPool(body)
    return { message: '连接池已初始化' }
  }

  @Get('db/pool-stats')
  getPoolStats(): PoolStats {
    return this.performanceService.dbGetPoolStats()
  }

  @Post('db/rewrite')
  rewriteQuery(@Body() body: AnalyzeQueryDto): RewriteResult {
    return this.performanceService.dbRewriteQuery(body.query)
  }

  @Post('db/cache-result')
  cacheQueryResult(@Body() body: CacheResultDto): { message: string } {
    this.performanceService.dbCacheResult(body.key, body.result, body.ttlSeconds)
    return { message: `查询结果已缓存 (key=${body.key}, ttl=${body.ttlSeconds}s)` }
  }

  @Post('db/query')
  executeQuery(@Body() body: { sql: string }): Promise<{ rows: unknown[]; time: number }> {
    return this.performanceService.dbExecuteQuery(body.sql)
  }

  // ── 压测 ──────────────────────────────────────────────────────

  @Post('load-test/run')
  async runLoadTest(@Body() body: RunLoadTestDto): Promise<LoadTestResult> {
    return this.performanceService.runLoadTest(body.config, body.endpoints)
  }

  @Post('load-test/ramp')
  async runRampTest(@Body() body: RampTestDto): Promise<LoadTestResult> {
    return this.performanceService.runRampTest(body.config, body.stages)
  }

  @Get('load-test/realtime-metrics')
  getRealtimeMetrics(): unknown {
    return this.performanceService.getRealtimeMetrics()
  }

  @Get('load-test/result/:testId')
  getLoadTestResult(@Param('testId') testId: string): LoadTestResult | null {
    return this.performanceService.getLoadTestResult(testId)
  }

  @Post('load-test/analyze')
  analyzeLoadTest(
    @Body() body: { bottlenecks: string[] },
  ): OptimizationSuggestion[] {
    return this.performanceService.suggestOptimizations(body.bottlenecks)
  }

  // ── 弹性伸缩 ──────────────────────────────────────────────────

  @Post('hpa')
  createHPAPolicy(@Body() body: CreateHPAPolicyDto): HPAPolicy {
    return this.performanceService.createHPAPolicy(body)
  }

  @Get('hpa')
  listHPAPolicies(): HPAPolicy[] {
    return this.performanceService.listHPAPolicies()
  }

  @Get('hpa/:name')
  getHPAPolicy(@Param('name') name: string): HPAPolicy | null {
    return this.performanceService.getHPAPolicy(name)
  }

  @Patch('hpa/:name')
  updateHPAPolicy(
    @Param('name') name: string,
    @Body() body: UpdateHPAPolicyDto,
  ): HPAPolicy {
    return this.performanceService.updateHPAPolicy(name, body)
  }

  @Delete('hpa/:name')
  deleteHPAPolicy(@Param('name') name: string): { message: string } {
    this.performanceService.deleteHPAPolicy(name)
    return { message: `HPA 策略 ${name} 已删除` }
  }

  @Get('metrics')
  collectMetrics(): ReplicaMetrics {
    return this.performanceService.collectMetrics()
  }

  @Post('scaling/evaluate')
  evaluateScaling(@Body() body: { metrics: ReplicaMetrics }): ScalingDecision[] {
    return this.performanceService.evaluateScaling(body.metrics)
  }

  @Post('scaling/scale')
  scaleDeployment(@Body() body: ScaleDeploymentDto): DeploymentHealth {
    return this.performanceService.scaleDeployment(body.name, body.targetReplicas)
  }

  @Post('scaling/auto')
  autoScale(@Body() body: AutoScaleDto): ScalingDecision {
    return this.performanceService.autoScale(body.name)
  }

  @Get('deployments')
  listDeployments(): { name: string; status: string }[] {
    return this.performanceService.listDeployments()
  }

  @Get('deployments/:name/health')
  checkDeploymentHealth(@Param('name') name: string): DeploymentHealth {
    return this.performanceService.checkDeploymentHealth(name)
  }

  @Post('deployments/:name/restart')
  restartDeployment(@Param('name') name: string): { message: string } {
    this.performanceService.restartPod(name)
    return { message: `部署 ${name} 的 Pod 已重启` }
  }

  @Get('deployments/:name/recommend-replicas')
  recommendReplicas(
    @Param('name') name: string,
    @Query('windowMinutes') windowMinutes?: string,
  ): { recommendedReplicas: number } {
    const w = windowMinutes ? parseInt(windowMinutes, 10) : 30
    return { recommendedReplicas: this.performanceService.recommendReplicas(name, w) }
  }

  @Get('deployments/:name/bottlenecks')
  analyzeDeploymentBottlenecks(@Param('name') name: string): string[] {
    return this.performanceService.analyzeBottlenecks(name)
  }

  @Get('deployments/:name/scale-history')
  getScaleHistory(
    @Param('name') name: string,
    @Query('limit') limit?: string,
  ): ScaleHistoryEntry[] {
    const l = limit ? parseInt(limit, 10) : 10
    return this.performanceService.getScaleHistory(name, l)
  }

  @Get('deployments/:name/cost')
  estimateCost(@Param('name') name: string): CostEstimate {
    return this.performanceService.estimateCost(name)
  }
}
