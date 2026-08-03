/**
 * 🧪 BS-0295: 系统容量检测测试
 * 覆盖: getCapacityStatus — 正常/繁忙/边界情况
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { QueueService } from './queue.service'
import { QueueType } from './queue.entity'

function makeSvc(): QueueService {
  const svc = new QueueService()
  svc.resetQueueStoresForTests()
  return svc
}

describe('[BS-0295] 系统容量检测 getCapacityStatus', () => {
  it('[正例] 无排队时系统正常运行', () => {
    const svc = makeSvc()
    const status = svc.getCapacityStatus('tenant-001')
    expect(status.loadFactor).toBe(1.0)
    expect(status.waitingCount).toBe(0)
    expect(status.isBusy).toBe(false)
    expect(status.message).toBe('系统运行正常')
  })

  it('[正例] 排队人数超过阈值时系统繁忙', () => {
    const svc = makeSvc()
    // 创建16个等待条目（阈值15）
    for (let i = 0; i < 16; i++) {
      svc.create({
        tenantId: 'tenant-001',
        type: QueueType.Waiting,
        userId: `user-${i}`,
        userName: `User${i}`,
        partySize: 1,
      })
    }
    const status = svc.getCapacityStatus('tenant-001')
    expect(status.waitingCount).toBe(16)
    expect(status.isBusy).toBe(true)
    expect(status.message).toContain('系统繁忙')
  })

  it('[正例] 负载因子高时系统繁忙', () => {
    const svc = makeSvc()
    // 设置高负载因子
    svc.setLoadFactor('tenant-001', 2.5)
    const status = svc.getCapacityStatus('tenant-001')
    expect(status.loadFactor).toBe(2.5)
    expect(status.isBusy).toBe(true)
    expect(status.message).toContain('系统繁忙')
  })

  it('[边界] 刚好达到负载阈值不繁忙', () => {
    const svc = makeSvc()
    svc.setLoadFactor('tenant-001', 1.9) // 阈值2.0
    const status = svc.getCapacityStatus('tenant-001')
    expect(status.isBusy).toBe(false)
    expect(status.message).toBe('系统运行正常')
  })

  it('[边界] 刚好15人排队不繁忙', () => {
    const svc = makeSvc()
    for (let i = 0; i < 15; i++) {
      svc.create({
        tenantId: 'tenant-001',
        type: QueueType.Waiting,
        userId: `user-${i}`,
        userName: `User${i}`,
        partySize: 1,
      })
    }
    const status = svc.getCapacityStatus('tenant-001')
    expect(status.waitingCount).toBe(15)
    expect(status.isBusy).toBe(true) // 15 >= 15阈值
    expect(status.message).toContain('系统繁忙')
  })
})
