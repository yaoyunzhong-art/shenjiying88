/**
 * points.service.ts - 积分模块核心服务
 *
 * 编排层：整合 PointsAtomicService（原子操作）与 PointsRiskService（风控）
 * 职责：
 *   - 积分交易编排（含风控预检）
 *   - 会员积分概览
 *   - 积分统计查询
 *   - 风控策略配置
 *
 * 树哥后台自动执行：积分服务编排层
 */

import { Injectable, BadRequestException } from '@nestjs/common'
import { PointsAtomicService } from './points-atomic.service'
import { PointsRiskService, InflationMonitor, CircuitBreaker, ExpirationNotifier, type ReminderRecord } from './points-risk.service'
import type {
  PointsRecord,
  PointsAccount,
  PointsAccountOverview,
  PointsStatistics,
  PointsOperationResult,
  PointsRiskOverview,
  PointsIssuanceRule,
  PointsRedemptionRule
} from './points.entity'

// ============================================================================
// 内存存储（生产环境应替换为数据库）
// ============================================================================

/** 积分流水存储 */
const pointsRecordStore: PointsRecord[] = []
/** 积分账户存储（keyed by memberId） */
const pointsAccountStore = new Map<string, PointsAccount>()
/** 积分发放规则 */
const issuanceRulesStore = new Map<string, PointsIssuanceRule>()
/** 积分兑换规则 */
const redemptionRulesStore = new Map<string, PointsRedemptionRule>()

/** 测试重置 */
export function resetPointsServiceTestState(): void {
  pointsRecordStore.length = 0
  pointsAccountStore.clear()
  issuanceRulesStore.clear()
  redemptionRulesStore.clear()
}

// ============================================================================
// PointsService
// ============================================================================

@Injectable()
export class PointsService {
  private recordIdCounter = 0

  constructor(
    private readonly atomicService: PointsAtomicService,
    private readonly riskService: PointsRiskService
  ) {}

  // --------------------------------------------------------------------------
  // 积分交易编排（含风控预检）
  // --------------------------------------------------------------------------

  /**
   * 积分变动（含风控通胀预检）
   * - 增加积分时，先检查通胀指数是否超过阈值
   * - 风控不通过时返回失败而非抛异常（方便调用方处理）
   */
  async transaction(
    memberId: string,
    delta: number,
    reason: string,
    options?: { orderId?: string; transactionId?: string }
  ): Promise<PointsOperationResult> {
    // 风控预检：发放积分时检查通胀（需要有显著的高通胀才拒绝）
    if (delta > 0) {
      const inflationIndex = this.riskService.inflation.getInflationIndex()
      // 仅当总发放 > 1000 且无任何兑换时视为高通胀
      const totalIssued = this.riskService.inflation.getTotalIssuance()
      if (totalIssued > 1000) {
        if (!isFinite(inflationIndex) || inflationIndex > 2.0) {
          const display = isFinite(inflationIndex) ? inflationIndex.toFixed(2) : '∞'
          return { success: false, error: `通胀指数过高 (${display})，暂缓积分发放` }
        }
      }
    }

    const result = await this.atomicService.incrementPointsAtomic(memberId, delta, reason)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    // 记录流水
    const record: PointsRecord = {
      id: `rec_${Date.now()}_${++this.recordIdCounter}`,
      memberId,
      type: delta > 0 ? 'award' : 'redeem',
      delta,
      balanceAfter: result.data!,
      reason,
      orderId: options?.orderId,
      transactionId: options?.transactionId ?? `tx_${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    pointsRecordStore.push(record)

    // 更新账户快照
    this.updateAccountSnapshot(memberId)

    // 通知风控
    if (delta > 0) {
      this.riskService.inflation.recordPointIssuance(delta, memberId)
    } else {
      this.riskService.inflation.recordPointRedemption(Math.abs(delta), memberId)
    }

    return { success: true, data: { newBalance: result.data } }
  }

  /**
   * 积分转账（含风控熔断检查）
   */
  async transfer(
    fromMemberId: string,
    toMemberId: string,
    amount: number,
    reason: string,
    transactionId?: string
  ): Promise<PointsOperationResult> {
    // 熔断预检
    if (this.riskService.circuitBreaker.isOpen('transfer')) {
      return { success: false, error: '转账服务暂不可用（熔断中）' }
    }

    const result = await this.atomicService.transferPointsAtomic(fromMemberId, toMemberId, amount)
    if (!result.success) {
      this.riskService.circuitBreaker.recordFailure('transfer')
      return { success: false, error: result.error }
    }

    this.riskService.circuitBreaker.recordSuccess('transfer')

    const now = new Date().toISOString()
    const tid = transactionId ?? `txf_${Date.now()}`

    // 转出流水
    pointsRecordStore.push({
      id: `rec_${Date.now()}_${++this.recordIdCounter}`,
      memberId: fromMemberId,
      type: 'transfer_out',
      delta: -amount,
      balanceAfter: result.data!.fromNewBalance,
      reason: `转出: ${reason}`,
      transactionId: tid,
      createdAt: now
    })

    // 转入流水
    pointsRecordStore.push({
      id: `rec_${Date.now() + 1}_${++this.recordIdCounter}`,
      memberId: toMemberId,
      type: 'transfer_in',
      delta: amount,
      balanceAfter: result.data!.toNewBalance,
      reason: `转入: ${reason}`,
      transactionId: tid,
      createdAt: now
    })

    this.updateAccountSnapshot(fromMemberId)
    this.updateAccountSnapshot(toMemberId)

    return { success: true, data: result.data }
  }

  /**
   * 积分抵扣（带幂等）
   */
  async deduct(
    memberId: string,
    amount: number,
    orderId: string,
    reason: string
  ): Promise<PointsOperationResult> {
    // 熔断预检
    if (this.riskService.circuitBreaker.isOpen('deduct')) {
      return { success: false, error: '抵扣服务暂不可用（熔断中）' }
    }

    const result = await this.atomicService.deductForPurchaseAtomic(memberId, amount, orderId)
    if (!result.success) {
      this.riskService.circuitBreaker.recordFailure('deduct')
      return { success: false, error: result.error }
    }

    this.riskService.circuitBreaker.recordSuccess('deduct')

    if (!result.data!.alreadyProcessed) {
      pointsRecordStore.push({
        id: `rec_${Date.now()}_${++this.recordIdCounter}`,
        memberId,
        type: 'redeem',
        delta: -amount,
        balanceAfter: result.data!.newBalance,
        reason,
        orderId,
        transactionId: `deduct_${orderId}`,
        createdAt: new Date().toISOString()
      })
      this.updateAccountSnapshot(memberId)
    }

    return { success: true, data: result.data }
  }

  /**
   * 批量发放积分
   */
  async batchAward(
    memberIds: string[],
    pointsEach: number,
    reason: string,
    transactionId?: string
  ): Promise<PointsOperationResult> {
    // 批量风控预检
    const totalPoints = memberIds.length * pointsEach
    const totalIssued = this.riskService.inflation.getTotalIssuance()
    const inflationIndex = this.riskService.inflation.getInflationIndex()
    if (totalIssued > 1000 && (inflationIndex === Infinity || !isFinite(inflationIndex) || (inflationIndex > 1.8 && totalPoints > 10000))) {
      return { success: false, error: `批量发放金额过大，通胀指数 ${inflationIndex.toFixed(2)} 偏高` }
    }

    const result = await this.atomicService.batchAwardAtomic(memberIds, pointsEach, reason)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    const now = new Date().toISOString()
    const tid = transactionId ?? `batch_${Date.now()}`

    for (const memberId of memberIds) {
      pointsRecordStore.push({
        id: `rec_${Date.now()}_${++this.recordIdCounter}`,
        memberId,
        type: 'award',
        delta: pointsEach,
        balanceAfter: result.data!.memberBalances.get(memberId) ?? 0,
        reason,
        transactionId: tid,
        createdAt: now
      })
      this.updateAccountSnapshot(memberId)
      this.riskService.inflation.recordPointIssuance(pointsEach, memberId)
    }

    return { success: true, data: { awardedCount: result.data!.awardedCount } }
  }

  // --------------------------------------------------------------------------
  // 会员积分概览
  // --------------------------------------------------------------------------

  /**
   * 获取会员积分概览（账户 + 最近流水 + 风控状态）
   */
  async getAccountOverview(memberId: string): Promise<PointsAccountOverview> {
    const account = this.getOrCreateAccount(memberId)
    const recentRecords = pointsRecordStore
      .filter(r => r.memberId === memberId)
      .slice(-20)
    const inflationIndex = this.riskService.inflation.getInflationIndex()

    return {
      account,
      recentRecords,
      riskStatus: {
        inflationIndex: isFinite(inflationIndex) ? inflationIndex : 1,
        inflating: isFinite(inflationIndex) && inflationIndex > 1.2
      }
    }
  }

  /**
   * 查询积分余额
   */
  getBalance(memberId: string): number {
    return this.atomicService.getBalance(memberId)
  }

  // --------------------------------------------------------------------------
  // 积分统计
  // --------------------------------------------------------------------------

  /**
   * 积分统计分析
   */
  async getStatistics(options?: {
    startDate?: string
    endDate?: string
    trendDays?: number
  }): Promise<PointsStatistics> {
    const trendDays = options?.trendDays ?? 7
    const startDate = options?.startDate
    const endDate = options?.endDate

    let filteredRecords = pointsRecordStore
    if (startDate) filteredRecords = filteredRecords.filter(r => r.createdAt >= startDate)
    if (endDate) filteredRecords = filteredRecords.filter(r => r.createdAt <= endDate)

    const totalIssued = filteredRecords
      .filter(r => r.delta > 0)
      .reduce((sum, r) => sum + r.delta, 0)

    const totalRedeemed = filteredRecords
      .filter(r => r.delta < 0)
      .reduce((sum, r) => sum + Math.abs(r.delta), 0)

    const activeAccounts = Array.from(pointsAccountStore.values())
      .filter(a => a.status === 'active').length

    const balances = Array.from(pointsAccountStore.values())
      .filter(a => a.status === 'active')
      .map(a => a.balance)
    const averageBalance = balances.length > 0
      ? Math.round(balances.reduce((a, b) => a + b, 0) / balances.length)
      : 0

    // 趋势数据
    const trend: Array<{ date: string; amount: number }> = []
    const now = new Date()
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayTotal = filteredRecords
        .filter(r => r.createdAt.startsWith(dateStr) && r.delta > 0)
        .reduce((sum, r) => sum + r.delta, 0)
      trend.push({ date: dateStr, amount: dayTotal })
    }

    return {
      totalMembers: pointsAccountStore.size,
      totalIssued,
      totalRedeemed,
      activeAccounts,
      averageBalance,
      issuanceTrend: trend,
      redemptionTrend: filteredRecords
        .filter(r => r.delta < 0)
        .reduce<Array<{ date: string; amount: number }>>((acc, r) => {
          const date = r.createdAt.slice(0, 10)
          const existing = acc.find(a => a.date === date)
          if (existing) existing.amount += Math.abs(r.delta)
          else acc.push({ date, amount: Math.abs(r.delta) })
          return acc
        }, [])
    }
  }

  // --------------------------------------------------------------------------
  // 流水查询
  // --------------------------------------------------------------------------

  /**
   * 查询积分流水
   */
  queryRecords(options: {
    memberId?: string
    type?: PointsRecord['type']
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }): PointsRecord[] {
    let records = pointsRecordStore

    if (options.memberId) {
      records = records.filter(r => r.memberId === options.memberId)
    }
    if (options.type) {
      records = records.filter(r => r.type === options.type)
    }
    if (options.startDate) {
      records = records.filter(r => r.createdAt >= options.startDate!)
    }
    if (options.endDate) {
      records = records.filter(r => r.createdAt <= options.endDate!)
    }

    const page = options.page ?? 1
    const limit = options.limit ?? 20
    const start = (page - 1) * limit

    return records.slice(start, start + limit)
  }

  // --------------------------------------------------------------------------
  // 规则管理
  // --------------------------------------------------------------------------

  /**
   * 创建发放规则
   */
  createIssuanceRule(rule: PointsIssuanceRule): PointsIssuanceRule {
    const id = rule.id || `ir_${Date.now()}`
    const newRule: PointsIssuanceRule = {
      ...rule,
      id,
      enabled: rule.enabled ?? true
    }
    issuanceRulesStore.set(id, newRule)
    return newRule
  }

  /**
   * 获取发放规则列表
   */
  getIssuanceRules(): PointsIssuanceRule[] {
    return Array.from(issuanceRulesStore.values())
  }

  /**
   * 创建兑换规则
   */
  createRedemptionRule(rule: PointsRedemptionRule): PointsRedemptionRule {
    const id = rule.id || `rr_${Date.now()}`
    const newRule: PointsRedemptionRule = {
      ...rule,
      id,
      enabled: rule.enabled ?? true
    }
    redemptionRulesStore.set(id, newRule)
    return newRule
  }

  /**
   * 获取兑换规则列表
   */
  getRedemptionRules(): PointsRedemptionRule[] {
    return Array.from(redemptionRulesStore.values())
  }

  // --------------------------------------------------------------------------
  // 风控接口
  // --------------------------------------------------------------------------

  /**
   * 获取风控总览
   */
  getRiskOverview(): PointsRiskOverview {
    const alert = this.riskService.inflation.alertIfHigh()
    const endpoints = ['transfer', 'deduct', 'evaluateMemberLevel']
    const circuitStatuses = endpoints.map(endpoint => {
      const st = this.riskService.circuitBreaker.getStatus(endpoint)
      return { endpoint, ...st }
    })

    return {
      inflationIndex: this.riskService.inflation.getInflationIndex(),
      inflating: !!(isFinite(this.riskService.inflation.getInflationIndex()) && this.riskService.inflation.getInflationIndex() > 1.2),
      circuitStatuses,
      activeReminders: this.riskService.expiration.getAllReminders().length,
      recentAlerts: []
    }
  }

  /**
   * 安排过期提醒
   */
  scheduleReminder(memberId: string, points: number, expireAt: Date): { success: boolean; message: string } {
    if (!memberId || points <= 0 || !expireAt) {
      throw new BadRequestException('memberId, points(>0), and expireAt are required')
    }
    this.riskService.expiration.scheduleReminder(memberId, points, expireAt)
    return { success: true, message: `已安排会员 ${memberId} 的过期提醒` }
  }

  /**
   * 触发过期提醒
   */
  sendReminder(memberId: string, points: number): { success: boolean; sent: boolean } {
    const sent = this.riskService.expiration.sendReminder(memberId, points)
    return { success: true, sent }
  }

  /**
   * 重置风控
   */
  resetRisk(): { success: boolean } {
    this.riskService.inflation.reset()
    this.riskService.circuitBreaker.resetAll()
    this.riskService.expiration.clear()
    return { success: true }
  }

  // --------------------------------------------------------------------------
  // 内部方法
  // --------------------------------------------------------------------------

  /** 更新账户快照 */
  private updateAccountSnapshot(memberId: string): void {
    const balance = this.atomicService.getBalance(memberId)
    const existing = pointsAccountStore.get(memberId)

    if (existing) {
      const delta = balance - existing.balance
      existing.balance = balance
      if (delta > 0) existing.totalEarned += delta
      if (delta < 0) existing.totalSpent += Math.abs(delta)
      existing.updatedAt = new Date().toISOString()
    } else {
      pointsAccountStore.set(memberId, {
        memberId,
        balance,
        totalEarned: balance > 0 ? balance : 0,
        totalSpent: 0,
        expiringPoints: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  }

  /** 获取或创建账户 */
  private getOrCreateAccount(memberId: string): PointsAccount {
    if (!pointsAccountStore.has(memberId)) {
      pointsAccountStore.set(memberId, {
        memberId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        expiringPoints: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    return pointsAccountStore.get(memberId)!
  }
}
