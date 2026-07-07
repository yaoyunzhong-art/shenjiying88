/**
 * 🐜 [edge] Controller 单元测试
 *
 * 测试范围:
 * - 正常流程: 节点管理、离线排队、时间同步、AI推理、健康检查
 * - 边界条件: 空列表未找到、参数缺失
 * - 异常路径: 找不到节点/工单
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
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
  let nodeService: EdgeNodeService
  let ticketService: OfflineTicketService
  let timeSyncService: TimeSyncService
  let inferenceService: EdgeInferenceService
  let modelCache: EdgeModelCache

  const mockReq = () =>
    ({
      user: {
        tenantId: 'tenant-A',
        userId: 'user-001',
        role: 'admin',
      },
    }) as any

  // EdgeNodeService 构造函数预置了 4 台设备 + 登记时新增，动态判断
  const INITIAL_NODE_COUNT = () => {
    // 首次调用时确认
    if (nodeService) return nodeService.listDevices().length
    return 4
  }

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
    nodeService = module.get<EdgeNodeService>(EdgeNodeService)
    ticketService = module.get<OfflineTicketService>(OfflineTicketService)
    timeSyncService = module.get<TimeSyncService>(TimeSyncService)
    inferenceService = module.get<EdgeInferenceService>(EdgeInferenceService)
    modelCache = module.get<EdgeModelCache>(EdgeModelCache)
  })

  // ──────────────────────────────────────────────
  // 1. 边缘节点管理
  // ──────────────────────────────────────────────

  describe('节点管理', () => {
    it('should list nodes (initial mock devices)', async () => {
      const result = await controller.listNodes(mockReq())
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      // EdgeNodeService 构造函数注册了 2 台 mock 设备
      expect(result.total).toBeGreaterThanOrEqual(2)
    })

    it('should register a node', async () => {
      const body = { name: 'Edge-001', platform: 'linux', capabilities: ['camera', 'ai'], memoryMb: 4096 }
      const result = await controller.registerNode(mockReq(), body)
      expect(result.data).toBeDefined()
      expect(result.data.deviceId).toMatch(/^edge-/)
      expect(result.data.name).toBe('Edge-001')
      expect(result.data.status).toBe('online')
    })

    it('should list nodes with increased count after registration', async () => {
      const before = await controller.listNodes(mockReq())
      const beforeCount = before.total

      await controller.registerNode(mockReq(), { name: 'N1', platform: 'linux', capabilities: [], memoryMb: 2048 })

      const after = await controller.listNodes(mockReq())
      expect(after.total).toBe(beforeCount + 1)
    })

    it('should get a specific node by id', async () => {
      // 获取已存在的节点
      const list = await controller.listNodes(mockReq())
      if (list.data.length > 0) {
        const existingId = list.data[0].deviceId
        const result = await controller.getNode(mockReq(), existingId)
        expect(result.data).toBeDefined()
        expect(result.data.deviceId).toBe(existingId)
      }
    })

    it('should throw NotFoundException for non-existent node', async () => {
      await expect(controller.getNode(mockReq(), 'nonexistent-id')).rejects.toThrow(NotFoundException)
    })

    it('should delete a registered node', async () => {
      const reg = await controller.registerNode(mockReq(), { name: 'DelMe', platform: 'linux', capabilities: [], memoryMb: 2048 })

      const result = await controller.deleteNode(mockReq(), reg.data.deviceId)
      expect(result.success).toBe(true)
    })

    it('should throw NotFoundException deleting non-existent node', async () => {
      await expect(controller.deleteNode(mockReq(), 'no-such-id')).rejects.toThrow(NotFoundException)
    })
  })

  // ──────────────────────────────────────────────
  // 2. 离线排队
  // ──────────────────────────────────────────────

  describe('离线排队', () => {
    it('should issue a ticket', async () => {
      const result = await controller.issueTicket(mockReq(), { storeId: 'store-1', priority: 5 })
      expect(result.data).toBeDefined()
      expect(result.data.storeId).toBe('store-1')
      expect(result.data.status).toBe('WAITING')
    })

    it('should issue ticket with customerId', async () => {
      const result = await controller.issueTicket(mockReq(), { storeId: 'store-1', customerId: 'cust-abc' })
      expect(result.data.customerId).toBe('cust-abc')
    })

    it('should call next ticket', async () => {
      const t1 = await controller.issueTicket(mockReq(), { storeId: 'store-1', priority: 0 })
      await controller.issueTicket(mockReq(), { storeId: 'store-1', priority: 0 })
      const result = await controller.callNext(mockReq(), { storeId: 'store-1' })
      expect(result.data).toBeDefined()
      expect(result.data.calledTicket).toBeDefined()
      expect(result.data.calledTicket!.ticketId).toBe(t1.data.ticketId)
    })

    it('should complete a ticket', async () => {
      const t = await controller.issueTicket(mockReq(), { storeId: 'store-1' })
      await controller.callNext(mockReq(), { storeId: 'store-1' })
      const result = await controller.completeTicket(mockReq(), t.data.ticketId)
      expect(result.success).toBe(true)
    })

    it('should cancel a ticket', async () => {
      const t = await controller.issueTicket(mockReq(), { storeId: 'store-1' })
      const result = await controller.cancelTicket(mockReq(), t.data.ticketId)
      expect(result.success).toBe(true)
    })

    it('should get queue position', async () => {
      const t = await controller.issueTicket(mockReq(), { storeId: 'store-1' })
      const result = await controller.getQueuePosition(mockReq(), t.data.ticketId)
      expect(result.data).toBeDefined()
      expect(result.data.ticketId).toBe(t.data.ticketId)
    })

    it('should throw NotFoundException for non-existent ticket position', async () => {
      await expect(controller.getQueuePosition(mockReq(), 'no-ticket')).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException completing non-existent ticket', async () => {
      await expect(controller.completeTicket(mockReq(), 'no-ticket')).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException cancelling non-existent ticket', async () => {
      await expect(controller.cancelTicket(mockReq(), 'no-ticket')).rejects.toThrow(NotFoundException)
    })

    it('should sync queue to server', async () => {
      await controller.issueTicket(mockReq(), { storeId: 'store-1' })
      const result = await controller.syncQueue(mockReq(), { storeId: 'store-1' })
      expect(result.data).toBeDefined()
    })
  })

  // ──────────────────────────────────────────────
  // 3. 时间同步
  // ──────────────────────────────────────────────

  describe('时间同步', () => {
    it('should sync clock', async () => {
      const result = await controller.syncClock(mockReq(), { clientTime: Date.now() })
      expect(result.data).toBeDefined()
      expect(result.data.serverTime).toBeDefined()
    })

    it('should calibrate clock with samples', async () => {
      const now = Date.now()
      const samples = [
        { clientTime: now, serverTime: now + 10 },
        { clientTime: now + 100, serverTime: now + 115 },
      ]
      const result = await controller.calibrateClock(mockReq(), { samples })
      expect(result.data.synced).toBe(true)
      expect(typeof result.data.offset).toBe('number')
    })

    it('should check clock tolerance', async () => {
      const result = await controller.checkClockTolerance(mockReq(), { serverTime: String(Date.now()), toleranceMs: '500' } as any)
      expect(result.data).toBeDefined()
      expect(result.data.serverTime).toBeDefined()
    })
  })

  // ──────────────────────────────────────────────
  // 4. AI 推理：先注册节点再加载模型
  // ──────────────────────────────────────────────

  describe('AI推理', () => {
    it('should load a model on a registered device', async () => {
      // EdgeInferenceService 初始就有 2 台 mock 设备 (edge-001, edge-002)
      const result = await controller.loadModel(mockReq(), {
        modelId: 'yolo-v5',
        deviceId: 'edge-001',
      })
      expect(result.data).toBeDefined()
      expect(result.data.modelId).toBe('yolo-v5')
    })

    it('should run inference', async () => {
      await controller.loadModel(mockReq(), {
        modelId: 'yolo-v5',
        deviceId: 'edge-001',
      })
      const result = await controller.runInference(mockReq(), {
        modelId: 'yolo-v5',
        deviceId: 'edge-001',
        inputData: { image: 'base64...' },
      })
      expect(result.data).toBeDefined()
      expect(result.data.modelId).toBe('yolo-v5')
    })

    it('should unload a model', async () => {
      const result = await controller.unloadModel(mockReq(), {
        modelId: 'yolo-v5',
        deviceId: 'edge-001',
      })
      expect(result.success).toBe(true)
    })

    it('should cache a model', async () => {
      const result = await controller.cacheModel(mockReq(), {
        modelId: 'yolo-v5',
        version: '2.0.0',
      })
      expect(result.data).toBeDefined()
      expect(result.data.modelId).toBe('yolo-v5')
    })

    it('should list cached models', async () => {
      const result = await controller.listCachedModels(mockReq())
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should list cached models after caching', async () => {
      await controller.cacheModel(mockReq(), { modelId: 'm1', version: '1.0' })
      await controller.cacheModel(mockReq(), { modelId: 'm2', version: '1.1' })
      const result = await controller.listCachedModels(mockReq())
      expect(result.total).toBeGreaterThanOrEqual(2)
    })
  })

  // ──────────────────────────────────────────────
  // 5. 健康检查
  // ──────────────────────────────────────────────

  describe('健康检查', () => {
    it('should return health status', async () => {
      const result = await controller.health(mockReq())
      expect(result.status).toBe('ok')
      expect(result.nodes).toBeDefined()
      expect(typeof result.nodes).toBe('number')
      expect(result.serverTime).toBeDefined()
    })

    it('should reflect registered nodes count changes', async () => {
      const h1 = await controller.health(mockReq())
      const beforeNodes = h1.nodes

      await controller.registerNode(mockReq(), { name: 'Health-Node', platform: 'linux', capabilities: [], memoryMb: 1024 })
      const h2 = await controller.health(mockReq())
      expect(h2.nodes).toBe(beforeNodes + 1)
    })
  })
})
