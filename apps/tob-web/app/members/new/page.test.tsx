import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

// Mock useToast
const mockToastWarning = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock('@m5/ui', async () => {
  const actual = await vi.importActual('@m5/ui');
  return {
    ...actual,
    useToast: () => ({
      success: mockToastSuccess,
      warning: mockToastWarning,
      error: vi.fn(),
      info: vi.fn(),
    }),
  };
});

import TobMemberNewPage from './page';

describe('TobMemberNewPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test('renders the form with all required fields', () => {
    render(<TobMemberNewPage />);

    expect(screen.getByText('新增会员')).toBeTruthy();
    expect(screen.getByLabelText(/会员姓名/)).toBeTruthy();
    expect(screen.getByLabelText(/手机号/)).toBeTruthy();
    expect(screen.getByLabelText(/邮箱/)).toBeTruthy();
    expect(screen.getByLabelText(/会员等级/)).toBeTruthy();
    expect(screen.getByTestId('tob-member-name-input')).toBeTruthy();
    expect(screen.getByTestId('tob-member-phone-input')).toBeTruthy();
    expect(screen.getByTestId('tob-member-email-input')).toBeTruthy();
    expect(screen.getByTestId('tob-member-points-input')).toBeTruthy();
    expect(screen.getByTestId('tob-member-store-input')).toBeTruthy();
    expect(screen.getByTestId('tob-member-salesperson-input')).toBeTruthy();
    expect(screen.getByTestId('tob-member-remark-input')).toBeTruthy();
  });

  test('shows validation errors when submitting empty form', async () => {
    render(<TobMemberNewPage />);

    const submitBtn = screen.getByTestId('tob-member-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('姓名不能为空')).toBeTruthy();
      expect(screen.getByText('手机号不能为空')).toBeTruthy();
      expect(screen.getByText('邮箱不能为空')).toBeTruthy();
      expect(screen.getByText('请选择会员等级')).toBeTruthy();
    });

    expect(mockToastWarning).toHaveBeenCalledWith('请修正表单中的错误');
  });

  test('validates phone format', async () => {
    render(<TobMemberNewPage />);

    const phoneInput = screen.getByTestId('tob-member-phone-input');
    await userEvent.type(phoneInput, '12345');
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText('请输入有效的11位手机号')).toBeTruthy();
    });
  });

  test('validates name minimum length', async () => {
    render(<TobMemberNewPage />);

    const nameInput = screen.getByTestId('tob-member-name-input');
    await userEvent.type(nameInput, 'A');
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.getByText('姓名至少2个字符')).toBeTruthy();
    });
  });

  test('validates email format', async () => {
    render(<TobMemberNewPage />);

    const emailInput = screen.getByTestId('tob-member-email-input');
    await userEvent.type(emailInput, 'not-an-email');
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('请输入有效的邮箱地址')).toBeTruthy();
    });
  });

  test('validates points as non-negative integer', async () => {
    render(<TobMemberNewPage />);

    const pointsInput = screen.getByTestId('tob-member-points-input');
    await userEvent.type(pointsInput, '-50');
    fireEvent.blur(pointsInput);

    await waitFor(() => {
      expect(screen.getByText('积分必须为非负整数')).toBeTruthy();
    });
  });

  test('clears field error on change after touch', async () => {
    render(<TobMemberNewPage />);

    const nameInput = screen.getByTestId('tob-member-name-input');

    // Trigger error
    await userEvent.type(nameInput, 'A');
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.getByText('姓名至少2个字符')).toBeTruthy();
    });

    // Fix the field
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, '张三');

    // Error should be gone
    await waitFor(() => {
      expect(screen.queryByText('姓名至少2个字符')).toBeNull();
    });
  });

  test('submits form successfully with valid data', async () => {
    render(<TobMemberNewPage />);

    await userEvent.type(screen.getByTestId('tob-member-name-input'), '张三');
    await userEvent.type(screen.getByTestId('tob-member-phone-input'), '13800138000');
    await userEvent.type(screen.getByTestId('tob-member-email-input'), 'test@example.com');

    // Select tier
    const tierSelect = screen.getByLabelText('会员等级');
    await userEvent.selectOptions(tierSelect, 'diamond');

    await userEvent.type(screen.getByTestId('tob-member-points-input'), '1000');
    await userEvent.type(screen.getByTestId('tob-member-store-input'), '旗舰店(上海)');
    await userEvent.type(screen.getByTestId('tob-member-salesperson-input'), '张三');

    const submitBtn = screen.getByTestId('tob-member-submit-btn');
    fireEvent.click(submitBtn);

    // Wait for the simulated success (1.2s + 1.5s redirect)
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('会员创建成功');
    }, { timeout: 5000 });
  });

  test('cancel button calls router.back()', () => {
    render(<TobMemberNewPage />);

    const cancelBtn = screen.getByText('取消');
    fireEvent.click(cancelBtn);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
