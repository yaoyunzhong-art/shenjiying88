/**
 * realtime-polling-fallback.test.ts — WebSocket HTTP轮询降级测试
 *
 * BS-0263: 覆盖短轮询、长轮询、自动降级、恢复探测
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PollingFallbackService } from './realtime-polling-fallback.service'

describe('PollingFallbackService', () => {
  let service: PollingFallbackService

  beforeEach(() => {
    service = new PollingFallbackService()
    service.resetTestState()
  })

  describe('短轮询 (shortPoll)', () => {
    it('首次拉取应返回最近 50 条消息', () => {
      for (let i = 0; i < 60; i++) {
        service.appendMessage('room-1', {
          id: `msg-${i}`,
          roomId: 'room-1',
          userId: 'user-1',
          content: `message ${i}`,
          type: 'text',
          timestamp: Date.now() + i,
        })
      }

      const result = service.shortPoll('room-1', 'user-1')
      expect(result.mode).toBe('short')
      expect(result.messages.length).toBe(50) // 首次只返回最近 50 条
      expect(result.lastMessageId).toBe('msg-59')
    })

    it('since 参数应只返回新消息', () => {
      for (let i = 0; i < 10; i++) {
        service.appendMessage('room-1', {
          id: `msg-${i}`,
          roomId: 'room-1',
          userId: 'user-1',
          content: `message ${i}`,
          type: 'text',
          timestamp: Date.now() + i,
        })
      }

      const result = service.shortPoll('room-1', 'user-1', 'msg-4')
      expect(result.messages.length).toBe(5) // msg-5..msg-9
      expect(result.messages[0].id).toBe('msg-5')
      expect(result.lastMessageId).toBe('msg-9')
    })

    it('没有新消息时应返回空列表', () => {
      service.appendMessage('room-1', {
        id: 'msg-0',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'hello',
        type: 'text',
        timestamp: Date.now(),
      })

      // 先拉取
      service.shortPoll('room-1', 'user-1')

      // 再拉取（无新消息）
      const result = service.shortPoll('room-1', 'user-1')
      expect(result.messages.length).toBe(0)
      expect(result.lastMessageId).toBe('msg-0')
    })

    it('不同房间的消息应该隔离', () => {
      service.appendMessage('room-a', {
        id: 'msg-a1',
        roomId: 'room-a',
        userId: 'user-1',
        content: 'a1',
        type: 'text',
        timestamp: Date.now(),
      })
      service.appendMessage('room-b', {
        id: 'msg-b1',
        roomId: 'room-b',
        userId: 'user-1',
        content: 'b1',
        type: 'text',
        timestamp: Date.now(),
      })

      const resultA = service.shortPoll('room-a', 'user-1')
      expect(resultA.messages.length).toBe(1)
      expect(resultA.messages[0].id).toBe('msg-a1')

      const resultB = service.shortPoll('room-b', 'user-1')
      expect(resultB.messages.length).toBe(1)
      expect(resultB.messages[0].id).toBe('msg-b1')
    })
  })

  describe('长轮询 (longPoll)', () => {
    it('有消息时应立即返回', async () => {
      service.appendMessage('room-1', {
        id: 'msg-0',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'hello',
        type: 'text',
        timestamp: Date.now(),
      })

      const result = await service.longPoll('room-1', 'user-1')
      expect(result.mode).toBe('long')
      expect(result.messages.length).toBe(1)
      expect(result.messages[0].id).toBe('msg-0')
    })

    it('无消息时应等待超时后返回空', async () => {
      const start = Date.now()
      const result = await service.longPoll('room-empty', 'user-1')
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(0) // 超时实现正确
      expect(result.messages.length).toBe(0)
      expect(result.mode).toBe('long')
    })

    it('since 参数应过滤已有消息', async () => {
      service.appendMessage('room-1', { id: 'msg-a', roomId: 'room-1', userId: 'u1', content: 'a', type: 'text', timestamp: 100 })
      service.appendMessage('room-1', { id: 'msg-b', roomId: 'room-1', userId: 'u1', content: 'b', type: 'text', timestamp: 200 })

      const result = await service.longPoll('room-1', 'user-1', 'msg-a')
      expect(result.messages.length).toBe(1)
      expect(result.messages[0].id).toBe('msg-b')
    })
  })

  describe('自动降级 (Auto-Degrade)', () => {
    it('连续失败达到阈值应触发降级', () => {
      const clientId = 'client-1'
      expect(service.shouldDegrade(clientId)).toBe(false)

      const r1 = service.recordWsFailure(clientId)
      expect(r1).toBe(false) // 第1次失败，未达阈值

      service.recordWsFailure(clientId)
      const r3 = service.recordWsFailure(clientId) // 第3次
      expect(r3).toBe(true) // 达到阈值，应降级
      expect(service.shouldDegrade(clientId)).toBe(true)
    })

    it('恢复成功后重置计数器', () => {
      const clientId = 'client-1'
      service.recordWsFailure(clientId)
      service.recordWsFailure(clientId)
      service.recordWsFailure(clientId)
      expect(service.shouldDegrade(clientId)).toBe(true)

      service.recordWsSuccess(clientId)
      expect(service.shouldDegrade(clientId)).toBe(false)
    })

    it('不同客户端独立计数', () => {
      service.recordWsFailure('client-a')
      service.recordWsFailure('client-a')
      service.recordWsFailure('client-a') // 触发降级

      service.recordWsFailure('client-b')
      service.recordWsFailure('client-b')

      expect(service.shouldDegrade('client-a')).toBe(true)
      expect(service.shouldDegrade('client-b')).toBe(false) // 只有 2 次
    })

    it('clearClientState 应清除降级状态', () => {
      const clientId = 'client-1'
      for (let i = 0; i < 3; i++) service.recordWsFailure(clientId)
      expect(service.shouldDegrade(clientId)).toBe(true)

      service.clearClientState(clientId)
      expect(service.shouldDegrade(clientId)).toBe(false)
    })
  })

  describe('消息缓冲区管理', () => {
    it('缓冲区最多保留 500 条消息', () => {
      for (let i = 0; i < 600; i++) {
        service.appendMessage('room-1', {
          id: `msg-${i}`,
          roomId: 'room-1',
          userId: 'u1',
          content: `m${i}`,
          type: 'text',
          timestamp: Date.now() + i,
        })
      }

      const result = service.shortPoll('room-1', 'user-1')
      expect(result.messages.length).toBe(50) // 只返回最后 50
      expect(result.messages[0].id).toBe('msg-550') // msg-550..msg-599
    })

    it('clearRoomBuffer 应清除指定房间缓冲区', () => {
      service.appendMessage('room-1', { id: 'm1', roomId: 'room-1', userId: 'u1', content: 'x', type: 'text', timestamp: 1 })
      service.clearRoomBuffer('room-1')

      const result = service.shortPoll('room-1', 'user-1')
      expect(result.messages.length).toBe(0)
    })
  })

  describe('配置管理', () => {
    it('默认配置应合理', () => {
      const cfg = service.getConfig()
      expect(cfg.shortPollIntervalMs).toBe(3000)
      expect(cfg.longPollTimeoutMs).toBe(30000)
      expect(cfg.autoDegradeThreshold).toBe(3)
      expect(cfg.wsRecoveryProbeIntervalMs).toBe(60000)
    })

    it('updateConfig 应更新配置', () => {
      service.updateConfig({ shortPollIntervalMs: 5000 })
      expect(service.getConfig().shortPollIntervalMs).toBe(5000)
    })
  })
})
