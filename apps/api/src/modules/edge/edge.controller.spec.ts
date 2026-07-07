// Mock the pg dependency before any other imports
import { vi } from 'vitest'
vi.mock('pg', () => {
  const Pool = vi.fn(() => ({
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  }))
  return { Pool, default: { Pool } }
})

import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { EdgeController } from './edge.controller'
import {
  EdgeNodeService,
  EdgeInferenceService,
  EdgeModelCache,
} from './edge-ai.service'
import {
  OfflineTicketService,
  TimeSyncService,
} from './edge-computing.service'

describe('EdgeController', () => {
  let controller: EdgeController

  const mockReq = () =>
    ({
      user: {
        tenantId: 'tenant-A',
        userId: 'user-001',
        role: 'admin',
      },
    }) as any

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EdgeController],
      providers: [
        EdgeNodeService,
        OfflineTicketService,
        TimeSyncService,
        EdgeInferenceService,
        EdgeModelCache,
      ],
    }).compile()

    controller = module.get<EdgeController>(EdgeController)
  })

  describe('GET /edge/nodes', () => {
    it('应返回边缘节点列表', async () => {
      const result = await controller.listNodes(mockReq())
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result.total).toBeGreaterThan(0)
      expect(result.data[0]).toHaveProperty('deviceId')
    })
  })

  describe('GET /edge/nodes/:id', () => {
    it('应返回指定节点信息', async () => {
      const result = await controller.getNode(mockReq(), 'edge-001')
      expect(result.data.deviceId).toBe('edge-001')
    })

    it('节点不存在应抛出错误', async () => {
      await expect(controller.getNode(mockReq(), 'nonexistent')).rejects.toThrow()
    })
  })

  describe('POST /edge/nodes', () => {
    it('应注册新节点', async () => {
      const body = {
        name: 'New Edge Node',
        platform: 'linux',
        capabilities: ['face'],
        memoryMb: 2048,
      }
      const result = await controller.registerNode(mockReq(), body)
      expect(result.data).toBeDefined()
      expect(result.data.deviceId).toContain('edge-')
    })
  })

  describe('DELETE /edge/nodes/:id', () => {
    it('应删除已有节点', async () => {
      const registered = await controller.registerNode(mockReq(), {
        name: 'To Delete',
        platform: 'linux',
        capabilities: ['face'],
        memoryMb: 2048,
      })
      const result = await controller.deleteNode(mockReq(), registered.data.deviceId)
      expect(result.success).toBe(true)
    })

    it('删除不存在节点应抛出错误', async () => {
      await expect(controller.deleteNode(mockReq(), 'nonexistent')).rejects.toThrow()
    })
  })

  describe('POST /edge/tickets/issue', () => {
    it('应发放排队号码', async () => {
      const result = await controller.issueTicket(mockReq(), {
        storeId: 'store-001',
        customerId: 'customer-001',
        priority: 0,
      })
      expect(result.data).toBeDefined()
      expect(result.data.storeId).toBe('store-001')
      expect(result.data.ticketNumber).toBe(1)
      expect(result.data.status).toBe('WAITING')
    })

    it('号码应连续递增', async () => {
      const r1 = await controller.issueTicket(mockReq(), { storeId: 'store-inc' })
      const r2 = await controller.issueTicket(mockReq(), { storeId: 'store-inc' })
      expect(r2.data.ticketNumber).toBe(r1.data.ticketNumber + 1)
    })
  })

  describe('POST /edge/tickets/call-next', () => {
    it('应叫号下一个', async () => {
      await controller.issueTicket(mockReq(), { storeId: 'store-call' })
      const result = await controller.callNext(mockReq(), { storeId: 'store-call' })
      expect(result.data.calledTicket).toBeDefined()
      expect(result.data.queueAfterCall).toBe(0)
    })

    it('无排队号码叫号返回 null', async () => {
      const result = await controller.callNext(mockReq(), { storeId: 'store-empty' })
      expect(result.data.calledTicket).toBeNull()
    })
  })

  describe('POST /edge/tickets/:id/complete', () => {
    it('应完成服务', async () => {
      const issued = await controller.issueTicket(mockReq(), { storeId: 'store-complete' })
      const result = await controller.completeTicket(mockReq(), issued.data.ticketId)
      expect(result.success).toBe(true)
    })

    it('完成不存在的号码应抛出错误', async () => {
      await expect(controller.completeTicket(mockReq(), 'fake-id')).rejects.toThrow()
    })
  })

  describe('POST /edge/tickets/:id/cancel', () => {
    it('应取消号码', async () => {
      const issued = await controller.issueTicket(mockReq(), { storeId: 'store-cancel' })
      const result = await controller.cancelTicket(mockReq(), issued.data.ticketId)
      expect(result.success).toBe(true)
    })
  })

  describe('GET /edge/tickets/:id/position', () => {
    it('应返回排队位置', async () => {
      const issued = await controller.issueTicket(mockReq(), { storeId: 'store-pos' })
      const result = await controller.getQueuePosition(mockReq(), issued.data.ticketId)
      expect(result.data).toBeDefined()
      expect(result.data.position).toBe(1)
    })

    it('不存在的号码应抛出错误', async () => {
      await expect(controller.getQueuePosition(mockReq(), 'fake-ticket')).rejects.toThrow()
    })
  })

  describe('POST /edge/clock/sync', () => {
    it('应同步时钟', async () => {
      const result = await controller.syncClock(mockReq(), { clientTime: Date.now() })
      expect(result.data.synced).toBe(true)
      expect(result.data.offset).toBeDefined()
    })
  })

  describe('GET /edge/health', () => {
    it('应返回健康状态', async () => {
      const result = await controller.health(mockReq())
      expect(result.status).toBe('ok')
      expect(result.nodes).toBeGreaterThanOrEqual(0)
      expect(result.serverTime).toBeGreaterThan(0)
    })
  })
})
