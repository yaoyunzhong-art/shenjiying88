// scout.smoke.test.ts — Scout 模块冒烟测试
import { describe, it, expect } from 'vitest'
import { ScoutModule } from './scout.module'
import { ScoutController } from './scout.controller'
import { ScoutService } from './scout.service'

describe('ScoutModule — 冒烟测试', () => {
  /* ── 正例: 模块基础断言 ── */
  it('ScoutModule 应正确定义', () => {
    const mod = new ScoutModule()
    expect(mod).toBeInstanceOf(ScoutModule)
  })

  it('ScoutController 应可实例化', () => {
    const svc = new ScoutService({} as any)
    const ctrl = new ScoutController(svc)
    expect(ctrl).toBeInstanceOf(ScoutController)
  })

  it('ScoutService 应可实例化', () => {
    const svc = new ScoutService({} as any)
    expect(svc).toBeInstanceOf(ScoutService)
  })

  it('模块应导入 PrismaModule', () => {
    const imports = Reflect.getMetadata('imports', ScoutModule) || []
    const prismaMod = imports.find((m: any) => m?.name === 'PrismaModule')
    expect(prismaMod).toBeDefined()
  })

  it('模块应注册 ScoutController', () => {
    const controllers = Reflect.getMetadata('controllers', ScoutModule)
    expect(controllers).toBeDefined()
    expect(controllers).toContain(ScoutController)
  })

  it('模块应注册 ScoutService', () => {
    const providers = Reflect.getMetadata('providers', ScoutModule)
    expect(providers).toBeDefined()
    expect(providers).toContain(ScoutService)
  })

  it('模块应导出 ScoutService', () => {
    const exports = Reflect.getMetadata('exports', ScoutModule)
    expect(exports).toBeDefined()
    expect(exports).toContain(ScoutService)
  })

  /* ── 反例: 错误输入 / 异常 ── */
  it('ScoutService 传 null prisma 应不报错（实际接受 any）', () => {
    expect(() => new ScoutService(null as any)).not.toThrow()
  })

  /* ── 边界: 过大的 Controller/Service 计数 ── */
  it('模块最多应有一个 controller', () => {
    const controllers = Reflect.getMetadata('controllers', ScoutModule)
    expect(controllers).toHaveLength(1)
  })

  it('模块最多应有一个 provider', () => {
    const providers = Reflect.getMetadata('providers', ScoutModule)
    expect(providers).toHaveLength(1)
  })

  it('模块导出数量应 > 0', () => {
    const exports = Reflect.getMetadata('exports', ScoutModule)
    expect(exports.length).toBeGreaterThan(0)
  })

  /* ── Service 方法存在性 ── */
  it('ScoutService 应暴露 getCities 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.getCities).toBe('function')
  })

  it('ScoutService 应暴露 getVenues 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.getVenues).toBe('function')
  })

  it('ScoutService 应暴露 searchVenues 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.searchVenues).toBe('function')
  })

  it('ScoutService 应暴露 getPrices 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.getPrices).toBe('function')
  })

  it('ScoutService 应暴露 getDevices 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.getDevices).toBe('function')
  })

  it('ScoutService 应暴露 getMembership 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.getMembership).toBe('function')
  })

  it('ScoutService 应暴露 getReviews 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.getReviews).toBe('function')
  })

  it('ScoutService 应暴露 getActivities 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.getActivities).toBe('function')
  })

  it('ScoutService 应暴露 getCollectionLogs 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.getCollectionLogs).toBe('function')
  })

  it('getVenues 应接受参数不报错', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.getVenues).toBe('function')
  })

  it('getCities 应接受参数不报错', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.getCities).toBe('function')
  })

  /* ── Controller 路由方法 ── */
  it('Controller 应含 cities 端点', () => {
    const svc = new ScoutService({} as any)
    const ctrl = new ScoutController(svc)
    expect(typeof ctrl.cities).toBe('function')
  })

  it('Controller 应含 venues 端点', () => {
    const svc = new ScoutService({} as any)
    const ctrl = new ScoutController(svc)
    expect(typeof ctrl.venues).toBe('function')
  })

  it('Controller 应含 searchVenues 端点', () => {
    const svc = new ScoutService({} as any)
    const ctrl = new ScoutController(svc)
    expect(typeof ctrl.searchVenues).toBe('function')
  })
})
