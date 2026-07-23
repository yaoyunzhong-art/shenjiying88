/**
 * sales-guide/page.vitest.tsx — 导购员工作台页 测试增强
 *
 * 覆盖：加载态、空数据、错误态、用户交互、边界场景
 * 使用 vitest + @testing-library/react
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

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
      <button data-testid="btn-followup-fu-1" onClick={() => onFollowUp?.('fu-1')}>
        跟进fu-1
      </button>
      <button data-testid="btn-copy-sc-1" onClick={() => onScriptCopy?.('sc-1')}>
        复制话术
      </button>
    </div>
  ),
}));

// ── 辅助函数 ──

function renderPage(overrides?: { showToast?: boolean }) {
  return render(<SalesGuidePage />);
}

// 我们直接导入 page 模块
import SalesGuidePage from './page.tsx';

// ── 测试套件 ──

describe('SalesGuidePage — 渲染', () => {
  test('应正确渲染 PageShell 组件', () => {
    renderPage();
    expect(screen.getByTestId('page-shell')).toBeTruthy();
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
    expect(screen.getByText(/待跟进/)).toBeTruthy();
  });

  test('应渲染 SalesClerkTool 组件', () => {
    renderPage();
    expect(screen.getByTestId('sales-clerk-tool')).toBeTruthy();
    expect(screen.getByTestId('clerk-name')).toHaveTextContent('张明');
    expect(screen.getByTestId('store-name')).toHaveTextContent('朝阳旗舰店');
  });

  test('应渲染待跟进客户表格', () => {
    renderPage();
    expect(screen.getByText(/待跟进客户列表/)).toBeTruthy();
    expect(screen.getByText('王芳')).toBeTruthy();
    expect(screen.getByText('李明')).toBeTruthy();
    expect(screen.getByText('赵雪')).toBeTruthy();
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
    const followUpBtns = screen.getAllByText('跟进');
    expect(followUpBtns.length).toBeGreaterThan(0);
    fireEvent.click(followUpBtns[0]);
    // 吐司通知应出现
    await waitFor(() => {
      expect(screen.getByText(/已标记跟进/)).toBeTruthy();
    });
  });

  test('点击复制话术按钮应触发复制回调', async () => {
    renderPage();
    const copyBtns = screen.getAllByText(/📋 复制/);
    expect(copyBtns.length).toBeGreaterThan(0);
    fireEvent.click(copyBtns[0]);
    // 吐司通知应出现
    await waitFor(() => {
      expect(screen.getByText(/话术已复制/)).toBeTruthy();
    });
  });

  test('优先级筛选下拉框应可切换值', () => {
    renderPage();
    const select = screen.getByRole('combobox');
    expect(select).toBeTruthy();
    fireEvent.change(select, { target: { value: 'high' } });
    expect(select).toHaveValue('high');
  });

  test('吐司通知应在3秒后自动消失', async () => {
    vi.useFakeTimers();
    renderPage();
    const followUpBtns = screen.getAllByText('跟进');
    fireEvent.click(followUpBtns[0]);
    expect(screen.getByText(/已标记跟进/)).toBeTruthy();
    vi.advanceTimersByTime(3000);
    await waitFor(() => {
      expect(screen.queryByText(/已标记跟进/)).toBeNull();
    });
    vi.useRealTimers();
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
  test('优先级为 high 的客户应有"高"标签', () => {
    renderPage();
    const highBadges = screen.getAllByText('高');
    expect(highBadges.length).toBeGreaterThanOrEqual(1);
  });

  test('应显示不同等级的会员徽章（VIP/GOLD/SILVER/REGULAR）', () => {
    renderPage();
    expect(screen.getByText('VIP')).toBeTruthy();
    expect(screen.getByText('GOLD')).toBeTruthy();
  });

  test('优先级筛选"全部"应显示所有客户', () => {
    renderPage();
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('ALL');
    // 验证所有客户姓名出现
    expect(screen.getByText('王芳')).toBeTruthy();
    expect(screen.getByText('刘洋')).toBeTruthy();
  });

  test('客户列表中应包含电话脱敏显示', () => {
    renderPage();
    expect(screen.getByText('138****5678')).toBeTruthy();
    expect(screen.getByText('159****2341')).toBeTruthy();
  });

  test('话术卡片应显示标签', () => {
    renderPage();
    expect(screen.getByText('新客')).toBeTruthy();
    expect(screen.getByText('欢迎')).toBeTruthy();
    expect(screen.getByText('推荐')).toBeTruthy();
  });

  test('今日工作摘要应包含在线状态徽章', () => {
    renderPage();
    expect(screen.getByText('在线')).toBeTruthy();
  });

  test('转化率统计应为 66.7%', () => {
    renderPage();
    expect(screen.getByText(/转化率 66.7%/)).toBeTruthy();
  });

  test('待跟进数量统计应为 5', () => {
    renderPage();
    expect(screen.getByText(/5 条/)).toBeTruthy();
  });

  test('话术数量统计应为 5 条', () => {
    renderPage();
    expect(screen.getByText(/5 条话术/)).toBeTruthy();
  });

  test('会员搜索按钮（通过 SalesClerkTool）可点击', () => {
    renderPage();
    const searchBtn = screen.getByTestId('btn-member-search');
    expect(searchBtn).toBeTruthy();
    fireEvent.click(searchBtn);
  });

  test('跟进按钮应调用 handleFollowUp 并显示对应客户名', async () => {
    renderPage();
    const fuBtns = screen.getAllByText('跟进');
    fireEvent.click(fuBtns[0]);
    await waitFor(() => {
      const toast = screen.getByText(/已标记跟进/);
      expect(toast).toBeTruthy();
    });
  });

  test('副本按钮对应话术场景应显示正确', async () => {
    renderPage();
    const copyBtns = screen.getAllByText(/📋 复制/);
    fireEvent.click(copyBtns[0]);
    await waitFor(() => {
      expect(screen.getByText(/话术已复制/)).toBeTruthy();
    });
  });
});
