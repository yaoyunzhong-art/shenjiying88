/**
 * terminal.module.test.ts — 排队终端模块测试
 *
 * WP-12B BS-0161~BS-0163 全量单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TerminalController } from './terminal.controller'
import { TerminalModule } from './terminal.module'
import { TerminalService } from './terminal.service'
import { TerminalOnlineStatus, TerminalType } from './terminal.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 测试用 tenant context ──
const tenantCtx: RequestTenantContext = {
  tenantId: 'test-tenant',
}

describe('TerminalModule', () => {
  /* ── 模块元数据 ── */
  it('TerminalModule 应正确导出', () => {
    const controllers = Reflect.getMetadata('controllers', TerminalModule) as unknown[] | undefined
    const providers = Reflect.getMetadata('providers', TerminalModule) as unknown[] | undefined
    const exportsList = Reflect.getMetadata('exports', TerminalModule) as unknown[] | undefined

    expect(controllers).toBeDefined()
    expect(controllers).toContain(TerminalController)
    expect(providers).toBeDefined()
    expect(providers).toContain(TerminalService)
    expect(exportsList).toBeDefined()
    expect(exportsList).toContain(TerminalService)
  })

  it('Controller 数量应为 1', () => {
    const controllers = Reflect.getMetadata('controllers', TerminalModule) || []
    expect(controllers).toHaveLength(1)
  })

  it('Provider 数量应为 1', () => {
    const providers = Reflect.getMetadata('providers', TerminalModule) || []
    expect(providers).toHaveLength(1)
  })

  it('Export 数量应为 1', () => {
    const exports = Reflect.getMetadata('exports', TerminalModule) || []
    expect(exports).toHaveLength(1)
  })

  it('不应导入外部模块', () => {
    const imports = Reflect.getMetadata('imports', TerminalModule) || []
    expect(imports).toHaveLength(0)
  })
})

describe('TerminalService — BS-0161 终端心跳检测', () => {
  let service: TerminalService

  beforeEach(() => {
    service = new TerminalService()
    service.resetStoresForTests()
  })

  /* ── 注册终端 ── */
  it('应能注册新终端', () => {
    const terminal = service.registerTerminal('t1', TerminalType.Queue, '排队终端1', 't1')
    expect(terminal.id).toBe('t1')
    expect(terminal.type).toBe(TerminalType.Queue)
    expect(terminal.status).toBe(TerminalOnlineStatus.Online)
    expect(terminal.lastHeartbeatAt).toBeInstanceOf(Date)
    expect(terminal.name).toBe('排队终端1')
  })

  it('注册已存在的终端应覆盖', () => {
    service.registerTerminal('t1', TerminalType.Queue, 'old', 't1')
    const updated = service.registerTerminal('t1', TerminalType.Kiosk, 'new', 't1')
    expect(updated.type).toBe(TerminalType.Kiosk)
    expect(updated.name).toBe('new')
  })

  /* ── 心跳上报 ── */
  it('已注册终端发送心跳应返回 online', () => {
    service.registerTerminal('t1', TerminalType.Queue, '排队终端1', 't1')
    const result = service.handleHeartbeat('t1', 10)
    expect(result.terminalId).toBe('t1')
    expect(result.status).toBe(TerminalOnlineStatus.Online)
    expect(result.lastHeartbeatAt).toBeInstanceOf(Date)
  })

  it('未注册终端发送心跳应返回 offline', () => {
    const result = service.handleHeartbeat('unknown', 10)
    expect(result.status).toBe(TerminalOnlineStatus.Offline)
    expect(result.lastHeartbeatAt).toBeNull()
  })

  it('离线终端心跳应自动恢复为 online', () => {
    service.registerTerminal('t1', TerminalType.Queue, '排队终端1', 't1')
    // 手动标记离线
    service.detectAndMarkOffline(0) // threshold=0 强制离线
    const status1 = service.getTerminalStatus('t1')
    expect(status1?.status).toBe(TerminalOnlineStatus.Offline)

    // 发送心跳自动恢复
    const result = service.handleHeartbeat('t1', 5)
    expect(result.status).toBe(TerminalOnlineStatus.Online)
  })

  /* ── 终端状态查询 ── */
  it('getTerminalStatusDetail 应返回完整信息', () => {
    service.registerTerminal('t1', TerminalType.Queue, '排队终端1', 't1')
    const detail = service.getTerminalStatusDetail('t1')
    expect(detail).not.toBeNull()
    expect(detail!.id).toBe('t1')
    expect(detail!.status).toBe('online')
  })

  it('getTerminalStatusDetail 不存在的终端应返回 null', () => {
    const detail = service.getTerminalStatusDetail('no-such')
    expect(detail).toBeNull()
  })

  it('listTerminals 应返回租户下的所有终端', () => {
    service.registerTerminal('t1', TerminalType.Queue, 'A', 'tenant1')
    service.registerTerminal('t2', TerminalType.Kiosk, 'B', 'tenant1')
    service.registerTerminal('t3', TerminalType.Tablet, 'C', 'tenant2')

    const list = service.listTerminals('tenant1')
    expect(list).toHaveLength(2)
    expect(list.map((t) => t.id)).toContain('t1')
    expect(list.map((t) => t.id)).toContain('t2')
    expect(list.map((t) => t.id)).not.toContain('t3')
  })
})

describe('TerminalService — BS-0162 终端2FA认证', () => {
  let service: TerminalService

  beforeEach(() => {
    service = new TerminalService()
    service.resetStoresForTests()
    service.registerTerminal('t1', TerminalType.Queue, '排队终端1', 't1')
  })

  /* ── 绑定终端 ── */
  it('应能绑定终端到门店和操作员', () => {
    const binding = service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    expect(binding.terminalId).toBe('t1')
    expect(binding.storeId).toBe('store1')
    expect(binding.operatorId).toBe('op1')
    expect(binding.operatorName).toBe('张三')
    expect(binding.isActive).toBe(true)
  })

  it('不存在的终端绑定应报错', () => {
    expect(() => service.bindTerminal('no-such', 'store1', 'op1', '张三', 't1')).toThrow(
      'Terminal not found',
    )
  })

  it('不同租户的终端绑定应报错', () => {
    expect(() => service.bindTerminal('t1', 'store1', 'op1', '张三', 'other-tenant')).toThrow(
      'does not belong to tenant',
    )
  })

  it('重新绑定应解除旧的活跃绑定', () => {
    const b1 = service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    const b2 = service.bindTerminal('t1', 'store2', 'op2', '李四', 't1')

    expect(b1.isActive).toBe(false)
    expect(b2.isActive).toBe(true)

    const active = service.getActiveBinding('t1')
    expect(active?.id).toBe(b2.id)
    expect(active?.storeId).toBe('store2')
  })

  /* ── 解绑 ── */
  it('应能解除绑定', () => {
    service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    const success = service.unbindTerminal('t1', 't1')
    expect(success).toBe(true)

    const binding = service.getActiveBinding('t1')
    expect(binding).toBeUndefined()
  })

  it('无绑定时解绑应返回 false', () => {
    const success = service.unbindTerminal('t1', 't1')
    expect(success).toBe(false)
  })

  /* ── 验证绑定 ── */
  it('正确的绑定验证应通过', () => {
    service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    const result = service.validateBinding('t1', 'store1', 'op1', 't1')
    expect(result.valid).toBe(true)
  })

  it('未注册终端验证应失败', () => {
    const result = service.validateBinding('unknown', 'store1', 'op1', 't1')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('not registered')
  })

  it('门店不匹配应失败', () => {
    service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    const result = service.validateBinding('t1', 'store-wrong', 'op1', 't1')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Store ID mismatch')
  })

  it('操作员不匹配应失败', () => {
    service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    const result = service.validateBinding('t1', 'store1', 'op-wrong', 't1')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Operator ID mismatch')
  })

  it('无活跃绑定时验证应失败', () => {
    const result = service.validateBinding('t1', 'store1', 'op1', 't1')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('no active binding')
  })

  /* ── 绑定历史 ── */
  it('getBindingHistory 应返回所有历史', () => {
    service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    service.bindTerminal('t1', 'store2', 'op2', '李四', 't1')
    const history = service.getBindingHistory('t1')
    expect(history).toHaveLength(2)
  })
})

describe('TerminalService — BS-0163 离线检测与自动恢复', () => {
  let service: TerminalService

  beforeEach(() => {
    service = new TerminalService()
    service.resetStoresForTests()
    service.registerTerminal('t1', TerminalType.Queue, '排队终端1', 't1')
    service.registerTerminal('t2', TerminalType.Kiosk, '自助终端1', 't1')
    service.registerTerminal('t3', TerminalType.Tablet, '平板1', 't2')
  })

  /* ── 离线检测 ── */
  it('detectAndMarkOffline 阈值=0 应将所有在线终端标记为离线', () => {
    const offlineIds = service.detectAndMarkOffline(0)
    expect(offlineIds).toHaveLength(3)
    expect(service.getTerminalStatus('t1')?.status).toBe(TerminalOnlineStatus.Offline)
    expect(service.getTerminalStatus('t2')?.status).toBe(TerminalOnlineStatus.Offline)
  })

  it('detectAndMarkOffline 不应处理已离线的终端', () => {
    // 先标记离线
    service.detectAndMarkOffline(0)
    // 再次检测
    const offlineIds = service.detectAndMarkOffline(0)
    expect(offlineIds).toHaveLength(0) // 已经是离线，没有"新"离线
  })

  /* ── 手动恢复 ── */
  it('recoverTerminal 应恢复离线终端', () => {
    service.detectAndMarkOffline(0)
    const result = service.recoverTerminal('t1', 't1')
    expect(result.success).toBe(true)
    expect(result.wasOffline).toBe(true)
    expect(service.getTerminalStatus('t1')?.status).toBe(TerminalOnlineStatus.Online)
  })

  it('recoverTerminal 不存在的终端应失败', () => {
    const result = service.recoverTerminal('no-such', 't1')
    expect(result.success).toBe(false)
  })

  it('recoverTerminal 跨租户应失败', () => {
    const result = service.recoverTerminal('t1', 'wrong-tenant')
    expect(result.success).toBe(false)
  })

  /* ── 离线终端查询 ── */
  it('getOfflineTerminals 应返回租户下的离线终端', () => {
    service.detectAndMarkOffline(0)
    const offline = service.getOfflineTerminals('t1')
    expect(offline).toHaveLength(2) // t1,t2 belong to t1
    expect(offline[0].offlineDurationMinutes).toBeGreaterThanOrEqual(0)
  })

  it('getOfflineTerminals 无参数应返回所有租户', () => {
    service.detectAndMarkOffline(0)
    const offline = service.getOfflineTerminals()
    expect(offline).toHaveLength(3) // all 3 terminals
  })

  /* ── 离线总览 ── */
  it('getOfflineOverview 应返回正确统计', () => {
    service.detectAndMarkOffline(0)
    const overview = service.getOfflineOverview('t1')
    expect(overview.totalCount).toBe(2)
    expect(overview.offlineCount).toBe(2)
    expect(overview.onlineCount).toBe(0)
  })

  /* ── 排队就绪检查 ── */
  it('isTerminalReadyForQueue 在线且已绑定应返回 ready', () => {
    service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    const result = service.isTerminalReadyForQueue('t1', 't1')
    expect(result.ready).toBe(true)
  })

  it('isTerminalReadyForQueue 离线应返回 not ready', () => {
    service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    service.detectAndMarkOffline(0)
    const result = service.isTerminalReadyForQueue('t1', 't1')
    expect(result.ready).toBe(false)
    expect(result.reason).toContain('offline')
  })

  it('isTerminalReadyForQueue 未绑定应返回 not ready', () => {
    const result = service.isTerminalReadyForQueue('t1', 't1')
    expect(result.ready).toBe(false)
    expect(result.reason).toContain('no active binding')
  })

  it('isTerminalReadyForQueue 不存在的终端应返回 not ready', () => {
    const result = service.isTerminalReadyForQueue('unknown', 't1')
    expect(result.ready).toBe(false)
    expect(result.reason).toContain('not registered')
  })

  /* ── isTerminalActive 快捷方法 ── */
  it('isTerminalActive 在线且绑定应返回 true', () => {
    service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    expect(service.isTerminalActive('t1', 't1')).toBe(true)
  })

  it('isTerminalActive 离线应返回 false', () => {
    service.bindTerminal('t1', 'store1', 'op1', '张三', 't1')
    service.detectAndMarkOffline(0)
    expect(service.isTerminalActive('t1', 't1')).toBe(false)
  })
})
