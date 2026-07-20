/**
 * team-building/page.test.tsx — 团建活动管理列表页渲染测试
 *
 * 覆盖: 页面组件导出、统计计算、筛选逻辑、新建弹窗、边界值
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';

import {
  DEFAULT_ACTIVITIES,
  ACTIVITY_STATUS_LABEL,
  ACTIVITY_TYPE_LABEL,
  computeStats,
  filterActivities,
  formatCurrency,
} from './page';
import type { TeamBuildingRecord, ActivityStatus, ActivityType } from './page';

// ===== 辅助函数 =====

async function renderPage() {
  const mod = await import('./page');
  const view = render(React.createElement(mod.default));
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  return view;
}

// ===== 统计验证 =====

describe('TeamBuilding 统计计算', () => {
  it('总活动数应等于种子数据条目数', () => {
    const stats = computeStats(DEFAULT_ACTIVITIES);
    assert.equal(stats.total, DEFAULT_ACTIVITIES.length);
  });

  it('应正确计算进行中活动', () => {
    const stats = computeStats(DEFAULT_ACTIVITIES);
    const expected = DEFAULT_ACTIVITIES.filter((a) => a.status === 'in_progress').length;
    assert.equal(stats.inProgress, expected);
  });

  it('应正确计算已完成活动', () => {
    const stats = computeStats(DEFAULT_ACTIVITIES);
    const expected = DEFAULT_ACTIVITIES.filter((a) => a.status === 'completed').length;
    assert.equal(stats.completed, expected);
  });

  it('总参与人次应求和 actualParticipants', () => {
    const stats = computeStats(DEFAULT_ACTIVITIES);
    const expected = DEFAULT_ACTIVITIES.reduce(
      (s, a) => s + Math.max(a.actualParticipants ?? 0, 0),
      0,
    );
    assert.equal(stats.totalParticipants, expected);
  });
});

// ===== 筛选验证 =====

describe('TeamBuilding 筛选验证', () => {
  it('全部筛选应返回所有活动', () => {
    const result = filterActivities(DEFAULT_ACTIVITIES, '', 'all');
    assert.equal(result.length, DEFAULT_ACTIVITIES.length);
  });

  it('进行中筛选只返回 in_progress 活动', () => {
    const result = filterActivities(DEFAULT_ACTIVITIES, '', 'in_progress');
    assert.ok(result.length > 0);
    assert.ok(result.every((a) => a.status === 'in_progress'));
  });

  it('已完成筛选只返回 completed 活动', () => {
    const result = filterActivities(DEFAULT_ACTIVITIES, '', 'completed');
    assert.ok(result.length > 0);
    assert.ok(result.every((a) => a.status === 'completed'));
  });

  it('已取消筛选只返回 cancelled 活动', () => {
    const result = filterActivities(DEFAULT_ACTIVITIES, '', 'cancelled');
    assert.ok(result.length > 0);
    assert.ok(result.every((a) => a.status === 'cancelled'));
  });

  it('待报名筛选只返回 pending 活动', () => {
    const result = filterActivities(DEFAULT_ACTIVITIES, '', 'pending');
    assert.ok(result.length > 0);
    assert.ok(result.every((a) => a.status === 'pending'));
  });

  it('按名称搜索应精确匹配', () => {
    const result = filterActivities(DEFAULT_ACTIVITIES, '研发中心聚餐', 'all');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '研发中心聚餐');
  });

  it('按部分名称搜索应模糊匹配', () => {
    const result = filterActivities(DEFAULT_ACTIVITIES, '团建', 'all');
    assert.ok(result.length >= 3);
    assert.ok(result.every((a) => a.name.includes('团建')));
  });

  it('不存在的搜索词应返回空结果', () => {
    const result = filterActivities(DEFAULT_ACTIVITIES, '不存在的活动', 'all');
    assert.equal(result.length, 0);
  });

  it('搜索与状态组合筛选', () => {
    const result = filterActivities(DEFAULT_ACTIVITIES, '团建', 'completed');
    assert.ok(result.every((a) => a.status === 'completed' && a.name.includes('团建')));
  });
});

// ===== formatCurrency 边界值 =====

describe('formatCurrency 边界值', () => {
  it('负数金额', () => {
    assert.equal(formatCurrency(-500), '¥-500');
  });

  it('999 金额', () => {
    assert.equal(formatCurrency(999), '¥999');
  });

  it('正好 1000', () => {
    assert.equal(formatCurrency(1000), '¥1.0K');
  });

  it('正好 10000', () => {
    const result = formatCurrency(10_000);
    assert.ok(result.includes('万'), `expected "万" in result, got "${result}"`);
  });

  it('大额预算', () => {
    const result = formatCurrency(150_000);
    assert.ok(result.includes('万'), `expected "万" in result, got "${result}"`);
  });

  it('零金额', () => {
    assert.equal(formatCurrency(0), '¥0');
  });
});

// ===== 组件渲染 =====

describe('TeamBuilding 组件渲染', () => {
  beforeEach(() => {
    // Ensure clean state
  });

  afterEach(() => {
    cleanup();
  });

  it('应导出默认函数组件', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('组件名应包含 TeamBuilding', async () => {
    const mod = await import('./page');
    assert.ok(
      mod.default.name.includes('TeamBuilding'),
      `component name should contain "TeamBuilding", got "${mod.default.name}"`,
    );
  });

  it('应渲染页面标题', async () => {
    const { container } = await renderPage();
    const heading = container.querySelector('h1');
    assert.ok(heading, 'should render an h1');
    assert.ok(
      heading!.textContent?.includes('团建活动管理'),
      `expected "团建活动管理", got "${heading!.textContent}"`,
    );
  });

  it('应渲染 4 个 StatCard', async () => {
    const { container } = await renderPage();
    const statCards = container.querySelectorAll('[data-mock="StatCard"]');
    assert.equal(statCards.length, 4);
  });

  it('统计卡片应包含正确的标签', async () => {
    const { container } = await renderPage();
    const statLabels = container.querySelectorAll('[data-testid="stat-label"]');
    const labels = Array.from(statLabels).map((el) => el.textContent);
    assert.ok(labels.includes('总活动数'));
    assert.ok(labels.includes('进行中'));
    assert.ok(labels.includes('已完成'));
    assert.ok(labels.includes('总参与人次'));
  });

  it('应渲染 DataTable', async () => {
    const { container } = await renderPage();
    const dataTable = container.querySelector('[data-mock="DataTable"]');
    assert.ok(dataTable);
  });

  it('应渲染搜索输入框', async () => {
    const { container } = await renderPage();
    const searchInput = container.querySelector('[data-mock="SearchFilterInput"]');
    assert.ok(searchInput);
  });

  it('应渲染状态筛选下拉框', async () => {
    await renderPage();
    const statusSelect = screen.getAllByLabelText('状态筛选');
    assert.ok(statusSelect.length > 0);
  });

  it('应显示记录总数', async () => {
    const { container } = await renderPage();
    const totalText = Array.from(container.querySelectorAll('div'));
    const found = totalText.some((el) => /共.*条记录/.test(el.textContent || ''));
    assert.ok(found, 'should show total record count');
  });

  it('应渲染新建活动按钮', async () => {
    const { container } = await renderPage();
    const buttons = container.querySelectorAll('[data-mock="Button"]');
    const createBtn = Array.from(buttons).find(
      (b) => b.textContent?.includes('新建活动'),
    );
    assert.ok(createBtn, 'should render "新建活动" button');
  });
});

// ===== 新建弹窗交互 =====

describe('TeamBuilding 新建弹窗', () => {
  afterEach(() => {
    cleanup();
  });

  it('点击新建活动应渲染 Modal', async () => {
    const { container } = await renderPage();
    const buttons = container.querySelectorAll('[data-mock="Button"]');
    const createBtn = Array.from(buttons).find(
      (b) => b.textContent?.includes('新建活动'),
    );
    assert.ok(createBtn, '新建活动按钮应存在');

    await act(async () => {
      fireEvent.click(createBtn!);
    });

    const modal = container.querySelector('[data-mock="Modal"]');
    assert.ok(modal, '点击后应弹出 Modal');
  });

  it('Modal 应包含活动名称输入框', async () => {
    const { container } = await renderPage();
    const createBtn = Array.from(container.querySelectorAll('[data-mock="Button"]')).find(
      (b) => b.textContent?.includes('新建活动'),
    );
    await act(async () => {
      fireEvent.click(createBtn!);
    });

    const inputs = container.querySelectorAll('input');
    const nameInput = Array.from(inputs).find((i) => i.getAttribute('placeholder')?.includes('活动名称'));
    assert.ok(nameInput, 'Modal 中应包含活动名称输入框');
  });

  it('Modal 应包含确认创建和取消按钮', async () => {
    const { container } = await renderPage();
    const createBtn = Array.from(container.querySelectorAll('[data-mock="Button"]')).find(
      (b) => b.textContent?.includes('新建活动'),
    );
    await act(async () => {
      fireEvent.click(createBtn!);
    });

    const modalBtns = container.querySelectorAll('[data-mock="Button"]');
    const btnTexts = Array.from(modalBtns).map((b) => b.textContent);
    assert.ok(btnTexts.some((t) => t?.includes('确认创建')), '应包含确认创建按钮');
    assert.ok(btnTexts.some((t) => t?.includes('取消')), '应包含取消按钮');
  });

  it('点击取消应关闭 Modal', async () => {
    const { container } = await renderPage();
    const buttons1 = container.querySelectorAll('[data-mock="Button"]');
    const createBtn = Array.from(buttons1).find(
      (b) => b.textContent?.includes('新建活动'),
    );
    await act(async () => {
      fireEvent.click(createBtn!);
    });

    // Verify modal opened
    let modal = container.querySelector('[data-mock="Modal"]');
    assert.ok(modal);

    // Click cancel
    const cancelBtn = Array.from(container.querySelectorAll('[data-mock="Button"]')).find(
      (b) => b.textContent?.includes('取消'),
    );
    await act(async () => {
      fireEvent.click(cancelBtn!);
    });

    modal = container.querySelector('[data-mock="Modal"]');
    assert.equal(modal, null, '点击取消后 Modal 应关闭');
  });

  it('关闭弹窗后新建按钮仍可重新打开 Modal', async () => {
    const { container } = await renderPage();

    // Open once, close
    const btn1 = Array.from(container.querySelectorAll('[data-mock="Button"]')).find(
      (b) => b.textContent?.includes('新建活动'),
    );
    await act(async () => { fireEvent.click(btn1!); });
    let modal = container.querySelector('[data-mock="Modal"]');
    assert.ok(modal);

    const cancelBtn = Array.from(container.querySelectorAll('[data-mock="Button"]')).find(
      (b) => b.textContent?.includes('取消'),
    );
    await act(async () => { fireEvent.click(cancelBtn!); });
    modal = container.querySelector('[data-mock="Modal"]');
    assert.equal(modal, null);

    // Re-open
    const btn2 = Array.from(container.querySelectorAll('[data-mock="Button"]')).find(
      (b) => b.textContent?.includes('新建活动'),
    );
    await act(async () => { fireEvent.click(btn2!); });
    modal = container.querySelector('[data-mock="Modal"]');
    assert.ok(modal, '重新点击后 Modal 应再次打开');
  });
});

// ===== 常量映射 =====

describe('TeamBuilding 常量映射', () => {
  it('应包含4种活动状态标签', () => {
    const labels = Object.values(ACTIVITY_STATUS_LABEL);
    assert.equal(labels.length, 4);
    assert.ok(labels.includes('待报名'));
    assert.ok(labels.includes('进行中'));
    assert.ok(labels.includes('已完成'));
    assert.ok(labels.includes('已取消'));
  });

  it('应包含5种活动类型标签', () => {
    const labels = Object.values(ACTIVITY_TYPE_LABEL);
    assert.equal(labels.length, 5);
    assert.ok(labels.includes('团队拓展'));
    assert.ok(labels.includes('聚餐'));
    assert.ok(labels.includes('旅游'));
    assert.ok(labels.includes('运动'));
    assert.ok(labels.includes('其他'));
  });
});
