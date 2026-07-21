import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Logger
} from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { OrderService } from './order.service'
import { PaymentService } from './payment.service'
import { RefundService } from './refund.service'
import { CashierService } from './cashier.service'
import { InventoryItemService } from '../inventory/inventory-item.service'
import { TenantGuard } from '../agent/tenant.guard'
import { Public } from '../foundation/identity-access/public.decorator'
import type {
  CreateOrderInput,
  CreatePaymentInput,
  CreateRefundInput,
  Order,
  OrderItem,
  Payment,
  Refund
} from '@m5/types'

/**
 * Phase-35 T163: CashierController - 收银台 REST API
 *
 * 11 个端点:
 *   - POST   /orders                创建订单 (草稿)
 *   - POST   /orders/:id/submit     提交订单 DRAFT → PENDING
 *   - POST   /orders/:id/cancel     取消订单
 *   - POST   /orders/:id/fulfill    履约 PAID → FULFILLED
 *   - GET    /orders/:id            查询订单
 *   - GET    /orders/:id/items      查询订单行
 *   - GET    /orders                列表 (按 tenantId + 状态/会员/分页)
 *   - POST   /orders/:id/payments   发起支付
 *   - POST   /payments/:id/callback 支付回调 (webhook, mock)
 *   - POST   /orders/:id/refunds    申请退款
 *   - GET    /refunds/:id           查询退款
 *
 * 全部端点 @UseGuards(TenantGuard), tenantId 从 x-tenant-id header 注入
 * userId 从 x-user-id header 注入 (收银员)
 */
@Controller('cashier')
@UseGuards(TenantGuard)
export class CashierController {
  private readonly logger = new Logger(CashierController.name)

  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService,
    private readonly cashierService: CashierService,
    private readonly inventoryItemService: InventoryItemService
  ) {}

  // ── Orders ──

  @Post('orders')
  createOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: CreateOrderInput
  ): Order {
    if (!userId) throw new BadRequestException('x-user-id header required')
    return this.orderService.create(body, { tenantId, userId })
  }

  @Post('orders/:id/submit')
  submitOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ): Order {
    return this.orderService.submit(id, tenantId)
  }

  @Post('orders/:id/cancel')
  cancelOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ): Order {
    return this.orderService.cancel(id, tenantId, body?.reason ?? 'no_reason')
  }

  @Post('orders/:id/fulfill')
  fulfillOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ): Order {
    return this.orderService.fulfill(id, tenantId)
  }

  @Get('orders/:id')
  getOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ): Order {
    const order = this.orderService.getById(id, tenantId)
    if (!order) throw new NotFoundException(`order ${id} not found or cross-tenant`)
    return order
  }

  @Get('orders/:id/items')
  getOrderItems(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ): OrderItem[] {
    return this.orderService.getItems(id, tenantId)
  }

  @Get('orders')
  listOrders(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: string,
    @Query('memberId') memberId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): { items: Order[]; total: number } {
    return this.orderService.list(
      {
        status: status as Order['status'] | undefined,
        memberId,
        fromDate,
        toDate,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined
      },
      tenantId
    )
  }

  // ── Payments ──

  @Post('orders/:id/payments')
  async createPayment(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id') orderId: string,
    @Body() body: Omit<CreatePaymentInput, 'orderId'>
  ): Promise<Payment> {
    if (!userId) throw new BadRequestException('x-user-id header required')
    return this.paymentService.create(
      { ...body, orderId },
      { tenantId, userId }
    )
  }

  @Post('payments/:id/callback')
  paymentCallback(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') paymentId: string,
    @Body() body: { providerTxnId: string }
  ): Payment {
    if (!body?.providerTxnId) {
      throw new BadRequestException('providerTxnId required in callback body')
    }
    return this.paymentService.confirm(paymentId, body.providerTxnId, tenantId)
  }

  // ── Refunds ──

  @Post('orders/:id/refunds')
  createRefund(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id') orderId: string,
    @Body() body: Omit<CreateRefundInput, 'orderId'>
  ): Refund {
    if (!userId) throw new BadRequestException('x-user-id header required')
    return this.refundService.create(
      { ...body, orderId },
      { tenantId, userId }
    )
  }

  @Get('refunds/:id')
  getRefund(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ): Refund {
    const refund = this.refundService.getById(id, tenantId)
    if (!refund) throw new NotFoundException(`refund ${id} not found or cross-tenant`)
    return refund
  }

  // ── POS Facade (Phase-35 T163.5 / P-35) ──

  @Get('members/lookup')
  @Public()
  @ApiOperation({ summary: 'POS 会员查询' })
  async lookupMember(
    @Headers('x-tenant-id') tenantId: string,
    @Query('q') q: string
  ): Promise<{
    id: string
    name: string
    phone: string
    memberNo: string
    tier: string
    points: number
    discountRate: number
  } | null> {
    if (!q) return null

    // 先尝试通过会员 ID 查找
    const inMemory = this.cashierService.memberService.getProfile(q)
    if (inMemory) {
      return {
        id: inMemory.memberId,
        name: inMemory.nickname,
        phone: inMemory.mobile ?? '',
        memberNo: inMemory.memberId,
        tier: inMemory.level,
        points: inMemory.points,
        discountRate: inMemory.level === 'PLATINUM' || inMemory.level === 'DIAMOND' ? 0.92 : 0.95
      }
    }

    // 再尝试持久化查找
    try {
      const persisted = await this.cashierService.memberService.getPersistentProfile(q, { tenantId } as never)
      if (persisted) {
        return {
          id: persisted.memberId,
          name: persisted.nickname,
          phone: persisted.mobile ?? '',
          memberNo: persisted.memberId,
          tier: persisted.level,
          points: persisted.points,
          discountRate: persisted.level === 'PLATINUM' || persisted.level === 'DIAMOND' ? 0.92 : 0.95
        }
      }
    } catch {
      // 持久化查找失败, 不阻塞
    }

    // 全量扫描 — 按 mobile / memberId 模糊匹配
    const allProfiles = this.cashierService.memberService.listProfiles()
    const matched = allProfiles.find(
      (p) => p.mobile === q || p.memberId === q || p.nickname.includes(q)
    )
    if (matched) {
      return {
        id: matched.memberId,
        name: matched.nickname,
        phone: matched.mobile ?? '',
        memberNo: matched.memberId,
        tier: matched.level,
        points: matched.points,
        discountRate: matched.level === 'PLATINUM' || matched.level === 'DIAMOND' ? 0.92 : 0.95
      }
    }

    return null
  }

  @Get('products/:sku')
  @Public()
  @ApiOperation({ summary: 'POS 商品扫码查询' })
  async lookupProduct(
    @Headers('x-tenant-id') tenantId: string,
    @Param('sku') sku: string
  ): Promise<{
    sku: string
    name: string
    price: number
    category: string
  } | null> {
    try {
      const item = this.inventoryItemService.getBySku(sku, tenantId)
      if (item) {
        return {
          sku: item.sku,
          name: item.name,
          price: item.unitPriceCents / 100,
          category: 'default'
        }
      }
    } catch {
      return null
    }
    return null
  }

  @Get('products')
  @Public()
  @ApiOperation({ summary: 'POS 商品目录列表' })
  async listProducts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ): Promise<{
    items: Array<{
      sku: string
      name: string
      price: number
      category: string
      stock: number
    }>
    total: number
  }> {
    const payload = this.inventoryItemService.list({
      tenantId,
      status: 'ACTIVE',
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    })

    return {
      total: payload.total,
      items: payload.items.map((item) => ({
        sku: item.sku,
        name: item.name,
        price: item.unitPriceCents / 100,
        category: 'default',
        stock: item.availableQty,
      })),
    }
  }

  @Get('stats/channels')
  @ApiOperation({ summary: 'POS 支付渠道统计' })
  async getChannelStats(
    @Headers('x-tenant-id') tenantId: string
  ): Promise<{ channel: string; today: number; month: number }[]> {
    return this.cashierService.getChannelStats(tenantId)
  }
}
