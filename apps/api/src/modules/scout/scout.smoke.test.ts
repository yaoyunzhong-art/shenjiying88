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
  it('ScoutService 不传 prisma 应报错', () => {
    expect(() => new (ScoutService as any)()).toThrow()
  })

  it('ScoutService 传 null prisma 应报错', () => {
    expect(() => new ScoutService(null as any)).toThrow()
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

  /* ── Service 行为 ── */
  it('ScoutService 应暴露 findAll 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.findAll).toBe('function')
  })

  it('ScoutService 应暴露 findOne 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.findOne).toBe('function')
  })

  it('ScoutService 应暴露 create 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.create).toBe('function')
  })

  it('ScoutService 应暴露 update 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.update).toBe('function')
  })

  it('ScoutService 应暴露 remove 方法', () => {
    const svc = new ScoutService({} as any)
    expect(typeof svc.remove).toBe('function')
  })

  it('ScoutService 的 findAll 应返回数组', async () => {
    const svc = new ScoutService({} as any)
    const result = await svc.findAll()
    expect(Array.isArray(result)).toBe(true)
  })
})
