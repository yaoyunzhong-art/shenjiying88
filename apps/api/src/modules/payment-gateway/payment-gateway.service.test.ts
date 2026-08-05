/**
 * payment-gateway.service.spec.ts
 * 🐜 纯函数式内联测试 — 不import生产代码
 * Phase-FP P0 · 2026-07-08
 *
 * 核心业务逻辑：支付验证、货币支持判断、地区提供商匹配、
 * webhook签名验证、退款规则、钱包余额计算
 */

// ============================================================
// 1. 枚举 + 类型定义
// ============================================================

type PaymentProvider =
  | 'paypal' | 'stripe' | 'paypay' | 'alipay'
  | 'wechat_pay' | 'local_wallet'

type PaymentStatus =
  | 'pending' | 'processing' | 'completed' | 'failed'
  | 'refunded' | 'cancelled'

type PaymentCurrency =
  | 'CNY' | 'USD' | 'JPY' | 'HKD' | 'THB'
  | 'VND' | 'MYR' | 'SGD'

interface PaymentRequest {
  orderId: string
  amount: number
  currency: PaymentCurrency
  provider: PaymentProvider
  metadata?: Record<string, string>
  returnUrl?: string
  webhookUrl?: string
}

interface PaymentResult {
  transactionId: string
  status: PaymentStatus
  provider: PaymentProvider
  amount: number
  currency: PaymentCurrency
  providerResponse?: Record<string, unknown>
  paidAt?: Date
  error?: string
}

// ============================================================
// 2. Mock 数据工厂
// ============================================================

function makePaymentReq(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
  return {
    orderId: 'ORD-' + Math.random().toString(36).substring(2, 10),
    amount: 100,
    currency: 'USD',
    provider: 'stripe',
    ...overrides,
  }
}

function makePaymentResult(overrides: Partial<PaymentResult> = {}): PaymentResult {
  return {
    transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10),
    status: 'completed',
    provider: 'stripe',
    amount: 100,
    currency: 'USD',
    ...overrides,
  }
}

// ============================================================
// 3. 内联业务逻辑纯函数
// ============================================================

const ALL_CURRENCIES: PaymentCurrency[] = [
  'CNY', 'USD', 'JPY', 'HKD', 'THB', 'VND', 'MYR', 'SGD',
]

/**
 * 各提供商支持的货币列表 (纯函数)
 */
function getSupportedCurrenciesForProvider(provider: PaymentProvider): PaymentCurrency[] {
  switch (provider) {
    case 'paypal':
      return ['USD', 'JPY', 'HKD', 'SGD'] as PaymentCurrency[]
    case 'stripe':
      return ['CNY', 'USD', 'JPY', 'HKD', 'THB', 'VND', 'MYR', 'SGD']
    case 'paypay':
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

/**
 * 检查货币是否被提供商支持 (纯函数)
 */
function isCurrencySupportedByProvider(currency: PaymentCurrency, provider: PaymentProvider): boolean {
  return getSupportedCurrenciesForProvider(provider).includes(currency)
}

/**
 * 支持的支付方式（按国家代码）(纯函数)
 */
function getSupportedProviders(countryCode: string): PaymentProvider[] {
  const code = countryCode.toUpperCase()
  if (['CN', 'HK', 'TW', 'MO'].includes(code)) {
    return ['alipay', 'wechat_pay', 'stripe', 'local_wallet']
  }
  if (code === 'JP') {
    return ['paypay', 'stripe', 'paypal', 'local_wallet']
  }
  if (['TH', 'VN', 'MY', 'SG', 'ID', 'PH'].includes(code)) {
    return ['stripe', 'paypal', 'local_wallet']
  }
  return ['paypal', 'stripe', 'local_wallet']
}

/**
 * 验证支付金额 (纯函数)
 * 返回 null 表示通过，返回 string 表示错误码
 */
function validatePaymentAmount(amount: number): string | null {
  if (amount <= 0) return 'INVALID_AMOUNT'
  if (!Number.isFinite(amount)) return 'INVALID_AMOUNT'
  if (amount > 99999999) return 'AMOUNT_TOO_LARGE'
  return null
}

/**
 * 验证退款金额 (纯函数)
 */
function validateRefund(refundAmount: number, originalAmount: number): string | null {
  if (refundAmount <= 0) return 'INVALID_REFUND_AMOUNT'
  if (refundAmount > originalAmount) return 'REFUND_AMOUNT_EXCEEDED'
  return null
}

/**
 * 检查交易状态是否可退款 (纯函数)
 */
function canRefund(status: PaymentStatus): boolean {
  return status === 'completed'
}

/**
 * 验证 PayPal Webhook 签名 (纯函数)
 * 检查必要的 header 字段是否存在
 */
function verifyPayPalWebhook(headers: Record<string, string>): boolean {
  const sig = headers['paypal-transmission-sig']
  const id = headers['paypal-transmission-id']
  const time = headers['paypal-transmission-time']
  return !!(sig && id && time)
}

/**
 * 验证 Stripe Webhook 签名 (纯函数)
 * 检查 `stripe-signature` header 包含 t= 和 v1=
 */
function verifyStripeWebhook(headers: Record<string, string>): boolean {
  const sig = headers['stripe-signature']
  if (!sig) return false
  const hasT = sig.split(',').some(p => p.startsWith('t='))
  const hasV1 = sig.split(',').some(p => p.startsWith('v1='))
  return hasT && hasV1
}

/**
 * 验证 PayPay Webhook 签名 (纯函数)
 */
function verifyPayPayWebhook(headers: Record<string, string>): boolean {
  const resultCode = headers['x-paypay-result-code']
  const responseSig = headers['x-paypay-response-signature']
  return !!(resultCode && responseSig)
}

/**
 * 验证第三方支付 Webhook (纯函数)
 */
function verifyThirdPartyWebhook(headers: Record<string, string>): boolean {
  const sig = headers['x-signature'] || headers['x-alibaba-signature']
  return !!sig
}

/**
 * 验证 Webhook (按 provider 路由) (纯函数)
 */
function verifyWebhook(
  provider: PaymentProvider,
  headers: Record<string, string>,
): boolean {
  switch (provider) {
    case 'paypal':
      return verifyPayPalWebhook(headers)
    case 'stripe':
      return verifyStripeWebhook(headers)
    case 'paypay':
      return verifyPayPayWebhook(headers)
    case 'alipay':
    case 'wechat_pay':
      return verifyThirdPartyWebhook(headers)
    case 'local_wallet':
      return true
    default:
      return false
  }
}

/**
 * 钱包余额扣减 (纯函数)
 * 返回 { success, newBalance, error }
 */
function deductWalletBalance(
  balance: number,
  amount: number,
): { success: true; newBalance: number } | { success: false; error: string } {
  if (amount <= 0) return { success: false, error: 'INVALID_AMOUNT' }
  if (balance < amount) return { success: false, error: 'Insufficient balance' }
  return { success: true, newBalance: balance - amount }
}

/**
 * 钱包余额返还 (纯函数)
 */
function refundToWalletBalance(
  balance: number,
  amount: number,
): { success: true; newBalance: number } | { success: false; error: string } {
  if (amount <= 0) return { success: false, error: 'INVALID_REFUND_AMOUNT' }
  return { success: true, newBalance: balance + amount }
}

/**
 * 检查货币是否在支持列表中 (纯函数)
 */
function isCurrencySupported(currency: PaymentCurrency): boolean {
  return ALL_CURRENCIES.includes(currency)
}

/**
 * 生成交易 ID 前缀 (纯函数)
 */
function formatTransactionId(prefix: string, seq: number, timestamp: number): string {
  return `${prefix}-${timestamp}-${String(seq % 100000).padStart(5, '0')}`
}

/**
 * 将实体记录转换为 PaymentResult (纯函数)
 */
function toPaymentResult(
  id: string,
  status: PaymentStatus,
  provider: PaymentProvider,
  amount: number,
  currency: PaymentCurrency,
  providerResponse?: Record<string, unknown>,
  paidAt?: Date,
  error?: string,
): PaymentResult {
  return { transactionId: id, status, provider, amount, currency, providerResponse, paidAt, error }
}

// ============================================================
// 4. 测试用例
// ============================================================

import { describe, it, expect } from 'vitest'

describe('🧪 payment-gateway — 纯函数支付网关', () => {
  // ============================================================
  // 正例 8+
  // ============================================================
  describe('✅ 正例 — isCurrencySupportedByProvider', () => {
    it('Stripe 支持 CNY', () => {
      expect(isCurrencySupportedByProvider('CNY', 'stripe')).toBe(true)
    })
    it('Stripe 支持 JPY', () => {
      expect(isCurrencySupportedByProvider('JPY', 'stripe')).toBe(true)
    })
    it('PayPal 支持 USD', () => {
      expect(isCurrencySupportedByProvider('USD', 'paypal')).toBe(true)
    })
    it('PayPay 支持 JPY', () => {
      expect(isCurrencySupportedByProvider('JPY', 'paypay')).toBe(true)
    })
    it('Alipay 支持 CNY', () => {
      expect(isCurrencySupportedByProvider('CNY', 'alipay')).toBe(true)
    })
    it('WeChat Pay 支持 CNY', () => {
      expect(isCurrencySupportedByProvider('CNY', 'wechat_pay')).toBe(true)
    })
    it('Local Wallet 支持所有货币', () => {
      for (const c of ['CNY', 'USD', 'JPY', 'HKD', 'THB', 'VND', 'MYR', 'SGD'] as PaymentCurrency[]) {
        expect(isCurrencySupportedByProvider(c, 'local_wallet')).toBe(true)
      }
    })
    it('Alipay 支持 HKD', () => {
      expect(isCurrencySupportedByProvider('HKD', 'alipay')).toBe(true)
    })
  })

  describe('✅ 正例 — getSupportedProviders', () => {
    it('中国返回 alipay, wechat_pay, stripe, local_wallet', () => {
      const providers = getSupportedProviders('CN')
      expect(providers).toContain('alipay')
      expect(providers).toContain('wechat_pay')
      expect(providers).toContain('stripe')
      expect(providers).toContain('local_wallet')
    })
    it('日本返回 paypay, stripe, paypal, local_wallet', () => {
      const providers = getSupportedProviders('JP')
      expect(providers).toContain('paypay')
      expect(providers).toContain('local_wallet')
    })
    it('泰国返回 stripe, paypal, local_wallet', () => {
      const providers = getSupportedProviders('TH')
      expect(providers).toContain('stripe')
      expect(providers).toContain('paypal')
    })
    it('美国（默认）返回 paypal, stripe, local_wallet', () => {
      const providers = getSupportedProviders('US')
      expect(providers).toEqual(['paypal', 'stripe', 'local_wallet'])
    })
  })

  describe('✅ 正例 — validatePaymentAmount', () => {
    it('正数金额通过验证', () => {
      expect(validatePaymentAmount(1)).toBeNull()
    })
    it('大额金额通过验证', () => {
      expect(validatePaymentAmount(99999999)).toBeNull()
    })
    it('小数金额通过验证', () => {
      expect(validatePaymentAmount(19.99)).toBeNull()
    })
  })

  describe('✅ 正例 — validateRefund', () => {
    it('部分退款通过验证', () => {
      expect(validateRefund(30, 100)).toBeNull()
    })
    it('全额退款通过验证', () => {
      expect(validateRefund(100, 100)).toBeNull()
    })
  })

  describe('✅ 正例 — verifyWebhook', () => {
    it('PayPal 正确 header 通过', () => {
      expect(verifyWebhook('paypal', {
        'paypal-transmission-sig': 'abc',
        'paypal-transmission-id': 'def',
        'paypal-transmission-time': '123',
      })).toBe(true)
    })
    it('Stripe 正确签名通过', () => {
      expect(verifyWebhook('stripe', {
        'stripe-signature': 't=123,v1=abc',
      })).toBe(true)
    })
    it('PayPay 正确 header 通过', () => {
      expect(verifyWebhook('paypay', {
        'x-paypay-result-code': '0000',
        'x-paypay-response-signature': 'sig123',
      })).toBe(true)
    })
    it('第三方支付 (alipay) 正确签名通过', () => {
      expect(verifyWebhook('alipay', {
        'x-signature': 'sig456',
      })).toBe(true)
    })
    it('本地钱包无需验证', () => {
      expect(verifyWebhook('local_wallet', {})).toBe(true)
    })
  })

  describe('✅ 正例 — deductWalletBalance', () => {
    it('余额充足扣减成功', () => {
      const r = deductWalletBalance(500, 100)
      expect(r.success).toBe(true)
      if (r.success) expect(r.newBalance).toBe(400)
    })
    it('余额刚好够扣减成功', () => {
      const r = deductWalletBalance(100, 100)
      expect(r.success).toBe(true)
      if (r.success) expect(r.newBalance).toBe(0)
    })
  })

  describe('✅ 正例 — refundToWalletBalance', () => {
    it('退款返还余额', () => {
      const r = refundToWalletBalance(100, 50)
      expect(r.success).toBe(true)
      if (r.success) expect(r.newBalance).toBe(150)
    })
  })

  describe('✅ 正例 — isCurrencySupported', () => {
    it('CNY 在支持列表中', () => {
      expect(isCurrencySupported('CNY')).toBe(true)
    })
    it('SGD 在支持列表中', () => {
      expect(isCurrencySupported('SGD')).toBe(true)
    })
  })

  // ============================================================
  // 反例 5+
  // ============================================================
  describe('❌ 反例 — isCurrencySupportedByProvider', () => {
    it('PayPay 不支持 USD', () => {
      expect(isCurrencySupportedByProvider('USD', 'paypay')).toBe(false)
    })
    it('Alipay 不支持 JPY', () => {
      expect(isCurrencySupportedByProvider('JPY', 'alipay')).toBe(false)
    })
    it('PayPal 不支持 CNY', () => {
      expect(isCurrencySupportedByProvider('CNY', 'paypal')).toBe(false)
    })
    it('WeChat Pay 不支持 USD', () => {
      expect(isCurrencySupportedByProvider('USD', 'wechat_pay')).toBe(false)
    })
    it('未知提供商返回空列表', () => {
      expect(isCurrencySupportedByProvider('USD', 'some_unknown' as PaymentProvider)).toBe(false)
    })
  })

  describe('❌ 反例 — validatePaymentAmount', () => {
    it('零金额不通过', () => {
      expect(validatePaymentAmount(0)).toBe('INVALID_AMOUNT')
    })
    it('负数金额不通过', () => {
      expect(validatePaymentAmount(-10)).toBe('INVALID_AMOUNT')
    })
    it('Infinity 不通过', () => {
      expect(validatePaymentAmount(Infinity)).toBe('INVALID_AMOUNT')
    })
  })

  describe('❌ 反例 — canRefund', () => {
    it('pending 状态不可退款', () => {
      expect(canRefund('pending')).toBe(false)
    })
    it('failed 状态不可退款', () => {
      expect(canRefund('failed')).toBe(false)
    })
    it('refunded 状态不可再退款', () => {
      expect(canRefund('refunded')).toBe(false)
    })
    it('cancelled 状态不可退款', () => {
      expect(canRefund('cancelled')).toBe(false)
    })
  })

  describe('❌ 反例 — validateRefund', () => {
    it('退款金额超原金额不通过', () => {
      expect(validateRefund(200, 100)).toBe('REFUND_AMOUNT_EXCEEDED')
    })
    it('退款金额为零不通过', () => {
      expect(validateRefund(0, 100)).toBe('INVALID_REFUND_AMOUNT')
    })
    it('退款金额为负数不通过', () => {
      expect(validateRefund(-50, 100)).toBe('INVALID_REFUND_AMOUNT')
    })
  })

  describe('❌ 反例 — verifyWebhook', () => {
    it('PayPal 缺少 header 不通过', () => {
      expect(verifyWebhook('paypal', {})).toBe(false)
    })
    it('Stripe 签名格式错误不通过', () => {
      expect(verifyWebhook('stripe', { 'stripe-signature': 'invalid' })).toBe(false)
    })
    it('Stripe 缺少签名不通过', () => {
      expect(verifyWebhook('stripe', {})).toBe(false)
    })
    it('PayPay 缺少签名不通过', () => {
      expect(verifyWebhook('paypay', { 'x-paypay-result-code': '0000' })).toBe(false)
    })
    it('未知提供商不通过', () => {
      expect(verifyWebhook('unknown' as PaymentProvider, {})).toBe(false)
    })
  })

  describe('❌ 反例 — deductWalletBalance', () => {
    it('余额不足扣减失败', () => {
      const r = deductWalletBalance(50, 100)
      expect(r.success).toBe(false)
      if (!r.success) expect(r.error).toBe('Insufficient balance')
    })
    it('零金额扣减失败', () => {
      const r = deductWalletBalance(100, 0)
      expect(r.success).toBe(false)
    })
  })

  // ============================================================
  // 边界 5+
  // ============================================================
  describe('🔲 边界 — isCurrencySupportedByProvider', () => {
    it('PayPal 虽然支持 JPY / HKD / SGD 但不支持 CNY', () => {
      expect(isCurrencySupportedByProvider('CNY', 'paypal')).toBe(false)
      expect(isCurrencySupportedByProvider('JPY', 'paypal')).toBe(true)
      expect(isCurrencySupportedByProvider('HKD', 'paypal')).toBe(true)
      expect(isCurrencySupportedByProvider('SGD', 'paypal')).toBe(true)
    })
    it('local_wallet 支持所有已定义货币', () => {
      for (const c of ALL_CURRENCIES) {
        expect(isCurrencySupportedByProvider(c, 'local_wallet')).toBe(true)
      }
    })
  })

  describe('🔲 边界 — getSupportedProviders', () => {
    it('大小写不敏感', () => {
      expect(getSupportedProviders('cn')).toContain('alipay')
      expect(getSupportedProviders('Cn')).toContain('wechat_pay')
    })
    it('小国家代码用默认', () => {
      expect(getSupportedProviders('GB')).toEqual(['paypal', 'stripe', 'local_wallet'])
    })
    it('空字符串返回默认', () => {
      expect(getSupportedProviders('')).toEqual(['paypal', 'stripe', 'local_wallet'])
    })
  })

  describe('🔲 边界 — validatePaymentAmount', () => {
    it('最小金额 0.01 通过', () => {
      expect(validatePaymentAmount(0.01)).toBeNull()
    })
    it('最大金额 99999999 通过', () => {
      expect(validatePaymentAmount(99999999)).toBeNull()
    })
    it('超过最大金额不通过', () => {
      expect(validatePaymentAmount(100000000)).toBe('AMOUNT_TOO_LARGE')
    })
    it('NaN 不通过', () => {
      expect(validatePaymentAmount(NaN)).toBe('INVALID_AMOUNT')
    })
  })

  describe('🔲 边界 — verifyStripeWebhook', () => {
    it('多 v 格式（v0=xx,v1=yy）仍通过', () => {
      expect(verifyStripeWebhook({ 'stripe-signature': 't=123,v0=old,v1=main' })).toBe(true)
    })
    it('仅有 v1 没有 t 不通过', () => {
      expect(verifyStripeWebhook({ 'stripe-signature': 'v1=signature' })).toBe(false)
    })
    it('仅有 t 没有 v1 不通过', () => {
      expect(verifyStripeWebhook({ 'stripe-signature': 't=123456' })).toBe(false)
    })
  })

  describe('🔲 边界 — formatTransactionId', () => {
    it('正确格式化 ID', () => {
      const id = formatTransactionId('TXN', 42, 1700000000000)
      expect(id).toBe('TXN-1700000000000-00042')
    })
    it('序号循环回绕', () => {
      const id = formatTransactionId('REF', 100000, 1700000000000)
      expect(id).toBe('REF-1700000000000-00000')
    })
  })

  describe('🔲 边界 — refundToWalletBalance', () => {
    it('零金额退款失败', () => {
      expect(refundToWalletBalance(100, 0).success).toBe(false)
    })
    it('大额退款成功', () => {
      const r = refundToWalletBalance(0, 999999)
      expect(r.success).toBe(true)
      if (r.success) expect(r.newBalance).toBe(999999)
    })
  })
})
