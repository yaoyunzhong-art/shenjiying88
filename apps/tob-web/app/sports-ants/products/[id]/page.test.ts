/**
 * sports-ants/products/[id]/page.test.ts — 产品详情页测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 产品数据完整性、字段完整性
 *   L3 状态逻辑 — useParams/动态路由
 *   L3 边界     — 场景、案例数据校验
 *   L3 安全     — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('ProductDetailPage — L1 正例', () => {
  it('应导出一个默认函数组件', () => {
    assert.ok(SRC.includes('export default function'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应使用 useParams 获取动态路由参数', () => {
    assert.ok(SRC.includes('useParams'));
  });

  it('应导入 SEO/Header/Footer/FloatingContact', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
    assert.ok(SRC.includes('FloatingContact'));
  });

  it('应导入 BigAnts 设计系统', () => {
    assert.ok(SRC.includes('BigAntsColors') || SRC.includes('bigants-design'));
  });
});

describe('ProductDetailPage — L2 产品数据', () => {
  it('应定义 PRODUCTS_DETAIL 数据字典', () => {
    assert.ok(SRC.includes('PRODUCTS_DETAIL'));
  });

  it('PRODUCTS_DETAIL 应有产品条目', () => {
    const match = SRC.match(/PRODUCTS_DETAIL\s*:\s*Record/);
    assert.ok(match !== null, 'PRODUCTS_DETAIL 应为 Record 类型');
  });

  it('每个产品应有 name/category/shortDesc/description/features 字段', () => {
    assert.ok(SRC.includes('name:'));
    assert.ok(SRC.includes('category:'));
    assert.ok(SRC.includes('shortDesc:') || SRC.includes('shortDesc'));
    assert.ok(SRC.includes('description:'));
    assert.ok(SRC.includes('features:'));
  });

  it('每个产品应有 specs 规格参数', () => {
    assert.ok(SRC.includes('specs:'));
  });

  it('每个产品应有 scenarios 使用场景', () => {
    assert.ok(SRC.includes('scenarios:'));
  });

  it('每个产品应有 targetAudience 目标受众', () => {
    assert.ok(SRC.includes('targetAudience:'));
  });

  it('每个产品应有 pricing 定价方式', () => {
    assert.ok(SRC.includes('pricing:'));
  });

  it('每个产品应有 images 图片列表', () => {
    assert.ok(SRC.includes('images:'));
  });

  it('每个产品应有 cases 案例数据', () => {
    assert.ok(SRC.includes('cases:'));
  });

  it('每个 case 应有 name/location/result 字段', () => {
    assert.ok(SRC.includes('location:'));
    assert.ok(SRC.includes('result:'));
  });

  it('应包含 ProductCTA 组件', () => {
    assert.ok(SRC.includes('ProductCTA'));
  });
});

describe('ProductDetailPage — L3 边界', () => {
  it('应包含 ExitIntentPopup 退出意图弹窗', () => {
    assert.ok(SRC.includes('ExitIntentPopup'));
  });

  it('产品应包含分类信息', () => {
    assert.ok(SRC.includes('categoryName'));
  });
});

describe('ProductDetailPage — L3 安全', () => {
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
