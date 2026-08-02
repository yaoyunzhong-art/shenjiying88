/**
 * group-booking/page.vitest.tsx — 团队预约 GroupBookingPage L2 组件测试
 * 覆盖: 步骤渲染 · 活动选择 · 日期时段 · 人数调整 · 联系信息 · 提交预约 · 成功页面
 * 角色: 🤝 团建顾客
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

vi.mock('@m5/ui', () => ({
  PageShell: vi.fn(({ children, title }: any) => (
    <div data-testid="page-shell" data-title={title}>{children}</div>
  )),
  Button: vi.fn(({ children, onClick, disabled, variant, ...rest }: any) => (
    <button data-testid={`btn-${variant || 'default'}`} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  )),
  Card: vi.fn(({ children, ...rest }: any) => (
    <div data-testid="card" {...rest}>{children}</div>
  )),
  Tag: vi.fn(({ children, ...rest }: any) => (
    <span data-testid="tag" {...rest}>{children}</span>
  )),
  Input: vi.fn(({ placeholder, value, onChange, ...rest }: any) => (
    <input data-testid="input" placeholder={placeholder} value={value} onChange={onChange} {...rest} />
  )),
  Select: vi.fn(({ options, value, onChange, ...rest }: any) => (
    <select data-testid="select" value={value} onChange={onChange} {...rest}>
      {(options || []).map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )),
}));

// ── Test Subject ──

import GroupBookingPage from './page';

describe('GroupBookingPage — 团队预约', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 1. 正例: Step 1 — 活动类型选择渲染 ======

  test('renders step 1 — activity selection screen', () => {
    render(<GroupBookingPage />);
    expect(screen.getByText('团队预约 — P-38')).toBeInTheDocument();
    expect(screen.getByText('选择活动类型开始预约')).toBeInTheDocument();
  });

  test('renders all 6 activity types', () => {
    render(<GroupBookingPage />);
    expect(screen.getByText('游戏机畅玩')).toBeInTheDocument();
    expect(screen.getByText('生日派对')).toBeInTheDocument();
    expect(screen.getByText('团建活动')).toBeInTheDocument();
    expect(screen.getByText('VR体验')).toBeInTheDocument();
    expect(screen.getByText('赛事组织')).toBeInTheDocument();
    expect(screen.getByText('包场聚会')).toBeInTheDocument();
  });

  test('shows price per person for activities', () => {
    render(<GroupBookingPage />);
    const priceElements = screen.getAllByText(/¥\d+\/人/);
    expect(priceElements.length).toBe(6);
  });

  // ====== 2. 交互: Step 1 → Step 2 活动选择 ======

  test('clicking activity advances to date-time step', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    expect(screen.getByText('✅ 已选活动')).toBeInTheDocument();
    expect(screen.getByText('📅 选择时间')).toBeInTheDocument();
  });

  test('after selecting activity, Card shows selected activity info', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('VR体验'));
    // Card with the selected activity details renders
    expect(screen.getByText('VR体验')).toBeInTheDocument();
  });

  // ====== 3. 正例: Step 2 — 日期时段 ======

  test('date-time step shows date input', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const dateInput = screen.getByDisplayValue('');
    expect(dateInput).toBeInTheDocument();
  });

  test('date-time step shows time slot grid', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    expect(screen.getByText('10:00-12:00')).toBeInTheDocument();
    expect(screen.getByText('12:00-14:00')).toBeInTheDocument();
  });

  test('unavailable time slots show "已满" label', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const unavailableBtns = screen.getAllByText('已满');
    expect(unavailableBtns.length).toBeGreaterThan(0);
  });

  test('date-time step shows people count control', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    expect(screen.getByText('参与人数')).toBeInTheDocument();
    expect(screen.getByText('−')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  test('date-time step shows next step button', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const nextBtn = screen.getByText('下一步 · 填写联系信息');
    expect(nextBtn).toBeInTheDocument();
  });

  // ====== 4. 交互: 人数调整 ======

  test('clicking + increases people count', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    // Default minPeople for 游戏机畅玩 is 1, initial is 1
    fireEvent.click(screen.getByText('+'));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('clicking - decreases people count', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    // Increase first then decrease
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('+'));
    expect(screen.getByText('3')).toBeInTheDocument();
    fireEvent.click(screen.getByText('−'));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('cannot go below minPeople', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    // minPeople = 1, initial = 1, clicking - should keep at 1
    fireEvent.click(screen.getByText('−'));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  // ====== 5. 交互: Step 2 → Step 3 日期选择验证 ======

  test('shows error when next clicked without date', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const nextBtn = screen.getByText('下一步 · 填写联系信息');
    fireEvent.click(nextBtn);
    expect(screen.getByText('请选择日期')).toBeInTheDocument();
  });

  // ====== 6. 正例: Step 3 — Contact info ======

  test('info step renders contact name input', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    // Set date and time first so next button works
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    }
    // Click the next button
    const nextBtn = screen.getByText('下一步 · 填写联系信息');
    // Need to select a time slot first
    fireEvent.click(screen.getByText('10:00-12:00'));
    fireEvent.click(nextBtn);
    expect(screen.getByPlaceholderText('请输入姓名')).toBeInTheDocument();
  });

  // ====== 7. 正例: Step 3 — Summary card ======

  test('info step shows booking summary card', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    }
    fireEvent.click(screen.getByText('10:00-12:00'));
    fireEvent.click(screen.getByText('下一步 · 填写联系信息'));
    expect(screen.getByText(/活动/)).toBeInTheDocument();
  });

  test('info step shows price calculation', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('VR体验'));
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    }
    fireEvent.click(screen.getByText('10:00-12:00'));
    fireEvent.click(screen.getByText('下一步 · 填写联系信息'));
    // VR体验 ¥98/人 × 1人 = ¥98
    expect(screen.getByText('¥98')).toBeInTheDocument();
  });

  test('info step has 返回修改 button', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    }
    fireEvent.click(screen.getByText('10:00-12:00'));
    fireEvent.click(screen.getByText('下一步 · 填写联系信息'));
    expect(screen.getByText('← 返回修改')).toBeInTheDocument();
  });

  // ====== 8. 边界: 表单验证 ======

  test('submit without name shows error', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    }
    fireEvent.click(screen.getByText('10:00-12:00'));
    fireEvent.click(screen.getByText('下一步 · 填写联系信息'));
    // Click confirm without filling in name
    fireEvent.click(screen.getByText('确认预约'));
    expect(screen.getByText('请输入联系人姓名')).toBeInTheDocument();
  });

  test('submit with invalid phone shows error', () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    }
    fireEvent.click(screen.getByText('10:00-12:00'));
    fireEvent.click(screen.getByText('下一步 · 填写联系信息'));
    // Fill name but invalid phone
    fireEvent.change(screen.getByPlaceholderText('请输入姓名'), { target: { value: '张三' } });
    fireEvent.click(screen.getByText('确认预约'));
    expect(screen.getByText('请输入正确的手机号')).toBeInTheDocument();
  });

  // ====== 9. 正向: 成功提交 ======

  test('success page shows after valid submission', async () => {
    render(<GroupBookingPage />);
    // Navigate to info step
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    }
    fireEvent.click(screen.getByText('10:00-12:00'));
    fireEvent.click(screen.getByText('下一步 · 填写联系信息'));
    // Fill form
    fireEvent.change(screen.getByPlaceholderText('请输入姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    // Submit
    fireEvent.click(screen.getByText('确认预约'));
    // Wait for 2s timeout to complete
    await waitFor(() => {
      expect(screen.getByText('预约成功！')).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 10000);

  test('success page shows "继续预约" button', async () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    }
    fireEvent.click(screen.getByText('10:00-12:00'));
    fireEvent.click(screen.getByText('下一步 · 填写联系信息'));
    fireEvent.change(screen.getByPlaceholderText('请输入姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('确认预约'));
    await waitFor(() => {
      expect(screen.getByText('继续预约')).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 10000);

  test('success page shows 返回首页 button', async () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    }
    fireEvent.click(screen.getByText('10:00-12:00'));
    fireEvent.click(screen.getByText('下一步 · 填写联系信息'));
    fireEvent.change(screen.getByPlaceholderText('请输入姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('确认预约'));
    await waitFor(() => {
      expect(screen.getByText('返回首页')).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 10000);

  test('success page shows booking details summary', async () => {
    render(<GroupBookingPage />);
    fireEvent.click(screen.getByText('游戏机畅玩'));
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    }
    fireEvent.click(screen.getByText('10:00-12:00'));
    fireEvent.click(screen.getByText('下一步 · 填写联系信息'));
    fireEvent.change(screen.getByPlaceholderText('请输入姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('确认预约'));
    await waitFor(() => {
      const priceElement = screen.getByText(/¥\d+/);
      expect(priceElement).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 10000);
});
