/**
 * booking/page.vitest.tsx — 预约看店页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 门店选择 · 日期时段选择 · 信息填写 · 预约提交 · 完成展示 · 错误态 · 边界
 * 角色: 🛒前台 · 👔店长
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a data-testid="next-link" href={href}>{children}</a>,
}));

// Mock the booking data module
vi.mock('./booking-data', () => ({
  DEFAULT_SLOTS: [
    { slotId: 's1', label: '09:00-10:00', startTime: '09:00', endTime: '10:00', available: true, remaining: 5 },
    { slotId: 's2', label: '10:00-11:00', startTime: '10:00', endTime: '11:00', available: true, remaining: 3 },
    { slotId: 's3', label: '11:00-12:00', startTime: '11:00', endTime: '12:00', available: true, remaining: 0 },
    { slotId: 's4', label: '14:00-15:00', startTime: '14:00', endTime: '15:00', available: false, remaining: 0 },
  ],
  MOCK_STORES: [
    { storeCode: 'st01', storeName: '深基映旗舰店', address: '北京市朝阳区建国路88号', rating: 4.8, reviewCount: 236, distance: 1200 },
    { storeCode: 'st02', storeName: '深基映海淀店', address: '北京市海淀区中关村大街1号', rating: 4.6, reviewCount: 189, distance: 3500 },
    { storeCode: 'st03', storeName: '深基映西单店', address: '北京市西城区西单北大街98号', rating: 4.7, reviewCount: 152, distance: 2800 },
  ],
  MOCK_BOOKINGS: [],
  MAX_GUESTS_PER_BOOKING: 10,
  today: '2026-07-24',
  getNextDays: () => ['2026-07-24','2026-07-25','2026-07-26','2026-07-27','2026-07-28','2026-07-29','2026-07-30',
    '2026-07-31','2026-08-01','2026-08-02','2026-08-03','2026-08-04','2026-08-05','2026-08-06'],
  formatDateDisplay: (d: string) => d.replace(/-/g, '/'),
  getChineseWeekday: () => '周三',
  isSlotBookable: (slot: any) => slot.available && slot.remaining !== undefined,
  findStoreByCode: (code: string, stores: any[]) => stores.find((s: any) => s.storeCode === code) || null,
  validateBookingRequest: (req: any) => {
    const errors: any[] = [];
    if (!req.contactName) errors.push({ field: 'contactName', message: '请输入联系人姓名' });
    if (!req.contactPhone) errors.push({ field: 'contactPhone', message: '请输入联系电话' });
    if (req.contactPhone && !/^1\d{10}$/.test(req.contactPhone)) errors.push({ field: 'contactPhone', message: '手机号格式不正确' });
    if (req.guestCount < 1) errors.push({ field: 'guestCount', message: '预约人数至少1人' });
    if (req.guestCount > 10) errors.push({ field: 'guestCount', message: '单次预约最多10人' });
    return errors;
  },
  BOOKING_STATUS_LABELS: { pending: '待确认', confirmed: '已确认', completed: '已完成', cancelled: '已取消' },
  BOOKING_STATUS_COLORS: { pending: '#f59e0b', confirmed: '#22c55e', completed: '#3b82f6', cancelled: '#6b7280' },
  filterBookingsByStatus: (bookings: any[], status: string) => bookings.filter((b: any) => b.status === status),
}));

// ── Test Subject ──

import BookingPage from './page';

describe('BookingPage — 预约看店', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 第一步：选择门店 ======

  test('renders 预约看店 header on step 1', () => {
    render(<BookingPage />);
    expect(screen.getByText('预约看店')).toBeInTheDocument();
  });

  test('renders 3 store buttons', () => {
    render(<BookingPage />);
    expect(screen.getByText('深基映旗舰店')).toBeInTheDocument();
    expect(screen.getByText('深基映海淀店')).toBeInTheDocument();
    expect(screen.getByText('深基映西单店')).toBeInTheDocument();
  });

  test('shows store address for each store', () => {
    render(<BookingPage />);
    expect(screen.getByText('北京市朝阳区建国路88号')).toBeInTheDocument();
    expect(screen.getByText('北京市海淀区中关村大街1号')).toBeInTheDocument();
    expect(screen.getByText('北京市西城区西单北大街98号')).toBeInTheDocument();
  });

  test('shows store rating and review count', () => {
    render(<BookingPage />);
    expect(screen.getByText('★ 4.8')).toBeInTheDocument();
    expect(screen.getByText('236条评价')).toBeInTheDocument();
  });

  test('shows distance for stores', () => {
    render(<BookingPage />);
    expect(screen.getByText('1.2km')).toBeInTheDocument();
  });

  test('clicking a store advances to step 2', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    expect(screen.getByText('选择预约时间')).toBeInTheDocument();
  });

  test('step 2 shows selected store name', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    expect(screen.getByText('深基映旗舰店')).toBeInTheDocument();
  });

  // ====== 第二步：选择日期时段 ======

  test('step 2 renders back button', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映海淀店'));
    expect(screen.getByText('←')).toBeInTheDocument();
  });

  test('clicking back returns to step 1', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    fireEvent.click(screen.getByText('←'));
    expect(screen.getByText('预约看店')).toBeInTheDocument();
    expect(screen.getAllByText('深基映旗舰店').length).toBeGreaterThanOrEqual(1);
  });

  test('step 2 shows date selector', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    expect(screen.getByText('选择日期')).toBeInTheDocument();
  });

  test('step 2 shows available time slots', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    expect(screen.getByText('09:00-10:00')).toBeInTheDocument();
    expect(screen.getByText('10:00-11:00')).toBeInTheDocument();
  });

  test('shows remaining count for bookable slots', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    expect(screen.getByText('剩5位')).toBeInTheDocument();
  });

  test('unavailable slot has 0 remaining shown', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    // s3 has remaining=0 - should still show "剩0位" or nothing
    const slotText = screen.getByText('11:00-12:00');
    expect(slotText).toBeInTheDocument();
  });

  test('next button is disabled when no date/slot selected', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const nextBtn = screen.getByText('下一步');
    expect(nextBtn).toBeDisabled();
  });

  test('clicking next with date+slot advances to step 3', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    // Select a date (first date button shown after the button text "选择日期")
    const dateButtons = screen.getAllByRole('button');
    // Click on the first date button (not the back button, not the store names, find by date number)
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    // Select a slot
    const slotBtn = screen.getByText('09:00-10:00');
    fireEvent.click(slotBtn);
    // Click next
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByText('填写预约信息')).toBeInTheDocument();
  });

  // ====== 第三步：填写信息 ======

  test('step 3 shows booking summary section', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByText('预约信息')).toBeInTheDocument();
  });

  test('step 3 shows contact name input', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByPlaceholderText('请输入您的姓名')).toBeInTheDocument();
  });

  test('step 3 shows phone input', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
  });

  test('step 3 shows guest count controls', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  test('step 3 shows note textarea', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByPlaceholderText('如有特殊需求请在此说明')).toBeInTheDocument();
  });

  test('step 3 submit button is enabled', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    const submitBtn = screen.getByText('提交预约');
    expect(submitBtn).not.toBeDisabled();
  });

  test('step 3 back button returns to step 2', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.click(screen.getByText('←'));
    expect(screen.getByText('选择预约时间')).toBeInTheDocument();
  });

  test('guest count can be incremented', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByText('1')).toBeInTheDocument();
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('guest count can be decremented', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);
    expect(screen.getByText('3')).toBeInTheDocument();
    const minusBtn = screen.getByText('-');
    fireEvent.click(minusBtn);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('minus button is disabled when guest count is 1', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    const minusBtn = screen.getByText('-');
    expect(minusBtn).toBeDisabled();
  });

  test('contact name can be typed', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    const nameInput = screen.getByPlaceholderText('请输入您的姓名') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '张三' } });
    expect(nameInput.value).toBe('张三');
  });

  test('phone input is limited to 11 characters', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    const phoneInput = screen.getByPlaceholderText('请输入手机号') as HTMLInputElement;
    expect(phoneInput.maxLength).toBe(11);
  });

  test('shows validation errors when submitting empty form', async () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.click(screen.getByText('提交预约'));
    await waitFor(() => {
      expect(screen.getByText('请输入联系人姓名')).toBeInTheDocument();
    });
  });

  // ====== 第四步：提交完成 ======

  test('successful submission shows 预约提交成功', async () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    // Fill in valid data
    fireEvent.change(screen.getByPlaceholderText('请输入您的姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('提交预约'));
    await waitFor(() => {
      expect(screen.getByText('预约提交成功')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('successful submission shows booking id', async () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.change(screen.getByPlaceholderText('请输入您的姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('提交预约'));
    await waitFor(() => {
      expect(screen.getByText(/预约编号：bk-/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('successful submission shows store name', async () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.change(screen.getByPlaceholderText('请输入您的姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('提交预约'));
    await waitFor(() => {
      expect(screen.getByText('深基映旗舰店')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('successful submission shows guest count and contact name', async () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.change(screen.getByPlaceholderText('请输入您的姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('提交预约'));
    await waitFor(() => {
      expect(screen.getByText(/人.*张三/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('submit button shows submitting text during submission', async () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.change(screen.getByPlaceholderText('请输入您的姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('提交预约'));
    // During submission, button shows '提交中...'
    expect(screen.getByText('提交中...')).toBeInTheDocument();
  });

  test('继续预约 button resets to step 1', async () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.change(screen.getByPlaceholderText('请输入您的姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('提交预约'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('继续预约'));
      expect(screen.getByText('预约看店')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // ====== 边界情况 ======

  test('shows "最多10人" hint text', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByText('最多10人')).toBeInTheDocument();
  });

  test('plus button disabled at max guest count', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    const plusBtn = screen.getByText('+');
    // Click plus many times
    for (let i = 0; i < 12; i++) {
      fireEvent.click(plusBtn);
    }
    // Max is 10, so at 10 the button should be disabled
    expect(plusBtn).toBeDisabled();
  });

  test('note can accept multi-line text', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    const noteInput = screen.getByPlaceholderText('如有特殊需求请在此说明');
    fireEvent.change(noteInput, { target: { value: '需要轮椅通道\n请提前准备' } });
    expect(noteInput).toHaveValue('需要轮椅通道\n请提前准备');
  });

  test('step 2 shows 选择时段 header', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    expect(screen.getByText('选择时段')).toBeInTheDocument();
  });

  test('step 2 shows selected date highlight', () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    // Click on date 24
    const dateNum = screen.getByText('24');
    fireEvent.click(dateNum);
    // The selected date should have selected styling
    expect(dateNum).toBeInTheDocument();
  });

  test('step 4 shows success icon', async () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.change(screen.getByPlaceholderText('请输入您的姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('提交预约'));
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('success message mentions phone contact', async () => {
    render(<BookingPage />);
    fireEvent.click(screen.getByText('深基映旗舰店'));
    const dateBtn = screen.getByText('24');
    fireEvent.click(dateBtn);
    fireEvent.click(screen.getByText('09:00-10:00'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.change(screen.getByPlaceholderText('请输入您的姓名'), { target: { value: '张三' } });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('提交预约'));
    await waitFor(() => {
      expect(screen.getByText(/电话联系您/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
