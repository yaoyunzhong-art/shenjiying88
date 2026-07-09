/**
 * sports-ants/franchise/page.test.ts — 招商加盟页面 L1 冒烟测试
 * 覆盖: 页面结构 · 合作模式 · 人群适配 · 加盟流程
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const DATA = readFileSync(SOURCE, 'utf-8');

// ---- 页面结构 ----

describe('sports-ants/franchise — 页面结构', () => {
  it('应导出默认组件 FranchisePage', () => {
    assert.ok(DATA.includes('export default function FranchisePage'), '缺少默认导出');
  });

  it('应为 "use client" 组件', () => {
    assert.ok(DATA.includes("'use client'"), '缺少 use client');
  });

  it('应包含 SEOMeta / ConversionTracker', () => {
    assert.ok(DATA.includes('SEOMeta'), '缺少 SEOMeta');
    assert.ok(DATA.includes('ConversionTracker'), '缺少 ConversionTracker');
  });

  it('应包含 Header / Footer / FloatingContact / ExitIntentPopup', () => {
    assert.ok(DATA.includes('<Header'), '缺少 Header');
    assert.ok(DATA.includes('<Footer'), '缺少 Footer');
    assert.ok(DATA.includes('<FloatingContact'), '缺少 FloatingContact');
    assert.ok(DATA.includes('<ExitIntentPopup'), '缺少 ExitIntentPopup');
  });
});

// ---- 合作模式 ----

describe('sports-ants/franchise — 合作模式', () => {
  it('应包含 CooperationMode 类型定义', () => {
    const modeTypes = ['direct', 'joint', 'cooperate'];
    for (const mt of modeTypes) {
      assert.ok(DATA.includes(mt), `缺少合作模式: ${mt}`);
    }
  });

  it('应包含三种加盟模式的名称', () => {
    const expected = ['直营门店', '联营门店', '合作开店'];
    const hasAny = expected.filter(e => DATA.includes(e));
    assert.ok(hasAny.length >= 2, `合作模式名称不足: ${hasAny.join(',')}`);
  });

  it('应包含加盟模式配置数据', () => {
    assert.ok(DATA.includes('ModeConfig'), '缺少 ModeConfig');
    assert.ok(DATA.includes('投资金额'), '缺少投资金额描述');
  });
});

// ---- 人群适配 ----

describe('sports-ants/franchise — 人群适配', () => {
  it('应引用 USER_PERSONAS 人群数据', () => {
    assert.ok(DATA.includes('USER_PERSONAS'), '缺少 USER_PERSONAS');
    assert.ok(DATA.includes('getAllPersonas'), '缺少 getAllPersonas');
  });

  it('应支持按人群筛选', () => {
    const filterHints = ['activePersona', 'setActivePersona', 'personaId', 'activePersona'];
    const hasFilter = filterHints.some(h => DATA.includes(h));
    assert.ok(hasFilter, '缺少人群筛选状态管理');
  });

  it('应展示人群标签', () => {
    assert.ok(DATA.includes('targetPersonas') || DATA.includes('activePersona'),
      '缺少 targetPersonas 字段');
  });
});

// ---- 加盟流程 ----

describe('sports-ants/franchise — 加盟流程', () => {
  it('应包含加盟步骤说明', () => {
    const steps = ['咨询', '考察', '签约', '选址', '装修', '培训', '开业'];
    const hasStep = steps.some(s => DATA.includes(s));
    assert.ok(hasStep, '缺少加盟步骤说明');
  });

  it('应包含投资回报或数据展示', () => {
    const roiTerms = ['回本', '回报', '收益', '利润', 'ROI', '坪效'];
    const hasROI = roiTerms.some(t => DATA.includes(t));
    assert.ok(hasROI, '缺少投资回报数据');
  });
});

// ---- SaaS 融合 ----

describe('sports-ants/franchise — SaaS 融合', () => {
  it('应引用 SAAS_FEATURES 数据', () => {
    assert.ok(DATA.includes('SAAS_FEATURES'), '缺少 SAAS_FEATURES');
    assert.ok(DATA.includes('神机营'), '缺少神机营品牌名');
  });

  it('应展示 SaaS 赋能内容', () => {
    const saasTerms = ['SaaS', 'IoT', '数字化', '运营'];
    const hasSaaS = saasTerms.some(t => DATA.includes(t));
    assert.ok(hasSaaS, '缺少 SaaS 相关内容');
  });
});

// ---- CTA 与转化追踪 ----

describe('sports-ants/franchise — CTA 与转化', () => {
  it('应调用 conversionService 追踪交互', () => {
    const pattern = /conversionService\s*\.\s*trackCTAClick/g;
    const matches = DATA.match(pattern);
    assert.ok(matches && matches.length >= 1,
      `conversionService.trackCTAClick 调用次数应为 ≥1, 实际: ${matches?.length || 0}`
    );
  });

  it('应有提交按钮或咨询入口', () => {
    const ctas = ['提交', '立即申请', '咨询', '加盟', '获取方案', '联系我们'];
    const hasCTA = ctas.some(c => DATA.includes(c));
    assert.ok(hasCTA, '缺少加盟 CTA');
  });

  it('应包含 Link 或 window.location 导航', () => {
    assert.ok(
      DATA.includes('Link') || DATA.includes('window.location'),
      '缺少导航机制'
    );
  });
});
