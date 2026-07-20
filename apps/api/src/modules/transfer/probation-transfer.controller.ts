import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateProbationTransferDto,
  ApproveProbationTransferDto,
  ProbationQueryDto,
} from './probation-transfer.dto'
import { ProbationTransferService } from './probation-transfer.service'
import { ProbationStatus } from './probation-transfer.entity'
import { type ProbationStats } from './probation-transfer.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('probation-transfers')
@UseGuards(TenantGuard)
export class ProbationTransferController {
  constructor(private readonly transferService: ProbationTransferService) {}

  // ── Transfer CRUD ──

  @Post()
  createTransfer(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateProbationTransferDto,
  ) {
    return this.transferService.createTransfer({
      tenantId: tenantContext.tenantId,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      department: body.department,
      position: body.position,
      probationDuration: body.probationDuration,
      probationStart: body.probationStart,
      probationEnd: body.probationEnd,
      evaluation: body.evaluation,
      approver: body.approver,
    })
  }

  @Get()
  listTransfers(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ProbationQueryDto,
  ) {
    return this.transferService.listTransfers(tenantContext.tenantId, {
      status: query.status,
      employeeId: query.employeeId,
      department: query.department,
      approver: query.approver,
      fromDate: query.fromDate,
      toDate: query.toDate,
    })
  }

  @Get(':transferId')
  getTransfer(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('transferId') transferId: string,
  ) {
    const transfer = this.transferService.getTransfer(transferId, tenantContext.tenantId)
    if (!transfer) {
      throw new Error(`Probation transfer not found: ${transferId}`)
    }
    return transfer
  }

  // ── Approval Flow ──

  @Patch(':transferId/approve')
  approveTransfer(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('transferId') transferId: string,
    @Body() body: ApproveProbationTransferDto,
  ) {
    return this.transferService.approveTransfer(
      transferId,
      body.status,
      tenantContext.tenantId,
      {
        performanceRating: body.performanceRating,
        approvalRemark: body.approvalRemark,
        rejectReason: body.rejectReason,
      },
    )
  }

  // ── Statistics ──

  @Get('stats')
  getStats(
    @TenantContext() tenantContext: RequestTenantContext,
  ): ProbationStats {
    return this.transferService.getStats(tenantContext.tenantId)
  }

  // ── Mock Seed ──

  @Post('seed')
  seedMockData(@TenantContext() tenantContext: RequestTenantContext) {
    this.transferService.seedMockData(tenantContext.tenantId)
    return { message: 'Mock probation transfer data seeded' }
  }
}
