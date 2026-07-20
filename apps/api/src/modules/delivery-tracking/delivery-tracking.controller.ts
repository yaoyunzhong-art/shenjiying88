import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateDeliveryDto,
  CreateDeliveryEventDto,
  DeliveryQueryDto,
  UpdateDeliveryDto,
  UpdateDeliveryStatusDto,
} from './delivery-tracking.dto'
import { DeliveryTrackingService } from './delivery-tracking.service'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('delivery-tracking')
@UseGuards(TenantGuard)
export class DeliveryTrackingController {
  constructor(private readonly deliveryService: DeliveryTrackingService) {}

  // ── Delivery CRUD ──

  @Post()
  createDelivery(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateDeliveryDto,
  ) {
    return this.deliveryService.createDelivery({
      tenantId: tenantContext.tenantId,
      orderNo: body.orderNo,
      method: body.method,
      carrier: body.carrier,
      trackingNo: body.trackingNo,
      sender: body.sender,
      receiver: body.receiver,
      receiverPhone: body.receiverPhone,
      receiverAddress: body.receiverAddress,
      estimatedAt: body.estimatedAt,
      remark: body.remark,
    })
  }

  @Get()
  listDeliveries(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: DeliveryQueryDto,
  ) {
    return this.deliveryService.listDeliveries(tenantContext.tenantId, {
      status: query.status,
      method: query.method,
      orderNo: query.orderNo,
    })
  }

  @Get(':deliveryId')
  getDelivery(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('deliveryId') deliveryId: string,
  ) {
    const delivery = this.deliveryService.getDelivery(deliveryId, tenantContext.tenantId)
    if (!delivery) {
      throw new Error(`Delivery not found: ${deliveryId}`)
    }
    return delivery
  }

  @Patch(':deliveryId')
  updateDelivery(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('deliveryId') deliveryId: string,
    @Body() body: UpdateDeliveryDto,
  ) {
    return this.deliveryService.updateDelivery(deliveryId, tenantContext.tenantId, body)
  }

  @Patch(':deliveryId/status')
  updateDeliveryStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('deliveryId') deliveryId: string,
    @Body() body: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateDeliveryStatus(
      deliveryId,
      body.status,
      tenantContext.tenantId,
      body.remark,
    )
  }

  // ── Events / Timeline ──

  @Post(':deliveryId/events')
  addDeliveryEvent(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('deliveryId') deliveryId: string,
    @Body() body: CreateDeliveryEventDto,
  ) {
    // Verify delivery exists
    const delivery = this.deliveryService.getDelivery(deliveryId, tenantContext.tenantId)
    if (!delivery) {
      throw new Error(`Delivery not found: ${deliveryId}`)
    }
    return this.deliveryService.addEvent({
      deliveryId,
      status: body.status,
      location: body.location,
      description: body.description,
      timestamp: body.timestamp,
    })
  }

  @Get(':deliveryId/timeline')
  getTrackingTimeline(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.deliveryService.getTrackingTimeline(deliveryId, tenantContext.tenantId)
  }

  // ── Mock Seed ──

  @Post('seed')
  seedMockData(@TenantContext() tenantContext: RequestTenantContext) {
    this.deliveryService.seedMockData(tenantContext.tenantId)
    return { message: 'Mock delivery data seeded' }
  }
}
