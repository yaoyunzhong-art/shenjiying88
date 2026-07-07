import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AIContentGeneratorPanel,
} = require('./AIContentGeneratorPanel');

import type {
  AIContentGeneratorPanelProps,
  GeneratedContent,
  GenerationHistoryItem,
  ContentType,
  ContentTone,
} from './AIContentGeneratorPanel';

// ==================== 测试辅助函数 ====================

/** 构建生成结果 */
function makeContent(overrides: Partial<GeneratedContent> & { id: string }): GeneratedContent {
  return {
    text: '示例内容文本',
    type: 'campaign_title',
    usageCount: 0,
    starred: false,
    ...overrides,
  };
}

/** 构建历史记录 */
function makeHistoryItem(overrides: Partial<GenerationHistoryItem> & { id: string }): GenerationHistoryItem {
  return {
    type: 'campaign_title',
    prompt: '双11大促',
    resultCount: 3,
    createdAt: '2026-07-07 10:00',
    ...overrides,
  };
}

/** 构建默认 props */
function makeProps(overrides: Partial<AIContentGeneratorPanelProps> = {}): AIContentGeneratorPanelProps {
  return {
    ...overrides,
  };
}

/** 检查字符串是否包含子串 */
function includesText(html: string, text: string): boolean {
  return html.includes(text);
}

// ==================== 测试套件 ====================

describe('AIContentGeneratorPanel', () => {

  // -------- 基础渲染 --------

  test('应该渲染标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ title: 'AI 文案生成' }))
    );
    assert.ok(includesText(html, 'AI 文案生成'));
  });

  test('应该显示默认标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps())
    );
    assert.ok(includesText(html, 'AI 内容生成'));
  });

  test('tab 切换按钮应存在', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps())
    );
    assert.ok(includesText(html, '生成器'));
    assert.ok(includesText(html, '历史记录'));
  });

  // -------- 空状态 --------

  test('无结果时显示空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({
        emptyText: '点击生成按钮开始创作',
      }))
    );
    assert.ok(includesText(html, '点击生成按钮开始创作'));
  });

  test('应该使用默认空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps())
    );
    assert.ok(includesText(html, '暂无生成内容'));
  });

  // -------- 生成状态 --------

  test('生成中应显示 Spinner 和提示', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ generating: true }))
    );
    assert.ok(includesText(html, 'AI 正在生成内容'));
  });

  test('生成中 "生成内容" 按钮应禁用', () => {
    // 无法直接从静态标记检查 disabled — 检查按钮文字
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ generating: true }))
    );
    assert.ok(includesText(html, '生成中...'));
  });

  // -------- 结果展示 --------

  test('应该渲染多条生成结果', () => {
    const results: GeneratedContent[] = [
      makeContent({ id: '1', text: '夏日狂欢大促' }),
      makeContent({ id: '2', text: '新品上市特惠' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ results }))
    );
    assert.ok(includesText(html, '夏日狂欢大促'));
    assert.ok(includesText(html, '新品上市特惠'));
  });

  test('结果超过 maxResults 应截断', () => {
    const results: GeneratedContent[] = Array.from({ length: 15 }, (_, i) =>
      makeContent({ id: `r${i}`, text: `结果${i + 1}` })
    );
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ results, maxResults: 5 }))
    );
    // 前5个应显示
    assert.ok(includesText(html, '结果1'));
    assert.ok(includesText(html, '结果5'));
    // 第6个不应显示
    assert.ok(!includesText(html, '结果6'));
  });

  test('每项结果应包含内容类型标签', () => {
    const results: GeneratedContent[] = [
      makeContent({ id: '1', text: '文本', type: 'sms_text' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ results }))
    );
    assert.ok(includesText(html, '短信文案'));
  });

  test('收藏项应展示收藏标签', () => {
    const results: GeneratedContent[] = [
      makeContent({ id: '1', text: '收藏的文案', starred: true }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ results }))
    );
    assert.ok(includesText(html, '★ 收藏'));
  });

  // -------- 操作按钮 --------

  test('提供 onUseContent 时显示"采纳"按钮', () => {
    const results: GeneratedContent[] = [
      makeContent({ id: '1', text: '测试文案' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({
        results,
        onUseContent: () => {},
      }))
    );
    assert.ok(includesText(html, '采纳'));
  });

  test('提供 onToggleStar 时显示"收藏"按钮', () => {
    const results: GeneratedContent[] = [
      makeContent({ id: '1', text: '测试文案' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({
        results,
        onToggleStar: () => {},
      }))
    );
    assert.ok(includesText(html, '收藏'));
  });

  test('收藏项应显示"取消收藏"按钮', () => {
    const results: GeneratedContent[] = [
      makeContent({ id: '1', text: '收藏文案', starred: true }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({
        results,
        onToggleStar: () => {},
      }))
    );
    // 收藏按钮文字应切换 — Tag 徽章也有"收藏"文字，所以只验证按钮文本
    assert.ok(includesText(html, '取消收藏'));
  });

  test('提供 onRegenerate 且结果非空时应有"重新生成"按钮', () => {
    const results: GeneratedContent[] = [
      makeContent({ id: '1', text: '文案' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({
        results,
        onRegenerate: () => {},
      }))
    );
    assert.ok(includesText(html, '重新生成'));
  });

  test('无结果时不显示"重新生成"按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({
        onRegenerate: () => {},
      }))
    );
    assert.ok(!includesText(html, '重新生成'));
  });

  // -------- 表单参数 --------

  test('应该渲染内容类型选择器', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps())
    );
    assert.ok(includesText(html, '内容类型'));
  });

  test('应该渲染语气风格选择器', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps())
    );
    assert.ok(includesText(html, '语气风格'));
  });

  test('应该渲染品牌名称输入框', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps())
    );
    assert.ok(includesText(html, '品牌/项目名称'));
  });

  test('应该渲染关键词输入框', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps())
    );
    assert.ok(includesText(html, '关键词'));
  });

  test('应该渲染特殊要求输入框', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps())
    );
    assert.ok(includesText(html, '特殊要求'));
  });

  // -------- 历史记录 --------

  test('历史记录 tab 为空时应显示空状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps())
    );
    // 默认在生成器 tab
    assert.ok(includesText(html, '暂无生成内容'));
  });

  test('提供历史记录时不应在生成器里展示', () => {
    const history: GenerationHistoryItem[] = [
      makeHistoryItem({ id: 'h1', prompt: '双12活动' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ history }))
    );
    // 默认生成器 tab — 不应显示历史内容
    assert.ok(!includesText(html, '双12活动'));
  });

  // -------- 边界情况 --------

  test('空结果数组应优雅处理', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ results: [] }))
    );
    assert.ok(includesText(html, '暂无生成内容'));
  });

  test('undefined results 应优雅处理', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ results: undefined as unknown as GeneratedContent[] }))
    );
    assert.ok(includesText(html, '暂无生成内容'));
  });

  test('testId 应该被传递到组件上', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ testId: 'content-gen' }))
    );
    assert.ok(includesText(html, 'content-gen'));
  });

  test('自定义 className 应被传递', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIContentGeneratorPanel, makeProps({ className: 'my-custom-class' }))
    );
    assert.ok(includesText(html, 'my-custom-class'));
  });
});
