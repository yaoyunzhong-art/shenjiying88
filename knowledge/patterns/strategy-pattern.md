# Pattern · Strategy (策略模式)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 适用: 多算法 / 多 provider / 多业务规则切换
> 来源: Phase-19 LLM Provider 切换 + Phase-15+ 多计费规则

---

## 1. 🎯 问题

业务中同一行为有多种实现:
- ❌ 多种 LLM Provider (Claude / OpenAI / 本地)
- ❌ 多种支付方式 (微信 / 支付宝 / 银行卡)
- ❌ 多种计费规则 (Starter / Pro / Enterprise)

if-else / switch 难维护 + 难扩展。

---

## 2. ✅ 策略模式 (TypeScript 版)

```typescript
// apps/api/src/modules/payment/payment.strategy.ts
export interface PaymentStrategy {
  readonly name: string
  pay(amount: number, params: any): Promise<PaymentResult>
  refund(transactionId: string, amount: number): Promise<RefundResult>
}

@Injectable()
export class WechatPayStrategy implements PaymentStrategy {
  readonly name = 'wechat'
  async pay(amount: number, params: WechatPayParams): Promise<PaymentResult> {
    // 调用微信支付 SDK
  }
  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    // 调用微信退款 API
  }
}

@Injectable()
export class AlipayStrategy implements PaymentStrategy {
  readonly name = 'alipay'
  async pay(amount: number, params: AlipayParams): Promise<PaymentResult> {
    // 调用支付宝 SDK
  }
  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    // 调用支付宝退款 API
  }
}

// 策略工厂
@Injectable()
export class PaymentStrategyFactory {
  private readonly strategies = new Map<string, PaymentStrategy>()

  constructor(
    private readonly wechat: WechatPayStrategy,
    private readonly alipay: AlipayStrategy,
  ) {
    this.strategies.set(this.wechat.name, this.wechat)
    this.strategies.set(this.alipay.name, this.alipay)
  }

  get(name: string): PaymentStrategy {
    const s = this.strategies.get(name)
    if (!s) throw new Error(`Payment strategy ${name} not found`)
    return s
  }
}

// Service 使用
@Injectable()
export class PaymentService {
  constructor(private readonly factory: PaymentStrategyFactory) {}

  async pay(method: string, amount: number, params: any): Promise<PaymentResult> {
    const strategy = this.factory.get(method)
    return await strategy.pay(amount, params)
  }
}
```

---

## 3. 🔗 关联

- [llm-integration.md](../best-practices/llm-integration.md) · LLM Provider 即策略
- [factory-pattern.md](./factory-pattern.md) · 工厂 (策略实例化)
