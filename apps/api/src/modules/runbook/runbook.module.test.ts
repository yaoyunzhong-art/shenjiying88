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

  it('RunbookController 不传参可实例化（不报错）', () => {
    const ctrl = new (RunbookController as any)()
    expect(ctrl).toBeDefined()
  })

  it('RunbookService 可独立实例化', () => {
    const svc = new RunbookService()
    expect(svc).toBeInstanceOf(RunbookService)
  })

  /* ── Service 方法 ── */
  it('RunbookService 应暴露 list 方法', () => {
    const svc = new RunbookService()
    expect(typeof svc.list).toBe('function')
  })

  it('RunbookService 应暴露 get 方法', () => {
    const svc = new RunbookService()
    expect(typeof svc.get).toBe('function')
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

  it('RunbookService 应暴露 findByAlert 方法', () => {
    const svc = new RunbookService()
    expect(typeof svc.findByAlert).toBe('function')
  })

  it('RunbookService 应暴露 getCriticalSteps 方法', () => {
    const svc = new RunbookService()
    expect(typeof svc.getCriticalSteps).toBe('function')
  })

  /* ── list 业务行为 ── */
  it('RunbookService.list 应返回 Runbook 数组', () => {
    const svc = new RunbookService()
    const result = svc.list()
    expect(Array.isArray(result)).toBe(true)
  })

  it('RunbookService.list 可接受 filter 参数', () => {
    const svc = new RunbookService()
    const result = svc.list({})
    expect(Array.isArray(result)).toBe(true)
  })

  it('RunbookService.get 空 id 应返回 null', () => {
    const svc = new RunbookService()
    expect(svc.get('')).toBeNull()
  })

  it('RunbookService.get 不存在的 id 应返回 null', () => {
    const svc = new RunbookService()
    expect(svc.get('no-such-runbook')).toBeNull()
  })

  it('RunbookService.create 应成功创建并返回', () => {
    const svc = new RunbookService()
    const rb = svc.create({
      title: '测试手册',
      category: 'System' as any,
      severity: 'High' as any,
      applicableVersions: ['1.0'],
      prerequisites: [],
      steps: [],
      estimatedTotalMinutes: 10,
      status: 'draft' as any,
      tags: [],
    })
    expect(rb).toBeDefined()
    expect(rb.id).toBeTruthy()
    expect(rb.title).toBe('测试手册')
  })

  it('RunbookService.update 应修改字段', () => {
    const svc = new RunbookService()
    const rb = svc.create({ title: '旧标题', category: 'System' as any, severity: 'High' as any, applicableVersions: [], prerequisites: [], steps: [], estimatedTotalMinutes: 5, status: 'draft' as any, tags: [] })
    const updated = svc.update(rb.id, { title: '新标题' })
    expect(updated.title).toBe('新标题')
  })

  it('RunbookService.delete 应移除手册', () => {
    const svc = new RunbookService()
    const rb = svc.create({ title: '删我', category: 'System' as any, severity: 'High' as any, applicableVersions: [], prerequisites: [], steps: [], estimatedTotalMinutes: 5, status: 'draft' as any, tags: [] })
    svc.delete(rb.id)
    expect(svc.get(rb.id)).toBeNull()
  })

  it('RunbookService.search 应返回匹配结果', () => {
    const svc = new RunbookService()
    const result = svc.search('')
    expect(Array.isArray(result)).toBe(true)
  })

  /* ── 反例 / 边界 ── */
  it('RunbookService.list 传 null 应不崩溃', () => {
    const svc = new RunbookService()
    expect(() => svc.list(null as any)).not.toThrow()
  })

  it('create 空数据应可处理', () => {
    const svc = new RunbookService()
    const rb = svc.create({} as any)
    expect(rb).toBeDefined()
  })

  it('getCriticalSteps 不存在的手册应抛异常', () => {
    const svc = new RunbookService()
    expect(() => svc.getCriticalSteps('no-such-id')).toThrow('Runbook not found')
  })

  it('多次 list 应稳定', () => {
    const svc = new RunbookService()
    for (let i = 0; i < 50; i++) {
      expect(Array.isArray(svc.list())).toBe(true)
    }
  })
})
