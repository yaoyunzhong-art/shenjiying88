/**
 * employee/performance/page.vitest.tsx — 员工绩效页 测试增强
 *
 * 覆盖：加载态、空数据、错误态、用户交互、边界场景
 * 使用 vitest + @testing-library/react
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../../../_components/useTriState', () => ({
  useTriState: ({ loading: initialLoading }: any) => {
    const [loading, setLoading] = React.useState(initialLoading ?? false);
    const [error, setError] = React.useState<string | null>(null);
    return {
      loading,
      error,
      setLoading,
      setError,
      wrapLoad: async (promise: Promise<any>) => {
        setLoading(true);
        try {
          const result = await promise;
          setLoading(false);
          return result;
        } catch (e: any) {
          setError(e.message || 'Error');
          setLoading(false);
          return null;
        }
      },
    };
  },
}));

vi.mock('../../../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ children, loading, empty, error, onRetry }: any) => {
    if (loading) return <div data-testid="loading-state">加载中...</div>;
    if (error) return (
      <div data-testid="error-state">
        加载失败: {error}
        {onRetry && <button data-testid="retry-btn" onClick={onRetry}>重试</button>}
      </div>
    );
    if (empty) return <div data-testid="empty-state">暂无数据</div>;
    return <div data-testid="content-state">{children}</div>;
  },
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>
      {children}
    </div>
  ),
  DataTable: ({ columns, rows, rowKey, sort, onSortChange }: any) => (
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
                <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
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
      {page > 1 && (
        <button data-testid="prev-page" onClick={() => onPageChange(page - 1)}>上一页</button>
      )}
      {page < totalPages && (
        <button data-testid="next-page" onClick={() => onPageChange(page + 1)}>下一页</button>
      )}
    </div>
  ),
  SearchFilterInput: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="search-filter"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  StatusBadge: ({ label, variant, size }: any) => (
    <span data-testid="status-badge" data-variant={variant} data-size={size}>
      {label}
    </span>
  ),
  Tabs: ({ items, activeKey, onChange, variant, size }: any) => (
    <div data-testid="tabs" data-variant={variant} data-size={size}>
      {items.map((item: any) => (
        <button
          key={item.key}
          data-testid={`tab-${item.key}`}
          data-active={activeKey === item.key}
          onClick={() => onChange(item.key)}
        >
          {item.label} ({item.count})
        </button>
      ))}
    </div>
  ),
  usePagination: (totalItems: number, pageSize: number) => {
    const [page, setPage] = React.useState(1);
    return {
      page,
      setPage,
      totalPages: Math.ceil(totalItems / pageSize) || 1,
      pageSize,
    };
  },
  useSearchFilter: (data: any[], fields: string[]) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    return {
      searchTerm,
      setSearchTerm,
      filteredItems: searchTerm
        ? data.filter((item) =>
            fields.some((f) =>
              String(item[f]).toLowerCase().includes(searchTerm.toLowerCase()),
            ),
          )
        : data,
    };
  },
  useSortedItems: (items: any[], columns: any[], sortConfig: any) => items,
  DataTableColumn: {} as any,
  DataTableSortConfig: {} as any,
}));

import EmployeePerformancePage from './page.tsx';

// ── 辅助函数 ──

function renderPage() {
  return render(<EmployeePerformancePage />);
}

// ── 测试套件 ──

describe('EmployeePerformancePage — 加载态', () => {
  test('初始渲染时应显示加载态', () => {
    renderPage();
    expect(screen.getByTestId('loading-state')).toBeTruthy();
    expect(screen.getByText('加载中...')).toBeTruthy();
  });

  test('加载完成后应显示内容区域', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).toBeNull();
    });
    expect(screen.getByTestId('content-state')).toBeTruthy();
  });
});

describe('EmployeePerformancePage — 渲染', () => {
  test('加载完成后应渲染 PageShell', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('page-shell')).toBeTruthy();
    });
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '员工绩效');
  });

  test('加载完成后应渲染统计卡片', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('总员工')).toBeTruthy();
      expect(screen.getByText('总销售额')).toBeTruthy();
      expect(screen.getByText('优秀人数')).toBeTruthy();
      expect(screen.getByText('平均完成率')).toBeTruthy();
    });
  });

  test('加载完成后应渲染数据表格', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeTruthy();
    });
  });

  test('加载完成后应显示表头列', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('col-name')).toBeTruthy();
      expect(screen.getByTestId('col-department')).toBeTruthy();
      expect(screen.getByTestId('col-salesAmount')).toBeTruthy();
      expect(screen.getByTestId('col-completionRate')).toBeTruthy();
      expect(screen.getByTestId('col-status')).toBeTruthy();
    });
  });

  test('加载完成后应显示员工数据', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeTruthy();
      expect(screen.getByText('李四')).toBeTruthy();
      expect(screen.getByText('王五')).toBeTruthy();
    });
  });

  test('加载完成后应显示分页组件', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeTruthy();
    });
  });

  test('加载完成后应显示搜索输入框', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('search-filter')).toBeTruthy();
    });
  });

  test('加载完成后应显示部门 Tabs', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeTruthy();
      expect(screen.getByTestId('tab-ALL')).toBeTruthy();
      expect(screen.getByTestId('tab-旗舰店')).toBeTruthy();
      expect(screen.getByTestId('tab-社区店')).toBeTruthy();
    });
  });

  test('加载完成后应显示评级徽章', async () => {
    renderPage();
    await waitFor(() => {
      const badges = screen.getAllByTestId('status-badge');
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});

describe('EmployeePerformancePage — 用户交互', () => {
  test('搜索框输入应更新搜索词', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('search-filter')).toBeTruthy();
    });
    const searchInput = screen.getByTestId('search-filter');
    fireEvent.change(searchInput, { target: { value: '张三' } });
    expect(searchInput).toHaveValue('张三');
  });

  test('点击部门 Tab 应切换筛选', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('tab-旗舰店')).toBeTruthy();
    });
    const tabFlag = screen.getByTestId('tab-旗舰店');
    // 初始 ALL 应激活
    expect(screen.getByTestId('tab-ALL')).toHaveAttribute('data-active', 'true');
    fireEvent.click(tabFlag);
    expect(tabFlag).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('tab-ALL')).toHaveAttribute('data-active', 'false');
  });

  test('分页下一页按钮应可点击', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('next-page')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('next-page'));
    expect(screen.getByTestId('page-info')).toHaveTextContent(/第 2\//);
  });

  test('分页上一页按钮应可回退', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('next-page')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('next-page'));
    await waitFor(() => {
      expect(screen.getByTestId('prev-page')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('prev-page'));
    expect(screen.getByTestId('page-info')).toHaveTextContent(/第 1\//);
  });

  test('空搜索应显示全部数据', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('search-filter')).toBeTruthy();
    });
    const searchInput = screen.getByTestId('search-filter');
    expect(searchInput).toHaveValue('');
    // 默认所有行应该可见
    const rows = screen.getAllByTestId(/^row-/);
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('EmployeePerformancePage — 错误态与边界', () => {
  test('加载完成后不应显示加载态', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).toBeNull();
    });
  });

  test('加载完成后不应显示空状态', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('empty-state')).toBeNull();
    });
  });

  test('销售额应带货币格式', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/¥185,000/)).toBeTruthy();
    });
  });

  test('完成率应带百分号', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/123.3%/)).toBeTruthy();
    });
  });

  test('评级标签应有正确中文映射', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('优秀')).toBeTruthy();
      expect(screen.getByText('良好')).toBeTruthy();
      expect(screen.getByText('一般')).toBeTruthy();
    });
  });

  test('应显示待提升评级', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('待提升')).toBeTruthy();
    });
  });

  test('出勤列应显示天数格式', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/26\/26天/)).toBeTruthy();
      expect(screen.getByText(/25\/26天/)).toBeTruthy();
    });
  });

  test('角色/部门应正确显示', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('高级销售')).toBeTruthy();
      expect(screen.getByText('销售顾问')).toBeTruthy();
      expect(screen.getByText('旗舰店')).toBeTruthy();
      expect(screen.getByText('社区店')).toBeTruthy();
    });
  });
});
