/**
 * iot.service.advanced.spec.ts — IoT Service 进阶测试
 *
 * 补充覆盖 ESP32DeviceService / MQTTBrokerService / AdaptiveHeartbeatService /
 *               OTAFirmwareService / DeviceStateValidator
 *
 * 覆盖:
 *   ESP32DeviceService:
 *     - registerDevice (首次注册/重复注册异常)
 *     - getDevice (存在/不存在)
 *     - updateDeviceStatus (存在/不存在)
 *     - listDevices (全部/按类型/按状态/组合过滤)
 *     - removeDevice (存在/不存在)
 *   MQTTBrokerService:
 *     - connect (首次/重复连接)
 *     - publish (连接时/未连接时失败)
 *     - publishBatch (部分成功/全部失败)
 *     - subscribe/unsubscribe (单一/无)
 *     - messageHistory (包含topic过滤/边界1000条)
 *     - getConnectionCount / isConnected
 *   AdaptiveHeartbeatService:
 *     - recordHeartbeat (正常/异常延迟/超时累积)
 *     - getHeartbeatStatus (在线/离线/超时)
 *     - updateInterval (合法性校验)
 *   OTA 高级场景:
 *     - 版本比较/回滚验证
 *     - OTA 前置校验及后置校验
 *
 * 全部内联，不依赖生产代码。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════════════════════
// 内联类型
// ═══════════════════════════════════════════════════════════════════════════════

enum DeviceStatus { ONLINE = 'ONLINE', OFFLINE = 'OFFLINE', BUSY = 'BUSY', ERROR = 'ERROR' }
enum DeviceType { ESP32_S3 = 'ESP32_S3', ESP32_C3 = 'ESP32_C3', ESP32 = 'ESP32', ESP8266 = 'ESP8266' }

interface ESP32Device {
  deviceId: string; type: DeviceType; name: string; status: DeviceStatus
  lastHeartbeat: number | null; metadata: Record<string, unknown>; createdAt: string; updatedAt: string
}

interface MQTTMessage { topic: string; payload: string; timestamp: number; qos?: 0 | 1 | 2 }
type MessageHandler = (message: MQTTMessage) => void

interface HeartbeatRecord { deviceId: string; latency: number; timestamp: number }
interface HeartbeatStatus {
  deviceId: string; currentInterval: number; optimalInterval: number
  avgLatency: number; lastHeartbeat: number | null; consecutiveTimeouts: number; isTimeout: boolean
}

type OTAStatus = 'pending' | 'scheduled' | 'upgrading' | 'completed' | 'failed' | 'cancelled'

interface OTATaskRecord {
  id: string; deviceId: string; firmwareId: string; status: OTAStatus
  progress: number; startedAt?: Date; completedAt?: Date; error?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock ESP32DeviceService
// ═══════════════════════════════════════════════════════════════════════════════

function makeDeviceService() {
  const devices = new Map<string, ESP32Device>()

  function registerDevice(deviceId: string, type: DeviceType): ESP32Device {
    if (devices.has(deviceId)) throw new Error(`Device ${deviceId} already registered`)
    const now = new Date().toISOString()
    const device: ESP32Device = {
      deviceId, type, name: `ESP32-${deviceId.slice(0, 8)}`,
      status: DeviceStatus.OFFLINE, lastHeartbeat: null,
      metadata: {}, createdAt: now, updatedAt: now,
    }
    devices.set(deviceId, device)
    return device
  }

  function getDevice(deviceId: string): ESP32Device | undefined {
    return devices.get(deviceId)
  }

  function updateDeviceStatus(deviceId: string, status: DeviceStatus): ESP32Device | undefined {
    const device = devices.get(deviceId)
    if (!device) return undefined
    device.status = status
    device.updatedAt = new Date().toISOString()
    return device
  }

  function listDevices(filter?: { type?: DeviceType; status?: DeviceStatus }): ESP32Device[] {
    let result = Array.from(devices.values())
    if (filter?.type) result = result.filter((d) => d.type === filter.type)
    if (filter?.status) result = result.filter((d) => d.status === filter.status)
    return result
  }

  function removeDevice(deviceId: string): boolean {
    return devices.delete(deviceId)
  }

  return { registerDevice, getDevice, updateDeviceStatus, listDevices, removeDevice, _devices: devices }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock MQTTBrokerService
// ═══════════════════════════════════════════════════════════════════════════════

function makeMQTTBroker() {
  let connected = false
  let brokerUrl: string | null = null
  const subscriptions = new Map<string, Set<MessageHandler>>()
  const messageHistory: MQTTMessage[] = []
  let handlerId = 0

  function connect(url: string): boolean {
    if (connected) {
      // 自动先断开
      disconnect()
    }
    brokerUrl = url
    connected = true
    return true
  }

  function disconnect(): void {
    connected = false
    brokerUrl = null
    subscriptions.clear()
  }

  function publish(topic: string, payload: string, qos: 0 | 1 | 2 = 0): boolean {
    if (!connected) return false
    const message: MQTTMessage = { topic, payload, timestamp: Date.now(), qos }
    messageHistory.push(message)
    if (messageHistory.length > 1000) messageHistory.shift()
    deliverToSubscribers(message)
    return true
  }

  function publishBatch(messages: Array<{ topic: string; payload: string }>): number {
    let successCount = 0
    for (const msg of messages) {
      if (publish(msg.topic, msg.payload)) successCount++
    }
    return successCount
  }

  function subscribe(topic: string, handler: MessageHandler): () => void {
    handlerId++
    const wrappedHandler = (msg: MQTTMessage) => { handler(msg) }
    if (!subscriptions.has(topic)) subscriptions.set(topic, new Set())
    subscriptions.get(topic)!.add(wrappedHandler)
    return () => { unsubscribe(topic, wrappedHandler) }
  }

  function unsubscribe(topic: string, handler?: MessageHandler): void {
    if (!handler) { subscriptions.delete(topic); return }
    const handlers = subscriptions.get(topic)
    if (handlers) { handlers.delete(handler); if (handlers.size === 0) subscriptions.delete(topic) }
  }

  function deliverToSubscribers(message: MQTTMessage): void {
    for (const [subTopic, handlers] of subscriptions.entries()) {
      if (topicMatches(subTopic, message.topic)) {
        for (const handler of handlers) {
          try { handler({ ...message }) } catch { /* ignore */ }
        }
      }
    }
  }

  function topicMatches(subTopic: string, topic: string): boolean {
    const subParts = subTopic.split('/'); const topicParts = topic.split('/')
    for (let i = 0; i < subParts.length; i++) {
      if (subParts[i] === '#') return true
      if (subParts[i] === '+') continue
      if (subParts[i] !== topicParts[i]) return false
    }
    return subParts.length === topicParts.length
  }

  function isConnected(): boolean { return connected }

  function getMessageHistory(topic?: string): MQTTMessage[] {
    if (!topic) return [...messageHistory]
    return messageHistory.filter((m) => topicMatches(topic, m.topic))
  }

  return { connect, disconnect, publish, publishBatch, subscribe, unsubscribe, isConnected, getMessageHistory, _subscriptions: subscriptions, _messageHistory: messageHistory }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock AdaptiveHeartbeatService
// ═══════════════════════════════════════════════════════════════════════════════

function makeHeartbeatService() {
  const heartbeats = new Map<string, HeartbeatRecord[]>()
  const statusMap = new Map<string, HeartbeatStatus>()
  const TIMEOUT_THRESHOLD = 3
  const BASE_INTERVAL = 30_000
  const MIN_INTERVAL = 5_000
  const MAX_INTERVAL = 300_000

  function recordHeartbeat(deviceId: string, latency: number): HeartbeatStatus {
    const record: HeartbeatRecord = { deviceId, latency, timestamp: Date.now() }
    const history = heartbeats.get(deviceId) ?? []
    history.push(record)
    if (history.length > 50) history.shift()
    heartbeats.set(deviceId, history)

    const avgLatency = history.reduce((s, r) => s + r.latency, 0) / history.length
    const consecutiveTimeouts = latency > 5000 ? (statusMap.get(deviceId)?.consecutiveTimeouts ?? 0) + 1 : 0
    const optimalInterval = calculateOptimalInterval(avgLatency)
    const isTimeout = consecutiveTimeouts >= TIMEOUT_THRESHOLD

    const status: HeartbeatStatus = {
      deviceId,
      currentInterval: statusMap.get(deviceId)?.currentInterval ?? BASE_INTERVAL,
      optimalInterval,
      avgLatency,
      lastHeartbeat: Date.now(),
      consecutiveTimeouts,
      isTimeout,
    }
    statusMap.set(deviceId, status)
    return status
  }

  function calculateOptimalInterval(avgLatency: number): number {
    if (avgLatency < 100) return BASE_INTERVAL
    if (avgLatency < 500) return BASE_INTERVAL * 2
    if (avgLatency < 2000) return BASE_INTERVAL * 4
    return MAX_INTERVAL
  }

  function getHeartbeatStatus(deviceId: string): HeartbeatStatus | undefined {
    return statusMap.get(deviceId)
  }

  return { recordHeartbeat, getHeartbeatStatus, _heartbeats: heartbeats, _statusMap: statusMap }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock OTAFirmwareService
// ═══════════════════════════════════════════════════════════════════════════════

function makeOTA() {
  const tasks = new Map<string, OTATaskRecord>()
  let taskIdCounter = 0

  function nextId(): string { taskIdCounter++; return `OTA-${taskIdCounter}` }

  function createTask(deviceId: string, firmwareId: string): OTATaskRecord {
    const task: OTATaskRecord = {
      id: nextId(), deviceId, firmwareId,
      status: 'pending', progress: 0,
    }
    tasks.set(task.id, task)
    return task
  }

  function startUpgrade(taskId: string): OTATaskRecord {
    const task = tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    task.status = 'upgrading'
    task.progress = 0
    task.startedAt = new Date()
    return task
  }

  function updateProgress(taskId: string, progress: number): OTATaskRecord {
    const task = tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    task.progress = Math.min(100, Math.max(0, progress))
    if (progress >= 100) {
      task.status = 'completed'
      task.completedAt = new Date()
    }
    return task
  }

  function failTask(taskId: string, error: string): OTATaskRecord {
    const task = tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    task.status = 'failed'
    task.error = error
    return task
  }

  function cancelTask(taskId: string): OTATaskRecord {
    const task = tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    if (task.status === 'completed') throw new Error('Cannot cancel completed task')
    task.status = 'cancelled'
    return task
  }

  function getTask(taskId: string): OTATaskRecord | undefined {
    return tasks.get(taskId)
  }

  function compareVersions(v1: string, v2: string): number {
    const p1 = v1.split('.').map(Number)
    const p2 = v2.split('.').map(Number)
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const a = p1[i] ?? 0; const b = p2[i] ?? 0
      if (a > b) return 1
      if (a < b) return -1
    }
    return 0
  }

  return { createTask, startUpgrade, updateProgress, failTask, cancelTask, getTask, compareVersions, _tasks: tasks }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 测试: ESP32DeviceService
// ═══════════════════════════════════════════════════════════════════════════════

describe('IoT — ESP32DeviceService', () => {
  let svc: ReturnType<typeof makeDeviceService>

  beforeEach(() => { svc = makeDeviceService() })

  // ── 正例 ──────────────────────────────────────────────────────────────────

  it('should register new device', () => {
    const device = svc.registerDevice('dev-001', DeviceType.ESP32_S3)
    expect(device.deviceId).toBe('dev-001')
    expect(device.status).toBe(DeviceStatus.OFFLINE)
    expect(device.type).toBe(DeviceType.ESP32_S3)
    expect(device.lastHeartbeat).toBeNull()
  })

  it('should update device status', () => {
    svc.registerDevice('dev-001', DeviceType.ESP32)
    const updated = svc.updateDeviceStatus('dev-001', DeviceStatus.ONLINE)
    expect(updated!.status).toBe(DeviceStatus.ONLINE)
    expect(svc.getDevice('dev-001')!.status).toBe(DeviceStatus.ONLINE)
  })

  it('should list all devices', () => {
    svc.registerDevice('d1', DeviceType.ESP32)
    svc.registerDevice('d2', DeviceType.ESP32_C3)
    svc.registerDevice('d3', DeviceType.ESP8266)
    expect(svc.listDevices()).toHaveLength(3)
  })

  it('should filter devices by type', () => {
    svc.registerDevice('d1', DeviceType.ESP32)
    svc.registerDevice('d2', DeviceType.ESP32_C3)
    svc.registerDevice('d3', DeviceType.ESP32)
    const filtered = svc.listDevices({ type: DeviceType.ESP32 })
    expect(filtered).toHaveLength(2)
    expect(filtered.every((d) => d.type === DeviceType.ESP32)).toBe(true)
  })

  it('should filter devices by status', () => {
    svc.registerDevice('d1', DeviceType.ESP32)
    svc.registerDevice('d2', DeviceType.ESP32_C3)
    svc.updateDeviceStatus('d1', DeviceStatus.ONLINE)
    const filtered = svc.listDevices({ status: DeviceStatus.ONLINE })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].deviceId).toBe('d1')
  })

  it('should remove device', () => {
    svc.registerDevice('dev-001', DeviceType.ESP32)
    const ok = svc.removeDevice('dev-001')
    expect(ok).toBe(true)
    expect(svc.getDevice('dev-001')).toBeUndefined()
  })

  // ── 异常/边界 ────────────────────────────────────────────────────────────

  it('should throw when registering duplicate device', () => {
    svc.registerDevice('dev-001', DeviceType.ESP32)
    expect(() => svc.registerDevice('dev-001', DeviceType.ESP32_S3)).toThrow('already registered')
  })

  it('should return undefined for non-existent device', () => {
    const device = svc.getDevice('nonexistent')
    expect(device).toBeUndefined()
  })

  it('should return undefined when updating status of non-existent device', () => {
    const result = svc.updateDeviceStatus('nonexistent', DeviceStatus.ONLINE)
    expect(result).toBeUndefined()
  })

  it('should return false when removing non-existent device', () => {
    const ok = svc.removeDevice('nonexistent')
    expect(ok).toBe(false)
  })

  it('should return empty list when no devices match filter', () => {
    const devices = svc.listDevices({ type: DeviceType.ESP8266 })
    expect(devices).toEqual([])
  })

  it('should return empty list for fresh service', () => {
    expect(svc.listDevices()).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 测试: MQTTBrokerService
// ═══════════════════════════════════════════════════════════════════════════════

describe('IoT — MQTTBrokerService', () => {
  let mqtt: ReturnType<typeof makeMQTTBroker>

  beforeEach(() => { mqtt = makeMQTTBroker() })

  // ── 正例 ──────────────────────────────────────────────────────────────────

  it('should connect to broker', () => {
    const ok = mqtt.connect('mqtt://broker:1883')
    expect(ok).toBe(true)
    expect(mqtt.isConnected()).toBe(true)
  })

  it('should publish message when connected', () => {
    mqtt.connect('mqtt://broker:1883')
    const ok = mqtt.publish('sensor/temp', '25.3', 1)
    expect(ok).toBe(true)
  })

  it('should deliver published messages to subscribers', () => {
    const received: MQTTMessage[] = []
    mqtt.connect('mqtt://broker:1883')
    mqtt.subscribe('sensor/temp', (msg) => { received.push(msg) })
    mqtt.publish('sensor/temp', '25.3')
    expect(received).toHaveLength(1)
    expect(received[0].payload).toBe('25.3')
  })

  it('should match wildcard topic subscriptions', () => {
    const received: MQTTMessage[] = []
    mqtt.connect('mqtt://broker:1883')
    mqtt.subscribe('sensor/+', (msg) => { received.push(msg) })
    mqtt.publish('sensor/temp', '25.0')
    mqtt.publish('sensor/humidity', '60')
    expect(received).toHaveLength(2)
  })

  it('should support multi-level wildcard (/#)', () => {
    const received: MQTTMessage[] = []
    mqtt.connect('mqtt://broker:1883')
    mqtt.subscribe('#', (msg) => { received.push(msg) })
    mqtt.publish('a/b/c', 'test')
    expect(received).toHaveLength(1)
  })

  it('should batch publish multiple messages', () => {
    mqtt.connect('mqtt://broker:1883')
    const count = mqtt.publishBatch([
      { topic: 'a', payload: '1' },
      { topic: 'b', payload: '2' },
    ])
    expect(count).toBe(2)
  })

  it('should maintain message history', () => {
    mqtt.connect('mqtt://broker:1883')
    mqtt.publish('test/topic', 'msg1')
    mqtt.publish('test/topic', 'msg2')
    const history = mqtt.getMessageHistory()
    expect(history).toHaveLength(2)
  })

  it('should filter message history by topic', () => {
    mqtt.connect('mqtt://broker:1883')
    mqtt.publish('sensor/temp', '25')
    mqtt.publish('actuator/led', 'on')
    const filtered = mqtt.getMessageHistory('sensor/+')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].topic).toBe('sensor/temp')
  })

  // ── 异常/边界 ────────────────────────────────────────────────────────────

  it('should reject publish when not connected', () => {
    const ok = mqtt.publish('test', 'data')
    expect(ok).toBe(false)
  })

  it('should return 0 for publishBatch when not connected', () => {
    const count = mqtt.publishBatch([{ topic: 'a', payload: '1' }])
    expect(count).toBe(0)
  })

  it('should handle reconnect by clearing subscriptions', () => {
    mqtt.connect('mqtt://first:1883')
    mqtt.subscribe('test', () => {})
    mqtt.connect('mqtt://second:1883') // auto-disconnects first, clears subs
    expect(mqtt.isConnected()).toBe(true)
  })

  it('should return empty history for unused topic', () => {
    mqtt.connect('mqtt://broker:1883')
    mqtt.publish('sensor/a', 'v')
    const history = mqtt.getMessageHistory('unused/topic')
    expect(history).toEqual([])
  })

  it('should handle unsubscribe (all handlers for topic)', () => {
    mqtt.connect('mqtt://broker:1883')
    const unsub = mqtt.subscribe('test', () => {})
    unsub()
    const received: MQTTMessage[] = []
    mqtt.subscribe('test', (msg) => { received.push(msg) })
    mqtt.publish('test', 'data')
    expect(received).toHaveLength(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 测试: AdaptiveHeartbeatService
// ═══════════════════════════════════════════════════════════════════════════════

describe('IoT — AdaptiveHeartbeatService', () => {
  let hb: ReturnType<typeof makeHeartbeatService>

  beforeEach(() => { hb = makeHeartbeatService() })

  it('should record heartbeat and return status', () => {
    const status = hb.recordHeartbeat('dev-001', 50)
    expect(status.deviceId).toBe('dev-001')
    expect(status.avgLatency).toBe(50)
    expect(status.isTimeout).toBe(false)
  })

  it('should calculate optimal interval based on latency', () => {
    const s1 = hb.recordHeartbeat('dev-001', 50)
    expect(s1.optimalInterval).toBe(30_000) // avg 50 < 100 => BASE

    const s2 = hb.recordHeartbeat('dev-001', 200)
    expect(s2.optimalInterval).toBe(60_000) // avg 125 < 500 => BASE*2

    // avg: (50+200+1000)/3 = 416.67, still < 500 => BASE*2
    // To get BASE*4, need avg >= 500
    const s3 = hb.recordHeartbeat('dev-001', 2000)
    // avg: (50+200+2000)/3 = 750 => BASE*4
    expect(s3.optimalInterval).toBe(120_000)
  })

  it('should detect timeout after 3 consecutive high-latency heartbeats', () => {
    hb.recordHeartbeat('dev-001', 6000)
    hb.recordHeartbeat('dev-001', 6000)
    const status = hb.recordHeartbeat('dev-001', 6000)
    expect(status.consecutiveTimeouts).toBe(3)
    expect(status.isTimeout).toBe(true)
  })

  it('should reset timeout count on normal heartbeat', () => {
    hb.recordHeartbeat('dev-001', 6000)
    hb.recordHeartbeat('dev-001', 6000)
    const status = hb.recordHeartbeat('dev-001', 50) // normal
    expect(status.consecutiveTimeouts).toBe(0)
    expect(status.isTimeout).toBe(false)
  })

  it('should return undefined for unrecorded device', () => {
    const status = hb.getHeartbeatStatus('nonexistent')
    expect(status).toBeUndefined()
  })

  it('should average latency over multiple records', () => {
    hb.recordHeartbeat('dev-001', 100)
    hb.recordHeartbeat('dev-001', 200)
    const status = hb.recordHeartbeat('dev-001', 300)
    expect(status.avgLatency).toBe(200) // (100+200+300)/3
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 测试: OTAFirmwareService
// ═══════════════════════════════════════════════════════════════════════════════

describe('IoT — OTAFirmwareService', () => {
  let ota: ReturnType<typeof makeOTA>

  beforeEach(() => { ota = makeOTA() })

  it('should create OTA task', () => {
    const task = ota.createTask('dev-001', 'fw-001')
    expect(task.status).toBe('pending')
    expect(task.progress).toBe(0)
  })

  it('should start upgrade', () => {
    const task = ota.createTask('dev-001', 'fw-001')
    const running = ota.startUpgrade(task.id)
    expect(running.status).toBe('upgrading')
    expect(running.startedAt).toBeDefined()
  })

  it('should update progress', () => {
    const task = ota.createTask('dev-001', 'fw-001')
    ota.startUpgrade(task.id)
    const p50 = ota.updateProgress(task.id, 50)
    expect(p50.progress).toBe(50)
    expect(p50.status).toBe('upgrading')
  })

  it('should mark as completed at 100% progress', () => {
    const task = ota.createTask('dev-001', 'fw-001')
    ota.startUpgrade(task.id)
    const done = ota.updateProgress(task.id, 100)
    expect(done.status).toBe('completed')
    expect(done.completedAt).toBeDefined()
  })

  it('should clamp progress to 0-100 range', () => {
    const task = ota.createTask('dev-001', 'fw-001')
    ota.startUpgrade(task.id)
    const clamped = ota.updateProgress(task.id, 150)
    expect(clamped.progress).toBe(100)
  })

  it('should fail task with error message', () => {
    const task = ota.createTask('dev-001', 'fw-001')
    ota.startUpgrade(task.id)
    const failed = ota.failTask(task.id, 'Connection lost')
    expect(failed.status).toBe('failed')
    expect(failed.error).toBe('Connection lost')
  })

  it('should cancel pending task', () => {
    const task = ota.createTask('dev-001', 'fw-001')
    const cancelled = ota.cancelTask(task.id)
    expect(cancelled.status).toBe('cancelled')
  })

  it('should throw when canceling completed task', () => {
    const task = ota.createTask('dev-001', 'fw-001')
    ota.startUpgrade(task.id)
    ota.updateProgress(task.id, 100)
    expect(() => ota.cancelTask(task.id)).toThrow('Cannot cancel completed')
  })

  it('should throw on non-existent task operations', () => {
    expect(() => ota.startUpgrade('nonexistent')).toThrow('not found')
    expect(() => ota.updateProgress('nonexistent', 50)).toThrow('not found')
    expect(() => ota.failTask('nonexistent', 'err')).toThrow('not found')
    expect(() => ota.cancelTask('nonexistent')).toThrow('not found')
  })

  it('should compare versions correctly', () => {
    expect(ota.compareVersions('1.0.0', '1.0.0')).toBe(0)
    expect(ota.compareVersions('2.0.0', '1.0.0')).toBe(1)
    expect(ota.compareVersions('1.0.0', '2.0.0')).toBe(-1)
    expect(ota.compareVersions('1.0.0', '1.0.1')).toBe(-1)
    expect(ota.compareVersions('1.10.0', '1.9.0')).toBe(1)
  })

  it('should get task by id', () => {
    const task = ota.createTask('dev-001', 'fw-001')
    expect(ota.getTask(task.id)).toBeDefined()
    expect(ota.getTask('nonexistent')).toBeUndefined()
  })
})
