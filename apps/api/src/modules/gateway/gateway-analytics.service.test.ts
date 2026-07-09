// gateway-analytics.service.test.ts — GatewayAnalyticsService 单元测试
import { describe, it, expect, beforeEach } from 'vitest'
import { GatewayAnalyticsService } from './gateway-analytics.service'
import type { GatewayLogEntry } from './gateway.entity'

function createMockLogSource(logs: GatewayLogEntry[]) {
  return {
    getRequestLogs: (_limit?: number) => logs,
  }
}

function makeLog(overrides: Partial<GatewayLogEntry> & { timestamp: number }): GatewayLogEntry {
  return {
    path: overrides.path ?? '/api/test',
    method: overrides.method ?? 'GET',
    timestamp: overrides.timestamp,
    statusCode: overrides.statusCode,
    responseTime: overrides.responseTime,
    clientId: overrides.clientId,
    ip: overrides.ip,
  }
}

describe('GatewayAnalyticsService', () => {
  let service: GatewayAnalyticsService

  beforeEach(() => {
    service = new GatewayAnalyticsService()
  })

  describe('getSummary', () => {
    it('应该返回空摘要（无日志源）', async () => {
      const summary = await service.getSummary()
      expect(summary.totalRequests).toBe(0)
      expect(summary.totalErrors).toBe(0)
      expect(summary.errorRate).toBe(0)
    })

    it('应该计算请求量、错误数和延迟统计', async () => {
      const now = Date.now()
      const logs: GatewayLogEntry[] = [
        makeLog({ timestamp: now - 3000, path: '/api/member', method: 'GET', statusCode: 200, responseTime: 50, clientId: 'client-a' }),
        makeLog({ timestamp: now - 2000, path: '/api/member', method: 'GET', statusCode: 200, responseTime: 80, clientId: 'client-a' }),
        makeLog({ timestamp: now - 1000, path: '/api/order', method: 'POST', statusCode: 500, responseTime: 200, clientId: 'client-b' }),
        makeLog({ timestamp: now, path: '/api/order', method: 'POST', statusCode: 429, responseTime: 10, clientId: 'client-b' }),
      ]
      service.setLogSource(createMockLogSource(logs))

      const summary = await service.getSummary()
      expect(summary.totalRequests).toBe(4)
      expect(summary.totalErrors).toBe(2) // 500 + 429
      expect(summary.errorRate).toBe(0.5)
      expect(summary.avgLatencyMs).toBe(85) // (50+80+200+10)/4
      expect(summary.uniqueClients).toBe(2)
      expect(summary.uniqueEndpoints).toBe(2) // GET:/api/member + POST:/api/order
    })

    it('应该按时间范围过滤日志', async () => {
      const now = Date.now()
      const logs: GatewayLogEntry[] = [
        makeLog({ timestamp: now - 5000, path: '/api/old', method: 'GET', statusCode: 200, responseTime: 30 }),
        makeLog({ timestamp: now, path: '/api/new', method: 'GET', statusCode: 200, responseTime: 40 }),
      ]
      service.setLogSource(createMockLogSource(logs))

      const summary = await service.getSummary({ startTime: now - 2000, endTime: now + 1000 })
      expect(summary.totalRequests).toBe(1)
    })
  })

  describe('getEndpointAnalytics', () => {
    it('应该按端点分组统计', async () => {
      const now = Date.now()
      const logs: GatewayLogEntry[] = [
        makeLog({ timestamp: now - 2000, path: '/api/member', method: 'GET', statusCode: 200, responseTime: 50, clientId: 'c1' }),
        makeLog({ timestamp: now - 1000, path: '/api/member', method: 'GET', statusCode: 200, responseTime: 150, clientId: 'c2' }),
        makeLog({ timestamp: now, path: '/api/order', method: 'POST', statusCode: 500, responseTime: 300, clientId: 'c1' }),
      ]
      service.setLogSource(createMockLogSource(logs))

      const endpoints = await service.getEndpointAnalytics()
      expect(endpoints).toHaveLength(2)

      const memberEp = endpoints.find(e => e.path === '/api/member')
      expect(memberEp).toBeDefined()
      expect(memberEp!.requestCount).toBe(2)
      expect(memberEp!.errorCount).toBe(0)
      expect(memberEp!.avgLatencyMs).toBe(100)

      const orderEp = endpoints.find(e => e.path === '/api/order')
      expect(orderEp).toBeDefined()
      expect(orderEp!.requestCount).toBe(1)
      expect(orderEp!.errorCount).toBe(1)
    })
  })

  describe('getClientAnalytics', () => {
    it('应该按客户端分组统计', async () => {
      const now = Date.now()
      const logs: GatewayLogEntry[] = [
        makeLog({ timestamp: now - 2000, path: '/api/a', method: 'GET', statusCode: 200, clientId: 'c1' }),
        makeLog({ timestamp: now - 1000, path: '/api/b', method: 'POST', statusCode: 200, clientId: 'c1' }),
        makeLog({ timestamp: now, path: '/api/a', method: 'GET', statusCode: 429, clientId: 'c2' }),
      ]
      service.setLogSource(createMockLogSource(logs))

      const clients = await service.getClientAnalytics()
      expect(clients).toHaveLength(2)

      const c1 = clients.find(c => c.clientId === 'c1')
      expect(c1).toBeDefined()
      expect(c1!.requestCount).toBe(2)
      expect(c1!.distinctEndpoints).toBe(2)

      const c2 = clients.find(c => c.clientId === 'c2')
      expect(c2).toBeDefined()
      expect(c2!.requestCount).toBe(1)
      expect(c2!.rateLimitHits).toBe(1)
    })

    it('应该处理匿名客户端', async () => {
      const logs: GatewayLogEntry[] = [
        makeLog({ timestamp: Date.now(), path: '/api/test', method: 'GET', statusCode: 200 }),
      ]
      service.setLogSource(createMockLogSource(logs))

      const clients = await service.getClientAnalytics()
      expect(clients).toHaveLength(1)
      expect(clients[0].clientId).toBe('anonymous')
    })
  })

  describe('getTimeSeries', () => {
    it('应该按时间桶分组数据', async () => {
      const base = Date.now() - 300000 // 5 min ago
      const logs: GatewayLogEntry[] = []
      for (let i = 0; i < 10; i++) {
        logs.push(makeLog({
          timestamp: base + i * 60000,
          path: '/api/test',
          method: 'GET',
          statusCode: i % 3 === 0 ? 500 : 200,
          responseTime: 50 + i * 10,
        }))
      }
      service.setLogSource(createMockLogSource(logs))

      const ts = await service.getTimeSeries({ resolution: '5m', startTime: base, endTime: base + 600000 })
      expect(ts.requests.length).toBeGreaterThanOrEqual(1)
      expect(ts.errors.length).toBe(ts.requests.length)
      expect(ts.latencies.length).toBe(ts.requests.length)
    })
  })

  describe('detectAnomalies', () => {
    it('应该返回 insufficient_data 当日志不足', async () => {
      const logs: GatewayLogEntry[] = Array.from({ length: 5 }, (_, i) =>
        makeLog({ timestamp: Date.now() - i * 1000, path: '/api/test', method: 'GET', statusCode: 200, responseTime: 50 })
      )
      service.setLogSource(createMockLogSource(logs))

      const anomalies = await service.detectAnomalies()
      expect(anomalies).toHaveLength(1)
      expect(anomalies[0].metric).toBe('insufficient_data')
    })

    it('应该检测延迟异常', async () => {
      const base = Date.now() - 10000
      const logs: GatewayLogEntry[] = []
      // 80% 低延迟
      for (let i = 0; i < 40; i++) {
        logs.push(makeLog({ timestamp: base + i * 100, path: '/api/test', method: 'GET', statusCode: 200, responseTime: 50 + Math.random() * 20 }))
      }
      // 20% 高延迟
      for (let i = 0; i < 10; i++) {
        logs.push(makeLog({ timestamp: base + 5000 + i * 100, path: '/api/test', method: 'GET', statusCode: 200, responseTime: 500 + Math.random() * 100 }))
      }
      service.setLogSource(createMockLogSource(logs))

      const anomalies = await service.detectAnomalies()
      expect(anomalies.length).toBeGreaterThanOrEqual(1)
      const latencyAnomaly = anomalies.find(a => a.metric === 'avg_latency')
      expect(latencyAnomaly).toBeDefined()
      expect(latencyAnomaly!.detected).toBe(true)
    })

    it('应该返回无异常结果', async () => {
      const base = Date.now() - 10000
      const logs: GatewayLogEntry[] = Array.from({ length: 20 }, (_, i) =>
        makeLog({ timestamp: base + i * 500, path: '/api/test', method: 'GET', statusCode: 200, responseTime: 50 + Math.random() * 10 })
      )
      service.setLogSource(createMockLogSource(logs))

      const anomalies = await service.detectAnomalies()
      expect(anomalies.length).toBeGreaterThanOrEqual(1)
      expect(anomalies[0].detected).toBe(false)
    })

    it('应该检测错误率异常', async () => {
      const base = Date.now() - 10000
      const logs: GatewayLogEntry[] = []
      // baseline: 无错误
      for (let i = 0; i < 20; i++) {
        logs.push(makeLog({ timestamp: base + i * 100, path: '/api/test', method: 'GET', statusCode: 200, responseTime: 30 }))
      }
      // recent: 大量 500
      for (let i = 0; i < 10; i++) {
        logs.push(makeLog({ timestamp: base + 3000 + i * 100, path: '/api/test', method: 'GET', statusCode: 500, responseTime: 30 }))
      }
      service.setLogSource(createMockLogSource(logs))

      const anomalies = await service.detectAnomalies()
      expect(anomalies.length).toBeGreaterThanOrEqual(1)
      const errorAnomaly = anomalies.find(a => a.metric === 'error_rate')
      expect(errorAnomaly).toBeDefined()
      expect(errorAnomaly!.detected).toBe(true)
    })
  })
})
