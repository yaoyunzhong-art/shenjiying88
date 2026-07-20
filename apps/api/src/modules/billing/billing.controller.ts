/**
 * billing.controller.ts — 计费结算 API 端点
 *
 * 提供账单计算、折扣应用、发票管理、支付查询等计费能力。
 *
 * 端点:
 *   POST   /api/billing/calculate       — 计算账单
 *   POST   /api/billing/invoices        — 生成发票
 *   GET    /api/billing/invoices        — 列出发票
 *   GET    /api/billing/invoices/:id    — 查询发票
 *   POST   /api/billing/invoices/:id/pay — 支付发票
 *   GET    /api/billing/payments/:invId — 查询支付状态
 *   GET    /api/billing/discounts       — 列出折扣策略
 *   GET    /api/billing/stats           — 计费统计
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import {
  BillingService,
  BillRequest,
  type Currency,
  type PricingTier,
} from './billing.service'

class CalculateBillDto {
  tenantId!: string
  tier!: PricingTier
  usage!: { apiCalls: number; storageGB: number; bandwidthGB: number; seats: number }
  billingPeriod!: { start: string; end: string }
  currency!: Currency
  couponCode?: string
}

class GenerateInvoiceDto {
  tenantId!: string
  tier!: PricingTier
  usage!: { apiCalls: number; storageGB: number; bandwidthGB: number; seats: number }
  billingPeriod!: { start: string; end: string }
  currency!: Currency
  couponCode?: string
}

class PayInvoiceDto {
  method!: string
}

class ListInvoicesQueryDto {
  tenantId!: string
}

@UseGuards(TenantGuard)
@Controller('api/billing')
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  /**
   * POST /api/billing/calculate
   * 根据用量和套餐计算费用。
   */
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  calculateBill(@Body() body: CalculateBillDto) {
    const request: BillRequest = {
      tenantId: body.tenantId,
      tier: body.tier,
      usage: body.usage,
      billingPeriod: body.billingPeriod,
      currency: body.currency,
      couponCode: body.couponCode,
    }
    const result = this.svc.calculateBill(request)
    return { success: true, data: result }
  }

  /**
   * POST /api/billing/invoices
   * 先生成账单再生成发票。
   */
  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  generateInvoice(@Body() body: GenerateInvoiceDto) {
    const request: BillRequest = {
      tenantId: body.tenantId,
      tier: body.tier,
      usage: body.usage,
      billingPeriod: body.billingPeriod,
      currency: body.currency,
      couponCode: body.couponCode,
    }
    const bill = this.svc.calculateBill(request)
    const invoice = this.svc.generateInvoice(bill)
    return { success: true, data: invoice }
  }

  /**
   * GET /api/billing/invoices
   * 列出指定租户的发票。
   */
  @Get('invoices')
  listInvoices(@Query() query: ListInvoicesQueryDto) {
    const invoices = this.svc.listInvoices(query.tenantId)
    return { success: true, data: { invoices, total: invoices.length } }
  }

  /**
   * GET /api/billing/invoices/:id
   * 查询发票详情（通过支付状态接口）。
   */
  @Get('invoices/:id')
  getInvoice(@Param('id') id: string) {
    const payment = this.svc.getPaymentStatus(id)
    return { success: true, data: payment }
  }

  /**
   * POST /api/billing/invoices/:id/pay
   * 支付指定发票。
   */
  @Post('invoices/:id/pay')
  @HttpCode(HttpStatus.OK)
  payInvoice(@Param('id') id: string, @Body() body: PayInvoiceDto) {
    const payment = this.svc.payInvoice(id, body.method)
    return { success: true, data: payment }
  }

  /**
   * GET /api/billing/payments/:invId
   * 查询支付状态。
   */
  @Get('payments/:invId')
  getPaymentStatus(@Param('invId') invId: string) {
    const payment = this.svc.getPaymentStatus(invId)
    if (!payment) {
      return { success: false, message: `发票 ${invId} 未找到支付记录`, data: null }
    }
    return { success: true, data: payment }
  }

  /**
   * GET /api/billing/discounts
   * 列出所有折扣策略。
   */
  @Get('discounts')
  listDiscounts() {
    const discounts = this.svc.listDiscountPolicies()
    return { success: true, data: { discounts, total: discounts.length } }
  }

  /**
   * GET /api/billing/stats
   * 获取计费统计。
   */
  @Get('stats')
  getStats() {
    const stats = this.svc.getBillingStats()
    return { success: true, data: stats }
  }
}
