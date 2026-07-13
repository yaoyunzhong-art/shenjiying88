// runbook.module.test.ts - 运维手册模块测试
import { describe, it, expect } from 'vitest'
import { RunbookModule } from './runbook.module'
import { RunbookController } from './runbook.controller'
import { RunbookService } from './runbook.service'

describe('RunbookModule', () => {
  /* ── 正例: 模块初始化 ── */
  it('应正确创建模块', () => {
    const module = new RunbookModule()
    expect(module).toBeDefined()
  })

  it('应正确导出', () => {
    const module = new RunbookModule()
    const metadata = Reflect.getMetadata('exports', RunbookModule)
    expect(metadata).toBeDefined()
    const serviceName = metadata.find((m: any) => m?.name === 'RunbookService')
    expect(serviceName).toBeDefined()
  })

  it('应注册 RunbookController', () => {
    const controllers = Reflect.getMetadata('controllers', RunbookModule) || []
    expect(controllers).toContain(RunbookController)
  })

  it('应注册 RunbookService', () => {
    const providers = Reflect.getMetadata('providers', RunbookModule) || []
    expect(providers).toContain(RunbookService)
  })

  it('应导出 RunbookService', () => {
    const exports = Reflect.getMetadata('exports', RunbookModule) || []
    expect(exports).toContain(RunbookService)
  })

  it('Controller 数量应为 1', () => {
    const controllers = Reflect.getMetadata('controllers', RunbookModule) || []
    expect(controllers).toHaveLength(1)
  })

  it('Provider 数量应为 1', () => {
    const providers = Reflect.getMetadata('providers', RunbookModule) || []
    expect(providers).toHaveLength(1)
  })

  it('Export 数量应为 1', () => {
    const exports = Reflect.getMetadata('exports', RunbookModule) || []
    expect(exports).toHaveLength(1)
  })

  it('不应导入外部模块', () => {
    const imports = Reflect.getMetadata('imports', RunbookModule) || []
    expect(imports).toHaveLength(0)
  })

  it('模块应可实例化', () => {
    const mod = new RunbookModule()
    expect(mod).toBeInstanceOf(RunbookModule)
  })

  /* ── Controller / Service 实例化 ── */
  it('RunbookController 需注入 RunbookService', () => {
    const svc = new RunbookService()
    const ctrl = new RunbookController(svc)
    expect(ctrl).toBeInstanceOf(RunbookController)
  })

  it('RunbookController 不传参应报错', () => {
    expect(() => new (RunbookController as any)()).toThrow()
  })

  it('RunbookService 可独立实例化', () => {
    const svc = new RunbookService()
    expect(svc).toBeInstanceOf(RunbookService)
  })

  /* ── Service 方法 ── */
  it('RunbookService 应暴露 findAll 方法', () => {
    const svc = new RunbookService()
    expect(typeof svc.findAll).toBe('function')
  })

  it('RunbookService 应暴露 findOne 方法', () => {
    const svc = new RunbookService()
    expect(typeof svc.findOne).toBe('function')
  })

  it('RunbookService 应暴露 create 方法', () => {
    const svc = new RunbookService()
    expect(typeof svc.create).toBe('function')
  })

  it('RunbookService 应暴露 update 方法', () => {
    const svc = new RunbookService()
    expect(typeof svc.update).toBe('function')
  })

  it('RunbookService 应暴露 delete 方法', () => {
    const svc = new RunbookService()
    expect(typeof svc.delete).toBe('function')
  })

  it('RunbookService 应暴露 search 方法', () => {
    const svc = new RunbookService()
    expect(typeof svc.search).toBe('function')
  })

  /* ── findAll 业务行为 ── */
  it('RunbookService.findAll 应返回数组', async () => {
    const svc = new RunbookService()
    const result = await svc.findAll()
    expect(Array.isArray(result)).toBe(true)
  })

  it('RunbookService.findAll 可接受 filter 参数', async () => {
    const svc = new RunbookService()
    const result = await svc.findAll({})
    expect(Array.isArray(result)).toBe(true)
  })

  it('RunbookService.findOne 空 id 应不报错', async () => {
    const svc = new RunbookService()
    const result = await svc.findOne('')
    // 返回 undefined/null 都合理
    expect(result !== undefined || result === null).toBe(true)
  })

  /* ── 反例 ── */
  it('RunbookService 传 null 查询应不崩溃', async () => {
    const svc = new RunbookService()
    await expect(svc.findAll(null as any)).resolves.not.toThrow()
  })

  it('RunbookService.create 空数据应处理', async () => {
    const svc = new RunbookService()
    await expect(svc.create({} as any)).resolves.not.toThrow()
  })

  /* ── 边界: 大量查询 ── */
  it('大量并发 findAll 应稳定', async () => {
    const svc = new RunbookService()
    const promises = Array.from({ length: 50 }, () => svc.findAll())
    await expect(Promise.all(promises)).resolves.toHaveLength(50)
  })
})
