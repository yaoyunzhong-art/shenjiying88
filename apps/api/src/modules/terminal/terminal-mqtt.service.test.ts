/**
 * terminal-mqtt.service.spec.ts — 终端 MQTT 连接管理 Service 单元测试
 *
 * 覆盖: connect / disconnect / subscribe / unsubscribe / publish /
 *       publishHeartbeat / publishQueueUpdate / publishCallNotification /
 *       getConnectionStatus / getSubscribedTopics / getMessageHistory /
 *       getActiveConnectionCount / resetForTests
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TerminalMqttService, MqttConnectionStatus, TERMINAL_TOPICS } from './terminal-mqtt.service'

describe('TerminalMqttService', () => {
  let svc: TerminalMqttService

  const validConfig = {
    brokerUrl: 'mqtt://broker.shenjiying88.com:1883',
    clientId: 'terminal-001',
    username: 'term-user',
    password: 'term-pass',
    keepalive: 60,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  }

  beforeEach(() => {
    svc = new TerminalMqttService()
    svc.resetForTests()
  })

  // ═══════════════════════════════════════════════════
  // connect
  // ═══════════════════════════════════════════════════

  describe('connect', () => {
    it('正例: 成功建立MQTT连接', () => {
      const result = svc.connect(validConfig)
      expect(result.connectionId).toMatch(/^mqtt-terminal-001-/)
      expect(result.status).toBe(MqttConnectionStatus.Connected)
    })

    it('正例: 同一clientId可多次连接（每次生成不同connectionId）', () => {
      const r1 = svc.connect(validConfig)
      const r2 = svc.connect(validConfig)
      expect(r1.connectionId).not.toBe(r2.connectionId)
    })

    it('正例: 连接后活跃连接数增加', () => {
      expect(svc.getActiveConnectionCount()).toBe(0)
      svc.connect(validConfig)
      expect(svc.getActiveConnectionCount()).toBe(1)
    })
  })

  // ═══════════════════════════════════════════════════
  // disconnect
  // ═══════════════════════════════════════════════════

  describe('disconnect', () => {
    it('正例: 断开已存在的连接', () => {
      const { connectionId } = svc.connect(validConfig)
      const result = svc.disconnect(connectionId)
      expect(result).toBe(true)
      expect(svc.getConnectionStatus(connectionId)).toBe(MqttConnectionStatus.Disconnected)
    })

    it('反例: 断开不存在的连接返回false', () => {
      const result = svc.disconnect('nonexistent-connection')
      expect(result).toBe(false)
    })

    it('正例: 断开后活跃连接数减少', () => {
      const { connectionId } = svc.connect(validConfig)
      expect(svc.getActiveConnectionCount()).toBe(1)
      svc.disconnect(connectionId)
      expect(svc.getActiveConnectionCount()).toBe(0)
    })
  })

  // ═══════════════════════════════════════════════════
  // subscribe / unsubscribe
  // ═══════════════════════════════════════════════════

  describe('subscribe', () => {
    it('正例: 订阅主题成功', () => {
      const { connectionId } = svc.connect(validConfig)
      const result = svc.subscribe(connectionId, TERMINAL_TOPICS.HEARTBEAT)
      expect(result).toBe(true)
    })

    it('正例: 可订阅多个主题', () => {
      const { connectionId } = svc.connect(validConfig)
      svc.subscribe(connectionId, TERMINAL_TOPICS.HEARTBEAT)
      svc.subscribe(connectionId, TERMINAL_TOPICS.QUEUE_UPDATE)
      const topics = svc.getSubscribedTopics(connectionId)
      expect(topics).toHaveLength(2)
    })

    it('反例: 不存在的连接返回false', () => {
      const result = svc.subscribe('fake-conn', 'test/topic')
      expect(result).toBe(false)
    })
  })

  describe('unsubscribe', () => {
    it('正例: 取消订阅成功', () => {
      const { connectionId } = svc.connect(validConfig)
      svc.subscribe(connectionId, TERMINAL_TOPICS.HEARTBEAT)
      const result = svc.unsubscribe(connectionId, TERMINAL_TOPICS.HEARTBEAT)
      expect(result).toBe(true)
      expect(svc.getSubscribedTopics(connectionId)).toHaveLength(0)
    })

    it('反例: 取消未订阅的主题返回false', () => {
      const { connectionId } = svc.connect(validConfig)
      const result = svc.unsubscribe(connectionId, 'never-subscribed')
      expect(result).toBe(false)
    })

    it('反例: 不存在的连接返回false', () => {
      const result = svc.unsubscribe('fake-conn', 'test/topic')
      expect(result).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════
  // publish
  // ═══════════════════════════════════════════════════

  describe('publish', () => {
    it('正例: 发布消息成功', () => {
      const { connectionId } = svc.connect(validConfig)
      const result = svc.publish(connectionId, 'test/topic', 'hello', 1, false)
      expect(result).toBe(true)
    })

    it('正例: 发布后消息记入历史', () => {
      const { connectionId } = svc.connect(validConfig)
      svc.publish(connectionId, 'test/topic', 'payload1', 1, false)
      svc.publish(connectionId, 'test/topic', 'payload2', 2, true)
      const history = svc.getMessageHistory(connectionId)
      expect(history).toHaveLength(2)
      expect(history[0].payload).toBe('payload1')
      expect(history[1].payload).toBe('payload2')
    })

    it('正例: 支持不同QoS级别', () => {
      const { connectionId } = svc.connect(validConfig)
      expect(svc.publish(connectionId, 'qos0/topic', 'data', 0, false)).toBe(true)
      expect(svc.publish(connectionId, 'qos1/topic', 'data', 1, false)).toBe(true)
      expect(svc.publish(connectionId, 'qos2/topic', 'data', 2, false)).toBe(true)
    })

    it('反例: 不存在的连接返回false', () => {
      const result = svc.publish('fake-conn', 'test/topic', 'data', 1, false)
      expect(result).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════
  // publishHeartbeat
  // ═══════════════════════════════════════════════════

  describe('publishHeartbeat', () => {
    it('正例: 发布心跳消息成功', () => {
      const { connectionId } = svc.connect(validConfig)
      const result = svc.publishHeartbeat(connectionId, 'term-001', 25)
      expect(result).toBe(true)
    })

    it('正例: 心跳消息记入历史且主题正确', () => {
      const { connectionId } = svc.connect(validConfig)
      svc.publishHeartbeat(connectionId, 'term-001', 50)
      const history = svc.getMessageHistory(connectionId)
      expect(history[0].topic).toBe(TERMINAL_TOPICS.HEARTBEAT)
      const payload = JSON.parse(history[0].payload)
      expect(payload.terminalId).toBe('term-001')
      expect(payload.latencyMs).toBe(50)
    })

    it('反例: 不存在的连接返回false', () => {
      const result = svc.publishHeartbeat('fake-conn', 'term-001', 10)
      expect(result).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════
  // publishQueueUpdate
  // ═══════════════════════════════════════════════════

  describe('publishQueueUpdate', () => {
    it('正例: 发布排队状态变更成功', () => {
      const { connectionId } = svc.connect(validConfig)
      const result = svc.publishQueueUpdate(connectionId, 'tenant-1', 'resource-1', {
        action: 'call',
        queueEntryId: 'qe-001',
        queueNumber: 'A001',
        waitingCount: 5,
      })
      expect(result).toBe(true)
    })

    it('正例: 排队消息支持所有action类型', () => {
      const { connectionId } = svc.connect(validConfig)
      const actions = ['join', 'leave', 'call', 'complete', 'cancel'] as const
      for (const action of actions) {
        const ok = svc.publishQueueUpdate(connectionId, 't', 'r', {
          action,
          queueEntryId: 'qe-001',
          queueNumber: 'A001',
          waitingCount: 0,
        })
        expect(ok).toBe(true)
      }
    })

    it('正例: 排队消息主题和QoS正确', () => {
      const { connectionId } = svc.connect(validConfig)
      svc.publishQueueUpdate(connectionId, 't', 'r', {
        action: 'join',
        queueEntryId: 'qe-002',
        queueNumber: 'B002',
        waitingCount: 3,
      })
      const history = svc.getMessageHistory(connectionId)
      expect(history[0].topic).toBe(TERMINAL_TOPICS.QUEUE_UPDATE)
      expect(history[0].qos).toBe(2)
    })
  })

  // ═══════════════════════════════════════════════════
  // publishCallNotification
  // ═══════════════════════════════════════════════════

  describe('publishCallNotification', () => {
    it('正例: 发布叫号通知成功', () => {
      const { connectionId } = svc.connect(validConfig)
      const result = svc.publishCallNotification(connectionId, 'term-001', 'A001', 'VR体验区')
      expect(result).toBe(true)
    })

    it('正例: 叫号消息主题正确', () => {
      const { connectionId } = svc.connect(validConfig)
      svc.publishCallNotification(connectionId, 'term-001', 'A002', '赛车区')
      const history = svc.getMessageHistory(connectionId)
      expect(history[0].topic).toBe(TERMINAL_TOPICS.QUEUE_CALL)
      const payload = JSON.parse(history[0].payload)
      expect(payload.queueNumber).toBe('A002')
      expect(payload.resourceName).toBe('赛车区')
    })
  })

  // ═══════════════════════════════════════════════════
  // getConnectionStatus / getSubscribedTopics / getMessageHistory
  // ═══════════════════════════════════════════════════

  describe('getConnectionStatus', () => {
    it('活跃连接返回Connected', () => {
      const { connectionId } = svc.connect(validConfig)
      expect(svc.getConnectionStatus(connectionId)).toBe(MqttConnectionStatus.Connected)
    })

    it('已断开连接返回Disconnected', () => {
      const { connectionId } = svc.connect(validConfig)
      svc.disconnect(connectionId)
      expect(svc.getConnectionStatus(connectionId)).toBe(MqttConnectionStatus.Disconnected)
    })

    it('不存在的连接返回Disconnected', () => {
      expect(svc.getConnectionStatus('unknown')).toBe(MqttConnectionStatus.Disconnected)
    })
  })

  describe('getSubscribedTopics', () => {
    it('未订阅时返回空数组', () => {
      const { connectionId } = svc.connect(validConfig)
      expect(svc.getSubscribedTopics(connectionId)).toEqual([])
    })

    it('订阅后返回主题列表', () => {
      const { connectionId } = svc.connect(validConfig)
      svc.subscribe(connectionId, TERMINAL_TOPICS.HEARTBEAT)
      svc.subscribe(connectionId, TERMINAL_TOPICS.STATUS_CHANGE)
      const topics = svc.getSubscribedTopics(connectionId)
      expect(topics).toContain(TERMINAL_TOPICS.HEARTBEAT)
      expect(topics).toContain(TERMINAL_TOPICS.STATUS_CHANGE)
    })

    it('不存在的连接返回空数组', () => {
      expect(svc.getSubscribedTopics('unknown')).toEqual([])
    })
  })

  describe('getMessageHistory', () => {
    it('尚无消息时返回空数组', () => {
      const { connectionId } = svc.connect(validConfig)
      expect(svc.getMessageHistory(connectionId)).toEqual([])
    })

    it('返回最近N条消息', () => {
      const { connectionId } = svc.connect(validConfig)
      for (let i = 0; i < 10; i++) {
        svc.publish(connectionId, 'test/topic', `msg-${i}`, 1, false)
      }
      const history = svc.getMessageHistory(connectionId, 3)
      expect(history).toHaveLength(3)
      expect(history[0].payload).toBe('msg-7')
      expect(history[2].payload).toBe('msg-9')
    })

    it('不存在的连接返回空数组', () => {
      expect(svc.getMessageHistory('unknown')).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════
  // getActiveConnectionCount / resetForTests
  // ═══════════════════════════════════════════════════

  describe('getActiveConnectionCount', () => {
    it('多个连接累加计数', () => {
      svc.connect(validConfig)
      svc.connect({ ...validConfig, clientId: 'terminal-002' })
      svc.connect({ ...validConfig, clientId: 'terminal-003' })
      expect(svc.getActiveConnectionCount()).toBe(3)
    })
  })

  describe('resetForTests', () => {
    it('重置后所有连接清空', () => {
      svc.connect(validConfig)
      svc.resetForTests()
      expect(svc.getActiveConnectionCount()).toBe(0)
    })

    it('重置后发布消息返回false', () => {
      const { connectionId } = svc.connect(validConfig)
      svc.resetForTests()
      expect(svc.publish(connectionId, 'test/topic', 'data', 1, false)).toBe(false)
    })
  })
})
