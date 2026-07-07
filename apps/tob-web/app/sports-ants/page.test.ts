/**
 * sports-ants/page.test.ts — 运动蚂蚁品牌官网首页 L1 冒烟测试
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

describe('sports-ants — 正例', () => {
  it('应导出一个默认组件 SportsAntsHomePage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function SportsAntsHomePage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 SEOMeta 组件', () => {
    const src = readSource();
    assert.ok(src.includes('SEOMeta'), '缺少 SEOMeta');
  });

  it('应包含 Header / Footer / FloatingContact 组件', () => {
    const src = readSource();
    assert.ok(src.includes('Header />') || src.includes('<Header'), '缺少 Header');
    assert.ok(src.includes('Footer />') || src.includes('<Footer'), '缺少 Footer');
    assert.ok(src.includes('FloatingContact'), '缺少 FloatingContact');
  });

  it('应包含 ConversionTracker 转化跟踪', () => {
    const src = readSource();
    assert.ok(src.includes('ConversionTracker'), '缺少 ConversionTracker');
  });
});

// ---- 边界 ----

describe('sports-ants — 边界', () => {
  it('CORE_BUSINESSES 应包含 4 大核心业务', () => {
    const src = readSource();
    assert.ok(src.includes("'products'"), '缺少 products 业务');
    assert.ok(src.includes("'epc'"), '缺少 epc 业务');
    assert.ok(src.includes("'franchise'"), '缺少 franchise 业务');
    assert.ok(src.includes("'tender'"), '缺少 tender 业务');
  });

  it('CORE_STATS 应包含 4 个核心数据 (500+/2000+/60+/18)', () => {
    const src = readSource();
    assert.ok(src.includes("'500+'"), '缺少 500+');
    assert.ok(src.includes("'2000+'"), '缺少 2000+');
    assert.ok(src.includes("'60+'"), '缺少 60+');
    assert.ok(src.includes("'18'"), '缺少 18个月');
  });

  it('八类人群定位 (personas) 应包含 getAllPersonas 调用', () => {
    const src = readSource();
    assert.ok(src.includes('getAllPersonas'), '缺少 getAllPersonas');
    assert.ok(src.includes('UserPersonaId'), '缺少 UserPersonaId');
  });

  it('应包含 SANDERS_STEPS 三步法 (痛点共情/价值锚定/自主决策)', () => {
    const src = readSource();
    assert.ok(src.includes('SANDERS_STEPS'), '缺少 SANDERS_STEPS');
    assert.ok(src.includes('pain-point'), '缺少 痛点共情');
    assert.ok(src.includes('value-anchor'), '缺少 价值锚定');
    assert.ok(src.includes('decision'), '缺少 自主决策');
  });

  it('BRAND_ADVANTAGES 应包含 4 个品牌优势', () => {
    const src = readSource();
    const advantages = ['源头厂商', '全程护航', '数据赋能', '终身服务'];
    advantages.forEach((a) => {
      assert.ok(src.includes(a), `缺少品牌优势: ${a}`);
    });
  });
});

// ---- 防御 ----

describe('sports-ants — 防御', () => {
  it('应包含 ExitIntentPopup 退出意图弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('ExitIntentPopup'), '缺少 ExitIntentPopup');
  });

  it('应包含 PersonalizedRecommendations 个性化推荐', () => {
    const src = readSource();
    assert.ok(src.includes('PersonalizedRecommendations'), '缺少 PersonalizedRecommendations');
  });

  it('应包含 conversionService CTA 点击追踪', () => {
    const src = readSource();
    assert.ok(src.includes('conversionService.trackCTAClick'), '缺少 CTA 追踪');
    assert.ok(src.includes('conversionService.trackUserPersona'), '缺少用户画像追踪');
  });

  it('应包含 BRAND_PARTNERS 8 个品牌合作伙伴', () => {
    const src = readSource();
    ['万达集团', '华润万象城', '龙湖天街', '大悦城', '永旺梦乐城'].forEach((p) => {
      assert.ok(src.includes(p), `缺少合作伙伴: ${p}`);
    });
  });

  it('TESTIMONIALS 应包含 3 个用户评价', () => {
    const src = readSource();
    assert.ok(src.includes('TESTIMONIALS'), '缺少 TESTIMONIALS');
    assert.ok(src.includes("'张总'"), '缺少张总');
    assert.ok(src.includes("'李总'"), '缺少李总');
    assert.ok(src.includes("'王总'"), '缺少王总');
  });
});
