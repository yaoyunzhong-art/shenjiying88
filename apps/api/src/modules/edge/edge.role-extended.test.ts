import { describe, it, expect, beforeEach } from 'vitest'
import {
  EdgeNodeService,
  EdgeInferenceService,
  EdgeModelCache,
} from './edge-ai.service'
import {
  OfflineTicketService,
  TimeSyncService,
} from './edge-computing.service'

/**
 * 🐜 [edge] 角色扩展测试
 * 覆盖边缘节点管理、离线排队、时间同步、AI 推理边界场景
 */

function setup() {
  const nodeService = new EdgeNodeService()
  const inferenceService = new EdgeInferenceService()
  const modelCache = new EdgeModelCache()
  const ticketService = new OfflineTicketService()
  const timeSyncService = new TimeSyncService()
  return { nodeService, inferenceService, modelCache, ticketService, timeSyncService }
}

describe('👔店长 edge 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('列出所有边缘节点', () => {
    const nodes = svc.nodeService.listDevices()
    expect(nodes.length).toBeGreaterThanOrEqual(2)
    expect(nodes[0]).toHaveProperty('deviceId')
    expect(nodes[0]).toHaveProperty('platform')
  })
})

describe('🛒前台 edge 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('注册新边缘节点', () => {
    const d = svc.nodeService.registerDevice({
      deviceId: 'edge-new', name: 'New Node', platform: 'linux',
      capabilities: ['face'], memoryMb: 2048, status: 'online',
    })
    expect(d.deviceId).toBe('edge-new')
    expect(svc.nodeService.listDevices().length).toBeGreaterThanOrEqual(3)
  })

  it('删除边缘节点', () => {
    const removed = svc.nodeService.removeDevice('edge-001')
    expect(removed).toBe(true)
    expect(svc.nodeService.getDevice('edge-001')).toBeUndefined()
  })

  it('删除不存在节点返回 false', () => {
    expect(svc.nodeService.removeDevice('no-such')).toBe(false)
  })
})

describe('👥HR edge 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('更新节点状态', () => {
    const updated = svc.nodeService.updateDeviceStatus('edge-001', 'busy')
    expect(updated!.status).toBe('busy')
  })

  it('更新不存在节点返回 null', () => {
    expect(svc.nodeService.updateDevice('no-such', {})).toBeNull()
  })
})

describe('🔧安监 edge 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('时间同步计算时差', () => {
    const clientTime = Date.now()
    const result = svc.timeSyncService.syncClock(clientTime)
    expect(result.serverTime).toBeGreaterThan(0)
    expect(result.synced).toBe(true)
  })

  it('时钟校准采样', () => {
    const samples = [
      { clientTime: 1000, serverTime: 1100 },
      { clientTime: 2000, serverTime: 2080 },
    ]
    const offset = svc.timeSyncService.calibrateWithSamples(samples)
    expect(typeof offset).toBe('number')
  })

  it('校准时差容限检查', () => {
    const r = svc.timeSyncService.isWithinTolerance(Date.now(), 500)
    expect(r).toHaveProperty('withinTolerance')
  })
})

describe('🎮导玩员 edge 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('离线发放排队号码', () => {
    const ticket = svc.ticketService.issueTicket('store-1', 'cust-1', 0)
    expect(ticket.ticketId).toBeTruthy()
    expect(ticket.storeId).toBe('store-1')
    expect(ticket.status).toBe('WAITING')
  })

  it('获取排队位置', () => {
    svc.ticketService.issueTicket('store-1', 'c1')
    const t2 = svc.ticketService.issueTicket('store-1', 'c2')
    const pos = svc.ticketService.getQueuePosition(t2.ticketId)
    expect(pos).not.toBeNull()
    expect(pos!.position).toBeGreaterThanOrEqual(1)
  })

  it('叫号逻辑', () => {
    svc.ticketService.issueTicket('store-1', 'c1')
    svc.ticketService.issueTicket('store-1', 'c2')
    const called = svc.ticketService.callNext('store-1')
    expect(called.calledTicket).not.toBeNull()
    expect(called.calledTicket!.status).toBe('CALLED')
  })
})

describe('🎯运行专员 edge 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('AI 推理加载模型后运行', async () => {
    await svc.inferenceService.loadModel('face-model', 'edge-001')
    const result = await svc.inferenceService.runInference('face-model', 'classify:test', 'edge-001')
    expect(result.modelId).toBe('face-model')
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.latencyMs).toBeGreaterThan(0)
  })

  it('未加载模型时推理抛异常', async () => {
    await expect(svc.inferenceService.runInference('no-model', 'test', 'edge-001')).rejects.toThrow('not loaded')
  })
})

describe('🤝团建 edge 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('完成排队号码', () => {
    const t = svc.ticketService.issueTicket('store-2', 'c1')
    const ok = svc.ticketService.completeTicket(t.ticketId)
    expect(ok).toBe(true)
    // 已完成票返回 position=-1
    const pos = svc.ticketService.getQueuePosition(t.ticketId)
    expect(pos).not.toBeNull()
    expect(pos!.position).toBe(-1)
  })

  it('同步排队数据', () => {
    svc.ticketService.issueTicket('store-3', 'c1')
    svc.ticketService.issueTicket('store-3', 'c2')
    const sync = svc.ticketService.syncQueueToServer('store-3')
    expect(sync.success).toBe(true)
    expect(sync.ticketCount).toBe(2)
  })
})

describe('📢营销 edge 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('模型缓存操作', async () => {
    const cached = await svc.modelCache.cacheModel('mkt-model', 'v1')
    expect(cached.modelId).toBe('mkt-model')
    expect(cached.version).toBe('v1')
  })

  it('获取已缓存模型', async () => {
    await svc.modelCache.cacheModel('face-v2', 'v2')
    const got = await svc.modelCache.getCachedModel('face-v2')
    expect(got).not.toBeNull()
    expect(got!.modelId).toBe('face-v2')
  })

  it('失效缓存后无法获取', async () => {
    await svc.modelCache.cacheModel('temp', 'v1')
    await svc.modelCache.invalidateCache('temp')
    const got = await svc.modelCache.getCachedModel('temp')
    expect(got).toBeNull()
  })

  it('清理过期缓存', async () => {
    // 先缓存一个旧模型睡到下一毫秒, 保证 TTL 真正到期
    await svc.modelCache.cacheModel('old', 'v1')
    await new Promise((r) => setTimeout(r, 5))
    await svc.modelCache.cacheModel('new', 'v2')
    const cleaned = await svc.modelCache.cleanExpired(0) // only 'old' should expire
    // 'old' 在 5ms 前缓存, now - cachedAt > 0
    expect(cleaned).toBeGreaterThanOrEqual(1)
  })
})
