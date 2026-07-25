import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateReturnRequestDto,
  ReturnRequestQueryDto,
  UpdateReturnRequestDto,
  UpdateReturnStatusDto,
} from './return-request.dto'
import { ReturnRequestService } from './return-request.service'
import { TenantGuard } from '../agent/tenant.guard'
import {
  RequirePermissions,
  RequireTenantScope
} from '../foundation/identity-access/identity-access.decorator'

const RETURNS_READ_PERMISSION = 'returns:read'
const RETURNS_DETAIL_PERMISSION = 'returns:id:read'

@Controller('return-requests')
@UseGuards(TenantGuard)
@RequireTenantScope()
@RequirePermissions(RETURNS_READ_PERMISSION)
export class ReturnRequestController {
  constructor(private readonly returnService: ReturnRequestService) {}

  // ── CRUD ──

  @Post()
  createReturn(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateReturnRequestDto
  ) {
    return this.returnService.createReturn({
      tenantId: tenantContext.tenantId,
      returnNo: body.returnNo,
      orderNo: body.orderNo,
      itemName: body.itemName,
      quantity: body.quantity,
      type: body.type,
      reason: body.reason,
      customerName: body.customerName,
      amount: body.amount,
      images: body.images,
      remark: body.remark,
    })
  }

  @Get()
  listReturns(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ReturnRequestQueryDto
  ) {
    return this.returnService.listReturns(tenantContext.tenantId, {
      type: query.type,
      status: query.status,
      customerName: query.customerName,
      search: query.search,
    })
  }

  @Get(':returnId')
  @RequirePermissions(RETURNS_DETAIL_PERMISSION)
  getReturn(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('returnId') returnId: string
  ) {
    const ret = this.returnService.getReturn(returnId, tenantContext.tenantId)
    if (!ret) {
      throw new Error(`Return request not found: ${returnId}`)
    }
    return ret
  }

  @Patch(':returnId')
  @RequirePermissions(RETURNS_DETAIL_PERMISSION)
  updateReturn(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('returnId') returnId: string,
    @Body() body: UpdateReturnRequestDto
  ) {
    return this.returnService.updateReturn(returnId, tenantContext.tenantId, body)
  }

  @Delete(':returnId')
  @RequirePermissions(RETURNS_DETAIL_PERMISSION)
  deleteReturn(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('returnId') returnId: string
  ) {
    this.returnService.deleteReturn(returnId, tenantContext.tenantId)
    return { success: true }
  }

  // ── Workflow ──

  @Patch(':returnId/status')
  @RequirePermissions(RETURNS_DETAIL_PERMISSION)
  updateReturnStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('returnId') returnId: string,
    @Body() body: UpdateReturnStatusDto
  ) {
    return this.returnService.updateReturnStatus(
      returnId,
      body.status,
      tenantContext.tenantId,
      body.remark
    )
  }

  // ── Query views ──

  @Get('views/pending')
  getPendingReturns(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.returnService.getPendingReturns(tenantContext.tenantId)
  }

  @Get('customer/:customerName')
  getReturnsByCustomer(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('customerName') customerName: string
  ) {
    return this.returnService.getReturnsByCustomer(customerName, tenantContext.tenantId)
  }

  @Get('order/:orderNo')
  getReturnsByOrder(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('orderNo') orderNo: string
  ) {
    return this.returnService.getReturnsByOrder(orderNo, tenantContext.tenantId)
  }
}
