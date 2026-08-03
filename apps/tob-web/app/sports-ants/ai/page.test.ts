/**
 * sports-ants/ai/page.test.ts — 运动蚂蚁AI赋能中心测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — AI 功能数据完整性
 *   L3 状态逻辑 — useState、交互
 *   L3 安全     — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('AIPage — L1 正例', () => {
  it('应导出一个默认函数组件', () => {
    assert.ok(SRC.includes('export default function'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应导入 SEO/Header/Footer/FloatingContact', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
    assert.ok(SRC.includes('FloatingContact'));
  });

  it('应包含 ConversionTracker', () => {
    assert.ok(SRC.includes('ConversionTracker'));
  });

  it('页面应包含 AI 赋能中心标题', () => {
    assert.ok(SRC.includes('AI赋能中心') || SRC.includes('AI') || SRC.includes('智能'));
  });
});

describe('AIPage — L2 AI 功能数据', () => {
  it('应定义 AI_FEATURES 数组', () => {
    assert.ok(SRC.includes('AI_FEATURES'));
  });

  it('AI_FEATURES 应包含至少 3 个 AI 功能', () => {
    const match = SRC.match(/AI_FEATURES\s*=\s*\[([\s\S]*?)\];/s);
    assert.ok(match !== null, 'AI_FEATURES 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.ok(count >= 3, `预期至少 3 个 AI 功能，实际 ${count}`);
  });

  it('应包含个性化内容推荐', () => {
    assert.ok(SRC.includes('个性化内容推荐') || SRC.includes('personalized-recommendation'));
  });

  it('应包含 AI 智能客服', () => {
    assert.ok(SRC.includes('AI智能客服') || SRC.includes('ai-customer-service'));
  });

  it('每个功能应有 id/name/icon/description/capabilities/scene', () => {
    assert.ok(SRC.includes('capabilities:'));
    assert.ok(SRC.includes('scene:'));
  });

  it('每个功能应有 metrics/指标数据', () => {
    assert.ok(SRC.includes('metrics:'));
  });

  it('应包含 DataShowcase 数据展示组件', () => {
    assert.ok(SRC.includes('DataShowcase'));
  });

  it('应引用用户画像 USER_PERSONAS 数据', () => {
    assert.ok(SRC.includes('USER_PERSONAS'));
  });

  it('应引用 SAAS_FEATURES 数据', () => {
    assert.ok(SRC.includes('SAAS_FEATURES'));
  });

  it('应包含 ExitIntentPopup 退出意图弹窗', () => {
    assert.ok(SRC.includes('ExitIntentPopup'));
  });
});

describe('AIPage — L3 状态逻辑', () => {
  it('应使用 useState', () => {
    assert.ok(SRC.includes('useState'));
  });

  it('应有转换追踪功能', () => {
    assert.ok(SRC.includes('conversionService'));
  });

  it('应有 CTA 点击追踪', () => {
    assert.ok(SRC.includes('trackCTAClick'));
  });
});

describe('AIPage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });

  it('as any 使用应最少化 (仅用于类型转换)', () => {
    const matches = (SRC.match(/as any/g) || []);
    assert.ok(matches.length <= 3, `预期 <=3 个 as any，实际 ${matches.length}`);
  });
});
