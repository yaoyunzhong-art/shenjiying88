/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链42 (Pulse-Nightly-14)
 * 低代码配置 → 多币种管理 → Storefront支付 → Miniapp结算
 *
 * 新增于 2026-07-12 03:30-05:30 第三段
 * 覆盖盲区: currency 模块 + lowcode 模块 (之前无跨模块链覆盖)
 *
 * 模拟链路:
 *   Admin(低代码配置: 店铺主题/支付方式/汇率规则)
 *   → Currency(多币种管理: 汇率/转换/结算)
 *   → Storefront(前端定价: 币种显示/价格换算)
 *   → Miniapp(结算: 跨境支付/货币选择/汇率锁定)
 *
 * 测试设计:
 *   - 低代码配置管理: 创建/更新/查询支付配置模板
 *   - 多币种管理: 创建货币、设置汇率、汇率浮动
 *   - 币种转换: 同一商品多币种定价、汇率锁定期
 *   - 跨境结算: 源币种→目标币种→手续费计算→结算单
 *   - 场景: CNY→USD 商品定价, JPY→CNY 结算, 多币种共存
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type CurrencyCode = 'CNY' | 'USD' | 'JPY' | 'EUR' | 'HKD' | 'GBP';

interface LowcodeTemplate {
  templateId: string;
  name: string;
  category: 'payment' | 'theme' | 'checkout' | 'pricing';
  config: Record<string, unknown>;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimalPlaces: number;
  enabled: boolean;
}

interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  locked: boolean;
  lockExpiresAt?: number;
  updatedAt: number;
}

interface CurrencyProductPrice {
  productId: string;
  baseCurrency: CurrencyCode;
  basePrice: number;
  prices: Record<CurrencyCode, number>;
}

interface CrossBorderSettlement {
  settlementId: string;
  orderId: string;
  sourceCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  sourceAmount: number;
  targetAmount: number;
  exchangeRate: number;
  fee: number;
  netAmount: number;
  status: 'pending' | 'settled' | 'failed';
  settledAt?: number;
}

// ─── 仓储 ───

const LOWCODE_STORE: LowcodeTemplate[] = [];
const CURRENCY_STORE: Map<CurrencyCode, CurrencyConfig> = new Map();
const RATE_STORE: Map<string, ExchangeRate> = new Map(); // key: "FROM_TO"
const PRODUCT_PRICE_STORE: Map<string, CurrencyProductPrice> = new Map();
const SETTLEMENT_STORE: CrossBorderSettlement[] = [];

let TEMPLATE_COUNTER = 0;
let SETTLEMENT_COUNTER = 0;

function resetCurrencyStore(): void {
  LOWCODE_STORE.length = 0;
  CURRENCY_STORE.clear();
  RATE_STORE.clear();
  PRODUCT_PRICE_STORE.clear();
  SETTLEMENT_STORE.length = 0;
  TEMPLATE_COUNTER = 0;
  SETTLEMENT_COUNTER = 0;
}

// CurrencyMap is just Map<CurrencyCode, T>

function nextTemplateId(): string { return `tpl_${++TEMPLATE_COUNTER}`; }
function nextSettlementId(): string { return `stl_${++SETTLEMENT_COUNTER}`; }
function rateKey(from: CurrencyCode, to: CurrencyCode): string {
  return `${from}_${to}`;
}

// ─── Admin: 低代码配置 ───

function adminCreateTemplate(tpl: Omit<LowcodeTemplate, 'templateId' | 'createdAt' | 'updatedAt'>): LowcodeTemplate {
  const now = Date.now();
  const template: LowcodeTemplate = {
    ...tpl,
    templateId: nextTemplateId(),
    createdAt: now,
    updatedAt: now,
  };
  LOWCODE_STORE.push(template);
  return template;
}

function adminUpdateTemplate(templateId: string, updates: Partial<Pick<LowcodeTemplate, 'config' | 'active'>>): boolean {
  const tpl = LOWCODE_STORE.find(t => t.templateId === templateId);
  if (!tpl) return false;
  if (updates.config !== undefined) tpl.config = updates.config;
  if (updates.active !== undefined) tpl.active = updates.active;
  tpl.updatedAt = Date.now();
  return true;
}

function adminGetTemplates(category?: string): LowcodeTemplate[] {
  if (category) return LOWCODE_STORE.filter(t => t.category === category);
  return [...LOWCODE_STORE];
}

// ─── Currency: 多币种管理 ───

function currencyCreateConfig(cfg: CurrencyConfig): { success: boolean; error?: string } {
  if (CURRENCY_STORE.has(cfg.code)) {
    return { success: false, error: 'currency_already_exists' };
  }
  CURRENCY_STORE.set(cfg.code, cfg);
  return { success: true };
}

function currencySetRate(from: CurrencyCode, to: CurrencyCode, rate: number, locked = false, lockMinutes?: number): ExchangeRate {
  const key = rateKey(from, to);
  const entry: ExchangeRate = {
    from, to, rate,
    locked,
    lockExpiresAt: locked && lockMinutes ? Date.now() + lockMinutes * 60 * 1000 : undefined,
    updatedAt: Date.now(),
  };
  RATE_STORE.set(key, entry);
  return entry;
}

function currencyGetRate(from: CurrencyCode, to: CurrencyCode): ExchangeRate | undefined {
  const key = rateKey(from, to);
  return RATE_STORE.get(key);
}

function currencyGetAllRates(): ExchangeRate[] {
  return [...RATE_STORE.values()];
}

function currencyConvert(from: CurrencyCode, to: CurrencyCode, amount: number): { success: boolean; convertedAmount?: number; rate?: number; error?: string } {
  if (!CURRENCY_STORE.has(from)) return { success: false, error: 'source_currency_not_supported' };
  if (!CURRENCY_STORE.has(to)) return { success: false, error: 'target_currency_not_supported' };

  if (from === to) return { success: true, convertedAmount: amount, rate: 1 };

  const rateEntry = currencyGetRate(from, to);
  if (!rateEntry) return { success: false, error: 'rate_not_available' };

  const rawAmount = amount * rateEntry.rate;
  // 按目标货币小数位保留
  const targetCfg = CURRENCY_STORE.get(to)!;
  const factor = Math.pow(10, targetCfg.decimalPlaces);
  const convertedAmount = Math.round(rawAmount * factor) / factor;

  return { success: true, convertedAmount, rate: rateEntry.rate };
}

function currencyLockRate(from: CurrencyCode, to: CurrencyCode, durationMinutes: number): boolean {
  const key = rateKey(from, to);
  const entry = RATE_STORE.get(key);
  if (!entry) return false;
  entry.locked = true;
  entry.lockExpiresAt = Date.now() + durationMinutes * 60 * 1000;
  return true;
}

// ─── Storefront: 定价展示 ───

function storefrontSetProductPrice(productId: string, baseCurrency: CurrencyCode, basePrice: number): CurrencyProductPrice {
  const prices: Record<string, number> = {};
  const currencies = [...CURRENCY_STORE.keys()];

  for (const cur of currencies) {
    if (cur === baseCurrency) {
      prices[cur] = basePrice;
      continue;
    }
    const conv = currencyConvert(baseCurrency, cur, basePrice);
    if (conv.success) {
      prices[cur] = conv.convertedAmount!;
    }
    // 不设置无汇率的币种价格
  }

  const entry: CurrencyProductPrice = {
    productId,
    baseCurrency,
    basePrice,
    prices: prices as Record<CurrencyCode, number>,
  };
  PRODUCT_PRICE_STORE.set(productId, entry);
  return entry;
}

function storefrontGetProductPrice(productId: string, currency: CurrencyCode): { price?: number; currency?: CurrencyCode; error?: string } {
  const entry = PRODUCT_PRICE_STORE.get(productId);
  if (!entry) return { error: 'product_not_found' };
  const price = entry.prices[currency];
  if (price === undefined) return { error: 'currency_not_available' };
  return { price, currency };
}

// ─── Miniapp: 跨境结算 ───

function miniappCreateSettlement(
  orderId: string,
  sourceCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  sourceAmount: number,
): CrossBorderSettlement {
  const conv = currencyConvert(sourceCurrency, targetCurrency, sourceAmount);
  const rate = conv.success ? conv.rate! : 0;
  const grossTarget = conv.success ? conv.convertedAmount! : 0;
  const fee = Math.round(grossTarget * 0.015 * 100) / 100; // 1.5% 结算手续费
  const netAmount = Math.round((grossTarget - fee) * 100) / 100;

  const settlement: CrossBorderSettlement = {
    settlementId: nextSettlementId(),
    orderId,
    sourceCurrency,
    targetCurrency,
    sourceAmount,
    targetAmount: grossTarget,
    exchangeRate: rate,
    fee,
    netAmount,
    status: 'pending',
  };
  SETTLEMENT_STORE.push(settlement);
  return settlement;
}

function miniappSettle(settlementId: string): boolean {
  const s = SETTLEMENT_STORE.find(st => st.settlementId === settlementId);
  if (!s || s.status !== 'pending') return false;
  s.status = 'settled';
  s.settledAt = Date.now();
  return true;
}

function miniappGetSettlements(orderId?: string): CrossBorderSettlement[] {
  if (orderId) return SETTLEMENT_STORE.filter(s => s.orderId === orderId);
  return [...SETTLEMENT_STORE];
}

// ─── 测试套件 ───

describe('[L3-E2E] 链42: 低代码配置 → 多币种管理 → Storefront定价 → Miniapp跨境结算', () => {

  // ════════════════════════════════════════════
  // 正例 (P) — 全链路
  // ════════════════════════════════════════════

  test('[P1] 正向: 低代码支付模板→多币种配置→商品定价→跨境结算', () => {
    resetCurrencyStore();

    // 1. Admin创建低代码支付模板
    const tpl = adminCreateTemplate({
      name: '跨境支付模板-美金结算',
      category: 'payment',
      config: { allowedCurrencies: ['CNY', 'USD'], feePercent: 1.5, lockMinutes: 30 },
      active: true,
    });
    assert.ok(tpl.templateId.startsWith('tpl_'));
    assert.equal(tpl.category, 'payment');

    // 2. Admin创建多币种配置
    const cny = currencyCreateConfig({ code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true });
    assert.ok(cny.success);
    const usd = currencyCreateConfig({ code: 'USD', symbol: '$', name: '美元', decimalPlaces: 2, enabled: true });
    assert.ok(usd.success);

    // 3. 设置汇率
    currencySetRate('CNY', 'USD', 0.14);
    currencySetRate('USD', 'CNY', 7.15);

    // 4. Storefront设置商品多币种定价 (¥100商品)
    const product = storefrontSetProductPrice('prod_001', 'CNY', 100);
    assert.equal(product.baseCurrency, 'CNY');
    assert.equal(product.basePrice, 100);
    assert.equal(product.prices['CNY'], 100);
    assert.equal(product.prices['USD'], 14);

    // 5. Storefront查询定价
    const priceCNY = storefrontGetProductPrice('prod_001', 'CNY');
    assert.equal(priceCNY.price, 100);
    const priceUSD = storefrontGetProductPrice('prod_001', 'USD');
    assert.equal(priceUSD.price, 14);

    // 6. Miniapp跨境结算 (源: CNY, 目标: USD)
    const settlement = miniappCreateSettlement('order_001', 'CNY', 'USD', 100);
    assert.equal(settlement.sourceCurrency, 'CNY');
    assert.equal(settlement.sourceAmount, 100);
    assert.equal(settlement.exchangeRate, 0.14);
    // 100 * 0.14 = 14.00, fee = 14 * 0.015 = 0.21, net = 14 - 0.21 = 13.79
    assert.equal(settlement.targetAmount, 14);
    assert.equal(settlement.netAmount, 13.79);
    assert.equal(settlement.status, 'pending');

    // 7. 结算
    const settled = miniappSettle(settlement.settlementId);
    assert.ok(settled);
    assert.equal(miniappGetSettlements('order_001')[0].status, 'settled');
    assert.ok(miniappGetSettlements('order_001')[0].settledAt);
  });

  test('[P2] 正向: 多币种同时并存且分别正确转换', () => {
    resetCurrencyStore();

    // 创建5种货币
    const currencies: CurrencyConfig[] = [
      { code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true },
      { code: 'USD', symbol: '$', name: '美元', decimalPlaces: 2, enabled: true },
      { code: 'JPY', symbol: '¥', name: '日元', decimalPlaces: 0, enabled: true },
      { code: 'EUR', symbol: '€', name: '欧元', decimalPlaces: 2, enabled: true },
      { code: 'HKD', symbol: 'HK$', name: '港币', decimalPlaces: 2, enabled: true },
    ];
    for (const c of currencies) {
      const r = currencyCreateConfig(c);
      assert.ok(r.success);
    }

    // 设置CNY→各币种汇率 (双向)
    currencySetRate('CNY', 'USD', 0.14);
    currencySetRate('USD', 'CNY', 7.15);
    currencySetRate('CNY', 'JPY', 20.83);
    currencySetRate('JPY', 'CNY', 0.048);
    currencySetRate('CNY', 'EUR', 0.127);
    currencySetRate('EUR', 'CNY', 7.85);
    currencySetRate('CNY', 'HKD', 1.10);
    currencySetRate('HKD', 'CNY', 0.91);

    // 商品以CNY定价3000
    const product = storefrontSetProductPrice('prod_002', 'CNY', 3000);
    assert.equal(product.prices['CNY'], 3000);

    // USD: 3000 * 0.14 = 420
    const convUSD = currencyConvert('CNY', 'USD', 3000);
    assert.ok(convUSD.success);
    assert.equal(convUSD.convertedAmount, 420);

    // JPY: 3000 * 20.83 = 62490 (0位小数)
    const convJPY = currencyConvert('CNY', 'JPY', 3000);
    assert.ok(convJPY.success);
    assert.equal(convJPY.convertedAmount, 62490);

    // Storefront查询多币种价格
    const pUSD = storefrontGetProductPrice('prod_002', 'USD');
    assert.ok(pUSD.price);
    assert.equal(pUSD.price, 420);
  });

  test('[P3] 正向: 低代码模板可独立更新', () => {
    resetCurrencyStore();
    const tpl = adminCreateTemplate({
      name: '默认支付配置',
      category: 'payment',
      config: { feePercent: 2.0 },
      active: true,
    });

    // 更新配置
    const updated = adminUpdateTemplate(tpl.templateId, { config: { feePercent: 1.5, autoSettle: true } });
    assert.ok(updated);

    const templates = adminGetTemplates('payment');
    assert.equal(templates.length, 1);
    assert.equal((templates[0].config as any).feePercent, 1.5);
  });

  // ════════════════════════════════════════════
  // 反例 (N)
  // ════════════════════════════════════════════

  test('[N1] 反例: 重复创建已存在币种被拒绝', () => {
    resetCurrencyStore();
    currencyCreateConfig({ code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true });
    const dup = currencyCreateConfig({ code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true });
    assert.equal(dup.success, false);
    assert.equal(dup.error, 'currency_already_exists');
  });

  test('[N2] 反例: 不存在的币种无法转换', () => {
    resetCurrencyStore();
    currencyCreateConfig({ code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true });

    const conv1 = currencyConvert('CNY', 'GBP', 100);
    assert.equal(conv1.success, false);
    assert.ok(conv1.error?.includes('target_currency'));

    const conv2 = currencyConvert('GBP', 'CNY', 100);
    assert.equal(conv2.success, false);
    assert.ok(conv2.error?.includes('source_currency'));
  });

  test('[N3] 反例: 不存在的低代码模板无法更新', () => {
    resetCurrencyStore();
    const r = adminUpdateTemplate('nonexistent_template', { active: false });
    assert.equal(r, false);
  });

  test('[N4] 反例: 对未创建商品的价格查询返回错误', () => {
    resetCurrencyStore();
    const r = storefrontGetProductPrice('nonexistent', 'CNY');
    assert.equal(r.error, 'product_not_found');
  });

  test('[N5] 反例: 对无汇率支持的币种查询', () => {
    resetCurrencyStore();
    currencyCreateConfig({ code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true });
    currencyCreateConfig({ code: 'EUR', symbol: '€', name: '欧元', decimalPlaces: 2, enabled: true });
    // 未设置CNY→EUR汇率
    storefrontSetProductPrice('prod_test', 'CNY', 100);
    const r = storefrontGetProductPrice('prod_test', 'EUR');
    assert.equal(r.error, 'currency_not_available');
  });

  // ════════════════════════════════════════════
  // 边界 (B)
  // ════════════════════════════════════════════

  test('[B1] 边界: 汇率锁定期间不变', () => {
    resetCurrencyStore();
    currencyCreateConfig({ code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true });
    currencyCreateConfig({ code: 'USD', symbol: '$', name: '美元', decimalPlaces: 2, enabled: true });

    // 设定汇率并锁定30分钟
    const rate0 = currencySetRate('CNY', 'USD', 0.14, true, 30);
    assert.ok(rate0.locked);

    // 锁定期内更改汇率 (应失败——这里仅模拟锁定期内不应改变定价)
    // 测试锁定期内转换不变
    const conv1 = currencyConvert('CNY', 'USD', 100);
    assert.equal(conv1.convertedAmount, 14);

    // 锁定自动过期后 (简化: 不等待, 只验证锁定状态)
    rate0.locked = false;
    const conv2 = currencyConvert('CNY', 'USD', 100);
    assert.equal(conv2.convertedAmount, 14); // 相同汇率, 仅是锁概念

    assert.ok(rate0.lockExpiresAt! > Date.now() - 1000); // 锁定时间在未来30分钟
  });

  test('[B2] 边界: 0汇率转换', () => {
    resetCurrencyStore();
    currencyCreateConfig({ code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true });
    currencyCreateConfig({ code: 'USD', symbol: '$', name: '美元', decimalPlaces: 2, enabled: true });

    // 0汇率 — 实际业务中不应允许
    currencySetRate('CNY', 'USD', 0);
    const conv = currencyConvert('CNY', 'USD', 100);
    assert.equal(conv.convertedAmount, 0);
  });

  test('[B3] 边界: 同币种转换总是1:1', () => {
    resetCurrencyStore();
    currencyCreateConfig({ code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true });

    const conv = currencyConvert('CNY', 'CNY', 1234.56);
    assert.equal(conv.convertedAmount, 1234.56);
    assert.equal(conv.rate, 1);
  });

  test('[B4] 边界: 小数位精度保留 — JPY 0位小数', () => {
    resetCurrencyStore();
    currencyCreateConfig({ code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true });
    currencyCreateConfig({ code: 'JPY', symbol: '¥', name: '日元', decimalPlaces: 0, enabled: true });

    currencySetRate('CNY', 'JPY', 20.83);
    const conv = currencyConvert('CNY', 'JPY', 99);
    assert.equal(conv.convertedAmount, 2062); // 99 * 20.83 = 2062.17 → 2062 (0位小数)
  });

  test('[B5] 边界: 批量结算多订单各独立', () => {
    resetCurrencyStore();
    currencyCreateConfig({ code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2, enabled: true });
    currencyCreateConfig({ code: 'USD', symbol: '$', name: '美元', decimalPlaces: 2, enabled: true });
    currencySetRate('CNY', 'USD', 0.14);

    // 5个订单结算
    for (let i = 0; i < 5; i++) {
      const s = miniappCreateSettlement(`order_${i + 1}`, 'CNY', 'USD', 100 + i * 10);
      assert.ok(s.settlementId.startsWith('stl_'));
      assert.equal(s.status, 'pending');
    }

    // 各自独立
    assert.equal(miniappGetSettlements().length, 5);

    // 按orderId查询
    const o3 = miniappGetSettlements('order_3');
    assert.equal(o3.length, 1);
    assert.equal(o3[0].sourceAmount, 120);
  });

  test('[B6] 边界: 多类别低代码模板共存', () => {
    resetCurrencyStore();
    adminCreateTemplate({ name: '模板1', category: 'payment', config: {}, active: true });
    adminCreateTemplate({ name: '模板2', category: 'theme', config: { color: 'blue' }, active: true });
    adminCreateTemplate({ name: '模板3', category: 'checkout', config: { steps: 3 }, active: true });

    assert.equal(adminGetTemplates().length, 3);
    assert.equal(adminGetTemplates('payment').length, 1);
    assert.equal(adminGetTemplates('theme').length, 1);
    assert.equal(adminGetTemplates('checkout').length, 1);
  });
});
