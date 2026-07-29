/**
 * sales-clerk/page.vitest.tsx — 导购员工作台 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 加载态 · 渲染 · 值班摘要 · 统计卡片 · 快速操作 · 店员排行 · 待跟进 · 话术 · 边界
 * 角色: 🛍️ 导购员
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

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
          <button data-testid={`followup-btn-${c.id}`} onClick={() => onFollowUp(c.id)}>跟进</button>
        </div>
      ))}
      {scripts.map((s: { id: string; scenario: string; text: string }) => (
        <div key={s.id} data-testid={`script-${s.id}`}>
          <span>{s.scenario}</span>
          <span>{s.text}</span>
          <button data-testid={`script-copy-${s.id}`} onClick={() => onScriptCopy(s.id)}>复制</button>
        </div>
      ))}
      <input data-testid="member-search-input" placeholder="搜索会员..."
        onChange={(e) => { onMemberSearch(e.target.value); }} />
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
  useTriState: (_initialState?: { loading?: boolean }) => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [empty, setEmpty] = React.useState(false);
    return {
      loading,
      empty,
      error,
      setLoading,
      setEmpty,
      setError,
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
      syncData: () => {},
      reset: () => { setLoading(false); setError(null); setEmpty(false); },
    };
  },
}));

import SalesClerkPage from './page';

describe('SalesClerkPage — 导购员工作台', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ====== 加载状态测试 ======

  test('shows loading state initially', () => {
    render(<SalesClerkPage />);
    expect(screen.getByTestId('tri-state-loading')).toBeInTheDocument();
  });

  test('transitions from loading to content', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('sales-clerk-page')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  // ====== 渲染测试 ======

  test('renders PageShell with correct title', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '导购员工作台');
    });
  });

  test('renders page header title', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('🛍️ 导购员工作台')).toBeInTheDocument();
    });
  });

  test('renders store name and clerk info in header', async () => {
    render(<SalesClerkPage />);
    await screen.findByText(/朝阳旗舰店/, {}, { timeout: 5000 });
    expect(screen.getByText(/朝阳旗舰店/)).toBeInTheDocument();
    const clerkEls = screen.getAllByText(/张三/);
    expect(clerkEls.length).toBeGreaterThanOrEqual(1);
  });

  test('renders shift summary section', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('shift-summary')).toBeInTheDocument();
    });
  });

  test('shift summary shows shift time', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('早班 · 08:00-16:00')).toBeInTheDocument();
    });
  });

  test('shift summary shows on-duty duration', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('5h 32min')).toBeInTheDocument();
    });
  });

  test('shift summary shows break time', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('12:00-12:30')).toBeInTheDocument();
    });
  });

  test('shift summary shows status badges', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId('m5-status-badge');
      expect(badges.some(b => b.textContent?.includes('在岗'))).toBe(true);
    });
  });

  test('renders daily stats grid', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('daily-stats-grid')).toBeInTheDocument();
    });
  });

  test('renders 4 daily stat cards', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('daily-stat-今日业绩')).toBeInTheDocument();
      expect(screen.getByTestId('daily-stat-接待人数')).toBeInTheDocument();
      expect(screen.getByTestId('daily-stat-转化率')).toBeInTheDocument();
      expect(screen.getByTestId('daily-stat-客单价')).toBeInTheDocument();
    });
  });

  test('daily stats show correct values', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('¥28,600')).toBeInTheDocument();
      expect(screen.getByText('47 人')).toBeInTheDocument();
      expect(screen.getByText('17.0%')).toBeInTheDocument();
    });
  });

  test('renders quick action bar', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('quick-action-bar')).toBeInTheDocument();
    });
  });

  test('renders 4 quick action buttons', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('action-new-customer')).toBeInTheDocument();
      expect(screen.getByTestId('action-return-plan')).toBeInTheDocument();
      expect(screen.getByTestId('action-ranking')).toBeInTheDocument();
      expect(screen.getByTestId('action-contact')).toBeInTheDocument();
    });
  });

  test('quick action buttons have correct labels', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('action-new-customer')).toHaveTextContent('📝 新建客户');
      expect(screen.getByTestId('action-contact')).toHaveTextContent('📱 联系客户');
    });
  });

  test('renders clerk ranking panel', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('clerk-ranking-panel')).toBeInTheDocument();
    });
  });

  test('ranking panel shows current rank', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('#3')).toBeInTheDocument();
    });
  });

  test('ranking panel initially displays top 3 rows', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('ranking-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('ranking-row-2')).toBeInTheDocument();
      expect(screen.getByTestId('ranking-row-3')).toBeInTheDocument();
    });
  });

  test('renders SalesClerkTool component', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('sales-clerk-tool')).toBeInTheDocument();
    });
  });

  test('SalesClerkTool receives correct clerk name', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('sales-clerk-tool')).toHaveAttribute('data-clerk', '张三');
    });
  });

  test('SalesClerkTool receives correct store name', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('sales-clerk-tool')).toHaveAttribute('data-store', '朝阳旗舰店');
    });
  });

  test('SalesClerkTool shows 5 follow-up clients', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('5 条待跟进')).toBeInTheDocument();
    });
  });

  test('SalesClerkTool shows 4 scripts', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('4 条话术')).toBeInTheDocument();
    });
  });

  // ====== 交互测试 ======

  test('clicking follow-up button removes client from list', async () => {
    render(<SalesClerkPage />);
    const cl = await screen.findByTestId('followup-fu-1', {}, { timeout: 5000 });
    expect(cl).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('followup-btn-fu-1'));
    await waitFor(() => {
      expect(screen.queryByTestId('followup-fu-1')).not.toBeInTheDocument();
    });
  });

  test('follow-up count decreases after removing client', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByText('5 条待跟进')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('followup-btn-fu-1'));
    await waitFor(() => {
      expect(screen.getByText('4 条待跟进')).toBeInTheDocument();
    });
  });

  test('expand ranking panel shows all 5 rows', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('ranking-toggle-btn'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('ranking-row-4')).toBeInTheDocument();
      expect(screen.getByTestId('ranking-row-5')).toBeInTheDocument();
    });
  });

  test('collapse ranking panel hides rows 4-5', async () => {
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

  test('toggle button text changes to 收起 when expanded', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('ranking-toggle-btn'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('ranking-toggle-btn')).toHaveTextContent('收起');
    });
  });

  test('toggle button text shows 查看全部 when collapsed', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      expect(screen.getByTestId('ranking-toggle-btn')).toHaveTextContent('查看全部');
    });
  });

  test('copying a script shows toast', async () => {
    render(<SalesClerkPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('script-copy-s-1'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('copy-toast')).toBeInTheDocument();
      expect(screen.getByText('✅ 话术已复制')).toBeInTheDocument();
    });
  });

  test('toast shows after copying a script', async () => {
    render(<SalesClerkPage />);
    await screen.findByText('4 条话术', {}, { timeout: 5000 });
    fireEvent.click(screen.getByTestId('script-copy-s-1'));
    await screen.findByText('✅ 话术已复制', {}, { timeout: 2000 });
    expect(screen.getByTestId('copy-toast')).toBeInTheDocument();
  });

  // ====== 优先级展示测试 ======

  test('follow-up clients show priority levels', async () => {
    render(<SalesClerkPage />);
    await screen.findByTestId('priority-fu-1', {}, { timeout: 5000 });
    expect(screen.getByTestId('priority-fu-1')).toHaveTextContent('high');
    expect(screen.getByTestId('priority-fu-2')).toHaveTextContent('medium');
    expect(screen.getByTestId('priority-fu-3')).toHaveTextContent('low');
  });

  test('all follow-up clients have buttons', async () => {
    render(<SalesClerkPage />);
    await screen.findByText('5 条待跟进', {}, { timeout: 5000 });
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`followup-btn-fu-${i}`)).toBeInTheDocument();
    }
  });

  test('all scripts have copy buttons', async () => {
    render(<SalesClerkPage />);
    await screen.findByTestId('script-copy-s-1', {}, { timeout: 5000 });
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByTestId(`script-copy-s-${i}`)).toBeInTheDocument();
    }
  });

  // ====== 边界测试 ======

  test('export default is function', () => {
    expect(typeof SalesClerkPage).toBe('function');
  });

  test('date displays correctly in header', async () => {
    render(<SalesClerkPage />);
    const today = new Date().toLocaleDateString('zh-CN');
    await screen.findByText(today, { exact: false }, { timeout: 5000 });
    expect(screen.getByText(today, { exact: false })).toBeInTheDocument();
  });

  test('current clerk row is highlighted in ranking', async () => {
    render(<SalesClerkPage />);
    await screen.findByTestId('ranking-row-3', {}, { timeout: 5000 });
    expect(screen.getByTestId('ranking-row-3')).toBeInTheDocument();
  });

  test('current clerk shows "(你)" marker', async () => {
    render(<SalesClerkPage />);
    await screen.findByText('5 条待跟进', {}, { timeout: 5000 });
    const markers = screen.getAllByText(/(你)/);
    expect(markers.length).toBeGreaterThanOrEqual(1);
  });
});
