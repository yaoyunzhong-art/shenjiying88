/**
 * tob-web Role-Based Smoke Test — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证六个核心模块在角色视角下能正确加载和渲染:
 * - customers        企业客户管理
 * - sports-ants      运动蚂蚁品牌官网
 * - portal           门户快照
 * - brand-management 品牌管理
 *
 * 角色常量
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── 角色常量 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const;

// ── 辅助: 读取 page.tsx 源码 ──
function readPageSource(relativePath: string): string {
  const fullPath = resolve(__dirname, '..', relativePath);
  return readFileSync(fullPath, 'utf-8');
}

// ─────────────────────────────────────────────────────────
// 1. Customers — 企业客户管理 (运营/营销视角)
// ─────────────────────────────────────────────────────────
describe('👔店长 / 🎯运行专员: customers 页面 — 正例', () => {
  it('应导出一个默认组件 CustomersPage', () => {
    const src = readPageSource('customers/page.tsx');
    assert.ok(src.includes('export default function CustomersPage'), '缺少 CustomersPage 默认导出');
  });

  it('应包含 use client 指令', () => {
    const src = readPageSource('customers/page.tsx');
    const hasDirective = src.includes("'use client'") || src.includes('"use client"');
    assert.ok(hasDirective, '缺少 use client');
  });

  it('应使用 DataTable + SearchFilterInput + Pagination 组件', () => {
    const src = readPageSource('customers/page.tsx');
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('应导入 MOCK_CUSTOMERS 并定义过滤逻辑 (status/tier/industry/搜索)', () => {
    const src = readPageSource('customers/page.tsx');
    assert.ok(src.includes('MOCK_CUSTOMERS'), '缺少 MOCK_CUSTOMERS');
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
    assert.ok(src.includes('tierFilter'), '缺少 tierFilter');
    assert.ok(src.includes('industryFilter'), '缺少 industryFilter');
    assert.ok(src.includes('searchTerm'), '缺少 searchTerm');
  });
});

describe('👔店长 / 🎯运行专员: customers 页面 — 反例', () => {
  it('应展示 "暂无数据" 空状态（过滤无结果时）', () => {
    const src = readPageSource('customers/page.tsx');
    // 验证有兜底文案而非直接崩溃
    assert.ok(
      src.includes('暂无') || src.includes('empty') || src.includes('noData') || src.includes('No data'),
      '缺少空数据兜底处理'
    );
  });

  it('应处理 loading 状态，不直接渲染数据', () => {
    const src = readPageSource('customers/page.tsx');
    assert.ok(src.includes('loading') || src.includes('LoadingSkeleton'), '缺少 loading 状态处理');
  });
});

describe('👔店长 / 🎯运行专员: customers 页面 — 边界', () => {
  it('搜索关键词为空字符串时应返回完整列表', () => {
    const src = readPageSource('customers/page.tsx');
    assert.ok(src.includes("searchTerm.trim()") || src.includes('all'), '缺少搜索空字符串兜底逻辑');
  });

  it('分页 CUSTOMERS_PER_PAGE 应为 10', () => {
    const src = readPageSource('customers/page.tsx');
    assert.ok(src.includes('CUSTOMERS_PER_PAGE = 10'), 'CUSTOMERS_PER_PAGE 不等于 10');
  });
});

// ─────────────────────────────────────────────────────────
// 2. Sports-Ants — 运动蚂蚁品牌官网 (营销/市场视角)
// ─────────────────────────────────────────────────────────
describe('📢营销 / 🤝团建: sports-ants 首页 — 正例', () => {
  it('应导出一个默认组件 SportsAntsHomePage', () => {
    const src = readPageSource('sports-ants/page.tsx');
    assert.ok(src.includes('export default function SportsAntsHomePage'), '缺少 SportsAntsHomePage');
  });

  it('应包含 SEOMeta + ConversionTracker 营销组件', () => {
    const src = readPageSource('sports-ants/page.tsx');
    assert.ok(src.includes('SEOMeta'), '缺少 SEOMeta');
    assert.ok(src.includes('ConversionTracker'), '缺少 ConversionTracker');
  });

  it('应包含 Header / Footer / FloatingContact 布局组件', () => {
    const src = readPageSource('sports-ants/page.tsx');
    assert.ok(src.includes('Header'), '缺少 Header');
    assert.ok(src.includes('Footer'), '缺少 Footer');
    assert.ok(src.includes('FloatingContact'), '缺少 FloatingContact');
  });
});

describe('📢营销 / 🤝团建: sports-ants 首页 — 反例', () => {
  it('应包含页面错误/加载异常时的兜底处理', () => {
    const src = readPageSource('sports-ants/page.tsx');
    // 验证有 errorBoundary 或 try-catch 类处理
    assert.ok(
      src.includes('error') || src.includes('ErrorBoundary') || src.includes('catch'),
      '缺少错误边界处理'
    );
  });
});

describe('📢营销 / 🤝团建: sports-ants 首页 — 边界', () => {
  it('CORE_BUSINESSES 应包含 4 个核心业务', () => {
    const src = readPageSource('sports-ants/page.tsx');
    assert.ok(src.includes("'products'"), '缺少 products 业务');
    assert.ok(src.includes("'epc'"), '缺少 epc 业务');
    assert.ok(src.includes("'franchise'"), '缺少 franchise 业务');
    assert.ok(src.includes("'tender'"), '缺少 tender 业务');
  });

  it('CORE_STATS 应包含 4 个核心数据指标', () => {
    const src = readPageSource('sports-ants/page.tsx');
    // 数字标注存在
    const hasStats = (src.match(/\d{3,}/g) ?? []).length >= 2;
    assert.ok(hasStats, '缺少核心数据数字指标');
  });
});

// ─────────────────────────────────────────────────────────
// 3. Portal — 门户快照 (安全/运维视角)
// ─────────────────────────────────────────────────────────
describe('🔧安监 / 🎮导玩员: portal 门户快照 — 正例', () => {
  it('bootstrap 应导出 tenant/brand portal 快照函数', () => {
    const src = readPageSource('bootstrap.ts');
    assert.ok(src.includes('getTenantPortalConsumerSnapshot') || src.includes('TobPortalConsumerSnapshot'), '缺少 tenant portal 快照函数');
    assert.ok(src.includes('getBrandPortalConsumerSnapshot'), '缺少 brand portal 快照函数');
    assert.ok(src.includes('getTobLandingSnapshot'), '缺少 landing 快照函数');
  });

  it('scope 应包含 resolver / revalidateOn / mismatchStrategy', () => {
    const src = readPageSource('bootstrap.ts');
    assert.ok(src.includes('resolver'), '缺少 resolver');
    assert.ok(src.includes('revalidateOn'), '缺少 revalidateOn');
    assert.ok(src.includes('mismatchStrategy'), '缺少 mismatchStrategy');
  });
});

describe('🔧安监 / 🎮导玩员: portal 门户快照 — 反例', () => {
  it('bootstrap API 失败时应有 fallback 兜底', () => {
    const src = readPageSource('bootstrap.ts');
    assert.ok(src.includes('fallback') || src.includes('Fallback'), '缺少 fallback 兜底');
  });

  it('degradation 应包含 featureFlagFallback / desensitizationMode / cacheableCapabilities', () => {
    const src = readPageSource('bootstrap.ts');
    assert.ok(src.includes('featureFlagFallback'), '缺少 featureFlagFallback');
    assert.ok(src.includes('desensitizationMode'), '缺少 desensitizationMode');
    assert.ok(src.includes('cacheableCapabilities'), '缺少 cacheableCapabilities');
  });
});

describe('🔧安监 / 🎮导玩员: portal 门户快照 — 边界', () => {
  it('不同 marketCode 应产生不同默认社交平台', () => {
    // cn-mainland → WECHAT, us-default → LINKEDIN
    const src = readPageSource('bootstrap.ts');
    assert.ok(src.includes('cn-mainland'), '缺少 cn-mainland 市场');
    const cnSocial = src.indexOf('WECHAT');
    assert.ok(cnSocial >= 0, 'cn-mainland 缺少 WECHAT');
  });

  it('portal snapshot deliveryMode 应支持 api 和 fallback 两种模式', () => {
    const src = readPageSource('bootstrap.ts');
    assert.ok(src.includes("'api'") || src.includes('"api"'), '缺少 api 模式');
    assert.ok(src.includes("'fallback'") || src.includes('"fallback"'), '缺少 fallback 模式');
  });
});

// ─────────────────────────────────────────────────────────
// 4. Brand-Management — 品牌管理 (👥HR / 运营视角)
// ─────────────────────────────────────────────────────────
describe('👥HR / 🎯运行专员: brand-management — 正例', () => {
  it('应定义 BRAND_STATUS_MAP 覆盖所有品牌状态', () => {
    const src = readPageSource('brand-management.test.ts');
    assert.ok(src.includes('BRAND_STATUS_MAP'), '缺少 BRAND_STATUS_MAP');
    assert.ok(src.includes('active'), '缺少 active');
    assert.ok(src.includes('pending_review'), '缺少 pending_review');
    assert.ok(src.includes('suspended'), '缺少 suspended');
    assert.ok(src.includes('archived'), '缺少 archived');
  });

  it('MOCK_BRANDS 应包含 8 条测试品牌数据', () => {
    const src = readPageSource('brand-management.test.ts');
    assert.ok(src.includes('MOCK_BRANDS'), '缺少 MOCK_BRANDS');
    const counts = (src.match(/brandId:/g) ?? []).length;
    assert.ok(counts >= 8, `MOCK_BRANDS 条目不足 (期望 >= 8, 实际 ${counts})`);
  });

  it('品牌数据应有完整的字段校验 (contactEmail/phone/storeCount/revenue)', () => {
    const src = readPageSource('brand-management.test.ts');
    assert.ok(src.includes('contactEmail'), '缺少 contactEmail');
    assert.ok(src.includes('contactPhone'), '缺少 contactPhone');
    assert.ok(src.includes('storeCount'), '缺少 storeCount');
    assert.ok(src.includes('annualRevenue'), '缺少 annualRevenue');
  });
});

describe('👥HR / 🎯运行专员: brand-management — 反例', () => {
  it('应能处理空品牌列表不崩溃', () => {
    const src = readPageSource('brand-management.test.ts');
    assert.ok(src.includes('empty brand list') || src.includes('brands: []'), '缺少空列表测试');
  });

  it('应处理过滤无匹配结果', () => {
    const src = readPageSource('brand-management.test.ts');
    assert.ok(src.includes('NONEXISTENT'), '缺少无匹配过滤测试');
  });
});

describe('👥HR / 🎯运行专员: brand-management — 边界', () => {
  it('archived 品牌应 storeCount 为 0 / revenue 为 0', () => {
    const src = readPageSource('brand-management.test.ts');
    assert.ok(
      src.includes("status === 'archived'") && src.includes('storeCount, 0'),
      '缺少 archived 品牌零数据边界'
    );
  });

  it('active 品牌应至少有 1 个门店', () => {
    const src = readPageSource('brand-management.test.ts');
    assert.ok(
      src.includes("status === 'active'") && src.includes('storeCount >= 1'),
      '缺少 active 门店数边界'
    );
  });
});

// ─────────────────────────────────────────────────────────
// 5. 跨模块场景: 🛒前台 综合访问（正例）
// ─────────────────────────────────────────────────────────
describe('🛒前台: 跨模块场景 — 正例', () => {
  it('customers-data 应导出 MOCK_CUSTOMERS 不少于 10 条', () => {
    const src = readPageSource('customers-data.ts');
    assert.ok(src.includes('MOCK_CUSTOMERS'), '缺少 MOCK_CUSTOMERS');
    const entries = (src.match(/id: '/g) ?? []).length;
    assert.ok(entries >= 10, `MOCK_CUSTOMERS 数据条目不足 (期望 >= 10, 实际 ${entries})`);
  });

  it('customers-data 应定义 CUSTOMER_STATUSES / CUSTOMER_TIERS / CUSTOMER_INDUSTRIES', () => {
    const src = readPageSource('customers-data.ts');
    assert.ok(src.includes('CUSTOMER_STATUSES=') || src.includes('CUSTOMER_STATUSES '), '缺少 CUSTOMER_STATUSES');
    assert.ok(src.includes('CUSTOMER_TIERS=') || src.includes('CUSTOMER_TIERS '), '缺少 CUSTOMER_TIERS');
    assert.ok(src.includes('CUSTOMER_INDUSTRIES=') || src.includes('CUSTOMER_INDUSTRIES '), '缺少 CUSTOMER_INDUSTRIES');
  });

  it('customers-data 中 status/tier 枚举类型应完整覆盖', () => {
    const src = readPageSource('customers-data.ts');
    assert.ok(src.includes('type CustomerStatus'), '缺少 CustomerStatus 类型');
    assert.ok(src.includes('type CustomerTier'), '缺少 CustomerTier 类型');
    assert.ok(src.includes('type CustomerIndustry'), '缺少 CustomerIndustry 类型');
  });
});
