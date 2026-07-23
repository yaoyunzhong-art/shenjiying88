/**
 * finance-reconciliation.controller.ts — P-38 财务对账 REST API
 *
 * 端点:
 *   - 对账批次管理
 *   - 对账交易管理
 *   - 自动/手动匹配
 *   - 调账处理
 *   - 统计查询
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Logger,
  UseGuards
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { FinanceReconciliationService } from './finance-reconciliation.service'
import {
  CreateReconciliationBatchDto,
  ReconciliationBatchQueryDto,
  CreateReconciliationTransactionDto,
  UpdateReconciliationTransactionDto,
  ReconciliationTransactionQueryDto,
  ManualMatchDto,
  ManualAdjustmentDto,
  ReconciliationStatsQueryDto,
  ReconciliationQueryDto,
  ReconciliationChannel
} from './dto/create-reconciliation.dto'

/**
 * 无需显式 TenantGuard — @TenantContext() 内部处理租户注入
 */
@UseGuards(TenantGuard)
@Controller('finance/reconciliation')
export class FinanceReconciliationController {
  private readonly logger = new Logger(FinanceReconciliationController.name)

  constructor(
    private readonly reconciliationService: FinanceReconciliationService
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // 对账批次
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/finance/reconciliation/batches
   * 创建对账批次
   */
  @Post('batches')
  createBatch(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateReconciliationBatchDto
  ) {
    return this.reconciliationService.createReconciliationBatch(tenantContext, body)
  }

  /**
   * GET /api/finance/reconciliation/batches
   * 查询对账批次列表
   */
  @Get('batches')
  listBatches(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ReconciliationBatchQueryDto = {} as ReconciliationBatchQueryDto
  ) {
    return this.reconciliationService.listReconciliationBatches(tenantContext, query)
  }

  /**
   * GET /api/finance/reconciliation/batches/:batchId
   * 获取对账批次详情
   */
  @Get('batches/:batchId')
  getBatch(
    @Param('batchId') batchId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.reconciliationService.getReconciliationBatch(batchId, tenantContext)
  }

  /**
   * POST /api/finance/reconciliation/batches/:batchId/complete
   * 完成对账批次
   */
  @Post('batches/:batchId/complete')
  completeBatch(
    @Param('batchId') batchId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.reconciliationService.completeReconciliationBatch(batchId, tenantContext)
  }

  /**
   * GET /api/finance/reconciliation/batches/:batchId/progress
   * 获取对账批次进度
   */
  @Get('batches/:batchId/progress')
  getBatchProgress(
    @Param('batchId') batchId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.reconciliationService.getBatchProgress(batchId, tenantContext)
  }

  /**
   * GET /api/finance/reconciliation/batches/:batchId/summary
   * 获取对账批次汇总
   */
  @Get('batches/:batchId/summary')
  getBatchSummary(
    @Param('batchId') batchId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.reconciliationService.getReconciliationSummary(batchId, tenantContext)
  }

  // ═══════════════════════════════════════════════════════════════
  // 对账交易
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/finance/reconciliation/transactions
   * 创建对账交易记录
   */
  @Post('transactions')
  createTransaction(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateReconciliationTransactionDto
  ) {
    return this.reconciliationService.createReconciliationTransaction(tenantContext, body)
  }

  /**
   * GET /api/finance/reconciliation/transactions
   * 查询对账交易列表
   */
  @Get('transactions')
  listTransactions(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ReconciliationTransactionQueryDto = {} as ReconciliationTransactionQueryDto
  ) {
    return this.reconciliationService.listReconciliationTransactions(tenantContext, query)
  }

  /**
   * GET /api/finance/reconciliation/transactions/:transactionId
   * 获取对账交易详情
   */
  @Get('transactions/:transactionId')
  getTransaction(
    @Param('transactionId') transactionId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.reconciliationService.getReconciliationTransaction(transactionId, tenantContext)
  }

  /**
   * PUT /api/finance/reconciliation/transactions/:transactionId
   * 更新对账交易
   */
  @Put('transactions/:transactionId')
  updateTransaction(
    @Param('transactionId') transactionId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: UpdateReconciliationTransactionDto
  ) {
    return this.reconciliationService.updateReconciliationTransaction(transactionId, tenantContext, body)
  }

  // ═══════════════════════════════════════════════════════════════
  // 匹配操作
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/finance/reconciliation/batches/:batchId/auto-match
   * 自动匹配
   */
  @Post('batches/:batchId/auto-match')
  autoMatch(
    @Param('batchId') batchId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: {
      externalTransactions: Array<{
        channelTransactionNo: string
        amount: number
        channelFee: number
        transactionTime: string
      }>
    }
  ) {
    return this.reconciliationService.autoMatch(batchId, tenantContext, body.externalTransactions)
  }

  /**
   * POST /api/finance/reconciliation/manual-match
   * 手动匹配
   */
  @Post('manual-match')
  manualMatch(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ManualMatchDto
  ) {
    return this.reconciliationService.manualMatch(tenantContext, body)
  }

  /**
   * POST /api/finance/reconciliation/adjustment
   * 手动调账
   */
  @Post('adjustment')
  manualAdjustment(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ManualAdjustmentDto
  ) {
    return this.reconciliationService.manualAdjustment(tenantContext, body)
  }

  // ═══════════════════════════════════════════════════════════════
  // 导入
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/finance/reconciliation/import
   * 批量导入外部交易
   */
  @Post('import')
  importExternalTransactions(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: {
      channel: ReconciliationChannel
      transactions: Array<{
        channelTransactionNo: string
        amount: number
        channelFee: number
        type: 'PAYMENT' | 'REFUND' | 'SETTLEMENT'
        transactionTime: string
        memo?: string
      }>
    }
  ) {
    return this.reconciliationService.importExternalTransactions(
      tenantContext,
      body.channel,
      body.transactions
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // 统计
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/finance/reconciliation/stats
   * 获取对账统计
   */
  /**
   * POST /api/finance/reconciliation/query
   * 查询对账历史记录（按日期范围/门店/状态筛选）
   */
  @Post('query')
  queryReconciliationHistory(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ReconciliationQueryDto
  ) {
    return this.reconciliationService.queryReconciliationHistory(tenantContext, body)
  }

  @Get('stats')
  getReconciliationStats(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ReconciliationStatsQueryDto = {} as ReconciliationStatsQueryDto
  ) {
    return this.reconciliationService.getReconciliationStats(tenantContext, query)
  }

  /**
   * GET /api/finance/reconciliation/channels
   * 获取支持的对账渠道
   */
  @Get('channels')
  getChannels() {
    return this.reconciliationService.getReconciliationChannels()
  }
}
