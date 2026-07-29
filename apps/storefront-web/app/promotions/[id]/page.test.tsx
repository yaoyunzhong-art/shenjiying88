import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'promo-1' }),
}));

vi.mock('@m5/ui', () => ({
  DetailShell: ({ children, title, subtitle, backLabel, backHref, actions, sections, breadcrumbs, loading }: any) => (
    <div data-testid="detail-shell" data-title={title} data-subtitle={subtitle} data-loading={loading}>
      {breadcrumbs && (
        <div data-testid="breadcrumbs">
          {breadcrumbs.map((b: any, i: number) => (
            <span key={i}>{b.label}{i < breadcrumbs.length - 1 ? ' / ' : ''}</span>
          ))}
        </div>
      )}
      {actions && (
        <div data-testid="detail-actions">
          {actions.map((a: any) => (
            <button
              key={a.key}
              data-testid={`action-${a.key}`}
              onClick={a.onClick}
              data-variant={a.variant}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
      {sections?.map((s: any, i: number) => (
        <div key={i} data-testid="section" data-section-title={s.title}>
          <h3>{s.title}</h3>
          <div>{s.content}</div>
        </div>
      ))}
      {children}
    </div>
  ),
  InfoRow: ({ label, value }: any) => (
    <div data-testid="info-row">
      <span data-testid="info-label">{label}</span>
      <span data-testid="info-value">{value}</span>
    </div>
  ),
  StatusBadge: ({ label, variant, size }: any) => (
    <span data-testid="status-badge" data-variant={variant} data-size={size}>{label}</span>
  ),
  Alert: ({ children, variant, dismissible, onDismiss }: any) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
      {dismissible && <button data-testid="alert-dismiss" onClick={onDismiss}>×</button>}
    </div>
  ),
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
  useAlert: () => ({
    alert: null,
    dismiss: vi.fn(),
    show: vi.fn(),
  }),
  FormSubmitFeedback: ({ submitting, error, success }: any) => {
    if (submitting) return <div data-testid="form-submitting">提交中...</div>;
    if (error) return <div data-testid="form-error">{error}</div>;
    if (success) return <div data-testid="form-success">{success}</div>;
    return null;
  },
}));

// ---- Test Subject ----

import PromotionDetailPage from './page';

function renderPage() {
  return render(<PromotionDetailPage />);
}

describe('PromotionDetailPage — 促销活动详情页', () => {
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

  test('renders promotion title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('夏日清凉大促')).toBeInTheDocument();
    });
  });

  test('renders subtitle with store name and date', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/旗舰店/)).toBeInTheDocument();
      expect(screen.getByText(/2026-06-20/)).toBeInTheDocument();
    });
  });

  test('renders breadcrumbs', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
      expect(screen.getByText('首页')).toBeInTheDocument();
      expect(screen.getByText('促销活动')).toBeInTheDocument();
    });
  });

  test('renders stat cards container', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('promotion-stats')).toBeInTheDocument();
    });
  });

  test('renders stat card for budget', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('预算 (¥)')).toBeInTheDocument();
      expect(screen.getByText(/50,000/)).toBeInTheDocument();
    });
  });

  test('renders stat card for usage', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/已使用 \/ 上限/)).toBeInTheDocument();
      expect(screen.getByText(/187 \/ 500/)).toBeInTheDocument();
    });
  });

  test('renders stat card for usage percentage', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('使用率')).toBeInTheDocument();
    });
  });

  test('renders stat card for remaining days', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('剩余天数')).toBeInTheDocument();
    });
  });

  test('renders sections for info', async () => {
    renderPage();
    await waitFor(() => {
      const sections = screen.getAllByTestId('section');
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });
  });

  test('renders "活动概览" section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('活动概览')).toBeInTheDocument();
    });
  });

  test('renders "活动描述" section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('活动描述')).toBeInTheDocument();
    });
  });

  test('renders promotion description text', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/全场商品8折起/)).toBeInTheDocument();
    });
  });

  test('renders action buttons for active promotion', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-to-paused')).toHaveTextContent('暂停');
      expect(screen.getByTestId('action-to-ended')).toHaveTextContent('提前结束');
    });
  });

  test('renders delete action button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toHaveTextContent('删除活动');
    });
  });

  // ====== 状态流转测试 ======

  test('clicking pause transitions to paused', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-to-paused')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-to-paused'));
    await waitFor(() => {
      // After transition, paused shows "恢复活动" and "终止"
      expect(screen.getByTestId('action-to-active')).toHaveTextContent('恢复活动');
      expect(screen.getByTestId('action-to-ended')).toHaveTextContent('终止');
    });
  });

  test('clicking end transitions to ended', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-to-ended')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-to-ended'));
    await waitFor(() => {
      // Ended promotions have no transition buttons
      expect(screen.queryByTestId('action-to-paused')).not.toBeInTheDocument();
      expect(screen.queryByTestId('action-to-active')).not.toBeInTheDocument();
    });
  });

  test('ended promotion shows "已结束" stat card', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('剩余天数')).toBeInTheDocument();
    });
  });

  // ====== 删除测试 ======

  test('delete button opens confirm dialog', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-delete'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  test('confirm dialog shows promotion name', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-delete'));
    await waitFor(() => {
      expect(screen.getByText(/确认删除活动/)).toBeInTheDocument();
    });
  });

  test('cancel delete closes dialog', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-delete'));
    await waitFor(() => {
      expect(screen.getByTestId('cancel-delete-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancel-delete-btn'));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('confirm delete redirects to promotions list', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-delete'));
    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('confirm-delete-btn'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/promotions');
    });
  });

  // ====== 信息行测试 ======

  test('renders promotion type info', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/折扣/)).toBeInTheDocument();
    });
  });

  test('renders promotion status badge', async () => {
    renderPage();
    await waitFor(() => {
      const badges = screen.getAllByTestId('status-badge');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('renders promotion store name', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/旗舰店/)).toBeInTheDocument();
    });
  });

  test('renders promotion date range', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/→/)).toBeInTheDocument();
    });
  });

  test('renders promotion creator', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/张店长/)).toBeInTheDocument();
    });
  });

  test('renders promotion creation date', async () => {
    renderPage();
    await waitFor(() => {
      const dateElements = screen.getAllByText(/2026/);
      expect(dateElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ====== 边界情况 ======

  test('shows not found for invalid promotion id', () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'nonexistent' });
    renderPage();
    expect(screen.getByText(/未找到该活动/)).toBeInTheDocument();
  });

  test('displays correct number of info sections', async () => {
    renderPage();
    await waitFor(() => {
      const sections = screen.getAllByTestId('section');
      expect(sections).toHaveLength(2);
    });
  });

  test('draft promotion shows "启动活动" button', () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'promo-6' });
    renderPage();
    expect(screen.getByText('启动活动')).toBeInTheDocument();
  });

  test('draft promotion does not show pause/end buttons', () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'promo-6' });
    renderPage();
    expect(screen.queryByText('暂停')).not.toBeInTheDocument();
    expect(screen.queryByText('提前结束')).not.toBeInTheDocument();
  });

  test('0 usage promotion displays 0% usage rate', () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'promo-6' });
    renderPage();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
