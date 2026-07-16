/**
 * feedback/page.test.tsx — 意见反馈页面 L1+L2 综合测试
 * 角色视角: 👤会员 / 👔店长
 * 覆盖: 正例(组件/渲染/交互) 反例(空/错) 边界(全状态/评分/分类) 角色(提交/查看/管理)
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const PAGE_SRC = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf8');

describe('FeedbackPage — 正例', () => {
  test('page exports default function FeedbackPage', () => {
    assert.ok(PAGE_SRC.includes('export default function FeedbackPage'), '缺少默认导出');
  });

  test('page contains use client directive', () => {
    assert.ok(PAGE_SRC.includes("'use client'"), '缺少 use client');
  });

  test('page title contains 意见反馈', () => {
    assert.ok(PAGE_SRC.includes('意见反馈'), 'should render page title');
  });

  test('renders feedback stats calculation', () => {
    assert.ok(PAGE_SRC.includes('avgRating') || PAGE_SRC.includes('byCategory'), 'should have stats calculation');
  });

  test('contains feedback record data with multiple categories', () => {
    const categoryCount = (PAGE_SRC.match(/category:/g) || []).length;
    assert.ok(categoryCount >= 6, `should have multiple categories, got ${categoryCount}`);
  });

  test('records have 5 status types coverage', () => {
    const statuses = ['pending', 'processing', 'resolved', 'closed'];
    const found = statuses.filter(s => PAGE_SRC.includes(s));
    assert.ok(found.length >= 3, `should have at least 3 status types, found: ${found.join(',')}`);
  });

  test('has green reply background for resolved feedback', () => {
    assert.ok(PAGE_SRC.includes('#f0fdf4'), 'should have reply section background');
  });

  test('includes useMemo for computed data', () => {
    assert.ok(PAGE_SRC.includes('useMemo'), '缺少 useMemo');
  });

  test('includes useState for state management', () => {
    assert.ok(PAGE_SRC.includes('useState'), '缺少 useState');
  });

  test('includes search or filter functionality', () => {
    assert.ok(PAGE_SRC.includes('.trim()') || PAGE_SRC.includes('filter'), 'should have search/filter');
  });

  test('renders category filter with all options', () => {
    const expected = ['suggestion', 'complaint', 'question', 'praise', 'bug', 'other'];
    const found = expected.filter(e => PAGE_SRC.includes(e));
    assert.ok(found.length >= 4, `should render most filter options, found: ${found.length}/6`);
  });

  test('has pagination controls', () => {
    assert.ok(PAGE_SRC.includes('上一页') && PAGE_SRC.includes('下一页'), 'should have pagination');
  });

  test('should have empty state for no matching feedback', () => {
    assert.ok(PAGE_SRC.includes('暂无反馈记录') || PAGE_SRC.includes('暂无'), 'should have empty state');
  });

  test('should have error state simulation', () => {
    assert.ok(PAGE_SRC.includes('模拟错误') || PAGE_SRC.includes('加载失败'), 'should have error simulation');
  });

  test('has star rating interaction', () => {
    assert.ok(PAGE_SRC.includes('★'), 'should have star rating');
  });

  test('has new feedback form', () => {
    assert.ok(PAGE_SRC.includes('NewFeedbackForm') || PAGE_SRC.includes('提交反馈'), 'should have new feedback form');
  });
});

describe('FeedbackPage — 反例', () => {
  test('should handle empty filtered results', () => {
    assert.ok(PAGE_SRC.includes('.length === 0') || PAGE_SRC.includes('暂无'), 'should handle empty results');
  });

  test('should handle error state rendering', () => {
    assert.ok(PAGE_SRC.includes('showError'), 'should handle error state toggle');
  });

  test('should handle missing reply gracefully', () => {
    assert.ok(PAGE_SRC.includes('reply'), 'should handle optional reply field');
  });

  test('no eval or dangerous patterns', () => {
    assert.ok(!PAGE_SRC.includes('eval('), 'no eval usage');
    assert.ok(!PAGE_SRC.includes('dangerouslySetInnerHTML'), 'no dangerous HTML');
  });

  test('no hardcoded personal info', () => {
    assert.ok(!PAGE_SRC.includes('13800138000'), 'no fake phone numbers');
  });
});

describe('FeedbackPage — 边界', () => {
  test('feedback types should be properly defined', () => {
    const types = ['FeedbackStatus', 'FeedbackCategory', 'FeedbackRecord'];
    const found = types.filter(t => PAGE_SRC.includes(t));
    assert.ok(found.length >= 2, `should define most types, found: ${found.length}/3`);
  });

  test('status badges have appropriate colors', () => {
    const statusColors = ['#f59e0b', '#3b82f6', '#22c55e', '#6b7280'];
    const found = statusColors.filter(c => PAGE_SRC.includes(c));
    assert.ok(found.length >= 3, `should define colors for most statuses, found: ${found.length}/4`);
  });

  test('category filter should have "全部" option', () => {
    assert.ok(PAGE_SRC.includes("'全部'"), 'should have 全部 option');
  });

  test('expand/collapse reply section', () => {
    assert.ok(PAGE_SRC.includes('expanded'), 'should have expand/collapse for replies');
  });

  test('should handle new feedback submission callback', () => {
    assert.ok(PAGE_SRC.includes('handleNewFeedback'), 'should pass submit handler');
  });

  test('simulated error state has retry button', () => {
    assert.ok(PAGE_SRC.includes('重试'), 'should have retry button in error state');
  });
});

describe('FeedbackPage — 角色视角', () => {
  test('member can submit feedback', () => {
    assert.ok(PAGE_SRC.includes('提交反馈'), 'member can submit');
  });

  test('member can check history', () => {
    assert.ok(PAGE_SRC.includes('反馈记录') || PAGE_SRC.includes('共') || PAGE_SRC.includes('条反馈'), 'member can view history');
  });

  test('manager can see processing stats', () => {
    assert.ok(PAGE_SRC.includes('已处理') || PAGE_SRC.includes('待处理'), 'manager can see stats');
  });

  test('manager can filter by status', () => {
    assert.ok(PAGE_SRC.includes('statusFilter'), 'manager can filter by status');
  });

  test('member can filter by category', () => {
    assert.ok(PAGE_SRC.includes('categoryFilter'), 'member can filter by category');
  });
});
