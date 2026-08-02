import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'm1' }),
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
  ConfirmDialog: ({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, variant }: any) => {
    if (!open) return null;
    return (
      <div data-testid="confirm-dialog" data-variant={variant}>
        <div data-testid="dialog-title">{title}</div>
        <div data-testid="dialog-message">{message}</div>
        <button data-testid="confirm-btn" onClick={onConfirm}>{confirmLabel}</button>
        <button data-testid="cancel-btn" onClick={onCancel}>{cancelLabel}</button>
      </div>
    );
  },
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
  FormSubmitFeedback: ({ error }: any) => error ? <div data-testid="form-error">{error}</div> : null,
  FormField: ({ label, children, required, htmlFor }: any) => (
    <div data-testid="form-field">
      <label htmlFor={htmlFor}>{label}{required && ' *'}</label>
      {children}
    </div>
  ),
  SubmitButton: ({ children, loading, ...rest }: any) => (
    <button data-testid="submit-btn" disabled={loading} {...rest}>{loading ? '保存中...' : children}</button>
  ),
}));

// ---- Test Subject ----

import MemberDetailPage from './page';

function renderPage() {
  return render(<MemberDetailPage />);
}

describe('MemberDetailPage — 会员详情页', () => {
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

  test('renders member name in title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/张伟/)).toBeInTheDocument();
    });
  });

  test('renders member tier in subtitle', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/钻石会员/)).toBeInTheDocument();
    });
  });

  test('renders breadcrumbs', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
      expect(screen.getByText('首页')).toBeInTheDocument();
      expect(screen.getByText('会员管理')).toBeInTheDocument();
    });
  });

  test('renders action buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toHaveTextContent('编辑');
    });
  });

  test('renders info sections', async () => {
    renderPage();
    await waitFor(() => {
      const sections = screen.getAllByTestId('section');
      expect(sections.length).toBeGreaterThanOrEqual(4);
    });
  });

  test('renders basic info section title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('基本信息')).toBeInTheDocument();
    });
  });

  test('renders member level section title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('会员等级 & 积分')).toBeInTheDocument();
    });
  });

  test('renders store visit section title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('到店记录')).toBeInTheDocument();
    });
  });

  test('renders tags section title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('标签 & 备注')).toBeInTheDocument();
    });
  });

  test('renders member tags', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('高净值')).toBeInTheDocument();
      expect(screen.getByText('老顾客')).toBeInTheDocument();
    });
  });

  test('renders member points', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('28,500')).toBeInTheDocument();
    });
  });

  test('renders member phone', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('138****1234')).toBeInTheDocument();
    });
  });

  // ====== 编辑功能测试 ======

  test('clicking edit opens edit form', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-edit'));
    await waitFor(() => {
      expect(screen.getByText('编辑会员信息')).toBeInTheDocument();
    });
  });

  test('edit form shows member name input', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-edit'));
    await waitFor(() => {
      const nameInput = screen.getByTestId('edit-name');
      expect(nameInput).toHaveValue('张伟');
    });
  });

  test('edit form shows save and cancel buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-edit'));
    await waitFor(() => {
      expect(screen.getByTestId('save-btn')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });
  });

  test('canceling edit hides edit form', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-edit'));
    await waitFor(() => {
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancel-btn'));
    await waitFor(() => {
      expect(screen.queryByText('编辑会员信息')).not.toBeInTheDocument();
    });
  });

  test('saves edit form successfully', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-edit'));
    await waitFor(() => {
      expect(screen.getByTestId('save-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('save-btn'));
    await waitFor(() => {
      // After save, edit form should close
      expect(screen.queryByText('编辑会员信息')).not.toBeInTheDocument();
    });
  });

  // ====== 状态流转测试 ======

  test('renders transition buttons for active member', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-transition-frozen')).toHaveTextContent('冻结');
      expect(screen.getByTestId('action-transition-inactive')).toHaveTextContent('标记非活跃');
    });
  });

  test('clicking freeze transitions status', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-transition-frozen')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-transition-frozen'));
    // After transition, frozen member only has "解冻" button
    await waitFor(() => {
      expect(screen.getByTestId('action-transition-active')).toHaveTextContent('解冻');
    });
  });

  test('clicks inactive transition', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-transition-inactive')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-transition-inactive'));
    await waitFor(() => {
      expect(screen.getByTestId('action-transition-active')).toHaveTextContent('激活');
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
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
  });

  test('confirm delete shows dialog with member name', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-delete'));
    await waitFor(() => {
      expect(screen.getByTestId('dialog-message')).toHaveTextContent(/张伟/);
    });
  });

  test('cancel delete closes dialog', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-delete'));
    await waitFor(() => {
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancel-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });

  test('confirm delete removes member and redirects', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-delete'));
    await waitFor(() => {
      expect(screen.getByTestId('confirm-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/members');
    });
  });

  // ====== 边界情况 ======

  test('shows not found for invalid member id', () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'nonexistent' });
    renderPage();
    expect(screen.getByText('会员不存在或已被删除')).toBeInTheDocument();
  });

  test('displays status badge for member tier', async () => {
    renderPage();
    await waitFor(() => {
      const badges = screen.getAllByTestId('status-badge');
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });
  });

  test('displays member store name', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Demo Store 旗舰店/)).toBeInTheDocument();
    });
  });

  test('displays member total visits', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('156')).toBeInTheDocument();
    });
  });

  test('displays member last visit date', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('2026-06-22')).toBeInTheDocument();
    });
  });

  test('displays member birthday', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('1990-05-20')).toBeInTheDocument();
    });
  });

  test('displays member address', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/上海市浦东新区张江高科技园区/)).toBeInTheDocument();
    });
  });

  test('displays member join date', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('2025-01-15')).toBeInTheDocument();
    });
  });

  test('displays member notes', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/每次到店消费金额较高/)).toBeInTheDocument();
    });
  });
});
