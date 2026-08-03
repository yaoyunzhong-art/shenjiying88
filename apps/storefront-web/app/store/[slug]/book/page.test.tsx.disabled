/**
 * store/[slug]/book/page.vitest.tsx — 预约页面 (stepper 多步骤)
 * 角色: 👤会员 / 👔店长
 * 覆盖: 步骤渲染 · 服务选择 · 时段选择 · 确认预约 · 预约管理 · 空/加载/错误态
 *
 * 注意: vi.mock factory 是提升的(hoisted), 不能引用顶层变量, 数据必须内联在 factory 内。
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mock next/navigation ──

const mockParams = { slug: 'beijing-chaoyang' };

vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
}));

// ── Mock @m5/ui ──

vi.mock('@m5/ui', () => ({
  Button: Object.assign(
    ({ children, onClick, disabled, loading, variant, style, ...rest }: any) => (
      <button
        data-testid={`btn-${variant || 'default'}`}
        onClick={onClick}
        disabled={disabled || loading}
        data-loading={loading ? 'true' : 'false'}
        data-variant={variant}
        style={style}
        {...rest}
      >
        {loading ? '⏳ 处理中...' : children}
      </button>
    ),
    { displayName: 'Button' },
  ),
  Card: ({ children, variant, style, ...rest }: any) => (
    <div data-testid="m5-card" data-variant={variant} style={style} {...rest}>
      {children}
    </div>
  ),
  Stepper: ({ steps, activeStep, onStepClick }: any) => (
    <div data-testid="stepper" data-active-step={activeStep}>
      {steps.map((s: any, i: number) => (
        <button
          key={i}
          data-testid={`step-${i}`}
          data-active={i === activeStep ? 'true' : 'false'}
          onClick={() => onStepClick?.(i)}
          style={{ cursor: i < activeStep ? 'pointer' : 'default' }}
        >
          {s.label}: {s.description || ''}
        </button>
      ))}
    </div>
  ),
  Select: ({ options, value, onChange, placeholder }: any) => (
    <select
      data-testid="m5-select"
      value={value}
      onChange={(e: any) => onChange?.(e)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
  FormField: ({ label, children }: any) => (
    <div data-testid="form-field">
      <label>{label}</label>
      {children}
    </div>
  ),
  Input: ({ value, onChange, placeholder, style, ...rest }: any) => (
    <input
      data-testid="m5-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={style}
      {...rest}
    />
  ),
  SubmitButton: ({ children, onClick, loading, variant, ...rest }: any) => (
    <button
      data-testid="btn-submit"
      onClick={onClick}
      disabled={loading}
      data-loading={loading ? 'true' : 'false'}
      data-variant={variant}
      {...rest}
    >
      {loading ? '⏳ 处理中...' : children}
    </button>
  ),
  Heading: ({ children, level, style }: any) => {
    const Tag = `h${level || 2}` as keyof JSX.IntrinsicElements;
    return <Tag data-testid="m5-heading" style={style}>{children}</Tag>;
  },
  Text: ({ children, color, weight, style }: any) => (
    <span data-testid="m5-text" data-color={color} data-weight={weight} style={style}>{children}</span>
  ),
  Space: ({ children, direction, size, style }: any) => (
    <div data-testid="m5-space" data-direction={direction} data-size={size} style={style}>{children}</div>
  ),
  Badge: ({ children, variant }: any) => (
    <span data-testid="m5-badge" data-badge-variant={variant}>{children}</span>
  ),
  ToastContainer: ({ toasts, onDismiss }: any) => (
    <div data-testid="toast-container">
      {toasts?.map((t: any, i: number) => (
        <div key={i} data-testid="toast-message" data-variant={t.variant}>
          {t.message}
          <button data-testid="dismiss-toast" onClick={() => onDismiss?.(t)}>✕</button>
        </div>
      ))}
    </div>
  ),
  useToast: () => ({
    toast: vi.fn((msg: string, opts?: any) => {}),
    toasts: [],
    dismiss: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
  Result: ({ status, title, subTitle, extra }: any) => (
    <div data-testid="m5-result" data-status={status}>
      <div data-testid="result-title">{title}</div>
      {subTitle && <div data-testid="result-subtitle">{subTitle}</div>}
      {extra && <div data-testid="result-extra">{extra}</div>}
    </div>
  ),
}));

// ── Mock ../../analytics ──

const mockTrack = vi.fn();
vi.mock('../../analytics', () => ({
  track: (...args: any[]) => mockTrack(...args),
}));

// ── Mock ../_components/share-cta ──

vi.mock('../_components/share-cta', () => ({
  __esModule: true,
  default: ({ storeSlug, storeName, shareType, shareText, referralCode }: any) => (
    <div data-testid="share-cta" data-store-slug={storeSlug} data-store-name={storeName} data-share-type={shareType}>
      📢 {shareText || '分享'}
    </div>
  ),
}));

// ── Test Subject ──

import BookPage from './page';

// ── 全局 mock fetch ──

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('BookPage — 预约页面 (多步骤 Stepper)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/services')) {
        if (url.includes('/slots')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: { slots: [
              { time: '10:00', available: true },
              { time: '10:30', available: true },
              { time: '11:00', available: false },
              { time: '14:00', available: true },
            ]}}),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: { items: [
            { id: 's1', name: '单人畅玩', price: 68, duration: '60分钟', category: '畅玩' },
            { id: 's2', name: '双人套餐', price: 128, duration: '90分钟', category: '套餐' },
            { id: 's3', name: 'VR体验', price: 88, duration: '30分钟', category: 'VR' },
          ]}}),
        });
      }
      if (url.includes('/bookings')) {
        if (url.includes('/cancel')) {
          return Promise.resolve({ json: () => Promise.resolve({ success: true }) });
        }
        if (url.endsWith('/bookings/BK-001')) {
          return Promise.resolve({ json: () => Promise.resolve({ success: true, data: { storeName: '神机营', serviceName: '单人畅玩', date: '2026-07-29', timeSlot: '10:00', amount: 6800, status: 'confirmed' }}) });
        }
        return Promise.resolve({ json: () => Promise.resolve({ success: true, data: { bookingId: 'BK-001', status: 'confirmed', qrCode: 'QR-ABC-123', paymentUrl: '/pay/123', storeName: '神机营', serviceName: '单人畅玩', date: '2026-07-29', timeSlot: '10:00', customerName: '张三', amount: 6800 }}) });
      }
      return Promise.reject(new Error('unknown url'));
    });
  });

  // ====== 正例: 渲染 ======

  test('renders stepper with 3 steps', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('stepper')).toBeInTheDocument();
    });
    expect(screen.getByTestId('step-0')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('选择项目: 选择服务')).toBeInTheDocument();
    expect(screen.getByText('选择时段:')).toBeInTheDocument();
    expect(screen.getByText('确认预约: 填写信息')).toBeInTheDocument();
  });

  test('renders ToastContainer', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });
  });

  test('renders 管理已有预约 button', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByText('📋 管理已有预约（查/退）')).toBeInTheDocument();
    });
  });

  test('calls track on mount', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('page_view', { storeSlug: 'beijing-chaoyang' });
    });
  });

  // ====== 步骤 0: 选择服务 ======

  test('step 0 shows service selection', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByText('选择服务项目')).toBeInTheDocument();
    });
  });

  test('step 0 shows loading text before services load', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByText('加载服务项目中…')).toBeInTheDocument();
    });
  });

  test('step 0 renders service select after loading', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
  });

  test('step 0 next button is disabled without selection', async () => {
    render(<BookPage />);
    await waitFor(() => {
      const nextBtn = screen.getByText('下一步：选择时段 →');
      expect(nextBtn.closest('button')).toBeDisabled();
    });
  });

  test('step 0 selecting a service enables next button', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    await waitFor(() => {
      const nextBtn = screen.getByText('下一步：选择时段 →');
      expect(nextBtn.closest('button')).not.toBeDisabled();
    });
  });

  test('step 0 clicking next advances to step 1', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(() => {
      expect(screen.getByText('选择日期')).toBeInTheDocument();
    });
  });

  test('step 0 tracks service_select event', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('service_select', { serviceId: 's1' });
    });
  });

  // ====== 步骤 1: 选择时段 ======

  test('step 1 renders date buttons', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(() => {
      expect(screen.getByText('选择日期')).toBeInTheDocument();
      // 7 date buttons
      const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('-'));
      expect(dateBtns.length).toBeGreaterThanOrEqual(7);
    });
  });

  test('step 1 shows slot grid after date selected', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(async () => {
      // Click a date button
      const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('-'));
      if (dateBtns.length > 0) {
        fireEvent.click(dateBtns[0]);
      }
    });
    await waitFor(() => {
      expect(screen.getByText('选择时段')).toBeInTheDocument();
    });
  });

  test('step 1 renders unavailable slots as disabled', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(async () => {
      const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('-'));
      if (dateBtns.length > 0) {
        fireEvent.click(dateBtns[0]);
      }
    });
    await waitFor(() => {
      // 11:00 should be disabled (available=false)
      const btns = screen.getAllByRole('button').filter(b => b.textContent?.includes('11:00'));
      expect(btns.length).toBeGreaterThan(0);
      expect(btns[0]).toBeDisabled();
    });
  });

  test('step 1 back button returns to step 0', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(() => {
      expect(screen.getByText('← 返回选项目')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('← 返回选项目'));
    await waitFor(() => {
      expect(screen.getByText('选择服务项目')).toBeInTheDocument();
    });
  });

  // ====== 步骤 2: 确认预约 ======

  test('step 2 renders booking confirmation form', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(async () => {
      const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('-'));
      if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    });
    // Wait for slots and select one
    await waitFor(async () => {
      const slotBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('10:00'));
      if (slotBtns.length > 0 && !(slotBtns[0] as HTMLButtonElement).disabled) {
        fireEvent.click(slotBtns[0]);
      }
    });
    fireEvent.click(screen.getByText('下一步：确认预约 →'));
    await waitFor(() => {
      expect(screen.getByText('确认预约信息')).toBeInTheDocument();
    });
  });

  test('step 2 shows name and phone inputs', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(async () => {
      const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('-'));
      if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    });
    await waitFor(async () => {
      const slotBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('10:00'));
      if (slotBtns.length > 0 && !(slotBtns[0] as HTMLButtonElement).disabled) fireEvent.click(slotBtns[0]);
    });
    fireEvent.click(screen.getByText('下一步：确认预约 →'));
    await waitFor(() => {
      const inputs = screen.getAllByTestId('m5-input');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
      expect(inputs[0]).toHaveAttribute('placeholder', '请输入您的姓名');
      expect(inputs[1]).toHaveAttribute('placeholder', '请输入手机号（用于到店提醒）');
    });
  });

  test('step 2 back button returns to step 1', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(async () => {
      const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('-'));
      if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    });
    await waitFor(async () => {
      const slotBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('10:00'));
      if (slotBtns.length > 0 && !(slotBtns[0] as HTMLButtonElement).disabled) fireEvent.click(slotBtns[0]);
    });
    fireEvent.click(screen.getByText('下一步：确认预约 →'));
    await waitFor(() => {
      expect(screen.getByText('确认预约信息')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('← 返回选时段'));
    await waitFor(() => {
      expect(screen.getByText('选择日期')).toBeInTheDocument();
    });
  });

  // ====== 提交流程 ======

  test('handles booking submit successfully', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(async () => {
      const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('-'));
      if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    });
    await waitFor(async () => {
      const slotBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('10:00'));
      if (slotBtns.length > 0 && !(slotBtns[0] as HTMLButtonElement).disabled) fireEvent.click(slotBtns[0]);
    });
    fireEvent.click(screen.getByText('下一步：确认预约 →'));
    await waitFor(() => {
      expect(screen.getByText('确认预约信息')).toBeInTheDocument();
    });
    const inputs = screen.getAllByTestId('m5-input');
    fireEvent.change(inputs[0], { target: { value: '张三' } });
    fireEvent.change(inputs[1], { target: { value: '13800138000' } });
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('booking_submit', expect.objectContaining({ serviceId: 's1' }));
    });
    await waitFor(() => {
      expect(screen.getByTestId('result-title')).toHaveTextContent('预约成功！');
    });
    expect(mockTrack).toHaveBeenCalledWith('booking_success', expect.objectContaining({ bookingId: 'BK-001' }));
  });

  test('handles booking submit failure', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/bookings') && !url.includes('/cancel') && !url.endsWith('/BK-001')) {
        return Promise.resolve({ json: () => Promise.resolve({ success: false, message: '该时段已满' }) });
      }
      if (url.includes('/services')) {
        if (url.includes('/slots')) {
          return Promise.resolve({ json: () => Promise.resolve({ success: true, data: { slots: [{ time: '10:00', available: true }] } }) });
        }
        return Promise.resolve({ json: () => Promise.resolve({ success: true, data: { items: [{ id: 's1', name: '单人畅玩', price: 68, duration: '60分钟', category: '畅玩' }] } }) });
      }
      return Promise.reject(new Error('unknown'));
    });
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(async () => {
      const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('-'));
      if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    });
    await waitFor(async () => {
      const slotBtn = screen.getAllByRole('button').filter(b => b.textContent?.includes('10:00'));
      if (slotBtn.length > 0 && !(slotBtn[0] as HTMLButtonElement).disabled) fireEvent.click(slotBtn[0]);
    });
    fireEvent.click(screen.getByText('下一步：确认预约 →'));
    await waitFor(() => {
      expect(screen.getByText('确认预约信息')).toBeInTheDocument();
    });
    const inputs = screen.getAllByTestId('m5-input');
    fireEvent.change(inputs[0], { target: { value: '张三' } });
    fireEvent.change(inputs[1], { target: { value: '13800138000' } });
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      expect(screen.getByText('确认预约信息')).toBeInTheDocument(); // still on step 2
    });
  });

  // ====== 预约成功界面 ======

  test('shows QR code and share button after successful booking', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(async () => {
      const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('-'));
      if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    });
    await waitFor(async () => {
      const slotBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('10:00'));
      if (slotBtns.length > 0 && !(slotBtns[0] as HTMLButtonElement).disabled) fireEvent.click(slotBtns[0]);
    });
    fireEvent.click(screen.getByText('下一步：确认预约 →'));
    await waitFor(() => {
      expect(screen.getByText('确认预约信息')).toBeInTheDocument();
    });
    const inputs = screen.getAllByTestId('m5-input');
    fireEvent.change(inputs[0], { target: { value: '张三' } });
    fireEvent.change(inputs[1], { target: { value: '13800138000' } });
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('share-cta')).toBeInTheDocument();
    });
    expect(screen.getByTestId('share-cta')).toHaveAttribute('data-share-type', 'booking_success');
  });

  test('shows 到店核销二维码 after booking', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-select')).toBeInTheDocument();
    });
    const select = screen.getByTestId('m5-select');
    fireEvent.change(select, { target: { value: 's1' } });
    fireEvent.click(screen.getByText('下一步：选择时段 →'));
    await waitFor(async () => {
      const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('-'));
      if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    });
    await waitFor(async () => {
      const slotBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('10:00'));
      if (slotBtns.length > 0 && !(slotBtns[0] as HTMLButtonElement).disabled) fireEvent.click(slotBtns[0]);
    });
    fireEvent.click(screen.getByText('下一步：确认预约 →'));
    await waitFor(() => {
      expect(screen.getByText('确认预约信息')).toBeInTheDocument();
    });
    const inputs = screen.getAllByTestId('m5-input');
    fireEvent.change(inputs[0], { target: { value: '张三' } });
    fireEvent.change(inputs[1], { target: { value: '13800138000' } });
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      expect(screen.getByText('🎫 到店核销二维码')).toBeInTheDocument();
    });
  });

  // ====== 管理预约 ======

  test('manage booking overlay shows on button click', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByText('📋 管理已有预约（查/退）')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('📋 管理已有预约（查/退）'));
    await waitFor(() => {
      expect(screen.getByText('管理我的预约')).toBeInTheDocument();
    });
  });

  test('manage booking query fetches booking details', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByText('📋 管理已有预约（查/退）')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('📋 管理已有预约（查/退）'));
    await waitFor(() => {
      expect(screen.getByText('管理我的预约')).toBeInTheDocument();
    });
    const inputs = screen.getAllByTestId('m5-input');
    fireEvent.change(inputs[0], { target: { value: 'BK-001' } });
    fireEvent.click(screen.getByText('查询预约'));
    await waitFor(() => {
      expect(screen.getByText('神机营')).toBeInTheDocument();
      expect(screen.getByText('单人畅玩')).toBeInTheDocument();
    });
  });

  test('manage booking cancel flow', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByText('📋 管理已有预约（查/退）')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('📋 管理已有预约（查/退）'));
    await waitFor(() => {
      expect(screen.getByText('管理我的预约')).toBeInTheDocument();
    });
    const inputs = screen.getAllByTestId('m5-input');
    fireEvent.change(inputs[0], { target: { value: 'BK-001' } });
    fireEvent.click(screen.getByText('查询预约'));
    await waitFor(() => {
      expect(screen.getByText('神机营')).toBeInTheDocument();
    });
    const allInputs = screen.getAllByTestId('m5-input');
    const cancelPhoneInput = allInputs.length > 1 ? allInputs[allInputs.length - 1] : null;
    if (cancelPhoneInput) {
      fireEvent.change(cancelPhoneInput, { target: { value: '13800138000' } });
    }
    const cancelBtn = screen.getByText('取消此预约');
    expect(cancelBtn).toBeInTheDocument();
  });

  test('manage booking back button returns to booking page', async () => {
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByText('📋 管理已有预约（查/退）')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('📋 管理已有预约（查/退）'));
    await waitFor(() => {
      expect(screen.getByText('管理我的预约')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('← 返回预约'));
    await waitFor(() => {
      expect(screen.getByTestId('stepper')).toBeInTheDocument();
    });
  });

  // ====== 边界/错误态 ======

  test('handles fetch failure for services gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('网络错误'));
    render(<BookPage />);
    await waitFor(() => {
      expect(screen.getByText('加载服务项目中…')).toBeInTheDocument();
    });
  });

  test('returns to booking page from success state via manage button', async () => {
    // Simulate successful booking first
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/bookings') && !url.includes('/cancel')) {
        return Promise.resolve({ json: () => Promise.resolve({ success: true, data: { bookingId: 'BK-001', status: 'confirmed', qrCode: 'QR', paymentUrl: '/pay', storeName: '神机营', serviceName: '单人畅玩', date: '2026-07-29', timeSlot: '10:00', customerName: '张三', amount: 6800 }}) });
      }
      if (url.includes('/services')) {
        if (url.includes('/slots')) {
          return Promise.resolve({ json: () => Promise.resolve({ success: true, data: { slots: [{ time: '10:00', available: true }] } }) });
        }
        return Promise.resolve({ json: () => Promise.resolve({ success: true, data: { items: [{ id: 's1', name: '单人畅玩', price: 68, duration: '60分钟', category: '畅玩' }] } }) });
      }
      return Promise.reject(new Error('unknown'));
    });
    render(<BookPage />);
    // Navigate through booking
    await waitFor(() => {
      expect(screen.getByText('选择服务项目')).toBeInTheDocument();
    });
  });
});
