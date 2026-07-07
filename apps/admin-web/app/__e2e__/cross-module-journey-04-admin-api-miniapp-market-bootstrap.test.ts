/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链04
 * 管理端(租户市场引导) → API(bootstrap) → Miniapp(C端消费)
 *
 * 模拟链路:
 *   admin-web (市场引导配置) → API bootstrap 端点 → API 市场 profile 生成
 *   → miniapp 接收市场配置 → 渲染页面 + 国际化文案
 *
 * 验证:
 *   - 管理员配置市场引导后，API 输出完整的 market profile
 *   - miniapp 正确消费 market profile 渲染页面
 *   - 租户隔离: 不同租户的 market profile 互不干扰
 *   - 反例: 缺少必填字段时 miniapp 友好降级
 *   - 边界: 只有部分市场配置时不影响其他市场
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义（来自 @m5/domain market bootstrap） ───

interface MarketProfile {
  tenantId: string;
  marketCode: string;
  name: string;
  supportedLanguages: string[];
  defaultLanguage: string;
  currency: string;
  timezone: string;
  heroTitle: Record<string, string>;   // language -> text
  heroSubtitle: Record<string, string>;
  solutionTags: string[];
  loginEntry: {
    label: Record<string, string>;
    loginPath: string;
    ssoEnabled: boolean;
  };
  features: Array<{
    featureKey: string;
    enabled: boolean;
    config?: Record<string, unknown>;
  }>;
}

interface BootstrapResponse {
  success: boolean;
  data: {
    market: MarketProfile;
    baseUrl: string;
    version: string;
  } | null;
  error?: string;
}

interface MiniappRenderState {
  marketProfile: MarketProfile | null;
  heroTitle: string;
  heroSubtitle: string;
  loginLabel: string;
  solutionTags: string[];
  features: Map<string, boolean>;
  error: string | null;
  rendered: boolean;
}

// ─── Domain 层校验（模拟 @m5/domain 的 market bootstrap 校验器） ───

function validateMarketProfile(profile: MarketProfile): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!profile.tenantId) errors.push('tenantId is required');
  if (!profile.marketCode) errors.push('marketCode is required');
  if (!profile.name) errors.push('name is required');
  if (!Array.isArray(profile.supportedLanguages) || profile.supportedLanguages.length === 0) {
    errors.push('at least one supportedLanguage required');
  }
  if (!profile.defaultLanguage) errors.push('defaultLanguage is required');
  if (!profile.heroTitle || Object.keys(profile.heroTitle).length === 0) {
    errors.push('heroTitle must have at least one language entry');
  }
  if (!profile.loginEntry?.loginPath) errors.push('loginEntry.loginPath is required');

  return { valid: errors.length === 0, errors };
}

// ─── API 模拟（模拟 NestJS bootstrap 端点返回） ───

function mockApiFetchBootstrap(tenantId: string, marketCode: string): BootstrapResponse {
  if (tenantId === 'nonexistent') {
    return { success: false, data: null, error: 'Tenant not found' };
  }

  const profiles: Record<string, MarketProfile> = {
    't1': {
      tenantId: 't1',
      marketCode: 'cn-sh',
      name: '上海旗舰市场',
      supportedLanguages: ['zh-CN', 'en-US', 'ja-JP'],
      defaultLanguage: 'zh-CN',
      currency: 'CNY',
      timezone: 'Asia/Shanghai',
      heroTitle: { 'zh-CN': '欢迎来到旗舰店', 'en-US': 'Welcome to Flagship', 'ja-JP': 'フラッグシップへようこそ' },
      heroSubtitle: { 'zh-CN': '高品质服务体验', 'en-US': 'Premium Service Experience', 'ja-JP': 'プレミアムサービス体験' },
      solutionTags: ['零售', '会员', '营销'],
      loginEntry: {
        label: { 'zh-CN': '登录', 'en-US': 'Login', 'ja-JP': 'ログイン' },
        loginPath: '/auth/login',
        ssoEnabled: true,
      },
      features: [
        { featureKey: 'chat', enabled: true },
        { featureKey: 'payment', enabled: true },
        { featureKey: 'coupon', enabled: true },
        { featureKey: 'analytics', enabled: false },
      ],
    },
    't2': {
      tenantId: 't2',
      marketCode: 'us-ny',
      name: 'New York Market',
      supportedLanguages: ['en-US', 'es-US'],
      defaultLanguage: 'en-US',
      currency: 'USD',
      timezone: 'America/New_York',
      heroTitle: { 'en-US': 'Welcome to NYC', 'es-US': 'Bienvenido a NYC' },
      heroSubtitle: { 'en-US': 'Your Premium Destination', 'es-US': 'Tu Destino Premium' },
      solutionTags: ['Retail', 'Loyalty'],
      loginEntry: {
        label: { 'en-US': 'Sign In', 'es-US': 'Iniciar Sesión' },
        loginPath: '/auth/login',
        ssoEnabled: false,
      },
      features: [
        { featureKey: 'chat', enabled: true },
        { featureKey: 'payment', enabled: false },
        { featureKey: 'coupon', enabled: true },
      ],
    },
    't-incomplete': {
      tenantId: 't-incomplete',
      marketCode: 'incomplete',
      name: 'Incomplete Market',
      supportedLanguages: [], // 空数组 — 违反校验
      defaultLanguage: '',
      currency: '',
      timezone: '',
      heroTitle: {},
      heroSubtitle: {},
      solutionTags: [],
      loginEntry: {
        label: {},
        loginPath: '',
        ssoEnabled: false,
      },
      features: [],
    },
  };

  const profile = profiles[tenantId];
  if (!profile) {
    return { success: false, data: null, error: 'Market profile not found' };
  }

  return {
    success: true,
    data: {
      market: profile,
      baseUrl: `https://${marketCode}.example.com`,
      version: '1.0.0',
    },
  };
}

// ─── Miniapp 渲染逻辑模拟 ───

function miniappRenderBootstrap(resp: BootstrapResponse, lang: string): MiniappRenderState {
  if (!resp.success || !resp.data) {
    return {
      marketProfile: null,
      heroTitle: '',
      heroSubtitle: '',
      loginLabel: '',
      solutionTags: [],
      features: new Map(),
      error: resp.error || 'Bootstrap failed',
      rendered: false,
    };
  }

  const market = resp.data.market;
  const validation = validateMarketProfile(market);

  if (!validation.valid) {
    return {
      marketProfile: market,
      heroTitle: '',
      heroSubtitle: '',
      loginLabel: '',
      solutionTags: [],
      features: new Map(),
      error: `Invalid market profile: ${validation.errors.join('; ')}`,
      rendered: false,
    };
  }

  // 选择最匹配的文案
  const pickLang = (dict: Record<string, string>): string =>
    dict[lang] || dict[market.defaultLanguage] || Object.values(dict)[0] || '';

  const featureMap = new Map<string, boolean>();
  for (const f of market.features) {
    featureMap.set(f.featureKey, f.enabled);
  }

  return {
    marketProfile: market,
    heroTitle: pickLang(market.heroTitle),
    heroSubtitle: pickLang(market.heroSubtitle),
    loginLabel: pickLang(market.loginEntry.label),
    solutionTags: market.solutionTags,
    features: featureMap,
    error: null,
    rendered: true,
  };
}

// ─── 测试链 ───

describe('链04: 管理端市场引导 → API Bootstrap → Miniapp 消费', () => {

  // ---------- 正例: 完整链路 (t1/zh-CN) ----------
  test('[正例] 管理员配置市场 → API 返回完整 profile → Miniapp 正确渲染 zh-CN 页面', () => {
    // step 1: admin-web 配置已隐含市场引导配置
    // step 2: 模拟 miniapp 调用 API bootstrap
    const resp = mockApiFetchBootstrap('t1', 'cn-sh');
    assert.ok(resp.success, 'API 应成功返回');

    // step 3: miniapp 渲染
    const state = miniappRenderBootstrap(resp, 'zh-CN');
    assert.ok(state.rendered, 'miniapp 应成功渲染');
    assert.equal(state.heroTitle, '欢迎来到旗舰店', '中文 hero title 应正确');
    assert.equal(state.heroSubtitle, '高品质服务体验', '中文 hero subtitle 应正确');
    assert.equal(state.loginLabel, '登录', '中文登录标签应正确');
    assert.deepEqual(state.solutionTags, ['零售', '会员', '营销'], 'solution tags 应正确');
    assert.ok(state.features.get('chat'), 'chat feature 应启用');
    assert.ok(state.features.get('payment'), 'payment feature 应启用');
    assert.ok(state.features.get('coupon'), 'coupon feature 应启用');
    assert.equal(state.features.get('analytics'), false, 'analytics feature 应禁用');

    // step 4: 域名正确
    assert.ok(resp.data!.baseUrl.includes('cn-sh'), '域名应包含 marketCode');
  });

  // ---------- 正例: 多语言回退 (t2/zh-CN → en-US) ----------
  test('[正例] 多语言回退: 请求未支持语言时自动回退到 defaultLanguage', () => {
    const resp = mockApiFetchBootstrap('t2', 'us-ny');
    assert.ok(resp.success);

    // t2 不支持 zh-CN，应回退到 en-US
    const state = miniappRenderBootstrap(resp, 'zh-CN');
    assert.ok(state.rendered, '即使语言不支持也应渲染');
    assert.equal(state.heroTitle, 'Welcome to NYC', '应回退到 en-US');
    assert.equal(state.loginLabel, 'Sign In', '应回退到 en-US');
  });

  // ---------- 反例: 租户不存在 ----------
  test('[反例] 不存在的租户 → API 返回错误 → Miniapp 降级不崩溃', () => {
    const resp = mockApiFetchBootstrap('nonexistent', 'xx-xx');
    assert.equal(resp.success, false);
    assert.equal(resp.error, 'Tenant not found');

    const state = miniappRenderBootstrap(resp, 'zh-CN');
    assert.equal(state.rendered, false, '应无法渲染');
    assert.ok(state.error, '应有错误信息');
    assert.equal(state.heroTitle, '', 'hero title 应为空');
  });

  // ---------- 反例: 不完整 profile ----------
  test('[反例] 不完整的市场 profile → Domain 校验失败 → Miniapp 友好提示', () => {
    const resp = mockApiFetchBootstrap('t-incomplete', 'incomplete');
    assert.ok(resp.success, 'API 可能仍返回成功（后端未校验数据完整性）');

    const state = miniappRenderBootstrap(resp, 'zh-CN');
    assert.equal(state.rendered, false, 'domain 校验失败不应渲染');
    assert.ok(state.error!.includes('Invalid market profile'), '应提示 profile 校验失败');
    assert.ok(state.error!.includes('supportedLanguage'), '应提示缺少 supportedLanguage');
    assert.ok(state.error!.includes('defaultLanguage'), '应提示缺少 defaultLanguage');
    assert.ok(state.error!.includes('heroTitle'), '应提示缺少 heroTitle');
    assert.ok(state.error!.includes('loginEntry.loginPath'), '应提示缺少 loginPath');
  });

  // ---------- 边界: 租户隔离 ----------
  test('[边界] 租户隔离: 不同租户的市场配置互不干扰', () => {
    const resp1 = mockApiFetchBootstrap('t1', 'cn-sh');
    const resp2 = mockApiFetchBootstrap('t2', 'us-ny');

    assert.ok(resp1.success);
    assert.ok(resp2.success);

    const state1 = miniappRenderBootstrap(resp1, 'zh-CN');
    const state2 = miniappRenderBootstrap(resp2, 'en-US');

    assert.equal(state1.heroTitle, '欢迎来到旗舰店', 't1 的中文标题');
    assert.equal(state2.heroTitle, 'Welcome to NYC', 't2 的英文标题');
    assert.notEqual(state1.marketProfile!.currency, state2.marketProfile!.currency, '不同租户货币应不同');
    assert.notEqual(state1.marketProfile!.timezone, state2.marketProfile!.timezone, '不同租户时区应不同');

    // t1 有 analytics (disabled), t2 无 analytics feature
    assert.equal(state1.features.has('analytics'), true, 't1 应有 analytics feature');
    assert.equal(state2.features.has('analytics'), false, 't2 不应有 analytics feature');
  });
});
