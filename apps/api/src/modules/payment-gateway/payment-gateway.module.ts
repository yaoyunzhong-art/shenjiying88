/**
 * PaymentGatewayModule - 本地化支付网关模块
 *
 * T117-3: 本地化支付
 * 支持 PayPal / Stripe / PayPay / 支付宝 / 微信支付 / 本地钱包
 */

import { Module } from '@nestjs/common'
import { PaymentGatewayService } from './payment-gateway.service'
import { PaymentGatewayController } from './payment-gateway.controller'

@Module({
  controllers: [PaymentGatewayController],
  providers: [PaymentGatewayService],
  exports: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
