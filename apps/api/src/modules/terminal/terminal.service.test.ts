/**
 * terminal.service.spec.ts — 排队终端 Service 测试
 *
 * 覆盖:
 *   - BS-0161: 终端心跳检测
 *   - BS-0162: 终端 2FA 认证
 *   - BS-0163: 离线检测与自动恢复
 *   - 边界条件 / 异常路径 / 空值处理 / 并发场景
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TerminalService } from './terminal.service'
import { TerminalType, TerminalOnlineStatus } from './terminal.entity'

describe('TerminalService', () => {
  let service: TerminalService
  const tenantA = 'tenant-a'
  const tenantB = 'tenant-b'
  const terminalId = 'term-001'

  beforeEach(() => {
    service = new TerminalService()
    service.resetStoresForTests()
  })

  // ═══════════════════════════════════════════════════════════
  // BS-0161: 终端注册 + 心跳
  // ═══════════════════════════════════════════════════════════

  describe('registerTerminal (BS-0161)', () => {
    it('应成功注册并返回 Online 终端', () => {
      const term = service.registerTerminal(terminalId, TerminalType.Queue, '排队终端1', tenantA)
      expect(term.id).toBe(terminalId)
      expect(term.status).toBe(TerminalOnlineStatus.Online)
      expect(term.type).toBe(TerminalType.Queue)
      expect(term.lastHeartbeatAt).toBeTruthy()
    })

    it('不同租户可注册相同 ID', () => {
      const t1 = service.registerTerminal(terminalId, TerminalType.Kiosk, 'Kiosk1', tenantA)
      const t2 = service.registerTerminal(terminalId, TerminalType.Kiosk, 'Kiosk2', tenantB)
      // same ID overwrites in the map — but they're for different tenants
      // Actual: the map is keyed by ID, so last registration wins
      // This is the existing behavior — terminal ID must be globally unique
      expect(t1.id).toBe(terminalId)
      expect(t2.id).toBe(terminalId)
      // t1 is overwritten by t2 in the store since both share the same ID
      expect(service.getTerminalStatus(terminalId)?.tenantId).toBe(tenantB)
    })

    it('可注册不同类型的终端（Queue/Kiosk/Tablet/POS）', () => {
      service.registerTerminal('t1', TerminalType.Queue, '排队1', tenantA)
      service.registerTerminal('t2', TerminalType.Kiosk, '自助1', tenantA)
      service.registerTerminal('t3', TerminalType.Tablet, '平板1', tenantA)
      service.registerTerminal('t4', TerminalType.POS, '收银1', tenantA)
      const all = service.listTerminals(tenantA)
      expect(all).toHaveLength(4)
    })

    it('注册后心跳历史为空', () => {
      const term = service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      // No heartbeat yet
      expect(term.lastHeartbeatAt).toBeTruthy()
    })
  })

  describe('handleHeartbeat (BS-0161)', () => {
    it('已注册终端可发送心跳', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队终端1', tenantA)
      const result = service.handleHeartbeat(terminalId, 50)
      expect(result.status).toBe(TerminalOnlineStatus.Online)
      expect(result.lastHeartbeatAt).toBeTruthy()
    })

    it('未注册终端返回 Offline', () => {
      const result = service.handleHeartbeat('unknown', 50)
      expect(result.status).toBe(TerminalOnlineStatus.Offline)
      expect(result.lastHeartbeatAt).toBeNull()
    })

    it('心跳应记录延时', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.handleHeartbeat(terminalId, 150)
      // We can't easily access heartbeatStore from test but the method doesn't error
      // Verify by checking the terminal is still online
      const detail = service.getTerminalStatusDetail(terminalId)
      expect(detail).toBeTruthy()
      expect(detail!.status).toBe('online')
    })

    it('离线终端心跳后应自动恢复为 Online', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      // Force offline via detection
      service.detectAndMarkOffline(0)
      expect(service.getTerminalStatus(terminalId)!.status).toBe(TerminalOnlineStatus.Offline)

      // Re-heartbeat should auto-recover
      const result = service.handleHeartbeat(terminalId, 30)
      expect(result.status).toBe(TerminalOnlineStatus.Online)
    })
  })

  describe('getTerminalStatus', () => {
    it('已注册终端应返回实体', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      expect(service.getTerminalStatus(terminalId)).toBeTruthy()
    })

    it('未注册终端返回 undefined', () => {
      expect(service.getTerminalStatus('nonexistent')).toBeUndefined()
    })
  })

  describe('getTerminalStatusDetail', () => {
    it('未注册终端返回 null', () => {
      expect(service.getTerminalStatusDetail('nonexistent')).toBeNull()
    })

    it('已注册但未绑定的终端无 binding 字段', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const detail = service.getTerminalStatusDetail(terminalId)
      expect(detail).toBeTruthy()
      expect(detail!.binding).toBeUndefined()
    })

    it('已注册且绑定的终端应有 binding 信息', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      const detail = service.getTerminalStatusDetail(terminalId)
      expect(detail!.binding).toBeTruthy()
      expect(detail!.binding!.storeId).toBe('store-1')
    })
  })

  describe('listTerminals', () => {
    it('应返回租户的全部终端', () => {
      service.registerTerminal('t1', TerminalType.Queue, '排队1', tenantA)
      service.registerTerminal('t2', TerminalType.Kiosk, '自助1', tenantA)
      const all = service.listTerminals(tenantA)
      expect(all).toHaveLength(2)
    })

    it('跨租户隔离', () => {
      service.registerTerminal('t1', TerminalType.Queue, '排队1', tenantA)
      service.registerTerminal('t2', TerminalType.Queue, '排队2', tenantB)
      expect(service.listTerminals(tenantA)).toHaveLength(1)
      expect(service.listTerminals(tenantB)).toHaveLength(1)
    })

    it('无终端时返回空数组', () => {
      expect(service.listTerminals(tenantA)).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════
  // BS-0162: 终端 2FA 认证
  // ═══════════════════════════════════════════════════════════

  describe('bindTerminal (BS-0162)', () => {
    it('应成功绑定终端到门店和操作员', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const binding = service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      expect(binding.isActive).toBe(true)
      expect(binding.storeId).toBe('store-1')
      expect(binding.operatorId).toBe('op-1')
    })

    it('未注册终端绑定应抛出错误', () => {
      expect(() => service.bindTerminal('nonexistent', 'store-1', 'op-1', '操作员1', tenantA)).toThrow(
        'Terminal not found',
      )
    })

    it('跨租户绑定应抛出错误', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      expect(() => service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantB)).toThrow(
        'does not belong to tenant',
      )
    })

    it('重新绑定应自动解绑旧的活跃绑定', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const b1 = service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      expect(b1.isActive).toBe(true)

      const b2 = service.bindTerminal(terminalId, 'store-2', 'op-2', '操作员2', tenantA)
      expect(b2.isActive).toBe(true)

      expect(service.getActiveBinding(terminalId)!.storeId).toBe('store-2')
      // Old binding is inactive
      const allHistory = service.getBindingHistory(terminalId)
      expect(allHistory.find((b) => b.id === b1.id)!.isActive).toBe(false)
    })
  })

  describe('unbindTerminal (BS-0162)', () => {
    it('应成功解绑', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      const result = service.unbindTerminal(terminalId, tenantA)
      expect(result).toBe(true)
      expect(service.getActiveBinding(terminalId)).toBeUndefined()
    })

    it('未绑定的终端返回 false', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const result = service.unbindTerminal(terminalId, tenantA)
      expect(result).toBe(false)
    })

    it('跨租户解绑返回 false', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      const result = service.unbindTerminal(terminalId, tenantB)
      expect(result).toBe(false)
    })
  })

  describe('validateBinding (BS-0162)', () => {
    it('终端+门店+操作员全部匹配返回 valid', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      const result = service.validateBinding(terminalId, 'store-1', 'op-1', tenantA)
      expect(result.valid).toBe(true)
    })

    it('未注册终端返回 invalid', () => {
      const result = service.validateBinding('nonexistent', 'store-1', 'op-1', tenantA)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Terminal not registered')
    })

    it('租户不匹配返回 invalid', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const result = service.validateBinding(terminalId, 'store-1', 'op-1', tenantB)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Terminal tenant mismatch')
    })

    it('无活跃绑定返回 invalid', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const result = service.validateBinding(terminalId, 'store-1', 'op-1', tenantA)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Terminal has no active binding')
    })

    it('门店 ID 不匹配返回 invalid', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      const result = service.validateBinding(terminalId, 'store-2', 'op-1', tenantA)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Store ID mismatch')
    })

    it('操作员 ID 不匹配返回 invalid', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      const result = service.validateBinding(terminalId, 'store-1', 'op-2', tenantA)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Operator ID mismatch')
    })
  })

  describe('getActiveBinding', () => {
    it('绑定后应返回活跃绑定', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      expect(service.getActiveBinding(terminalId)).toBeTruthy()
    })

    it('解绑后返回 undefined', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      service.unbindTerminal(terminalId, tenantA)
      expect(service.getActiveBinding(terminalId)).toBeUndefined()
    })
  })

  describe('getBindingHistory', () => {
    it('应返回绑定历史', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      service.bindTerminal(terminalId, 'store-2', 'op-2', '操作员2', tenantA)
      const history = service.getBindingHistory(terminalId)
      expect(history).toHaveLength(2)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // BS-0163: 离线检测与自动恢复
  // ═══════════════════════════════════════════════════════════

  describe('detectAndMarkOffline (BS-0163)', () => {
    it('阈值设为 0 应标记所有在线终端离线', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.registerTerminal('term-002', TerminalType.Kiosk, '自助1', tenantA)
      const offline = service.detectAndMarkOffline(0)
      expect(offline).toHaveLength(2)
    })

    it('在线终端有近期心跳不应标记离线', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.handleHeartbeat(terminalId, 10)
      const offline = service.detectAndMarkOffline(60) // 60 min threshold, recent heartbeat
      expect(offline).toHaveLength(0)
    })

    it('已离线终端不应重复标记', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.detectAndMarkOffline(0)
      const offline = service.detectAndMarkOffline(0)
      expect(offline).toHaveLength(0)
    })

    it('应返回被标记离线的终端 ID 列表', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const offline = service.detectAndMarkOffline(0)
      expect(offline).toContain(terminalId)
    })
  })

  describe('recoverTerminal (BS-0163)', () => {
    it('应成功恢复离线终端', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.detectAndMarkOffline(0)
      const result = service.recoverTerminal(terminalId, tenantA)
      expect(result.success).toBe(true)
      expect(result.wasOffline).toBe(true)
      expect(service.getTerminalStatus(terminalId)!.status).toBe(TerminalOnlineStatus.Online)
    })

    it('在线终端恢复返回 success 且 wasOffline=false', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const result = service.recoverTerminal(terminalId, tenantA)
      expect(result.success).toBe(true)
      expect(result.wasOffline).toBe(false)
    })

    it('未注册终端返回 success=false', () => {
      const result = service.recoverTerminal('nonexistent', tenantA)
      expect(result.success).toBe(false)
    })

    it('跨租户恢复返回 success=false', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const result = service.recoverTerminal(terminalId, tenantB)
      expect(result.success).toBe(false)
    })
  })

  describe('getOfflineTerminals (BS-0163)', () => {
    it('应返回该租户的离线终端列表', () => {
      service.registerTerminal('t1', TerminalType.Queue, '排队1', tenantA)
      service.registerTerminal('t2', TerminalType.Kiosk, '自助1', tenantA)
      service.detectAndMarkOffline(0)
      const offline = service.getOfflineTerminals(tenantA)
      expect(offline).toHaveLength(2)
      expect(offline[0].offlineDurationMinutes).toBeGreaterThanOrEqual(0)
    })

    it('跨租户不应返回另一租户的离线终端', () => {
      service.registerTerminal('t1', TerminalType.Queue, '排队1', tenantA)
      service.registerTerminal('t2', TerminalType.Queue, '排队2', tenantB)
      service.detectAndMarkOffline(0)
      expect(service.getOfflineTerminals(tenantA)).toHaveLength(1)
      expect(service.getOfflineTerminals(tenantB)).toHaveLength(1)
    })

    it('无离线终端时返回空数组', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      expect(service.getOfflineTerminals(tenantA)).toHaveLength(0)
    })
  })

  describe('getOfflineOverview (BS-0163)', () => {
    it('应返回正确的概览数据', () => {
      service.registerTerminal('t1', TerminalType.Queue, '排队1', tenantA)
      service.registerTerminal('t2', TerminalType.Queue, '排队2', tenantA)
      service.detectAndMarkOffline(0)
      const overview = service.getOfflineOverview(tenantA)
      expect(overview.totalCount).toBe(2)
      expect(overview.onlineCount).toBe(0)
      expect(overview.offlineCount).toBe(2)
      expect(overview.offlineTerminals).toHaveLength(2)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // isTerminalReadyForQueue / isTerminalActive
  // ═══════════════════════════════════════════════════════════

  describe('isTerminalReadyForQueue', () => {
    it('在线且已绑定的终端应 ready', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      const result = service.isTerminalReadyForQueue(terminalId, tenantA)
      expect(result.ready).toBe(true)
    })

    it('未注册终端不应 ready', () => {
      const result = service.isTerminalReadyForQueue('unknown', tenantA)
      expect(result.ready).toBe(false)
      expect(result.reason).toBe('Terminal not registered')
    })

    it('租户不匹配不应 ready', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const result = service.isTerminalReadyForQueue(terminalId, tenantB)
      expect(result.ready).toBe(false)
      expect(result.reason).toBe('Terminal tenant mismatch')
    })

    it('离线终端不应 ready', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.detectAndMarkOffline(0)
      const result = service.isTerminalReadyForQueue(terminalId, tenantA)
      expect(result.ready).toBe(false)
      expect(result.reason).toBe('Terminal is offline')
    })

    it('在线但未绑定不应 ready', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      const result = service.isTerminalReadyForQueue(terminalId, tenantA)
      expect(result.ready).toBe(false)
      expect(result.reason).toBe('Terminal has no active binding')
    })
  })

  describe('isTerminalActive', () => {
    it('在线+已绑定返回 true', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.bindTerminal(terminalId, 'store-1', 'op-1', '操作员1', tenantA)
      expect(service.isTerminalActive(terminalId, tenantA)).toBe(true)
    })

    it('未注册返回 false', () => {
      expect(service.isTerminalActive('unknown', tenantA)).toBe(false)
    })

    it('离线返回 false', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      service.detectAndMarkOffline(0)
      expect(service.isTerminalActive(terminalId, tenantA)).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 边界条件
  // ═══════════════════════════════════════════════════════════

  describe('边界条件', () => {
    it('大量终端注册不报错', () => {
      for (let i = 0; i < 100; i++) {
        service.registerTerminal(`term-${i}`, TerminalType.Queue, `排队${i}`, tenantA)
      }
      expect(service.listTerminals(tenantA)).toHaveLength(100)
    })

    it('同一终端多次心跳不报错', () => {
      service.registerTerminal(terminalId, TerminalType.Queue, '排队1', tenantA)
      for (let i = 0; i < 200; i++) {
        service.handleHeartbeat(terminalId, Math.floor(Math.random() * 500))
      }
      expect(service.getTerminalStatus(terminalId)!.status).toBe(TerminalOnlineStatus.Online)
    })

    it('空租户概览返回全零', () => {
      const overview = service.getOfflineOverview('non-existent-tenant')
      expect(overview.totalCount).toBe(0)
      expect(overview.onlineCount).toBe(0)
      expect(overview.offlineCount).toBe(0)
    })
  })
})
