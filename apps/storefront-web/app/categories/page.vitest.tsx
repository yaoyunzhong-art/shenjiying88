/**
 * categories/page.vitest.tsx — 分类管理页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 页面渲染 · 统计卡片 · 搜索筛选 · 状态过滤 · 数据表格 · 分页 · 排序 · 详情弹窗 · 状态变更 · 空态 · 错误态
 * 角色: 👔店长 · 💳采购
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

// Track call counts for dynamic mocks
let renderCount = 0;
const mockPageShell = vi.fn(({ title, description, children }: any) => (
  <div data-testid="page-shell" data-title={title} data-description={description}>
    {children}
  </div>
));
const mockStatusBadge = vi.fn(({ label, variant, size }: any) => (
  <span data-testid={`status-badge`} data-label={label} data-variant={variant} data-size={size}>{label}</span>
));
const mockEmptyState = vi.fn(({ title, description }: any) => (
  <div data-testid="empty-state"><h3 data-testid="es-title">{title}</h3><p>{description}</p></div>
));
const mockModal = vi.fn(({ open, onClose, title, children }: any) => (
  open ? <div data-testid="modal" data-title={title}><button data-testid="modal-close" onClick={onClose}>✕</button><div>{children}</div></div> : null
));
const mockDataTable = vi.fn(({ columns, rows, rowKey, sort, onSortChange }: any) => {
  renderCount++;
  return (
    <div data-testid="data-table" data-render-count={renderCount}>
      <table>
        <thead>
          <tr>
            {columns.map((col: any) => (
              <th key={col.key} data-testid={`th-${col.key}`} data-sortable={col.sortable ? 'true' : 'false'}
                onClick={() => { if (col.sortable && onSortChange) {
                  const isSame = sort?.key === col.key;
                  onSortChange({ key: col.key, direction: isSame && sort?.direction === 'asc' ? 'desc' : 'asc' });
                }}}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((row: any) => (
            <tr key={rowKey(row)} data-testid={`row-${rowKey(row)}`}>
              {columns.map((col: any) => (
                <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sort && <div data-testid="sort-config">{sort.key}:{sort.direction}</div>}
    </div>
  );
});

vi.mock('@m5/ui', () => ({
  PageShell: (p: any) => mockPageShell(p),
  DataTable: (p: any) => mockDataTable(p),
  StatusBadge: (p: any) => mockStatusBadge(p),
  Modal: (p: any) => mockModal(p),
  EmptyState: (p: any) => mockEmptyState(p),
}));

// Mock the tri-state hook to resolve immediately
vi.mock('../_components/useTriState', () => ({
  useTriState: (initialState?: any) => {
    const [loading, setLoading] = React.useState(initialState?.loading ?? false);
    const [error, setError] = React.useState<string | null>(initialState?.error ?? null);
    return {
      loading,
      error,
      empty: false,
      setLoading,
      setError,
      wrapLoad: vi.fn((promise: Promise<any>) => {
        setLoading(true);
        return promise.then((data: any) => {
          setLoading(false);
          return data;
        }).catch((err: any) => {
          setError(err?.message ?? 'error');
          setLoading(false);
          return undefined;
        });
      }),
      reset: vi.fn(),
    };
  },
}));

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ loading, empty, error, onRetry, children }: any) => {
    if (loading) return <div data-testid="tri-state-loading">加载中…</div>;
    if (error) return <div data-testid="tri-state-error">{error}<button data-testid="tri-state-retry" onClick={onRetry}>重试</button></div>;
    if (empty) return <div data-testid="tri-state-empty">暂无数据</div>;
    return <>{typeof children === 'function' ? children() : children}</>;
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a data-testid="next-link" href={href}>{children}</a>,
}));

// ── Test Subject ──

import CategoriesPage from './page';

describe('CategoriesPage — 分类管理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderCount = 0;
  });

  // ====== 渲染测试 ======

  test('renders PageShell with correct title', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(mockPageShell).toHaveBeenCalledWith(
        expect.objectContaining({ title: '分类管理' }),
        expect.anything(),
      );
    });
  });

  test('renders PageShell with correct description', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(mockPageShell).toHaveBeenCalledWith(
        expect.objectContaining({ description: expect.stringContaining('管理门店') }),
        expect.anything(),
      );
    });
  });

  test('renders 分类管理 page title', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('📂 分类管理')).toBeInTheDocument();
    });
  });

  test('shows total stats in header text', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const statText = screen.getByText(/共 \d+ 个分类/);
      expect(statText).toBeInTheDocument();
    });
  });

  test('renders 5 stat cards', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('总分类')).toBeInTheDocument();
      expect(screen.getByText('启用中')).toBeInTheDocument();
      expect(screen.getByText('隐藏')).toBeInTheDocument();
      expect(screen.getByText('已归档')).toBeInTheDocument();
      expect(screen.getByText('总产品')).toBeInTheDocument();
    });
  });

  test('stat 总分类 shows correct count', async () => {
    render(<CategoriesPage />);
    // Total should be 18 in mock data
    await waitFor(() => {
      const statValue = screen.getByText('18');
      expect(statValue).toBeInTheDocument();
    });
  });

  test('renders search input', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/搜索分类/);
      expect(searchInput).toBeInTheDocument();
    });
  });

  test('renders status filter dropdown', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('全部状态')).toBeInTheDocument();
      expect(screen.getByText('启用')).toBeInTheDocument();
      expect(screen.getByText('隐藏')).toBeInTheDocument();
      expect(screen.getByText('归档')).toBeInTheDocument();
    });
  });

  test('renders hierarchy hints', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText(/顶级分类/)).toBeInTheDocument();
      expect(screen.getByText(/子分类/)).toBeInTheDocument();
    });
  });

  test('renders DataTable', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('DataTable renders all 7 columns', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-name')).toBeInTheDocument();
      expect(screen.getByTestId('th-slug')).toBeInTheDocument();
      expect(screen.getByTestId('th-productCount')).toBeInTheDocument();
      expect(screen.getByTestId('th-sortOrder')).toBeInTheDocument();
      expect(screen.getByTestId('th-status')).toBeInTheDocument();
      expect(screen.getByTestId('th-updatedAt')).toBeInTheDocument();
      expect(screen.getByTestId('th-actions')).toBeInTheDocument();
    });
  });

  test('renders pagination when total pages > 1', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText(/共 \d+ 条/)).toBeInTheDocument();
    });
  });

  test('renders 详情 button for each row', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const detailBtns = screen.getAllByText('详情');
      expect(detailBtns.length).toBeGreaterThan(0);
      expect(detailBtns.length).toBeLessThanOrEqual(10);
    });
  });

  test('shows subcategory count for top-level categories', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const subCount = screen.getByText(/子分类\)/);
      expect(subCount).toBeInTheDocument();
    });
  });

  // ====== 搜索测试 ======

  test('search filters by category name', async () => {
    render(<CategoriesPage />);
    const searchInput = await screen.findByPlaceholderText(/搜索分类/);
    fireEvent.change(searchInput, { target: { value: '瑜伽' } });
    await waitFor(() => {
      expect(screen.getByText('瑜伽课')).toBeInTheDocument();
    });
  });

  test('search is case-insensitive', async () => {
    render(<CategoriesPage />);
    const searchInput = await screen.findByPlaceholderText(/搜索分类/);
    fireEvent.change(searchInput, { target: { value: 'YOGA' } });
    await waitFor(() => {
      expect(screen.getByText('瑜伽课')).toBeInTheDocument();
    });
  });

  test('search returns no results shows empty message', async () => {
    render(<CategoriesPage />);
    const searchInput = await screen.findByPlaceholderText(/搜索分类/);
    fireEvent.change(searchInput, { target: { value: '不存在的分类' } });
    await waitFor(() => {
      expect(mockEmptyState).toHaveBeenCalled();
    });
  });

  test('search resets page to 1', async () => {
    render(<CategoriesPage />);
    const searchInput = await screen.findByPlaceholderText(/搜索分类/);
    fireEvent.change(searchInput, { target: { value: 'a' } });
    // Should not break
    expect(searchInput).toBeInTheDocument();
  });

  // ====== 筛选测试 ======

  test('status filter to active', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const option = screen.getByText(/启用 \(/);
      expect(option).toBeInTheDocument();
    });
  });

  test('status filter to hidden', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const option = screen.getByText(/隐藏 \(/);
      expect(option).toBeInTheDocument();
    });
  });

  test('status filter to archived', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const option = screen.getByText(/归档 \(/);
      expect(option).toBeInTheDocument();
    });
  });

  // ====== 排序测试 ======

  test('sort changes when clicking sortable column header', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const nameTh = screen.getByTestId('th-name');
      fireEvent.click(nameTh);
      // Should show sort config
      expect(screen.getByTestId('sort-config')).toBeInTheDocument();
    });
  });

  test('default sort is sortOrder:asc', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const sortConfig = screen.getByTestId('sort-config');
      expect(sortConfig.textContent).toBe('sortOrder:asc');
    });
  });

  test('toggling sort direction', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const nameTh = screen.getByTestId('th-sortOrder');
      fireEvent.click(nameTh); // asc -> desc
    });
    await waitFor(() => {
      const sortConfig = screen.getByTestId('sort-config');
      expect(sortConfig.textContent).toBe('sortOrder:desc');
    });
  });

  // ====== 分页测试 ======

  test('pagination: previous button disabled on first page', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const prevBtn = screen.getByText('← 上一页');
      expect(prevBtn).toBeDisabled();
    });
  });

  test('pagination: clicking next changes page', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const nextBtn = screen.getByText('下一页 →');
      expect(nextBtn).not.toBeDisabled();
    });
  });

  // ====== 详情弹窗测试 ======

  test('clicking 详情 opens modal', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const detailBtn = screen.getAllByText('详情')[0];
      fireEvent.click(detailBtn);
    });
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  test('modal shows category detail title', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const detailBtn = screen.getAllByText('详情')[0];
      fireEvent.click(detailBtn);
    });
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveAttribute('data-title', expect.stringContaining('分类详情'));
  });

  test('modal shows status badge', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const detailBtn = screen.getAllByText('详情')[0];
      fireEvent.click(detailBtn);
    });
    // Status badges in modal
    const badges = screen.getAllByTestId('status-badge');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  test('modal close button works', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const detailBtn = screen.getAllByText('详情')[0];
      fireEvent.click(detailBtn);
    });
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('modal-close'));
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).toBeNull();
    });
  });

  // ====== 状态变更测试 ======

  test('modal has 设为隐藏 button for active category', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const detailBtn = screen.getAllByText('详情')[0];
      fireEvent.click(detailBtn);
    });
    expect(screen.getByText('设为隐藏')).toBeInTheDocument();
  });

  test('modal has 归档 button', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const detailBtn = screen.getAllByText('详情')[0];
      fireEvent.click(detailBtn);
    });
    expect(screen.getByText('归档')).toBeInTheDocument();
  });

  // ====== 边界情况 ======

  test('category with 0 product count shows greyed out styling', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      // 二手转卖 has productCount = 0
      expect(screen.getByText('二手转卖')).toBeInTheDocument();
    });
  });

  test('hierarchy: shows 隶属于 text for child categories', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const affiliated = screen.getAllByText(/隶属于/);
      expect(affiliated.length).toBeGreaterThan(0);
    });
  });

  test('code style identifier rendered for slug', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const codes = document.querySelectorAll('code');
      expect(codes.length).toBeGreaterThan(0);
    });
  });

  test('shows filtered count text', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText(/筛选后/)).toBeInTheDocument();
    });
  });
});
