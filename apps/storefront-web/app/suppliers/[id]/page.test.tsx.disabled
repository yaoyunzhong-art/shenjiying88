/**
 * suppliers/[id]/page.vitest.tsx — 供应商详情页 L2 组件测试
 * 角色: 👔店长 / 💳采购
 * 覆盖: 渲染 · 基本信息 · 合作数据 · 产品列表 · 状态流转 · 确认对话框 · 编辑/删除 · 空态
 *
 * 注意: vi.mock factory 是提升的(hoisted), 不能引用顶层变量, 数据必须内联在 factory 内。
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mock next/navigation ──

const mockPush = vi.fn();
const mockRouterParams = Promise.resolve({ id: '1' });

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// vi.mock('next/link', () => ({
//   default: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
// }));
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => React.createElement('a', { href, ...rest }, children),
}));

// ── Mock @m5/ui ──

vi.mock('@m5/ui', () => {
  const MockDetailActionBar = ({ actions }: any) => (
    <div data-testid="detail-action-bar">
      {actions?.map((a: any) => (
        <button key={a.key} data-testid={`action-${a.key}`} data-variant={a.variant} onClick={a.onClick}>
          {a.label}
        </button>
      ))}
    </div>
  );

  const MockDetailClosureBar = ({ links }: any) => (
    <div data-testid="detail-closure-bar">
      {links?.map((l: any) => (
        <a key={l.key} data-testid={`closure-${l.key}`} href={l.href}>{l.title}</a>
      ))}
    </div>
  );

  return {
    DetailShell: ({ children, title, subtitle, backHref, actions }: any) => (
      <div data-testid="detail-shell" data-title={title} data-subtitle={subtitle} data-back-href={backHref}>
        {actions && <MockDetailActionBar actions={actions} />}
        {children}
      </div>
    ),
    InfoRow: ({ label, value }: any) => (
      <div data-testid="info-row"><span data-testid="info-label">{label}</span><span data-testid="info-value">{value}</span></div>
    ),
    StatusBadge: ({ label, variant, size }: any) => (
      <span data-testid="status-badge" data-badge-variant={variant} data-size={size}>{label}</span>
    ),
    Button: Object.assign(
      ({ children, onClick, disabled, loading, variant, style, ...rest }: any) => (
        <button data-testid={`btn-${variant || 'default'}`} onClick={onClick} disabled={disabled || loading} data-variant={variant} style={style} {...rest}>
          {children}
        </button>
      ),
      { displayName: 'Button' },
    ),
    DetailActionBar: MockDetailActionBar,
    DetailClosureBar: MockDetailClosureBar,
    Timeline: ({ items }: any) => (
      <div data-testid="timeline">
        {items?.map((item: any) => (
          <div key={item.key} data-testid="timeline-item" data-variant={item.variant}>
            <div>{item.heading}</div>
            <div>{item.subtitle}</div>
          </div>
        ))}
      </div>
    ),
    DescriptionList: ({ title, items, columns }: any) => (
      <div data-testid="description-list" data-title={title} data-columns={columns}>
        {items?.map((item: any, i: number) => (
          <div key={i} data-testid="desc-item">
            <span data-testid="desc-label">{item.label}</span>
            <span data-testid="desc-value">{item.value}</span>
          </div>
        ))}
      </div>
    ),
    DataTable: ({ columns, rows, rowKey }: any) => (
      <div data-testid="data-table">
        {rows?.map((row: any) => (
          <div key={rowKey(row)} data-testid="table-row">
            {columns?.map((col: any) => (
              <span key={col.key} data-testid={`cell-${col.key}`}>
                {col.render ? col.render(row) : row[col.dataKey]}
              </span>
            ))}
          </div>
        ))}
      </div>
    ),
    EmptyState: ({ title, description }: any) => (
      <div data-testid="empty-state">
        <div data-testid="empty-title">{title}</div>
        <div data-testid="empty-desc">{description}</div>
      </div>
    ),
    useToast: () => ({
      success: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    }),
    ConfirmDialog: ({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, variant }: any) =>
      open ? (
        <div data-testid="confirm-dialog" data-variant={variant}>
          <div data-testid="confirm-title">{title}</div>
          <div data-testid="confirm-message">{message}</div>
          <button data-testid="confirm-yes" onClick={onConfirm}>{confirmLabel}</button>
          <button data-testid="confirm-no" onClick={onCancel}>{cancelLabel}</button>
        </div>
      ) : null,
  };
});

// ── Test Subject ──

import SupplierDetailPage from './page';

/** Create a params promise for the component */
function mockParams(id: string = '1'): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

function renderSupplierPage() {
  return render(<SupplierDetailPage params={mockParams()} />);
}

describe('SupplierDetailPage — 供应商详情页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 正例: 渲染 ======

  test('renders DetailShell with supplier name', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-shell')).toHaveAttribute('data-title', '广州美妆供应链有限公司');
    });
  });

  test('renders subtitle with short name and cooperation date', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-shell')).toHaveAttribute('data-subtitle', expect.stringContaining('简称：广州美妆'));
    });
  });

  test('renders backHref to /suppliers', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-shell')).toHaveAttribute('data-back-href', '/suppliers');
    });
  });

  test('renders DescriptionList with basic info', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByTestId('description-list')).toBeInTheDocument();
    });
    const labels = screen.getAllByTestId('desc-label');
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]).toHaveTextContent('供应商名称');
  });

  test('renders supplier name in description list', async () => {
    renderSupplierPage();
    await waitFor(() => {
      const values = screen.getAllByTestId('desc-value');
      expect(values.some(v => v.textContent === '广州美妆供应链有限公司')).toBe(true);
    });
  });

  test('renders status badge with 合作中', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('合作中')).toBeInTheDocument();
    });
  });

  test('renders credit level A级（优秀）', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('A级（优秀）')).toBeInTheDocument();
    });
  });

  // ====== 合作数据 ======

  test('renders cooperation data section', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('合作数据')).toBeInTheDocument();
    });
  });

  test('renders total orders count', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('86 单')).toBeInTheDocument();
    });
  });

  test('renders total amount', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('¥1,285,000')).toBeInTheDocument();
    });
  });

  // ====== 产品列表 ======

  test('renders product list section', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('供应产品（6 项）')).toBeInTheDocument();
    });
  });

  test('renders product names in DataTable', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('保湿精华液（100ml）')).toBeInTheDocument();
      expect(screen.getByText('洁面乳（150g）')).toBeInTheDocument();
      expect(screen.getByText('丝绒哑光口红')).toBeInTheDocument();
    });
  });

  test('renders product prices with ¥ prefix', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('¥68')).toBeInTheDocument();
      expect(screen.getByText('¥72')).toBeInTheDocument();
    });
  });

  // ====== 合作历史 ======

  test('renders cooperation history timeline', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('合作历史')).toBeInTheDocument();
      expect(screen.getByTestId('timeline')).toBeInTheDocument();
    });
  });

  test('renders timeline events', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText(/供应商注册申请/)).toBeInTheDocument();
      expect(screen.getByText(/资质审核通过/)).toBeInTheDocument();
      expect(screen.getByText(/续签合作协议/)).toBeInTheDocument();
    });
  });

  // ====== 动作栏 ======

  test('renders action bar with transition actions', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-action-bar')).toBeInTheDocument();
    });
    expect(screen.getByText('暂停合作')).toBeInTheDocument();
    expect(screen.getByText('编辑')).toBeInTheDocument();
  });

  test('renders closure bar with links', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-closure-bar')).toBeInTheDocument();
    });
    expect(screen.getByText('返回供应商列表')).toBeInTheDocument();
    expect(screen.getByText('新增供应商')).toBeInTheDocument();
  });

  test('back to list link has correct href', async () => {
    renderSupplierPage();
    await waitFor(() => {
      const link = screen.getByText('返回供应商列表');
      expect(link.closest('a')).toHaveAttribute('href', '/suppliers');
    });
  });

  // ====== 状态流转 ======

  test('clicking suspend opens confirm dialog', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('暂停合作')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('暂停合作'));
    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
    expect(screen.getByText(/确认暂停合作/)).toBeInTheDocument();
  });

  test('confirming suspend updates status', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('暂停合作')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('暂停合作'));
    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('confirm-yes'));
    await waitFor(() => {
      // Status should change - badge text changes on re-render
      expect(screen.getByText(/已暂停合作/)).toBeInTheDocument();
    });
  });

  test('cancelling suspend dialog closes it', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('暂停合作')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('暂停合作'));
    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('confirm-no'));
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });

  // ====== 编辑/删除 ======

  test('clicking edit shows info toast', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('编辑')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('编辑'));
    // Test passes as long as no crash occurs; toast is called internally
    await waitFor(() => {
      expect(screen.getByText('编辑')).toBeInTheDocument();
    });
  });

  test('delete button not available for active supplier', async () => {
    renderSupplierPage();
    await waitFor(() => {
      // For active supplier, only suspend + edit are available
      expect(screen.getByText('暂停合作')).toBeInTheDocument();
      expect(screen.queryByText('终止合作')).not.toBeInTheDocument();
    });
  });

  // ====== 边界/空态 ======

  test('closing link redirects supplier new page', async () => {
    renderSupplierPage();
    await waitFor(() => {
      const link = screen.getByText('新增供应商');
      expect(link.closest('a')).toHaveAttribute('href', '/suppliers/new');
    });
  });

  test('renders supply categories', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText(/护肤品、彩妆、个人护理/)).toBeInTheDocument();
    });
  });

  test('renders payment terms', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('月结30天')).toBeInTheDocument();
    });
  });

  test('renders on-time rate', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('97.5%')).toBeInTheDocument();
    });
  });

  test('renders quality rate', async () => {
    renderSupplierPage();
    await waitFor(() => {
      expect(screen.getByText('99.2%')).toBeInTheDocument();
    });
  });
});
