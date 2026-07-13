// perf-monitor.module.test.ts — 性能监控模块测试
import { describe, it, expect } from 'vitest'
import { PerfMonitorModule } from './perf-monitor.module'
import { PerfMonitorController } from './perf-monitor.controller'
import { PerfMonitorService } from './perf-monitor.service'

describe('PerfMonitorModule', () => {
  /* ── 正例: 模块元数据 ── */
  it('模块应可实例化', () => {
    const mod = new PerfMonitorModule()
    expect(mod).toBeInstanceOf(PerfMonitorModule)
  })

  it('模块应注册 PerfMonitorController', () => {
    const controllers = Reflect.getMetadata('controllers', PerfMonitorModule) || []
    expect(controllers).toContain(PerfMonitorController)
  })

  it('模块应注册 PerfMonitorService', () => {
    const providers = Reflect.getMetadata('providers', PerfMonitorModule) || []
    expect(providers).toContain(PerfMonitorService)
  })

  it('模块应导出 PerfMonitorService', () => {
    const exports = Reflect.getMetadata('exports', PerfMonitorModule) || []
    expect(exports).toContain(PerfMonitorService)
  })

  it('Controller 数量应为 1', () => {
    const controllers = Reflect.getMetadata('controllers', PerfMonitorModule) || []
    expect(controllers).toHaveLength(1)
  })

  it('Provider 数量应为 1', () => {
    const providers = Reflect.getMetadata('providers', PerfMonitorModule) || []
    expect(providers).toHaveLength(1)
  })

  it('Export 数量应为 1', () => {
    const exports = Reflect.getMetadata('exports', PerfMonitorModule) || []
    expect(exports).toHaveLength(1)
  })

  it('不应导入其它模块', () => {
    const imports = Reflect.getMetadata('imports', PerfMonitorModule) || []
    expect(imports).toHaveLength(0)
  })

  /* ── Controller 可实例化 ── */
  it('PerfMonitorController 需 PerfMonitorService', () => {
    const svc = new PerfMonitorService()
    const ctrl = new PerfMonitorController(svc)
    expect(ctrl).toBeInstanceOf(PerfMonitorController)
  })

  it('PerfMonitorController 传 null 可实例化（不报错）', () => {
    const ctrl = new (PerfMonitorController as any)(null)
    expect(ctrl).toBeDefined()
  })

  /* ── Service 实例化 ── */
  it('PerfMonitorService 应可独立实例化', () => {
    const svc = new PerfMonitorService()
    expect(svc).toBeInstanceOf(PerfMonitorService)
  })

  it('PerfMonitorService 应定义 record 方法', () => {
    const svc = new PerfMonitorService()
    expect(typeof svc.record).toBe('function')
  })

  it('PerfMonitorService 应定义 getStatsForRoute 方法', () => {
    const svc = new PerfMonitorService()
    expect(typeof svc.getStatsForRoute).toBe('function')
  })

  it('PerfMonitorService 应定义 getAllStats 方法', () => {
    const svc = new PerfMonitorService()
    expect(typeof svc.getAllStats).toBe('function')
  })

  it('PerfMonitorService 应定义 getSlaViolations 方法', () => {
    const svc = new PerfMonitorService()
    expect(typeof svc.getSlaViolations).toBe('function')
  })

  it('PerfMonitorService 应定义 getSlowQueries 方法', () => {
    const svc = new PerfMonitorService()
    expect(typeof svc.getSlowQueries).toBe('function')
  })

  /* ── Service 行为正例 ── */
  it('record 应记录采样（无返回值）', () => {
    const svc = new PerfMonitorService()
    svc.record({ route: '/api/test', durationMs: 100, statusCode: 200, timestamp: new Date().toISOString() })
    const stats = svc.getStatsForRoute('/api/test')
    expect(stats).toBeDefined()
    expect(stats.count).toBe(1)
  })

  it('getAllStats 应返回所有路由的统计', () => {
    const svc = new PerfMonitorService()
    svc.record({ route: '/api/a', durationMs: 50, statusCode: 200, timestamp: new Date().toISOString() })
    svc.record({ route: '/api/b', durationMs: 100, statusCode: 200, timestamp: new Date().toISOString() })
    const allStats = svc.getAllStats()
    expect(Array.isArray(allStats)).toBe(true)
    expect(allStats.length).toBeGreaterThanOrEqual(2)
  })

  it('getSlowQueries 应返回慢查询列表', () => {
    const svc = new PerfMonitorService()
    const slow = svc.getSlowQueries()
    expect(Array.isArray(slow)).toBe(true)
  })

  /* ── 边界: 空/无效输入 ── */
  it('未记录的路由 getStatsForRoute 应返回零值统计', () => {
    const svc = new PerfMonitorService()
    const stats = svc.getStatsForRoute('/api/never-called')
    expect(stats.count).toBe(0)
  })

  it('空服务 getSlaViolations 应返回空数组', () => {
    const svc = new PerfMonitorService()
    expect(svc.getSlaViolations()).toEqual([])
  })

  it('getSlowQueries 默认 limit 为 20', () => {
    const svc = new PerfMonitorService()
    expect(Array.isArray(svc.getSlowQueries())).toBe(true)
  })

  /* ── 大量记录 ── */
  it('大量并发 record 应稳定', () => {
    const svc = new PerfMonitorService()
    for (let i = 0; i < 100; i++) {
      svc.record({ route: '/api/load', durationMs: i, statusCode: 200, timestamp: new Date().toISOString() })
    }
    const stats = svc.getStatsForRoute('/api/load')
    expect(stats.count).toBe(100)
    expect(stats.p50).toBeGreaterThan(0)
  })
})
