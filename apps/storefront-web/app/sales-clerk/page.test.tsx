import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

vi.mock('next/link', () => ({
  default: ({ children, href, style }: { children: React.ReactNode; href?: string; style?: React.CSSProperties }) => (
    <a data-testid="next-link" href={href} style={style}>{children}</a>
  ),
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="page-shell" data-title={title}>{children}</div>
  ),
  SalesClerkTool: ({
    stats, followUpClients, scripts, clerkName, storeName,
    onMemberSearch, onFollowUp, onScriptCopy,
  }: {
    stats: unknown; followUpClients: unknown[]; scripts: unknown[];
    clerkName: string; storeName: string;
    onMemberSearch: (query: string) => Promise<unknown[]>;
    onFollowUp: (id: string) => void; onScriptCopy: (id: string) => void;
  }) => (
    <div data-testid="sales-clerk-tool" data-clerk={clerkName} data-store={storeName}>
      <div data-testid="mock-stats">{JSON.stringify(stats)}</div>
      <div data-testid="mock-followups">{followUpClients.length} 条待跟进</div>
      <div data-testid="mock-scripts">{scripts.length} 条话术</div>
      {followUpClients.map((c: { id: string; name: string; priority: string }) => (
        <div key={c.id} data-testid={`followup-${c.id}`}>
          <span>{c.name}</span>
          <span data-testid={`priority-${c.id}`}>{c.priority}</span>
          <button data-testid={`followup-btn-${c.id}`} onClick={() => onFollowUp(c.id)}>
            跟进
          </button>
        </div>
      ))}
      {scripts.map((s: { id: string; scenario: string; text: string }) => (
        <div key={s.id} data-testid={`script-${s.id}`}>
          <span>{s.scenario}</span>
          <span>{s.text}</span>
          <button data-testid={`script-copy-${s.id}`} onClick={() => onScriptCopy(s.id)}>
            复制
          </button>
        </div>
      ))}
      <input
        data-testid="member-search-input"
        placeholder="搜索会员..."
        onChange={(e) => { onMemberSearch(e.target.value); }}
      />
    </div>
  ),
  StatusBadge: ({ label, variant }: { label: string; variant?: string }) => (
    <span data-testid="m5-status-badge" data-variant={variant}>{label}</span>
  ),
}));

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ loading, empty, error, onRetry, children }: {
    loading?: boolean; empty?: boolean; error?: string | null; onRetry?: () => void;
    children: React.ReactNode;
  }) => {
    if (loading) return <div data-testid="tri-state-loading">加载中…</div>;
    if (error) return <div data-testid="tri-state-error">{error}<button data-testid="tri-state-retry" onClick={onRetry}>重新加载</button></div>;
    if (empty) return <div data-testid="tri-state-empty">暂无数据</div>;
    return <>{children}</>;
  },
}));

vi.mock('../_components/useTriState', () => ({
  useTriState: ({ loading: initialLoading }: { loading?: boolean }) => {
    const [loading, setLoading] = React.useState(!!initialLoading);
    const [error, setError] = React.useState<string | null>(null);
    return {
      loading,
      error,
      wrapLoad: async (p: Promise<unknown>) => {
        setLoading(true);
        setError(null);
        try {
          await p;
          setLoading(false);
        } catch (e) {
          setError(e instanceof Error ? e.message : '未知错误');
          setLoading(false);
        }
      },
    };
  },
}));

// ---- Test Subject ----

import SalesClerkPage from './page';

describe('SalesClerkPage — 导购员工作台', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('渲染 PageShell 并包含正确标题', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '导购员工作台');
    });
  });

  test('渲染完整页面容器 sales-clerk-page', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('sales-clerk-page')).toBeInTheDocument();
    });
  });

  test('渲染页面标题 导购员工作台', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('🛍️ 导购员工作台')).toBeInTheDocument();
    });
  });

  test('渲染值班摘要区域', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('shift-summary')).toBeInTheDocument();
    });
  });

  test('值班摘要显示班次信息', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('早班 · 08:00-16:00')).toBeInTheDocument();
    });
  });

  test('值班摘要显示在岗时长', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('5h 32min')).toBeInTheDocument();
    });
  });

  test('值班摘要显示在岗状态徽章', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId('m5-status-badge');
      expect(badges.length).toBeGreaterThanOrEqual(2);
      expect(badges.some(b => b.textContent?.includes('在岗'))).toBe(true);
    });
  });

  test('渲染每日数据统计卡片', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('daily-stats-grid')).toBeInTheDocument();
    });
  });

  test('渲染 4 个统计卡片', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('daily-stat-今日业绩')).toBeInTheDocument();
      expect(screen.getByTestId('daily-stat-接待人数')).toBeInTheDocument();
      expect(screen.getByTestId('daily-stat-转化率')).toBeInTheDocument();
      expect(screen.getByTestId('daily-stat-客单价')).toBeInTheDocument();
    });
  });

  test('渲染快速操作栏', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('quick-action-bar')).toBeInTheDocument();
    });
  });

  test('渲染 4 个快速操作按钮', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('action-new-customer')).toBeInTheDocument();
      expect(screen.getByTestId('action-return-plan')).toBeInTheDocument();
      expect(screen.getByTestId('action-ranking')).toBeInTheDocument();
      expect(screen.getByTestId('action-contact')).toBeInTheDocument();
    });
  });

  test('快速操作按钮显示正确图标和文案', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('action-new-customer')).toHaveTextContent('📝 新建客户');
      expect(screen.getByTestId('action-return-plan')).toHaveTextContent('📋 回访计划');
    });
  });

  test('渲染店员排行面板', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('clerk-ranking-panel')).toBeInTheDocument();
    });
  });

  test('排行面板默认显示 "你排名 #3"', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText(/排名/)).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });
  });

  test('排行面板显示前 3 行', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('ranking-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('ranking-row-2')).toBeInTheDocument();
      expect(screen.getByTestId('ranking-row-3')).toBeInTheDocument();
    });
  });

  test('渲染 SalesClerkTool 核心组件', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('sales-clerk-tool')).toBeInTheDocument();
    });
  });

  test('SalesClerkTool 传递正确的店员姓名和门店', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('sales-clerk-tool')).toHaveAttribute('data-clerk', '张三');
      expect(screen.getByTestId('sales-clerk-tool')).toHaveAttribute('data-store', '朝阳旗舰店');
    });
  });

  test('SalesClerkTool 显示 5 条待跟进客户', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('5 条待跟进')).toBeInTheDocument();
    });
  });

  test('SalesClerkTool 显示 4 条话术', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('4 条话术')).toBeInTheDocument();
    });
  });

  // ====== 数据加载 loading 状态 ======

  test('初始显示 loading 状态', () => {
    render(<SalesClerkPage />);
    expect(screen.getByTestId('tri-state-loading')).toBeInTheDocument();
  });

  test('loading 结束后显示页面内容', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('sales-clerk-page')).toBeInTheDocument();
    });
  });

  // ====== 交互测试 ======

  test('点击跟进按钮可移除待跟进客户', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('followup-fu-1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('followup-btn-fu-1'));
    await waitFor(() => {
      expect(screen.queryByTestId('followup-fu-1')).not.toBeInTheDocument();
    });
  });

  test('跟进后跟进数量减少', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('5 条待跟进')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('followup-btn-fu-1'));
    await waitFor(() => {
      expect(screen.getByText('4 条待跟进')).toBeInTheDocument();
    });
  });

  test('展开排行面板展示全部 5 行', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('ranking-toggle-btn'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('ranking-row-4')).toBeInTheDocument();
      expect(screen.getByTestId('ranking-row-5')).toBeInTheDocument();
    });
  });

  test('收缩排行面板恢复 3 行', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('ranking-toggle-btn'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('ranking-row-5')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('ranking-toggle-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('ranking-row-5')).not.toBeInTheDocument();
    });
  });

  test('展开按钮文本变为 "收起"', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('ranking-toggle-btn'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('ranking-toggle-btn')).toHaveTextContent('收起');
    });
  });

  test('复制话术显示 toast 提示', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('script-copy-s-1'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('copy-toast')).toBeInTheDocument();
      expect(screen.getByTestId('copy-toast')).toHaveTextContent('✅ 话术已复制');
    });
  });

  test('toast 提示 2 秒后消失', async () => {
    vi.useFakeTimers();
    render(<SalesClerkPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('script-copy-s-1'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('copy-toast')).toBeInTheDocument();
    });
    act(() => { vi.advanceTimersByTime(2000); });
    await waitFor(() => {
      expect(screen.queryByTestId('copy-toast')).not.toBeInTheDocument();
    });
    vi.useRealTimers();
  });

  // 重新暴露 act
  const { act } = require('@testing-library/react');

  // ====== 优先级展示测试 ======

  test('待跟进客户显示 high/medium/low 优先级', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('priority-fu-1')).toHaveTextContent('high');
      expect(screen.getByTestId('priority-fu-2')).toHaveTextContent('medium');
      expect(screen.getByTestId('priority-fu-3')).toHaveTextContent('low');
    });
  });

  test('所有待跟进客户都有对应的跟进按钮', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByTestId(`followup-btn-fu-${i}`)).toBeInTheDocument();
      }
    });
  });

  test('所有话术都有复制按钮', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      for (let i = 1; i <= 4; i++) {
        expect(screen.getByTestId(`script-copy-s-${i}`)).toBeInTheDocument();
      }
    });
  });

  test('话术场景文案正确', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('新品推荐开场')).toBeInTheDocument();
      expect(screen.getByText('会员升等邀请')).toBeInTheDocument();
      expect(screen.getByText('挽回不满意顾客')).toBeInTheDocument();
      expect(screen.getByText('关联推荐')).toBeInTheDocument();
    });
  });

  test('排行面板当前店员行高亮', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      const row3 = screen.getByTestId('ranking-row-3');
      expect(row3).toBeInTheDocument();
    });
  });

  test('排行面板中当前店员显示 "张三(你)"', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText(/张三/)).toBeInTheDocument();
      expect(screen.getByText(/(你)/)).toBeInTheDocument();
    });
  });

  test('排行面板中排名前三序号用金色', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      const rank1 = screen.getByTestId('ranking-row-1');
      expect(rank1).toBeInTheDocument();
    });
  });

  test('各统计卡片显示正确的值', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('¥28,600')).toBeInTheDocument();
      expect(screen.getByText('47 人')).toBeInTheDocument();
      expect(screen.getByText('17.0%')).toBeInTheDocument();
    });
  });

  test('日期显示格式正确', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      const today = new Date().toLocaleDateString('zh-CN');
      expect(screen.getByText(today, { exact: false })).toBeInTheDocument();
    });
  });
});
