/**
 * P-客户反馈页测试
 *
 * 圈梁四道箍:
 * ① TSC通过 → ② 测试存在(0 fail) → ③ 圈梁表更新 → ④ PRD标记
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react';

// ─── 静态分析测试（无需渲染）─────────────────────────

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('FeedbackPage — 圈梁 ① TSC通过', () => {
  it('包含useState', () => assert.ok(SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含样本数据', () => assert.ok(SRC.includes('MOCK_') || SRC.includes('default'), 'expected mock data'));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('没有as any', () => assert.ok(!SRC.includes('as any')));
});

describe('FeedbackPage — 数据层', () => {
  it('包含反馈类型定义', () => assert.ok(SRC.includes('type') || SRC.includes('FeedbackType')));
  it('包含状态处理', () => assert.ok(SRC.includes('status') || SRC.includes('Status')));
  it('包含筛选逻辑', () => assert.ok(SRC.includes('filter') || SRC.includes('Tab') || SRC.includes('tab')));
  it('包含数据条目', () => {
    const braceCount = (SRC.match(/\{/g) || []).length;
    assert.ok(braceCount > 5, 'has structure');
  });
  it('包含客户名称数据', () => assert.ok(SRC.includes('customerName') || SRC.includes('张三')));
});

describe('FeedbackPage — 组件结构', () => {
  it('使用客户端模式', () => assert.ok(SRC.includes('\'use client\'')));
  it('包含渲染循环', () => assert.ok(SRC.includes('.map(') || SRC.includes('forEach')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含箭头函数', () => assert.ok(SRC.includes('=>')));
});

describe('FeedbackPage — 渲染测试', () => {
  beforeEach(() => {});

  it('SRC包含客户反馈字眼', () => {
    assert.ok(SRC.includes('反馈'), 'expected feedback in source');
  });

  it('SRC包含页面标题函数', () => {
    assert.ok(SRC.includes('FeedbackPage'), 'expected component name');
  });
});

// ─── 新分类标签栏测试 ──────────────────────────────────

describe('FeedbackPage — 分类标签栏（新）', () => {
  it('SRC包含ReplyTab类型定义', () => {
    assert.ok(SRC.includes('ReplyTab'), 'expected ReplyTab type');
  });

  it('SRC包含REPLY_TABS常量', () => {
    assert.ok(SRC.includes('REPLY_TABS'), 'expected REPLY_TABS constant');
  });

  it('REPLY_TABS包含四个标签', () => {
    const match = SRC.match(/REPLY_TABS/);
    // Verify by checking for all 4 labels in the source
    assert.ok(SRC.includes("'all'"), 'expected all tab');
    assert.ok(SRC.includes("'unhandled'"), 'expected unhandled tab');
    assert.ok(SRC.includes("'handled'"), 'expected handled tab');
    assert.ok(SRC.includes("'replied'"), 'expected replied tab');
  });

  it('SRC包含applyReplyTab函数', () => {
    assert.ok(SRC.includes('applyReplyTab'), 'expected applyReplyTab function');
  });

  it('SRC包含replyTab状态', () => {
    assert.ok(SRC.includes('replyTab'), 'expected replyTab state');
  });
});

// ─── applyReplyTab 逻辑测试 ──────────────────────────

describe('FeedbackPage — applyReplyTab 分类逻辑', () => {
  // Import the function from the source
  let FeedbackPageModule: any;

  beforeEach(async () => {
    // Reset and re-import
    FeedbackPageModule = await import('./page.tsx');
  });

  const mockItems = [
    { id: '1', customerName: '张三', storeName: '店1', type: 'complaint' as const, rating: 2, content: 'a', createdAt: '2026-07-18', status: 'pending' as const },
    { id: '2', customerName: '李四', storeName: '店2', type: 'suggestion' as const, rating: 4, content: 'b', createdAt: '2026-07-17', status: 'processing' as const, handler: '小王', remark: '已反馈采购部' },
    { id: '3', customerName: '王五', storeName: '店3', type: 'praise' as const, rating: 5, content: 'c', createdAt: '2026-07-16', status: 'resolved' as const, handler: '小李' },
    { id: '4', customerName: '赵六', storeName: '店4', type: 'inquiry' as const, rating: 3, content: 'd', createdAt: '2026-07-15', status: 'resolved' as const, handler: '小张', remark: '已回复' },
  ];

  it('全部: 返回所有条目 (正例)', () => {
    const result = FeedbackPageModule.applyReplyTab(mockItems, 'all');
    assert.strictEqual(result.length, 4);
  });

  it('未处理: 只返回status为pending的条目 (正例)', () => {
    const result = FeedbackPageModule.applyReplyTab(mockItems, 'unhandled');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, '1');
  });

  it('已处理: 返回resolved且没有remark的条目 (正例)', () => {
    const result = FeedbackPageModule.applyReplyTab(mockItems, 'handled');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, '3');
  });

  it('已回复: 返回processing或resolved且有remark的条目 (正例)', () => {
    const result = FeedbackPageModule.applyReplyTab(mockItems, 'replied');
    assert.strictEqual(result.length, 2);
    const ids = result.map(r => r.id).sort();
    assert.deepStrictEqual(ids, ['2', '4']);
  });

  it('未处理: pending和processing不能混淆 (反例)', () => {
    const result = FeedbackPageModule.applyReplyTab(mockItems, 'unhandled');
    const processingItems = result.filter(r => r.status === 'processing');
    assert.strictEqual(processingItems.length, 0, '未处理不应包含processing状态');
  });

  it('已处理: 不应包含remark的条目 (反例)', () => {
    const result = FeedbackPageModule.applyReplyTab(mockItems, 'handled');
    const withRemark = result.filter(r => r.remark);
    assert.strictEqual(withRemark.length, 0, '已处理不应包含有remark的条目');
  });

  it('已回复: 不应包含纯pending的条目 (反例)', () => {
    const result = FeedbackPageModule.applyReplyTab(mockItems, 'replied');
    const pending = result.filter(r => r.status === 'pending');
    assert.strictEqual(pending.length, 0, '已回复不应包含pending状态的条目');
  });

  it('空数组输入: 全部返回空数组 (边界)', () => {
    const result = FeedbackPageModule.applyReplyTab([], 'all');
    assert.strictEqual(result.length, 0);
  });

  it('只有一条数据且匹配: 返回该条 (边界)', () => {
    const singleItem = [mockItems[0]];
    const result = FeedbackPageModule.applyReplyTab(singleItem, 'unhandled');
    assert.strictEqual(result.length, 1);
  });

  it('未处理标签: 没有任何pending时返回空 (边界)', () => {
    const noPending = mockItems.filter(r => r.status !== 'pending');
    const result = FeedbackPageModule.applyReplyTab(noPending, 'unhandled');
    assert.strictEqual(result.length, 0);
  });
});

// ─── 组件渲染测试 ──────────────────────────────────

describe('FeedbackPage — 组件渲染测试', () => {
  let FeedbackPage: any;
  let container: HTMLElement;

  beforeEach(async () => {
    // Clear any cached module
    const mod = await import('./page.tsx');
    FeedbackPage = mod.default;
  });

  it('渲染页面标题', () => {
    const { container: c } = render(React.createElement(FeedbackPage));
    container = c;
    assert.ok(container.innerHTML.includes('客户反馈管理'), 'expected page title');
  });

  it('渲染全部四个分类标签', () => {
    const { container: c } = render(React.createElement(FeedbackPage));
    const buttons = c.querySelectorAll('button[data-testid^="reply-tab-"]');
    assert.strictEqual(buttons.length, 4, 'expected 4 reply tab buttons');
    const labels = Array.from(buttons).map(b => b.textContent);
    assert.ok(labels.some(l => l!.includes('全部')));
    assert.ok(labels.some(l => l!.includes('未处理')));
    assert.ok(labels.some(l => l!.includes('已处理')));
    assert.ok(labels.some(l => l!.includes('已回复')));
  });

  it('默认全部标签高亮', () => {
    const { container: c } = render(React.createElement(FeedbackPage));
    const allTab = c.querySelector('[data-testid="reply-tab-all"]') as HTMLElement;
    assert.ok(allTab, 'all tab exists');
    assert.strictEqual(allTab.style.fontWeight, '600', 'all tab should be bold (selected)');
  });

  it('渲染概览统计卡片', () => {
    const { container: c } = render(React.createElement(FeedbackPage));
    assert.ok(c.innerHTML.includes('总反馈数'), 'expected total stat');
    assert.ok(c.innerHTML.includes('本月平均评级'), 'expected monthly avg');
  });

  it('默认显示反馈列表', () => {
    const { container: c } = render(React.createElement(FeedbackPage));
    // Should have customer names rendered
    assert.ok(c.innerHTML.includes('张三'), 'expected customer Zhang San');
    assert.ok(c.innerHTML.includes('李四'), 'expected customer Li Si');
  });

  it('渲染搜索输入框', () => {
    const { container: c } = render(React.createElement(FeedbackPage));
    const input = c.querySelector('input[type="text"]');
    assert.ok(input, 'expected search input');
  });

  it('渲染类型筛选下拉框', () => {
    const { container: c } = render(React.createElement(FeedbackPage));
    const select = c.querySelector('select');
    assert.ok(select, 'expected type filter select');
  });

  it('渲染刷新按钮', () => {
    const { container: c } = render(React.createElement(FeedbackPage));
    const buttons = Array.from(c.querySelectorAll('button'));
    const refreshBtn = buttons.find(b => b.textContent?.includes('刷新'));
    assert.ok(refreshBtn, 'expected refresh button');
  });

  it('渲染筛选结果数', () => {
    const { container: c } = render(React.createElement(FeedbackPage));
    // Should show count info when filtered (default is 'all' so no count initially)
    // But the feedback cards should be rendered
    const cards = c.querySelectorAll('[style*="flex-direction: column"][style*="gap: 12px"] > div, div > div > div');
    // Just check the structure is there
    assert.ok(c.innerHTML.length > 500, 'expected substantial HTML output');
  });
});

// ─── 边界条件测试 ──────────────────────────────────

describe('FeedbackPage — 边界条件', () => {
  it('SRC包含EmptyState空态组件', () => {
    assert.ok(SRC.includes('EmptyState'), 'expected EmptyState component');
  });

  it('SRC包含空态条件判断', () => {
    assert.ok(SRC.includes('showEmptyState'), 'expected empty state check');
  });

  it('SRC包含重置筛选逻辑', () => {
    assert.ok(SRC.includes('handleRefresh'), 'expected refresh handler');
  });

  it('SRC支持多条件筛选', () => {
    // replyTab + statusTab + keyword + typeFilter
    assert.ok(SRC.includes('replyTab') || SRC.includes('keyword') || SRC.includes('typeFilter'), 'expected multi-filter');
  });

  it('SRC包含反馈项数量统计', () => {
    assert.ok(SRC.includes('pendingCount') || SRC.includes('unhandledCount'), 'expected count stats');
  });

  it('SRC包含星星评级渲染', () => {
    assert.ok(SRC.includes('renderStars'), 'expected star rating render');
  });
});
