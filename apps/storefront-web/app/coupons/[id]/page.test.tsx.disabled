import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'cp1' }),
}));

vi.mock('@m5/ui', () => ({
  DetailShell: ({ children, title, subtitle, actions }: any) => (
    <div data-testid="detail-shell" data-title={title} data-subtitle={subtitle}>
      {actions && (
        <div data-testid="detail-actions">
          {actions.map((a: any) => (
            <button key={a.key} data-testid={`action-${a.key}`} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  ),
  InfoRow: ({ label, value }: any) => (
    <div data-testid="info-row">
      <span data-testid="info-label">{label}</span>
      <span data-testid="info-value">{value}</span>
    </div>
  ),
  QuickStats: ({ items }: any) => (
    <div data-testid="quick-stats">
      {items.map((item: any, i: number) => (
        <div key={i} data-testid={`stat-${i}`}>
          <span data-testid="stat-label">{item.label}</span>
          <span data-testid="stat-value" data-color={item.valueColor}>{item.value}</span>
        </div>
      ))}
    </div>
  ),
}));

// ---- Test Subject ----

import CouponDetailPage from './page';

function renderPage() {
  return render(<CouponDetailPage />);
}

describe('CouponDetailPage — 优惠券详情页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('renders page without crashing', () => {
    expect(() => renderPage()).not.toThrow();
  });

  test('renders DetailShell component', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-shell')).toBeInTheDocument();
    });
  });

  test('renders coupon name', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('新客首单8折')).toBeInTheDocument();
    });
  });

  test('renders subtitle with validity dates', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/有效期/)).toBeInTheDocument();
    });
  });

  test('renders QuickStats component', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('quick-stats')).toBeInTheDocument();
    });
  });

  test('renders total issued stat', async () => {
    renderPage();
    await waitFor(() => {
      const labels = screen.getAllByTestId('stat-label');
      const statLabels = labels.map(l => l.textContent);
      expect(statLabels).toContain('总发放');
    });
  });

  test('renders used count stat', async () => {
    renderPage();
    await waitFor(() => {
      const labels = screen.getAllByTestId('stat-label');
      const statLabels = labels.map(l => l.textContent);
      expect(statLabels).toContain('已核销');
    });
  });

  test('renders remaining stat', async () => {
    renderPage();
    await waitFor(() => {
      const labels = screen.getAllByTestId('stat-label');
      const statLabels = labels.map(l => l.textContent);
      expect(statLabels).toContain('剩余可用');
    });
  });

  test('renders redeem rate stat', async () => {
    renderPage();
    await waitFor(() => {
      const labels = screen.getAllByTestId('stat-label');
      expect(labels.map(l => l.textContent)).toContain('核销率');
    });
  });

  test('renders usage limit stat', async () => {
    renderPage();
    await waitFor(() => {
      const labels = screen.getAllByTestId('stat-label');
      expect(labels.map(l => l.textContent)).toContain('每人限用');
    });
  });

  test('renders cumulative usage stat', async () => {
    renderPage();
    await waitFor(() => {
      const labels = screen.getAllByTestId('stat-label');
      expect(labels.map(l => l.textContent)).toContain('累计使用');
    });
  });

  test('renders total issued value', async () => {
    renderPage();
    await waitFor(() => {
      const values = screen.getAllByTestId('stat-value');
      expect(values[0]).toHaveTextContent('500');
    });
  });

  test('renders used count value', async () => {
    renderPage();
    await waitFor(() => {
      const values = screen.getAllByTestId('stat-value');
      expect(values[1]).toHaveTextContent('187');
    });
  });

  test('renders basic info section title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('基本信息')).toBeInTheDocument();
    });
  });

  // ====== InfoRow 字段测试 ======

  test('renders coupon ID', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('券 ID')).toBeInTheDocument();
      expect(screen.getByText('cp1')).toBeInTheDocument();
    });
  });

  test('renders coupon name field', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('券名称')).toBeInTheDocument();
    });
  });

  test('renders coupon type field', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('类型')).toBeInTheDocument();
    });
  });

  test('renders coupon value field', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('面值')).toBeInTheDocument();
    });
  });

  test('renders usage threshold field', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('使用门槛')).toBeInTheDocument();
    });
  });

  test('renders validity period field', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('有效期')).toBeInTheDocument();
    });
  });

  test('renders store name field', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('所属门店')).toBeInTheDocument();
    });
  });

  test('renders description field', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('券描述')).toBeInTheDocument();
    });
  });

  test('renders coupon description text', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/新用户首次下单/)).toBeInTheDocument();
    });
  });

  // ====== 操作按钮测试 ======

  test('renders disable button for active coupon', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-disable')).toHaveTextContent('停用优惠券');
    });
  });

  test('renders delete action button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toHaveTextContent('删除');
    });
  });

  test('clicking disable opens confirm dialog', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-disable')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-disable'));
    await waitFor(() => {
      expect(screen.getByText(/确认停用/)).toBeInTheDocument();
    });
  });

  test('clicking delete opens confirm dialog', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-delete'));
    await waitFor(() => {
      expect(screen.getByText(/确认删除/)).toBeInTheDocument();
    });
  });

  test('cancel dialog closes it', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-delete'));
    await waitFor(() => {
      expect(screen.getAllByText('取消')[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText('取消')[0]);
    await waitFor(() => {
      expect(screen.queryByText(/确认删除/)).not.toBeInTheDocument();
    });
  });

  // ====== 边界情况 ======

  test('shows loading state initially', () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'loading' });
    render(<CouponDetailPage />);
    // Use setTimeout to simulate loading
  });

  test('shows not found for invalid coupon id', () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'nonexistent' });
    renderPage();
    expect(screen.getByText('优惠券不存在')).toBeInTheDocument();
  });

  test('renders coupon value "8折"', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('8折')).toBeInTheDocument();
    });
  });

  test('renders coupon type label "打折券"', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('打折券')).toBeInTheDocument();
    });
  });

  test('renders min amount', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('满0元可用')).toBeInTheDocument();
    });
  });

  test('renders store name "Demo Store 旗舰店"', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Demo Store 旗舰店')).toBeInTheDocument();
    });
  });

  test('renders validity period', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/2026-06-01/)).toBeInTheDocument();
      expect(screen.getByText(/2026-07-31/)).toBeInTheDocument();
    });
  });
});
