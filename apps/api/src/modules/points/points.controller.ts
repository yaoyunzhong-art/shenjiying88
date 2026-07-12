import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  BadRequestException,
  UsePipes,
  ValidationPipe
} from '@nestjs/common'
import { PointsAtomicService } from './points-atomic.service'
import { PointsRiskService, InflationMonitor, CircuitBreaker, ExpirationNotifier } from './points-risk.service'
import {
  PointsTransactionDto,
  PointsTransferDto,
  PointsBatchAwardDto,
  PointsDeductDto,
  PointsAccountQueryDto,
  PointsAccountStatusDto,
  PointsStatisticsQueryDto,
  PointsRecordQueryDto,
  PointsIssuanceRuleDto,
  PointsRedemptionRuleDto,
  CircuitBreakerConfigDto,
  ExpirationReminderConfigDto,
  InflationMonitorConfigDto
} from './points.dto'
import type {
  PointsOperationResult,
  PointsAccount,
  PointsAccountOverview,
  PointsStatistics,
  PointsRecord,
  PointsRiskOverview,
  PointsIssuanceRule,
  PointsRedemptionRule,
  RiskAlertRecord
} from './points.entity'

@Controller('points')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PointsController {
  private issuanceRules: Map<string, PointsIssuanceRule> = new Map()
  private redemptionRules: Map<string, PointsRedemptionRule> = new Map()
  private pointsRecords: PointsRecord[] = []
  private riskAlerts: RiskAlertRecord[] = []
  private alertCounter = 0

  constructor(
    private readonly atomicService: PointsAtomicService,
    private readonly riskService: PointsRiskService
  ) {}

  /** POST /points/transaction - 积分变动（增加/扣减） */
  @Post('transaction')
  async transaction(@Body() dto: PointsTransactionDto): Promise<{ success: boolean; data: PointsOperationResult['data']; error?: string }> {
    if (dto.delta === 0) {
      return { success: false, data: undefined, error: 'Transaction amount must be non-zero' }
    }
    const result = await this.atomicService.incrementPointsAtomic(dto.memberId, dto.delta, dto.reason)
    if (!result.success) {
      return { success: false, data: undefined, error: result.error }
    }

    // 记录流水
    const record: PointsRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      memberId: dto.memberId,
      type: dto.delta > 0 ? 'award' : 'redeem',
      delta: dto.delta,
      balanceAfter: result.data!,
      reason: dto.reason,
      orderId: dto.orderId,
      transactionId: dto.transactionId,
      createdAt: new Date().toISOString()
    }
    this.pointsRecords.push(record)

    // 通知风控
    if (dto.delta > 0) {
      this.riskService.inflation.recordPointIssuance(dto.delta, dto.memberId)
    } else {
      this.riskService.inflation.recordPointRedemption(Math.abs(dto.delta), dto.memberId)
    }

    return {
      success: true,
      data: { newBalance: result.data }
    }
  }

  /** POST /points/transfer - 积分转账 */
  @Post('transfer')
  async transfer(@Body() dto: PointsTransferDto): Promise<{ success: boolean; data: PointsOperationResult['data']; error?: string }> {
    const result = await this.atomicService.transferPointsAtomic(dto.fromMemberId, dto.toMemberId, dto.amount)
    if (!result.success) {
      return { success: false, data: undefined, error: result.error }
    }

    const now = new Date().toISOString()

    // 转出流水
    this.pointsRecords.push({
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      memberId: dto.fromMemberId,
      type: 'transfer_out',
      delta: -dto.amount,
      balanceAfter: result.data!.fromNewBalance,
      reason: dto.reason,
      transactionId: dto.transactionId,
      createdAt: now
    })

    // 转入流水
    this.pointsRecords.push({
      id: `rec_${Date.now() + 1}_${Math.random().toString(36).slice(2, 8)}`,
      memberId: dto.toMemberId,
      type: 'transfer_in',
      delta: dto.amount,
      balanceAfter: result.data!.toNewBalance,
      reason: dto.reason,
      transactionId: dto.transactionId,
      createdAt: now
    })

    return {
      success: true,
      data: {
        fromNewBalance: result.data!.fromNewBalance,
        toNewBalance: result.data!.toNewBalance
      }
    }
  }

  /** POST /points/deduct - 积分抵扣（带幂等） */
  @Post('deduct')
  async deduct(@Body() dto: PointsDeductDto): Promise<{ success: boolean; data: PointsOperationResult['data']; error?: string }> {
    const result = await this.atomicService.deductForPurchaseAtomic(dto.memberId, dto.amount, dto.orderId)
    if (!result.success) {
      return { success: false, data: undefined, error: result.error }
    }

    if (!result.data!.alreadyProcessed) {
      this.pointsRecords.push({
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        memberId: dto.memberId,
        type: 'redeem',
        delta: -dto.amount,
        balanceAfter: result.data!.newBalance,
        reason: dto.reason,
        orderId: dto.orderId,
        transactionId: `deduct_${dto.orderId}`,
        createdAt: new Date().toISOString()
      })
    }

    return { success: true, data: result.data }
  }

  /** POST /points/batch-award - 批量发放积分 */
  @Post('batch-award')
  async batchAward(@Body() dto: PointsBatchAwardDto): Promise<{ success: boolean; data: PointsOperationResult['data']; error?: string }> {
    const result = await this.atomicService.batchAwardAtomic(dto.memberIds, dto.pointsEach, dto.reason)
    if (!result.success) {
      return { success: false, data: undefined, error: result.error }
    }

    const now = new Date().toISOString()
    for (const memberId of dto.memberIds) {
      this.pointsRecords.push({
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        memberId,
        type: 'award',
        delta: dto.pointsEach,
        balanceAfter: result.data!.memberBalances.get(memberId) ?? 0,
        reason: dto.reason,
        transactionId: dto.transactionId,
        createdAt: now
      })
      this.riskService.inflation.recordPointIssuance(dto.pointsEach, memberId)
    }

    return {
      success: true,
      data: { awardedCount: result.data!.awardedCount }
    }
  }

  /** GET /points/balance/:memberId - 查询积分余额 */
  @Get('balance/:memberId')
  getBalance(@Param('memberId') memberId: string): { success: boolean; data: { memberId: string; balance: number } } {
    const balance = this.atomicService.getBalance(memberId)
    return { success: true, data: { memberId, balance } }
  }

  /** GET /points/records - 查询积分流水 */
  @Get('records')
  getRecords(@Query() query: PointsRecordQueryDto): { success: boolean; data: PointsRecord[] } {
    let records = this.pointsRecords

    if (query.memberId) {
      records = records.filter(r => r.memberId === query.memberId)
    }

    if (query.type) {
      records = records.filter(r => r.type === query.type)
    }

    if (query.startDate) {
      records = records.filter(r => r.createdAt >= query.startDate!)
    }

    if (query.endDate) {
      records = records.filter(r => r.createdAt <= query.endDate!)
    }

    // 分页
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const start = (page - 1) * limit
    records = records.slice(start, start + limit)

    return { success: true, data: records }
  }

  /** GET /points/risk-status - 获取风控状态 */
  @Get('risk-status')
  getRiskStatus(): { success: boolean; data: PointsRiskOverview } {
    const alert = this.riskService.inflation.alertIfHigh()
    if (alert) {
      this.riskAlerts.push({
        id: `alert_${++this.alertCounter}`,
        type: 'inflation',
        level: 'warning',
        message: alert.message,
        threshold: alert.threshold,
        actual: alert.actual,
        resolved: false,
        createdAt: new Date().toISOString()
      })
    }

    const endpoints = ['evaluateMemberLevel', 'detectDeviceAnomaly', 'transaction']
    const circuitStatuses = endpoints.map(endpoint => {
      const st = this.riskService.circuitBreaker.getStatus(endpoint)
      return { endpoint, ...st }
    })

    return {
      success: true,
      data: {
        inflationIndex: this.riskService.inflation.getInflationIndex(),
        inflating: !!(isFinite(this.riskService.inflation.getInflationIndex()) && this.riskService.inflation.getInflationIndex() > 1.2),
        circuitStatuses,
        activeReminders: this.riskService.expiration.getAllReminders().length,
        recentAlerts: this.riskAlerts.slice(-10)
      }
    }
  }

  /** POST /points/risk/reset - 重置风控状态 */
  @Post('risk/reset')
  resetRisk(): { success: boolean; message: string } {
    this.riskService.inflation.reset()
    this.riskService.circuitBreaker.resetAll()
    this.riskService.expiration.clear()
    this.riskAlerts = []
    return { success: true, message: '风控状态已重置' }
  }

  /** POST /points/risk/schedule-reminder - 安排过期提醒 */
  @Post('risk/schedule-reminder')
  scheduleReminder(
    @Body() body: { memberId: string; points: number; expireAt: string }
  ): { success: boolean; message: string } {
    if (!body.memberId || body.points === undefined || !body.expireAt) {
      throw new BadRequestException('memberId, points, and expireAt are required')
    }

    this.riskService.expiration.scheduleReminder(body.memberId, body.points, new Date(body.expireAt))
    return { success: true, message: `已安排会员 ${body.memberId} 的过期提醒` }
  }

  /** POST /points/risk/send-reminder - 手动发送提醒 */
  @Post('risk/send-reminder')
  sendReminder(
    @Body() body: { memberId: string; points: number }
  ): { success: boolean; sent: boolean } {
    const sent = this.riskService.expiration.sendReminder(body.memberId, body.points)
    return { success: true, sent }
  }
}
