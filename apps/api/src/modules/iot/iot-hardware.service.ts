import { Injectable, Logger } from '@nestjs/common'

// ── Types ─────────────────────────────────────────────────────────────────────

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
}

export enum DeviceType {
  ESP32_S3 = 'ESP32_S3',
  ESP32_C3 = 'ESP32_C3',
  ESP32 = 'ESP32',
  ESP8266 = 'ESP8266',
}

export interface ESP32Device {
  deviceId: string
  type: DeviceType
  name: string
  status: DeviceStatus
  lastHeartbeat: number | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface MQTTMessage {
  topic: string
  payload: string
  timestamp: number
  qos?: 0 | 1 | 2
}

export interface HeartbeatRecord {
  deviceId: string
  latency: number
  timestamp: number
}

export interface HeartbeatStatus {
  deviceId: string
  currentInterval: number
  optimalInterval: number
  avgLatency: number
  lastHeartbeat: number | null
  consecutiveTimeouts: number
  isTimeout: boolean
}

// ── ESP32Device Service ───────────────────────────────────────────────────────

@Injectable()
export class ESP32DeviceService {
  private readonly logger = new Logger(ESP32DeviceService.name)
  private readonly devices: Map<string, ESP32Device> = new Map()

  /**
   * 注册新设备
   */
  registerDevice(deviceId: string, type: DeviceType): ESP32Device {
    const existing = this.devices.get(deviceId)
    if (existing) {
      throw new Error(`Device ${deviceId} already registered`)
    }

    const now = new Date().toISOString()
    const device: ESP32Device = {
      deviceId,
      type,
      name: `ESP32-${deviceId.slice(0, 8)}`,
      status: DeviceStatus.OFFLINE,
      lastHeartbeat: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    }

    this.devices.set(deviceId, device)
    this.logger.log(`Device registered: ${deviceId} (${type})`)
    return device
  }

  /**
   * 获取设备信息
   */
  getDevice(deviceId: string): ESP32Device | undefined {
    return this.devices.get(deviceId)
  }

  /**
   * 更新设备状态
   */
  updateDeviceStatus(deviceId: string, status: DeviceStatus): ESP32Device | undefined {
    const device = this.devices.get(deviceId)
    if (!device) {
      this.logger.warn(`Device not found: ${deviceId}`)
      return undefined
    }

    device.status = status
    device.updatedAt = new Date().toISOString()
    this.logger.log(`Device ${deviceId} status updated to ${status}`)
    return device
  }

  /**
   * 列出设备，支持按类型/状态过滤
   */
  listDevices(filter?: { type?: DeviceType; status?: DeviceStatus }): ESP32Device[] {
    let devices = Array.from(this.devices.values())

    if (filter?.type) {
      devices = devices.filter((d) => d.type === filter.type)
    }
    if (filter?.status) {
      devices = devices.filter((d) => d.status === filter.status)
    }

    return devices
  }

  /**
   * 删除设备
   */
  removeDevice(deviceId: string): boolean {
    const deleted = this.devices.delete(deviceId)
    if (deleted) {
      this.logger.log(`Device removed: ${deviceId}`)
    }
    return deleted
  }
}

// ── MQTTBrokerService ─────────────────────────────────────────────────────────

type MessageHandler = (message: MQTTMessage) => void

@Injectable()
export class MQTTBrokerService {
  private readonly logger = new Logger(MQTTBrokerService.name)
  private connected = false
  private brokerUrl: string | null = null
  private subscriptions: Map<string, Set<MessageHandler>> = new Map()
  private messageHistory: MQTTMessage[] = []
  private maxHistory = 1000

  /**
   * 连接 MQTT Broker
   */
  connect(brokerUrl: string): boolean {
    if (this.connected) {
      this.logger.warn(`Already connected to ${this.brokerUrl}, disconnecting first`)
      this.disconnect()
    }

    this.brokerUrl = brokerUrl
    this.connected = true
    this.logger.log(`Connected to MQTT Broker: ${brokerUrl}`)
    return true
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.connected = false
    this.brokerUrl = null
    this.subscriptions.clear()
    this.logger.log('Disconnected from MQTT Broker')
  }

  /**
   * 发布消息到主题
   */
  publish(topic: string, payload: string, qos: 0 | 1 | 2 = 0): boolean {
    if (!this.connected) {
      this.logger.error('Cannot publish: not connected to broker')
      return false
    }

    const message: MQTTMessage = {
      topic,
      payload,
      timestamp: Date.now(),
      qos,
    }

    this.messageHistory.push(message)
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift()
    }

    this.logger.debug(`Published to ${topic}: ${payload}`)
    this.deliverToSubscribers(message)
    return true
  }

  /**
   * 订阅主题
   */
  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set())
    }

    this.subscriptions.get(topic)!.add(handler)
    this.logger.log(`Subscribed to topic: ${topic}`)

    return () => {
      this.unsubscribe(topic, handler)
    }
  }

  /**
   * 取消订阅（可选指定处理器）
   */
  unsubscribe(topic: string, handler?: MessageHandler): void {
    if (!handler) {
      this.subscriptions.delete(topic)
      this.logger.log(`Unsubscribed from topic: ${topic}`)
      return
    }

    const handlers = this.subscriptions.get(topic)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.subscriptions.delete(topic)
      }
    }
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * 批量发布（用于固件推送等场景）
   */
  publishBatch(messages: Array<{ topic: string; payload: string }>): number {
    let successCount = 0
    for (const msg of messages) {
      if (this.publish(msg.topic, msg.payload)) {
        successCount++
      }
    }
    return successCount
  }

  /**
   * 投递消息给订阅者
   */
  private deliverToSubscribers(message: MQTTMessage): void {
    const { topic, payload } = message

    for (const [subTopic, handlers] of this.subscriptions.entries()) {
      if (topicMatches(subTopic, topic)) {
        for (const handler of handlers) {
          try {
            handler({ ...message })
          } catch (err) {
            this.logger.error(`Handler error for topic ${subTopic}: ${err}`)
          }
        }
      }
    }
  }

  /**
   * 获取消息历史
   */
  getMessageHistory(topic?: string): MQTTMessage[] {
    if (!topic) {
      return [...this.messageHistory]
    }
    return this.messageHistory.filter((m) => topicMatches(topic, m.topic))
  }
}

// ── AdaptiveHeartbeatService ──────────────────────────────────────────────────

@Injectable()
export class AdaptiveHeartbeatService {
  private readonly logger = new Logger(AdaptiveHeartbeatService.name)

  // 心跳记录（滑动窗口）
  private heartbeatRecords: Map<string, HeartbeatRecord[]> = new Map()
  private readonly maxRecordsPerDevice = 100

  // 当前心跳间隔配置
  private heartbeatIntervals: Map<string, number> = new Map()

  // 超时告警阈值
  private readonly baseInterval = 30_000 // 30s 基础间隔
  private readonly minInterval = 10_000 // 最小 10s
  private readonly maxInterval = 300_000 // 最大 5min
  private readonly timeoutThreshold = 3 // 连续3次超时触发告警

  // 延迟统计
  private latencyStats: Map<string, { sum: number; count: number }> = new Map()

  /**
   * 记录心跳
   */
  recordHeartbeat(deviceId: string, latency: number): void {
    const now = Date.now()
    const record: HeartbeatRecord = { deviceId, latency, timestamp: now }

    if (!this.heartbeatRecords.has(deviceId)) {
      this.heartbeatRecords.set(deviceId, [])
    }

    const records = this.heartbeatRecords.get(deviceId)!
    records.push(record)

    // 保持滑动窗口
    if (records.length > this.maxRecordsPerDevice) {
      records.shift()
    }

    // 更新延迟统计
    const stats = this.latencyStats.get(deviceId) || { sum: 0, count: 0 }
    stats.sum += latency
    stats.count += 1
    this.latencyStats.set(deviceId, stats)

    // 初始化间隔（如果尚未设置）
    if (!this.heartbeatIntervals.has(deviceId)) {
      this.heartbeatIntervals.set(deviceId, this.baseInterval)
    }

    this.logger.debug(
      `Heartbeat recorded for ${deviceId}: latency=${latency}ms, interval=${this.heartbeatIntervals.get(deviceId)}ms`
    )
  }

  /**
   * 计算最优心跳间隔（根据延迟动态调整）
   * - 延迟高 -> 延长间隔减少网络负担
   * - 延迟低 -> 缩短间隔提高响应速度
   */
  calculateOptimalInterval(deviceId: string): number {
    const records = this.heartbeatRecords.get(deviceId) || []
    if (records.length < 3) {
      // 数据不足，使用基础间隔
      return this.baseInterval
    }

    // 计算最近 N 次的平均延迟
    const recentRecords = records.slice(-10)
    const avgLatency =
      recentRecords.reduce((sum, r) => sum + r.latency, 0) / recentRecords.length

    // 自适应算法：
    // - latency < 100ms: 快速响应，interval = base
    // - latency 100-500ms: 略微延长
    // - latency > 500ms: 大幅延长
    let optimalInterval: number

    if (avgLatency < 100) {
      // 延迟很低，使用较短间隔
      optimalInterval = Math.max(this.minInterval, this.baseInterval * 0.8)
    } else if (avgLatency < 300) {
      optimalInterval = this.baseInterval
    } else if (avgLatency < 500) {
      optimalInterval = Math.min(this.maxInterval, this.baseInterval * 1.5)
    } else if (avgLatency < 1000) {
      optimalInterval = Math.min(this.maxInterval, this.baseInterval * 2)
    } else {
      // 延迟超过 1s，大幅延长间隔
      optimalInterval = Math.min(this.maxInterval, this.baseInterval * 3)
    }

    // 更新配置的间隔
    this.heartbeatIntervals.set(deviceId, Math.round(optimalInterval))
    this.logger.log(
      `Optimal interval for ${deviceId}: ${Math.round(optimalInterval)}ms (avgLatency=${avgLatency.toFixed(1)}ms)`
    )

    return Math.round(optimalInterval)
  }

  /**
   * 获取心跳状态
   */
  getHeartbeatStatus(deviceId: string): HeartbeatStatus {
    const records = this.heartbeatRecords.get(deviceId) || []
    const lastRecord = records[records.length - 1]
    const stats = this.latencyStats.get(deviceId)
    const currentInterval = this.heartbeatIntervals.get(deviceId) || this.baseInterval
    const optimalInterval = this.calculateOptimalInterval(deviceId)

    // 检查连续超时
    const now = Date.now()
    const consecutiveTimeouts = this.countConsecutiveTimeouts(deviceId, now)
    const isTimeout = consecutiveTimeouts >= this.timeoutThreshold

    return {
      deviceId,
      currentInterval,
      optimalInterval,
      avgLatency: stats ? stats.sum / stats.count : 0,
      lastHeartbeat: lastRecord?.timestamp || null,
      consecutiveTimeouts,
      isTimeout,
    }
  }

  /**
   * 超时告警
   */
  alertIfTimeout(deviceId: string): string | null {
    const status = this.getHeartbeatStatus(deviceId)
    if (status.isTimeout) {
      const alertMsg = `ALERT: Device ${deviceId} heartbeat timeout (${status.consecutiveTimeouts} consecutive timeouts)`
      this.logger.warn(alertMsg)
      return alertMsg
    }
    return null
  }

  /**
   * 获取设备的延迟统计
   */
  getLatencyStats(deviceId: string): { avg: number; min: number; max: number; count: number } {
    const records = this.heartbeatRecords.get(deviceId) || []
    if (records.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 }
    }

    const latencies = records.map((r) => r.latency)
    return {
      avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      count: latencies.length,
    }
  }

  /**
   * 计算连续超时次数
   */
  private countConsecutiveTimeouts(deviceId: string, now: number): number {
    const records = this.heartbeatRecords.get(deviceId) || []
    const interval = this.heartbeatIntervals.get(deviceId) || this.baseInterval
    const timeoutMs = interval * 1.5 // 超过 1.5 倍间隔视为超时

    let count = 0
    for (let i = records.length - 1; i >= 0; i--) {
      const gap = i === records.length - 1 ? now - records[i].timestamp : records[i + 1].timestamp - records[i].timestamp
      if (gap > timeoutMs) {
        count++
      } else {
        break
      }
    }
    return count
  }

  /**
   * 重置心跳记录（用于设备重新上线）
   */
  resetHeartbeat(deviceId: string): void {
    this.heartbeatRecords.delete(deviceId)
    this.latencyStats.delete(deviceId)
    this.heartbeatIntervals.delete(deviceId)
    this.logger.log(`Heartbeat reset for device: ${deviceId}`)
  }
}

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * MQTT 主题匹配（支持 + 和 # 通配符）
 */
function topicMatches(pattern: string, topic: string): boolean {
  const patternParts = pattern.split('/')
  const topicParts = topic.split('/')

  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i]

    if (p === '#') {
      return true // # 匹配剩余所有
    }

    if (p === '+') {
      // + 匹配单层
      if (i >= topicParts.length) {
        return i === patternParts.length - 1 && pattern.endsWith('/#')
      }
      continue
    }

    if (i >= topicParts.length || p !== topicParts[i]) {
      return false
    }
  }

  return patternParts.length === topicParts.length
}

// ── IoT Hardware Service (Facade) ────────────────────────────────────────────

/**
 * IoT 硬件抽象服务（门面模式，统一暴露三个子服务）
 */
@Injectable()
export class IoTHardwareService {
  constructor(
    readonly deviceService: ESP32DeviceService,
    readonly mqttService: MQTTBrokerService,
    readonly heartbeatService: AdaptiveHeartbeatService
  ) {}

  /**
   * 设备上线（注册 + 状态更新）
   */
  async deviceOnline(deviceId: string, type: DeviceType): Promise<ESP32Device> {
    const device = this.deviceService.registerDevice(deviceId, type)
    this.deviceService.updateDeviceStatus(deviceId, DeviceStatus.ONLINE)
    return device
  }

  /**
   * 设备下线
   */
  deviceOffline(deviceId: string): void {
    this.deviceService.updateDeviceStatus(deviceId, DeviceStatus.OFFLINE)
    this.heartbeatService.resetHeartbeat(deviceId)
  }

  /**
   * 发送 OTA 固件更新（通过 MQTT）
   */
  sendOTAUpdate(deviceId: string, firmwareUrl: string): boolean {
    return this.mqttService.publish(`devices/${deviceId}/ota`, JSON.stringify({ firmwareUrl }))
  }

  /**
   * 处理设备心跳
   */
  handleHeartbeat(deviceId: string, latency: number): HeartbeatStatus {
    this.heartbeatService.recordHeartbeat(deviceId, latency)
    const status = this.heartbeatService.getHeartbeatStatus(deviceId)

    if (status.isTimeout) {
      this.heartbeatService.alertIfTimeout(deviceId)
      this.deviceService.updateDeviceStatus(deviceId, DeviceStatus.ERROR)
    }

    return status
  }
}
