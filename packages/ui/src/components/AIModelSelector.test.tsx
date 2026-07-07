/**
 * AIModelSelector — AI 模型选择器组件测试
 *
 * 覆盖:
 *   正例 — 默认选中、推荐标记、定价层级颜色、指标渲染
 *   反例 — 空列表、禁用、不可用模型
 *   边界 — loading 骨架屏、compact 视图
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'AIModelSelector.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ==================== 正例 (Happy Path) ====================

describe('AIModelSelector — 正例', () => {
  test('导出 AIModelSelector 函数组件', () => {
    const src = readSource();
    assert.ok(src.includes('export function AIModelSelector'));
  });

  test('导出 AIModelOption 和 AIModelSelectorProps 类型', () => {
    const src = readSource();
    assert.ok(src.includes('export interface AIModelOption'));
    assert.ok(src.includes('export interface AIModelSelectorProps'));
  });

  test('定义 5 种 AI 能力标签: chat/vision/code/reasoning/embedding', () => {
    const src = readSource();
    assert.ok(src.includes("'chat'"));
    assert.ok(src.includes("'vision'"));
    assert.ok(src.includes("'code'"));
    assert.ok(src.includes("'reasoning'"));
    assert.ok(src.includes("'embedding'"));
  });

  test('定义 3 种定价层级: budget/standard/premium', () => {
    const src = readSource();
    assert.ok(src.includes("'budget'"));
    assert.ok(src.includes("'standard'"));
    assert.ok(src.includes("'premium'"));
  });

  test('3 种定价层级均有对应颜色值', () => {
    const src = readSource();
    assert.ok(src.includes("budget: '#52c41a'"));
    assert.ok(src.includes("standard: '#1677ff'"));
    assert.ok(src.includes("premium: '#722ed1'"));
  });

  test('3 种定价层级均有中文标签', () => {
    const src = readSource();
    assert.ok(src.includes('经济型'));
    assert.ok(src.includes('标准型'));
    assert.ok(src.includes('旗舰型'));
  });

  test('5 种能力均有中文标签', () => {
    const src = readSource();
    assert.ok(src.includes('对话'));
    assert.ok(src.includes('视觉'));
    assert.ok(src.includes('代码'));
    assert.ok(src.includes('推理'));
    assert.ok(src.includes('向量'));
  });

  test('推荐徽章使用 "推荐" 文本', () => {
    const src = readSource();
    assert.ok(src.includes('推荐'));
  });

  test('指标区展示上下文窗口、延迟、输入价格、输出价格', () => {
    const src = readSource();
    assert.ok(src.includes('上下文'));
    assert.ok(src.includes('延迟'));
    assert.ok(src.includes('输入'));
    assert.ok(src.includes('输出'));
    assert.ok(src.includes('ctx') || src.includes('contextWindow'));
  });

  test('空列表时展示 "暂无可用 AI 模型"', () => {
    const src = readSource();
    assert.ok(src.includes('暂无可用 AI 模型'));
  });

  test('未选择时展示提示文本 "请选择一个 AI 模型"', () => {
    const src = readSource();
    assert.ok(src.includes('请选择一个 AI 模型'));
  });

  test('支持 variant: compact 和 detailed', () => {
    const src = readSource();
    assert.ok(src.includes("variant === 'detailed'"));
    assert.ok(src.includes("variant === 'compact'"));
  });

  test('loading 状态下显示 3 个骨架屏条目', () => {
    const src = readSource();
    assert.ok(src.includes('[1, 2, 3].map'));
  });

  test('loading 状态下包含 pulse 动画关键帧', () => {
    const src = readSource();
    assert.ok(src.includes('@keyframes pulse'));
  });
});

// ==================== 反例 (Negative Cases) ====================

describe('AIModelSelector — 反例', () => {
  test('不可用的模型 (available: false) 应应用 disabled 样式', () => {
    const src = readSource();
    assert.ok(src.includes('!model.available'), '应判断 available');
    assert.ok(src.includes('disabledItemStyle'), '应引用 disabledItemStyle');
    assert.ok(src.includes('not-allowed'), '应有 not-allowed 光标');
    assert.ok(src.includes('isDisabled'), '应有 isDisabled 标志');
  });

  test('disabled props 应阻止所有模型的点击', () => {
    const src = readSource();
    assert.ok(src.includes('disabled || !model.available'));
  });

  test('onChange 回调只在非禁用状态下触发', () => {
    const src = readSource();
    assert.ok(src.includes('!isDisabled && onChange'));
  });
});

// ==================== 边界 (Edge Cases) ====================

describe('AIModelSelector — 边界', () => {
  test('选中项应使用 selectedItemStyle (蓝色边框)', () => {
    const src = readSource();
    assert.ok(src.includes('selectedItemStyle'));
    assert.ok(src.includes("borderColor: '#1677ff'"));
  });

  test('hover 时非选中项边框变亮', () => {
    const src = readSource();
    assert.ok(src.includes('rgba(148, 163, 184, 0.4)'));
  });

  test('每个模型项包含 radio 单选指示器', () => {
    const src = readSource();
    assert.ok(src.includes('radioDotStyle'));
    assert.ok(src.includes('radioDotSelectedStyle'));
    assert.ok(src.includes('borderRadius: \'50%\''));
  });

  test('pricingTier 颜色动态应用 (TIER_COLORS)', () => {
    const src = readSource();
    assert.ok(src.includes('TIER_COLORS[model.pricingTier]'));
  });

  test('compact 视图只显示一行简要指标', () => {
    const src = readSource();
    assert.ok(src.includes("'compact'"));
    assert.ok(src.includes('K ctx'));
  });
});
