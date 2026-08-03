/**
 * brand-website/products/page.test.ts — 产品销售页测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 产品品类、合作政策数据完整性
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

describe('ProductsPage — L1 正例', () => {
  it('应导出一个默认函数组件 ProductsPage', () => {
    assert.ok(SRC.includes('export default function ProductsPage'));
  });

  it('应导入 SEO/Header/Footer 组件', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
  });

  it('应导入 FixedCTA', () => {
    assert.ok(SRC.includes('FixedCTA'));
  });

  it('页面标题应为"产品销售"', () => {
    assert.ok(SRC.includes('产品销售'));
  });

  it('应包含 CTA 按钮文案"获取产品报价"', () => {
    assert.ok(SRC.includes('获取产品报价'));
  });
});

describe('ProductsPage — L2 产品品类数据', () => {
  it('应定义 PRODUCT_CATEGORIES 数组', () => {
    assert.ok(SRC.includes('PRODUCT_CATEGORIES'));
  });

  it('PRODUCT_CATEGORIES 应包含 6 个品类', () => {
    const match = SRC.match(/PRODUCT_CATEGORIES\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(match !== null, 'PRODUCT_CATEGORIES 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 6, `预期 6 个品类，实际 ${count}`);
  });

  it('应包含食品饮料品类', () => {
    assert.ok(SRC.includes("'food'") || SRC.includes('食品饮料'));
  });

  it('应包含日用百货品类', () => {
    assert.ok(SRC.includes("'daily'") || SRC.includes('日用百货'));
  });

  it('应包含美妆护肤品类', () => {
    assert.ok(SRC.includes("'beauty'") || SRC.includes('美妆护肤'));
  });

  it('应包含数码电器品类', () => {
    assert.ok(SRC.includes("'digital'") || SRC.includes('数码电器'));
  });

  it('应包含服饰箱包品类', () => {
    assert.ok(SRC.includes("'fashion'") || SRC.includes('服饰箱包'));
  });

  it('应包含运动户外品类', () => {
    assert.ok(SRC.includes("'sports'") || SRC.includes('运动户外'));
  });

  it('每个品类应包含 id/name/icon/description/products 字段', () => {
    assert.ok(SRC.includes('id:'));
    assert.ok(SRC.includes('name:'));
    assert.ok(SRC.includes('icon:'));
    assert.ok(SRC.includes('description:'));
    assert.ok(SRC.includes('products:'));
  });
});

describe('ProductsPage — L2 合作政策数据', () => {
  it('应定义 POLICIES 数组', () => {
    assert.ok(SRC.includes('POLICIES'));
  });

  it('POLICIES 应包含 6 条合作保障', () => {
    const match = SRC.match(/POLICIES\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(match !== null, 'POLICIES 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 6, `预期 6 条合作保障，实际 ${count}`);
  });

  it('应包含源头直供保障', () => {
    assert.ok(SRC.includes('源头直供'));
  });

  it('应包含品质保障', () => {
    assert.ok(SRC.includes('品质保障'));
  });

  it('应包含全品类覆盖', () => {
    assert.ok(SRC.includes('全品类覆盖'));
  });

  it('应包含配送时效保障', () => {
    assert.ok(SRC.includes('配送时效'));
  });

  it('应包含专属服务保障', () => {
    assert.ok(SRC.includes('专属服务'));
  });

  it('应包含灵活账期保障', () => {
    assert.ok(SRC.includes('灵活账期'));
  });
});

describe('ProductsPage — L3 FAQ 数据', () => {
  it('应定义 FAQ_DATA 数组', () => {
    assert.ok(SRC.includes('FAQ_DATA'));
  });

  it('FAQ_DATA 应包含 4 个问题', () => {
    const match = SRC.match(/FAQ_DATA\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(match !== null, 'FAQ_DATA 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 4, `预期 4 个 FAQ，实际 ${count}`);
  });

  it('应包含起订量问题', () => {
    assert.ok(SRC.includes('起订量是多少？'));
  });

  it('每个 FAQ 应有 question 和 answer', () => {
    assert.ok(SRC.includes('question:'));
    assert.ok(SRC.includes('answer:'));
  });
});

describe('ProductsPage — L3 安全', () => {
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

describe('ProductsPage — 共享与转化', () => {
  it('应包含 ShareButtons 分享组件', () => {
    assert.ok(SRC.includes('ShareButtons'));
  });

  it('应包含 ContactButtons 联系组件', () => {
    assert.ok(SRC.includes('ContactButtons'));
  });

  it('应有 CTA 区块引导用户操作', () => {
    assert.ok(SRC.includes('获取产品报价') || SRC.includes('对接销售团队'));
  });
});
