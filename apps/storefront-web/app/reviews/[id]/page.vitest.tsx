import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'r1' }),
}));

// ---- Mock for reviews-data ----
vi.mock('../reviews-data', () => ({
  MOCK_REVIEWS: [
    {
      reviewId: 'r1',
      storeCode: 'store-1',
      storeName: 'Demo Store 旗舰店',
      rating: 5,
      content: '非常棒的体验，环境好服务态度也很好！',
      tags: ['环境好', '服务好'],
      author: { userId: 'u1', nickname: '张三', memberTier: '钻石会员' },
      createdAt: '2026-07-01T10:00:00Z',
      status: 'published',
      images: [],
      likes: 42,
      reply: '感谢您的评价，期待再次光临！',
      repliedAt: '2026-07-02T08:00:00Z',
    },
    {
      reviewId: 'r2',
      storeCode: 'store-2',
      storeName: 'Demo Store 社区店',
      rating: 3,
      content: '一般般，排队时间有点长',
      tags: ['排队久'],
      author: { userId: 'u2', nickname: '李四' },
      createdAt: '2026-07-03T14:00:00Z',
      status: 'hidden',
      images: [],
      likes: 8,
      reply: null,
      repliedAt: null,
    },
    {
      reviewId: 'r3',
      storeCode: 'store-1',
      storeName: 'Demo Store 旗舰店',
      rating: 2,
      content: '体验较差，需要改进',
      tags: ['建议改善'],
      author: { userId: 'u3', nickname: '赵六', memberTier: '银卡会员' },
      createdAt: '2026-07-04T09:00:00Z',
      status: 'pending',
      images: [],
      likes: 3,
      reply: null,
      repliedAt: null,
    },
  ],
  type Rating: {},
  type ReviewStatus: {},
  type ReviewTag: {},
}));

// ---- Mock @m5/ui ----

vi.mock('@m5/ui', () => ({
  DetailShell: ({ children, title, subtitle, backLink, actions }: any) => (
    <div data-testid="detail-shell" data-title={title} data-subtitle={subtitle}>
      {backLink && <a href={backLink.href} data-testid="back-link">{backLink.label}</a>}
      {actions && (
        <div data-testid="detail-actions">
          {actions.map((a: any) => (
            <button
              key={a.key}
              data-testid={`action-${a.key}`}
              onClick={a.onClick}
              disabled={a.disabled}
              data-loading={a.loading}
            >
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
  StatusBadge: ({ label, variant, size, dot }: any) => (
    <span data-testid="status-badge" data-variant={variant} data-size={size} data-dot={dot}>
      {label}
    </span>
  ),
  Button: ({ children, onClick, disabled, loading, variant, size }: any) => (
    <button
      data-testid={`btn-${variant || 'default'}`}
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading}
    >
      {loading ? '处理中...' : children}
    </button>
  ),
  DetailActionBar: ({ children }: any) => <div data-testid="detail-action-bar">{children}</div>,
  DetailClosureBar: ({ heading, caption, links }: any) => (
    <div data-testid="detail-closure-bar">
      <div>{heading}</div>
      <div>{caption}</div>
      {links?.map((l: any) => <a key={l.key} href={l.href}>{l.title}</a>)}
    </div>
  ),
  DescriptionList: ({ items }: any) => <div data-testid="description-list" />,
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
  FormField: ({ label, children, required }: any) => (
    <div data-testid="form-field">
      <label>{label}{required && ' *'}</label>
      {children}
    </div>
  ),
  FormSubmitFeedback: ({ state }: any) => (
    <div data-testid="form-feedback">
      {state?.successMessage ? <span data-testid="success-msg">{state.successMessage}</span> : null}
      {state?.errorMessage ? <span data-testid="error-msg">{state.errorMessage}</span> : null}
    </div>
  ),
  SubmitButton: ({ children, loading, ...rest }: any) => (
    <button data-testid="submit-btn" disabled={loading} {...rest}>{loading ? '提交中...' : children}</button>
  ),
  useFormSubmit: ({ onSubmit, successMessage }: any) => {
    const submit = vi.fn(async () => {
      try {
        await onSubmit();
        return undefined;
      } catch (e: any) {
        throw e;
      }
    });
    return {
      submit,
      state: { isSubmitting: false, errorMessage: null, successMessage: null },
      reset: vi.fn(),
    };
  },
  WorkspaceBreadcrumb: ({ workspaceLabel, workspaceHref, detailLabel }: any) => (
    <div data-testid="workspace-breadcrumb">
      <a href={workspaceHref}>{workspaceLabel}</a> / {detailLabel}
    </div>
  ),
}));

// ---- Test Subject ----

import ReviewDetailPage from './page';

function renderPage() {
  return render(<ReviewDetailPage />);
}

describe('ReviewDetailPage — 评价详情页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('renders page without crashing', () => {
    expect(() => renderPage()).not.toThrow();
  });

  test('renders DetailShell with correct title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-shell')).toHaveAttribute('data-title', '张三 的评价');
    });
  });

  test('renders breadcrumb navigation', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('workspace-breadcrumb')).toBeInTheDocument();
    });
  });

  test('renders review author nickname', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
  });

  test('renders store name', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Demo Store 旗舰店')).toBeInTheDocument();
    });
  });

  test('renders review content', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('非常棒的体验，环境好服务态度也很好！')).toBeInTheDocument();
    });
  });

  test('renders star rating', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/5\/5/)).toBeInTheDocument();
    });
  });

  test('renders review tags', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('环境好')).toBeInTheDocument();
      expect(screen.getByText('服务好')).toBeInTheDocument();
    });
  });

  test('renders status badge', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('status-badge')).toHaveTextContent('已发布');
    });
  });

  test('renders merchant reply section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('商家回复')).toBeInTheDocument();
      expect(screen.getByText('感谢您的评价，期待再次光临！')).toBeInTheDocument();
    });
  });

  test('renders back link', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('back-link')).toHaveTextContent('返回评价列表');
    });
  });

  test('renders detail actions section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-actions')).toBeInTheDocument();
    });
  });

  test('shows "编辑" action button in view mode', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toHaveTextContent('编辑');
    });
  });

  test('renders closure bar', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-closure-bar')).toBeInTheDocument();
    });
  });

  test('renders closure bar links', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('返回评价列表')).toBeInTheDocument();
    });
  });

  // ====== 编辑功能测试 ======

  test('clicking edit switches to edit mode', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-edit'));
    await waitFor(() => {
      expect(screen.getByText('编辑评价')).toBeInTheDocument();
    });
  });

  test('edit mode shows textarea with review content', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-edit'));
    await waitFor(() => {
      const textarea = document.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('非常棒的体验，环境好服务态度也很好！');
    });
  });

  test('edit mode shows save and cancel buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-edit'));
    await waitFor(() => {
      expect(screen.getByTestId('action-save')).toHaveTextContent('保存');
      expect(screen.getByTestId('action-cancel')).toHaveTextContent('取消');
    });
  });

  test('canceling edit restores view mode', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-edit'));
    await waitFor(() => {
      expect(screen.getByTestId('action-cancel')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('action-cancel'));
    await waitFor(() => {
      expect(screen.getByTestId('action-edit')).toHaveTextContent('编辑');
    });
  });

  // ====== 状态流转测试 ======

  test('renders status transition buttons for published review', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('状态流转')).toBeInTheDocument();
    });
  });

  test('shows hidden transition button for published', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('隐藏评价')).toBeInTheDocument();
    });
  });

  test('delete button is present', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('删除评价')).toBeInTheDocument();
    });
  });

  // ====== 删除确认测试 ======

  test('delete button opens confirm dialog', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('删除评价')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('删除评价'));
    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
  });

  test('confirm dialog shows correct message', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('删除评价')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('删除评价'));
    await waitFor(() => {
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('确认删除');
    });
  });

  test('confirm delete shows deleted state', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('删除评价')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('删除评价'));
    await waitFor(() => {
      expect(screen.getByTestId('confirm-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => {
      expect(screen.getByText(/已成功删除/)).toBeInTheDocument();
    });
  });

  test('cancel delete closes dialog', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('删除评价')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('删除评价'));
    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancel-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });

  // ====== 边界情况 ======

  test('shows not found state for invalid id', () => {
    // Override params to return non-existent id
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'nonexistent' });
    renderPage();
    expect(screen.getByText('评价未找到')).toBeInTheDocument();
    expect(screen.getByText(/ID: nonexistent/)).toBeInTheDocument();
  });

  test('shows not found state subtitle', () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'nonexistent' });
    renderPage();
    expect(screen.getByText(/请检查评价 ID/)).toBeInTheDocument();
  });

  test('not found page has back link to /reviews', () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'nonexistent' });
    renderPage();
    const backLink = screen.getByText('返回评价列表');
    expect(backLink.closest('a')).toHaveAttribute('href', '/reviews');
  });

  test('transition button click calls handleTransition', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('隐藏评价')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('隐藏评价'));
    // After transition, the status should change
    await waitFor(() => {
      // The badge should show new status
      expect(screen.getByText('重新发布')).toBeInTheDocument();
    });
  });

  test('review shows likes count', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  test('review shows member tier', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('钻石会员')).toBeInTheDocument();
    });
  });

  test('review shows creation time', async () => {
    renderPage();
    await waitFor(() => {
      const timeElements = screen.getAllByText(/2026/);
      expect(timeElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
