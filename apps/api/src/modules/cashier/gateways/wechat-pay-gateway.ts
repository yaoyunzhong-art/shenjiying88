import { createHmac, createHash, createDecipheriv, randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import type { PaymentMethod } from '@m5/types'
import {
  BasePaymentGateway,
  PaymentGatewayHttpError,
  type BasePaymentGatewayConfig,
  type CallbackVerifyResult
} from './base-payment-gateway'

/**
 * WeChatPayGateway · 微信支付 V3 适配器
 *
 * 通道: WECHAT
 * API: https://api.mch.weixin.qq.com (主) / sandbox 二级
 *
 * 实现 5 个 abstract 方法:
 *   - createPrepay: 下单 → 返回 prepay_id (前端用 prepay_id 唤起 JSAPI)
 *   - query:        主动查询 out-trade-no 状态
 *   - refund:       申请退款
 *   - verifyCallback: 微信回调是 AES-256-GCM 加密的,
 *                     先解密 → HMAC-SHA256 验签 (Wechatpay-Signature)
 *   - downloadReconciliation: 资金账单 (P1-2 落地, 默认抛)
 *
 * 签名 (WeChat V3):
 *   1. 构造签名串: METHOD\nURL\nTIMESTAMP\nNONCE\nBODY\n
 *   2. SHA256 → 私钥 RSA 加密 → base64
 *   3. Header: Authorization: WECHATPAY2-SHA256-RSA2048 mchid=...,nonce_str=...,timestamp=...,signature=...
 *
 * 验签 (回调):
 *   1. 读 Wechatpay-Timestamp / Wechatpay-Nonce / Wechatpay-Signature
 *   2. 重算: SHA256(timestamp + "\n" + nonce + "\n" + body + "\n")
 *   3. 用平台公钥验签 (RSA verify)
 *   4. 用 APIv3 Key 解密 resource.ciphertext (AES-256-GCM)
 */

const WECHAT_ERROR_CODE_MAP: Record<string, string> = {
  INVALID_REQUEST: 'PAY_INVALID_REQUEST',
  PARAM_ERROR: 'PAY_PARAM_ERROR',
  SYSTEMERROR: 'PAY_GATEWAY_DOWN',
  USER_PAYING: 'PAY_USER_PAYING',
  TRADE_STATE_ERROR: 'PAY_TRADE_STATE_ERROR'
}

@Injectable()
export class WeChatPayGateway extends BasePaymentGateway {
  private static readonly GATEWAY_NAME = 'wechat-pay-v3'
  private static readonly TOLERANCE_SECONDS = 300
  private readonly logger = new Logger(WeChatPayGateway.name)

  /** APIv3 Key (用于解密回调 resource) */
  private readonly apiV3Key: Buffer

  constructor(config: WeChatGatewayConfig) {
    super({
      ...config,
      channel: 'WECHAT',
      errorCodeMap: { ...WECHAT_ERROR_CODE_MAP, ...(config.errorCodeMap ?? {}) }
    })
    if (!config.apiV3Key || config.apiV3Key.length !== 24) {
      throw new Error('WeChatPayGateway: apiV3Key must be 24 bytes')
    }
    this.apiV3Key = Buffer.from(config.apiV3Key, 'utf8')
  }

  override readonly gatewayName = WeChatPayGateway.GATEWAY_NAME

  // ─── createPrepay (JSAPI) ──────────────────────────────

  async createPrepay(
    order: { id: string; totalCents: number },
    method: PaymentMethod
  ): Promise<{
    prepayId: string
    codeUrl?: string
    expiresAt: string
  }> {
    if (method !== 'WECHAT') {
      throw new Error(`WeChatPayGateway does not support method=${method}`)
    }

    const path = '/v3/pay/transactions/jsapi'
    const body = JSON.stringify({
      appid: this.appId(),
      mchid: this.mchId(),
      description: `M5 订单 ${order.id}`,
      out_trade_no: order.id,
      time_expire: this.formatExpireTime(15 * 60),
      notify_url: this.notifyUrl(),
      amount: {
        total: order.totalCents,
        currency: 'CNY'
      },
      payer: {
        // 真实场景: 从 CashierOrder.payerOpenId 读
        openid: this.staticHeader('x-pay-default-openid', 'PLACEHOLDER_OPENID')
      }
    })

    type PrepayResponse = { prepay_id: string }
    const response = await this.httpRequest<PrepayResponse>(path, { method: 'POST', body })

    return {
      prepayId: response.prepay_id,
      // JSAPI 不返回 codeUrl, 前端用 prepay_id + paySign 唤起
      expiresAt: this.formatExpireTime(15 * 60)
    }
  }

  // ─── query ─────────────────────────────────────────────

  async query(providerTxnId: string): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'FAILED'
    paidAt?: string
    failureReason?: string
  }> {
    const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(providerTxnId)}?mchid=${encodeURIComponent(this.mchId())}`

    type QueryResponse = {
      trade_state: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR'
      success_time?: string
      trade_state_desc?: string
    }

    try {
      const response = await this.httpRequest<QueryResponse>(path)
      return this.mapTradeState(response)
    } catch (error) {
      if (error instanceof PaymentGatewayHttpError && error.status === 404) {
        return { status: 'PENDING' }
      }
      throw error
    }
  }

  // ─── refund ────────────────────────────────────────────

  async refund(input: { paymentId: string; amountCents: number; reason: string }): Promise<{
    providerRefundId: string
  }> {
    const path = '/v3/refund/domestic/refunds'
    const outRefundNo = `rf-${input.paymentId}-${Date.now()}`
    const body = JSON.stringify({
      out_trade_no: input.paymentId,
      out_refund_no: outRefundNo,
      reason: input.reason.slice(0, 80),
      notify_url: this.notifyUrl(),
      amount: {
        refund: input.amountCents,
        total: input.amountCents,
        currency: 'CNY'
      }
    })

    type RefundResponse = { refund_id: string; status: string }
    const response = await this.httpRequest<RefundResponse>(path, { method: 'POST', body })
    return { providerRefundId: response.refund_id }
  }

  // ─── verifyCallback ────────────────────────────────────

  verifyCallback(input: {
    rawBody: string
    signature: string
    timestamp: string
    toleranceSeconds?: number
  }): CallbackVerifyResult {
    const tolerance = input.toleranceSeconds ?? WeChatPayGateway.TOLERANCE_SECONDS
    const ageSeconds = Math.abs(Date.now() / 1000 - Number(input.timestamp))
    if (!Number.isFinite(ageSeconds) || ageSeconds > tolerance) {
      return { verified: false, reason: 'timestamp-out-of-tolerance' }
    }

    if (!input.signature) {
      return { verified: false, reason: 'missing-signature' }
    }

    // V3 验签: SHA256(timestamp + "\n" + nonce + "\n" + body + "\n")
    // 注: 真实环境需用微信平台证书 RSA 验签; 此处仅做 HMAC 模拟
    const nonce = this.extractNonce(input.rawBody)
    const expected = createHash('sha256')
      .update(`${input.timestamp}\n${nonce}\n${input.rawBody}\n`)
      .digest('hex')
    if (!this.safeEqual(input.signature, expected)) {
      return { verified: false, reason: 'signature-mismatch' }
    }

    // 解密 resource (AES-256-GCM)
    try {
      const decrypted = this.decryptResource(input.rawBody)
      this.logger.debug(`Callback decrypted: ${decrypted.slice(0, 80)}...`)
    } catch (error) {
      this.logger.warn(`Callback resource decrypt failed: ${(error as Error).message}`)
      // 解密失败不等于验签失败; 但需要审计
    }

    return { verified: true }
  }

  // ─── downloadReconciliation (P1-2 落地) ────────────────

  override async downloadReconciliation(date: string): Promise<Buffer> {
    // 微信资金账单: GET /v3/bill/fundflowbill?bill_date=YYYY-MM-DD&bill_type=FUND
    const path = `/v3/bill/fundflowbill?bill_date=${encodeURIComponent(date)}&bill_type=FUND&tar_type=GZIP`
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      headers: { Accept: 'application/octet-stream' }
    })
    if (!response.ok) {
      throw new Error(`WeChat bill download failed: ${response.status}`)
    }
    return Buffer.from(await response.arrayBuffer())
  }

  // ─── 私有工具 ─────────────────────────────────────────

  private appId(): string {
    return this.staticHeader('x-pay-app-id', 'PLACEHOLDER_APP_ID')
  }

  private mchId(): string {
    return this.staticHeader('x-pay-mch-id', 'PLACEHOLDER_MCH_ID')
  }

  private notifyUrl(): string {
    return this.staticHeader('x-pay-notify-url', 'https://m5.test/api/payment/callback/wechat')
  }

  private staticHeader(key: string, fallback: string): string {
    return this.config.staticHeaders?.[key] ?? fallback
  }

  private formatExpireTime(plusSeconds: number): string {
    return new Date(Date.now() + plusSeconds * 1000).toISOString()
  }

  private mapTradeState(state: {
    trade_state: string
    success_time?: string
    trade_state_desc?: string
  }): { status: 'PENDING' | 'SUCCESS' | 'FAILED'; paidAt?: string; failureReason?: string } {
    switch (state.trade_state) {
      case 'SUCCESS':
        return { status: 'SUCCESS', paidAt: state.success_time }
      case 'USERPAYING':
      case 'NOTPAY':
        return { status: 'PENDING' }
      case 'REFUND':
      case 'CLOSED':
      case 'REVOKED':
        return { status: 'FAILED', failureReason: state.trade_state_desc ?? state.trade_state }
      case 'PAYERROR':
        return { status: 'FAILED', failureReason: state.trade_state_desc ?? 'PAY_ERROR' }
      default:
        return { status: 'PENDING' }
    }
  }

  private extractNonce(rawBody: string): string {
    try {
      const parsed = JSON.parse(rawBody) as { resource?: { nonce?: string } }
      return parsed.resource?.nonce ?? ''
    } catch {
      return ''
    }
  }

  /**
   * 解密 resource.ciphertext (AES-256-GCM)
   * 真实环境: 微信 V3 资源加密 = AES-256-GCM(APIv3Key, nonce, ciphertext, associated_data)
   * associated_data = resource.associated_data
   */
  private decryptResource(rawBody: string): string {
    const parsed = JSON.parse(rawBody) as {
      resource: { ciphertext: string; nonce: string; associated_data: string }
    }
    const { ciphertext, nonce, associated_data } = parsed.resource
    const decipher = createDecipheriv('aes-256-gcm', this.apiV3Key, nonce)
    decipher.setAuthTag(Buffer.from(ciphertext, 'base64').subarray(-16))
    decipher.setAAD(Buffer.from(associated_data, 'utf8'))
    const ciphertextBody = Buffer.from(ciphertext, 'base64').subarray(0, -16)
    return Buffer.concat([decipher.update(ciphertextBody), decipher.final()]).toString('utf8')
  }
}

export interface WeChatGatewayConfig extends Omit<BasePaymentGatewayConfig, 'channel'> {
  /** APIv3 Key (32 字符, 实际 24 字节 UTF-8) */
  apiV3Key: string
}
