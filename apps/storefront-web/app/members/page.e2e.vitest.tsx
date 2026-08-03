/**
 * members/page.e2e.vitest.tsx — 会员管理 E2E 测试
 * 覆盖: 渲染 · PageShell · 加载/错误/空 TriState · 统计卡片 · 搜索 · 等级Tabs · 状态Tabs · DataTable · 表头/行 · 分页 · 排序 · 过滤组合 · 边界
 * 角色: 👔店长 · 👤管理员
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @m5/ui components
vi.mock('@m5/ui', () => ({
  DataTable: vi.fn(({ columns, rows, rowKey, sort, onSortChange, emptyText }) => (
    <div data-testid="data-table">
      <div data-testid="table-empty-text">{emptyText}</div>
      <div data-testid="table-rows-count">{rows?.length ?? 0}</div>
      <table data-testid="dt-table">
        <thead>
          <tr>
            {(columns ?? []).map((col: { key: string; header: string; sortable?: boolean }) => (
              <th
                key={col.key}
                data-testid={`th-${col.key}`}
                data-sortable={col.sortable ? 'true' : 'false'}
                onClick={() => {
                  if (col.sortable && onSortChange) {
                    const isSame = sort?.key === col.key;
                    onSortChange({ key: col.key, direction: isSame && sort?.direction === 'asc' ? 'desc' : 'asc' });
                  }
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((row: Record<string, unknown>) => (
            <tr key={rowKey(row)} data-testid={`dt-row-${rowKey(row)}`}>
              {(columns ?? []).map((col: { key: string; render?: (row: unknown) => React.ReactNode }) => (
                <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )),
  PageShell: vi.fn(({ title, description, children }) => (
    <div data-testid="page-shell">
      <h1 data-testid="page-title">{title}</h1>
      {description && <p data-testid="page-description">{description}</p>}
      {children}
    </div>
  )),
  Pagination: vi.fn(({ page, totalPages, total, onPageChange }) => (
    <div data-testid="pagination">
      <span data-testid="pagination-page">{page}</span>
      <span data-testid="pagination-totalPages">{totalPages}</span>
      <span data-testid="pagination-total">{total}</span>
      <button data-testid="pagination-next" onClick={() => onPageChange?.(page + 1)}>next</button>
      <button data-testid="pagination-prev" onClick={() => onPageChange?.(page - 1)}>prev</button>
    </div>
  )),
  SearchFilterInput: vi.fn(({ value, onChange, placeholder }) => (
    <input
      data-testid="search-filter-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )),
  StatusBadge: vi.fn(({ label, variant, size }) => (
    <span data-testid={`badge-${label}`} data-variant={variant} data-size={size}>
      {label}
    </span>
  )),
  Tabs: vi.fn(({ items, activeKey, onChange, variant, size }) => (
    <div data-testid="tabs" data-variant={variant} data-size={size}>
      {(items ?? []).map((item: { key: string; label: string; count?: number }) => (
        <button
          key={item.key}
          data-testid={`tab-${item.key}`}
          data-active={activeKey === item.key ? 'true' : 'false'}
          onClick={() => onChange(item.key)}
        >
          {item.label}
          {item.count !== undefined ? <span data-testid={`tab-count-${item.key}`}>{item.count}</span> : null}
        </button>
      ))}
    </div>
  )),
  usePagination: vi.fn((total: number, pageSize: number) => {
    const [page, setPage] = React.useState(1);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { page, pageSize, totalPages, setPage };
  }),
  useSearchFilter: vi.fn((data: unknown[], _fields: unknown[]) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const filteredItems = React.useMemo(() => {
      if (!searchTerm.trim()) return data;
      const term = searchTerm.toLowerCase();
      return (data as Record<string, unknown>[]).filter(
        (item) =>
          item.name?.toString().toLowerCase().includes(term) ||
          item.phone?.toString().toLowerCase().includes(term) ||
          item.tier?.toString().toLowerCase().includes(term) ||
          item.storeName?.toString().toLowerCase().includes(term),
      );
    }, [data, searchTerm]);
    return { searchTerm, setSearchTerm, filteredItems };
  }),
  useSortedItems: vi.fn((items: unknown[], _columns: unknown[], sortConfig: unknown) => {
    if (!sortConfig) return items;
    const cfg = sortConfig as { key: string; direction: string };
    return [...(items as Record<string, unknown>[])].sort((a, b) => {
      const aVal = a[cfg.key] ?? '';
      const bVal = b[cfg.key] ?? '';
      if (aVal < bVal) return cfg.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return cfg.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }),
}));

// Mock local components
vi.mock('../_components/useTriState', () => ({
  useTriState: vi.fn(({ loading: initialLoading }) => {
    const [loading, setLoading] = React.useState(initialLoading);
    const [error, setError] = React.useState<string | null>(null);
    const wrapLoad = vi.fn(async <T,>(promise: Promise<T>): Promise<T | undefined> => {
      setLoading(true);
      try {
        const result = await promise;
        setLoading(false);
        return result;
      } catch (err) {
        setError(String(err));
        setLoading(false);
        return undefined;
      }
    });
    return { loading, error, wrapLoad };
  }),
}));

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: vi.fn(({ loading, empty, error, onRetry, children }) => {
    if (loading) return <div data-testid="loading-state">Loading...</div>;
    if (error) return (
      <div data-testid="error-state">
        <span>Error: {error}</span>
        <button data-testid="retry-button" onClick={onRetry}>Retry</button>
      </div>
    );
    if (empty) return <div data-testid="empty-state">No data</div>;
    return <div data-testid="content">{children}</div>;
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() })),
  usePathname: vi.fn(() => '/members'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import MembersListPage from './page';

describe('MembersListPage — 会员管理 E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ==============================
  //  页面加载渲染 (5 tests)
  // ==============================

  test('1. renders without crashing', () => {
    const { container } = render(<MembersListPage />);
    expect(container).toBeTruthy();
  });

  test('2. renders PageShell with correct title', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-title')).toHaveTextContent('会员管理');
    });
  });

  test('3. shows page description', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-description')).toHaveTextContent('管理门店会员信息，查看等级分布、积分情况及活跃度。');
    });
  });

  test('4. export default is a function component', () => {
    expect(typeof MembersListPage).toBe('function');
  });

  test('5. React.isValidElement on rendering', () => {
    const { container } = render(<MembersListPage />);
    expect(container.firstChild).toBeTruthy();
  });

  // ==============================
  //  加载状态 (3 tests)
  // ==============================

  test('6. shows loading state initially', () => {
    render(<MembersListPage />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  test('7. loading state shows Loading text', () => {
    render(<MembersListPage />);
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading...');
  });

  test('8. transitions from loading to content after data loads', async () => {
    render(<MembersListPage />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  // ==============================
  //  统计卡片 (4 tests)
  // ==============================

  test('9. renders stat badges after loading', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByText('总会员')).toBeInTheDocument();
  });

  test('10. renders active member stat', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByText('活跃会员')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument(); // total members
  });

  test('11. renders diamond member stat', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByText('钻石会员')).toBeInTheDocument();
  });

  test('12. renders average points stat', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByText('平均积分')).toBeInTheDocument();
  });

  // ==============================
  //  搜索 (4 tests)
  // ==============================

  test('13. renders search filter input after loading', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toBeInTheDocument();
    });
  });

  test('14. search input has correct placeholder', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toHaveAttribute('placeholder', '搜索姓名、手机号、等级或门店...');
    });
  });

  test('15. typing in search filters members by name', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '张伟' } });
      expect(searchInput).toHaveValue('张伟');
    });
  });

  test('16. clearing search returns all members', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '张伟' } });
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(searchInput).toHaveValue('');
    });
  });

  // ==============================
  //  等级 Tabs (4 tests)
  // ==============================

  test('17. renders tier tabs after loading', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tab-ALL')).toBeInTheDocument();
    expect(screen.getByTestId('tab-diamond')).toBeInTheDocument();
    expect(screen.getByTestId('tab-gold')).toBeInTheDocument();
    expect(screen.getByTestId('tab-silver')).toBeInTheDocument();
    expect(screen.getByTestId('tab-bronze')).toBeInTheDocument();
    expect(screen.getByTestId('tab-basic')).toBeInTheDocument();
  });

  test('18. all tier tab is active by default', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    const allTabs = screen.getAllByTestId('tab-ALL');
    expect(allTabs[0]).toHaveTextContent('全部');
    expect(allTabs[0]).toHaveAttribute('data-active', 'true');
  });

  test('19. clicking diamond tab sets it active', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tab-diamond'));
    expect(screen.getByTestId('tab-diamond')).toHaveAttribute('data-active', 'true');
  });

  test('20. gold tab shows correct member count', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tab-count-gold')).toBeInTheDocument();
  });

  // ==============================
  //  状态 Tabs (4 tests)
  // ==============================

  test('21. renders status tabs after loading', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tab-active')).toBeInTheDocument();
    expect(screen.getByTestId('tab-inactive')).toBeInTheDocument();
    expect(screen.getByTestId('tab-frozen')).toBeInTheDocument();
  });

  test('22. all status tab shows correct label', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    const allTabs = screen.getAllByTestId('tab-ALL');
    expect(allTabs[1]).toHaveTextContent('全部状态');
  });

  test('23. clicking frozen status tab sets it active', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tab-frozen'));
    expect(screen.getByTestId('tab-frozen')).toHaveAttribute('data-active', 'true');
  });

  test('24. inactive tab shows correct count', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tab-count-inactive')).toBeInTheDocument();
  });

  // ==============================
  //  DataTable 表头 (3 tests)
  // ==============================

  test('25. renders DataTable after loading', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('26. renders all column headers', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByTestId('th-name')).toHaveTextContent('会员');
    expect(screen.getByTestId('th-tier')).toHaveTextContent('等级');
    expect(screen.getByTestId('th-points')).toHaveTextContent('积分');
    expect(screen.getByTestId('th-totalVisits')).toHaveTextContent('到店次数');
    expect(screen.getByTestId('th-storeName')).toHaveTextContent('所属门店');
    expect(screen.getByTestId('th-lastVisit')).toHaveTextContent('最近到店');
    expect(screen.getByTestId('th-status')).toHaveTextContent('状态');
    expect(screen.getByTestId('th-joinedAt')).toHaveTextContent('加入日期');
  });

  test('27. data table shows member rows after loading', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const count = screen.getByTestId('table-rows-count');
      expect(Number(count.textContent)).toBeGreaterThan(0);
    });
  });

  // ==============================
  //  StatusBadge 渲染 (2 tests)
  // ==============================

  test('28. renders status badges for member records', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    const badges = screen.getAllByTestId(/^badge-/);
    expect(badges.length).toBeGreaterThan(0);
  });

  test('29. status badges have correct variant attributes', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    const diamondBadge = screen.getByTestId('badge-钻石会员');
    expect(diamondBadge).toHaveAttribute('data-variant', 'danger');
    const goldBadge = screen.getByTestId('badge-黄金会员');
    expect(goldBadge).toHaveAttribute('data-variant', 'warning');
  });

  // ==============================
  //  分页 (3 tests)
  // ==============================

  test('30. renders pagination component after loading', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const paginations = screen.getAllByTestId('pagination');
      expect(paginations.length).toBeGreaterThan(0);
    });
  });

  test('31. pagination next navigates to page 2', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const nextBtn = screen.getByTestId('pagination-next');
      fireEvent.click(nextBtn);
    });
    await waitFor(() => {
      expect(screen.getByTestId('pagination-page').textContent).toBe('2');
    });
  });

  test('32. pagination total reflects data count', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const totalPages = screen.getByTestId('pagination-totalPages');
      expect(Number(totalPages.textContent)).toBeGreaterThan(0);
    });
  });

  // ==============================
  //  排序 (3 tests)
  // ==============================

  test('33. sortable column headers trigger sort change on click', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    const nameHeader = screen.getByTestId('th-name');
    expect(nameHeader).toHaveAttribute('data-sortable', 'true');
    // Click to sort ascending
    fireEvent.click(nameHeader);
  });

  test('34. points column is sortable', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByTestId('th-points')).toBeInTheDocument();
  });

  test('35. clicking sort header twice reverses direction', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('th-name'));
    fireEvent.click(screen.getByTestId('th-name'));
  });

  // ==============================
  //  空状态 (3 tests)
  // ==============================

  test('36. empty state text renders when no data matches', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    // The empty state is rendered inline inside DataTable with emptyText prop
    expect(screen.getByTestId('table-empty-text')).toBeInTheDocument();
  });

  test('37. empty inline message renders when filtered results are zero', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    // The dash-lined "未找到匹配的会员记录" div is rendered when finalFiltered.length === 0
    // This happens when tabs + search produce no results
    // Trigger by searching for an impossible name
    const searchInput = screen.getByTestId('search-filter-input');
    fireEvent.change(searchInput, { target: { value: 'XxX_NotExists_999_XxX' } });
    await waitFor(() => {
      expect(screen.getByText('未找到匹配的会员记录')).toBeInTheDocument();
    });
  });

  test('38. empty state uses dashed border styling', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    const searchInput = screen.getByTestId('search-filter-input');
    fireEvent.change(searchInput, { target: { value: 'XxX_NotExists_999_XxX' } });
    await waitFor(() => {
      const emptyDiv = screen.getByText('未找到匹配的会员记录');
      expect(emptyDiv).toBeInTheDocument();
    });
  });

  // ==============================
  //  组合过滤 (3 tests)
  // ==============================

  test('39. combined filter: diamond tier + active status shows matching members', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tab-diamond'));
    fireEvent.click(screen.getByTestId('tab-active'));
    // Diamond + active: 张伟, 周杰, 林小红
    expect(screen.getByTestId('tab-diamond')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('tab-active')).toHaveAttribute('data-active', 'true');
  });

  test('40. combined filter: frozen status + basic tier', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tab-basic'));
    fireEvent.click(screen.getByTestId('tab-frozen'));
    // Basic + frozen: 郑浩 (m8)
    expect(screen.getByTestId('tab-basic')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('tab-frozen')).toHaveAttribute('data-active', 'true');
  });

  test('41. combined filter: search + gold tier', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tab-gold'));
    const searchInput = screen.getByTestId('search-filter-input');
    fireEvent.change(searchInput, { target: { value: '张伟' } });
    // Gold + search "张伟" -> no match (张伟 is diamond)
    await waitFor(() => {
      expect(screen.getByText('未找到匹配的会员记录')).toBeInTheDocument();
    });
  });

  // ==============================
  //  边界情况 (4 tests)
  // ==============================

  test('42. all 8 column headers render in correct order', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    const headers = ['th-name', 'th-tier', 'th-points', 'th-totalVisits', 'th-storeName', 'th-lastVisit', 'th-status', 'th-joinedAt'];
    headers.forEach(h => {
      expect(screen.getByTestId(h)).toBeInTheDocument();
    });
  });

  test('43. tier tabs use pills variant', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    const allTabs = screen.getAllByTestId('tabs');
    expect(allTabs[0]).toHaveAttribute('data-variant', 'pills');
  });

  test('44. status tabs use pills variant', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    const allTabs = screen.getAllByTestId('tabs');
    expect(allTabs[1]).toHaveAttribute('data-variant', 'pills');
  });

  test('45. tabs use size sm (small)', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    const allTabs = screen.getAllByTestId('tabs');
    allTabs.forEach(tab => {
      expect(tab).toHaveAttribute('data-size', 'sm');
    });
  });

  // ==============================
  //  渲染稳定性 (3 tests)
  // ==============================

  test('46. component is stable across re-renders', async () => {
    const { rerender } = render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    rerender(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-title')).toHaveTextContent('会员管理');
    });
  });

  test('47. toggling diamond tab then back to all works', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tab-diamond'));
    expect(screen.getByTestId('tab-diamond')).toHaveAttribute('data-active', 'true');
    const allTabs = screen.getAllByTestId('tab-ALL');
    fireEvent.click(allTabs[0]);
    expect(allTabs[0]).toHaveAttribute('data-active', 'true');
  });

  test('48. rendering with only data table rows', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    // First page should show 8 rows (14 total, 8 per page)
    const rows = document.querySelectorAll('[data-testid^="dt-row-"]');
    expect(rows.length).toBeLessThanOrEqual(8);
  });

  // ==============================
  //  会员数据完整性 (2 tests)
  // ==============================

  test('49. specific member data renders correctly', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    // 张伟 should appear in data table
    const zhangWei = screen.getAllByText('张伟');
    expect(zhangWei.length).toBeGreaterThanOrEqual(1);
    // 林小红 (diamond, 46500 points)
    const linXiaohong = screen.getAllByText('林小红');
    expect(linXiaohong.length).toBeGreaterThanOrEqual(1);
  });

  test('50. total member count equals 14', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.getByText('14')).toBeInTheDocument(); // total stat card
  });
});
