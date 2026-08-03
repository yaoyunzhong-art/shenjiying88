import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { PerformanceController } from './performance.controller'

describe('PerformanceController metadata', () => {
  it('controller should keep performance path', () => {
    assert.equal(Reflect.getMetadata('path', PerformanceController), 'performance')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [PerformanceController.prototype.configureCache, 1, 'cache/configure'],
      [PerformanceController.prototype.getCacheConfig, 0, 'cache/config'],
      [PerformanceController.prototype.getCache, 1, 'cache/get'],
      [PerformanceController.prototype.setCache, 1, 'cache/set'],
      [PerformanceController.prototype.msetCache, 1, 'cache/mset'],
      [PerformanceController.prototype.mgetCache, 1, 'cache/mget'],
      [PerformanceController.prototype.hasCache, 1, 'cache/has'],
      [PerformanceController.prototype.deleteCache, 3, 'cache/:key'],
      [PerformanceController.prototype.flushCache, 1, 'cache/flush'],
      [PerformanceController.prototype.getCacheStats, 0, 'cache/stats'],
      [PerformanceController.prototype.getGlobalCacheStats, 0, 'cache/global-stats'],
      [PerformanceController.prototype.resetCacheStats, 1, 'cache/reset-stats'],
      [PerformanceController.prototype.warmCache, 1, 'cache/warm'],
      [PerformanceController.prototype.getCacheTTL, 0, 'cache/ttl'],
      [PerformanceController.prototype.expireCache, 1, 'cache/expire'],
      [PerformanceController.prototype.deleteCacheByTag, 3, 'cache/tag/:tag'],
      [PerformanceController.prototype.analyzeQuery, 1, 'db/analyze'],
      [PerformanceController.prototype.analyzeQueries, 1, 'db/analyze-batch'],
      [PerformanceController.prototype.explainQuery, 1, 'db/explain'],
      [PerformanceController.prototype.recommendIndexes, 1, 'db/recommend-indexes'],
      [PerformanceController.prototype.analyzeIndexUsage, 0, 'db/index-usage'],
      [PerformanceController.prototype.rebuildIndex, 1, 'db/rebuild-index'],
      [PerformanceController.prototype.initPool, 1, 'db/init-pool'],
      [PerformanceController.prototype.getPoolStats, 0, 'db/pool-stats'],
      [PerformanceController.prototype.rewriteQuery, 1, 'db/rewrite'],
      [PerformanceController.prototype.cacheQueryResult, 1, 'db/cache-result'],
      [PerformanceController.prototype.executeQuery, 1, 'db/query'],
      [PerformanceController.prototype.runLoadTest, 1, 'load-test/run'],
      [PerformanceController.prototype.runRampTest, 1, 'load-test/ramp'],
      [PerformanceController.prototype.getRealtimeMetrics, 0, 'load-test/realtime-metrics'],
      [PerformanceController.prototype.getLoadTestResult, 0, 'load-test/result/:testId'],
      [PerformanceController.prototype.analyzeLoadTest, 1, 'load-test/analyze'],
      [PerformanceController.prototype.createHPAPolicy, 1, 'hpa'],
      [PerformanceController.prototype.listHPAPolicies, 0, 'hpa'],
      [PerformanceController.prototype.getHPAPolicy, 0, 'hpa/:name'],
      [PerformanceController.prototype.updateHPAPolicy, 4, 'hpa/:name'],
      [PerformanceController.prototype.deleteHPAPolicy, 3, 'hpa/:name'],
      [PerformanceController.prototype.collectMetrics, 0, 'metrics'],
      [PerformanceController.prototype.evaluateScaling, 1, 'scaling/evaluate'],
      [PerformanceController.prototype.scaleDeployment, 1, 'scaling/scale'],
      [PerformanceController.prototype.autoScale, 1, 'scaling/auto'],
      [PerformanceController.prototype.listDeployments, 0, 'deployments'],
      [PerformanceController.prototype.checkDeploymentHealth, 0, 'deployments/:name/health'],
      [PerformanceController.prototype.restartDeployment, 1, 'deployments/:name/restart'],
      [PerformanceController.prototype.recommendReplicas, 0, 'deployments/:name/recommend-replicas'],
      [PerformanceController.prototype.analyzeDeploymentBottlenecks, 0, 'deployments/:name/bottlenecks'],
      [PerformanceController.prototype.getScaleHistory, 0, 'deployments/:name/scale-history'],
      [PerformanceController.prototype.estimateCost, 0, 'deployments/:name/cost'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
