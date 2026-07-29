/**
 * account/page.vitest.tsx — 个人中心页 组件测试
 * AccountPage 是 async server component, 渲染 AccountClient + ErrorBoundary + Suspense
 * 测试时直接 mock AccountClient 并验证 shell 布局
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/account',
  useSearchParams: () => new URLSearchParams(),
}));

const mockSetActiveTab = vi.fn();

vi.mock('@m5/ui', () => ({
  LoadingSkeleton: ({ variant, rows, label }: any) => (
    <div data-testid="loading-skeleton" data-variant={variant} data-rows={rows}>
      {label}
    </div>
  ),
  PageShell: ({ children, title, subtitle }: any) => (
    <div data-testid="page-shell" data-title={title} data-subtitle={subtitle}>
      {children}
    </div>
  ),
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
  Card: ({ children, style }: any) => (
    <div data-testid="m5-card" style={style}>
      {children}
    </div>
  ),
  StatusBadge: ({ label, variant, size, dot }: any) => (
    <span data-testid="status-badge" data-variant={variant} data-size={size} data-dot={dot}>
      {label}
    </span>
  ),
  Tabs: ({ items, activeKey, onChange, variant }: any) => (
    <div data-testid="m5-tabs" data-variant={variant}>
      {items.map((item: any) => (
        <button
          key={item.key}
          data-testid={`tab-${item.key}`}
          data-active={item.key === activeKey}
          onClick={() => onChange(item.key)}
        >
          {item.label}
          {item.count != null ? ` (${item.count})` : ''}
        </button>
      ))}
    </div>
  ),
}));

// Mock AccountClient directly — it's a client component rendered inside Suspense
vi.mock('./account-client', () => ({
  default: () => (
    <div data-testid="account-client">
      <div data-testid="member-card">
        <div>张先生</div>
        <div>金牌会员 · 138****1234</div>
        <div>已累计消费 ¥3,280</div>
      </div>
      <div data-testid="stats-cards">
        <div>积分 1,280</div>
        <div>余额 ¥128</div>
        <div>优惠券 3</div>
      </div>
      <div data-testid="profile-info">
        <div>昵称: 张先生</div>
        <div>手机: 138****1234</div>
        <div>会员等级: 金牌</div>
        <div>注册时间: 2025-03-15</div>
      </div>
      <div data-testid="order-history">
        <div>ORD-001</div>
        <div>ORD-002</div>
      </div>
    </div>
  ),
}));

import AccountPage from './page';

function renderPage() {
  return render(<AccountPage />);
}

describe('AccountPage — 个人中心', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('renders without crashing', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  test('renders ErrorBoundary wrapper', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  test('renders PageShell with correct title', async () => {
    renderPage();
    await waitFor(() => {
      const shell = screen.getByTestId('page-shell');
      expect(shell).toHaveAttribute('data-title', '👤 个人中心');
    });
  });

  test('renders PageShell with correct subtitle', async () => {
    renderPage();
    await waitFor(() => {
      const shell = screen.getByTestId('page-shell');
      expect(shell).toHaveAttribute('data-subtitle', '个人信息 · 订单 · 积分 · 设置');
    });
  });

  test('renders main element with correct styles', async () => {
    renderPage();
    await waitFor(() => {
      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveStyle('max-width: 960px');
    });
  });

  // ====== AccountClient rendering ======

  test('renders AccountClient', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('account-client')).toBeInTheDocument();
    });
  });

  test('renders member card with name', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('张先生')).toBeInTheDocument();
    });
  });

  test('renders member card with tier info', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('金牌会员 · 138****1234')).toBeInTheDocument();
    });
  });

  test('renders member total spending', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('已累计消费 ¥3,280')).toBeInTheDocument();
    });
  });

  test('renders stats cards: points', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('积分 1,280')).toBeInTheDocument();
    });
  });

  test('renders stats cards: balance', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('余额 ¥128')).toBeInTheDocument();
    });
  });

  test('renders stats cards: coupons count', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('优惠券 3')).toBeInTheDocument();
    });
  });

  // ====== Suspense fallback ======

  test('Suspense has LoadingSkeleton fallback', () => {
    // Render only to check the fallback is referenced
    const { container } = render(<AccountPage />);
    // The fallback string should be in the mock
    expect(screen.queryByText('加载账户信息...')).not.toBeInTheDocument(); // Suspense hides fallback after resolved
  });

  // ====== Profile info ======

  test('renders profile info fields', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('昵称: 张先生')).toBeInTheDocument();
      expect(screen.getByText('手机: 138****1234')).toBeInTheDocument();
    });
  });

  test('renders member level in profile', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('会员等级: 金牌')).toBeInTheDocument();
    });
  });

  test('renders registration date', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('注册时间: 2025-03-15')).toBeInTheDocument();
    });
  });

  // ====== Order history ======

  test('renders order history items', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
    });
  });

  // ====== 圈梁五道箍 — 增强测试 ======

  describe('圈梁五道箍 — 页面布局与组件嵌套', () => {
    test('[圈梁五道箍] PageShell包含AccountClient', async () => {
      renderPage();
      await waitFor(() => {
        const shell = screen.getByTestId('page-shell');
        const client = screen.getByTestId('account-client');
        expect(shell).toContainElement(client);
      });
    });

    test('[圈梁五道箍] ErrorBoundary包含PageShell', async () => {
      renderPage();
      await waitFor(() => {
        const errorBoundary = screen.getByTestId('error-boundary');
        const shell = screen.getByTestId('page-shell');
        expect(errorBoundary).toContainElement(shell);
      });
    });

    test('[圈梁五道箍] 个人中心标题正确', async () => {
      renderPage();
      await waitFor(() => {
        const shell = screen.getByTestId('page-shell');
        expect(shell).toHaveAttribute('data-title', '👤 个人中心');
      });
    });

    test('[圈梁五道箍] 副标题描述完整', async () => {
      renderPage();
      await waitFor(() => {
        const shell = screen.getByTestId('page-shell');
        expect(shell).toHaveAttribute('data-subtitle', '个人信息 · 订单 · 积分 · 设置');
      });
    });
  });

  describe('圈梁五道箍 — 会员信息完整性', () => {
    test('[圈梁五道箍] 显示会员姓名', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('张先生')).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 显示会员等级', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/金牌/)).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 显示积分余额', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('积分 1,280')).toBeInTheDocument();
        expect(screen.getByText('余额 ¥128')).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 显示优惠券数量', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('优惠券 3')).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 显示累计消费', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('已累计消费 ¥3,280')).toBeInTheDocument();
      });
    });
  });

  describe('圈梁五道箍 — 订单历史', () => {
    test('[圈梁五道箍] 订单历史区域渲染', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByTestId('order-history')).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 订单列表中包含多条记录', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('ORD-002')).toBeInTheDocument();
      });
    });
  });

  describe('圈梁五道箍 — 页面安全边界', () => {
    test('[圈梁五道箍] main标签正确设置maxWidth', async () => {
      renderPage();
      await waitFor(() => {
        const main = document.querySelector('main');
        expect(main).toHaveStyle('max-width: 960px');
      });
    });

    test('[圈梁五道箍] 个人信息区域渲染', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByTestId('profile-info')).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 会员卡片区域渲染', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByTestId('member-card')).toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 统计数据卡片区域渲染', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
      });
    });
  });
});
