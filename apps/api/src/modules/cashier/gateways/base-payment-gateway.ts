import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { PaymentMethod } from '@m5/types'
import type { PaymentGateway } from '../payment.service'

/**
 * BasePaymentGateway · HTTP 支付通道抽象基类
 *
 * P0-1.1 (支付收银模块开发计划):
 *   提取真实通道 (微信/支付宝/银联) 共用的 HTTP / 签名 / 重试 / 错误码映射能力,
 *   避免 3 套真实适配器重复 3 段相同模板 (类比 HttpLytAdapterBase)。
 *
 * 设计原则:
 *   - 不破坏现有 PaymentGateway 接口 (PaymentService 注入不变)
 *   - MockPaymentGateway 保持独立 (无 HTTP, 不继承本类)
 *   - 真实通道 (WeChatPayGateway / AlipayGateway / UnionPayGateway)
 *     继承本类, 仅实现 5 个 abstract 方法
 *
 * 子类必须实现:
 *   - createPrepay / query / refund?        (PaymentGateway 接口)
 *   - verifyCallback                        (通道回调验签)
 *
 * 子类可直接复用 (protected):
 *   - httpRequest<T>: 签名 + 超时 + 重试 + 错误码映射
 *   - signRequest:  SHA256(channel + method + path + timestamp + body + secret)
 *   - mapErrorCode: vendor code → 内部 code
 *   - isRetryableStatus: 408/429/5xx 可重试
 *   - safeEqual: 时间安全比较 (回调验签用)
 *
 * 配套方法 (P1-2 落地):
 *   - downloadReconciliation: T+1 对账单下载, 默认抛 not-implemented
 */

export interface BasePaymentGatewayConfig {
  /** 网关基础 URL (e.g. https://api.mch.weixin.qq.com) */
  baseUrl: string
  /** 签名密钥 (AppSecret / RSA PrivateKey 等) */
  signingSecret: string
  /** 单次 HTTP 超时 (ms) */
  timeoutMs: number
  /** 失败重试次数 (不含首次) */
  maxRetries: number
  /** 通道名 (WECHAT / ALIPAY / CARD / CASH) */
  channel: PaymentMethod
  /** vendor error code → 内部 code 映射 (类比 LYT_VENDOR_ERROR_CODE_MAP) */
  errorCodeMap?: Record<string, string>
  /** 静态 header (e.g. mch-id, app-id, sub-mch-id) */
  staticHeaders?: Record<string, string>
}

export class PaymentGatewayHttpError extends Error {
  readonly gatewayName: string
  readonly channel: PaymentMethod
  readonly path: string
  readonly code: string
  readonly status?: number
  readonly retryable: boolean
  readonly requestId: string

  constructor(input: {
    gatewayName: string
    channel: PaymentMethod
    path: string
    code: string
    status?: number
    retryable: boolean
    requestId: string
    message: string
    cause?: unknown
  }) {
    super(input.message, input.cause ? { cause: input.cause } : undefined)
    this.name = 'PaymentGatewayHttpError'
    this.gatewayName = input.gatewayName
    this.channel = input.channel
    this.path = input.path
    this.code = input.code
    this.status = input.status
    this.retryable = input.retryable
    this.requestId = input.requestId
  }
}

export interface CallbackVerifyResult {
  verified: boolean
  reason?: 'missing-signature' | 'timestamp-out-of-tolerance' | 'signature-mismatch'
}

export abstract class BasePaymentGateway implements PaymentGateway {
  abstract readonly gatewayName: string
  readonly channel: PaymentMethod

  protected constructor(protected readonly config: BasePaymentGatewayConfig) {
    if (!config.baseUrl || config.baseUrl.trim().length === 0) {
      throw new Error('BasePaymentGateway: baseUrl required')
    }
    if (!config.signingSecret || config.signingSecret.trim().length === 0) {
      throw new Error('BasePaymentGateway: signingSecret required')
    }
    if (config.timeoutMs <= 0) {
      throw new Error('BasePaymentGateway: timeoutMs must be > 0')
    }
    if (config.maxRetries < 0) {
      throw new Error('BasePaymentGateway: maxRetries must be >= 0')
    }
    this.channel = config.channel
  }

  // ─── PaymentGateway 接口 (abstract — 子类必须实现) ──────────────

  abstract createPrepay(
    order: { id: string; totalCents: number },
    method: PaymentMethod
  ): Promise<{
    prepayId: string
    codeUrl?: string
    expiresAt: string
  }>

  abstract query(providerTxnId: string): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'FAILED'
    paidAt?: string
    failureReason?: string
  }>

  refund?(input: {
    paymentId: string
    amountCents: number
    reason: string
  }): Promise<{ providerRefundId: string }>

  // ─── 新增抽象 — 通道回调验签 (子类必须实现) ─────────────────

  /**
   * 验证通道异步通知签名
   * @param input.rawBody 通道推送的原始报文 (字符串, 非 JSON.parse)
   * @param input.signature 通道签名字段 (e.g. WeChat: Wechatpay-Signature; Alipay: sign)
   * @param input.timestamp 通道时间戳 (e.g. WeChat: Wechatpay-Timestamp; Alipay: notify_time)
   * @param input.toleranceSeconds 时间戳容忍窗口, 默认 300s
   */
  abstract verifyCallback(input: {
    rawBody: string
    signature: string
    timestamp: string
    toleranceSeconds?: number
  }): CallbackVerifyResult

  // ─── 默认实现 — T+1 对账单 (P1-2 落地前子类可空) ──────────────

  /**
   * 下载 T+1 对账单 (P1-2 落地)
   * 默认实现抛 not-implemented; WeChat/Alipay 各自 override
   */
  async downloadReconciliation(_date: string): Promise<Buffer> {
    throw new Error(
      `[${this.gatewayName}] downloadReconciliation not implemented (P1-2 schedule)`
    )
  }

  // ─── 共享能力 — protected, 子类可调用 ───────────────────────

  /**
   * HTTP 请求: 签名 + 超时 + 重试 + 错误码映射
   */
  protected async httpRequest<T>(
    path: string,
    init?: { method?: string; body?: string; headers?: Record<string, string> }
  ): Promise<T> {
    const method = init?.method ?? 'GET'
    const body = init?.body
    const requestId = randomUUID()
    let lastError: PaymentGatewayHttpError | null = null

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      const timestamp = new Date().toISOString()
      const signature = this.signRequest(method, path, timestamp, body)

      try {
        const response = await fetch(`${this.config.baseUrl}${path}`, {
          ...init,
          method,
          signal: AbortSignal.timeout(this.config.timeoutMs),
          headers: {
            'content-type': 'application/json',
            'x-pay-channel': this.channel,
            'x-pay-gateway': this.gatewayName,
            'x-pay-request-id': requestId,
            'x-pay-request-timestamp': timestamp,
            'x-pay-signature': signature,
            'x-pay-retry-attempt': String(attempt),
            ...(this.config.staticHeaders ?? {}),
            ...(init?.headers ?? {})
          }
        })

        if (!response.ok) {
          const payload = await this.parseResponsePayload(response)
          const retryable = this.isRetryableStatus(response.status)
          lastError = new PaymentGatewayHttpError({
            gatewayName: this.gatewayName,
            channel: this.channel,
            path,
            code: this.mapErrorCode(payload, response.status),
            status: response.status,
            retryable,
            requestId,
            message: this.extractErrorMessage(payload, response.status)
          })

          if (retryable && attempt < this.config.maxRetries) {
            continue
          }

          throw lastError
        }

        return (await this.parseResponsePayload(response)) as T
      } catch (error) {
        if (error instanceof PaymentGatewayHttpError) {
          throw error
        }

        const mappedError = new PaymentGatewayHttpError({
          gatewayName: this.gatewayName,
          channel: this.channel,
          path,
          code: this.mapTransportErrorCode(error),
          retryable: true,
          requestId,
          message: this.mapTransportErrorMessage(error),
          cause: error
        })
        lastError = mappedError

        if (attempt < this.config.maxRetries) {
          continue
        }
      }
    }

    throw (
      lastError ??
      new PaymentGatewayHttpError({
        gatewayName: this.gatewayName,
        channel: this.channel,
        path,
        code: 'PAY_UNKNOWN',
        retryable: false,
        requestId: randomUUID(),
        message: `${this.gatewayName} request exhausted without response`
      })
    )
  }

  /**
   * 签名: SHA256(channel + method + path + timestamp + body + secret)
   * 子类可在 verifyCallback 里反向重算 + safeEqual 比对
   */
  protected signRequest(method: string, path: string, timestamp: string, body?: string): string {
    return createHmac('sha256', this.config.signingSecret)
      .update([this.channel, method.toUpperCase(), path, timestamp, body ?? ''].join(':'))
      .digest('hex')
  }

  /**
   * 时间安全字符串比较 (防 timing attack)
   */
  protected safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left)
    const rightBuffer = Buffer.from(right)
    if (leftBuffer.length !== rightBuffer.length) return false
    return timingSafeEqual(leftBuffer, rightBuffer)
  }

  /**
   * vendor error code → 内部 code 映射
   */
  protected mapErrorCode(payload: unknown, status: number): string {
    if (
      payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      typeof (payload as { code: unknown }).code === 'string'
    ) {
      const vendorCode = (payload as { code: string }).code
      return this.config.errorCodeMap?.[vendorCode] ?? vendorCode
    }
    return `PAY_HTTP_${status}`
  }

  /**
   * 408 / 429 / 5xx 视为可重试; 其他 (4xx 业务错误) 立即抛
   */
  protected isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500
  }

  // ─── 私有解析逻辑 ─────────────────────────────────────────

  private async parseResponsePayload(response: Response): Promise<unknown> {
    const text = await response.text()
    if (!text) return {}
    try {
      return JSON.parse(text)
    } catch {
      return { message: text }
    }
  }

  private extractErrorMessage(payload: unknown, status: number): string {
    if (payload && typeof payload === 'object') {
      const p = payload as { message?: unknown; error?: unknown }
      if (typeof p.message === 'string') return p.message
      if (typeof p.error === 'string') return p.error
    }
    return `${this.gatewayName} request failed with status ${status}`
  }

  private mapTransportErrorCode(error: unknown): string {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return 'PAY_TIMEOUT'
    }
    return 'PAY_TRANSPORT_ERROR'
  }

  private mapTransportErrorMessage(error: unknown): string {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return `${this.gatewayName} request timed out`
    }
    if (error instanceof Error && error.message) {
      return error.message
    }
    return `${this.gatewayName} request failed before receiving response`
  }
}
