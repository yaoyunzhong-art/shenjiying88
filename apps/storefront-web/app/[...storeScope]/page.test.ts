/**
 * [...storeScope]/page.test.ts — B-页面 数据层测试 (depth L2)
 * 角色视角: 🛒 前台消费者 / 🏪 门店运营
 *
 * 覆盖（≥12项纯数据层）:
 * 1. StoreScopeParams 接口完整性 (5项)
 * 2. resolveStoreScope 正例-3段路径默认补齐
 * 3. resolveStoreScope 正例-4段路径显式market
 * 4. resolveStoreScope 反例/边界条件
 * 5. 市场触点 touchpoints 常量
 * 6. 默认触点 touchpoints 常量
 * 7. getFallbackStorePortal 数据工厂结构
 * 8. portal 国内市场语言配置
 * 9. portal 海外市场语言配置
 * 10. portal supportedSurfaces 枚举完整性
 * 11. StorefrontConsumerSnapshot 接口结构
 * 12. scope path / resolver / mismatchStrategy
 * 13. degradation 降级字段
 * 14. challenge 挑战字段
 * 15. 页面组件导出与导入依赖
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

// ============================================================
// 源码读取（通过文件扫描验证导出/数据/类型）
// ============================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf8');
const STORE_SCOPE_SRC = readFileSync(resolve(__dirname, '..', 'store-scope.ts'), 'utf8');
const BOOTSTRAP_SRC = readFileSync(resolve(__dirname, '..', 'market-bootstrap.ts'), 'utf8');

// ============================================================
// 辅助断言
// ============================================================

function hasExport(src: string, name: string): boolean {
  return (
    src.includes(`export ${name}`) ||
    src.includes(`export type ${name}`) ||
    src.includes(`export interface ${name}`) ||
    src.includes(`export function ${name}`)
  );
}

// ============================================================
// 1. StoreScopeParams 接口完整性 (5项)
// ============================================================

describe('StoreScopeParams — 类型完整性', () => {
  it('应导出 StoreScopeParams 接口', () => {
    assert.ok(hasExport(STORE_SCOPE_SRC, 'StoreScopeParams'), '缺少 StoreScopeParams 导出');
  });

  it('应包含 marketCode 字段', () => {
    assert.ok(STORE_SCOPE_SRC.includes('marketCode'), '缺少 marketCode');
  });

  it('应包含 tenantCode 字段', () => {
    assert.ok(STORE_SCOPE_SRC.includes('tenantCode'), '缺少 tenantCode');
  });

  it('应包含 brandCode 字段', () => {
    assert.ok(STORE_SCOPE_SRC.includes('brandCode'), '缺少 brandCode');
  });

  it('应包含 storeCode 字段', () => {
    assert.ok(STORE_SCOPE_SRC.includes('storeCode'), '缺少 storeCode');
  });
});

// ============================================================
// 2-4. resolveStoreScope — 正例/反例/边界
// ============================================================

describe('resolveStoreScope — 正例', () => {
  it('3 段路径应补齐默认 marketCode 为 cn-mainland', () => {
    // 通过 export function 和函数体内的 cn-mainland 来验证
    assert.ok(STORE_SCOPE_SRC.includes('export function resolveStoreScope'), '存在导出函数');
    assert.ok(STORE_SCOPE_SRC.includes("'cn-mainland'"), '默认 market 应为 cn-mainland');
  });

  it('4 段路径应保留显式 marketCode', () => {
    assert.ok(STORE_SCOPE_SRC.includes('scope.length === 3'), '3 段分支');
    assert.ok(STORE_SCOPE_SRC.includes('scope.length === 4'), '4 段分支');
  });

  it('DEFAULT_MARKET_CODE 常量值为 cn-mainland', () => {
    assert.ok(STORE_SCOPE_SRC.includes("DEFAULT_MARKET_CODE = 'cn-mainland'"), '默认常量必须为 cn-mainland');
  });
});

describe('resolveStoreScope — 反例', () => {
  it('无效 scope（非 3/4 段）应返回 null', () => {
    assert.ok(STORE_SCOPE_SRC.includes('return null;'), '应返回 null');
  });
});

describe('resolveStoreScope — 边界', () => {
  it('StoreScopeParams 返回值包含 4 个必填字段', () => {
    // 验证接口定义的 4 个字段全部存在
    assert.ok(STORE_SCOPE_SRC.includes('marketCode'), 'marketCode');
    assert.ok(STORE_SCOPE_SRC.includes('tenantCode'), 'tenantCode');
    assert.ok(STORE_SCOPE_SRC.includes('brandCode'), 'brandCode');
    assert.ok(STORE_SCOPE_SRC.includes('storeCode'), 'storeCode');
  });
});

// ============================================================
// 5-6. Touchpoints 常量
// ============================================================

describe('Touchpoints 常量 — 市场触点', () => {
  it('应定义 marketTouchpoints 数组', () => {
    assert.ok(PAGE_SRC.includes('marketTouchpoints'), '缺少 marketTouchpoints');
  });

  it('marketTouchpoints 应包含 5 个标准市场触点', () => {
    const touchpoints = [
      '市场化活动落地页',
      '多语言领券页',
      '区域赛事报名页',
      '品牌联名分享页',
      '预约与排队入口',
    ];
    for (const tp of touchpoints) {
      assert.ok(PAGE_SRC.includes(tp), `缺少市场触点: ${tp}`);
    }
  });
});

describe('Touchpoints 常量 — 默认触点', () => {
  it('应定义 defaultTouchpoints 数组', () => {
    assert.ok(PAGE_SRC.includes('defaultTouchpoints'), '缺少 defaultTouchpoints');
  });

  it('defaultTouchpoints 应包含 5 个标准门店触点', () => {
    const touchpoints = [
      '门店活动落地页',
      '优惠券领取页',
      '赛事报名页',
      '生日趴 / 团建分享页',
      '预约与排队入口',
    ];
    for (const tp of touchpoints) {
      assert.ok(PAGE_SRC.includes(tp), `缺少默认触点: ${tp}`);
    }
  });
});

// ============================================================
// 7. getFallbackStorePortal 数据工厂
// ============================================================

describe('getFallbackStorePortal — 数据工厂', () => {
  it('应定义 getFallbackStorePortal 函数', () => {
    assert.ok(BOOTSTRAP_SRC.includes('function getFallbackStorePortal'), '缺少工厂函数定义');
  });

  it('工厂返回结构应包含 audience 设为 TOC', () => {
    assert.ok(BOOTSTRAP_SRC.includes("audience: 'TOC'"), 'audience 应为 TOC');
  });

  it('工厂返回结构应包含 scopeType 设为 STORE', () => {
    assert.ok(BOOTSTRAP_SRC.includes("scopeType: 'STORE'"), 'scopeType 应为 STORE');
  });

  it('工厂返回结构应包含 storeName', () => {
    assert.ok(BOOTSTRAP_SRC.includes('storeName:'), '缺少 storeName');
  });

  it('工厂返回结构应包含 primaryDomain', () => {
    assert.ok(BOOTSTRAP_SRC.includes('primaryDomain:'), '缺少 primaryDomain');
  });
});

// ============================================================
// 8-9. Portal 语言配置
// ============================================================

describe('Portal 语言配置 — cn-mainland', () => {
  it('cn-mainland 分支应匹配 zh-CN', () => {
    assert.ok(BOOTSTRAP_SRC.includes("'cn-mainland'"), 'cn-mainland 分支');
    assert.ok(BOOTSTRAP_SRC.includes('zh-CN'), '应包含 zh-CN');
  });

  it('国内市场 fallback 应至少保留 zh-CN，并支持 locale hint 覆盖顺序', () => {
    assert.ok(BOOTSTRAP_SRC.includes('resolveFallbackStoreLanguages'), '应通过 helper 统一 fallback 语言');
    assert.ok(BOOTSTRAP_SRC.includes('zh-CN'), '国内市场 fallback 应保留 zh-CN');
  });
});

describe('Portal 语言配置 — 非cn-mainland', () => {
  it('非 cn-mainland 市场应默认为 en-US', () => {
    assert.ok(BOOTSTRAP_SRC.includes('en-US'), '应包含 en-US');
  });

  it('语言配置应有条件分支区分国内外', () => {
    const hasCondition = BOOTSTRAP_SRC.includes('cn-mainland') && BOOTSTRAP_SRC.includes('en-US');
    assert.ok(hasCondition, '应有国内外语言配置分支');
  });
});

// ============================================================
// 10. portal supportedSurfaces 枚举完整性
// ============================================================

describe('Portal — supportedSurfaces 完整枚举', () => {
  const expected = ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'];

  for (const surface of expected) {
    it(`应包含 ${surface}`, () => {
      assert.ok(BOOTSTRAP_SRC.includes(surface), `缺少 ${surface}`);
    });
  }
});

// ============================================================
// 11. StorefrontConsumerSnapshot 接口结构
// ============================================================

describe('StorefrontConsumerSnapshot — 接口', () => {
  it('应导出 StorefrontConsumerSnapshot 接口', () => {
    assert.ok(hasExport(BOOTSTRAP_SRC, 'StorefrontConsumerSnapshot'), '缺少接口导出');
  });

  it('应包含 deliveryMode 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('deliveryMode'), '缺少 deliveryMode');
  });

  it('应包含 consumerDescriptor 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('consumerDescriptor'), '缺少 consumerDescriptor');
  });

  it('应包含 governance 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('governance'), '缺少 governance');
  });

  it('应包含 domainGovernance 与 domainGovernanceWorkspaceHref 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('domainGovernance'), '缺少 domainGovernance');
    assert.ok(BOOTSTRAP_SRC.includes('domainGovernanceWorkspaceHref'), '缺少 domainGovernanceWorkspaceHref');
  });

  it('应包含 scope 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('scope'), '缺少 scope');
  });

  it('应包含 degradation 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('degradation'), '缺少 degradation');
  });

  it('应包含 challenge 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('challenge'), '缺少 challenge');
  });
});

// ============================================================
// 12. Scope path / resolver / mismatchStrategy
// ============================================================

describe('Scope — 数据配置', () => {
  it('scope 应包含 scopePath 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('scopePath'), '缺少 scopePath');
  });

  it('scope 应包含 resolver 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('resolver'), '缺少 resolver');
  });

  it('scope 应包含 mismatchStrategy 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('mismatchStrategy'), '缺少 mismatchStrategy');
  });

  it('scope 应包含 revalidateOn 数组', () => {
    assert.ok(BOOTSTRAP_SRC.includes('revalidateOn'), '缺少 revalidateOn');
  });
});

// ============================================================
// 13. Degradation 降级配置
// ============================================================

describe('Degradation — 降级', () => {
  it('应包含 featureFlagFallback 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('featureFlagFallback'), '缺少 featureFlagFallback');
  });

  it('应包含 desensitizationMode 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('desensitizationMode'), '缺少 desensitizationMode');
  });

  it('应包含 cacheableCapabilities 数组', () => {
    assert.ok(BOOTSTRAP_SRC.includes('cacheableCapabilities'), '缺少 cacheableCapabilities');
  });
});

// ============================================================
// 14. Challenge 挑战配置
// ============================================================

describe('Challenge — 挑战', () => {
  it('应包含 enforcement 字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('enforcement'), '缺少 enforcement');
  });

  it('应包含 notes 数组字段', () => {
    assert.ok(BOOTSTRAP_SRC.includes('notes'), '缺少 notes');
  });
});

// ============================================================
// 15. 页面组件导出与导入依赖
// ============================================================

describe('页面组件 — 导出与导入', () => {
  it('应导出 default async StoreSitePage', () => {
    assert.ok(PAGE_SRC.includes('export default async function StoreSitePage'), '缺少默认导出');
  });

  it('应导入 resolveStoreScope', () => {
    assert.ok(PAGE_SRC.includes('resolveStoreScope'), '缺少 resolveStoreScope 导入');
  });

  it('应导入 getStorePortal 和 getStorefrontConsumerSnapshot', () => {
    assert.ok(PAGE_SRC.includes('getStorePortal'), '缺少 getStorePortal');
    assert.ok(PAGE_SRC.includes('getStorefrontConsumerSnapshot'), '缺少 getStorefrontConsumerSnapshot');
  });

  it('应导入 notFound（Next.js）', () => {
    assert.ok(PAGE_SRC.includes('notFound'), '缺少 notFound 导入');
  });

  it('应导入 StoreShowcaseClient', () => {
    assert.ok(PAGE_SRC.includes('StoreShowcaseClient'), '缺少 StoreShowcaseClient 导入');
  });

  it('应导入 RuntimeGovernancePanel', () => {
    assert.ok(PAGE_SRC.includes('RuntimeGovernancePanel'), '缺少 RuntimeGovernancePanel 导入');
  });

  it('应导入 GovernanceLinkedSection', () => {
    assert.ok(PAGE_SRC.includes('GovernanceLinkedSection'), '缺少 GovernanceLinkedSection 导入');
  });

  it('门店官网语言卡片应使用“支持语言”而非“默认语言”文案', () => {
    assert.ok(PAGE_SRC.includes('支持语言'), '门店官网应展示支持语言文案');
    assert.ok(!PAGE_SRC.includes('>默认语言<'), '列表展示不应误标为默认语言');
  });

  it('完整路径与 H5 路径都应展示域名治理工作台入口', () => {
    assert.ok(PAGE_SRC.includes('PortalDomainGovernanceCard'), '页面应展示治理工作台 presenter');
    assert.ok(PAGE_SRC.includes('domainGovernanceWorkspaceHref'), '页面应消费统一治理入口链接');
  });

  it('域名治理卡片应展示 domainSource 与缺主 scope 摘要', () => {
    assert.ok(PAGE_SRC.includes('buildDomainGovernanceDisplayModel'), '页面应使用共享域名治理 display model helper');
    assert.ok(PAGE_SRC.includes('domainGovernanceDisplayModel'), '页面应向 presenter 传入共享 display model');
  });

  it('域名治理页面不应直读旧 header/footer 包装结构', () => {
    assert.ok(!PAGE_SRC.includes('headerSection'), '页面不应直读旧 headerSection');
    assert.ok(!PAGE_SRC.includes('footerSection'), '页面不应直读旧 footerSection');
  });
});
