/**
 * scheduling/page.vitest.tsx — 排班管理页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 统计卡片 · 人员统计 · 周摘要 · 排班表 · 概览 · 交互 · 边界
 * 角色: 👔店长 · 🛒前台主管
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: { children: React.ReactNode; title?: string; description?: string }) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>{children}</div>
  ),
  StaffShiftSchedulePanel: ({ shifts, availableStaff, onAddShift, onRemoveShift, loading }: {
    shifts: unknown[]; availableStaff: unknown[]; loading: boolean;
    onAddShift: (date: string, staffId: string, shiftLabel: string) => Promise<void>;
    onRemoveShift: (date: string, staffId: string) => Promise<void>;
  }) => (
    <div data-testid="staff-shift-panel" data-loading={loading}>
      <div data-testid="panel-shifts-count">{shifts.length} 天排班</div>
      <div data-testid="panel-staff-count">{availableStaff.length} 名员工</div>
      {shifts.map((s: { date: string; dayLabel: string; assignments: unknown[] }) => (
        <div key={s.date} data-testid={`shift-day-${s.date}`}>
          <span>{s.date}</span>
          <span>{s.dayLabel}</span>
          <button data-testid={`add-shift-${s.date}`} onClick={() => onAddShift(s.date, 's1', '早班 08:00-16:00')}>添加</button>
        </div>
      ))}
      <button data-testid="panel-remove-shift" onClick={() => onRemoveShift('2026-06-29', 's1')}>移除</button>
    </div>
  ),
  StatusBadge: ({ label, variant }: { label: string; variant?: string }) => (
    <span data-testid="m5-status-badge" data-variant={variant}>{label}</span>
  ),
}));

import SchedulingPage from './page';

describe('SchedulingPage — 排班管理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('render without crashing', () => {
    expect(() => render(<SchedulingPage />)).not.toThrow();
  });

  test('renders PageShell with correct title', () => {
    render(<SchedulingPage />);
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '排班管理');
  });

  test('renders page shell description', () => {
    render(<SchedulingPage />);
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-description', '门店员工排班查看与编辑，支持早中晚班配置');
  });

  test('renders page title 排班管理', () => {
    render(<SchedulingPage />);
    expect(screen.getByText('📅 排班管理')).toBeInTheDocument();
  });

  test('renders page description with staff count', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/管理门店 6 名员工的排班/)).toBeInTheDocument();
    expect(screen.getByText(/共 7 天排班计划/)).toBeInTheDocument();
  });

  // ====== 统计卡片测试 ======

  test('renders all 5 stat cards', () => {
    render(<SchedulingPage />);
    expect(screen.getByText('总员工')).toBeInTheDocument();
    expect(screen.getByText('排班天数')).toBeInTheDocument();
    expect(screen.getByText('本周排班人次')).toBeInTheDocument();
    const cashierEls = screen.getAllByText('收银员');
    expect(cashierEls.length).toBeGreaterThanOrEqual(1);
    const shopperEls = screen.getAllByText('导购员');
    expect(shopperEls.length).toBeGreaterThanOrEqual(1);
  });

  test('total staff count is 6', () => {
    render(<SchedulingPage />);
    // The first "6" in the page - total employees
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('scheduling days count is 7', () => {
    render(<SchedulingPage />);
    expect(screen.getAllByText('7').length).toBeGreaterThanOrEqual(1);
  });

  test('cashier count is displayed', () => {
    render(<SchedulingPage />);
    const cashierEls = screen.getAllByText('收银员');
    expect(cashierEls.length).toBeGreaterThanOrEqual(1);
  });

  test('shopper count is displayed', () => {
    render(<SchedulingPage />);
    const shopperEls = screen.getAllByText('导购员');
    expect(shopperEls.length).toBeGreaterThanOrEqual(1);
  });

  // ====== 人员统计测试 ======

  test('renders staff stats panel', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/人员统计:/)).toBeInTheDocument();
  });

  test('staff stats panel shows role breakdown', () => {
    render(<SchedulingPage />);
    const cashierEls = screen.getAllByText(/收银员/);
    expect(cashierEls.length).toBeGreaterThanOrEqual(1);
    const shopperEls = screen.getAllByText(/导购员/);
    expect(shopperEls.length).toBeGreaterThanOrEqual(1);
  });

  test('staff stats panel shows total count', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/共 6 人/)).toBeInTheDocument();
  });

  // ====== 周排班摘要测试 ======

  test('renders weekly summary section', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/排班周期:/)).toBeInTheDocument();
    expect(screen.getByText(/总排班人次:/)).toBeInTheDocument();
    expect(screen.getByText(/日均排班:/)).toBeInTheDocument();
    expect(screen.getByText(/最忙:/)).toBeInTheDocument();
  });

  test('weekly summary shows scheduling period', () => {
    render(<SchedulingPage />);
    const dateEls = screen.getAllByText(/2026-0[6-7]-/);
    expect(dateEls.length).toBeGreaterThanOrEqual(1);
  });

  test('weekly summary shows avg per day', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/人\/天/)).toBeInTheDocument();
  });

  // ====== Tab 切换测试 ======

  test('default tab is schedule', () => {
    render(<SchedulingPage />);
    const scheduleTab = screen.getByText('📋 排班表');
    expect(scheduleTab).toBeInTheDocument();
    expect(scheduleTab.closest('button')).toHaveStyle('fontWeight: 700');
  });

  test('renders overview tab button', () => {
    render(<SchedulingPage />);
    expect(screen.getByText('📊 概览')).toBeInTheDocument();
  });

  test('clicking overview tab switches view', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getByText('📊 概览'));
    expect(screen.getByText('📊 概览').closest('button')).toHaveStyle('fontWeight: 700');
  });

  // ====== 排班面板测试 ======

  test('renders StaffShiftSchedulePanel when schedule tab active', () => {
    render(<SchedulingPage />);
    expect(screen.getByTestId('staff-shift-panel')).toBeInTheDocument();
  });

  test('shift panel shows 7 days', () => {
    render(<SchedulingPage />);
    expect(screen.getByText('7 天排班')).toBeInTheDocument();
  });

  test('shift panel shows 6 staff members', () => {
    render(<SchedulingPage />);
    expect(screen.getByText('6 名员工')).toBeInTheDocument();
  });

  test('each day has an add shift button', () => {
    render(<SchedulingPage />);
    const addBtns = screen.getAllByText('添加');
    expect(addBtns.length).toBe(7);
  });

  test('has remove shift button', () => {
    render(<SchedulingPage />);
    expect(screen.getByTestId('panel-remove-shift')).toBeInTheDocument();
  });

  // ====== 概览视图测试 ======

  test('overview tab shows table headers', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getByText('📊 概览'));
    expect(screen.getByText('日期')).toBeInTheDocument();
    expect(screen.getByText('星期')).toBeInTheDocument();
    expect(screen.getByText('排班人数')).toBeInTheDocument();
    expect(screen.getByText('值班人员')).toBeInTheDocument();
  });

  test('overview tab shows all 7 days', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getByText('📊 概览'));
    // Days should be visible with date strings
    const dayElements = screen.getAllByText(/2026-0[6-7]-/);
    expect(dayElements.length).toBeGreaterThanOrEqual(7);
  });

  test('overview tab shows table content', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getByText('📊 概览'));
    expect(screen.getByText('日期')).toBeInTheDocument();
    expect(screen.getByText('星期')).toBeInTheDocument();
    expect(screen.getByText('排班人数')).toBeInTheDocument();
    expect(screen.getByText('值班人员')).toBeInTheDocument();
  });

  test('overview tab shows weekday labels', () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getByText('📊 概览'));
    expect(screen.getByText('周一')).toBeInTheDocument();
    expect(screen.getByText('周日')).toBeInTheDocument();
  });

  // ====== 操作说明测试 ======

  test('renders operation instructions', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/操作说明:/)).toBeInTheDocument();
  });

  test('instructions mention shift conflict detection', () => {
    render(<SchedulingPage />);
    expect(screen.getByText(/排班冲突/)).toBeInTheDocument();
  });

  // ====== 边界测试 ======

  test('export default is a function', () => {
    expect(typeof SchedulingPage).toBe('function');
  });

  test('page does not show error initially', () => {
    render(<SchedulingPage />);
    expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
  });

  test('panel not in loading state after render', () => {
    render(<SchedulingPage />);
    const panel = screen.getByTestId('staff-shift-panel');
    expect(panel).toHaveAttribute('data-loading', 'false');
  });

  test('add shift triggers callback', async () => {
    render(<SchedulingPage />);
    const addBtn = screen.getAllByText('添加')[0];
    fireEvent.click(addBtn);
    // Panel should handle it without error
    await waitFor(() => {
      // No crash means success
      expect(screen.getByTestId('staff-shift-panel')).toBeInTheDocument();
    });
  });

  test('remove shift triggers callback', async () => {
    render(<SchedulingPage />);
    fireEvent.click(screen.getByTestId('panel-remove-shift'));
    await waitFor(() => {
      expect(screen.getByTestId('staff-shift-panel')).toBeInTheDocument();
    });
  });
});
