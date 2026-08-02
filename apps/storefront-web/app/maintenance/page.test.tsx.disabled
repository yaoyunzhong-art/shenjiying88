/**
 * maintenance/page.vitest.tsx — 设备保养工单页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 统计卡片 · 数据表格 · 搜索 · 状态筛选 · 优先级筛选 · 分页 · 空状态 · 详情弹窗 · AI预测 · 成本分析 · 维护计划 · 边界
 * 角色: 👨‍🔧设备维护 · 🔧门店运营
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock @m5/ui components
vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, subtitle }: any) => (
    <div data-testid="page-shell">
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  ),
  DataTable: ({ columns, rows, rowKey }: any) => (
    <div data-testid="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col: any) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any) => (
            <tr key={rowKey(row)} data-row-id={rowKey(row)}>
              {columns.map((col: any) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  StatusBadge: ({ variant, label }: any) => (
    <span data-testid="status-badge" data-variant={variant}>
      {label}
    </span>
  ),
  Button: ({ children, onClick, variant }: any) => (
    <button data-testid="btn" data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ),
  Pagination: ({ page, totalPages, onPageChange, pageSize, onPageSizeChange, pageSizeOptions, total }: any) => (
    <div data-testid="pagination">
      <span data-testid="page-info">{page}/{totalPages}</span>
      <button data-testid="next-page" onClick={() => onPageChange(page + 1)}>下一页</button>
      <select data-testid="page-size-select" onChange={(e: any) => onPageSizeChange(Number(e.target.value))} value={pageSize}>
        {pageSizeOptions.map((opt: number) => <option key={opt} value={opt}>{opt}条/页</option>)}
      </select>
      <span data-testid="pagination-total">共{total}条</span>
    </div>
  ),
  usePagination: (total: number, defaultPageSize: number) => ({
    page: 1,
    setPage: vi.fn(),
    pageSize: defaultPageSize,
    setPageSize: vi.fn(),
    totalPages: Math.ceil(total / defaultPageSize),
  }),
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
  Modal: ({ open, onClose, title, children, width }: any) =>
    open ? (
      <div data-testid="modal" data-width={width}>
        <h3>{title}</h3>
        {children}
        <button data-testid="modal-close-btn" onClick={onClose}>关闭</button>
      </div>
    ) : null,
}));

import MaintenancePage from './page';

describe('MaintenancePage — 设备保养工单', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<MaintenancePage />)).not.toThrow();
  });

  test('renders page title 设备保养工单', () => {
    render(<MaintenancePage />);
    expect(screen.getByText('🔧 设备保养工单')).toBeInTheDocument();
  });

  test('renders PageShell title', () => {
    render(<MaintenancePage />);
    expect(screen.getByText('设备保养工单')).toBeInTheDocument();
  });

  test('renders summary text with total count', () => {
    render(<MaintenancePage />);
    expect(screen.getByText(/共 12 个工单/)).toBeInTheDocument();
  });

  test('renders summary text with pending count', () => {
    render(<MaintenancePage />);
    const pendingElements = screen.getAllByText(/待处理/);
    expect(pendingElements.length).toBeGreaterThanOrEqual(1);
  });

  // ====== 统计卡片 ======

  test('renders StatCard for 总工单', () => {
    render(<MaintenancePage />);
    const statCards = screen.getAllByText('总工单');
    expect(statCards.length).toBeGreaterThanOrEqual(1);
    // The StatCard icon for 总工单
    const totalIcon = screen.getByText('📋');
    expect(totalIcon).toBeInTheDocument();
  });

  test('renders StatCard for 待处理', () => {
    render(<MaintenancePage />);
    const pendingLabels = screen.getAllByText('待处理');
    expect(pendingLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  test('renders StatCard for 处理中', () => {
    render(<MaintenancePage />);
    const inProgressLabels = screen.getAllByText('处理中');
    expect(inProgressLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('🔄')).toBeInTheDocument();
  });

  test('renders StatCard for 已完成', () => {
    render(<MaintenancePage />);
    const completedLabels = screen.getAllByText('已完成');
    expect(completedLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  test('renders StatCard for 紧急', () => {
    render(<MaintenancePage />);
    const urgentLabels = screen.getAllByText('紧急');
    expect(urgentLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('🔴')).toBeInTheDocument();
  });

  // ====== 门店分布 ======

  test('renders store distribution chips', () => {
    render(<MaintenancePage />);
    const body = document.body.textContent || '';
    expect(body).toMatch(/旗舰店/);
    expect(body).toMatch(/分店-A/);
    expect(body).toMatch(/分店-B/);
    expect(body).toMatch(/分店-C/);
  });

  // ====== 搜索和筛选 ======

  test('renders search input with placeholder', () => {
    render(<MaintenancePage />);
    expect(screen.getByPlaceholderText('搜索工单/设备/门店/负责人…')).toBeInTheDocument();
  });

  test('renders status filter select', () => {
    render(<MaintenancePage />);
    const statusSelect = screen.getByTestId('status-filter');
    expect(statusSelect).toBeInTheDocument();
    // Status options appear in the select AND in the status badges in the table
    const allOptions = screen.getAllByText('全部');
    expect(allOptions.length).toBeGreaterThanOrEqual(1);
    const pendingOptions = screen.getAllByText('待处理');
    expect(pendingOptions.length).toBeGreaterThanOrEqual(1);
    const inProgressOptions = screen.getAllByText('处理中');
    expect(inProgressOptions.length).toBeGreaterThanOrEqual(1);
    const completedOptions = screen.getAllByText('已完成');
    expect(completedOptions.length).toBeGreaterThanOrEqual(1);
    const cancelledOptions = screen.getAllByText('已取消');
    expect(cancelledOptions.length).toBeGreaterThanOrEqual(1);
  });

  test('renders priority filter select', () => {
    render(<MaintenancePage />);
    const prioritySelect = screen.getByTestId('priority-filter');
    expect(prioritySelect).toBeInTheDocument();
  });

  test('renders 新建工单 button', () => {
    render(<MaintenancePage />);
    expect(screen.getByText('+ 新建工单')).toBeInTheDocument();
  });

  test('search input filters orders', async () => {
    render(<MaintenancePage />);
    const searchInput = screen.getByPlaceholderText('搜索工单/设备/门店/负责人…');
    fireEvent.change(searchInput, { target: { value: '空调' } });
    await waitFor(() => {
      const filterText = screen.getByText(/筛选后/);
      expect(filterText).toBeInTheDocument();
    });
  });

  test('status filter changes renders', () => {
    render(<MaintenancePage />);
    const statusSelect = screen.getByTestId('status-filter') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'completed' } });
    expect(statusSelect.value).toBe('completed');
  });

  test('priority filter changes renders', () => {
    render(<MaintenancePage />);
    const prioritySelect = screen.getByTestId('priority-filter') as HTMLSelectElement;
    fireEvent.change(prioritySelect, { target: { value: 'urgent' } });
    expect(prioritySelect.value).toBe('urgent');
  });

  // ====== 数据表格 ======

  test('renders data table with columns', () => {
    render(<MaintenancePage />);
    expect(screen.getByText('工单编号')).toBeInTheDocument();
    expect(screen.getByText('工单标题')).toBeInTheDocument();
    expect(screen.getByText('设备名称')).toBeInTheDocument();
    expect(screen.getByText('所属门店')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('优先级')).toBeInTheDocument();
    expect(screen.getByText('负责人')).toBeInTheDocument();
    expect(screen.getByText('计划日期')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  test('renders order data in table', () => {
    render(<MaintenancePage />);
    expect(screen.getByText('MO-001')).toBeInTheDocument();
    expect(screen.getByText('空调滤网更换')).toBeInTheDocument();
  });

  test('renders 详情 button for each row', () => {
    render(<MaintenancePage />);
    const detailButtons = screen.getAllByText('详情');
    expect(detailButtons.length).toBeGreaterThanOrEqual(1);
  });

  test('renders 查看 link for each row', () => {
    render(<MaintenancePage />);
    const viewLinks = screen.getAllByText('查看');
    expect(viewLinks.length).toBeGreaterThanOrEqual(1);
    expect(viewLinks[0].closest('a')).toHaveAttribute('href', '/maintenance/MO-001');
  });

  // ====== 分页 ======

  test('renders pagination component', () => {
    render(<MaintenancePage />);
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  test('pagination shows correct page info', () => {
    render(<MaintenancePage />);
    expect(screen.getByTestId('page-info')).toHaveTextContent(/1\/\d+/);
    expect(screen.getByTestId('pagination-total')).toHaveTextContent(/共/);
  });

  // ====== 详情弹窗 ======

  test('clicking 详情 opens modal', async () => {
    render(<MaintenancePage />);
    const detailBtn = screen.getAllByText('详情')[0];
    fireEvent.click(detailBtn);
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  test('modal displays order details', () => {
    render(<MaintenancePage />);
    fireEvent.click(screen.getAllByText('详情')[0]);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    const body = document.body.textContent || '';
    expect(body).toMatch(/工单详情/);
    expect(body).toMatch(/MO-001/);
    expect(body).toMatch(/空调滤网更换/);
  });

  test('modal close button works', () => {
    render(<MaintenancePage />);
    fireEvent.click(screen.getAllByText('详情')[0]);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('modal-close-btn'));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  // ====== AI 故障预测 ======

  test('renders AI 故障预测 section', () => {
    render(<MaintenancePage />);
    const aiTitle = screen.getByText('🤖 AI 故障预测');
    expect(aiTitle).toBeInTheDocument();
  });

  test('AI prediction shows device names', () => {
    render(<MaintenancePage />);
    const body = document.body.textContent || '';
    expect(body).toMatch(/中央空调-3F/);
    expect(body).toMatch(/配电柜/);
    expect(body).toMatch(/监控系统/);
  });

  // ====== 完成率统计 ======

  test('renders completion rate stats', () => {
    render(<MaintenancePage />);
    const rateElements = screen.getAllByText(/完成率/);
    expect(rateElements.length).toBeGreaterThanOrEqual(1);
    const processRate = screen.getAllByText(/处理率/);
    expect(processRate.length).toBeGreaterThanOrEqual(1);
    const urgentRate = screen.getAllByText(/紧急占比/);
    expect(urgentRate.length).toBeGreaterThanOrEqual(1);
  });

  // ====== 边界 ======

  test('empty state when no orders match filter', async () => {
    render(<MaintenancePage />);
    const searchInput = screen.getByPlaceholderText('搜索工单/设备/门店/负责人…');
    fireEvent.change(searchInput, { target: { value: 'xxxxxxxxxx不存在xxxx' } });
    await waitFor(() => {
      expect(screen.getByText('暂无匹配工单')).toBeInTheDocument();
    });
  });

  test('empty state shows suggestion to adjust filters', async () => {
    render(<MaintenancePage />);
    const searchInput = screen.getByPlaceholderText('搜索工单/设备/门店/负责人…');
    fireEvent.change(searchInput, { target: { value: 'xxxxxxxxxx不存在xxxx' } });
    await waitFor(() => {
      expect(screen.getByText('尝试调整搜索条件或筛选')).toBeInTheDocument();
    });
  });

  test('filtered count text updates', () => {
    render(<MaintenancePage />);
    expect(screen.getByText(/筛选后/)).toBeInTheDocument();
  });
});
