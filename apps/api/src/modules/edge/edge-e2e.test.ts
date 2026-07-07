import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Edge E2E 集成测试 (T123-3)
 *
 * 使用 vitest globals (describe/it)
 * 测试离线取号 → 叫号 → 服务 → 同步服务器全流程
 *
 * 落地：HEARTBEAT-63
 */

import assert from 'node:assert/strict'
import {
  OfflineTicketService,
  TimeSyncService,
  TicketStatus,
} from './edge-computing.service'
import {
  EdgeInferenceService,
  OfflineRecognitionService,
  EdgeModelCache,
  BatchRecognitionItem,
} from './edge-ai.service'

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function createTicketService(): OfflineTicketService {
  return new OfflineTicketService()
}

function createTimeSyncService(): TimeSyncService {
  return new TimeSyncService()
}

function createEdgeInferenceService(): EdgeInferenceService {
  return new EdgeInferenceService()
}

// ─────────────────────────────────────────────────────────────
// 1. 离线取号 → 叫号 → 服务 → 同步服务器全流程 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('Edge 离线取号 → 叫号 → 服务 → 同步服务器全流程', () => {
  let ticketService: OfflineTicketService

  beforeEach(() => {
    ticketService = createTicketService()
  })

  it('全流程：离线发放号码 → 排队等待 → 叫号 → 服务完成', () => {
    // 1. 离线发放号码
    const ticket1 = ticketService.issueTicket('store-edge-001', 'customer-001', 0)
    const ticket2 = ticketService.issueTicket('store-edge-001', 'customer-002', 5)
    const ticket3 = ticketService.issueTicket('store-edge-001', 'customer-003', 10) // 高优先级

    assert.equal(ticket1.ticketNumber, 1)
    assert.equal(ticket2.ticketNumber, 2)
    assert.equal(ticket3.ticketNumber, 3)
    assert.equal(ticket1.status, TicketStatus.Waiting)

    // 2. 验证排队位置（优先级10 > 5 > 0，所以顺序是ticket3, ticket2, ticket1）
    const position1 = ticketService.getQueuePosition(ticket1.ticketId)
    assert.ok(position1)
    assert.equal(position1!.position, 3) // ticket1优先级0，排在最后

    // ticket2优先级5，排在中间
    const position2 = ticketService.getQueuePosition(ticket2.ticketId)
    assert.ok(position2)
    assert.equal(position2!.position, 2)

    // ticket3优先级10，排在最前
    const position3 = ticketService.getQueuePosition(ticket3.ticketId)
    assert.ok(position3)
    assert.equal(position3!.position, 1)

    // 3. 叫号（应该先叫高优先级的ticket3）
    const callResult = ticketService.callNext('store-edge-001')
    assert.ok(callResult.calledTicket)
    assert.equal(callResult.calledTicket!.ticketNumber, 3)
    assert.equal(callResult.calledTicket!.priority, 10)
    assert.equal(callResult.queueAfterCall, 2)

    // 4. 服务完成
    const completed = ticketService.completeTicket(ticket3.ticketId)
    assert.equal(completed, true)
    assert.equal(ticketService.getTicket(ticket3.ticketId)!.status, TicketStatus.Completed)
  })

  it('全流程：批量发放号码 → 部分叫号 → 取消 → 剩余继续排队', () => {
    // 1. 批量发放10个号码
    const tickets: string[] = []
    for (let i = 0; i < 10; i++) {
      tickets.push(ticketService.issueTicket('store-batch').ticketId)
    }

    // 2. 叫号3次
    ticketService.callNext('store-batch')
    ticketService.callNext('store-batch')
    ticketService.callNext('store-batch')

    // 3. 取消第5个号码
    ticketService.cancelTicket(tickets[4])

    // 4. 验证剩余队列
    const waitingTickets = ticketService.getWaitingTickets('store-batch')
    assert.equal(waitingTickets.length, 6) // 10 - 3叫号 - 1取消 = 6

    // 5. 继续叫号
    const nextCall = ticketService.callNext('store-batch')
    assert.ok(nextCall.calledTicket)
    assert.notEqual(nextCall.calledTicket!.ticketId, tickets[4]) // 被取消的不会又被叫
  })

  it('全流程：号码发放 → 同步到服务器 → 服务器验证', () => {
    // 1. 发放号码
    ticketService.issueTicket('store-sync-001')
    ticketService.issueTicket('store-sync-001')
    ticketService.issueTicket('store-sync-001')

    // 2. 叫号一个
    ticketService.callNext('store-sync-001')

    // 3. 同步到服务器
    const syncResult = ticketService.syncQueueToServer('store-sync-001')

    // 4. 验证同步结果
    assert.equal(syncResult.storeId, 'store-sync-001')
    assert.equal(syncResult.ticketCount, 2) // 只同步等待中的
    assert.equal(syncResult.success, true)
    assert.ok(syncResult.syncedAt)
  })

  it('全流程：VIP优先级客户插队 → 叫号优先处理', () => {
    // 1. 普通客户取号
    const normalTicket = ticketService.issueTicket('store-vip', 'normal-001', 0)

    // 2. VIP客户取号（高优先级）
    const vipTicket = ticketService.issueTicket('store-vip', 'vip-001', 100)

    // 3. 叫号应该先叫VIP
    const callResult = ticketService.callNext('store-vip')
    assert.ok(callResult.calledTicket)
    assert.equal(callResult.calledTicket!.ticketId, vipTicket.ticketId)
    assert.ok(callResult.calledTicket!.priority > normalTicket.priority)
  })
})

// ─────────────────────────────────────────────────────────────
// 2. 时钟漂移检测 → 自动校准 E2E (4 tests)
// ─────────────────────────────────────────────────────────────

describe('Edge 时钟漂移检测 → 自动校准 E2E', () => {
  let timeSyncService: TimeSyncService

  beforeEach(() => {
    timeSyncService = createTimeSyncService()
  })

  it('客户端时钟偏移 → 检测 → 校准 → 验证同步状态', () => {
    // 1. 模拟客户端时钟偏移（客户端比服务器快500ms）
    const clientTime = Date.now()
    const serverTime = clientTime - 500

    // 2. 计算时钟漂移
    const drift = timeSyncService.calculateClockDrift(clientTime, serverTime)
    assert.equal(drift, -500)

    // 3. 执行时钟同步（使用偏置的clientTime）
    const syncResult = timeSyncService.syncClock(clientTime - 100)
    assert.equal(syncResult.synced, true)

    // 4. 验证同步状态
    const offset = timeSyncService.getClockOffset()
    assert.ok(typeof offset === 'number')
  })

  it('时钟同步历史记录正确', () => {
    // 1. 执行多次同步
    for (let i = 0; i < 5; i++) {
      timeSyncService.syncClock(Date.now() + i * 100)
    }

    // 2. 验证历史记录
    const history = timeSyncService.getSyncHistory()
    assert.equal(history.length, 5)

    // 3. 验证最新同步时间
    const lastSync = timeSyncService.getLastSyncTime()
    assert.ok(lastSync > 0)
  })

  it('多样本中位数校准计算正确', () => {
    // 1. 准备多个样本（有异常值）
    const samples = [
      { clientTime: 1000, serverTime: 1100 },
      { clientTime: 1000, serverTime: 1200 }, // 异常值
      { clientTime: 1000, serverTime: 1150 },
      { clientTime: 1000, serverTime: 1100 },
      { clientTime: 1000, serverTime: 1100 },
    ]

    // 2. 中位数校准（应该忽略异常值1200）
    const offset = timeSyncService.calibrateWithSamples(samples)
    assert.equal(offset, 100) // 中位数为100
  })

  it('时间戳容差验证正确', () => {
    // 1. 有效时间戳（当前时间）
    const now = Date.now()
    const validResult = timeSyncService.isWithinTolerance(now, 500)
    assert.equal(validResult.withinTolerance, true)

    // 2. 无效时间戳（1秒前，超出500ms容差）
    const oldTime = now - 1000
    const invalidResult = timeSyncService.isWithinTolerance(oldTime, 500)
    assert.equal(invalidResult.withinTolerance, false)
    assert.ok(invalidResult.deviationMs > 500)
  })
})

// ─────────────────────────────────────────────────────────────
// 3. 边缘AI推理 E2E (4 tests)
// ─────────────────────────────────────────────────────────────

describe('Edge 边缘AI推理 E2E', () => {
  let inferenceService: EdgeInferenceService
  let modelCache: EdgeModelCache

  beforeEach(() => {
    inferenceService = createEdgeInferenceService()
    modelCache = new EdgeModelCache()
  })

  it('全流程：加载模型 → 批量识别 → 结果缓存', async () => {
    // 1. 加载模型到边缘设备
    const modelInfo = await inferenceService.loadModel('face-recognition-v1', 'edge-001')
    assert.ok(modelInfo.modelId)
    assert.ok(modelInfo.version)

    // 2. 验证模型已加载
    const status = inferenceService.getModelStatus('face-recognition-v1', 'edge-001')
    assert.equal(status.loaded, true)
    assert.ok(status.info)

    // 3. 缓存模型信息
    const cached = await modelCache.cacheModel('face-recognition-v1', modelInfo.version)
    assert.equal(cached.modelId, 'face-recognition-v1')
    assert.ok(cached.cachedAt)

    // 4. 执行推理
    const result = await inferenceService.runInference<{ embedding: number[] }>(
      'face-recognition-v1',
      'embedding:image_data',
      'edge-001'
    )
    assert.equal(result.modelId, 'face-recognition-v1')
    assert.ok(result.output.embedding.length > 0)
    assert.ok(result.latencyMs >= 0)
  })

  it('批量识别全流程：人脸 + 语音 + 二维码', async () => {
    // 1. 加载多个模型
    await inferenceService.loadModel('face-recognition-v1', 'edge-001')
    await inferenceService.loadModel('voice-recognition-v1', 'edge-001')
    await inferenceService.loadModel('qr-detector-v1', 'edge-001')

    // 2. 准备批量识别任务
    const items: BatchRecognitionItem[] = [
      { id: 'item-1', type: 'face', data: 'image_face_1' },
      { id: 'item-2', type: 'voice', data: 'audio_voice_1' },
      { id: 'item-3', type: 'qrcode', data: 'image_qr_1' },
    ]

    // 3. 创建离线识别服务
    const offlineService = new OfflineRecognitionService(inferenceService)

    // 4. 执行批量识别
    const results = await offlineService.batchRecognize(items, 'edge-001')
    assert.equal(results.length, 3)
    assert.ok(results.every((r) => r.success))
  })

  it('模型缓存 → 获取缓存 → 失效缓存全流程', async () => {
    // 1. 缓存模型
    const cached = await modelCache.cacheModel('test-model', 'v1.0.0')
    assert.ok(cached.cachedAt)

    // 2. 获取缓存
    const retrieved = await modelCache.getCachedModel('test-model')
    assert.ok(retrieved)
    assert.equal(retrieved!.modelId, 'test-model')
    assert.equal(retrieved!.version, 'v1.0.0')

    // 3. 失效缓存
    await modelCache.invalidateCache('test-model')

    // 4. 验证缓存已失效
    const afterInvalidate = await modelCache.getCachedModel('test-model')
    assert.equal(afterInvalidate, null)
  })

  it('边缘设备注册 → 模型加载状态验证', async () => {
    // 1. 列出设备
    const devices = inferenceService.listDevices()
    assert.ok(devices.length >= 3)
    assert.ok(devices.some((d) => d.deviceId === 'edge-001'))

    // 2. 加载模型到不同设备
    const model1 = await inferenceService.loadModel('model-A', 'edge-001')
    const model2 = await inferenceService.loadModel('model-B', 'edge-002')

    // 3. 验证各设备模型状态
    const status1 = inferenceService.getModelStatus('model-A', 'edge-001')
    const status2 = inferenceService.getModelStatus('model-B', 'edge-002')

    assert.equal(status1.loaded, true)
    assert.equal(status2.loaded, true)

    // 4. 卸载模型
    await inferenceService.unloadModel('model-A', 'edge-001')
    const statusAfterUnload = inferenceService.getModelStatus('model-A', 'edge-001')
    assert.equal(statusAfterUnload.loaded, false)
  })
})
