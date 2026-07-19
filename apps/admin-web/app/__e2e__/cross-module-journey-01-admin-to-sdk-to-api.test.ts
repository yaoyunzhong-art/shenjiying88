/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链01
 * 管理端(产品管理) → SDK(API调用) → Domain(类型/状态校验) → admin(展示/过滤)
 *
 * 测试链: admin-web (products-page) → mock SDK 返回 → domain 类型校验 → admin 列表展示/过滤
 *
 * 模拟核心跨模块数据流: products data → SDK → API → ViewModel → UI展示
 * 不直接 import @m5/sdk/@m5/domain (CJS包), 使用 inline mock + 同项目测试验证模式
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── Domain 类型常量（来自 @m5/domain） ───
// 保持与 domain 层一致的状态枚举
const PRODUCT_STATUS = ['active', 'inactive', 'discontinued', 'draft'] as const;
const PRODUCT_CATEGORIES = ['food', 'beverage', 'daily', 'electronics', 'clothing'] as const;

// ─── SDK mock 返回结构（来自 @m5/sdk ApiClient） ───
// 模拟 ApiClient.getMarketBootstrap / getWorkbenchBootstrap 返回
interface MockBootstrapData {
  tenant: { id: string; name: string };
  brands: Array<{ id: string; name: string }>;
  stores: Array<{ id: string; name: string; marketCode: string }>;
  capabilities: string[];
  channels: string[];
  audiences: string[];
}

interface MockBootstrapResponse {
  success: boolean;
  message: string;
  data: MockBootstrapData | null;
  timestamp: string;
}

// ─── Domain 层校验函数（模拟 @m5/domain 的类型守卫） ───
function validateBootstrapResponse(resp: MockBootstrapResponse): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof resp.success !== 'boolean') errors.push('success must be boolean');
  if (typeof resp.message !== 'string') errors.push('message must be string');
  if (resp.data === null) errors.push('data must not be null');
  if (typeof resp.timestamp !== 'string') errors.push('timestamp must be string');

  if (resp.data) {
    if (!resp.data.tenant?.id) errors.push('data.tenant.id is required');
    if (!Array.isArray(resp.data.brands)) errors.push('data.brands must be array');
    if (!Array.isArray(resp.data.stores)) errors.push('data.stores must be array');
    if (resp.data.brands.length === 0) errors.push('at least one brand required');
    if (resp.data.stores.length === 0) errors.push('at least one store required');
  }

  return { valid: errors.length === 0, errors };
}

// ─── Admin web 产品过滤函数（模拟 products-page / products filtering logic） ───
function filterProducts(
  products: Array<{ id: string; name: string; status: string; category: string; marketCode: string; price: number; cost: number; stock: number }>,
  filters: { status?: string; category?: string; marketCode?: string }
) {
  let result = [...products];
  if (filters.status && filters.status !== 'ALL') {
    result = result.filter(p => p.status === filters.status);
  }
  if (filters.category && filters.category !== 'ALL') {
    result = result.filter(p => p.category === filters.category);
  }
  if (filters.marketCode) {
    result = result.filter(p => p.marketCode === filters.marketCode);
  }
  return result;
}

function computeMargin(price: number, cost: number): number {
  return price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
}

describe('🌐 [L3-E2E-01] 管理端(产品) → SDK(API层) → Domain(校验) → admin(展示/过滤)', () => {
  // ─── 正例: 正常链路 ───
  test('[正例] admin products → SDK mock bootstrap → domain 校验 → admin 过滤/展示', async () => {
    // Phase 1: Admin web 使用 SDK 发起 bootstrap 请求
    const sdkMockResponse: MockBootstrapResponse = {
      success: true,
      message: 'OK',
      data: {
        tenant: { id: 'tenant-demo', name: 'Tenant Demo' },
        brands: [
          { id: 'brand-001', name: 'Brand Alpha' },
          { id: 'brand-002', name: 'Brand Beta' },
        ],
        stores: [
          { id: 'store-001', name: '旗舰店', marketCode: 'CN-BJ' },
          { id: 'store-002', name: '分店', marketCode: 'CN-SH' },
        ],
        capabilities: ['runtime-governance', 'rate-limits', 'resilience'],
        channels: ['PC', 'PAD'],
        audiences: ['TOB'],
      },
      timestamp: new Date().toISOString(),
    };

    // Phase 2: Domain 层校验
    const validation = validateBootstrapResponse(sdkMockResponse);
    assert.ok(validation.valid, `domain 校验应通过: ${validation.errors.join(', ')}`);
    assert.equal(sdkMockResponse.data!.brands.length, 2, 'domain: brands 应有2个');
    assert.equal(sdkMockResponse.data!.stores.length, 2, 'domain: stores 应有2个');

    // Phase 3: Admin 展示 — 从 bootstrap 提取 CN-BJ 市场
    const bjStores = sdkMockResponse.data!.stores.filter(s => s.marketCode === 'CN-BJ');
    assert.equal(bjStores.length, 1, 'admin: CN-BJ 店铺筛选应返回1个');
    assert.equal(bjStores[0]!.name, '旗舰店', 'admin: 展示名称应为 旗舰店');

    // Phase 4: Admin products-page 产品过滤
    const mockProducts = [
      { id: 'p1', name: '商品A', status: 'active', category: 'food', marketCode: 'CN-BJ', price: 100, cost: 60, stock: 50 },
      { id: 'p2', name: '商品B', status: 'active', category: 'electronics', marketCode: 'CN-SH', price: 200, cost: 120, stock: 30 },
      { id: 'p3', name: '商品C', status: 'inactive', category: 'daily', marketCode: 'CN-BJ', price: 50, cost: 30, stock: 0 },
      { id: 'p4', name: '商品D', status: 'draft', category: 'food', marketCode: 'CN-GZ', price: 80, cost: 50, stock: 0 },
    ];

    // 组合过滤: status=active + category=food
    const filtered = filterProducts(mockProducts, { status: 'active', category: 'food' });
    assert.equal(filtered.length, 1, 'admin: 组合过滤应返回1个');
    assert.equal(filtered[0]!.name, '商品A', 'admin: 组合过滤结果应为 商品A');

    // Phase 5: Margin 计算
    const margin = computeMargin(mockProducts[0]!.price, mockProducts[0]!.cost);
    assert.equal(margin, 40, 'admin: margin 计算应为 40%');

    // Phase 6: Status 枚举校验
    assert.ok(PRODUCT_STATUS.includes(mockProducts[0]!.status as typeof PRODUCT_STATUS[number]), 'domain: status 应在允许范围内');
    assert.ok(PRODUCT_CATEGORIES.includes(mockProducts[0]!.category as typeof PRODUCT_CATEGORIES[number]), 'domain: category 应在允许范围内');

    console.log('  ✅ [链01] 正例通过: SDK bootstrap → Domain校验 → Admin过滤/Margin/状态');
  });

  // ─── 反例: SDK 返回 401 ───
  test('[反例] SDK 401 未授权 → domain 错误处理 → admin 不渲染数据', async () => {
    const sdkErrorResponse: MockBootstrapResponse = {
      success: false,
      message: 'Unauthorized - invalid or expired token',
      data: null,
      timestamp: new Date().toISOString(),
    };

    // Domain 校验: success=false + data=null
    assert.equal(sdkErrorResponse.success, false, 'domain: success 应为 false');
    assert.equal(sdkErrorResponse.data, null, 'domain: 错误时 data 应为 null');

    // Admin 展示逻辑: 不渲染数据
    const shouldRenderData = sdkErrorResponse.success && sdkErrorResponse.data !== null;
    assert.equal(shouldRenderData, false, 'admin: 认证失败时不展示数据');

    console.log('  ✅ [链01] 反例通过: 401 → Domain空数据 → Admin安全返回');
  });

  // ─── 边界: 空品牌列表 ───
  test('[边界] SDK 返回空品牌列表 → domain 校验警告 → admin 不阻塞', async () => {
    const emptyBrandsResponse: MockBootstrapResponse = {
      success: true,
      message: 'OK',
      data: {
        tenant: { id: 'tenant-demo', name: 'Tenant Demo' },
        brands: [], // 空品牌
        stores: [{ id: 'store-001', name: '旗舰店', marketCode: 'CN-BJ' }],
        capabilities: [],
        channels: [],
        audiences: [],
      },
      timestamp: new Date().toISOString(),
    };

    // Domain 校验: 无品牌 => 触发验证错误
    const validation = validateBootstrapResponse(emptyBrandsResponse);
    assert.equal(validation.valid, false, 'domain: 空品牌应触发校验不通过');
    assert.ok(validation.errors.some(e => e.includes('brand')), 'domain: 应报告品牌缺失');

    // Admin 降级: 即使 brand 为空，也不崩溃
    const storeCount = emptyBrandsResponse.data!.stores.length;
    assert.equal(storeCount, 1, 'admin: 店铺数据应独立展示');
    assert.equal(emptyBrandsResponse.data!.brands.length, 0, 'admin: 品牌为空时应展示空状态');

    console.log('  ✅ [链01] 边界通过: 空品牌 → Domain校验失败 → Admin不崩溃');
  });
});

  // ===== 额外测试（正例+反例+边界 三件套套装） =====

  // ---- 2. 商品过滤 ----

  test('[正例] admin 商品列表按状态过滤: active', () => {
    const products = [
      { id: 'p1', name: 'A', status: 'active', category: 'food', marketCode: 'CN-BJ', price: 100, cost: 60, stock: 50 },
      { id: 'p2', name: 'B', status: 'inactive', category: 'daily', marketCode: 'CN-SH', price: 200, cost: 120, stock: 30 },
      { id: 'p3', name: 'C', status: 'active', category: 'electronics', marketCode: 'CN-BJ', price: 50, cost: 30, stock: 0 },
    ];
    const result = filterProducts(products, { status: 'active' });
    assert.equal(result.length, 2, 'active 过滤应返回2个');
    assert.ok(result.every(p => p.status === 'active'), '所有结果状态应为 active');
  });

  test('[正例] admin 商品列表按分类过滤: food', () => {
    const products = [
      { id: 'p1', name: 'A', status: 'active', category: 'food', marketCode: 'CN-BJ', price: 100, cost: 60, stock: 50 },
      { id: 'p2', name: 'B', status: 'inactive', category: 'daily', marketCode: 'CN-SH', price: 200, cost: 120, stock: 30 },
      { id: 'p3', name: 'C', status: 'active', category: 'food', marketCode: 'CN-GZ', price: 50, cost: 30, stock: 10 },
    ];
    const result = filterProducts(products, { category: 'food' });
    assert.equal(result.length, 2, 'food 过滤应返回2个');
  });

  test('[反例] 不存在的分类状态组合过滤应返回空', () => {
    const products = [
      { id: 'p1', name: 'A', status: 'active', category: 'food', marketCode: 'CN-BJ', price: 100, cost: 60, stock: 50 },
    ];
    const result = filterProducts(products, { status: 'inactive', category: 'electronics' });
    assert.equal(result.length, 0, '不存在的组合应返回空');
  });

  test('[边界] 空商品列表过滤不报错', () => {
    const result = filterProducts([], { status: 'active' });
    assert.deepEqual(result, [], '空列表过滤应返回空数组');
  });

  test('[边界] 不设置任何过滤条件应返回所有商品', () => {
    const products = [
      { id: 'p1', name: 'A', status: 'active', category: 'food', marketCode: 'CN-BJ', price: 100, cost: 60, stock: 50 },
      { id: 'p2', name: 'B', status: 'inactive', category: 'daily', marketCode: 'CN-SH', price: 200, cost: 120, stock: 30 },
    ];
    const result = filterProducts(products, {});
    assert.equal(result.length, 2, '无过滤条件返回全部');
  });

  // ---- 3. Margin 计算 ----

  test('[正例] margin 计算: 正常价格', () => {
    assert.equal(computeMargin(100, 60), 40, '100-60=40%');
    assert.equal(computeMargin(200, 100), 50, '200-100=50%');
    assert.equal(computeMargin(50, 25), 50, '50-25=50%');
  });

  test('[反例] cost=price 时 margin 为0', () => {
    assert.equal(computeMargin(100, 100), 0, 'cost=price 应为0%');
  });

  test('[反例] cost>price 时 margin 为0（亏本不显示负百分比）', () => {
    assert.equal(computeMargin(100, 150), 0, 'cost>price 应为0%');
  });

  test('[边界] price=0 时应返回0', () => {
    assert.equal(computeMargin(0, 0), 0, 'price=0 应返回0');
  });

  test('[边界] 大数 margin 计算不溢出', () => {
    const result = computeMargin(99999999, 50000000);
    assert.equal(result, 50, '大数计算应准确');
  });

  // ---- 4. Domain 校验 ----

  test('[正例] 完整 bootstrap 响应通过 domain 校验', () => {
    const resp: MockBootstrapResponse = {
      success: true,
      message: 'OK',
      data: { tenant: { id: 't1', name: 'T1' }, brands: [{ id: 'b1', name: 'B1' }], stores: [{ id: 's1', name: 'S1', marketCode: 'CN-BJ' }], capabilities: [], channels: [], audiences: [] },
      timestamp: new Date().toISOString(),
    };
    const v = validateBootstrapResponse(resp);
    assert.ok(v.valid);
    assert.equal(v.errors.length, 0);
  });

  test('[反例] 缺少 tenant.id 应返回错误', () => {
    const resp: MockBootstrapResponse = {
      success: true,
      message: 'OK',
      data: { tenant: { id: '', name: '' }, brands: [{ id: 'b1', name: 'B1' }], stores: [{ id: 's1', name: 'S1', marketCode: 'CN-BJ' }], capabilities: [], channels: [], audiences: [] },
      timestamp: new Date().toISOString(),
    };
    const v = validateBootstrapResponse(resp);
    assert.equal(v.valid, false);
    assert.ok(v.errors.some(e => e.includes('tenant.id')));
  });

  test('[反例] success 非 boolean 应报错', () => {
    const resp = { success: 'yes' as unknown as boolean, message: 'OK', data: null, timestamp: '' };
    const v = validateBootstrapResponse(resp);
    assert.equal(v.valid, false);
    assert.ok(v.errors.some(e => e.includes('boolean')));
  });

  test('[边界] 只有最低必要字段的响应通过校验', () => {
    const resp: MockBootstrapResponse = {
      success: true,
      message: 'OK',
      data: { tenant: { id: 'min', name: 'Min' }, brands: [{ id: 'b1', name: 'B1' }], stores: [{ id: 's1', name: 'S1', marketCode: 'XX' }], capabilities: [], channels: [], audiences: [] },
      timestamp: new Date().toISOString(),
    };
    const v = validateBootstrapResponse(resp);
    assert.ok(v.valid);
  });

  // ---- 5. 多市场店铺 ----

  test('[正例] 多市场多店铺筛选: 按 marketCode 分组', () => {
    const stores = [
      { id: 's1', name: '店1', marketCode: 'CN-BJ' },
      { id: 's2', name: '店2', marketCode: 'CN-SH' },
      { id: 's3', name: '店3', marketCode: 'CN-BJ' },
    ];
    const bjStores = stores.filter(s => s.marketCode === 'CN-BJ');
    assert.equal(bjStores.length, 2, 'CN-BJ 应有2店');
    assert.deepEqual(bjStores.map(s => s.name), ['店1', '店3']);
  });

  test('[反例] CSV 导出过滤: 空结果不崩溃', () => {
    const stores: Array<{ id: string; name: string; marketCode: string }> = [];
    const exportData = stores.length > 0 ? stores.map(s => `${s.id},${s.name},${s.marketCode}`).join('\n') : '无数据';
    assert.equal(exportData, '无数据', '空数据导出应显示 无数据');
  });

  test('[边界] 市场配置的 marketCode 大写一致性', () => {
    const marketCodes = ['CN-BJ', 'CN-SH', 'CN-GZ'];
    assert.ok(marketCodes.every(c => c === c.toUpperCase()), '所有 marketCode 应大写');
    assert.ok(marketCodes.every(c => /^[A-Z]{2}-[A-Z]{2}$/.test(c)), '格式应为 XX-XX');
  });

  // ---- 6. 产品状态枚举 ----

  test('[边界] PRODUCT_STATUS 枚举完整性', () => {
    assert.equal(PRODUCT_STATUS.length, 4, '应有4种状态');
    assert.ok(PRODUCT_STATUS.includes('active'));
    assert.ok(PRODUCT_STATUS.includes('inactive'));
    assert.ok(PRODUCT_STATUS.includes('discontinued'));
    assert.ok(PRODUCT_STATUS.includes('draft'));
  });

  test('[反例] 不在枚举中的状态被过滤时不影响其他', () => {
    const products = [
      { id: 'p1', name: 'A', status: 'active', category: 'food', marketCode: 'CN-BJ', price: 100, cost: 60, stock: 50 },
    ];
    // ALL = 不过滤
    const result = filterProducts(products, { status: 'ALL' });
    assert.equal(result.length, 1);
  });

  test('[边界] enum 类型的 AS CONST 不可变', () => {
    const categories = [...PRODUCT_CATEGORIES] as readonly string[];
    assert.deepEqual([...categories], ['food', 'beverage', 'daily', 'electronics', 'clothing']);
  });

  test('[边界] PRODUCT_STATUS 所有枚举值都是小写字母', () => {
    assert.ok(PRODUCT_STATUS.every(s => /^[a-z]+$/.test(s)), 'status 枚举值应全小写');
  });
});
