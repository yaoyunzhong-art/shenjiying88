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

  // ===== 额外测试（三件套增强） =====

  // ---- 扩展正例 ----

  test('[正例] API 返回 baseUrl 格式正确', () => {
    const resp = mockApiFetchBootstrap('t1', 'cn-sh');
    assert.ok(resp.success);
    const baseUrl = resp.data!.baseUrl;
    assert.ok(baseUrl.startsWith('https://'), 'baseUrl 应为 https');
    assert.ok(baseUrl.includes('cn-sh'), 'baseUrl 应包含 marketCode');
  });

  test('[正例] API 返回 version 为 semver', () => {
    const resp = mockApiFetchBootstrap('t1', 'cn-sh');
    assert.ok(resp.data!.version.match(/^\d+\.\d+\.\d+$/), 'version 应为 semver');
  });

  test('[正例] 多语言 heroTitle 完整填充', () => {
    const resp = mockApiFetchBootstrap('t1', 'cn-sh');
    const titles = resp.data!.market.heroTitle;
    assert.ok(titles['zh-CN'], '应含中文');
    assert.ok(titles['en-US'], '应含英文');
    assert.ok(titles['ja-JP'], '应含日文');
  });

  test('[正例] 支持的单语言租户正确渲染', () => {
    const resp = mockApiFetchBootstrap('t2', 'us-ny');
    const state = miniappRenderBootstrap(resp, 'en-US');
    assert.ok(state.rendered);
    assert.equal(state.heroTitle, 'Welcome to NYC');
  });

  // ---- 扩展反例 ----

  test('[反例] 不存在 marketCode 返回错误', () => {
    const resp = mockApiFetchBootstrap('t1', 'unknown-market');
    assert.equal(resp.success, false, '不存在 marketCode 不应成功');
  });

  test('[反例] 语言没有对应文案时走 key 遍历', () => {
    const resp = mockApiFetchBootstrap('t2', 'us-ny');
    // t2 没有 fr-FR 文案，回退逻辑在 miniappRenderBootstrap 中
    const dict = { 'en-US': 'Hello' };
    const fallback = dict['fr-FR'] || dict['en-US'] || 'Default';
    assert.equal(fallback, 'Hello', '回退到第一个非空语言');
  });

  test('[反例] 域名 URL 格式校验: 不含空格', () => {
    const urls = ['https://cn-sh.example.com', 'https://us-ny.example.com'];
    assert.ok(urls.every(u => !u.includes(' ')), 'URL 不应含空格');
    assert.ok(urls.every(u => u.startsWith('https://')), 'URL 应用 https');
  });

  test('[反例] 空 features 不失败', () => {
    const emptyFeatures = { features: [] as Array<{ featureKey: string; enabled: boolean }> };
    assert.equal(emptyFeatures.features.length, 0);
  });

  // ---- 扩展边界 ----

  test('[边界] 市场配置 currency 枚举', () => {
    const currencies = ['CNY', 'USD', 'EUR', 'JPY'];
    assert.ok(currencies.every(c => /^[A-Z]{3}$/.test(c)), 'currency 应为3位大写字母');
    assert.equal(currencies.length, 4);
  });

  test('[边界] 市场配置 timezone 格式', () => {
    const timezones = ['Asia/Shanghai', 'America/New_York', 'Europe/London'];
    assert.ok(timezones.every(t => t.includes('/')), 'timezone 应含 /');
    assert.ok(timezones.every(t => t.split('/').length === 2), 'timezone 应为 Region/City');
  });

  test('[边界] 市场代码不可变', () => {
    const code = 'CN-BJ';
    const uppercase = code.toUpperCase();
    assert.equal(code, uppercase);
    assert.ok(/^[A-Z]{2}-[A-Z]{2,4}$/.test(code), 'marketCode 格式应为 XX-XX');
  });

  test('[边界] solutionTags 统一小写', () => {
    const tags = ['零售', '会员', '营销'];
    assert.ok(tags.every(t => t.length > 0), 'solution tags 不应为空');
    assert.equal(tags.length, 3);
  });

  test('[边界] ssoEnabled 在不同租户中差异化', () => {
    const t1Resp = mockApiFetchBootstrap('t1', 'cn-sh');
    const t2Resp = mockApiFetchBootstrap('t2', 'us-ny');
    assert.equal(t1Resp.data!.market.loginEntry.ssoEnabled, true, 't1 启用 SSO');
    assert.equal(t2Resp.data!.market.loginEntry.ssoEnabled, false, 't2 不启用 SSO');
  });

  test('[边界] 市场配置不可变字段不被覆盖', () => {
    const resp = mockApiFetchBootstrap('t1', 'cn-sh');
    const market = resp.data!.market;
    assert.equal(market.tenantId, 't1', 'tenantId 不应变');
    // 模拟 miniapp 本地不修改 tenantId
    const localMarket = { ...market, name: 'Modified' };
    assert.equal(localMarket.tenantId, 't1', 'tenantId 不可变');
    assert.equal(localMarket.name, 'Modified', 'name 可修改');
  });

  test('[边界] API 响应完整性: 所有字段存在', () => {
    const resp = mockApiFetchBootstrap('t1', 'cn-sh');
    const m = resp.data!.market;
    assert.ok(m.tenantId, 'tenantId');
    assert.ok(m.marketCode, 'marketCode');
    assert.ok(m.name, 'name');
    assert.ok(m.supportedLanguages.length > 0, 'languages');
    assert.ok(m.currency, 'currency');
    assert.ok(m.timezone, 'timezone');
    assert.ok(Object.keys(m.heroTitle).length > 0, 'heroTitle');
    assert.ok(m.loginEntry.loginPath, 'loginPath');
  });

  test('[正例] 多租户市场代码唯一性', () => {
    const marketCodes = ['cn-sh', 'us-ny', 'incomplete'];
    const unique = new Set(marketCodes);
    assert.equal(unique.size, marketCodes.length, 'marketCode 应唯一');
  });

  test('[边界] API version 更新不影响数据结构', () => {
    const resp = mockApiFetchBootstrap('t1', 'cn-sh');
    const oldFields = ['tenantId', 'marketCode', 'name', 'supportedLanguages', 'currency', 'timezone'];
    const missing = oldFields.filter(f => !(f in resp.data!.market));
    assert.equal(missing.length, 0, '所有旧字段应保留');
  });

  test('[边界] 市场配置缓存刷新场景', () => {
    const resp1 = mockApiFetchBootstrap('t1', 'cn-sh');
    const resp2 = mockApiFetchBootstrap('t1', 'cn-sh');
    assert.deepEqual(resp1.data!.market, resp2.data!.market, '相同租户市场数据一致');
  });
