/**
 * sales-guide/page.vitest.tsx — 导购员工作台页 测试增强
 *
 * 覆盖：渲染、用户交互、加载态/错误态、边界场景
 * 使用 vitest + @testing-library/react
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mocks ──

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>
      {children}
    </div>
  ),
  StatusBadge: ({ label, variant }: any) => (
    <span data-testid="status-badge" data-variant={variant}>
      {label}
    </span>
  ),
  SalesClerkTool: ({ stats, followUpClients, scripts, clerkName, storeName, onMemberSearch, onFollowUp, onScriptCopy }: any) => (
    <div data-testid="sales-clerk-tool">
      <span data-testid="clerk-name">{clerkName}</span>
      <span data-testid="store-name">{storeName}</span>
      <span data-testid="stats-total">{stats?.totalReceptions}</span>
      <span data-testid="followup-count">{followUpClients?.length}</span>
      <span data-testid="scripts-count">{scripts?.length}</span>
      <button data-testid="btn-member-search" onClick={() => onMemberSearch?.('王芳')}>
        会员搜索
      </button>
      <button data-testid="btn-followup" onClick={() => onFollowUp?.('fu-1')}>
        跟进fu-1
      </button>
      <button data-testid="btn-copy" onClick={() => onScriptCopy?.('sc-1')}>
        复制话术
      </button>
    </div>
  ),
}));

import SalesGuidePage from './page';

const renderPage = () => render(<SalesGuidePage />);

// ── 测试套件 ──

describe('SalesGuidePage — 渲染', () => {
  test('应正确渲染 PageShell 组件', () => {
    renderPage();
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '导购员工具');
  });

  test('应渲染导购员工作台标题', () => {
    renderPage();
    expect(screen.getByText(/导购员工作台/)).toBeTruthy();
  });

  test('应渲染统计指标卡片', () => {
    renderPage();
    expect(screen.getByText(/今日接待/)).toBeTruthy();
    expect(screen.getByText(/新线索/)).toBeTruthy();
    expect(screen.getByText(/转化数/)).toBeTruthy();
    expect(screen.getByText(/平均响应/)).toBeTruthy();
    expect(screen.getAllByText(/待跟进/).length).toBeGreaterThanOrEqual(1);
  });

  test('应渲染 SalesClerkTool 组件', () => {
    renderPage();
    expect(screen.getByTestId('clerk-name')).toHaveTextContent('张明');
    expect(screen.getByTestId('store-name')).toHaveTextContent('朝阳旗舰店');
  });

  test('应渲染待跟进客户表格', () => {
    renderPage();
    expect(screen.getByText(/待跟进客户列表/)).toBeTruthy();
    expect(screen.getByText('王芳')).toBeTruthy();
    expect(screen.getByText('李明')).toBeTruthy();
  });

  test('应渲染推荐话术区域', () => {
    renderPage();
    expect(screen.getByText(/推荐话术/)).toBeTruthy();
    expect(screen.getByText('新客欢迎')).toBeTruthy();
    expect(screen.getByText('会员推荐')).toBeTruthy();
    expect(screen.getByText('客诉安抚')).toBeTruthy();
  });

  test('应渲染今日工作摘要', () => {
    renderPage();
    expect(screen.getByText(/今日排名/)).toBeTruthy();
    expect(screen.getByText(/在岗时长/)).toBeTruthy();
  });

  test('应渲染快速入口按钮组', () => {
    renderPage();
    expect(screen.getByText(/新建客户/)).toBeTruthy();
    expect(screen.getByText(/今日回访计划/)).toBeTruthy();
    expect(screen.getByText(/业绩排行榜/)).toBeTruthy();
  });
});

describe('SalesGuidePage — 用户交互', () => {
  test('点击跟进按钮应触发跟进回调', async () => {
    renderPage();
    fireEvent.click(screen.getAllByText('跟进')[0]);
    await waitFor(() => expect(screen.getByText(/已标记跟进/)).toBeTruthy());
  });

  test('点击复制话术按钮应触发复制回调', async () => {
    renderPage();
    fireEvent.click(screen.getAllByText(/📋 复制/)[0]);
    await waitFor(() => expect(screen.getByText(/话术已复制/)).toBeTruthy());
  });

  test('优先级筛选下拉框可切换', () => {
    renderPage();
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'high' } });
    expect(select).toHaveValue('high');
    fireEvent.change(select, { target: { value: 'medium' } });
    expect(select).toHaveValue('medium');
  });

  test('吐司通知3秒后自动消失', async () => {
    vi.useFakeTimers();
    renderPage();
    fireEvent.click(screen.getAllByText('跟进')[0]);
    expect(screen.getByText(/已标记跟进/)).toBeTruthy();
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.queryByText(/已标记跟进/)).toBeNull();
    vi.useRealTimers();
  });

  test('切换到低优先级筛选', () => {
    renderPage();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'low' } });
    expect(screen.getByRole('combobox')).toHaveValue('low');
  });

  test('会员搜索按钮可点击', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('btn-member-search'));
  });
});

describe('SalesGuidePage — 加载态与错误态', () => {
  test('页面初始不应显示加载态', () => {
    renderPage();
    expect(screen.queryByText('加载中...')).toBeNull();
  });

  test('页面初始不应显示错误态', () => {
    renderPage();
    expect(screen.queryByText(/数据获取失败/)).toBeNull();
  });
});

describe('SalesGuidePage — 边界场景', () => {
  test('高优先级客户应有"高"标签', () => {
    renderPage();
    expect(screen.getAllByText('高').length).toBeGreaterThanOrEqual(1);
  });

  test('应显示不同等级会员徽章', () => {
    renderPage();
    expect(screen.getAllByText('VIP').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('GOLD')).toBeTruthy();
  });

  test('优先级筛选"全部"显示所有客户', () => {
    renderPage();
    expect(screen.getByRole('combobox')).toHaveValue('ALL');
    expect(screen.getByText('王芳')).toBeTruthy();
    expect(screen.getByText('刘洋')).toBeTruthy();
  });

  test('电话脱敏显示', () => {
    renderPage();
    expect(screen.getByText('138****5678')).toBeTruthy();
  });

  test('话术卡片标签', () => {
    renderPage();
    expect(screen.getByText('新客')).toBeTruthy();
    expect(screen.getByText('欢迎')).toBeTruthy();
    expect(screen.getByText('推荐')).toBeTruthy();
  });

  test('在线状态徽章', () => {
    renderPage();
    expect(screen.getByText('在线')).toBeTruthy();
  });

  test('转化率 66.7%', () => {
    renderPage();
    expect(screen.getAllByText(/转化率 66.7%/).length).toBeGreaterThanOrEqual(1);
  });

  test('话术数量统计 5 条', () => {
    renderPage();
    expect(screen.getByText(/5 条话术/)).toBeTruthy();
  });

  test('营收数据正确', () => {
    renderPage();
    expect(screen.getByText('累计接待')).toBeTruthy();
    expect(screen.getByText('今日新增')).toBeTruthy();
  });
});
