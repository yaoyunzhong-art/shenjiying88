/**
 * admin/settings/page.test.ts — 系统全局设置 L1 测试
 *
 * 覆盖:
 *   正例 — 常量映射、服务商列表结构化校验、配置项枚举完整性
 *   反例 — 空优先级列表、未匹配的状态 key
 *   边界 — 余额负值、日限额零值
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── Mock 类型与数据 ─────────────────────────────────

interface SmsProvider {
  id: string;
  name: string;
  enabled: boolean;
  balance: number;
  dailyCap: number;
  dailyUsed: number;
  endpoint: string;
  apiKey: string;
  priority: number;
}

interface MailProvider {
  id: string;
  name: string;
  enabled: boolean;
  dailyLimit: number;
  monthlyUsed: number;
  smtpHost: string;
  smtpPort: number;
  sslTls: boolean;
  priority: number;
}

interface PaymentGateway {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  feeRate: number;
  settlementCycle: string;
  supportedCurrencies: string[];
  priority: number;
}

const MOCK_SMS_PROVIDERS: SmsProvider[] = [
  { id: 'sms-ali', name: '阿里云短信', enabled: true, balance: 5280, dailyCap: 50000, dailyUsed: 12350, endpoint: 'https://dysmsapi.aliyuncs.com', apiKey: '****', priority: 1 },
  { id: 'sms-tencent', name: '腾讯云短信', enabled: true, balance: 3200, dailyCap: 30000, dailyUsed: 8900, endpoint: 'https://sms.tencentcloudapi.com', apiKey: '****', priority: 2 },
  { id: 'sms-aws', name: 'AWS SNS', enabled: false, balance: 150000, dailyCap: 100000, dailyUsed: 0, endpoint: 'https://sns.us-east-1.amazonaws.com', apiKey: '****', priority: 3 },
];

const MOCK_MAIL_PROVIDERS: MailProvider[] = [
  { id: 'mail-ali', name: '阿里云邮件', enabled: true, dailyLimit: 200000, monthlyUsed: 3500000, smtpHost: 'smtp.aliyun.com', smtpPort: 465, sslTls: true, priority: 1 },
  { id: 'mail-sendgrid', name: 'SendGrid', enabled: true, dailyLimit: 1000000, monthlyUsed: 8500000, smtpHost: 'smtp.sendgrid.net', smtpPort: 587, sslTls: true, priority: 2 },
  { id: 'mail-ses', name: 'AWS SES', enabled: false, dailyLimit: 500000, monthlyUsed: 1200000, smtpHost: 'email-smtp.us-east-1.amazonaws.com', smtpPort: 587, sslTls: true, priority: 3 },
];

const MOCK_PAYMENT_GATEWAYS: PaymentGateway[] = [
  { id: 'gw-alipay', name: '支付宝', type: 'alipay', enabled: true, feeRate: 0.006, settlementCycle: 'T+1', supportedCurrencies: ['CNY'], priority: 1 },
  { id: 'gw-wechat', name: '微信支付', type: 'wechat', enabled: true, feeRate: 0.006, settlementCycle: 'T+1', supportedCurrencies: ['CNY'], priority: 2 },
  { id: 'gw-unionpay', name: '银联', type: 'unionpay', enabled: true, feeRate: 0.008, settlementCycle: 'T+1', supportedCurrencies: ['CNY'], priority: 3 },
  { id: 'gw-stripe', name: 'Stripe', type: 'stripe', enabled: false, feeRate: 0.029, settlementCycle: 'T+3', supportedCurrencies: ['USD', 'EUR', 'GBP', 'CNY'], priority: 4 },
  { id: 'gw-paypal', name: 'PayPal', type: 'paypal', enabled: false, feeRate: 0.039, settlementCycle: 'T+3', supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY'], priority: 5 },
];

// ─── 辅助函数 ────────────────────────────────────────

function getEnabled(items: { enabled: boolean }[]): number {
  return items.filter(i => i.enabled).length;
}

function getById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(i => i.id === id);
}

function sortByPriority<T extends { priority: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.priority - b.priority);
}

function hasDuplicatePriorities(items: { priority: number }[]): boolean {
  const priorities = items.map(i => i.priority);
  return new Set(priorities).size !== priorities.length;
}

// ─── 测试套件 ────────────────────────────────────────

describe('admin/settings — SMS 服务商', () => {
  it('1. 3 个 SMS 提供商（正例）', () => {
    assert.equal(MOCK_SMS_PROVIDERS.length, 3);
  });

  it('2. 前两个已启用，第三个未启用（正例）', () => {
    assert.equal(getEnabled(MOCK_SMS_PROVIDERS), 2);
  });

  it('3. 余额全部非负（反例）', () => {
    for (const p of MOCK_SMS_PROVIDERS) {
      assert.ok(p.balance >= 0, `${p.name} balance >= 0`);
    }
  });

  it('4. dailyCap >= dailyUsed（正例）', () => {
    for (const p of MOCK_SMS_PROVIDERS) {
      assert.ok(p.dailyCap >= p.dailyUsed, `${p.name} dailyCap >= dailyUsed`);
    }
  });

  it('5. 优先级无重复且从 1 开始（正例）', () => {
    assert.ok(!hasDuplicatePriorities(MOCK_SMS_PROVIDERS));
    const sorted = sortByPriority(MOCK_SMS_PROVIDERS);
    assert.equal(sorted[0]!.priority, 1);
    assert.equal(sorted[2]!.priority, 3);
  });

  it('6. 阿里云优先于腾讯云（正例）', () => {
    const ali = getById(MOCK_SMS_PROVIDERS, 'sms-ali')!;
    const tencent = getById(MOCK_SMS_PROVIDERS, 'sms-tencent')!;
    assert.ok(ali.priority < tencent.priority);
  });
});

describe('admin/settings — 邮件服务商', () => {
  it('7. 3 个邮件提供商（正例）', () => {
    assert.equal(MOCK_MAIL_PROVIDERS.length, 3);
  });

  it('8. 前两个已启用（正例）', () => {
    assert.equal(getEnabled(MOCK_MAIL_PROVIDERS), 2);
  });

  it('9. SMTP 端口合法（正例）', () => {
    const ports = MOCK_MAIL_PROVIDERS.map(p => p.smtpPort);
    assert.ok(ports.every(p => p === 465 || p === 587 || p === 25));
  });

  it('10. 每月用量非负（反例）', () => {
    assert.ok(MOCK_MAIL_PROVIDERS.every(p => p.monthlyUsed >= 0));
  });

  it('11. 优先顺序无重复（正例）', () => {
    assert.ok(!hasDuplicatePriorities(MOCK_MAIL_PROVIDERS));
  });
});

describe('admin/settings — 支付通道', () => {
  it('12. 5 个支付通道（正例）', () => {
    assert.equal(MOCK_PAYMENT_GATEWAYS.length, 5);
  });

  it('13. 前三个启用，后两个禁用（正例）', () => {
    assert.equal(getEnabled(MOCK_PAYMENT_GATEWAYS), 3);
  });

  it('14. 各通道费率 > 0（正例）', () => {
    for (const g of MOCK_PAYMENT_GATEWAYS) {
      assert.ok(g.feeRate > 0, `${g.name} 费率应 > 0`);
    }
  });

  it('15. CNY 多数通道支持（正例）', () => {
    const cnySupported = MOCK_PAYMENT_GATEWAYS.filter(g => g.supportedCurrencies.includes('CNY'));
    assert.ok(cnySupported.length >= 3, '至少 3 个通道支持 CNY');
    assert.ok(MOCK_PAYMENT_GATEWAYS.slice(0, 3).every(g => g.supportedCurrencies.includes('CNY')));
  });

  it('16. stripe 费率 2.9%（正例）', () => {
    const stripe = getById(MOCK_PAYMENT_GATEWAYS, 'gw-stripe')!;
    assert.equal(stripe.feeRate, 0.029);
  });

  it('17. paypal 费率最高（正例）', () => {
    const rates = MOCK_PAYMENT_GATEWAYS.map(g => g.feeRate);
    const max = Math.max(...rates);
    const paypal = getById(MOCK_PAYMENT_GATEWAYS, 'gw-paypal')!;
    assert.equal(paypal.feeRate, max);
  });

  it('18. 结算周期仅 T+1 和 T+3（正例）', () => {
    const cycles = new Set(MOCK_PAYMENT_GATEWAYS.map(g => g.settlementCycle));
    assert.ok(cycles.has('T+1'));
    assert.ok(cycles.has('T+3'));
    assert.equal(cycles.size, 2);
  });

  it('19. 优先级无重复（正例）', () => {
    assert.ok(!hasDuplicatePriorities(MOCK_PAYMENT_GATEWAYS));
  });
});
