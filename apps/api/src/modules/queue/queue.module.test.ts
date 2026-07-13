// queue.module.test.ts — 排队模块测试
import { describe, it, expect } from 'vitest'
import { QueueController } from './queue.controller'
import { QueueModule } from './queue.module'
import { QueueService } from './queue.service'

describe('QueueModule', () => {
  /* ── 正例: 模块元数据 ── */
  it('QueueModule 应正确导出', () => {
    const controllers = Reflect.getMetadata('controllers', QueueModule) as unknown[] | undefined
    const providers = Reflect.getMetadata('providers', QueueModule) as unknown[] | undefined
    const exportsList = Reflect.getMetadata('exports', QueueModule) as unknown[] | undefined

    expect(controllers).toBeDefined()
    expect(controllers).toContain(QueueController)
    expect(providers).toBeDefined()
    expect(providers).toContain(QueueService)
    expect(exportsList).toBeDefined()
    expect(exportsList).toContain(QueueService)
  })

  it('Controller 数量应为 1', () => {
    const controllers = Reflect.getMetadata('controllers', QueueModule) || []
    expect(controllers).toHaveLength(1)
  })

  it('Provider 数量应为 1', () => {
    const providers = Reflect.getMetadata('providers', QueueModule) || []
    expect(providers).toHaveLength(1)
  })

  it('Export 数量应为 1', () => {
    const exports = Reflect.getMetadata('exports', QueueModule) || []
    expect(exports).toHaveLength(1)
  })

  it('不应导入外部模块', () => {
    const imports = Reflect.getMetadata('imports', QueueModule) || []
    expect(imports).toHaveLength(0)
  })

  /* ── Controller 实例化 ── */
  it('QueueController 需注入 QueueService', () => {
    const svc = new QueueService()
    const ctrl = new QueueController(svc)
    expect(ctrl).toBeInstanceOf(QueueController)
  })

  it('QueueController 传 null 应报错', () => {
    expect(() => new QueueController(null as any)).toThrow()
  })

  /* ── QueueService 正例 ── */
  it('QueueService 应可独立实例化', () => {
    const svc = new QueueService()
    expect(svc).toBeInstanceOf(QueueService)
  })

  it('QueueService.joinQueue 应生成排队号', () => {
    const svc = new QueueService()
    const entry = svc.joinQueue({
      tenantId: 't1',
      queueType: 'Waiting' as any,
      memberId: 'm1',
      memberName: 'Alice',
      resourceId: 'r1',
      resourceName: '窗口1',
    })
    expect(entry).toBeDefined()
    expect(entry.queueNumber).toMatch(/^[A-Z]\d{3}$/)
    expect(entry.status).toBe('Waiting')
  })

  it('QueueService.joinQueue 应递增编号', () => {
    const svc = new QueueService()
    svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm1' })
    const e2 = svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm2' })
    expect(e2.queueNumber).toBe('B002')
  })

  it('QueueService.getMyPosition 应返回正位置', () => {
    const svc = new QueueService()
    svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm1', resourceId: 'r1' })
    svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm2', resourceId: 'r1' })
    const pos = svc.getMyPosition('m1', 'r1', 't1')
    expect(pos.position).toBe(1)
    expect(pos.estimatedWaitMinutes).toBeGreaterThan(0)
  })

  it('QueueService.leaveQueue 应标记为 Cancelled', () => {
    const svc = new QueueService()
    const entry = svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm1', resourceId: 'r1' })
    const cancelled = svc.leaveQueue(entry.id, 't1')
    expect(cancelled.status).toBe('Cancelled')
  })

  it('QueueService.callNext 应返回下一个等待者', () => {
    const svc = new QueueService()
    svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm1', resourceId: 'r1' })
    const next = svc.callNext('r1', 't1')
    expect(next).not.toBeNull()
    expect(next!.status).toBe('Called')
  })

  it('QueueService.startService 应转 serving', () => {
    const svc = new QueueService()
    const entry = svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm1', resourceId: 'r1' })
    const next = svc.callNext('r1', 't1')!
    const serving = svc.startService(next.id, 't1')
    expect(serving.status).toBe('Serving')
  })

  it('QueueService.startService 应先 callNext', () => {
    const svc = new QueueService()
    const entry = svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm1', resourceId: 'r1' })
    expect(() => svc.startService(entry.id, 't1')).toThrow('Invalid queue status transition')
  })

  it('QueueService.completeService 应转 Completed', () => {
    const svc = new QueueService()
    svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm1', resourceId: 'r1' })
    const next = svc.callNext('r1', 't1')!
    const serving = svc.startService(next.id, 't1')
    const done = svc.completeService(serving.id, 't1')
    expect(done.status).toBe('Completed')
  })

  it('QueueService.markNoShow 应转 NoShow', () => {
    const svc = new QueueService()
    svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm1', resourceId: 'r1' })
    const next = svc.callNext('r1', 't1')!
    const noshow = svc.markNoShow(next.id, 't1')
    expect(noshow.status).toBe('NoShow')
  })

  it('QueueService.getQueueStatus 应返回正确统计', () => {
    const svc = new QueueService()
    svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm1', resourceId: 'r1' })
    svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'm2', resourceId: 'r1' })
    const stats = svc.getQueueStatus('r1', 't1')
    expect(stats.total).toBe(2)
    expect(stats.waitingCount).toBe(2)
  })

  /* ── 边界: 空队列 ── */
  it('空队列 callNext 应返回 null', () => {
    const svc = new QueueService()
    expect(svc.callNext('r1', 't1')).toBeNull()
  })

  it('空队列 getMyPosition 应返回 -1', () => {
    const svc = new QueueService()
    const pos = svc.getMyPosition('m-no', 'r1', 't1')
    expect(pos.position).toBe(-1)
    expect(pos.entry).toBeNull()
  })

  it('空队列 getQueueStatus 应返回 0', () => {
    const svc = new QueueService()
    const stats = svc.getQueueStatus('r-empty', 't1')
    expect(stats.total).toBe(0)
    expect(stats.waitingCount).toBe(0)
  })

  /* ── 反例: 无效操作 ── */
  it('leaveQueue 不存在的 ID 应报错', () => {
    const svc = new QueueService()
    expect(() => svc.leaveQueue('no-such-id', 't1')).toThrow('Queue entry not found')
  })

  it('startService 不存在的 ID 应报错', () => {
    const svc = new QueueService()
    expect(() => svc.startService('no-such', 't1')).toThrow()
  })

  it('completeService 不存在的 ID 应报错', () => {
    const svc = new QueueService()
    expect(() => svc.completeService('no-such', 't1')).toThrow()
  })

  /* ── 多租户隔离 ── */
  it('租户 A 的排队不影响租户 B', () => {
    const svc = new QueueService()
    svc.joinQueue({ tenantId: 't1', queueType: 'Waiting' as any, memberId: 'mA', resourceId: 'rx' })
    svc.joinQueue({ tenantId: 't2', queueType: 'Waiting' as any, memberId: 'mB', resourceId: 'rx' })
    const next = svc.callNext('rx', 't1')
    expect(next).not.toBeNull()
    expect(next!.userId).toBe('mA')
  })
})
