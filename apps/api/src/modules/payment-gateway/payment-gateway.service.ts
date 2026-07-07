/**
 * PaymentGatewayService - 本地化支付网关服务
 *
 * 支持 PayPal / Stripe / PayPay / 本地钱包
 * T117-3: 本地化支付
 */

export type PaymentProvider = 'paypal' | 'stripe' | 'paypay' | 'alipay' | 'wechat_pay' | 'local_wallet'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
export type PaymentCurrency = 'CNY' | 'USD' | 'JPY' | 'HKD' | 'THB' | 'VND' | 'MYR' | 'SGD'

export interface PaymentRequest {
  orderId: string
  amount: number
  currency: PaymentCurrency
  provider: PaymentProvider
  metadata?: Record<string, string>
  locale?: string
  returnUrl?: string
  webhookUrl?: string
}

export interface PaymentResult {
  transactionId: string
  status: PaymentStatus
  provider: PaymentProvider
  amount: number
  currency: PaymentCurrency
  providerResponse?: Record<string, unknown>
  paidAt?: Date
  error?: string
}

export interface RefundRequest {
  transactionId: string
  amount?: number  // 不填则全退
  reason?: string
}

// ─────────────────────────────────────────────────────────────
// 内部类型
// ─────────────────────────────────────────────────────────────

interface TransactionRecord {
  id: string
  orderId: string
  provider: PaymentProvider
  status: PaymentStatus
  amount: number
  currency: PaymentCurrency
  providerResponse?: Record<string, unknown>
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
  error?: string
}

interface WalletBalance {
  currency: PaymentCurrency
  amount: number
}

// ─────────────────────────────────────────────────────────────
// 错误类
// ─────────────────────────────────────────────────────────────

export class PaymentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable = false
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

// ─────────────────────────────────────────────────────────────
// PaymentGatewayService
// ─────────────────────────────────────────────────────────────

export class PaymentGatewayService {
  // 内存存储
  private transactions = new Map<string, TransactionRecord>()
  private walletBalances = new Map<string, Map<PaymentCurrency, number>>() // userId -> currency -> amount
  private refundRecords = new Map<string, TransactionRecord>() // refundId -> original transaction

  // 序号生成器
  private seq = 0
  private nextId(prefix: string): string {
    this.seq = (this.seq + 1) % 100000
    return `${prefix}-${Date.now()}-${this.seq.toString().padStart(5, '0')}`
  }

  // ── 基础方法 ─────────────────────────────────────────────

  /**
   * 发起支付
   */
  async pay(request: PaymentRequest): Promise<PaymentResult> {
    const { orderId, amount, currency, provider, metadata, locale, returnUrl, webhookUrl } = request

    if (amount <= 0) {
      throw new PaymentError('INVALID_AMOUNT', 'amount must be > 0')
    }

    // 货币支持检查
    if (!this.isCurrencySupportedByProvider(currency, provider)) {
      throw new PaymentError(
        'CURRENCY_NOT_SUPPORTED',
        `Currency ${currency} is not supported by ${provider}`
      )
    }

    const transactionId = this.nextId('TXN')

    switch (provider) {
      case 'paypal':
        return this.payWithPayPal(transactionId, orderId, amount, currency, returnUrl, webhookUrl, metadata)
      case 'stripe':
        return this.payWithStripe(transactionId, orderId, amount, currency, locale, returnUrl, webhookUrl, metadata)
      case 'paypay':
        return this.payWithPayPay(transactionId, orderId, amount, currency, webhookUrl, metadata)
      case 'alipay':
      case 'wechat_pay':
        return this.payWithThirdParty(transactionId, orderId, amount, currency, provider, metadata)
      case 'local_wallet':
        return this.payWithLocalWallet(transactionId, orderId, amount, currency, metadata)
      default:
        throw new PaymentError('UNKNOWN_PROVIDER', `Unknown payment provider: ${provider}`)
    }
  }

  /**
   * 支付结果查询
   */
  async query(transactionId: string): Promise<PaymentResult> {
    const record = this.transactions.get(transactionId)
    if (!record) {
      throw new PaymentError('TRANSACTION_NOT_FOUND', `Transaction ${transactionId} not found`)
    }
    return this.toPaymentResult(record)
  }

  /**
   * 退款
   */
  async refund(request: RefundRequest): Promise<PaymentResult> {
    const { transactionId, amount, reason } = request

    const original = this.transactions.get(transactionId)
    if (!original) {
      throw new PaymentError('TRANSACTION_NOT_FOUND', `Transaction ${transactionId} not found`)
    }

    if (original.status !== 'completed') {
      throw new PaymentError('REFUND_NOT_ALLOWED', `Cannot refund transaction with status: ${original.status}`)
    }

    const refundAmount = amount ?? original.amount
    if (refundAmount > original.amount) {
      throw new PaymentError('REFUND_AMOUNT_EXCEEDED', 'Refund amount exceeds original amount')
    }

    const refundId = this.nextId('REF')

    // 本地钱包退款直接返还余额
    if (original.provider === 'local_wallet') {
      return this.refundLocalWallet(refundId, original, refundAmount, reason)
    }

    // 第三方支付退款（模拟）
    return this.refundThirdParty(refundId, original, refundAmount, reason)
  }

  /**
   * 退款状态查询
   */
  async queryRefund(refundId: string): Promise<PaymentResult> {
    const record = this.refundRecords.get(refundId)
    if (!record) {
      throw new PaymentError('REFUND_NOT_FOUND', `Refund ${refundId} not found`)
    }
    return this.toPaymentResult(record)
  }

  /**
   * 回调验证（webhook）
   */
  async verifyWebhook(
    provider: PaymentProvider,
    payload: string,
    headers: Record<string, string>
  ): Promise<boolean> {
    switch (provider) {
      case 'paypal':
        return this.verifyPayPalWebhook(payload, headers)
      case 'stripe':
        return this.verifyStripeWebhook(payload, headers)
      case 'paypay':
        return this.verifyPayPayWebhook(payload, headers)
      case 'alipay':
      case 'wechat_pay':
        return this.verifyThirdPartyWebhook(provider, payload, headers)
      case 'local_wallet':
        // 本地钱包不需要 webhook 验证
        return true
      default:
        return false
    }
  }

  /**
   * 支持的支付方式（按地区）
   */
  getSupportedProviders(countryCode: string): PaymentProvider[] {
    const countryCodeUpper = countryCode.toUpperCase()

    // 东亚地区
    if (['CN', 'HK', 'TW', 'MO'].includes(countryCodeUpper)) {
      return ['alipay', 'wechat_pay', 'stripe', 'local_wallet']
    }

    // 日本
    if (countryCodeUpper === 'JP') {
      return ['paypay', 'stripe', 'paypal', 'local_wallet']
    }

    // 东南亚
    if (['TH', 'VN', 'MY', 'SG', 'ID', 'PH', 'MY'].includes(countryCodeUpper)) {
      return ['stripe', 'paypal', 'local_wallet']
    }

    // 默认（欧美）
    return ['paypal', 'stripe', 'local_wallet']
  }

  /**
   * 货币是否支持
   */
  isCurrencySupported(currency: PaymentCurrency): boolean {
    return this.getSupportedCurrencies().includes(currency)
  }

  // ── 私有方法 ─────────────────────────────────────────────

  private getSupportedCurrencies(): PaymentCurrency[] {
    return ['CNY', 'USD', 'JPY', 'HKD', 'THB', 'VND', 'MYR', 'SGD']
  }

  private isCurrencySupportedByProvider(currency: PaymentCurrency, provider: PaymentProvider): boolean {
    const supportedCurrencies = this.getSupportedCurrenciesForProvider(provider)
    return supportedCurrencies.includes(currency)
  }

  private getSupportedCurrenciesForProvider(provider: PaymentProvider): PaymentCurrency[] {
    switch (provider) {
      case 'paypal':
        return ['USD', 'EUR' as PaymentCurrency, 'GBP' as PaymentCurrency, 'JPY', 'CAD' as PaymentCurrency, 'AUD' as PaymentCurrency, 'HKD', 'SGD']
      case 'stripe':
        // Stripe 支持 135+ 货币，这里简化
        return ['CNY', 'USD', 'JPY', 'HKD', 'THB', 'VND', 'MYR', 'SGD']
      case 'paypay':
        // PayPay 只支持 JPY
        return ['JPY']
      case 'alipay':
      case 'wechat_pay':
        return ['CNY', 'HKD']
      case 'local_wallet':
        return ['CNY', 'USD', 'JPY', 'HKD', 'THB', 'VND', 'MYR', 'SGD']
      default:
        return []
    }
  }

  // PayPal 支付
  private async payWithPayPal(
    transactionId: string,
    orderId: string,
    amount: number,
    currency: PaymentCurrency,
    returnUrl?: string,
    webhookUrl?: string,
    metadata?: Record<string, string>
  ): Promise<PaymentResult> {
    // 模拟 PayPal Create Order
    const providerResponse = {
      orderId: `PP-${orderId}-${Date.now()}`,
      status: 'CREATED',
      approvalUrl: `${returnUrl || 'https://paypal.com/checkout'}?token=PP-${orderId}`,
      links: [
        { rel: 'approve', href: `${returnUrl || 'https://paypal.com/checkout'}?token=PP-${orderId}` },
        { rel: 'capture', href: 'https://api.paypal.com/v2/checkout/orders/{orderId}/capture' }
      ]
    }

    const record: TransactionRecord = {
      id: transactionId,
      orderId,
      provider: 'paypal',
      status: 'pending',
      amount,
      currency,
      providerResponse,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 触发 webhook（异步）
    if (webhookUrl) {
      setTimeout(() => {
        this.handlePayPalWebhook(transactionId, 'APPROVED', webhookUrl)
      }, 100)
    }

    this.transactions.set(transactionId, record)
    return this.toPaymentResult(record)
  }

  // PayPal webhook 处理（模拟）
  private async handlePayPalWebhook(transactionId: string, status: string, webhookUrl: string): Promise<void> {
    const record = this.transactions.get(transactionId)
    if (!record) return

    if (status === 'APPROVED' || status === 'COMPLETED') {
      record.status = 'completed'
      record.paidAt = new Date()
    } else if (status === 'FAILED') {
      record.status = 'failed'
      record.error = 'Payment failed at PayPal'
    }
    record.updatedAt = new Date()

    // 模拟 POST to webhookUrl
    void webhookUrl
  }

  // PayPal 授权并完成支付（模拟用户授权后的 capture）
  async capturePayPalOrder(orderId: string): Promise<PaymentResult> {
    // 查找对应的 pending 交易
    let targetRecord: TransactionRecord | undefined
    for (const record of this.transactions.values()) {
      if (record.provider === 'paypal' && record.providerResponse?.orderId === orderId) {
        targetRecord = record
        break
      }
    }

    if (!targetRecord) {
      throw new PaymentError('ORDER_NOT_FOUND', `PayPal order ${orderId} not found`)
    }

    // 模拟 PayPal capture
    targetRecord.status = 'completed'
    targetRecord.paidAt = new Date()
    targetRecord.providerResponse = {
      ...targetRecord.providerResponse,
      status: 'COMPLETED',
      captureId: `CAP-${Date.now()}`
    }
    targetRecord.updatedAt = new Date()

    return this.toPaymentResult(targetRecord)
  }

  // PayPal webhook 验证
  private async verifyPayPalWebhook(payload: string, headers: Record<string, string>): Promise<boolean> {
    // PayPal webhook 验证：
    // 1. PayPal-Transmission-Sig header
    // 2. PayPal-Transmission-Id
    // 3. PayPal-Transmission-Time
    // 4. 证书验签
    const transmissionSig = headers['paypal-transmission-sig']
    const transmissionId = headers['paypal-transmission-id']
    const transmissionTime = headers['paypal-transmission-time']
    const certUrl = headers['paypal-cert-url']

    if (!transmissionSig || !transmissionId || !transmissionTime) {
      return false
    }

    // 简化验证：检查必要 header 存在
    // 真实环境需要用证书验签
    void certUrl
    void payload

    // 模拟验证成功
    return true
  }

  // Stripe 支付
  private async payWithStripe(
    transactionId: string,
    orderId: string,
    amount: number,
    currency: PaymentCurrency,
    locale?: string,
    returnUrl?: string,
    webhookUrl?: string,
    metadata?: Record<string, string>
  ): Promise<PaymentResult> {
    // 模拟 Stripe PaymentIntent 创建
    const clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`
    const paymentIntentId = `pi_${Date.now()}`

    const providerResponse = {
      paymentIntentId,
      clientSecret,
      status: 'requires_payment_method',
      amount: Math.round(amount * 100), // Stripe 使用分
      currency: currency.toLowerCase(),
      returnUrl,
      metadata
    }

    const record: TransactionRecord = {
      id: transactionId,
      orderId,
      provider: 'stripe',
      status: 'pending',
      amount,
      currency,
      providerResponse,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 触发 webhook（异步）
    if (webhookUrl) {
      setTimeout(() => {
        this.handleStripeWebhook(transactionId, 'succeeded', webhookUrl)
      }, 100)
    }

    this.transactions.set(transactionId, record)
    return this.toPaymentResult(record)
  }

  // Stripe webhook 处理（模拟）
  private async handleStripeWebhook(transactionId: string, status: string, webhookUrl: string): Promise<void> {
    const record = this.transactions.get(transactionId)
    if (!record) return

    if (status === 'succeeded') {
      record.status = 'completed'
      record.paidAt = new Date()
    } else if (status === 'failed') {
      record.status = 'failed'
      record.error = 'Payment failed at Stripe'
    }
    record.updatedAt = new Date()

    // 模拟 POST to webhookUrl
    void webhookUrl
  }

  // Stripe webhook 验证
  private async verifyStripeWebhook(payload: string, headers: Record<string, string>): Promise<boolean> {
    // Stripe webhook 验证：
    // 1. Stripe-Signature header
    // 2. timestamp + HMAC
    const signature = headers['stripe-signature']
    if (!signature) {
      return false
    }

    // 简化验证：检查签名格式（t=timestamp,v1=signature）
    // 真实环境需要用 webhook secret 计算 HMAC
    void payload

    const parts = signature.split(',')
    const hasTimestamp = parts.some(p => p.startsWith('t='))
    const hasSignature = parts.some(p => p.startsWith('v1='))

    return hasTimestamp && hasSignature
  }

  // PayPay 支付
  private async payWithPayPay(
    transactionId: string,
    orderId: string,
    amount: number,
    currency: PaymentCurrency,
    webhookUrl?: string,
    metadata?: Record<string, string>
  ): Promise<PaymentResult> {
    // PayPay 只支持 JPY
    if (currency !== 'JPY') {
      throw new PaymentError('CURRENCY_NOT_SUPPORTED', 'PayPay only supports JPY')
    }

    // 模拟 PayPay QR code 生成
    const providerResponse = {
      orderId: `PPY-${orderId}-${Date.now()}`,
      codeType: 'ORDER_QR',
      codeData: {
        url: `paypay://qr/${orderId}`,
        expireTime: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      },
      amount,
      currency
    }

    const record: TransactionRecord = {
      id: transactionId,
      orderId,
      provider: 'paypay',
      status: 'pending',
      amount,
      currency,
      providerResponse,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 触发 webhook（异步）
    if (webhookUrl) {
      setTimeout(() => {
        this.handlePayPayWebhook(transactionId, 'COMPLETED', webhookUrl)
      }, 100)
    }

    this.transactions.set(transactionId, record)
    return this.toPaymentResult(record)
  }

  // PayPay webhook 处理（模拟）
  private async handlePayPayWebhook(transactionId: string, status: string, webhookUrl: string): Promise<void> {
    const record = this.transactions.get(transactionId)
    if (!record) return

    if (status === 'COMPLETED') {
      record.status = 'completed'
      record.paidAt = new Date()
    } else if (status === 'FAILED') {
      record.status = 'failed'
      record.error = 'Payment failed at PayPay'
    }
    record.updatedAt = new Date()

    // 模拟 POST to webhookUrl
    void webhookUrl
  }

  // PayPay webhook 验证
  private async verifyPayPayWebhook(payload: string, headers: Record<string, string>): Promise<boolean> {
    // PayPay webhook 验证：检查必要 header
    void payload
    const resultCode = headers['x-paypay-result-code']
    const responseSignature = headers['x-paypay-response-signature']

    return !!(resultCode && responseSignature)
  }

  // 第三方支付（支付宝/微信）
  private async payWithThirdParty(
    transactionId: string,
    orderId: string,
    amount: number,
    currency: PaymentCurrency,
    provider: 'alipay' | 'wechat_pay',
    metadata?: Record<string, string>
  ): Promise<PaymentResult> {
    // 微信支付的 provider 是 wechat_pay，但域名是 wechat.com
    const domain = provider === 'wechat_pay' ? 'wechat.com' : 'alipay.com'
    const providerResponse = {
      orderId: `${provider.toUpperCase()}-${orderId}-${Date.now()}`,
      codeUrl: `https://qr.${domain}/${orderId}`,
      expireTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      amount,
      currency
    }

    const record: TransactionRecord = {
      id: transactionId,
      orderId,
      provider,
      status: 'pending',
      amount,
      currency,
      providerResponse,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.transactions.set(transactionId, record)
    return this.toPaymentResult(record)
  }

  // 第三方 webhook 验证
  private async verifyThirdPartyWebhook(
    provider: 'alipay' | 'wechat_pay',
    payload: string,
    headers: Record<string, string>
  ): Promise<boolean> {
    void provider
    void payload

    // 简化验证：检查必要签名 header
    const signature = headers['x-signature'] || headers['x-alibaba-signature']
    return !!signature
  }

  // 本地钱包支付
  private async payWithLocalWallet(
    transactionId: string,
    orderId: string,
    amount: number,
    currency: PaymentCurrency,
    metadata?: Record<string, string>
  ): Promise<PaymentResult> {
    const userId = metadata?.['userId'] || 'default-user'

    // 获取用户钱包余额
    const userBalances = this.walletBalances.get(userId) || new Map()
    const currentBalance = userBalances.get(currency) || 0

    if (currentBalance < amount) {
      const record: TransactionRecord = {
        id: transactionId,
        orderId,
        provider: 'local_wallet',
        status: 'failed',
        amount,
        currency,
        error: 'Insufficient balance',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      this.transactions.set(transactionId, record)
      return this.toPaymentResult(record)
    }

    // 扣减余额
    userBalances.set(currency, currentBalance - amount)
    this.walletBalances.set(userId, userBalances)

    const record: TransactionRecord = {
      id: transactionId,
      orderId,
      provider: 'local_wallet',
      status: 'completed',
      amount,
      currency,
      paidAt: new Date(),
      providerResponse: {
        userId,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance - amount
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.transactions.set(transactionId, record)
    return this.toPaymentResult(record)
  }

  // 本地钱包退款
  private async refundLocalWallet(
    refundId: string,
    original: TransactionRecord,
    refundAmount: number,
    reason?: string
  ): Promise<PaymentResult> {
    const userId = (original.providerResponse as { userId?: string })?.userId || 'default-user'

    // 获取用户钱包余额
    const userBalances = this.walletBalances.get(userId) || new Map()
    const currentBalance = userBalances.get(original.currency) || 0

    // 返还余额
    userBalances.set(original.currency, currentBalance + refundAmount)
    this.walletBalances.set(userId, userBalances)

    const record: TransactionRecord = {
      id: refundId,
      orderId: original.orderId,
      provider: 'local_wallet',
      status: 'refunded',
      amount: refundAmount,
      currency: original.currency,
      paidAt: new Date(),
      providerResponse: {
        originalTransactionId: original.id,
        userId,
        refundedBalance: currentBalance + refundAmount,
        reason
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.refundRecords.set(refundId, record)
    return this.toPaymentResult(record)
  }

  // 第三方退款（模拟）
  private async refundThirdParty(
    refundId: string,
    original: TransactionRecord,
    refundAmount: number,
    reason?: string
  ): Promise<PaymentResult> {
    // 模拟第三方退款 API 调用
    const providerRefundId = `${original.provider}-REF-${Date.now()}`

    const record: TransactionRecord = {
      id: refundId,
      orderId: original.orderId,
      provider: original.provider,
      status: 'refunded',
      amount: refundAmount,
      currency: original.currency,
      paidAt: new Date(),
      providerResponse: {
        originalTransactionId: original.id,
        providerRefundId,
        status: 'REFUNDED',
        reason
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.refundRecords.set(refundId, record)

    // 更新原交易状态
    original.status = 'refunded'
    original.updatedAt = new Date()

    return this.toPaymentResult(record)
  }

  // 设置用户钱包余额（测试用）
  setWalletBalance(userId: string, currency: PaymentCurrency, amount: number): void {
    const userBalances = this.walletBalances.get(userId) || new Map()
    userBalances.set(currency, amount)
    this.walletBalances.set(userId, userBalances)
  }

  // 获取用户钱包余额（测试用）
  getWalletBalance(userId: string, currency: PaymentCurrency): number {
    const userBalances = this.walletBalances.get(userId) || new Map()
    return userBalances.get(currency) || 0
  }

  // 辅助：获取所有交易（测试用）
  getAllTransactions(): Map<string, TransactionRecord> {
    return new Map(this.transactions)
  }

  // 辅助：清除所有数据（测试用）
  clear(): void {
    this.transactions.clear()
    this.walletBalances.clear()
    this.refundRecords.clear()
    this.seq = 0
  }

  private toPaymentResult(record: TransactionRecord): PaymentResult {
    return {
      transactionId: record.id,
      status: record.status,
      provider: record.provider,
      amount: record.amount,
      currency: record.currency,
      providerResponse: record.providerResponse,
      paidAt: record.paidAt,
      error: record.error
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 单例导出
// ─────────────────────────────────────────────────────────────

let globalService: PaymentGatewayService | null = null

export function getPaymentGatewayService(): PaymentGatewayService {
  if (!globalService) {
    globalService = new PaymentGatewayService()
  }
  return globalService
}
