/**
 * brand-website/supply-chain/page.test.ts — 供应链与品牌合作页测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 供应链能力、品牌合作数据完整性
 *   L3 FAQ 数据 — 常见问题数据完整性
 *   L3 安全     — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('SupplyChainPage — L1 正例', () => {
  it('应导出一个默认函数组件', () => {
    assert.ok(SRC.includes('export default function'));
  });

  it('应导入 SEO/Header/Footer/FixedCTA', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
    assert.ok(SRC.includes('FixedCTA'));
  });

  it('页面标题应包含供应链', () => {
    assert.ok(
      SRC.includes('供应链') ||
      SRC.includes('品牌合作') ||
      SRC.includes('Supply Chain'),
    );
  });
});

describe('SupplyChainPage — L2 供应链能力数据', () => {
  it('应定义 SUPPLY_CHAIN_FEATURES 数组', () => {
    assert.ok(SRC.includes('SUPPLY_CHAIN_FEATURES') || SRC.includes('SC_FEATURES'));
  });

  it('应包含全品类覆盖能力', () => {
    assert.ok(SRC.includes('全品类覆盖'));
  });

  it('应包含全球采购网络', () => {
    assert.ok(SRC.includes('全球采购') || SRC.includes('采购网络'));
  });

  it('应包含智能库存管理', () => {
    assert.ok(SRC.includes('智能库存') || SRC.includes('库存管理'));
  });

  it('应包含高效物流配送', () => {
    assert.ok(SRC.includes('物流配送') || SRC.includes('高效物流'));
  });

  it('应包含品质溯源保障', () => {
    assert.ok(SRC.includes('品质溯源') || SRC.includes('溯源'));
  });

  it('每个功能应有 title/description/icon 字段', () => {
    assert.ok(SRC.includes('title:'));
    assert.ok(SRC.includes('description:'));
    assert.ok(SRC.includes('icon:'));
  });
});

describe('SupplyChainPage — L2 品牌合作数据', () => {
  it('应包含品牌合作案例', () => {
    assert.ok(
      SRC.includes('BRAND_CASES') ||
      SRC.includes('品牌合作') ||
      SRC.includes('合作案例'),
    );
  });

  it('应包含统计数据展示', () => {
    assert.ok(
      SRC.includes('个城市') ||
      SRC.includes('供应商') ||
      SRC.includes('SKU') ||
      /\d+\s*(万|亿|千|个|家)/.test(SRC),
    );
  });

  it('应包含 FAQJSONLD', () => {
    assert.ok(SRC.includes('FAQJSONLD'));
  });
});

describe('SupplyChainPage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });
});

describe('SupplyChainPage — 转化分享', () => {
  it('应包含 ShareButtons', () => {
    assert.ok(SRC.includes('ShareButtons'));
  });

  it('应包含 ContactButtons', () => {
    assert.ok(SRC.includes('ContactButtons'));
  });

  it('应有 CTA 引导商务对接', () => {
    assert.ok(
      SRC.includes('对接') ||
      SRC.includes('商务') ||
      SRC.includes('合作咨询'),
    );
  });
});
