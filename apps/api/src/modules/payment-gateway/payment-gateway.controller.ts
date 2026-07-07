/**
 * PaymentGatewayController - 本地化支付网关 HTTP 接口
 *
 * T117-3: 本地化支付
 *
 * 端点:
 *   POST /payment-gateway/pay          - 发起支付
 *   GET  /payment-gateway/pay/:id      - 查询支付结果
 *   POST /payment-gateway/refund       - 发起退款
 *   GET  /payment-gateway/refund/:id   - 查询退款状态
 */

import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common'
import { PaymentGatewayService, PaymentError } from './payment-gateway.service'
import { PayRequestDto, PayResultDto, RefundRequestDto } from './payment-gateway.dto'

@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  /**
   * 发起支付
   * POST /payment-gateway/pay
   */
  @Post('pay')
  async pay(@Body() dto: PayRequestDto): Promise<PayResultDto> {
    try {
      return await this.paymentGatewayService.pay({
        orderId: dto.orderId,
        amount: dto.amount,
        currency: dto.currency,
        provider: dto.provider,
        metadata: dto.metadata,
        locale: dto.locale,
        returnUrl: dto.returnUrl,
        webhookUrl: dto.webhookUrl,
      })
    } catch (error) {
      if (error instanceof PaymentError) {
        throw new HttpException(
          { code: error.code, message: error.message },
          HttpStatus.BAD_REQUEST,
        )
      }
      throw error
    }
  }

  /**
   * 查询支付结果
   * GET /payment-gateway/pay/:id
   */
  @Get('pay/:id')
  async queryPayment(@Param('id') id: string): Promise<PayResultDto> {
    try {
      return await this.paymentGatewayService.query(id)
    } catch (error) {
      if (error instanceof PaymentError) {
        const status =
          error.code === 'TRANSACTION_NOT_FOUND'
            ? HttpStatus.NOT_FOUND
            : HttpStatus.BAD_REQUEST
        throw new HttpException(
          { code: error.code, message: error.message },
          status,
        )
      }
      throw error
    }
  }

  /**
   * 发起退款
   * POST /payment-gateway/refund
   */
  @Post('refund')
  async refund(@Body() dto: RefundRequestDto): Promise<PayResultDto> {
    try {
      return await this.paymentGatewayService.refund({
        transactionId: dto.transactionId,
        amount: dto.amount,
        reason: dto.reason,
      })
    } catch (error) {
      if (error instanceof PaymentError) {
        const status =
          error.code === 'TRANSACTION_NOT_FOUND'
            ? HttpStatus.NOT_FOUND
            : HttpStatus.BAD_REQUEST
        throw new HttpException(
          { code: error.code, message: error.message },
          status,
        )
      }
      throw error
    }
  }

  /**
   * 查询退款状态
   * GET /payment-gateway/refund/:id
   */
  @Get('refund/:id')
  async queryRefund(@Param('id') id: string): Promise<PayResultDto> {
    try {
      return await this.paymentGatewayService.queryRefund(id)
    } catch (error) {
      if (error instanceof PaymentError) {
        const status =
          error.code === 'REFUND_NOT_FOUND'
            ? HttpStatus.NOT_FOUND
            : HttpStatus.BAD_REQUEST
        throw new HttpException(
          { code: error.code, message: error.message },
          status,
        )
      }
      throw error
    }
  }
}
