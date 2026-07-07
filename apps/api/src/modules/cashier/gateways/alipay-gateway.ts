import { createSign, createVerify, createHmac, randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import type { PaymentMethod } from '@m5/types'
import {
  BasePaymentGateway,
  type BasePaymentGatewayConfig,
  type CallbackVerifyResult
} from './base-payment-gateway'

/**
 * AlipayGateway · 支付宝 OpenAPI 2.0 适配器
 *
 * 通道: ALIPAY
 * 网关: https://openapi.alipay.com/gateway.do
 *
 * 实现 5 个 abstract 方法:
 *   - createPrepay:   alipay.trade.precreate (扫码) / alipay.trade.page.pay (网页)
 *   - query:          alipay.trade.query
 *   - refund:         alipay.trade.refund
 *   - verifyCallback: alipay.notify 验签 (RSA2 over 排序后 queryString)
 *   - downloadReconciliation: alipay.data.bill.acceptquery (P1-2)
 *
 * 签名 (OpenAPI 2.0):
 *   1. 剔除 sign/sign_type/空值, 升序排序剩余字段
 *   2. 拼字符串: k1=v1&k2=v2&...
 *   3. 用应用私钥 RSA2 (SHA256) 签名
 *   4. Base64 编码, 附在 sign 字段
 *
 * 验签 (回调):
 *   1. 从 notify_id 拉 alipay.open.app.alipaycert (P1-2 落地)
 *   2. 用支付宝公钥 RSA2 verify
 *   3. 校 sign_type=RSA2
 */

const ALIPAY_ERROR_CODE_MAP: Record<string, string> = {
  'ACQ.TRADE_NOT_EXIST': 'PAY_TRADE_NOT_FOUND',
  'ACQ.PAYMENT_FAIL': 'PAY_USER_DECLINED',
  'ACQ.SYSTEM_ERROR': 'PAY_GATEWAY_DOWN',
  'ACQ.INVALID_PARAMETER': 'PAY_INVALID_REQUEST',
  'ACQ.TRADE_STATUS_ERROR': 'PAY_TRADE_STATE_ERROR',
  'ACQ.OVERDUE_SIGN': 'PAY_CERT_EXPIRED'
}

@Injectable()
export class AlipayGateway extends BasePaymentGateway {
  private static readonly GATEWAY_NAME = 'alipay-openapi-2'
  private static readonly TOLERANCE_SECONDS = 300
  private static readonly SIGN_TYPE_RSA2 = 'RSA2'
  private readonly logger = new Logger(AlipayGateway.name)

  /** 应用私钥 (PEM, 用于请求签名) */
  private readonly privateKey: string
  /** 支付宝公钥 (PEM, 用于回调验签) */
  private readonly alipayPublicKey: string

  constructor(config: AlipayGatewayConfig) {
    super({
      ...config,
      channel: 'ALIPAY',
      errorCodeMap: { ...ALIPAY_ERROR_CODE_MAP, ...(config.errorCodeMap ?? {}) }
    })
    if (!config.privateKey || !config.alipayPublicKey) {
      throw new Error('AlipayGateway: privateKey + alipayPublicKey required')
    }
    this.privateKey = config.privateKey
    this.alipayPublicKey = config.alipayPublicKey
  }

  override readonly gatewayName = AlipayGateway.GATEWAY_NAME

  // ─── createPrepay (扫码 alipay.trade.precreate) ────────

  async createPrepay(
    order: { id: string; totalCents: number },
    method: PaymentMethod
  ): Promise<{
    prepayId: string
    codeUrl?: string
    expiresAt: string
  }> {
    if (method !== 'ALIPAY') {
      throw new Error(`AlipayGateway does not support method=${method}`)
    }

    const params: Record<string, string> = {
      app_id: this.appId(),
      method: 'alipay.trade.precreate',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: AlipayGateway.SIGN_TYPE_RSA2,
      timestamp: this.timestamp(),
      version: '1.0',
      biz_content: JSON.stringify({
        out_trade_no: order.id,
        total_amount: (order.totalCents / 100).toFixed(2),
        subject: `M5 订单 ${order.id}`,
        timeout_express: '15m',
        notify_url: this.notifyUrl()
      })
    }
    params.sign = this.signRequestParams(params)

    type AlipayResponse = {
      alipay_trade_precreate_response: { out_trade_no: string; qr_code?: string }
      alipay_cert_sn?: string
      sign: string
    }
    const response = await this.httpRequest<AlipayResponse>(
      '/gateway.do',
      { method: 'POST', body: this.encodeFormBody(params) }
    )

    const inner = response.alipay_trade_precreate_response
    return {
      prepayId: inner.out_trade_no,
      codeUrl: inner.qr_code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }
  }

  // ─── query (alipay.trade.query) ────────────────────────

  async query(providerTxnId: string): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'FAILED'
    paidAt?: string
    failureReason?: string
  }> {
    const params: Record<string, string> = {
      app_id: this.appId(),
      method: 'alipay.trade.query',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: AlipayGateway.SIGN_TYPE_RSA2,
      timestamp: this.timestamp(),
      version: '1.0',
      biz_content: JSON.stringify({ out_trade_no: providerTxnId })
    }
    params.sign = this.signRequestParams(params)

    type QueryResponse = {
      alipay_trade_query_response: {
        out_trade_no: string
        trade_status:
          | 'WAIT_BUYER_PAY'
          | 'TRADE_CLOSED'
          | 'TRADE_SUCCESS'
          | 'TRADE_FINISHED'
          | 'TRADE_REFUND'
        send_pay_date?: string
        sub_msg?: string
      }
      sign: string
    }
    const response = await this.httpRequest<QueryResponse>(
      '/gateway.do',
      { method: 'POST', body: this.encodeFormBody(params) }
    )

    const inner = response.alipay_trade_query_response
    switch (inner.trade_status) {
      case 'TRADE_SUCCESS':
      case 'TRADE_FINISHED':
        return { status: 'SUCCESS', paidAt: inner.send_pay_date }
      case 'WAIT_BUYER_PAY':
        return { status: 'PENDING' }
      case 'TRADE_CLOSED':
      case 'TRADE_REFUND':
        return { status: 'FAILED', failureReason: inner.sub_msg ?? inner.trade_status }
      default:
        return { status: 'PENDING' }
    }
  }

  // ─── refund (alipay.trade.refund) ──────────────────────

  async refund(input: { paymentId: string; amountCents: number; reason: string }): Promise<{
    providerRefundId: string
  }> {
    const params: Record<string, string> = {
      app_id: this.appId(),
      method: 'alipay.trade.refund',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: AlipayGateway.SIGN_TYPE_RSA2,
      timestamp: this.timestamp(),
      version: '1.0',
      biz_content: JSON.stringify({
        out_trade_no: input.paymentId,
        refund_amount: (input.amountCents / 100).toFixed(2),
        refund_reason: input.reason.slice(0, 80)
      })
    }
    params.sign = this.signRequestParams(params)

    type RefundResponse = {
      alipay_trade_refund_response: { trade_no: string; refund_fee: string }
    }
    const response = await this.httpRequest<RefundResponse>(
      '/gateway.do',
      { method: 'POST', body: this.encodeFormBody(params) }
    )
    return { providerRefundId: response.alipay_trade_refund_response.trade_no }
  }

  // ─── verifyCallback (notify URL 验签) ──────────────────

  verifyCallback(input: {
    rawBody: string
    signature: string
    timestamp: string
    toleranceSeconds?: number
  }): CallbackVerifyResult {
    const tolerance = input.toleranceSeconds ?? AlipayGateway.TOLERANCE_SECONDS
    if (!input.signature) {
      return { verified: false, reason: 'missing-signature' }
    }

    // 解析 form body: k1=v1&k2=v2 → map
    const params = this.parseFormBody(input.rawBody)
    if (params.sign_type !== AlipayGateway.SIGN_TYPE_RSA2) {
      return { verified: false, reason: 'signature-mismatch' }
    }
    const ageSeconds = Math.abs(Date.now() / 1000 - Number(params.notify_time ?? 0))
    if (ageSeconds > tolerance) {
      return { verified: false, reason: 'timestamp-out-of-tolerance' }
    }

    // 1. 剔 sign/sign_type, 排序剩余
    const verifyParams = Object.entries(params)
      .filter(([k]) => k !== 'sign' && k !== 'sign_type')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${decodeURIComponent(v)}`)
      .join('&')

    // 2. 用支付宝公钥 RSA2 verify
    const verifier = createVerify('RSA-SHA256')
    verifier.update(verifyParams, 'utf8')
    const verified = verifier.verify(this.alipayPublicKey, input.signature, 'base64')
    return verified ? { verified: true } : { verified: false, reason: 'signature-mismatch' }
  }

  // ─── downloadReconciliation (P1-2 落地) ────────────────

  override async downloadReconciliation(date: string): Promise<Buffer> {
    // 账单查询: alipay.data.bill.acceptquery → 拿账单 URL → 下载
    // 此处为占位, 真实实现见 P1-2
    throw new Error(
      `[${AlipayGateway.GATEWAY_NAME}] downloadReconciliation not implemented (P1-2 schedule)`
    )
  }

  // ─── 私有工具 ─────────────────────────────────────────

  private appId(): string {
    return this.config.staticHeaders?.['x-pay-app-id'] ?? 'PLACEHOLDER_APP_ID'
  }

  private notifyUrl(): string {
    return this.config.staticHeaders?.['x-pay-notify-url'] ?? 'https://m5.test/api/payment/callback/alipay'
  }

  private timestamp(): string {
    return new Date().toISOString().replace(/\.\d{3}Z$/, '+08:00')
  }

  /**
   * OpenAPI 2.0 签名: 排序后字段拼字符串 + RSA2-SHA256 私钥签名 + Base64
   */
  private signRequestParams(params: Record<string, string>): string {
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    const signer = createSign('RSA-SHA256')
    signer.update(sorted, 'utf8')
    return signer.sign(this.privateKey, 'base64')
  }

  private encodeFormBody(params: Record<string, string>): string {
    return Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
  }

  private parseFormBody(rawBody: string): Record<string, string> {
    const result: Record<string, string> = {}
    for (const pair of rawBody.split('&')) {
      if (!pair) continue
      const [k, v] = pair.split('=')
      if (k) result[decodeURIComponent(k)] = v ?? ''
    }
    return result
  }
}

export interface AlipayGatewayConfig extends Omit<BasePaymentGatewayConfig, 'channel'> {
  /** 应用私钥 (PEM, RSA2 2048) */
  privateKey: string
  /** 支付宝公钥 (PEM, 用于回调验签) */
  alipayPublicKey: string
}
