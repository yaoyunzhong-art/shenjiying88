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

  it('PerfMonitorController 不带参数应报错', () => {
    expect(() => new (PerfMonitorController as any)()).toThrow()
  })

  /* ── Service 实例化 ── */
  it('PerfMonitorService 应可独立实例化', () => {
    const svc = new PerfMonitorService()
    expect(svc).toBeInstanceOf(PerfMonitorService)
  })

  it('PerfMonitorService 应定义 recordMetric 方法', () => {
    const svc = new PerfMonitorService()
    expect(typeof svc.recordMetric).toBe('function')
  })

  it('PerfMonitorService 应定义 getMetrics 方法', () => {
    const svc = new PerfMonitorService()
    expect(typeof svc.getMetrics).toBe('function')
  })

  it('PerfMonitorService 应定义 getStats 方法', () => {
    const svc = new PerfMonitorService()
    expect(typeof svc.getStats).toBe('function')
  })

  it('PerfMonitorService 的 recordMetric 应为异步函数', async () => {
    const svc = new PerfMonitorService()
    const result = await svc.recordMetric('latency', 42)
    expect(result).toBeDefined()
  })

  it('PerfMonitorService 的 getMetrics 应返回数组', async () => {
    const svc = new PerfMonitorService()
    const result = await svc.getMetrics({})
    expect(Array.isArray(result)).toBe(true)
  })

  it('PerfMonitorService 的 getStats 应返回统计值', async () => {
    const svc = new PerfMonitorService()
    const result = await svc.getStats({})
    expect(result).toBeDefined()
  })

  /* ── 反例: 无效输入 ── */
  it('recordMetric 空名称应不报错', async () => {
    const svc = new PerfMonitorService()
    await expect(svc.recordMetric('', 0)).resolves.toBeDefined()
  })

  it('recordMetric 负数值应接受', async () => {
    const svc = new PerfMonitorService()
    await expect(svc.recordMetric('latency', -1)).resolves.toBeDefined()
  })

  it('getMetrics 传 null 应返回数组', async () => {
    const svc = new PerfMonitorService()
    await expect(svc.getMetrics(null as any)).resolves.toEqual([])
  })

  it('getStats 传 undefined 应返回默认值', async () => {
    const svc = new PerfMonitorService()
    const result = await svc.getStats(undefined as any)
    expect(result).toBeDefined()
  })

  /* ── 边界: 并发记录 ── */
  it('大量并发 recordMetric 应稳定', async () => {
    const svc = new PerfMonitorService()
    const promises = Array.from({ length: 100 }, (_, i) =>
      svc.recordMetric('latency', i)
    )
    await expect(Promise.all(promises)).resolves.toHaveLength(100)
  })
})
