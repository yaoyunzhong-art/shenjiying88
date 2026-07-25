/**
 * transaction.controller.ts — 收银流水 API
 *
 * Day6 创新任务: 日结/月结/流水查询
 *
 * 端点:
 *  - POST /api/cashier/transactions         创建流水
 *  - GET  /api/cashier/transactions         查询流水
 *  - GET  /api/cashier/transactions/:id     单条流水
 *  - GET  /api/cashier/transactions/daily-summary  日结
 *  - GET  /api/cashier/transactions/monthly-summary 月结
 *  - POST /api/cashier/transactions/offline/enqueue  离线入队
 *  - POST /api/cashier/transactions/offline/flush    离线同步
 *  - GET  /api/cashier/transactions/stats  存储统计
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { CashierTransactionPersistenceService } from './persistence.service'
import type { TransactionRecord, TransactionStatus, DailySummary, MonthlySummary } from './persistence.types'

@Controller('api/cashier/transactions')
export class CashierTransactionController {
  private readonly logger = new Logger(CashierTransactionController.name)

  constructor(
    private readonly service: CashierTransactionPersistenceService
  ) {}

  // ── 流水 CRUD ──────────────────────────────────────────

  /** 创建流水 */
  @Post()
  create(
    @Body() input: Omit<TransactionRecord, 'transactionId' | 'createdAt' | 'synced' | 'syncRetryCount'>
  ): TransactionRecord {
    return this.service.create(input)
  }

  /** 查询流水列表 */
  @Get()
  query(
    @Query('tenantId') tenantId: string,
    @Query('storeId') storeId?: string,
    @Query('channel') channel?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('operatorId') operatorId?: string,
    @Query('status') status?: TransactionStatus,
  ): TransactionRecord[] {
    return this.service.query({
      tenantId,
      storeId,
      channel,
      startDate,
      endDate,
      operatorId,
      status,
    })
  }

  /** 单条流水详情 */
  @Get(':id')
  getById(@Param('id') id: string): TransactionRecord | undefined {
    return this.service.getById(id)
  }

  // ── 日结 / 月结 ────────────────────────────────────────

  /** 日结统计 */
  @Get('daily-summary')
  dailySummary(
    @Query('tenantId') tenantId: string,
    @Query('storeId') storeId: string,
    @Query('date') date: string,
  ): DailySummary {
    // 优先返回缓存
    const cached = this.service.getDailySummary(tenantId, storeId, date)
    if (cached) return cached
    return this.service.computeDailySummary(tenantId, storeId, date)
  }

  /** 月结统计 */
  @Get('monthly-summary')
  monthlySummary(
    @Query('tenantId') tenantId: string,
    @Query('storeId') storeId: string,
    @Query('yearMonth') yearMonth: string,
  ): MonthlySummary {
    return this.service.computeMonthlySummary(tenantId, storeId, yearMonth)
  }

  // ── 离线同步 ───────────────────────────────────────────

  /** 离线流水入队 */
  @Post('offline/enqueue')
  enqueueOffline(@Body() record: TransactionRecord): {
    enqueued: boolean
    cacheSize: number
    triggerSync: boolean
  } {
    return this.service.enqueueOffline(record)
  }

  /** 手动触发离线同步 */
  @Post('offline/flush')
  @HttpCode(HttpStatus.OK)
  flushOffline(@Body() body: { records: TransactionRecord[] }): { synced: number } {
    const result = this.service.flushOffline(() => ({
      success: body.records.map((r) => r.transactionId),
      failed: [],
      conflict: [],
    }))
    return { synced: result.success.length }
  }

  // ── 运维 ───────────────────────────────────────────────

  /** 存储统计 */
  @Get('stats')
  stats(): ReturnType<CashierTransactionPersistenceService['stats']> {
    return this.service.stats()
  }
}
