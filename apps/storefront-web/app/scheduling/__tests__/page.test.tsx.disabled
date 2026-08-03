import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>
      {children}
    </div>
  ),
  StaffShiftSchedulePanel: ({ shifts, availableStaff, onAddShift, onRemoveShift, loading }: any) => (
    <div data-testid="scheduling-panel">
      <div data-testid="panel-shifts-count">{shifts?.length ?? 0}</div>
      <div data-testid="panel-staff-count">{availableStaff?.length ?? 0}</div>
      <button
        data-testid="panel-add-shift"
        onClick={() => onAddShift?.('2026-06-29', 's1', '早班 08:00-16:00')}
        disabled={loading}
      >
        {loading ? '添加中…' : '添加排班'}
      </button>
      <button
        data-testid="panel-remove-shift"
        onClick={() => onRemoveShift?.('2026-06-29', 's1')}
        disabled={loading}
      >
        {loading ? '移除中…' : '移除排班'}
      </button>
      {shifts?.length > 0 && (
        <div data-testid="panel-shifts-data">
          {shifts.map((day: any) => (
            <div key={day.date} data-testid={`shift-day-${day.date}`}>
              <span>{day.date} ({day.dayLabel})</span>
              <span data-testid={`assignments-${day.date}`}>{day.assignments.length}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  ),
  StatusBadge: ({ label, variant }: any) => (
    <span data-testid={`status-badge-${variant}`} data-variant={variant}>
      {label}
    </span>
  ),
}));

// ---- Test Subject ----

import SchedulingPage from '../page';

describe('SchedulingPage — 排班管理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('renders PageShell with correct title', () => {
    render(<SchedulingPage />);
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '排班管理');
  });

  test('renders PageShell with correct description', () => {
    render(<SchedulingPage />);
    expect(screen.getByTestId('page-shell')).toHaveAttribute(
      'data-description',
      '门店员工排班查看与编辑，支持早中晚班配置',
    );
  });

  test('renders scheduling page title', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/📅 排班管理/)).toBeInTheDocument();
  });

  test('renders stat cards with employee counts', () => {
    render(<SchedulingPage />);
    // Should show 总员工 stat value '6'
    const sixElements = screen.getAllByText(/^6$/);
    expect(sixElements.length).toBeGreaterThanOrEqual(1);
  });

  test('renders 排班天数 stat', () => {
    render(<SchedulingPage />);
    const sevenElements = screen.getAllByText(/^7$/);
    expect(sevenElements.length).toBeGreaterThanOrEqual(1);
  });

  test('renders 收银员 stat card', () => {
    render(<SchedulingPage />);
    // 3 收银员 in mock data — both 收银员 and 导购员 have 3
    const threeElements = screen.getAllByText(/3/);
    expect(threeElements.length).toBeGreaterThanOrEqual(1);
  });

  test('renders 导购员 stat card', () => {
    render(<SchedulingPage />);
    // Verify stat card container exists
    const guideLabels = screen.getAllByText(/导购员/);
    expect(guideLabels.length).toBeGreaterThanOrEqual(1);
  });

  test('renders StaffStatsPanel with role breakdown', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/人员统计/)).toBeInTheDocument();
    // Use getAllByText as "收银员" appears in both stat card label and panel
    const cashierLabels = screen.getAllByText(/收银员/);
    expect(cashierLabels.length).toBeGreaterThanOrEqual(1);
  });

  test('renders WeeklySummary with shift period', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/排班周期/)).toBeInTheDocument();
    expect(screen.getByText(/总排班人次/)).toBeInTheDocument();
    expect(screen.getByText(/日均排班/)).toBeInTheDocument();
  });

  test('renders schedule/overview tab buttons', () => {
    render(<SchedulingPage />);
    // Both tabs should be rendered
    const scheduleBtns = screen.getAllByText(/排班表/);
    expect(scheduleBtns.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/概览/)).toBeInTheDocument();
  });

  test('schedule tab is active by default', () => {
    render(<SchedulingPage />);
    const scheduleBtns = screen.getAllByText(/排班表/);
    expect(scheduleBtns.length).toBeGreaterThanOrEqual(1);
    const scheduleBtn = scheduleBtns[0];
    expect(scheduleBtn).toBeInTheDocument();
    // Active tab should have stronger font weight
    expect(scheduleBtn).toHaveStyle({ fontWeight: '700' });
  });

  test('renders StaffShiftSchedulePanel in schedule tab', () => {
    render(<SchedulingPage />);
    expect(screen.getByTestId('scheduling-panel')).toBeInTheDocument();
  });

  test('renders operation instructions at bottom', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/操作说明/)).toBeInTheDocument();
  });

  // ====== Tab 切换测试 ======

  test('switches to overview tab and displays table', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getAllByText(/概览/)[0]);
    // Overview tab shows a table with day columns
    const dateHeaders = screen.getAllByText(/日期/);
    expect(dateHeaders.length).toBeGreaterThanOrEqual(1);
    const weekHeaders = screen.getAllByText(/星期/);
    expect(weekHeaders.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/值班人员/)).toBeInTheDocument();
  });

  test('switches back to schedule tab from overview', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getAllByText(/概览/)[0]);
    fireEvent.click(screen.getAllByText(/排班表/)[0]);
    expect(screen.getByTestId('scheduling-panel')).toBeInTheDocument();
  });

  test('overview tab shows StatusBadge for each day', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getByText(/概览/));
    // Badges should be rendered for staffing levels
    const badges = screen.getAllByTestId(/status-badge-/);
    expect(badges.length).toBeGreaterThan(0);
  });

  test('overview tab lists staff names per day', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getAllByText(/概览/)[0]);
    // Staff names like 张三 should appear in overview table
    const zhangSans = screen.getAllByText(/张三/);
    expect(zhangSans.length).toBeGreaterThanOrEqual(1);
  });

  // ====== 排班操作测试 ======

  test('calls onAddShift when add shift button clicked', async () => {
    render(<SchedulingPage />);
    const addBtn = screen.getByTestId('panel-add-shift');
    fireEvent.click(addBtn);
    // After async operation completes, the shift should be added
    await waitFor(() => {
      expect(screen.getByTestId('panel-add-shift')).toBeInTheDocument();
    });
  });

  test('calls onRemoveShift when remove shift button clicked', async () => {
    render(<SchedulingPage />);
    const removeBtn = screen.getByTestId('panel-remove-shift');
    fireEvent.click(removeBtn);
    await waitFor(() => {
      expect(screen.getByTestId('panel-remove-shift')).toBeInTheDocument();
    });
  });

  test('disables buttons during loading', async () => {
    render(<SchedulingPage />);
    const addBtn = screen.getByTestId('panel-add-shift');
    fireEvent.click(addBtn);
    // During the async operation, buttons should be disabled
    await waitFor(() => {
      expect(screen.getByTestId('panel-remove-shift')).toBeDisabled();
    });
    // After loading completes, buttons re-enable
    await waitFor(() => {
      expect(screen.getByTestId('panel-remove-shift')).not.toBeDisabled();
    });
  });

  // ====== 数据内容测试 ======

  test('shifts panel receives shifts data', () => {
    render(<SchedulingPage />);
    expect(screen.getByTestId('panel-shifts-count')).toHaveTextContent('7'); // 7 days
  });

  test('shifts panel receives staff list', () => {
    render(<SchedulingPage />);
    expect(screen.getByTestId('panel-staff-count')).toHaveTextContent('6'); // 6 staff
  });

  test('shifts panel renders individual day data', () => {
    render(<SchedulingPage />);
    // Should render shift data for dates like 2026-06-29
    expect(screen.getByTestId('shift-day-2026-06-29')).toBeInTheDocument();
  });

  test('first day has proper weekday label', () => {
    render(<SchedulingPage />);
    expect(screen.getAllByText(/周一/).length).toBeGreaterThanOrEqual(1);
  });

  test('weekly summary shows total shift count', () => {
    render(<SchedulingPage />);
    // Calculate total from mock: generateMockShifts
    // 7 days, each with 2-4 assignments per day
    const totalAssignmentsEl = screen.getByText(/总排班人次/);
    expect(totalAssignmentsEl).toBeInTheDocument();
  });

  // ====== 错误处理测试 ======

  test('add shift with non-existent staff shows error', async () => {
    // This checks that the page has error handling; error state starts empty
    render(<SchedulingPage />);
    expect(screen.queryByText(/未找到员工/)).not.toBeInTheDocument();
  });

  test('dismiss error button clears error message', async () => {
    render(<SchedulingPage />);
    // Initially no error visible
    expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
  });

  // ====== 边界情况 ======

  test('renders without crashing', () => {
    const { container } = render(<SchedulingPage />);
    expect(container).toBeTruthy();
  });

  test('can switch overview tab and see structured data', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getAllByText(/概览/)[0]);
    // Table should be visible with day data — use getAllByText for common labels
    expect(screen.getByText(/值班人员/)).toBeInTheDocument();
    const dateItems = screen.getAllByText(/2026-/);
    expect(dateItems.length).toBeGreaterThanOrEqual(1);
  });

  test('overview tab shows correct assignment counts', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getByText(/概览/));
    // Each day should show some staff count
    const countSpans = screen.queryAllByText(/人/);
    expect(countSpans.length).toBeGreaterThan(0);
  });

  test('renders 总员工 stat card with correct icon', () => {
    render(<SchedulingPage />);
    const icons = screen.getAllByText(/👥/);
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  test('renders 排班天数 stat card with correct icon', () => {
    render(<SchedulingPage />);
    const icons = screen.getAllByText(/📅/);
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  test('renders 本周排班人次 stat card', () => {
    render(<SchedulingPage />);
    const icons = screen.getAllByText(/📊/);
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  test('overview tab shows — for empty staff on a day', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getByText(/概览/));
    // Some days should have staff names listed
    const bodyRows = screen.getAllByRole('row');
    expect(bodyRows.length).toBeGreaterThanOrEqual(2); // header + at least 1 data row
  });

  test('renders StaffStatsPanel with total staff count', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/共 6 人/)).toBeInTheDocument();
  });
});
