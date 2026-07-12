/**
 * edge.role-scenario.test.ts — 边缘计算场景驱动角色测试
 *
 * 跨角色场景:
 *   S1: 运行专员部署边缘节点 → 店长查看设备状态
 *   S2: 前台取号 → 导玩员叫号 → 前台完成服务
 *   S3: 安监校准时间 → 运行专员验证时钟容差
 *   S4: 营销加载 AI 模型 → 运行专员执行推理 → 导玩员获取识别结果
 *   S5: HR 注册新设备 → 团建团队同步离线队列
 */

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

// ── 辅助: 创建服务实例 ──
function setup() {
  const nodeService = new EdgeNodeService()
  const inferenceService = new EdgeInferenceService()
  const modelCache = new EdgeModelCache()
  const ticketService = new OfflineTicketService()
  const timeSyncService = new TimeSyncService()
  return { nodeService, inferenceService, modelCache, ticketService, timeSyncService }
}

// ========================================================================
// S1 · 运行专员部署设备 → 店长查看节点状态
// ========================================================================
describe('🎯【S1】运行专员部署边缘节点 → 👔店长查看设备状态', () => {
  let svc: ReturnType<typeof setup>

  beforeEach(() => { svc = setup() })

  it('S1-正常流程: 运行专员注册新节点 → 店长确认在线状态', () => {
    // 1. 运行专员注册新边缘节点
    const newNode = svc.nodeService.registerDevice({
      deviceId: 'edge-s1-new',
      name: 'S1 店内终端',
      platform: 'android',
      capabilities: ['face', 'qr'],
      memoryMb: 2048,
      status: 'online',
    })
    expect(newNode.status).toBe('online')
    expect(newNode.capabilities).toContain('face')

    // 2. 店长列出所有节点确认存在
    const allNodes = svc.nodeService.listDevices()
    const found = allNodes.find((d) => d.deviceId === 'edge-s1-new')
    expect(found).toBeDefined()
    expect(found!.status).toBe('online')
  })

  it('S1-异常: 运行专员注册重复 deviceId → 应覆盖旧记录', () => {
    svc.nodeService.registerDevice({
      deviceId: 'dup-device',
      name: '第一次注册',
      platform: 'linux',
      capabilities: ['face'],
      memoryMb: 1024,
      status: 'online',
    })
    // 重复注册同名 deviceId
    svc.nodeService.registerDevice({
      deviceId: 'dup-device',
      name: '覆盖注册',
      platform: 'android',
      capabilities: ['face', 'qr'],
      memoryMb: 2048,
      status: 'online',
    })
    const node = svc.nodeService.getDevice('dup-device')
    expect(node).toBeDefined()
    expect(node!.name).toBe('覆盖注册')
    expect(node!.platform).toBe('android')
  })
})

// ========================================================================
// S2 · 前台取号 → 导玩员叫号 → 前台完成服务
// ========================================================================
describe('🛒【S2】前台取号 → 🎮导玩员叫号 → 🛒前台完成服务', () => {
  let svc: ReturnType<typeof setup>

  beforeEach(() => { svc = setup() })

  it('S2-正常流程: 多位顾客取号 → 导玩员依次叫号 → 前台上桌', () => {
    // 前台为顾客 1、2、3 取号
    const t1 = svc.ticketService.issueTicket('store-s2', '萧老板', 0)
    const t2 = svc.ticketService.issueTicket('store-s2', '林小妹', 1)
    const t3 = svc.ticketService.issueTicket('store-s2', '王大壮', 0)

    expect(t1.ticketNumber).toBe(1)
    expect(t2.ticketNumber).toBe(2)
    expect(t3.ticketNumber).toBe(3)

    // 导玩员叫号 — 高优先级的林小妹应优先被叫
    const call1 = svc.ticketService.callNext('store-s2')
    expect(call1.calledTicket).not.toBeNull()
    expect(call1.calledTicket!.customerId).toBe('林小妹')

    // 前台确认顾客上桌 → 完成服务
    const completed = svc.ticketService.completeTicket(call1.calledTicket!.ticketId)
    expect(completed).toBe(true)

    // 再次叫号, 剩余按原顺序
    const call2 = svc.ticketService.callNext('store-s2')
    expect(call2.calledTicket!.customerId).toBe('萧老板')
  })

  it('S2-边界: 空队列取号不应叫到人', () => {
    const result = svc.ticketService.callNext('empty-store')
    expect(result.calledTicket).toBeNull()
    expect(result.queueAfterCall).toBe(0)
  })

  it('S2-边界: 顾客取消排队 → 返回已取消状态', () => {
    const t = svc.ticketService.issueTicket('store-s2', '取消客', 0)
    const cancelled = svc.ticketService.cancelTicket(t.ticketId)
    expect(cancelled).toBe(true)

    // 已取消/完成的票返回 position=-1 而非 null
    const pos = svc.ticketService.getQueuePosition(t.ticketId)
    expect(pos).not.toBeNull()
    expect(pos!.position).toBe(-1)
    expect(pos!.totalWaiting).toBe(0)
  })
})

// ========================================================================
// S3 · 安监校准时间 → 运行专员验证时钟容差
// ========================================================================
describe('🔧【S3】安监校准时钟 → 🎯运行专员验证容差', () => {
  let svc: ReturnType<typeof setup>

  beforeEach(() => { svc = setup() })

  it('S3-正常流程: 安监采集样本校准 → 运行专员检查偏差在容差内', () => {
    // 安监采集时间样本
    const samples = [
      { clientTime: 1000, serverTime: 1050 },
      { clientTime: 2000, serverTime: 2040 },
      { clientTime: 3000, serverTime: 3060 },
    ]
    const offset = svc.timeSyncService.calibrateWithSamples(samples)
    expect(offset).toBeGreaterThan(0)

    // 运行专员查容差
    const serverTime = Date.now() + offset
    const tolerance = svc.timeSyncService.isWithinTolerance(serverTime, 1000)
    expect(tolerance.withinTolerance).toBe(true)
  })

  it('S3-异常: 时钟偏差超限 → 运行专员应告警', () => {
    const serverTime = Date.now() + 50000 // 50 秒偏差
    const result = svc.timeSyncService.isWithinTolerance(serverTime, 1000)
    expect(result.withinTolerance).toBe(false)
    expect(result.deviationMs).toBeGreaterThan(1000)
  })
})

// ========================================================================
// S4 · 营销加载 AI 模型 → 运行专员执行推理 → 导玩员获取结果
// ========================================================================
describe('📢【S4】营销加载 AI 模型 → 🎯运行专员推理 → 🎮导玩员使用结果', () => {
  let svc: ReturnType<typeof setup>

  beforeEach(() => { svc = setup() })

  it('S4-正常流程: 营销热更新模型 → 运行专员加载 → 导玩员识别人脸', async () => {
    // 营销通知更新模型版本
    const modelId = 'face-recognition-v2'

    // 运行专员加载模型到设备
    const modelInfo = await svc.inferenceService.loadModel(modelId, 'edge-001')
    expect(modelInfo.modelId).toBe(modelId)

    // 导玩员运行人脸推理
    const result = await svc.inferenceService.runInference(
      modelId,
      { image: 'face-data-base64' },
      'edge-001',
    )
    expect(result.modelId).toBe(modelId)
    expect(result.confidence).toBeGreaterThan(0.8)
    expect(result.latencyMs).toBeGreaterThan(0)
  })

  it('S4-异常: 模型未加载 → 运行专员推理应拒绝', async () => {
    await expect(
      svc.inferenceService.runInference('unloaded-model', { data: 'test' }, 'edge-001'),
    ).rejects.toThrow('not loaded')
  })

  it('S4-异常: 离线设备加载模型 → 运行专员应收到错误', async () => {
    await expect(
      svc.inferenceService.loadModel('face-model', 'edge-003'),
    ).rejects.toThrow('offline')
  })
})

// ========================================================================
// S5 · HR 注册新设备 → 团建团队同步离线队列
// ========================================================================
describe('👥【S5】HR 注册新员工终端 → 🤝团建同步离线队列', () => {
  let svc: ReturnType<typeof setup>

  beforeEach(() => { svc = setup() })

  it('S5-正常流程: HR 为新员工注册设备 → 团建发起离线排队 → 同步到服务器', () => {
    // HR 为新员工注册手持终端
    svc.nodeService.registerDevice({
      deviceId: 'edge-s5-staff',
      name: '团建手持终端',
      platform: 'android',
      capabilities: ['qr'],
      memoryMb: 1024,
      status: 'online',
    })

    const device = svc.nodeService.getDevice('edge-s5-staff')
    expect(device).toBeDefined()
    expect(device!.name).toBe('团建手持终端')

    // 团建团队离线发放排队号码
    const t1 = svc.ticketService.issueTicket('store-s5', '团建队员A', 0)
    const t2 = svc.ticketService.issueTicket('store-s5', '团建队员B', 0)
    expect(t1.status).toBe('WAITING')
    expect(t2.status).toBe('WAITING')

    // 同步离线队列到服务器
    const sync = svc.ticketService.syncQueueToServer('store-s5')
    expect(sync.success).toBe(true)
    expect(sync.ticketCount).toBe(2)
  })

  it('S5-边界: 同步空队列应返回 0 计数', () => {
    const sync = svc.ticketService.syncQueueToServer('empty-store')
    expect(sync.success).toBe(true)
    expect(sync.ticketCount).toBe(0)
  })
})

// ========================================================================
// S6 · 店长全局运维 → 模型缓存 → 营销投放
// ========================================================================
describe('👔【S6】店长全局运维 + 📢营销模型缓存', () => {
  let svc: ReturnType<typeof setup>

  beforeEach(() => { svc = setup() })

  it('S6-正常流程: 营销缓存多个模型 → 店长查看缓存列表', async () => {
    // 营销缓存 2 个模型
    await svc.modelCache.cacheModel('mkt-personalize', 'v3')
    await svc.modelCache.cacheModel('mkt-segment', 'v2')

    // 店长查看所有已缓存模型
    const cached = svc.modelCache.listCachedModels()
    expect(cached.length).toBeGreaterThanOrEqual(2)

    const modelIds = cached.map((m) => m.modelId)
    expect(modelIds).toContain('mkt-personalize')
    expect(modelIds).toContain('mkt-segment')
  })

  it('S6-异常: 营销更新缓存 → 旧版本失效', async () => {
    await svc.modelCache.cacheModel('campaign-model', 'v1')
    await svc.modelCache.invalidateCache('campaign-model')

    const got = await svc.modelCache.getCachedModel('campaign-model')
    expect(got).toBeNull()
  })
})
