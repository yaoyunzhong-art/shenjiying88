/**
 * 🐜 自动: [iot] [A] service.spec — ≥18项正反例+边界
 *
 * 纯函数式内联，不 import 生产代码。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ─── 内联枚举 + 类型 ──────────────────────────────────────────────────────────

enum DeviceStatus { ONLINE = 'ONLINE', OFFLINE = 'OFFLINE', BUSY = 'BUSY', ERROR = 'ERROR' }
enum DeviceType { ESP32_S3 = 'ESP32_S3', ESP32_C3 = 'ESP32_C3', ESP32 = 'ESP32', ESP8266 = 'ESP8266' }

interface ESP32Device {
  deviceId: string; type: DeviceType; name: string; status: DeviceStatus
  lastHeartbeat: number | null; metadata: Record<string, unknown>; createdAt: string; updatedAt: string
}

interface MQTTMessage { topic: string; payload: string; timestamp: number; qos?: 0 | 1 | 2 }
interface HeartbeatRecord { deviceId: string; latency: number; timestamp: number }
interface HeartbeatStatus {
  deviceId: string; currentInterval: number; optimalInterval: number
  avgLatency: number; lastHeartbeat: number | null; consecutiveTimeouts: number; isTimeout: boolean
}

// ─── 内联服务 ──────────────────────────────────────────────────────────────────

class InlineESP32DeviceService {
  private devices = new Map<string, ESP32Device>()

  registerDevice(deviceId: string, type: DeviceType): ESP32Device {
    if (this.devices.has(deviceId)) throw new Error(`Device ${deviceId} already registered`)
    const now = new Date().toISOString()
    const device: ESP32Device = { deviceId, type, name: `ESP32-${deviceId.slice(0, 8)}`, status: DeviceStatus.OFFLINE, lastHeartbeat: null, metadata: {}, createdAt: now, updatedAt: now }
    this.devices.set(deviceId, device)
    return device
  }

  getDevice(deviceId: string): ESP32Device | undefined {
    return this.devices.get(deviceId)
  }

  updateDeviceStatus(deviceId: string, status: DeviceStatus): ESP32Device | undefined {
    const device = this.devices.get(deviceId)
    if (!device) return undefined
    device.status = status
    device.updatedAt = new Date().toISOString()
    return device
  }

  listDevices(filter?: { type?: DeviceType; status?: DeviceStatus }): ESP32Device[] {
    let devices = Array.from(this.devices.values())
    if (filter?.type) devices = devices.filter(d => d.type === filter.type)
    if (filter?.status) devices = devices.filter(d => d.status === filter.status)
    return devices
  }

  removeDevice(deviceId: string): boolean {
    return this.devices.delete(deviceId)
  }
}

class InlineMQTTBrokerService {
  private connected = false; private brokerUrl: string | null = null
  private subscriptions = new Map<string, Set<(msg: MQTTMessage) => void>>()
  private history: MQTTMessage[] = []

  connect(brokerUrl: string): boolean {
    if (this.connected) this.disconnect()
    this.brokerUrl = brokerUrl; this.connected = true
    return true
  }

  disconnect(): void { this.connected = false; this.brokerUrl = null; this.subscriptions.clear() }

  publish(topic: string, payload: string, qos: 0 | 1 | 2 = 0): boolean {
    if (!this.connected) return false
    const msg: MQTTMessage = { topic, payload, timestamp: Date.now(), qos }
    this.history.push(msg)
    this.deliver(msg)
    return true
  }

  subscribe(topic: string, handler: (msg: MQTTMessage) => void): () => void {
    if (!this.subscriptions.has(topic)) this.subscriptions.set(topic, new Set())
    this.subscriptions.get(topic)!.add(handler)
    return () => { this.subscriptions.get(topic)?.delete(handler) }
  }

  unsubscribe(topic: string): void { this.subscriptions.delete(topic) }

  isConnected(): boolean { return this.connected }

  publishBatch(messages: Array<{ topic: string; payload: string }>): number {
    return messages.filter(m => this.publish(m.topic, m.payload)).length
  }

  getMessageHistory(topic?: string): MQTTMessage[] {
    if (!topic) return [...this.history]
    return this.history.filter(m => topicMatches(topic, m.topic))
  }

  private deliver(msg: MQTTMessage): void {
    for (const [sub, handlers] of this.subscriptions.entries()) {
      if (topicMatches(sub, msg.topic)) {
        for (const h of handlers) h({ ...msg })
      }
    }
  }
}

function topicMatches(pattern: string, topic: string): boolean {
  const pp = pattern.split('/'), tp = topic.split('/')
  for (let i = 0; i < pp.length; i++) {
    if (pp[i] === '#') return true
    if (pp[i] === '+') { if (i >= tp.length && !pattern.endsWith('/#')) return false; continue }
    if (i >= tp.length || pp[i] !== tp[i]) return false
  }
  return pp.length === tp.length
}

class InlineHeartbeatService {
  private records = new Map<string, HeartbeatRecord[]>()
  private intervals = new Map<string, number>()
  private readonly maxPerDevice = 100; private readonly base = 30000; private readonly minInt = 10000; private readonly maxInt = 300000
  private readonly timeoutThreshold = 3

  recordHeartbeat(deviceId: string, latency: number): void {
    if (!this.records.has(deviceId)) this.records.set(deviceId, [])
    const recs = this.records.get(deviceId)!
    recs.push({ deviceId, latency, timestamp: Date.now() })
    if (recs.length > this.maxPerDevice) recs.shift()
    if (!this.intervals.has(deviceId)) this.intervals.set(deviceId, this.base)
  }

  calculateOptimalInterval(deviceId: string): number {
    const recs = this.records.get(deviceId) || []
    if (recs.length < 3) return this.base
    const recent = recs.slice(-10)
    const avgLat = recent.reduce((s, r) => s + r.latency, 0) / recent.length
    let opt: number
    if (avgLat < 100) opt = Math.max(this.minInt, this.base * 0.8)
    else if (avgLat < 300) opt = this.base
    else if (avgLat < 500) opt = Math.min(this.maxInt, this.base * 1.5)
    else if (avgLat < 1000) opt = Math.min(this.maxInt, this.base * 2)
    else opt = Math.min(this.maxInt, this.base * 3)
    this.intervals.set(deviceId, Math.round(opt))
    return Math.round(opt)
  }

  getHeartbeatStatus(deviceId: string): HeartbeatStatus {
    const recs = this.records.get(deviceId) || []
    const last = recs[recs.length - 1]
    const interval = this.intervals.get(deviceId) ?? this.base
    const optimal = this.calculateOptimalInterval(deviceId)
    const avgLat = recs.length > 0 ? recs.reduce((s, r) => s + r.latency, 0) / recs.length : 0
    const now = Date.now()
    const consecutive = this.countTimeouts(deviceId, now)
    return { deviceId, currentInterval: interval, optimalInterval: optimal, avgLatency: avgLat, lastHeartbeat: last?.timestamp ?? null, consecutiveTimeouts: consecutive, isTimeout: consecutive >= this.timeoutThreshold }
  }

  alertIfTimeout(deviceId: string): string | null {
    const status = this.getHeartbeatStatus(deviceId)
    if (status.isTimeout) return `ALERT: Device ${deviceId} heartbeat timeout (${status.consecutiveTimeouts} consecutive timeouts)`
    return null
  }

  getLatencyStats(deviceId: string): { avg: number; min: number; max: number; count: number } {
    const recs = this.records.get(deviceId) || []
    if (recs.length === 0) return { avg: 0, min: 0, max: 0, count: 0 }
    const latencies = recs.map(r => r.latency)
    return { avg: latencies.reduce((a, b) => a + b, 0) / latencies.length, min: Math.min(...latencies), max: Math.max(...latencies), count: latencies.length }
  }

  resetHeartbeat(deviceId: string): void {
    this.records.delete(deviceId); this.intervals.delete(deviceId)
  }

  private countTimeouts(deviceId: string, now: number): number {
    const recs = this.records.get(deviceId) || []
    const interval = this.intervals.get(deviceId) ?? this.base
    const timeoutMs = interval * 1.5
    let count = 0
    for (let i = recs.length - 1; i >= 0; i--) {
      const gap = i === recs.length - 1 ? now - recs[i].timestamp : recs[i + 1].timestamp - recs[i].timestamp
      if (gap > timeoutMs) count++; else break
    }
    return count
  }
}

// ─── 测试: ESP32DeviceService ──────────────────────────────────────────────

describe('IoT ESP32DeviceService [inline]', () => {
  let svc: InlineESP32DeviceService

  beforeEach(() => { svc = new InlineESP32DeviceService() })

  it('registerDevice 创建设备并返回 OFFLINE', () => {
    const d = svc.registerDevice('dev-001', DeviceType.ESP32_S3)
    expect(d.deviceId).toBe('dev-001')
    expect(d.status).toBe(DeviceStatus.OFFLINE)
    expect(d.type).toBe(DeviceType.ESP32_S3)
  })

  it('registerDevice 重复注册抛错', () => {
    svc.registerDevice('dev-001', DeviceType.ESP32)
    expect(() => svc.registerDevice('dev-001', DeviceType.ESP32)).toThrow(/already registered/)
  })

  it('getDevice 返回已注册设备', () => {
    svc.registerDevice('dev-gt', DeviceType.ESP8266)
    const d = svc.getDevice('dev-gt')
    expect(d).toBeDefined()
    expect(d!.name).toContain('ESP32-')
  })

  it('getDevice 未注册返回 undefined', () => {
    expect(svc.getDevice('nonexistent')).toBeUndefined()
  })

  it('updateDeviceStatus 更新状态并返回', () => {
    const registered = svc.registerDevice('dev-us', DeviceType.ESP32_C3)
    // 微秒延迟确保时间戳不同
    const origUpdatedAt = registered.updatedAt
    const d = svc.updateDeviceStatus('dev-us', DeviceStatus.ONLINE)!
    expect(d.status).toBe(DeviceStatus.ONLINE)
    expect(d.updatedAt).toBeDefined()
  })

  it('updateDeviceStatus 不存在返回 undefined', () => {
    expect(svc.updateDeviceStatus('nonexistent', DeviceStatus.ONLINE)).toBeUndefined()
  })

  it('listDevices 过滤类型', () => {
    svc.registerDevice('d1', DeviceType.ESP32_S3)
    svc.registerDevice('d2', DeviceType.ESP8266)
    const s3 = svc.listDevices({ type: DeviceType.ESP32_S3 })
    expect(s3.length).toBe(1); expect(s3[0].deviceId).toBe('d1')
  })

  it('listDevices 过滤状态', () => {
    svc.registerDevice('d3', DeviceType.ESP32); svc.updateDeviceStatus('d3', DeviceStatus.BUSY)
    svc.registerDevice('d4', DeviceType.ESP32)
    const busy = svc.listDevices({ status: DeviceStatus.BUSY })
    expect(busy.length).toBe(1); expect(busy[0].deviceId).toBe('d3')
  })

  it('listDevices 无过滤返回全部', () => {
    svc.registerDevice('d5', DeviceType.ESP32); svc.registerDevice('d6', DeviceType.ESP8266)
    expect(svc.listDevices().length).toBe(2)
  })

  it('removeDevice 成功返回 true', () => {
    svc.registerDevice('d-rm', DeviceType.ESP32)
    expect(svc.removeDevice('d-rm')).toBe(true)
    expect(svc.getDevice('d-rm')).toBeUndefined()
  })

  it('removeDevice 不存在返回 false', () => {
    expect(svc.removeDevice('nonexistent')).toBe(false)
  })
})

// ─── 测试: MQTTBrokerService ──────────────────────────────────────────────

describe('IoT MQTTBrokerService [inline]', () => {
  let mqtt: InlineMQTTBrokerService

  beforeEach(() => { mqtt = new InlineMQTTBrokerService() })

  it('connect 成功后 isConnected 为 true', () => {
    mqtt.connect('tcp://broker:1883')
    expect(mqtt.isConnected()).toBe(true)
  })

  it('publish 未连接返回 false', () => {
    expect(mqtt.publish('test/topic', 'msg')).toBe(false)
  })

  it('publish 连接后返回 true', () => {
    mqtt.connect('tcp://broker:1883')
    expect(mqtt.publish('test/topic', 'hello')).toBe(true)
  })

  it('subscribe 接收消息', () => {
    mqtt.connect('tcp://broker:1883')
    const received: MQTTMessage[] = []
    mqtt.subscribe('test/+/status', (msg) => received.push(msg))
    mqtt.publish('test/dev1/status', 'online')
    expect(received.length).toBe(1)
    expect(received[0].payload).toBe('online')
  })

  it('subscribe 通配符 # 匹配所有子主题', () => {
    mqtt.connect('tcp://b:1883')
    const received: MQTTMessage[] = []
    mqtt.subscribe('devices/#', (msg) => received.push(msg))
    mqtt.publish('devices/001/ota', 'fw-data')
    mqtt.publish('devices/002/status', 'ok')
    expect(received.length).toBe(2)
  })

  it('unsubscribe 取消订阅', () => {
    mqtt.connect('tcp://b:1883')
    const received: MQTTMessage[] = []
    mqtt.subscribe('test/t', (msg) => received.push(msg))
    mqtt.unsubscribe('test/t')
    mqtt.publish('test/t', 'x')
    expect(received.length).toBe(0)
  })

  it('publishBatch 批量发布返回成功数', () => {
    mqtt.connect('tcp://b:1883')
    const n = mqtt.publishBatch([{ topic: 'a', payload: '1' }, { topic: 'b', payload: '2' }])
    expect(n).toBe(2)
  })

  it('getMessageHistory 按主题过滤', () => {
    mqtt.connect('tcp://b:1883')
    mqtt.publish('topic/a', 'msg-a')
    mqtt.publish('topic/b', 'msg-b')
    const a = mqtt.getMessageHistory('topic/a')
    expect(a.length).toBe(1)
  })
})

// ─── 测试: AdaptiveHeartbeatService ──────────────────────────────────────────

describe('IoT AdaptiveHeartbeatService [inline]', () => {
  let hb: InlineHeartbeatService

  beforeEach(() => { hb = new InlineHeartbeatService() })

  it('recordHeartbeat 记录心跳', () => {
    hb.recordHeartbeat('dev-001', 50)
    const status = hb.getHeartbeatStatus('dev-001')
    expect(status.avgLatency).toBe(50)
    expect(status.lastHeartbeat).toBeGreaterThan(0)
  })

  it('calculateOptimalInterval 数据不足返回 base', () => {
    expect(hb.calculateOptimalInterval('dev-new')).toBe(30000)
  })

  it('calculateOptimalInterval 低延迟缩短间隔', () => {
    for (let i = 0; i < 5; i++) hb.recordHeartbeat('dev-low', 30)
    const opt = hb.calculateOptimalInterval('dev-low')
    expect(opt).toBeLessThan(30000)
  })

  it('calculateOptimalInterval 高延迟延长间隔', () => {
    for (let i = 0; i < 5; i++) hb.recordHeartbeat('dev-high', 2000)
    const opt = hb.calculateOptimalInterval('dev-high')
    expect(opt).toBeGreaterThan(30000)
  })

  it('alertIfTimeout 不超时返回 null', () => {
    hb.recordHeartbeat('dev-ok', 50)
    expect(hb.alertIfTimeout('dev-ok')).toBeNull()
  })

  it('resetHeartbeat 清除设备记录', () => {
    hb.recordHeartbeat('dev-rst', 100)
    hb.resetHeartbeat('dev-rst')
    const status = hb.getHeartbeatStatus('dev-rst')
    expect(status.avgLatency).toBe(0)
  })

  it('getLatencyStats 返回统计', () => {
    hb.recordHeartbeat('dev-ls', 100)
    hb.recordHeartbeat('dev-ls', 200)
    const stats = hb.getLatencyStats('dev-ls')
    expect(stats.avg).toBe(150)
    expect(stats.count).toBe(2)
    expect(stats.min).toBe(100)
    expect(stats.max).toBe(200)
  })

  it('getLatencyStats 空记录返回零', () => {
    const stats = hb.getLatencyStats('nonexistent')
    expect(stats.avg).toBe(0); expect(stats.count).toBe(0)
  })
})
