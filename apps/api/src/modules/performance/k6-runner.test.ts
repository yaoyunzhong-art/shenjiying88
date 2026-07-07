import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * k6-runner.test.ts - Phase-23 T127-1
 * K6RunnerService 压测引擎单元测试
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { K6RunnerService, type LoadTestResult } from './k6-runner.service'

describe('K6RunnerService', () => {
  let svc: K6RunnerService

  beforeEach(() => {
    svc = new K6RunnerService()
  })

  // ── createConfig ──────────────────────────────────────────────────────────

  describe('createConfig', () => {
    it('创建有效配置', () => {
      const config = svc.createConfig({
        name: 'test-config',
        vu: 100,
        duration: 30,
        pattern: 'constant',
        targetRPS: 500,
      })

      assert.equal(config.name, 'test-config')
      assert.equal(config.vu, 100)
      assert.equal(config.duration, 30)
      assert.equal(config.pattern, 'constant')
      assert.equal(config.targetRPS, 500)
    })

    it('createConfig 支持 stages 参数', () => {
      const config = svc.createConfig({
        name: 'ramp-config',
        vu: 100,
        duration: 60,
        pattern: 'ramp',
        stages: [
          { duration: 10, vu: 50 },
          { duration: 20, vu: 100 },
          { duration: 10, vu: 50 },
        ],
      })

      assert.equal(config.pattern, 'ramp')
      assert.equal(config.stages?.length, 3)
      assert.equal(config.stages?.[0].vu, 50)
      assert.equal(config.stages?.[1].vu, 100)
    })
  })

  // ── runLoadTest ───────────────────────────────────────────────────────────

  describe('runLoadTest', () => {
    it('constant 模式（500 VU，10s）→ 结果非空', async () => {
      const config = svc.createConfig({
        name: 'constant-500vu',
        vu: 500,
        duration: 10,
        pattern: 'constant',
        targetRPS: 1000,
      })

      const endpoints = [
        { url: '/api/users', method: 'GET', weight: 3 },
        { url: '/api/orders', method: 'POST', weight: 2 },
        { url: '/api/products', method: 'GET', weight: 5 },
      ]

      const result = await svc.runLoadTest(config, endpoints)

      assert.ok(result)
      assert.equal(result.config.name, 'constant-500vu')
      assert.equal(result.metrics.totalRequests > 0, true)
      assert.ok(result.duration > 0)
      assert.ok(result.startedAt instanceof Date)
      assert.ok(result.completedAt instanceof Date)
    })

    it('constant 模式结果包含有效指标', async () => {
      const config = svc.createConfig({
        name: 'constant-test',
        vu: 50,
        duration: 5,
        pattern: 'constant',
        targetRPS: 100,
      })

      const endpoints = [{ url: '/test', method: 'GET', weight: 1 }]
      const result = await svc.runLoadTest(config, endpoints)

      assert.ok(result.metrics.totalRequests > 0)
      assert.ok(result.metrics.successfulRequests >= 0)
      assert.ok(result.metrics.failedRequests >= 0)
      assert.ok(result.metrics.avgResponseTime >= 0)
      assert.ok(result.metrics.p50ResponseTime >= 0)
      assert.ok(result.metrics.p95ResponseTime >= 0)
      assert.ok(result.metrics.p99ResponseTime >= 0)
      assert.ok(result.metrics.requestsPerSecond >= 0)
      assert.ok(result.metrics.errorRate >= 0)
    })

    it('runLoadTest 高 VU（2000）→ 错误率/rps 指标合理', async () => {
      const config = svc.createConfig({
        name: 'high-vu-test',
        vu: 2000,
        duration: 10,
        pattern: 'constant',
        targetRPS: 5000,
      })

      const endpoints = [
        { url: '/api/orders', method: 'POST', weight: 1 },
      ]

      const result = await svc.runLoadTest(config, endpoints)

      assert.ok(result.metrics.totalRequests > 0)
      assert.ok(result.metrics.errorRate >= 0)
      assert.ok(result.metrics.errorRate <= 1)
      assert.ok(result.metrics.requestsPerSecond > 0)

      // RPS 可以很高，因为是内存模拟，实际执行会很快
      // 只验证 RPS 是正数且 totalRequests 合理
      assert.ok(result.metrics.requestsPerSecond > 0)
      assert.ok(result.metrics.totalRequests <= config.vu * 100)
    })
  })

  // ── runRampTest ───────────────────────────────────────────────────────────

  describe('runRampTest', () => {
    it('分阶段执行 → VU 变化正确', async () => {
      const config = svc.createConfig({
        name: 'ramp-test',
        vu: 100,
        duration: 60,
        pattern: 'ramp',
        targetRPS: 500,
      })

      const stages = [
        { duration: 5, vu: 50 },
        { duration: 10, vu: 100 },
        { duration: 5, vu: 150 },
        { duration: 5, vu: 100 },
        { duration: 5, vu: 50 },
      ]

      const result = await svc.runRampTest(config, stages)

      assert.ok(result)
      assert.equal(result.config.pattern, 'ramp')
      assert.ok(result.config.stages)
      assert.equal(result.config.stages.length, stages.length)
      assert.equal(result.config.stages[0].vu, 50)
      assert.equal(result.config.stages[1].vu, 100)
      assert.equal(result.config.stages[2].vu, 150)
      assert.ok(result.metrics.totalRequests > 0)
    })

    it('ramp 模式包含多个 VU 级别', async () => {
      const config = svc.createConfig({
        name: 'multi-stage-ramp',
        vu: 100,
        duration: 30,
        pattern: 'ramp',
        targetRPS: 300,
      })

      const stages = [
        { duration: 3, vu: 20 },
        { duration: 5, vu: 60 },
        { duration: 3, vu: 100 },
      ]

      const result = await svc.runRampTest(config, stages)

      assert.ok(result.metrics.totalRequests > 0)
      assert.ok(result.duration > 0)
    })
  })

  // ── analyzeBottlenecks ─────────────────────────────────────────────────────

  describe('analyzeBottlenecks', () => {
    it('识别出高错误率', () => {
      const result: LoadTestResult = {
        config: {
          name: 'high-error-test',
          vu: 100,
          duration: 30,
          pattern: 'constant',
          targetRPS: 500,
        },
        metrics: {
          totalRequests: 1000,
          successfulRequests: 800,
          failedRequests: 150,
          timeoutRequests: 50,
          avgResponseTime: 300,
          p50ResponseTime: 200,
          p95ResponseTime: 500,
          p99ResponseTime: 800,
          maxResponseTime: 1000,
          minResponseTime: 50,
          requestsPerSecond: 33,
          errorRate: 0.15,
          throughputBytesPerSec: 10000,
        },
        duration: 30,
        startedAt: new Date(),
        completedAt: new Date(),
        statusCode: 'error',
        bottlenecks: [],
      }

      const bottlenecks = svc.analyzeBottlenecks(result)

      assert.ok(bottlenecks.some((b) => b.includes('高错误率')))
    })

    it('识别出高延迟', () => {
      const result: LoadTestResult = {
        config: {
          name: 'high-latency-test',
          vu: 100,
          duration: 30,
          pattern: 'constant',
          targetRPS: 500,
        },
        metrics: {
          totalRequests: 1000,
          successfulRequests: 900,
          failedRequests: 50,
          timeoutRequests: 50,
          avgResponseTime: 800,
          p50ResponseTime: 500,
          p95ResponseTime: 1200,
          p99ResponseTime: 2000,
          maxResponseTime: 3000,
          minResponseTime: 100,
          requestsPerSecond: 33,
          errorRate: 0.05,
          throughputBytesPerSec: 10000,
        },
        duration: 30,
        startedAt: new Date(),
        completedAt: new Date(),
        statusCode: 'error',
        bottlenecks: [],
      }

      const bottlenecks = svc.analyzeBottlenecks(result)

      assert.ok(bottlenecks.some((b) => b.includes('P99 延迟过高')))
      assert.ok(bottlenecks.some((b) => b.includes('平均响应时间过高')))
    })

    it('无瓶颈时返回空数组', () => {
      const result: LoadTestResult = {
        config: {
          name: 'healthy-test',
          vu: 50,
          duration: 10,
          pattern: 'constant',
          targetRPS: 100,
        },
        metrics: {
          totalRequests: 1000,
          successfulRequests: 990,
          failedRequests: 5,
          timeoutRequests: 5,
          avgResponseTime: 100,
          p50ResponseTime: 80,
          p95ResponseTime: 200,
          p99ResponseTime: 400,
          maxResponseTime: 500,
          minResponseTime: 20,
          requestsPerSecond: 100,
          errorRate: 0.005,
          throughputBytesPerSec: 10000,
        },
        duration: 10,
        startedAt: new Date(),
        completedAt: new Date(),
        statusCode: 'ok',
        bottlenecks: [],
      }

      const bottlenecks = svc.analyzeBottlenecks(result)

      assert.equal(bottlenecks.length, 0)
    })
  })

  // ── suggestOptimizations ───────────────────────────────────────────────────

  describe('suggestOptimizations', () => {
    it('输出有效建议', () => {
      const bottlenecks = [
        '高错误率：需要检查服务稳定性',
        'P99 延迟过高：需要优化慢查询或增加超时',
        '吞吐量不足：瓶颈可能在数据库或连接池',
      ]

      const suggestions = svc.suggestOptimizations(bottlenecks)

      assert.ok(suggestions.length > 0)
      assert.ok(suggestions.some((s) => s.priority === 'high'))
      assert.ok(suggestions.every((s) => s.suggestion.length > 0))
      assert.ok(suggestions.every((s) => s.expectedGain.length > 0))
    })

    it('高错误率返回 high priority 建议', () => {
      const bottlenecks = ['高错误率：需要检查服务稳定性']
      const suggestions = svc.suggestOptimizations(bottlenecks)

      const highPrioritySuggestions = suggestions.filter((s) => s.priority === 'high')
      assert.ok(highPrioritySuggestions.length > 0)
      assert.ok(highPrioritySuggestions.some((s) => s.suggestion.includes('重试机制')))
    })

    it('空瓶颈返回空建议', () => {
      const suggestions = svc.suggestOptimizations([])
      assert.equal(suggestions.length, 0)
    })
  })

  // ── generateReport ────────────────────────────────────────────────────────

  describe('generateReport', () => {
    it('生成文本报告', () => {
      const result: LoadTestResult = {
        config: {
          name: 'report-test',
          vu: 100,
          duration: 30,
          pattern: 'constant',
          targetRPS: 500,
        },
        metrics: {
          totalRequests: 1000,
          successfulRequests: 950,
          failedRequests: 40,
          timeoutRequests: 10,
          avgResponseTime: 150,
          p50ResponseTime: 100,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          maxResponseTime: 800,
          minResponseTime: 20,
          requestsPerSecond: 33,
          errorRate: 0.04,
          throughputBytesPerSec: 10000,
        },
        duration: 30,
        startedAt: new Date('2024-01-01T00:00:00Z'),
        completedAt: new Date('2024-01-01T00:00:30Z'),
        statusCode: 'ok',
        bottlenecks: ['吞吐量不足：瓶颈可能在数据库或连接池'],
      }

      const report = svc.generateReport(result)

      assert.ok(report.includes('Load Test Report'))
      assert.ok(report.includes('report-test'))
      assert.ok(report.includes('constant'))
      assert.ok(report.includes('1000'))
      assert.ok(report.includes('33'))
      assert.ok(report.includes('吞吐量不足'))
    })
  })

  // ── exportJSON ─────────────────────────────────────────────────────────────

  describe('exportJSON', () => {
    it('输出完整 JSON（含配置+指标）', () => {
      const result: LoadTestResult = {
        config: {
          name: 'export-test',
          vu: 200,
          duration: 60,
          pattern: 'ramp',
          targetRPS: 1000,
          stages: [
            { duration: 10, vu: 50 },
            { duration: 20, vu: 200 },
          ],
        },
        metrics: {
          totalRequests: 5000,
          successfulRequests: 4800,
          failedRequests: 150,
          timeoutRequests: 50,
          avgResponseTime: 120,
          p50ResponseTime: 80,
          p95ResponseTime: 250,
          p99ResponseTime: 400,
          maxResponseTime: 600,
          minResponseTime: 15,
          requestsPerSecond: 83,
          errorRate: 0.03,
          throughputBytesPerSec: 25000,
        },
        duration: 60,
        startedAt: new Date('2024-01-01T00:00:00Z'),
        completedAt: new Date('2024-01-01T00:01:00Z'),
        statusCode: 'ok',
        bottlenecks: [],
      }

      const json = svc.exportJSON(result)
      const parsed = JSON.parse(json)

      assert.equal(parsed.config.name, 'export-test')
      assert.equal(parsed.config.vu, 200)
      assert.equal(parsed.config.pattern, 'ramp')
      assert.equal(parsed.metrics.totalRequests, 5000)
      assert.equal(parsed.metrics.errorRate, 0.03)
      assert.equal(parsed.statusCode, 'ok')
    })
  })

  // ── getResult ──────────────────────────────────────────────────────────────

  describe('getResult', () => {
    it('返回历史结果', async () => {
      const config = svc.createConfig({
        name: 'history-test',
        vu: 100,
        duration: 10,
        pattern: 'constant',
        targetRPS: 500,
      })

      const endpoints = [{ url: '/test', method: 'GET', weight: 1 }]
      const result = await svc.runLoadTest(config, endpoints)

      const retrieved = svc.getResult('test-1')

      assert.ok(retrieved)
      assert.equal(retrieved?.config.name, 'history-test')
    })

    it('不存在的 testId 返回 null', () => {
      const result = svc.getResult('non-existent-id')
      assert.equal(result, null)
    })
  })

  // ── getRealtimeMetrics ─────────────────────────────────────────────────────

  describe('getRealtimeMetrics', () => {
    it('初始状态返回零值指标', () => {
      const metrics = svc.getRealtimeMetrics()

      assert.equal(metrics.totalRequests, 0)
      assert.equal(metrics.successfulRequests, 0)
      assert.equal(metrics.requestsPerSecond, 0)
    })

    it('压测后返回有效指标', async () => {
      const config = svc.createConfig({
        name: 'realtime-test',
        vu: 50,
        duration: 5,
        pattern: 'constant',
        targetRPS: 200,
      })

      const endpoints = [{ url: '/test', method: 'GET', weight: 1 }]
      await svc.runLoadTest(config, endpoints)

      const metrics = svc.getRealtimeMetrics()

      assert.ok(metrics.totalRequests > 0)
    })
  })
})
