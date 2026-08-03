/**
 * 🐜 自动: [terminal] [A] MQTT 连接管理 + 心跳测试
 *
 * WP-12A: 终端三合一底座 — MQTT 基础
 * - 连接/断开/重连
 * - 心跳上报
 * - 主题发布/订阅
 * - 消息推送
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  TerminalMqttService,
  MqttConnectionStatus,
  TERMINAL_TOPICS,
} from './terminal-mqtt.service'

function makeService(): TerminalMqttService {
  const svc = new TerminalMqttService()
  svc.resetForTests()
  return svc
}

function makeConfig(overrides: Partial<{
  brokerUrl: string
  clientId: string
  keepalive: number
  reconnectPeriod: number
  connectTimeout: number
}> = {}) {
  return {
    brokerUrl: overrides.brokerUrl ?? 'mqtt://localhost:1883',
    clientId: overrides.clientId ?? 'term-001',
    keepalive: overrides.keepalive ?? 60,
    reconnectPeriod: overrides.reconnectPeriod ?? 5000,
    connectTimeout: overrides.connectTimeout ?? 10000,
  }
}

describe('TerminalMqttService — WP-12A 连接管理', () => {
  let svc: TerminalMqttService

  beforeEach(() => {
    svc = makeService()
  })

  /* ── 正例: connect ── */
  it('connect 应返回 connected 状态和 connectionId', () => {
    const result = svc.connect(makeConfig())
    expect(result.status).toBe(MqttConnectionStatus.Connected)
    expect(result.connectionId).toContain('mqtt-term-001')
  })

  /* ── 正例: 多连接 ── */
  it('应支持多个独立连接', () => {
    const c1 = svc.connect(makeConfig({ clientId: 'term-001' }))
    const c2 = svc.connect(makeConfig({ clientId: 'term-002' }))
    expect(c1.connectionId).not.toBe(c2.connectionId)
    expect(svc.getActiveConnectionCount()).toBe(2)
  })

  /* ── 正例: disconnect ── */
  it('disconnect 应断开连接', () => {
    const { connectionId } = svc.connect(makeConfig())
    const result = svc.disconnect(connectionId)
    expect(result).toBe(true)
    expect(svc.getConnectionStatus(connectionId)).toBe(MqttConnectionStatus.Disconnected)
    expect(svc.getActiveConnectionCount()).toBe(0)
  })

  /* ── 反例: disconnect 不存在的连接 ── */
  it('disconnect 不存在的连接应返回 false', () => {
    expect(svc.disconnect('no-such')).toBe(false)
  })

  /* ── 反例: getConnectionStatus 不存在的连接 ── */
  it('不存在的连接状态应为 Disconnected', () => {
    expect(svc.getConnectionStatus('no-such')).toBe(MqttConnectionStatus.Disconnected)
  })
})

describe('TerminalMqttService — WP-12A 主题管理', () => {
  let svc: TerminalMqttService
  let connectionId: string

  beforeEach(() => {
    svc = makeService()
    connectionId = svc.connect(makeConfig()).connectionId
  })

  /* ── 正例: subscribe ── */
  it('subscribe 应成功订阅主题', () => {
    const result = svc.subscribe(connectionId, 'terminal/heartbeat')
    expect(result).toBe(true)
    const topics = svc.getSubscribedTopics(connectionId)
    expect(topics).toContain('terminal/heartbeat')
  })

  /* ── 正例: 多主题订阅 ── */
  it('应支持订阅多个主题', () => {
    svc.subscribe(connectionId, 'topic/1')
    svc.subscribe(connectionId, 'topic/2')
    svc.subscribe(connectionId, 'topic/3')
    expect(svc.getSubscribedTopics(connectionId)).toHaveLength(3)
  })

  /* ── 正例: unsubscribe ── */
  it('unsubscribe 应取消订阅', () => {
    svc.subscribe(connectionId, 'topic/1')
    const result = svc.unsubscribe(connectionId, 'topic/1')
    expect(result).toBe(true)
    expect(svc.getSubscribedTopics(connectionId)).not.toContain('topic/1')
  })

  /* ── 反例: 未连接的连接订阅应失败 ── */
  it('未连接的 connectionId 订阅应返回 false', () => {
    expect(svc.subscribe('no-such', 'topic')).toBe(false)
  })

  /* ── 反例: 未连接的连接取消订阅应失败 ── */
  it('未连接的 connectionId 取消订阅应返回 false', () => {
    expect(svc.unsubscribe('no-such', 'topic')).toBe(false)
  })
})

describe('TerminalMqttService — WP-12A 发布消息', () => {
  let svc: TerminalMqttService
  let connectionId: string

  beforeEach(() => {
    svc = makeService()
    connectionId = svc.connect(makeConfig()).connectionId
  })

  /* ── 正例: publish ── */
  it('publish 应成功发布消息', () => {
    const result = svc.publish(connectionId, 'test/topic', 'hello', 1)
    expect(result).toBe(true)
  })

  /* ── 正例: publishHeartbeat ── */
  it('publishHeartbeat 应发布心跳消息', () => {
    const result = svc.publishHeartbeat(connectionId, 'term-001', 15)
    expect(result).toBe(true)
    const logs = svc.getMessageHistory(connectionId)
    expect(logs.length).toBeGreaterThanOrEqual(1)
    const lastMsg = logs[logs.length - 1]
    expect(lastMsg!.topic).toBe(TERMINAL_TOPICS.HEARTBEAT)
  })

  /* ── 正例: publishQueueUpdate ── */
  it('publishQueueUpdate 应发布排队更新', () => {
    const result = svc.publishQueueUpdate(connectionId, 't1', 'r1', {
      action: 'join',
      queueEntryId: 'qe-1',
      queueNumber: 'B001',
      waitingCount: 5,
    })
    expect(result).toBe(true)
  })

  /* ── 正例: publishCallNotification ── */
  it('publishCallNotification 应发布叫号通知', () => {
    const result = svc.publishCallNotification(
      connectionId,
      'term-001',
      'B001',
      '包间A',
    )
    expect(result).toBe(true)
  })

  /* ── 反例: 未连接时发布应失败 ── */
  it('未连接的 connectionId 发布应返回 false', () => {
    expect(svc.publish('no-such', 'topic', 'payload')).toBe(false)
  })

  /* ── 边界: QoS 0/1/2 均支持 ── */
  it('应支持 qos 0, 1, 2', () => {
    expect(svc.publish(connectionId, 't/1', 'p', 0)).toBe(true)
    expect(svc.publish(connectionId, 't/2', 'p', 1)).toBe(true)
    expect(svc.publish(connectionId, 't/3', 'p', 2)).toBe(true)
  })
})

describe('TerminalMqttService — WP-12A 消息历史', () => {
  let svc: TerminalMqttService
  let connectionId: string

  beforeEach(() => {
    svc = makeService()
    connectionId = svc.connect(makeConfig()).connectionId
  })

  /* ── 正例: getMessageHistory ── */
  it('getMessageHistory 应返回消息历史', () => {
    svc.publish(connectionId, 't/1', 'msg1')
    svc.publish(connectionId, 't/2', 'msg2')
    const history = svc.getMessageHistory(connectionId)
    expect(history).toHaveLength(2)
  })

  /* ── 边界: 空历史 ── */
  it('空连接的消息历史应返回空数组', () => {
    expect(svc.getMessageHistory('no-such')).toEqual([])
  })

  /* ── 边界: limit 参数 ── */
  it('getMessageHistory 支持 limit 参数', () => {
    for (let i = 0; i < 10; i++) {
      svc.publish(connectionId, `t/${i}`, `msg${i}`)
    }
    expect(svc.getMessageHistory(connectionId, 3)).toHaveLength(3)
  })
})

describe('TerminalMqttService — WP-12A 主题常量', () => {
  it('TERMINAL_TOPICS 应包含所有必要主题', () => {
    expect(TERMINAL_TOPICS.HEARTBEAT).toBe('terminal/heartbeat')
    expect(TERMINAL_TOPICS.STATUS_CHANGE).toBe('terminal/status')
    expect(TERMINAL_TOPICS.QUEUE_UPDATE).toBe('terminal/queue/update')
    expect(TERMINAL_TOPICS.QUEUE_CALL).toBe('terminal/queue/call')
  })
})
