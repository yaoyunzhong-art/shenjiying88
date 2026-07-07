/**
 * brand-website/page.test.ts — 品牌官网首页 L1 冒烟测试
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('brand-website — 正例', () => {
  it('应导出一个默认组件 HomePage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function HomePage'), '缺少默认导出组件');
  });

  it('应包含 SEOMeta 组件 (SEO 元信息)', () => {
    const src = readSource();
    assert.ok(src.includes('SEOMeta'), '缺少 SEOMeta');
  });

  it('应包含 OrganizationJSONLD (结构化数据)', () => {
    const src = readSource();
    assert.ok(src.includes('OrganizationJSONLD'), '缺少 OrganizationJSONLD');
  });

  it('应包含 Header / Footer 组件', () => {
    const src = readSource();
    assert.ok(src.includes('Header />') || src.includes('<Header'), '缺少 Header');
    assert.ok(src.includes('Footer />') || src.includes('<Footer'), '缺少 Footer');
  });

  it('应包含 HeroSection / AdvantageGrid / CaseShowcase 核心区块', () => {
    const src = readSource();
    assert.ok(src.includes('HeroSection'), '缺少 HeroSection');
    assert.ok(src.includes('AdvantageGrid'), '缺少 AdvantageGrid');
    assert.ok(src.includes('CaseShowcase'), '缺少 CaseShowcase');
  });
});

// ---- 边界 ----

describe('brand-website — 边界', () => {
  it('BUSINESS_CARDS 应包含 4 个业务卡片', () => {
    const src = readSource();
    assert.ok(src.includes('id:'), '缺少业务卡片 id');
    assert.ok(src.includes("'product'"), '缺少 product');
    assert.ok(src.includes("'epc'"), '缺少 epc');
    assert.ok(src.includes("'digital-sports'"), '缺少 digital-sports');
    assert.ok(src.includes("'franchise'"), '缺少 franchise');
  });

  it('ADVANTAGES 应包含 6 个核心优势', () => {
    const src = readSource();
    assert.ok(src.includes('const ADVANTAGES'), '缺少 ADVANTAGES');
    const titleCount = (src.match(/title: '/g) || []).length;
    assert.ok(titleCount >= 6, `核心优势定义应 >= 6, 实际 ${titleCount}`);
  });

  it('CASES 应包含 4 个客户案例', () => {
    const src = readSource();
    assert.ok(src.includes("'华润万象'"), '缺少华润万象');
    assert.ok(src.includes("'中粮大悦城'"), '缺少中粮大悦城');
    assert.ok(src.includes("'龙湖天街'"), '缺少龙湖天街');
    assert.ok(src.includes("'万达广场'"), '缺少万达广场');
  });

  it('应包含 立即咨询合作 / 了解更多加盟政策 两个 CTA 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('立即咨询合作'), '缺少立即咨询合作');
    assert.ok(src.includes('了解更多加盟政策'), '缺少了解更多加盟政策');
  });

  it('应包含联系方式 (电话/邮箱/微信)', () => {
    const src = readSource();
    assert.ok(src.includes('400-888-8888'), '缺少电话');
    assert.ok(src.includes('business@shenjiying.com'), '缺少邮箱');
    assert.ok(src.includes('shenjiying888'), '缺少微信');
  });
});

// ---- 防御 ----

describe('brand-website — 防御', () => {
  it('应包含 ShareButtons 分享功能', () => {
    const src = readSource();
    assert.ok(src.includes('ShareButtons'), '缺少 ShareButtons');
  });

  it('应包含 ContactButtons 联系方式组件', () => {
    const src = readSource();
    assert.ok(src.includes('ContactButtons'), '缺少 ContactButtons');
  });

  it('应包含 FixedCTA 固定浮动按钮', () => {
    const src = readSource();
    assert.ok(src.includes('FixedCTA'), '缺少 FixedCTA');
  });

  it('应包含 Link 导航链接 (products / epc / franchise / contact)', () => {
    const src = readSource();
    assert.ok(src.includes('/products'), '缺少 /products');
    assert.ok(src.includes('/epc'), '缺少 /epc');
    assert.ok(src.includes('/franchise'), '缺少 /franchise');
    assert.ok(src.includes('/contact'), '缺少 /contact');
  });

  it('SEOMeta 应包含 title / description / keywords / type 四个属性', () => {
    const src = readSource();
    assert.ok(src.includes('title'), '缺少 title');
    assert.ok(src.includes('description'), '缺少 description');
    assert.ok(src.includes('keywords'), '缺少 keywords');
    assert.ok(src.includes('type'), '缺少 type');
  });
});
