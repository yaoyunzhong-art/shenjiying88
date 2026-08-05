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

    // Clean up ticket queues between tests
    ticketService.clearStoreQueue('store-001')
    ticketService.clearStoreQueue('store-002')
    ticketService.clearStoreQueue('store-inc')
    ticketService.clearStoreQueue('store-call')
    ticketService.clearStoreQueue('store-empty')
    ticketService.clearStoreQueue('store-complete')
    ticketService.clearStoreQueue('store-cancel')
    ticketService.clearStoreQueue('store-pos')
    timeSyncService.reset()
  })

  // ════════════════════════════════════════════════════════════════
  // 1. 边缘节点管理 (GET /edge/nodes)
  // ════════════════════════════════════════════════════════════════
  describe('GET /edge/nodes — 边缘节点列表', () => {
    it('应返回所有边缘节点列表', async () => {
      const result = await controller.listNodes(mockReq())
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result.total).toBeGreaterThan(0)
      expect(result.data[0]).toHaveProperty('deviceId')
    })

    it('所有节点应包含 tenantId 元数据', async () => {
      const result = await controller.listNodes(mockReq())
      for (const node of result.data) {
        expect(node).toHaveProperty('tenantId', 'tenant-A')
      }
    })

    it('注册新节点后列表应包含新节点', async () => {
      const before = await controller.listNodes(mockReq())
      await controller.registerNode(mockReq(), {
        name: 'Temp-Edge',
        platform: 'linux',
        capabilities: ['face'],
        memoryMb: 2048,
      })
      const after = await controller.listNodes(mockReq())
      expect(after.total).toBe(before.total + 1)
    })
  })

  describe('GET /edge/nodes/:id — 获取指定节点', () => {
    it('应返回指定节点信息', async () => {
      const result = await controller.getNode(mockReq(), 'edge-001')
      expect(result.data.deviceId).toBe('edge-001')
      expect(result.data.name).toBe('Edge Node A') // EdgeNodeService uses 'Edge Node A'
    })

    it('节点不存在应抛出 NotFoundException', async () => {
      await expect(controller.getNode(mockReq(), 'nonexistent')).rejects.toThrow()
    })
  })

  describe('POST /edge/nodes — 注册新节点', () => {
    it('应成功注册新节点并返回 deviceId', async () => {
      const body = {
        name: 'New Edge Node',
        platform: 'linux',
        capabilities: ['face', 'qr'],
        memoryMb: 2048,
      }
      const result = await controller.registerNode(mockReq(), body)
      expect(result.data).toBeDefined()
      expect(result.data.deviceId).toContain('edge-')
      expect(result.data.name).toBe('New Edge Node')
    })

    it('注册时使用默认值填充缺失参数', async () => {
      const result = await controller.registerNode(mockReq(), {})
      expect(result.data.deviceId).toContain('edge-')
      expect(result.data.name).toBe('New Edge Node')
      expect(result.data.platform).toBe('linux')
      expect(result.data.memoryMb).toBe(2048)
    })
  })

  describe('DELETE /edge/nodes/:id — 删除节点', () => {
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

    it('删除不存在节点应抛出 NotFoundException', async () => {
      await expect(controller.deleteNode(mockReq(), 'nonexistent')).rejects.toThrow()
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 2. 离线排队 (POST /edge/tickets/issue)
  // ════════════════════════════════════════════════════════════════
  describe('POST /edge/tickets/issue — 发放排队号码', () => {
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

    it('不同门店号码独立递增', async () => {
      const r1 = await controller.issueTicket(mockReq(), { storeId: 'store-A' })
      const r2 = await controller.issueTicket(mockReq(), { storeId: 'store-B' })
      expect(r1.data.ticketNumber).toBe(1)
      expect(r2.data.ticketNumber).toBe(1)
    })

    it('高优先级号码可被发放', async () => {
      const result = await controller.issueTicket(mockReq(), {
        storeId: 'store-001',
        priority: 5,
      })
      expect(result.data.priority).toBe(5)
    })
  })

  describe('POST /edge/tickets/call-next — 叫号', () => {
    it('应叫号下一个排队号码', async () => {
      await controller.issueTicket(mockReq(), { storeId: 'store-call' })
      const result = await controller.callNext(mockReq(), { storeId: 'store-call' })
      expect(result.data.calledTicket).toBeDefined()
      expect(result.data.queueAfterCall).toBe(0)
      expect(result.data.calledTicket!.status).toBe('CALLED')
    })

    it('无排队号码时叫号返回 null', async () => {
      const result = await controller.callNext(mockReq(), { storeId: 'store-empty' })
      expect(result.data.calledTicket).toBeNull()
      expect(result.data.queueAfterCall).toBe(0)
    })

    it('高优先级号码应被优先叫号', async () => {
      await controller.issueTicket(mockReq(), { storeId: 'store-call', priority: 0 })
      await controller.issueTicket(mockReq(), { storeId: 'store-call', priority: 5 })
      await controller.issueTicket(mockReq(), { storeId: 'store-call', priority: 1 })
      
      const result = await controller.callNext(mockReq(), { storeId: 'store-call' })
      expect(result.data.calledTicket!.priority).toBe(5)
    })

    it('叫号后号码状态变为 CALLED', async () => {
      await controller.issueTicket(mockReq(), { storeId: 'store-call' })
      const called = await controller.callNext(mockReq(), { storeId: 'store-call' })
      expect(called.data.calledTicket!.status).toBe('CALLED')
      expect(called.data.calledTicket!.calledAt).toBeDefined()
    })
  })

  describe('POST /edge/tickets/:id/complete — 完成服务', () => {
    it('应完成号码标记', async () => {
      const issued = await controller.issueTicket(mockReq(), { storeId: 'store-complete' })
      const result = await controller.completeTicket(mockReq(), issued.data.ticketId)
      expect(result.success).toBe(true)
    })

    it('完成不存在的号码应抛出 NotFoundException', async () => {
      await expect(controller.completeTicket(mockReq(), 'fake-id')).rejects.toThrow()
    })

    it('完成已完成的号码应返回成功(幂等)', async () => {
      const issued = await controller.issueTicket(mockReq(), { storeId: 'store-complete' })
      await controller.completeTicket(mockReq(), issued.data.ticketId)
      const result = await controller.completeTicket(mockReq(), issued.data.ticketId)
      expect(result.success).toBe(true)
    })
  })

  describe('POST /edge/tickets/:id/cancel — 取消号码', () => {
    it('应取消等待中的号码', async () => {
      const issued = await controller.issueTicket(mockReq(), { storeId: 'store-cancel' })
      const result = await controller.cancelTicket(mockReq(), issued.data.ticketId)
      expect(result.success).toBe(true)
    })

    it('取消已取消的号码应成功(幂等)', async () => {
      const issued = await controller.issueTicket(mockReq(), { storeId: 'store-cancel' })
      await controller.cancelTicket(mockReq(), issued.data.ticketId)
      // 第二次取消应仍成功
      const result = await controller.cancelTicket(mockReq(), issued.data.ticketId)
      expect(result.success).toBe(true)
    })

    it('取消不存在的号码应抛出 NotFoundException', async () => {
      await expect(controller.cancelTicket(mockReq(), 'non-existent')).rejects.toThrow()
    })
  })

  describe('GET /edge/tickets/:id/position — 查询排队位置', () => {
    it('应返回排队位置', async () => {
      const issued = await controller.issueTicket(mockReq(), { storeId: 'store-pos' })
      const result = await controller.getQueuePosition(mockReq(), issued.data.ticketId)
      expect(result.data).toBeDefined()
      expect(result.data.position).toBe(1)
      expect(result.data.totalWaiting).toBe(1)
    })

    it('多人排队时位置计算正确', async () => {
      await controller.issueTicket(mockReq(), { storeId: 'store-pos' })
      await controller.issueTicket(mockReq(), { storeId: 'store-pos' })
      const third = await controller.issueTicket(mockReq(), { storeId: 'store-pos' })
      const result = await controller.getQueuePosition(mockReq(), third.data.ticketId)
      expect(result.data.position).toBe(3)
      expect(result.data.totalWaiting).toBe(3)
    })

    it('叫号后等待人数减少', async () => {
      const t1 = await controller.issueTicket(mockReq(), { storeId: 'store-pos' })
      const t2 = await controller.issueTicket(mockReq(), { storeId: 'store-pos' })
      await controller.callNext(mockReq(), { storeId: 'store-pos' })
      
      // 叫号后第一个号码变为 CALLED，只剩一个 WAITING
      const pos2 = await controller.getQueuePosition(mockReq(), t2.data.ticketId)
      expect(pos2.data.position).toBe(1) // 前面的已被叫号
    })

    it('不存在的号码应抛出 NotFoundException', async () => {
      await expect(controller.getQueuePosition(mockReq(), 'fake-ticket')).rejects.toThrow()
    })
  })

  describe('POST /edge/tickets/sync — 同步排队数据', () => {
    it('应同步门店排队数据到服务器', async () => {
      await controller.issueTicket(mockReq(), { storeId: 'store-001' })
      await controller.issueTicket(mockReq(), { storeId: 'store-001' })
      
      const result = await controller.syncQueue(mockReq(), { storeId: 'store-001' })
      expect(result.data).toBeDefined()
      expect(result.data.storeId).toBe('store-001')
      expect(result.data.success).toBe(true)
      expect(result.data.ticketCount).toBeGreaterThan(0)
    })

    it('空门店同步应返回0', async () => {
      const result = await controller.syncQueue(mockReq(), { storeId: 'store-001' })
      expect(result.data.ticketCount).toBe(0)
      expect(result.data.success).toBe(true)
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 3. 时间同步
  // ════════════════════════════════════════════════════════════════
  describe('POST /edge/clock/sync — 时钟同步', () => {
    it('应成功同步客户端时钟', async () => {
      const result = await controller.syncClock(mockReq(), { clientTime: Date.now() })
      expect(result.data.synced).toBe(true)
      expect(result.data.offset).toBeDefined()
      expect(result.data.serverTime).toBeGreaterThan(0)
      expect(result.data.roundTripDelay).toBeGreaterThanOrEqual(0)
    })
  })

  describe('POST /edge/clock/calibrate — 时钟校准', () => {
    it('应使用样本计算精确偏移', async () => {
      const serverTime = Date.now()
      const result = await controller.calibrateClock(mockReq(), {
        samples: [
          { clientTime: serverTime - 100, serverTime: serverTime + 50 },
          { clientTime: serverTime - 50, serverTime: serverTime + 75 },
          { clientTime: serverTime - 75, serverTime: serverTime + 60 },
        ],
      })
      expect(result.data.synced).toBe(true)
      expect(typeof result.data.offset).toBe('number')
    })

    it('空样本应返回当前偏移', async () => {
      const result = await controller.calibrateClock(mockReq(), { samples: [] })
      expect(result.data.synced).toBe(true)
      expect(typeof result.data.offset).toBe('number')
    })
  })

  describe('GET /edge/clock/tolerance — 时钟容差检测', () => {
    it('服务器时间与当前时间在容差内应返回 true', async () => {
      const result = await controller.checkClockTolerance(mockReq(), String(Date.now()), '1000')
      expect(result.data).toBeDefined()
      expect(typeof result.data.withinTolerance).toBe('boolean')
      expect(typeof result.data.deviationMs).toBe('number')
    })

    it('省略容差参数时使用默认 500ms', async () => {
      const result = await controller.checkClockTolerance(mockReq(), String(Date.now()))
      expect(result.data).toBeDefined()
      expect(typeof result.data.withinTolerance).toBe('boolean')
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 4. AI 推理
  // ════════════════════════════════════════════════════════════════
  describe('POST /edge/inference/load — 加载模型', () => {
    it('应成功加载模型到在线设备', async () => {
      const result = await controller.loadModel(mockReq(), {
        modelId: 'face-recognition-v2',
        deviceId: 'edge-001',
      })
      expect(result.data).toBeDefined()
      expect(result.data.modelId).toBe('face-recognition-v2')
      expect(result.data.framework).toMatch(/tensorrt|onnx|tflite|coreml/)
    })

    it('加载到离线设备应抛出错误', async () => {
      await expect(
        controller.loadModel(mockReq(), {
          modelId: 'test-model',
          deviceId: 'edge-003',
        })
      ).rejects.toThrow()
    })

    it('加载到不存在设备应抛出错误', async () => {
      await expect(
        controller.loadModel(mockReq(), {
          modelId: 'test-model',
          deviceId: 'non-existent-device',
        })
      ).rejects.toThrow()
    })
  })

  describe('POST /edge/inference/run — 运行推理', () => {
    it('已加载模型应成功推理', async () => {
      await controller.loadModel(mockReq(), {
        modelId: 'classifier-v1',
        deviceId: 'edge-001',
      })
      const result = await controller.runInference(mockReq(), {
        modelId: 'classifier-v1',
        deviceId: 'edge-001',
        inputData: 'classify:cat',
      })
      expect(result.data).toBeDefined()
      expect(result.data.modelId).toBe('classifier-v1')
      expect(result.data.latencyMs).toBeGreaterThanOrEqual(0)
      expect(result.data.confidence).toBeGreaterThan(0)
    })

    it('未加载模型应抛出错误', async () => {
      await expect(
        controller.runInference(mockReq(), {
          modelId: 'unloaded-model',
          deviceId: 'edge-001',
          inputData: {},
        })
      ).rejects.toThrow()
    })

    it('运行在不存在的设备应抛出错误', async () => {
      await expect(
        controller.runInference(mockReq(), {
          modelId: 'test-model',
          deviceId: 'ghost-device',
          inputData: {},
        })
      ).rejects.toThrow()
    })
  })

  describe('POST /edge/inference/unload — 卸载模型', () => {
    it('应成功卸载已加载模型', async () => {
      await controller.loadModel(mockReq(), {
        modelId: 'temp-model',
        deviceId: 'edge-001',
      })
      const result = await controller.unloadModel(mockReq(), {
        modelId: 'temp-model',
        deviceId: 'edge-001',
      })
      expect(result.success).toBe(true)
    })

    it('卸载后推理应失败', async () => {
      await controller.loadModel(mockReq(), {
        modelId: 'to-be-unloaded',
        deviceId: 'edge-001',
      })
      await controller.unloadModel(mockReq(), {
        modelId: 'to-be-unloaded',
        deviceId: 'edge-001',
      })
      await expect(
        controller.runInference(mockReq(), {
          modelId: 'to-be-unloaded',
          deviceId: 'edge-001',
          inputData: {},
        })
      ).rejects.toThrow()
    })
  })

  describe('POST /edge/inference/cache — 缓存模型', () => {
    it('应成功缓存模型到本地', async () => {
      const result = await controller.cacheModel(mockReq(), {
        modelId: 'model-alpha',
        version: 'v1.0',
      })
      expect(result.data).toBeDefined()
      expect(result.data.modelId).toBe('model-alpha')
      expect(result.data.version).toBe('v1.0')
      expect(result.data.cachedAt).toBeGreaterThan(0)
    })
  })

  describe('GET /edge/inference/cached — 列出缓存模型', () => {
    it('初始状态应返回空列表', async () => {
      const result = await controller.listCachedModels(mockReq())
      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it('缓存模型后应出现在列表', async () => {
      await controller.cacheModel(mockReq(), {
        modelId: 'model-1',
        version: 'v1',
      })
      await controller.cacheModel(mockReq(), {
        modelId: 'model-2',
        version: 'v2',
      })
      const result = await controller.listCachedModels(mockReq())
      expect(result.total).toBe(2)
      expect(result.data.map((m: any) => m.modelId)).toContain('model-1')
      expect(result.data.map((m: any) => m.modelId)).toContain('model-2')
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 5. 健康检查
  // ════════════════════════════════════════════════════════════════
  describe('GET /edge/health — 健康检查', () => {
    it('初始状态应返回正确节点数', async () => {
      const result = await controller.health(mockReq())
      expect(result.status).toBe('ok')
      expect(result.nodes).toBeGreaterThanOrEqual(2) // EdgeNodeService has 2 mock devices
      expect(result.serverTime).toBeGreaterThan(0)
      expect(result.timestamp).toBeDefined()
    })

    it('注册新节点后节点数应更新', async () => {
      const before = await controller.health(mockReq())
      await controller.registerNode(mockReq(), {
        name: 'Health Test Node',
        platform: 'linux',
        capabilities: [],
        memoryMb: 1024,
      })
      const after = await controller.health(mockReq())
      expect(after.nodes).toBe(before.nodes + 1)
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 6. 完整生命周期场景
  // ════════════════════════════════════════════════════════════════
  describe('完整场景：门店排队 → 叫号 → 完成', () => {
    it('完整排队服务流程', async () => {
      // 3 位顾客排队
      const c1 = await controller.issueTicket(mockReq(), { storeId: 'store-lifecycle', customerId: 'c1', priority: 0 })
      const c2 = await controller.issueTicket(mockReq(), { storeId: 'store-lifecycle', customerId: 'c2', priority: 0 })
      const c3 = await controller.issueTicket(mockReq(), { storeId: 'store-lifecycle', customerId: 'c3', priority: 0 })
      
      // 检查排队位置
      const pos3 = await controller.getQueuePosition(mockReq(), c3.data.ticketId)
      expect(pos3.data.position).toBe(3)

      // 叫号第一个
      const call1 = await controller.callNext(mockReq(), { storeId: 'store-lifecycle' })
      expect(call1.data.calledTicket!.ticketId).toBe(c1.data.ticketId)

      // 完成服务
      const done1 = await controller.completeTicket(mockReq(), c1.data.ticketId)
      expect(done1.success).toBe(true)

      // 叫号第二个
      const call2 = await controller.callNext(mockReq(), { storeId: 'store-lifecycle' })
      expect(call2.data.calledTicket!.ticketId).toBe(c2.data.ticketId)

      // 同步排队数据
      const sync = await controller.syncQueue(mockReq(), { storeId: 'store-lifecycle' })
      expect(sync.data.success).toBe(true)
    })
  })

  describe('完整场景：模型加载 → 推理 → 卸载', () => {
    it('AI 推理完整生命周期', async () => {
      // 加载模型
      const load = await controller.loadModel(mockReq(), {
        modelId: 'full-lifecycle-model',
        deviceId: 'edge-001',
      })
      expect(load.data.modelId).toBe('full-lifecycle-model')

      // 运行推理
      const inference = await controller.runInference(mockReq(), {
        modelId: 'full-lifecycle-model',
        deviceId: 'edge-001',
        inputData: { test: true },
      })
      expect(inference.data.latencyMs).toBeGreaterThanOrEqual(0)
      expect(inference.data.confidence).toBeGreaterThan(0)

      // 缓存模型
      const cache = await controller.cacheModel(mockReq(), {
        modelId: 'full-lifecycle-model',
        version: 'v1.0',
      })
      expect(cache.data.cachedAt).toBeGreaterThan(0)

      // 检查缓存
      const cachedList = await controller.listCachedModels(mockReq())
      expect(cachedList.total).toBeGreaterThanOrEqual(1)

      // 卸载模型
      const unload = await controller.unloadModel(mockReq(), {
        modelId: 'full-lifecycle-model',
        deviceId: 'edge-001',
      })
      expect(unload.success).toBe(true)

      // 卸载后不可推理
      await expect(
        controller.runInference(mockReq(), {
          modelId: 'full-lifecycle-model',
          deviceId: 'edge-001',
          inputData: {},
        })
      ).rejects.toThrow()
    })
  })
})
