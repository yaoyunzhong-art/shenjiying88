/**
 * terminal-mqtt.service.ts — 终端 MQTT 连接管理
 *
 * WP-12A: 终端三合一底座 — MQTT 基础
 * - MQTT 连接管理（连接/断开/重连）
 * - 终端心跳 MQTT 上报
 * - 排队状态变更推送
 *
 * 独立于 IoT 模块的 ESP32 MQTT，专为门店排队终端设计。
 * 实际部署时可替换为真实的 MQTT.js 客户端。
 */

import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

// ── 连接状态 ──
export enum MqttConnectionStatus {
  Connected = 'connected',
  Disconnected = 'disconnected',
  Reconnecting = 'reconnecting',
  Error = 'error',
}

// ── MQTT 消息 ──
export interface MqttMessage {
  topic: string
  payload: string
  qos: 0 | 1 | 2
  retain: boolean
  timestamp: number
}

// ── MQTT 连接配置 ──
export interface MqttConnectionConfig {
  brokerUrl: string
  clientId: string
  username?: string
  password?: string
  keepalive: number
  reconnectPeriod: number
  connectTimeout: number
}

// ── 终端事件主题 ──
export const TERMINAL_TOPICS = {
  HEARTBEAT: 'terminal/heartbeat',
  STATUS_CHANGE: 'terminal/status',
  QUEUE_UPDATE: 'terminal/queue/update',
  QUEUE_CALL: 'terminal/queue/call',
} as const

// ── 内存模拟 MQTT 存储 ──
const connectedClients = new Map<string, MqttConnectionConfig>()
const messageLog = new Map<string, MqttMessage[]>()
const subscribedTopics = new Map<string, Set<string>>()

/**
 * TerminalMqttService
 *
 * MQTT 连接管理服务，管理终端与后端之间的 MQTT 连接。
 * 当前使用内存模拟，后续可替换为 mqtt.js。
 */
@Injectable()
export class TerminalMqttService {
  private readonly logger = new Logger(TerminalMqttService.name)

  /**
   * 创建 MQTT 连接
   * 返回 connectionId 用于后续操作
   */
  connect(config: MqttConnectionConfig): {
    connectionId: string
    status: MqttConnectionStatus
  } {
    const connectionId = `mqtt-${config.clientId}-${randomUUID().slice(0, 8)}`
    connectedClients.set(connectionId, config)
    messageLog.set(connectionId, [])
    subscribedTopics.set(connectionId, new Set())

    this.logger.log(`MQTT connected: ${connectionId} → ${config.brokerUrl}`)
    return {
      connectionId,
      status: MqttConnectionStatus.Connected,
    }
  }

  /**
   * 断开 MQTT 连接
   */
  disconnect(connectionId: string): boolean {
    if (!connectedClients.has(connectionId)) {
      return false
    }
    connectedClients.delete(connectionId)
    messageLog.delete(connectionId)
    subscribedTopics.delete(connectionId)
    this.logger.log(`MQTT disconnected: ${connectionId}`)
    return true
  }

  /**
   * 订阅主题
   */
  subscribe(connectionId: string, topic: string): boolean {
    const topics = subscribedTopics.get(connectionId)
    if (!topics) return false
    topics.add(topic)
    this.logger.log(`MQTT subscribed: ${connectionId} → ${topic}`)
    return true
  }

  /**
   * 取消订阅主题
   */
  unsubscribe(connectionId: string, topic: string): boolean {
    const topics = subscribedTopics.get(connectionId)
    if (!topics) return false
    const result = topics.delete(topic)
    if (result) {
      this.logger.log(`MQTT unsubscribed: ${connectionId} → ${topic}`)
    }
    return result
  }

  /**
   * 发布消息
   */
  publish(
    connectionId: string,
    topic: string,
    payload: string,
    qos: 0 | 1 | 2 = 1,
    retain = false,
  ): boolean {
    if (!connectedClients.has(connectionId)) {
      return false
    }

    const message: MqttMessage = {
      topic,
      payload,
      qos,
      retain,
      timestamp: Date.now(),
    }

    const logs = messageLog.get(connectionId)
    if (logs) {
      logs.push(message)
      if (logs.length > 200) logs.shift()
    }

    this.logger.log(`MQTT published: ${topic} (${connectionId})`)
    return true
  }

  /**
   * 终端心跳 MQTT 上报
   * 发布 heartbeat 主题消息
   */
  publishHeartbeat(
    connectionId: string,
    terminalId: string,
    latencyMs: number,
  ): boolean {
    const payload = JSON.stringify({
      terminalId,
      latencyMs,
      timestamp: Date.now(),
    })
    return this.publish(connectionId, TERMINAL_TOPICS.HEARTBEAT, payload, 1, false)
  }

  /**
   * 推送排队状态变更
   * 当队列状态发生变化时，通过 MQTT 推送给所有相关终端
   */
  publishQueueUpdate(
    connectionId: string,
    tenantId: string,
    resourceId: string,
    update: {
      action: 'join' | 'leave' | 'call' | 'complete' | 'cancel'
      queueEntryId: string
      queueNumber: string
      waitingCount: number
    },
  ): boolean {
    const payload = JSON.stringify({
      ...update,
      tenantId,
      resourceId,
      timestamp: Date.now(),
    })
    return this.publish(connectionId, TERMINAL_TOPICS.QUEUE_UPDATE, payload, 2, false)
  }

  /**
   * 推送叫号通知
   */
  publishCallNotification(
    connectionId: string,
    terminalId: string,
    queueNumber: string,
    resourceName: string,
  ): boolean {
    const payload = JSON.stringify({
      terminalId,
      queueNumber,
      resourceName,
      timestamp: Date.now(),
    })
    return this.publish(connectionId, TERMINAL_TOPICS.QUEUE_CALL, payload, 2, false)
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(connectionId: string): MqttConnectionStatus {
    if (connectedClients.has(connectionId)) {
      return MqttConnectionStatus.Connected
    }
    return MqttConnectionStatus.Disconnected
  }

  /**
   * 获取已订阅的主题列表
   */
  getSubscribedTopics(connectionId: string): string[] {
    const topics = subscribedTopics.get(connectionId)
    return topics ? Array.from(topics) : []
  }

  /**
   * 获取消息历史
   */
  getMessageHistory(connectionId: string, limit = 20): MqttMessage[] {
    const logs = messageLog.get(connectionId)
    if (!logs) return []
    return logs.slice(-limit)
  }

  /**
   * 获取活跃连接数
   */
  getActiveConnectionCount(): number {
    return connectedClients.size
  }

  /**
   * 清除所有连接（测试用）
   */
  resetForTests(): void {
    connectedClients.clear()
    messageLog.clear()
    subscribedTopics.clear()
  }
}
