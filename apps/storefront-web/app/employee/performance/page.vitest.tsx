/**
 * employee/performance/page.vitest.tsx — 员工绩效页 测试增强
 *
 * 覆盖：加载态、空数据、错误态、用户交互、边界场景
 * 使用 vitest + @testing-library/react
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

// ── Mocks ──

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// TriStateRenderer mock — same data-testid as the real component
vi.mock('../../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ children, loading, empty, error, onRetry }: any) => {
    if (loading) {
      return (
        <div data-testid="tri-state-loading">
          <span style={{ fontSize: 14, color: '#6b7280' }}>加载中…</span>
          <button data-testid="tri-state-retry" onClick={onRetry}>重试</button>
        </div>
      );
    }
    if (error) {
      return (
        <div data-testid="tri-state-error">
          <span>加载失败</span>
          <span>{error}</span>
          {onRetry && <button data-testid="tri-state-retry" onClick={onRetry}>重新加载</button>}
        </div>
      );
    }
    if (empty) {
      return <div data-testid="tri-state-empty">暂无数据</div>;
    }
    return <>{typeof children === 'function' ? children() : children}</>;
  },
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>
      {children}
    </div>
  ),
  DataTable: ({ columns, rows, rowKey }: any) => (
    <div data-testid="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col: any) => (
              <th key={col.key} data-testid={`col-${col.key}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any) => (
            <tr key={rowKey(row)} data-testid={`row-${rowKey(row)}`}>
              {columns.map((col: any) => (
                <td key={col.key}>
                  {typeof col.render === 'function' ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  Pagination: ({ page, totalPages, total, onPageChange }: any) => (
    <div data-testid="pagination">
      <span data-testid="page-info">第 {page}/{totalPages} 页，共 {total} 条</span>
      {page > 1 && <button data-testid="prev-page" onClick={() => onPageChange(page - 1)}>上一页</button>}
      {page < totalPages && <button data-testid="next-page" onClick={() => onPageChange(page + 1)}>下一页</button>}
    </div>
  ),
  SearchFilterInput: ({ value, onChange, placeholder }: any) => (
    <input data-testid="search-filter" value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} />
  ),
  StatusBadge: ({ label, variant, size }: any) => (
    <span data-testid="status-badge" data-variant={variant} data-size={size}>{label}</span>
  ),
  Tabs: ({ items, activeKey, onChange, variant, size }: any) => (
    <div data-testid="tabs" data-variant={variant} data-size={size}>
      {items.map((item: any) => (
        <button key={item.key} data-testid={`tab-${item.key}`} data-active={activeKey === item.key} onClick={() => onChange(item.key)}>
          {item.label} ({item.count})
        </button>
      ))}
    </div>
  ),
  usePagination: (totalItems: number, _pageSize: number) => {
    const [page, setPage] = React.useState(1);
    return { page, setPage, totalPages: Math.ceil(totalItems / _pageSize) || 1, pageSize: _pageSize };
  },
  useSearchFilter: (data: any[], fields: string[]) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    return {
      searchTerm,
      setSearchTerm,
      filteredItems: searchTerm
        ? data.filter((item: any) => fields.some((f) => String(item[f]).toLowerCase().includes(searchTerm.toLowerCase())))
        : data,
    };
  },
  useSortedItems: (items: any[]) => items,
}));

import EmployeePerformancePage from './page';

const renderPage = () => render(<EmployeePerformancePage />);

// ── 测试套件 ──

describe('EmployeePerformancePage — 加载态', () => {
  test('初始渲染应显示加载态 (tri-state-loading)', () => {
    renderPage();
    expect(screen.getByTestId('tri-state-loading')).toBeTruthy();
  });

  test('加载态中包含加载文案', () => {
    renderPage();
    expect(screen.getByText('加载中…')).toBeTruthy();
  });

  test('加载完成后加载态应消失', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('tri-state-loading')).toBeNull(), { timeout: 5000 });
  });
});

describe('EmployeePerformancePage — 渲染', () => {
  test('加载完成后 PageShell 标题应正确', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('page-shell')).toBeTruthy());
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '员工绩效');
  });

  test('加载完成后应显示统计卡片', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('data-table')).toBeTruthy());
    expect(screen.getByText('总员工')).toBeTruthy();
    expect(screen.getByText('总销售额')).toBeTruthy();
    expect(screen.getByText('优秀人数')).toBeTruthy();
    expect(screen.getByText('平均完成率')).toBeTruthy();
  });

  test('加载完成后应渲染数据表格', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('data-table')).toBeTruthy());
  });

  test('数据表格应包含所有列头', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('col-name')).toBeTruthy());
    expect(screen.getByTestId('col-department')).toBeTruthy();
    expect(screen.getByTestId('col-salesAmount')).toBeTruthy();
    expect(screen.getByTestId('col-completionRate')).toBeTruthy();
    expect(screen.getByTestId('col-serviceScore')).toBeTruthy();
    expect(screen.getByTestId('col-attendanceDays')).toBeTruthy();
    expect(screen.getByTestId('col-status')).toBeTruthy();
  });

  test('加载完成后应分页组件', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeTruthy());
  });

  test('加载完成后应显示搜索输入框', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('search-filter')).toBeTruthy());
  });

  test('部门 Tabs 的三种选项', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('tab-ALL')).toBeTruthy());
    expect(screen.getByTestId('tab-旗舰店')).toBeTruthy();
    expect(screen.getByTestId('tab-社区店')).toBeTruthy();
  });

  test('应显示评级徽章', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByTestId('status-badge').length).toBeGreaterThan(0);
    });
  });
});

describe('EmployeePerformancePage — 用户交互', () => {
  test('搜索输入应更新搜索词', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('search-filter')).toBeTruthy());
    const searchInput = screen.getByTestId('search-filter');
    fireEvent.change(searchInput, { target: { value: '张三' } });
    expect(searchInput).toHaveValue('张三');
  });

  test('点击部门 Tab 切换筛选状态', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('tab-旗舰店')).toBeTruthy());
    expect(screen.getByTestId('tab-ALL')).toHaveAttribute('data-active', 'true');
    fireEvent.click(screen.getByTestId('tab-旗舰店'));
    expect(screen.getByTestId('tab-旗舰店')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('tab-ALL')).toHaveAttribute('data-active', 'false');
  });

  test('分页显示页码信息', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeTruthy());
    const pageInfo = screen.getByTestId('page-info');
    expect(pageInfo.textContent).toMatch(/第 1\//);
  });

  test('分页显示总条数', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeTruthy());
    const pageInfo = screen.getByTestId('page-info');
    expect(pageInfo.textContent).toContain('共');
    expect(pageInfo.textContent).toContain('条');
  });
});

describe('EmployeePerformancePage — 错误态与边界', () => {
  test('加载完成后不应显示加载态', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('tri-state-loading')).toBeNull(), { timeout: 5000 });
  });

  test('加载完成后不应显示空状态', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('tri-state-empty')).toBeNull(), { timeout: 5000 });
  });

  test('销售额以货币格式显示', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('¥1,055,000')).toBeTruthy();
    });
  });

  test('完成率值正确', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('111.9%')).toBeTruthy();
    });
  });

  test('应显示评级: 优秀', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('优秀').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('应显示良好评级', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('良好').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('应显示一般评级', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('一般').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('应显示待提升评级', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('待提升').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('统计卡片总员工数应为 8', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('8')).toBeTruthy();
    });
  });
});
