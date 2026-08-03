/**
 * terminal.service.ts — 排队终端 Service
 *
 * WP-12B BS-0161~BS-0163
 * - BS-0161: 终端心跳检测
 * - BS-0162: 终端 2FA 认证（终端+操作员+门店三重绑定）
 * - BS-0163: 离线检测与自动恢复
 */

import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import {
  TerminalEntity,
  TerminalBindingEntity,
  TerminalHeartbeatRecord,
  TerminalOnlineStatus,
  TerminalType,
  type OfflineDetectionResult,
  type TerminalStatusResponse,
} from './terminal.entity'

// ── 常量 ──
const DEFAULT_OFFLINE_THRESHOLD_MINUTES = 5
const MAX_HEARTBEAT_RECORDS = 100

// ── 内存存储 ──
const terminalStore = new Map<string, TerminalEntity>()
const heartbeatStore = new Map<string, TerminalHeartbeatRecord[]>()
const bindingStore = new Map<string, TerminalBindingEntity>()

/**
 * TerminalService
 *
 * 方式: 内存存储（与 queue 模块一致）
 * 扩展: 后续可切换到数据库
 */
@Injectable()
export class TerminalService {
  private readonly logger = new Logger(TerminalService.name)

  // ═════════════════════════════════════════════════════════════════════
  // BS-0161: 终端心跳检测
  // ═════════════════════════════════════════════════════════════════════

  /**
   * 注册终端
   * 让终端上线,后续可通过心跳维持在线状态
   */
  registerTerminal(
    terminalId: string,
    type: TerminalType,
    name: string,
    tenantId: string,
  ): TerminalEntity {
    const now = new Date()
    const terminal = new TerminalEntity()
    terminal.id = terminalId
    terminal.tenantId = tenantId
    terminal.type = type
    terminal.name = name
    terminal.status = TerminalOnlineStatus.Online
    terminal.lastHeartbeatAt = now
    terminal.createdAt = now
    terminal.updatedAt = now

    terminalStore.set(terminalId, terminal)
    heartbeatStore.set(terminalId, [])
    this.logger.log(`Terminal registered: ${terminalId} (${type})`)
    return terminal
  }

  /**
   * 处理终端心跳
   *
   * - 记录心跳时间戳
   * - 如果终端处于离线状态,自动恢复为在线
   * - 返回当前在线状态
   */
  handleHeartbeat(terminalId: string, latencyMs: number): { terminalId: string; status: TerminalOnlineStatus; lastHeartbeatAt: Date | null } {
    const terminal = terminalStore.get(terminalId)
    const now = new Date()

    if (!terminal) {
      this.logger.warn(`Heartbeat from unknown terminal: ${terminalId}`)
      return { terminalId, status: TerminalOnlineStatus.Offline, lastHeartbeatAt: null }
    }

    const wasOffline = terminal.status === TerminalOnlineStatus.Offline
    terminal.status = TerminalOnlineStatus.Online
    terminal.lastHeartbeatAt = now
    terminal.updatedAt = now
    terminalStore.set(terminalId, terminal)

    // 记录心跳历史
    const records = heartbeatStore.get(terminalId) ?? []
    records.push({ terminalId, timestamp: now.getTime(), latencyMs })
    if (records.length > MAX_HEARTBEAT_RECORDS) {
      records.shift()
    }
    heartbeatStore.set(terminalId, records)

    if (wasOffline) {
      this.logger.log(`Terminal auto-recovered from offline: ${terminalId}`)
    }

    return {
      terminalId,
      status: terminal.status,
      lastHeartbeatAt: terminal.lastHeartbeatAt,
    }
  }

  /**
   * 获取终端状态
   */
  getTerminalStatus(terminalId: string): TerminalEntity | undefined {
    return terminalStore.get(terminalId)
  }

  /**
   * 获取终端完整状态（含绑定信息）
   */
  getTerminalStatusDetail(terminalId: string): TerminalStatusResponse | null {
    const terminal = terminalStore.get(terminalId)
    if (!terminal) return null

    const binding = this.getActiveBinding(terminalId)
    return {
      id: terminal.id,
      name: terminal.name,
      type: terminal.type,
      status: terminal.status,
      lastHeartbeatAt: terminal.lastHeartbeatAt?.toISOString() ?? null,
      binding: binding
        ? {
            storeId: binding.storeId,
            operatorId: binding.operatorId,
            operatorName: binding.operatorName,
            isActive: binding.isActive,
            boundAt: binding.boundAt.toISOString(),
          }
        : undefined,
      createdAt: terminal.createdAt.toISOString(),
      updatedAt: terminal.updatedAt.toISOString(),
    }
  }

  /**
   * 列出指定租户的所有终端
   */
  listTerminals(tenantId: string): TerminalEntity[] {
    return Array.from(terminalStore.values()).filter((t) => t.tenantId === tenantId)
  }

  // ═════════════════════════════════════════════════════════════════════
  // BS-0162: 终端 2FA 认证（终端+操作员+门店三重绑定）
  // ═════════════════════════════════════════════════════════════════════

  /**
   * 绑定终端到门店和操作员
   *
   * 一个终端只能有一个活跃绑定
   */
  bindTerminal(
    terminalId: string,
    storeId: string,
    operatorId: string,
    operatorName: string,
    tenantId: string,
  ): TerminalBindingEntity {
    const terminal = terminalStore.get(terminalId)
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`)
    }
    if (terminal.tenantId !== tenantId) {
      throw new Error(`Terminal ${terminalId} does not belong to tenant ${tenantId}`)
    }

    // 解除旧的活跃绑定
    const existingBindings = Array.from(bindingStore.values()).filter(
      (b) => b.terminalId === terminalId && b.isActive,
    )
    for (const oldBinding of existingBindings) {
      oldBinding.isActive = false
      oldBinding.unboundAt = new Date()
      bindingStore.set(oldBinding.id, oldBinding)
    }

    const now = new Date()
    const binding = new TerminalBindingEntity()
    binding.id = `tbind-${randomUUID()}`
    binding.terminalId = terminalId
    binding.tenantId = tenantId
    binding.storeId = storeId
    binding.operatorId = operatorId
    binding.operatorName = operatorName
    binding.isActive = true
    binding.boundAt = now

    bindingStore.set(binding.id, binding)
    this.logger.log(`Terminal bound: ${terminalId} → store=${storeId} operator=${operatorId}`)
    return binding
  }

  /**
   * 解除终端绑定
   */
  unbindTerminal(terminalId: string, tenantId: string): boolean {
    const bindings = Array.from(bindingStore.values()).filter(
      (b) => b.terminalId === terminalId && b.tenantId === tenantId && b.isActive,
    )
    if (bindings.length === 0) {
      return false
    }

    const now = new Date()
    for (const binding of bindings) {
      binding.isActive = false
      binding.unboundAt = now
      bindingStore.set(binding.id, binding)
    }
    this.logger.log(`Terminal unbound: ${terminalId}`)
    return true
  }

  /**
   * 验证终端 2FA 绑定
   *
   * 返回: { valid: true/false, reason?: string }
   *
   * 校验规则:
   * 1. 终端必须已注册
   * 2. 终端必须有活跃绑定
   * 3. 绑定的门店 ID 必须匹配
   * 4. 绑定的操作员 ID 必须匹配
   */
  validateBinding(
    terminalId: string,
    storeId: string,
    operatorId: string,
    tenantId: string,
  ): { valid: boolean; reason?: string } {
    const terminal = terminalStore.get(terminalId)
    if (!terminal) {
      return { valid: false, reason: 'Terminal not registered' }
    }
    if (terminal.tenantId !== tenantId) {
      return { valid: false, reason: 'Terminal tenant mismatch' }
    }

    const binding = this.getActiveBinding(terminalId)
    if (!binding) {
      return { valid: false, reason: 'Terminal has no active binding' }
    }
    if (binding.storeId !== storeId) {
      return { valid: false, reason: 'Store ID mismatch: bound to different store' }
    }
    if (binding.operatorId !== operatorId) {
      return { valid: false, reason: 'Operator ID mismatch: bound to different operator' }
    }

    return { valid: true }
  }

  /**
   * 获取终端的活跃绑定
   */
  getActiveBinding(terminalId: string): TerminalBindingEntity | undefined {
    return Array.from(bindingStore.values()).find(
      (b) => b.terminalId === terminalId && b.isActive,
    )
  }

  /**
   * 获取终端的绑定历史
   */
  getBindingHistory(terminalId: string): TerminalBindingEntity[] {
    return Array.from(bindingStore.values()).filter((b) => b.terminalId === terminalId)
  }

  // ═════════════════════════════════════════════════════════════════════
  // BS-0163: 离线检测与自动恢复
  // ═════════════════════════════════════════════════════════════════════

  /**
   * 检测并标记离线终端
   *
   * 遍历所有在线终端,检查最后心跳时间
   * 超过 offlineThresholdMinutes 无心跳 → 标记为离线
   *
   * @returns 本次被标记为离线的终端 ID 列表
   */
  detectAndMarkOffline(offlineThresholdMinutes: number = DEFAULT_OFFLINE_THRESHOLD_MINUTES): string[] {
    const now = Date.now()
    const thresholdMs = offlineThresholdMinutes * 60 * 1000
    const newlyOffline: string[] = []

    for (const [id, terminal] of terminalStore.entries()) {
      if (terminal.status !== TerminalOnlineStatus.Online) continue
      if (!terminal.lastHeartbeatAt) {
        // 从未发送过心跳 → 标记为离线
        terminal.status = TerminalOnlineStatus.Offline
        terminal.updatedAt = new Date()
        terminalStore.set(id, terminal)
        newlyOffline.push(id)
        this.logger.warn(`Terminal marked offline (no heartbeat ever): ${id}`)
        continue
      }

      const elapsed = now - terminal.lastHeartbeatAt.getTime()
      if (elapsed >= thresholdMs) {
        terminal.status = TerminalOnlineStatus.Offline
        terminal.updatedAt = new Date()
        terminalStore.set(id, terminal)
        newlyOffline.push(id)
        this.logger.warn(
          `Terminal marked offline: ${id} (last heartbeat ${Math.round(elapsed / 1000)}s ago)`,
        )
      }
    }

    return newlyOffline
  }

  /**
   * 手动恢复终端为在线
   */
  recoverTerminal(terminalId: string, tenantId: string): { success: boolean; wasOffline: boolean } {
    const terminal = terminalStore.get(terminalId)
    if (!terminal || terminal.tenantId !== tenantId) {
      return { success: false, wasOffline: false }
    }

    const wasOffline = terminal.status === TerminalOnlineStatus.Offline
    terminal.status = TerminalOnlineStatus.Online
    terminal.lastHeartbeatAt = new Date()
    terminal.updatedAt = new Date()
    terminalStore.set(terminalId, terminal)

    if (wasOffline) {
      this.logger.log(`Terminal manually recovered: ${terminalId}`)
    }

    return { success: true, wasOffline }
  }

  /**
   * 获取所有离线终端
   */
  getOfflineTerminals(tenantId?: string): OfflineDetectionResult[] {
    const now = Date.now()
    const terminals = tenantId
      ? Array.from(terminalStore.values()).filter((t) => t.tenantId === tenantId)
      : Array.from(terminalStore.values())

    return terminals
      .filter((t) => t.status === TerminalOnlineStatus.Offline)
      .map((t) => ({
        terminalId: t.id,
        status: t.status,
        lastHeartbeatAt: t.lastHeartbeatAt,
        offlineDurationMinutes: t.lastHeartbeatAt
          ? Math.round((now - t.lastHeartbeatAt.getTime()) / 60000)
          : null,
        tenantId: t.tenantId,
      }))
  }

  /**
   * 获取租户的离线检测总览
   */
  getOfflineOverview(tenantId: string): {
    offlineTerminals: OfflineDetectionResult[]
    onlineCount: number
    offlineCount: number
    totalCount: number
  } {
    const terminals = Array.from(terminalStore.values()).filter(
      (t) => t.tenantId === tenantId,
    )
    const offline = terminals.filter((t) => t.status === TerminalOnlineStatus.Offline)
    const online = terminals.filter((t) => t.status === TerminalOnlineStatus.Online)

    const now = Date.now()
    const offlineTerminals: OfflineDetectionResult[] = offline.map((t) => ({
      terminalId: t.id,
      status: t.status,
      lastHeartbeatAt: t.lastHeartbeatAt,
      offlineDurationMinutes: t.lastHeartbeatAt
        ? Math.round((now - t.lastHeartbeatAt.getTime()) / 60000)
        : null,
      tenantId: t.tenantId,
    }))

    return {
      offlineTerminals,
      onlineCount: online.length,
      offlineCount: offline.length,
      totalCount: terminals.length,
    }
  }

  /**
   * 检查终端是否可用于排队操作（在线 + 已绑定）
   */
  isTerminalReadyForQueue(terminalId: string, tenantId: string): { ready: boolean; reason?: string } {
    const terminal = terminalStore.get(terminalId)
    if (!terminal) {
      return { ready: false, reason: 'Terminal not registered' }
    }
    if (terminal.tenantId !== tenantId) {
      return { ready: false, reason: 'Terminal tenant mismatch' }
    }
    if (terminal.status === TerminalOnlineStatus.Offline) {
      return { ready: false, reason: 'Terminal is offline' }
    }

    const binding = this.getActiveBinding(terminalId)
    if (!binding) {
      return { ready: false, reason: 'Terminal has no active binding' }
    }

    return { ready: true }
  }

  /**
   * 查询终端是否已绑定并在线
   * 排队终端离线时，排队系统可以调用此方法判断是否转在线排队
   *
   * @returns true=终端在线且已绑定; false=终端离线或未绑定
   */
  isTerminalActive(terminalId: string, tenantId: string): boolean {
    const result = this.isTerminalReadyForQueue(terminalId, tenantId)
    return result.ready
  }

  /**
   * 清除所有记录（测试用）
   */
  resetStoresForTests(): void {
    terminalStore.clear()
    heartbeatStore.clear()
    bindingStore.clear()
  }
}
