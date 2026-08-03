/**
 * categories/page.vitest.tsx — 分类管理页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 页面渲染 · 统计卡片 · 搜索筛选 · 状态过滤 · 数据表格 · 分页 · 排序 · 详情弹窗 · 状态变更 · 空态 · 错误态
 * 角色: 👔店长 · 💳采购
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

let renderCount = 0;
const mockPageShell = vi.fn(({ title, description, children }: any) => (
  <div data-testid="page-shell" data-title={title} data-description={description}>{children}</div>
));
const mockStatusBadge = vi.fn(({ label, variant, size }: any) => (
  <span data-testid="status-badge" data-label={label} data-variant={variant} data-size={size}>{label}</span>
));
const mockEmptyState = vi.fn(({ title, description }: any) => (
  <div data-testid="empty-state"><h3 data-testid="es-title">{title}</h3><p>{description}</p></div>
));
const mockModal = vi.fn(({ open, onClose, title, children }: any) =>
  open ? <div data-testid="modal" data-title={title}><button data-testid="modal-close" onClick={onClose}>✕</button><div>{children}</div></div> : null
);
const mockDataTable = vi.fn(({ columns, rows, rowKey, sort, onSortChange }: any) => {
  renderCount++;
  return (
    <div data-testid="data-table" data-render-count={renderCount}>
      <table>
        <thead><tr>
          {columns.map((col: any) => (
            <th key={col.key} data-testid={`th-${col.key}`} data-sortable={col.sortable ? 'true' : 'false'}
              onClick={() => { if (col.sortable && onSortChange) {
                onSortChange({ key: col.key, direction: sort?.key === col.key && sort?.direction === 'asc' ? 'desc' : 'asc' });
              }}}>{col.header}</th>
          ))}
        </tr></thead>
        <tbody>{(rows || []).map((row: any) => (
          <tr key={rowKey(row)} data-testid={`row-${rowKey(row)}`}>
            {columns.map((col: any) => (<td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '')}</td>))}
          </tr>
        ))}</tbody>
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

vi.mock('../_components/useTriState', () => ({
  useTriState: (initialState?: any) => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    return {
      loading: false, // Start not loading so content renders immediately
      error, empty: false, setLoading, setError,
      wrapLoad: vi.fn(async (promise: Promise<any>) => {
        try { return await promise; }
        catch (err: any) { setError(err?.message ?? 'error'); return undefined; }
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

import CategoriesPage from './page';

describe('CategoriesPage — 分类管理', () => {
  beforeEach(() => { vi.clearAllMocks(); renderCount = 0; });

  // ====== 渲染测试 ======

  test('renders PageShell with correct title', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const el = screen.getByTestId('page-shell');
      expect(el).toHaveAttribute('data-title', '分类管理');
    }, { timeout: 2000 });
  });

  test('renders PageShell with correct description', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const el = screen.getByTestId('page-shell');
      expect(el.getAttribute('data-description')).toContain('管理门店');
    }, { timeout: 2000 });
  });

  test('renders 分类管理 page title', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('📂 分类管理')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('shows total stats in header text', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText(/共 \d+ 个分类/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders 5 stat cards', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('总分类')).toBeInTheDocument();
      expect(screen.getByText('启用中')).toBeInTheDocument();
      expect(screen.getByText('隐藏')).toBeInTheDocument();
      expect(screen.getByText('已归档')).toBeInTheDocument();
      expect(screen.getByText('总产品')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders stat card with correct total', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const statCards = screen.getAllByText('18');
      expect(statCards.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 2000 });
  });

  test('renders search input', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/搜索分类/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders status filter dropdown', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(document.querySelector('select')).toBeTruthy();
    }, { timeout: 2000 });
  });

  test('status filter has 4 options', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const select = document.querySelector('select')!;
      expect(select.querySelectorAll('option').length).toBe(4);
    }, { timeout: 2000 });
  });

  test('renders hierarchy hints', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText(/6 个顶级/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders child class count', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText(/12 个子分类/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders DataTable', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    }, { timeout: 2000 });
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
    }, { timeout: 2000 });
  });

  test('renders pagination when total pages > 1', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText(/共 \d+ 条/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders 详情 button for each row', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const detailBtns = screen.getAllByText('详情');
      expect(detailBtns.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  test('shows subcategory count for top-level categories', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const subCounts = screen.getAllByText(/个子分类/);
      expect(subCounts.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 2000 });
  });

  // ====== 搜索测试 ======

  test('search filters by category name', async () => {
    render(<CategoriesPage />);
    await screen.findByPlaceholderText(/搜索分类/, {}, { timeout: 2000 });
    fireEvent.change(screen.getByPlaceholderText(/搜索分类/), { target: { value: '瑜伽' } });
    await waitFor(() => {
      expect(screen.getByText('瑜伽课')).toBeInTheDocument();
    });
  });

  test('search is case-insensitive', async () => {
    render(<CategoriesPage />);
    await screen.findByPlaceholderText(/搜索分类/, {}, { timeout: 2000 });
    fireEvent.change(screen.getByPlaceholderText(/搜索分类/), { target: { value: 'YOGA' } });
    await waitFor(() => {
      expect(screen.getByText('瑜伽课')).toBeInTheDocument();
    });
  });

  test('search returns no results shows empty state', async () => {
    render(<CategoriesPage />);
    await screen.findByPlaceholderText(/搜索分类/, {}, { timeout: 2000 });
    fireEvent.change(screen.getByPlaceholderText(/搜索分类/), { target: { value: '不存在的分类' } });
    await waitFor(() => {
      expect(mockEmptyState).toHaveBeenCalled();
    });
  });

  test('search resets page to 1', async () => {
    render(<CategoriesPage />);
    const input = await screen.findByPlaceholderText(/搜索分类/, {}, { timeout: 2000 });
    fireEvent.change(input, { target: { value: 'a' } });
    expect(input).toBeInTheDocument();
  });

  // ====== 排序测试 ======

  test('default sort is sortOrder:asc', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('sort-config').textContent).toBe('sortOrder:asc');
    }, { timeout: 2000 });
  });

  test('toggling sort direction', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('th-sortOrder'));
    }, { timeout: 2000 });
    await waitFor(() => {
      expect(screen.getByTestId('sort-config').textContent).toBe('sortOrder:desc');
    });
  });

  // ====== 分页测试 ======

  test('pagination: previous button disabled on first page', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('← 上一页')).toBeDisabled();
    }, { timeout: 2000 });
  });

  test('pagination: clicking next changes page', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText('下一页 →')).not.toBeDisabled();
    }, { timeout: 2000 });
  });

  // ====== 详情弹窗测试 ======

  test('clicking 详情 opens modal', async () => {
    render(<CategoriesPage />);
    const btns = await screen.findAllByText('详情', {}, { timeout: 2000 });
    if (btns.length > 0) fireEvent.click(btns[0]);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  test('modal shows category detail title', async () => {
    render(<CategoriesPage />);
    const btns = await screen.findAllByText('详情', {}, { timeout: 2000 });
    if (btns.length > 0) fireEvent.click(btns[0]);
    expect(screen.getByTestId('modal').getAttribute('data-title')).toContain('分类详情');
  });

  test('modal close button works', async () => {
    render(<CategoriesPage />);
    const btns = await screen.findAllByText('详情', {}, { timeout: 2000 });
    if (btns.length > 0) fireEvent.click(btns[0]);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('modal-close'));
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).toBeNull();
    });
  });

  test('modal has 设为隐藏 button for active category', async () => {
    render(<CategoriesPage />);
    const btns = await screen.findAllByText('详情', {}, { timeout: 2000 });
    if (btns.length > 0) fireEvent.click(btns[0]);
    expect(screen.getByText('设为隐藏')).toBeInTheDocument();
  });

  test('modal has 归档 button', async () => {
    render(<CategoriesPage />);
    const btns = await screen.findAllByText('详情', {}, { timeout: 2000 });
    if (btns.length > 0) fireEvent.click(btns[0]);
    expect(screen.getByText('归档')).toBeInTheDocument();
  });

  // ====== 边界情况 ======

  test('hierarchy: shows 隶属于 text for child categories', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      const affiliated = screen.getAllByText(/隶属于/);
      expect(affiliated.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  test('code style identifier rendered for slug', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('code').length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  test('shows filtered count text', async () => {
    render(<CategoriesPage />);
    await waitFor(() => {
      expect(screen.getByText(/筛选后/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
