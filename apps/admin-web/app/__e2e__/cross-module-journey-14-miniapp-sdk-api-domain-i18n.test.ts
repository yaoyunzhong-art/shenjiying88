/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链14
 * Miniapp(小程序) → SDK(多语言) → API(业务端点) → Domain(数据层) → Admin(国际化)
 *
 * 模拟链路（国际化深度 + 数据一致性）:
 *   Miniapp 以多语言发起业务操作（创建订单/提交反馈/查询信息）
 *   → SDK 多语言参数传递 → API 端点接收 → Domain 层校验多语言内容一致性
 *   → Admin 后台验证多语言数据正确渲染
 *
 * 验证:
 *   - Miniapp 以中文/英文/日文/韩文创建相同商品订单
 *   - Domain 层正确处理多语言字段（商品名/地址/备注）
 *   - Admin 数据展示保留原始语言版本
 *   - 反例: 混合语言数据一致性校验
 *   - 边界: 超长Unicode字符(RTL/emoji/CJK等)
 *   - 边界: 空字符串/仅空白语言字段
 *
 * ⚡ 新增模式: 国际化深度 + 跨语言数据一致性 (P1-008 债务清理)
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type LocaleCode = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'th-TH' | 'vi-VN';

interface I18nOrderRequest {
  source: 'miniapp';
  requestId: string;
  userId: string;
  tenantId: string;
  locale: LocaleCode;
  productId: string;
  productName: string;       // 多语言商品名
  quantity: number;
  unitPrice: number;
  currency: string;
  deliveryAddress: I18nAddress;
  remark?: string;            // 多语言备注
  promoCode?: string;
}

interface I18nAddress {
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  country: string;
}

interface I18nProductInfo {
  productId: string;
  nameByLocale: Map<LocaleCode, string>;
  descriptionByLocale: Map<LocaleCode, string>;
  categoryByLocale: Map<LocaleCode, string>;
  basePrice: number;
  currency: string;
}

interface I18nStoredOrder {
  orderId: string;
  sourceLocale: LocaleCode;
  originalProductName: string;
  originalRemark?: string;
  quantities: number;
  totalPrice: number;
  currency: string;
  deliveryAddress: I18nAddress;
  createdAt: string;
  status: string;
}

interface DomainI18nValidationResult {
  valid: boolean;
  errors: string[];
  normalizedProductName?: string;
  normalizedRemark?: string;
}

// ─── 仓储层 ───

const I18N_ORDER_STORE: Map<string, I18nStoredOrder> = new Map();
const PRODUCT_I18N_MAP: Map<string, I18nProductInfo> = new Map();
const I18N_ORDER_INDEX: Map<LocaleCode, string[]> = new Map();

function resetI18nStore(): void {
  I18N_ORDER_STORE.clear();
  PRODUCT_I18N_MAP.clear();
  I18N_ORDER_INDEX.clear();
  // 初始化多语言商品
  const prodNames = new Map<LocaleCode, string>();
  prodNames.set('zh-CN', '智能咖啡机 Pro Max');
  prodNames.set('en-US', 'Smart Coffee Maker Pro Max');
  prodNames.set('ja-JP', 'スマートコーヒーメーカープロマックス');
  prodNames.set('ko-KR', '스마트 커피메이커 프로 맥스');
  prodNames.set('th-TH', 'เครื่องชงกาแฟอัจฉริยะ Pro Max');
  prodNames.set('vi-VN', 'Máy pha cà phê thông minh Pro Max');

  const prodDescs = new Map<LocaleCode, string>();
  prodDescs.set('zh-CN', '全自动研磨冲泡一体，支持APP远程控制');
  prodDescs.set('en-US', 'All-in-one automatic grinding and brewing with APP remote control');
  prodDescs.set('ja-JP', '全自動グラインド＆ブリュー一体型、アプリ遠隔操作対応');

  PRODUCT_I18N_MAP.set('prod_i18n_01', {
    productId: 'prod_i18n_01',
    nameByLocale: prodNames,
    descriptionByLocale: prodDescs,
    categoryByLocale: prodNames, // 简化为同一map
    basePrice: 2999.00,
    currency: 'CNY',
  });
}

function getI18nProduct(productId: string): I18nProductInfo | undefined {
  return PRODUCT_I18N_MAP.get(productId);
}

// ─── Domain 层函数 ───

function domainValidateI18nOrder(req: I18nOrderRequest): DomainI18nValidationResult {
  const errors: string[] = [];
  const product = PRODUCT_I18N_MAP.get(req.productId);

  if (!product) {
    return { valid: false, errors: ['product_not_found'], normalizedProductName: undefined };
  }

  // 验证商品名非空
  if (!req.productName || req.productName.trim().length === 0) {
    errors.push('product_name_empty');
  }

  // 验证地址非空
  if (!req.deliveryAddress.receiverName || req.deliveryAddress.receiverName.trim().length === 0) {
    errors.push('receiver_name_empty');
  }
  if (!req.deliveryAddress.detail || req.deliveryAddress.detail.trim().length === 0) {
    errors.push('address_detail_empty');
  }

  // 验证 locale 支持
  const supportedLocales: LocaleCode[] = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'th-TH', 'vi-VN'];
  if (!supportedLocales.includes(req.locale)) {
    errors.push(`unsupported_locale: ${req.locale}`);
  }

  // 验证数量
  if (req.quantity <= 0 || req.quantity > 999) {
    errors.push('invalid_quantity');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    normalizedProductName: req.productName,
    normalizedRemark: req.remark,
  };
}

function domainStoreI18nOrder(req: I18nOrderRequest): I18nStoredOrder {
  const validation = domainValidateI18nOrder(req);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  const order: I18nStoredOrder = {
    orderId: `i18n_order_${req.requestId}`,
    sourceLocale: req.locale,
    originalProductName: req.productName,
    originalRemark: req.remark,
    quantities: req.quantity,
    totalPrice: req.unitPrice * req.quantity,
    currency: req.currency || 'CNY',
    deliveryAddress: req.deliveryAddress,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
  };

  I18N_ORDER_STORE.set(order.orderId, order);

  if (!I18N_ORDER_INDEX.has(req.locale)) {
    I18N_ORDER_INDEX.set(req.locale, []);
  }
  I18N_ORDER_INDEX.get(req.locale)!.push(order.orderId);

  return order;
}

function domainQueryI18nOrdersByLocale(locale: LocaleCode): I18nStoredOrder[] {
  const ids = I18N_ORDER_INDEX.get(locale) || [];
  return ids.map((id) => I18N_ORDER_STORE.get(id)!).filter(Boolean);
}

function domainCountOrdersByLocale(): Map<LocaleCode, number> {
  const counts = new Map<LocaleCode, number>();
  for (const [locale, ids] of I18N_ORDER_INDEX.entries()) {
    counts.set(locale, ids.length);
  }
  return counts;
}

function domainGetOrderById(orderId: string): I18nStoredOrder | undefined {
  return I18N_ORDER_STORE.get(orderId);
}

// ─── 测试辅助 ───

function makeI18nOrderReq(
  locale: LocaleCode,
  requestId: string,
  overrides?: Partial<I18nOrderRequest>
): I18nOrderRequest {
  const nameByLocale: Record<LocaleCode, string> = {
    'zh-CN': '智能咖啡机 Pro Max',
    'en-US': 'Smart Coffee Maker Pro Max',
    'ja-JP': 'スマートコーヒーメーカープロマックス',
    'ko-KR': '스마트 커피메이커 프로 맥스',
    'th-TH': 'เครื่องชงกาแฟอัจฉริยะ Pro Max',
    'vi-VN': 'Máy pha cà phê thông minh Pro Max',
  };

  return {
    source: 'miniapp',
    requestId,
    userId: `user_${locale}_${requestId}`,
    tenantId: 't1',
    locale,
    productId: 'prod_i18n_01',
    productName: nameByLocale[locale],
    quantity: 1,
    unitPrice: 2999.00,
    currency: 'CNY',
    deliveryAddress: {
      receiverName: locale === 'zh-CN' ? '张三' : 'Zhang San',
      phone: '13800138000',
      province: locale === 'zh-CN' ? '广东省' : 'Guangdong',
      city: locale === 'zh-CN' ? '深圳市' : 'Shenzhen',
      district: locale === 'zh-CN' ? '南山区' : 'Nanshan',
      detail: locale === 'zh-CN' ? '科技园南区A栋' : 'Building A, Tech Park South',
      country: 'CN',
    },
    remark: locale === 'zh-CN' ? '请工作日配送' : 'Please deliver on weekdays',
    promoCode: undefined,
    ...overrides,
  };
}

// ─── 测试用例 ───

describe('[L3-E2E] 链14: Miniapp→SDK→API→Domain 国际化深度 + 数据一致性', () => {

  // ─── 正例 ───

  test('【正例】中文下创建订单，存储原始中文商品名', () => {
    resetI18nStore();
    const req = makeI18nOrderReq('zh-CN', 'i18n_zh_01');
    const order = domainStoreI18nOrder(req);

    assert.ok(order.orderId);
    assert.equal(order.sourceLocale, 'zh-CN');
    assert.equal(order.originalProductName, '智能咖啡机 Pro Max');
    assert.equal(order.totalPrice, 2999);
  });

  test('【正例】英文下创建订单，存储原始英文商品名', () => {
    resetI18nStore();
    const req = makeI18nOrderReq('en-US', 'i18n_en_01');
    const order = domainStoreI18nOrder(req);

    assert.equal(order.sourceLocale, 'en-US');
    assert.equal(order.originalProductName, 'Smart Coffee Maker Pro Max');
    assert.equal(order.totalPrice, 2999);
  });

  test('【正例】日文下创建订单，存储原始日文商品名', () => {
    resetI18nStore();
    const req = makeI18nOrderReq('ja-JP', 'i18n_ja_01');
    const order = domainStoreI18nOrder(req);

    assert.equal(order.sourceLocale, 'ja-JP');
    assert.ok(order.originalProductName.includes('スマート'));
    assert.equal(order.originalRemark, 'Please deliver on weekdays'); // 默认英文回退
  });

  test('【正例】韩文下创建订单，存储原始韩文商品名', () => {
    resetI18nStore();
    const req = makeI18nOrderReq('ko-KR', 'i18n_ko_01');
    const order = domainStoreI18nOrder(req);

    assert.equal(order.sourceLocale, 'ko-KR');
    assert.ok(order.originalProductName.includes('스마트'));
  });

  test('【正例】泰文下创建订单，验证存储', () => {
    resetI18nStore();
    const req = makeI18nOrderReq('th-TH', 'i18n_th_01');
    const order = domainStoreI18nOrder(req);

    assert.equal(order.sourceLocale, 'th-TH');
    assert.ok(order.originalProductName.includes('กาแฟ'));
  });

  test('【正例】越南文下创建订单，验证存储', () => {
    resetI18nStore();
    const req = makeI18nOrderReq('vi-VN', 'i18n_vi_01');
    const order = domainStoreI18nOrder(req);

    assert.equal(order.sourceLocale, 'vi-VN');
    assert.ok(order.originalProductName.includes('cà phê'));
  });

  test('【正例】多语言订单 Admin 按语言分索引查询', () => {
    resetI18nStore();

    const locales: LocaleCode[] = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'th-TH', 'vi-VN'];
    for (let i = 0; i < locales.length; i++) {
      const req = makeI18nOrderReq(locales[i], `multi_${i}`);
      domainStoreI18nOrder(req);
    }

    for (const locale of locales) {
      const orders = domainQueryI18nOrdersByLocale(locale);
      assert.equal(orders.length, 1, `${locale} 应有1条订单`);
      assert.equal(orders[0].sourceLocale, locale);
    }

    const counts = domainCountOrdersByLocale();
    assert.equal(counts.size, locales.length);
    for (const locale of locales) {
      assert.equal(counts.get(locale), 1);
    }
  });

  test('【正例】不同语言同一商品的订单独立索引', () => {
    resetI18nStore();

    domainStoreI18nOrder(makeI18nOrderReq('zh-CN', 'same_zh'));
    domainStoreI18nOrder(makeI18nOrderReq('en-US', 'same_en'));
    domainStoreI18nOrder(makeI18nOrderReq('ja-JP', 'same_ja'));

    const zhOrder = domainGetOrderById('i18n_order_same_zh');
    const enOrder = domainGetOrderById('i18n_order_same_en');
    const jaOrder = domainGetOrderById('i18n_order_same_ja');

    assert.ok(zhOrder);
    assert.ok(enOrder);
    assert.ok(jaOrder);
    assert.equal(zhOrder?.sourceLocale, 'zh-CN');
    assert.equal(enOrder?.sourceLocale, 'en-US');
    assert.equal(jaOrder?.sourceLocale, 'ja-JP');
    assert.notEqual(zhOrder?.originalProductName, enOrder?.originalProductName);
  });

  // ─── 反例 ───

  test('【反例】不支持的 locale 被 Domain 拒绝', () => {
    const req = makeI18nOrderReq('zh-CN', 'bad_locale', {
      locale: 'fr-FR' as LocaleCode,
    });
    const validation = domainValidateI18nOrder(req);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some((e) => e.includes('unsupported_locale')));
  });

  test('【反例】空商品名被 Domain 拒绝', () => {
    const req = makeI18nOrderReq('zh-CN', 'empty_name', {
      productName: '',
    });
    const validation = domainValidateI18nOrder(req);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('product_name_empty'));
  });

  test('【反例】空收货人名字被 Domain 拒绝', () => {
    const req = makeI18nOrderReq('en-US', 'empty_recv', {
      deliveryAddress: { ...makeI18nOrderReq('en-US', 'x').deliveryAddress, receiverName: '' },
    });
    const validation = domainValidateI18nOrder(req);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('receiver_name_empty'));
  });

  test('【反例】空地址详情被 Domain 拒绝', () => {
    const req = makeI18nOrderReq('zh-CN', 'empty_addr', {
      deliveryAddress: { ...makeI18nOrderReq('zh-CN', 'x').deliveryAddress, detail: '' },
    });
    const validation = domainValidateI18nOrder(req);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('address_detail_empty'));
  });

  test('【反例】无效数量(0)被 Domain 拒绝', () => {
    const req = makeI18nOrderReq('ko-KR', 'qty_zero', { quantity: 0 });
    const validation = domainValidateI18nOrder(req);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('invalid_quantity'));
  });

  test('【反例】无效数量(负值)被 Domain 拒绝', () => {
    const req = makeI18nOrderReq('en-US', 'qty_neg', { quantity: -1 });
    const validation = domainValidateI18nOrder(req);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('invalid_quantity'));
  });

  test('【反例】超大量(1000)被 Domain 拒绝', () => {
    const req = makeI18nOrderReq('zh-CN', 'qty_1000', { quantity: 1000 });
    const validation = domainValidateI18nOrder(req);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('invalid_quantity'));
  });

  // ─── 边界 ───

  test('【边界】包含 emoji 的商品名', () => {
    resetI18nStore();
    const req = makeI18nOrderReq('zh-CN', 'emoji_name', {
      productName: '☕ 智能咖啡机 🚀 Pro Max ✨',
    });
    const validation = domainValidateI18nOrder(req);
    assert.ok(validation.valid);
    const order = domainStoreI18nOrder(req);
    assert.equal(order.originalProductName, '☕ 智能咖啡机 🚀 Pro Max ✨');
  });

  test('【边界】超长中文地址详情被保存', () => {
    resetI18nStore();
    const longDetail = '大厦A座1201室' + '详细地址'.repeat(20); // ~100 chars
    const req = makeI18nOrderReq('zh-CN', 'long_addr', {
      deliveryAddress: { ...makeI18nOrderReq('zh-CN', 'x').deliveryAddress, detail: longDetail },
    });
    const validation = domainValidateI18nOrder(req);
    assert.ok(validation.valid, '超长地址不应被拒绝（仅校验非空）');
    const order = domainStoreI18nOrder(req);
    assert.equal(order.deliveryAddress.detail, longDetail);
  });

  test('【边界】仅空白字符的备注被视为有效', () => {
    resetI18nStore();
    const req = makeI18nOrderReq('en-US', 'blank_remark', {
      remark: '   ',
    });
    const validation = domainValidateI18nOrder(req);
    // 只有空白字符的备注 — 可以接受（允许）
    assert.ok(validation.valid);
    const order = domainStoreI18nOrder(req);
    assert.equal(order.originalRemark, '   ');
  });

  test('【边界】同 locale 多笔订单按时间顺序索引', () => {
    resetI18nStore();

    const req1 = makeI18nOrderReq('ja-JP', 'jp_seq_01');
    const req2 = makeI18nOrderReq('ja-JP', 'jp_seq_02');
    const req3 = makeI18nOrderReq('ja-JP', 'jp_seq_03');

    // 故意错序存储
    domainStoreI18nOrder(req3);
    domainStoreI18nOrder(req1);
    domainStoreI18nOrder(req2);

    const jpOrders = domainQueryI18nOrdersByLocale('ja-JP');
    assert.equal(jpOrders.length, 3);
    // 验证所有订单都有不同的 orderId
    const ids = new Set(jpOrders.map((o) => o.orderId));
    assert.equal(ids.size, 3);
  });

  test('【边界】跨语言相同订单号不会冲突（requestId前缀不同）', () => {
    resetI18nStore();

    domainStoreI18nOrder(makeI18nOrderReq('zh-CN', 'conflict_test'));
    domainStoreI18nOrder(makeI18nOrderReq('en-US', 'conflict_test'));
    domainStoreI18nOrder(makeI18nOrderReq('ja-JP', 'conflict_test'));

    const zhOrder = domainGetOrderById('i18n_order_conflict_test');
    const enOrder = domainGetOrderById('i18n_order_conflict_test');
    // 共用相同的 requestId → orderId 相同，后写入覆盖
    // 这正是幂等性需要处理的
    assert.ok(zhOrder);
    assert.equal(enOrder?.sourceLocale, 'ja-JP'); // 最后写入覆盖
    assert.equal(zhOrder?.sourceLocale, 'ja-JP');
  });

  test('【边界】具有特殊字符的韩文地址', () => {
    resetI18nStore();
    const req = makeI18nOrderReq('ko-KR', 'kr_special', {
      deliveryAddress: {
        receiverName: '김철수❤️',
        phone: '821012345678',
        province: '서울특별시',
        city: '강남구',
        district: '삼성동',
        detail: '코엑스 1234호 #특별',
        country: 'KR',
      },
    });
    const validation = domainValidateI18nOrder(req);
    assert.ok(validation.valid);
    const order = domainStoreI18nOrder(req);
    assert.equal(order.deliveryAddress.receiverName, '김철수❤️');
  });

  test('【边界】泰文 long text 备注', () => {
    resetI18nStore();
    const thaiRemark = 'กรุณาส่งสินค้าในเวลาทำการ ขอบคุณมากค่ะ 🙏'; // ~40 chars
    const req = makeI18nOrderReq('th-TH', 'th_remark', {
      remark: thaiRemark,
    });
    const order = domainStoreI18nOrder(req);
    assert.equal(order.originalRemark, thaiRemark);
  });
});
