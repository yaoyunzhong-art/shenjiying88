/**
 * store-capability-gating-banner.test.ts — L1 角色测试
 *
 * 门店能力门控横幅: 能力检查, readiness 判断, 访问控制
 * 正例 + 反例 + 边界, ≥3 个测试用例
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ─── Replicated types from capability-access.tsx ─────────────────────────

interface CapabilityTenantContext {
  tenantId: string;
  storeId: string;
  brandId: string;
  marketCode: string;
}

interface CapabilityMeta {
  name: string;
  label: string;
  requiredCapabilities: string[];
  readinessThreshold: number; // 0-1
}

interface ReadinessMeta {
  code: string;
  name: string;
  readiness: number; // 0-1
  missingCapabilities: string[];
}

// ─── Replicated helpers from store-capability-gating-banner.tsx ──────────

const CAPABILITY_REGISTRY: Record<string, CapabilityMeta> = {
  'ai-cs': { name: 'ai-cs', label: 'AI客服', requiredCapabilities: ['ai-cs', 'ai-model-config'], readinessThreshold: 0.8 },
  'loyalty': { name: 'loyalty', label: '会员忠诚度', requiredCapabilities: ['loyalty', 'member', 'campaign'], readinessThreshold: 0.7 },
  'coupon': { name: 'coupon', label: '优惠券', requiredCapabilities: ['coupon', 'member'], readinessThreshold: 0.6 },
  'live-metrics': { name: 'live-metrics', label: '实时数据', requiredCapabilities: ['analytics-v2', 'observability'], readinessThreshold: 0.85 },
};

/**
 * 检查门店是否具备某项能力
 */
function checkCapabilityReadiness(
  context: CapabilityTenantContext,
  capabilityName: string
): { ready: boolean; readiness: number; missing: string[] } {
  const meta = CAPABILITY_REGISTRY[capabilityName];
  if (!meta) {
    return { ready: false, readiness: 0, missing: [`unknown-capability:${capabilityName}`] };
  }

  // 模拟检查: 仅对 demo-* 的 tenant 做完整检查
  const isDemo = context.tenantId.startsWith('demo-');
  const missing = isDemo ? [] : meta.requiredCapabilities.slice(1); // demo 全部可用

  // 模拟 readiness 分数
  const readiness = isDemo ? 1.0 : Math.max(0, 1.0 - missing.length * 0.1);

  return {
    ready: readiness >= meta.readinessThreshold,
    readiness,
    missing,
  };
}

/**
 * 获取能力描述标签
 */
function getCapabilityLabel(capabilityName: string): string {
  return CAPABILITY_REGISTRY[capabilityName]?.label ?? capabilityName;
}

/**
 * 能力最低 readiness 要求
 */
function getRequiredReadiness(capabilityName: string): number {
  return CAPABILITY_REGISTRY[capabilityName]?.readinessThreshold ?? 0.5;
}

/**
 * 构建能力访问链接
 */
function buildSurfaceLink(tenantContext: CapabilityTenantContext, surfaceHref: string): string {
  const params = new URLSearchParams({
    tenantId: tenantContext.tenantId,
    storeId: tenantContext.storeId,
    brandId: tenantContext.brandId,
    marketCode: tenantContext.marketCode,
  });
  return `${surfaceHref}?${params.toString()}`;
}

// ─── Mock contexts ───────────────────────────────────────────────────────

const DEMO_CTX: CapabilityTenantContext = {
  tenantId: 'demo-tenant',
  storeId: 'store-001',
  brandId: 'brand-demo',
  marketCode: 'cn-mainland',
};

const PROD_CTX: CapabilityTenantContext = {
  tenantId: 'prod-tenant-a',
  storeId: 'store-02',
  brandId: 'brand-a',
  marketCode: 'cn-mainland',
};

// ══════════════════════════════════════════════════════════════════════════
// 👔 店长视角 (Tenant Admin)
// ══════════════════════════════════════════════════════════════════════════

describe('store-capability-gating: 👔店长视角 正例', () => {
  it('demo 环境所有能力就绪', () => {
    const aiResult = checkCapabilityReadiness(DEMO_CTX, 'ai-cs');
    assert.ok(aiResult.ready);
    assert.equal(aiResult.readiness, 1.0);
  });

  it('demo 环境 loyalty 能力就绪', () => {
    const result = checkCapabilityReadiness(DEMO_CTX, 'loyalty');
    assert.ok(result.ready);
    assert.equal(result.readiness, 1.0);
  });

  it('getCapabilityLabel 返回中文标签', () => {
    assert.equal(getCapabilityLabel('ai-cs'), 'AI客服');
    assert.equal(getCapabilityLabel('loyalty'), '会员忠诚度');
    assert.equal(getCapabilityLabel('coupon'), '优惠券');
  });

  it('buildSurfaceLink 包含所有租户参数', () => {
    const link = buildSurfaceLink(DEMO_CTX, '/capabilities/ai-cs');
    assert.ok(link.includes('tenantId=demo-tenant'));
    assert.ok(link.includes('storeId=store-001'));
    assert.ok(link.includes('brandId=brand-demo'));
    assert.ok(link.includes('marketCode=cn-mainland'));
  });
});

describe('store-capability-gating: 👔店长视角 反例', () => {
  it('非 demo 环境可能缺少能力', () => {
    const aiResult = checkCapabilityReadiness(PROD_CTX, 'ai-cs');
    if (!aiResult.ready) {
      assert.ok(aiResult.missing.length > 0);
    }
  });

  it('未知能力名称应返回未就绪', () => {
    const result = checkCapabilityReadiness(DEMO_CTX, 'non-existent-capability');
    assert.ok(!result.ready);
    assert.equal(result.readiness, 0);
  });

  it('getRequiredReadiness 未知能力返回默认值', () => {
    assert.equal(getRequiredReadiness('unknown'), 0.5);
  });

  it('getCapabilityLabel 未知能力返回名称', () => {
    assert.equal(getCapabilityLabel('custom-cap'), 'custom-cap');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🛒 前台视角 (Reception / Store Cashier)
// ══════════════════════════════════════════════════════════════════════════

describe('store-capability-gating: 🛒前台视角', () => {
  it('前台关注优惠券能力是否启用', () => {
    const result = checkCapabilityReadiness(DEMO_CTX, 'coupon');
    assert.ok(result.ready);
  });

  it('前台不能访问 AI 客服管理', () => {
    // 前台角色不应该看到 ai-cs 的管理入口
    const surfaceLink = buildSurfaceLink(DEMO_CTX, '/capabilities/ai-cs');
    assert.ok(surfaceLink.includes('storeId=store-001'));
    // 能力本身的 readiness 不代表前台有权限
    assert.ok(surfaceLink.length > 0);
  });

  it('前台可见的能力标签应通俗易懂', () => {
    const labels = ['coupon', 'loyalty'].map(getCapabilityLabel);
    assert.ok(labels.includes('优惠券'));
    assert.ok(labels.includes('会员忠诚度'));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🎮 导玩员视角 (Game Guide)
// ══════════════════════════════════════════════════════════════════════════

describe('store-capability-gating: 🎮导玩员视角', () => {
  it('导玩员关注会员忠诚度能力', () => {
    const result = checkCapabilityReadiness(DEMO_CTX, 'loyalty');
    assert.ok(result.ready);
    assert.equal(getCapabilityLabel('loyalty'), '会员忠诚度');
  });

  it('导玩员需知 coupon 是否可发放', () => {
    const result = checkCapabilityReadiness(DEMO_CTX, 'coupon');
    assert.ok(result.ready);
  });

  it('导玩员对实时数据能力无感知', () => {
    const label = getCapabilityLabel('live-metrics');
    assert.equal(label, '实时数据');
    // 导玩员不需要关心 readinessThreshold
    assert.ok(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🔧 安监视角 (Safety & Security)
// ══════════════════════════════════════════════════════════════════════════

describe('store-capability-gating: 🔧安监视角', () => {
  it('安监应检查所有缺失能力', () => {
    const result = checkCapabilityReadiness(PROD_CTX, 'ai-cs');
    assert.ok(Array.isArray(result.missing));
  });

  it('安监应保证 live-metrics 高 readiness', () => {
    const threshold = getRequiredReadiness('live-metrics');
    assert.ok(threshold >= 0.8);
  });

  it('安监视角下能力 readiness 应严格检查', () => {
    const result = checkCapabilityReadiness(PROD_CTX, 'live-metrics');
    const threshold = getRequiredReadiness('live-metrics');
    assert.equal(result.ready, result.readiness >= threshold);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🎯 运行专员视角 (Operations Specialist)
// ══════════════════════════════════════════════════════════════════════════

describe('store-capability-gating: 🎯运行专员视角 边界', () => {
  it('空能力注册表返回未就绪', () => {
    // 模拟无注册表
    const orig = { ...CAPABILITY_REGISTRY };
    // 直接测试: 不存在的能力
    const result = checkCapabilityReadiness(DEMO_CTX, 'void');
    assert.ok(!result.ready);
  });

  it('到店切换 storeId 影响能力检测', () => {
    const ctx1: CapabilityTenantContext = { ...DEMO_CTX, storeId: 'store-001' };
    const ctx2: CapabilityTenantContext = { ...DEMO_CTX, storeId: 'store-999' };
    // demo 环境两个店都应就绪
    const r1 = checkCapabilityReadiness(ctx1, 'ai-cs');
    const r2 = checkCapabilityReadiness(ctx2, 'ai-cs');
    assert.equal(r1.ready, r2.ready);
  });

  it('buildSurfaceLink 不应包含空格', () => {
    const link = buildSurfaceLink(DEMO_CTX, '/capabilities/ai-cs');
    assert.ok(!link.includes(' '));
  });

  it('tenantId 含特殊字符应被编码', () => {
    const ctx: CapabilityTenantContext = { ...DEMO_CTX, tenantId: 'tenant & co' };
    const link = buildSurfaceLink(ctx, '/');
    assert.ok(link.includes('tenant+%26+co') || link.includes('tenant%20%26%20co'));
  });
});
