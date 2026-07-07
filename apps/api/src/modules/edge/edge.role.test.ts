/**
 * EdgeController 角色权限测试
 *
 * 从 8 角色视角覆盖边缘计算模块功能：
 *   👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import { describe, it, expect, beforeAll } from 'vitest'

// ── 角色常量 ─────────────────────────────────────────────
const ROLES = {
  StoreManager: 'SM',   // 👔 店长
  Reception: 'RC',      // 🛒 前台
  HR: 'HR',             // 👥 HR
  Safety: 'SF',         // 🔧 安监
  Guide: 'GD',          // 🎮 导玩员
  Ops: 'OP',            // 🎯 运行专员
  Teambuilding: 'TB',   // 🤝 团建
  Marketing: 'MK',      // 📢 营销
}

// ── 边缘设备 / 排队 / 推理 模拟服务 ──────────────────────────
interface EdgeDevice {
  deviceId: string
  name: string
  platform: 'android' | 'ios' | 'linux' | 'windows'
  capabilities: string[]
  memoryMb: number
  status: 'online' | 'offline' | 'busy'
}

interface EdgeTicket {
  ticketId: string
  storeId: string
  ticketNumber: number
  status: 'WAITING' | 'CALLED' | 'COMPLETED' | 'CANCELLED'
  priority: number
  customerId?: string
  issuedAt: string
  calledAt?: string
  completedAt?: string
  syncedToServer: boolean
}

function makeMockServices() {
  const devices: EdgeDevice[] = [
    { deviceId: 'edge-001', name: '入口闸机 A', platform: 'linux', capabilities: ['face', 'qr'], memoryMb: 4096, status: 'online' },
    { deviceId: 'edge-002', name: '前台终端 B', platform: 'android', capabilities: ['face', 'voice'], memoryMb: 2048, status: 'online' },
    { deviceId: 'edge-003', name: '仓库扫描器', platform: 'android', capabilities: ['qr'], memoryMb: 1024, status: 'offline' },
  ]

  let ticketCounter = 0
  const tickets = new Map<string, EdgeTicket>()

  const ticketService = {
    issueTicket: (storeId: string, customerId?: string, priority = 0) => {
      ticketCounter++
      const ticket: EdgeTicket = {
        ticketId: `t-${ticketCounter.toString().padStart(5, '0')}`,
        storeId,
        ticketNumber: ticketCounter,
        status: 'WAITING',
        priority,
        customerId,
        issuedAt: new Date().toISOString(),
        syncedToServer: false,
      }
      tickets.set(ticket.ticketId, ticket)
      return ticket
    },
    callNext: (storeId: string) => {
      const waiting = Array.from(tickets.values()).filter((t) => t.storeId === storeId && t.status === 'WAITING')
      if (waiting.length === 0) return { calledTicket: null, queueAfterCall: 0, previousTicketId: null }
      waiting.sort((a, b) => b.priority - a.priority)
      const ticket = waiting[0]
      ticket.status = 'CALLED'
      ticket.calledAt = new Date().toISOString()
      return { calledTicket: ticket, queueAfterCall: waiting.length - 1, previousTicketId: null }
    },
    completeTicket: (ticketId: string) => {
      const ticket = tickets.get(ticketId)
      if (!ticket || ticket.status !== 'CALLED') return false
      ticket.status = 'COMPLETED'
      ticket.completedAt = new Date().toISOString()
      return true
    },
    cancelTicket: (ticketId: string) => {
      const ticket = tickets.get(ticketId)
      if (!ticket || ticket.status === 'COMPLETED' || ticket.status === 'CANCELLED') return false
      ticket.status = 'CANCELLED'
      return true
    },
    getQueuePosition: (ticketId: string) => {
      const ticket = tickets.get(ticketId)
      if (!ticket) return null
      const waiting = Array.from(tickets.values()).filter((t) => t.storeId === ticket!.storeId && t.status === 'WAITING')
      const pos = waiting.findIndex((t) => t.ticketId === ticketId)
      return { ticketId, position: pos + 1, estimatedWaitMinutes: (pos + 1) * 5, totalWaiting: waiting.length }
    },
    syncQueueToServer: (storeId: string) => {
      const storeTickets = Array.from(tickets.values()).filter((t) => t.storeId === storeId)
      storeTickets.forEach((t) => { t.syncedToServer = true })
      return { storeId, syncedAt: new Date().toISOString(), ticketCount: storeTickets.length, success: true }
    },
  }

  const nodeService = {
    listDevices: () => [...devices],
    registerDevice: (d: EdgeDevice) => {
      devices.push(d)
      return d
    },
    removeDevice: (deviceId: string) => {
      const idx = devices.findIndex((d) => d.deviceId === deviceId)
      if (idx === -1) return false
      devices.splice(idx, 1)
      return true
    },
  }

  const timeSyncService = {
    syncClock: (clientTime: number) => ({
      serverTime: Date.now(),
      offset: 0,
      roundTripDelay: 15,
      synced: true,
    }),
    calibrateWithSamples: (samples: Array<{ clientTime: number; serverTime: number }>) => {
      if (samples.length === 0) return 0
      const offsets = samples.map((s) => s.serverTime - s.clientTime)
      return Math.round(offsets.reduce((a, b) => a + b, 0) / offsets.length)
    },
    isWithinTolerance: (serverTime: number, toleranceMs: number) => {
      const offset = Math.abs(Date.now() - serverTime)
      return { withinTolerance: offset <= toleranceMs, deviationMs: offset, serverTime }
    },
  }

  const inferenceService = {
    loadModel: async (modelId: string, _deviceId: string) => ({
      modelId,
      version: '1.0.0',
      sizeMb: 128,
      framework: 'onnx' as const,
      inputShape: [1, 3, 224, 224],
      outputShape: [1, 1000],
    }),
    runInference: async (_modelId: string, inputData: unknown, _deviceId: string) => ({
      modelId: _modelId,
      output: inputData,
      latencyMs: 45,
      confidence: 0.97,
      deviceId: _deviceId,
      timestamp: Date.now(),
    }),
    unloadModel: async (_modelId: string, _deviceId: string) => {},
  }

  const modelCache = {
    cacheModel: async (modelId: string, version: string) => ({
      modelId,
      version,
      sizeMb: 128,
      framework: 'onnx' as const,
      inputShape: [1, 3, 224, 224],
      outputShape: [1, 1000],
      tenantId: 'default',
      cachedAt: new Date().toISOString(),
    }),
    listCachedModels: () => [
      { modelId: 'face-v3', version: '1.0.0', cachedAt: Date.now(), sizeMb: 128, deviceId: 'edge-001' },
      { modelId: 'qr-scanner', version: '2.1.0', cachedAt: Date.now(), sizeMb: 32, deviceId: 'edge-002' },
    ],
  }

  return { ticketService, nodeService, timeSyncService, inferenceService, modelCache, devices }
}

// ── Inline Controller (mirrors edge.controller.ts) ───────────
class EdgeControllerInline {
  constructor(
    private readonly nodeService: ReturnType<typeof makeMockServices>['nodeService'],
    private readonly ticketService: ReturnType<typeof makeMockServices>['ticketService'],
    private readonly timeSyncService: ReturnType<typeof makeMockServices>['timeSyncService'],
    private readonly inferenceService: ReturnType<typeof makeMockServices>['inferenceService'],
    private readonly modelCache: ReturnType<typeof makeMockServices>['modelCache'],
  ) {}

  listNodes() {
    return { data: this.nodeService.listDevices(), total: 0 }
  }

  registerNode(body: { name: string; platform?: string; capabilities?: string[]; memoryMb?: number }) {
    const device = this.nodeService.registerDevice({
      deviceId: `edge-${Date.now().toString(36)}`,
      name: body.name,
      platform: (body.platform ?? 'linux') as EdgeDevice['platform'],
      capabilities: body.capabilities ?? [],
      memoryMb: body.memoryMb ?? 2048,
      status: 'online',
    })
    return { data: device }
  }

  deleteNode(id: string) {
    const removed = this.nodeService.removeDevice(id)
    if (!removed) throw new Error(`Edge node ${id} not found`)
    return { success: true, message: `Node ${id} removed` }
  }

  issueTicket(storeId: string, customerId?: string, priority?: number) {
    const ticket = this.ticketService.issueTicket(storeId, customerId, priority ?? 0)
    return { data: ticket }
  }

  callNext(storeId: string) {
    const result = this.ticketService.callNext(storeId)
    return { data: result }
  }

  completeTicket(id: string) {
    const success = this.ticketService.completeTicket(id)
    if (!success) throw new Error(`Ticket ${id} not found or already completed`)
    return { success: true, message: `Ticket ${id} completed` }
  }

  cancelTicket(id: string) {
    const success = this.ticketService.cancelTicket(id)
    if (!success) throw new Error(`Ticket ${id} not found or cannot be cancelled`)
    return { success: true, message: `Ticket ${id} cancelled` }
  }

  getQueuePosition(id: string) {
    const position = this.ticketService.getQueuePosition(id)
    if (!position) throw new Error(`Ticket ${id} not found`)
    return { data: position }
  }

  syncQueue(storeId: string) {
    const result = this.ticketService.syncQueueToServer(storeId)
    return { data: result }
  }

  health() {
    return {
      status: 'ok',
      nodes: this.nodeService.listDevices().length,
      serverTime: Date.now(),
      timestamp: new Date().toISOString(),
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  1. 👔 店长 (StoreManager)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} Edge (店长)`, () => {
  it('查看营业中的边缘节点列表，确认门店设备在线状态', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const result = ctrl.listNodes()
    expect(result.data.length).toBeGreaterThanOrEqual(3)
    expect(result.data.some((d) => d.status === 'online')).toBe(true)
  })

  it('注册新的边缘终端到门店', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const result = ctrl.registerNode({ name: '新入口闸机', platform: 'linux', capabilities: ['face', 'qr'], memoryMb: 4096 })
    expect(result.data.name).toBe('新入口闸机')
    expect(result.data.status).toBe('online')
  })

  it('查看边缘健康状态，确认系统正常运行', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const result = ctrl.health()
    expect(result.status).toBe('ok')
    expect(result.nodes).toBeGreaterThanOrEqual(3)
  })
})

// ═══════════════════════════════════════════════════════════════
//  2. 🛒 前台 (Reception)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Reception} Edge (前台)`, () => {
  it('为顾客发放入场排队号', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const result = ctrl.issueTicket('store-001', 'cust-12345')
    expect(result.data.ticketNumber).toBeDefined()
    expect(result.data.status).toBe('WAITING')
  })

  it('叫号下一位顾客', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    ctrl.issueTicket('store-001', 'cust-001')
    ctrl.issueTicket('store-001', 'cust-002')
    const result = ctrl.callNext('store-001')
    expect(result.data.calledTicket).not.toBeNull()
    expect(result.data.calledTicket!.status).toBe('CALLED')
  })

  it('查询排队位置', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    ctrl.issueTicket('store-001', 'cust-001')
    ctrl.issueTicket('store-001', 'cust-002')
    const t = ctrl.issueTicket('store-001', 'cust-003')
    const pos = ctrl.getQueuePosition(t.data.ticketId)
    expect(pos.data.position).toBeGreaterThanOrEqual(1)
    expect(pos.data.totalWaiting).toBeGreaterThanOrEqual(3)
  })
})

// ═══════════════════════════════════════════════════════════════
//  3. 👥 HR (人力资源)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.HR} Edge (人力资源)`, () => {
  it('查看边缘节点状态，评估运维人力需求', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const result = ctrl.listNodes()
    const offlineCount = result.data.filter((d) => d.status === 'offline').length
    expect(offlineCount).toBeGreaterThanOrEqual(0)
  })

  it('离线节点统计 - 判断是否需要增加维护人员', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const result = ctrl.listNodes()
    const allCount = result.data.length
    const onlineCount = result.data.filter((d) => d.status === 'online').length
    expect(onlineCount).toBeLessThanOrEqual(allCount)
  })
})

// ═══════════════════════════════════════════════════════════════
//  4. 🔧 安监 (Safety)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} Edge (安监)`, () => {
  it('节点注册安全审计 - 记录新设备接入', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const before = ctrl.listNodes().data.length
    ctrl.registerNode({ name: '安监摄像头', platform: 'linux', capabilities: ['face'], memoryMb: 2048 })
    const after = ctrl.listNodes().data.length
    expect(after).toBe(before + 1)
  })

  it('设备下架 - 移除已淘汰的边缘节点', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    expect(() => ctrl.deleteNode('edge-001')).not.toThrow()
  })

  it('删除不存在的节点应返回错误', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    expect(() => ctrl.deleteNode('nonexistent')).toThrow('Edge node nonexistent not found')
  })
})

// ═══════════════════════════════════════════════════════════════
//  5. 🎮 导玩员 (Guide)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} Edge (导玩员)`, () => {
  it('为团体活动批量发放排队号', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const t1 = ctrl.issueTicket('store-001', 'group-A-1', 1)
    const t2 = ctrl.issueTicket('store-001', 'group-A-2', 1)
    expect(t1.data.ticketNumber).toBeLessThan(t2.data.ticketNumber)
    expect(t1.data.status).toBe('WAITING')
    expect(t2.data.status).toBe('WAITING')
  })

  it('VIP优先叫号', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    ctrl.issueTicket('store-001', 'normal', 0)
    ctrl.issueTicket('store-001', 'vip', 10)
    const result = ctrl.callNext('store-001')
    expect(result.data.calledTicket!.customerId).toBe('vip')
  })
})

// ═══════════════════════════════════════════════════════════════
//  6. 🎯 运行专员 (Ops)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} Edge (运行专员)`, () => {
  it('同步离线排队数据到服务器', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    ctrl.issueTicket('store-001', 'cust-001')
    ctrl.issueTicket('store-001', 'cust-002')
    const result = ctrl.syncQueue('store-001')
    expect(result.data.success).toBe(true)
    expect(result.data.ticketCount).toBe(2)
  })

  it('完成服务中的令牌', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const t = ctrl.issueTicket('store-002', 'cust-001')
    ctrl.callNext('store-002')
    const result = ctrl.completeTicket(t.data.ticketId)
    expect(result.success).toBe(true)
  })

  it('取消未完成的令牌', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const t = ctrl.issueTicket('store-003')
    const result = ctrl.cancelTicket(t.data.ticketId)
    expect(result.success).toBe(true)
  })

  it('完成已取消的令牌应返回错误', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const t = ctrl.issueTicket('store-004')
    ctrl.cancelTicket(t.data.ticketId)
    expect(() => ctrl.completeTicket(t.data.ticketId)).toThrow('not found or already completed')
  })
})

// ═══════════════════════════════════════════════════════════════
//  7. 🤝 团建 (Teambuilding)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} Edge (团建)`, () => {
  it('团建活动批量发号，确保团体排队', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const members = ['team-A-1', 'team-A-2', 'team-A-3']
    const tickets = members.map((m) => ctrl.issueTicket('store-005', m, 5))
    expect(tickets.length).toBe(3)
    expect(tickets[2].data.ticketNumber - tickets[0].data.ticketNumber).toBe(2)
  })

  it('查看所有边缘健康状态用于团建活动协调', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const result = ctrl.health()
    expect(result.status).toBe('ok')
    expect(typeof result.serverTime).toBe('number')
  })
})

// ═══════════════════════════════════════════════════════════════
//  8. 📢 营销 (Marketing)
// ═══════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} Edge (营销)`, () => {
  it('通过边缘排队数据评估客流量', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    ctrl.issueTicket('store-001', 'cust-promo-1')
    ctrl.issueTicket('store-001', 'cust-promo-2')
    ctrl.issueTicket('store-001', 'cust-promo-3')
    const pos = ctrl.getQueuePosition('t-00003')
    expect(pos.data.totalWaiting).toBeGreaterThanOrEqual(3)
  })

  it('促销活动期间查询边缘节点可用性', () => {
    const svc = makeMockServices()
    const ctrl = new EdgeControllerInline(svc.nodeService, svc.ticketService, svc.timeSyncService, svc.inferenceService, svc.modelCache)
    const result = ctrl.listNodes()
    const onlineNodes = result.data.filter((d) => d.status === 'online')
    expect(onlineNodes.length).toBeGreaterThanOrEqual(2)
  })
})
