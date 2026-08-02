/**
 * member-register/page.vitest.tsx — 会员注册页面 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 注册表单 · 字段验证 · 验证码 · 条款同意 · 统计面板 · 新会员福利 · 注册记录 · 边界
 * 角色: 👤 前台顾客 / 🛒 导购员协助
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ====== Mock next/navigation ======
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// ====== Mock @m5/ui ======
vi.mock('@m5/ui', () => ({
  FormField: ({ children, label, error, required }: {
    children: React.ReactNode; label?: string; error?: string; required?: boolean;
  }) => (
    <div data-testid="form-field">
      {label && <label>{label}{required && ' *'}</label>}
      {children}
      {error && <span data-testid="field-error" style={{ color: '#ef4444' }}>{error}</span>}
    </div>
  ),
  SubmitButton: ({ children, loading, style }: { children: React.ReactNode; loading?: boolean; style?: React.CSSProperties }) => (
    <button data-testid="submit-btn" disabled={loading} style={style}>{loading ? '注册中...' : children}</button>
  ),
  FormSubmitFeedback: ({ submitting, error, success }: { submitting?: boolean; error?: string; success?: string }) => (
    <div data-testid="form-feedback">
      {error && <span data-testid="error-msg">{error}</span>}
      {success && <span data-testid="success-msg">{success}</span>}
    </div>
  ),
  PageShell: () => null,
  StatusBadge: () => null,
}));

// ====== Mock member-auth-service ======
const mockSendCode = vi.fn();
vi.mock('../../lib/member-auth-service', () => ({
  memberAuthService: {
    sendSmsCode: (...args: unknown[]) => mockSendCode(...args),
  },
}));

// ====== Test Subject ======
import MemberRegisterPage from './page';

describe('MemberRegisterPage — 会员注册', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockReset();
    mockSendCode.mockResolvedValue({ success: true });
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<MemberRegisterPage />)).not.toThrow();
  });

  test('renders page title', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('会员注册')).toBeInTheDocument();
  });

  test('renders page subtitle', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('注册成为会员，享受积分和优惠')).toBeInTheDocument();
  });

  test('renders mobile input field', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByPlaceholderText('请输入11位手机号')).toBeInTheDocument();
  });

  test('renders code input field', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByPlaceholderText('6位验证码')).toBeInTheDocument();
  });

  test('renders nickname input field', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByPlaceholderText('请输入您的昵称')).toBeInTheDocument();
  });

  test('renders register submit button', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('注册会员')).toBeInTheDocument();
  });

  test('renders login link', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('立即登录')).toBeInTheDocument();
    const loginLink = screen.getByText('立即登录').closest('a');
    expect(loginLink).toHaveAttribute('href', '/member-login');
  });

  test('renders terms checkbox', () => {
    render(<MemberRegisterPage />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  test('renders terms and privacy links', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('服务条款')).toBeInTheDocument();
    expect(screen.getByText('隐私政策')).toBeInTheDocument();
  });

  // ====== 验证码按钮 ======

  test('renders send code button', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('获取验证码')).toBeInTheDocument();
  });

  test('send code button triggers countdown on valid mobile', async () => {
    render(<MemberRegisterPage />);
    const mobileInput = screen.getByPlaceholderText('请输入11位手机号');
    fireEvent.change(mobileInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('获取验证码'));
    await waitFor(() => {
      expect(screen.getByText(/60s/)).toBeInTheDocument();
    });
  });

  test('send code is disabled during countdown', async () => {
    render(<MemberRegisterPage />);
    const mobileInput = screen.getByPlaceholderText('请输入11位手机号');
    fireEvent.change(mobileInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('获取验证码'));
    await waitFor(() => {
      const btn = screen.getByText(/60s/);
      expect(btn).toBeDisabled();
    });
  });

  test('send code shows error for empty mobile', async () => {
    render(<MemberRegisterPage />);
    fireEvent.click(screen.getByText('获取验证码'));
    await waitFor(() => {
      expect(screen.getByText('请先输入正确的手机号')).toBeInTheDocument();
    });
  });

  // ====== 表单验证 ======

  test('shows validation errors when submitting empty form', async () => {
    render(<MemberRegisterPage />);
    fireEvent.click(screen.getByText('注册会员'));
    await waitFor(() => {
      expect(screen.getByText('请输入有效的11位手机号')).toBeInTheDocument();
      expect(screen.getByText('验证码必须为6位')).toBeInTheDocument();
      expect(screen.getByText('请输入昵称')).toBeInTheDocument();
    });
  });

  test('shows agree terms error when unchecked', async () => {
    render(<MemberRegisterPage />);
    const mobileInput = screen.getByPlaceholderText('请输入11位手机号');
    fireEvent.change(mobileInput, { target: { value: '13800138000' } });
    const codeInput = screen.getByPlaceholderText('6位验证码');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    const nicknameInput = screen.getByPlaceholderText('请输入您的昵称');
    fireEvent.change(nicknameInput, { target: { value: '测试用户' } });
    fireEvent.click(screen.getByText('注册会员'));
    await waitFor(() => {
      expect(screen.getByText('请同意服务条款')).toBeInTheDocument();
    });
  });

  test('clears field error on input change', async () => {
    render(<MemberRegisterPage />);
    fireEvent.click(screen.getByText('注册会员'));
    await waitFor(() => {
      expect(screen.getByText('请输入有效的11位手机号')).toBeInTheDocument();
    });
    const mobileInput = screen.getByPlaceholderText('请输入11位手机号');
    fireEvent.change(mobileInput, { target: { value: '13800138000' } });
    await waitFor(() => {
      expect(screen.queryByText('请输入有效的11位手机号')).not.toBeInTheDocument();
    });
  });

  test('submits form with all valid fields', async () => {
    render(<MemberRegisterPage />);
    const mobileInput = screen.getByPlaceholderText('请输入11位手机号');
    fireEvent.change(mobileInput, { target: { value: '13800138000' } });
    const codeInput = screen.getByPlaceholderText('6位验证码');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    const nicknameInput = screen.getByPlaceholderText('请输入您的昵称');
    fireEvent.change(nicknameInput, { target: { value: '测试用户' } });
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByText('注册会员'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/member-login?registered=true');
    });
  });

  // ====== 统计面板 ======

  test('renders registration stats panel', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('注册统计')).toBeInTheDocument();
    expect(screen.getByText('今日注册')).toBeInTheDocument();
    expect(screen.getByText('本周注册')).toBeInTheDocument();
    expect(screen.getByText('本月注册')).toBeInTheDocument();
    expect(screen.getByText('累计注册')).toBeInTheDocument();
  });

  test('renders stat values', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('12')).toBeInTheDocument(); // todayCount
    expect(screen.getByText('76')).toBeInTheDocument(); // weekCount
    expect(screen.getByText('312')).toBeInTheDocument(); // monthCount
    expect(screen.getByText('5,862')).toBeInTheDocument(); // totalCount
  });

  // ====== 新会员福利 ======

  test('renders promotion banners', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('新会员福利')).toBeInTheDocument();
    expect(screen.getByText('新会员礼包')).toBeInTheDocument();
    expect(screen.getByText('首充双倍')).toBeInTheDocument();
    expect(screen.getByText('好友邀请')).toBeInTheDocument();
  });

  test('renders promotion descriptions', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('注册即送 200 积分 + 游戏币 20 枚')).toBeInTheDocument();
    expect(screen.getByText('首次充值享双倍金额，最高 200 元')).toBeInTheDocument();
    expect(screen.getByText('邀请好友注册各得 100 积分')).toBeInTheDocument();
  });

  // ====== 注册流程 ======

  test('renders registration steps', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('注册流程')).toBeInTheDocument();
    expect(screen.getByText('填写手机号')).toBeInTheDocument();
    expect(screen.getByText('验证身份')).toBeInTheDocument();
    expect(screen.getByText('完善资料')).toBeInTheDocument();
    expect(screen.getByText('注册成功')).toBeInTheDocument();
  });

  // ====== 最近注册记录 ======

  test('renders recent registration table', () => {
    render(<MemberRegisterPage />);
    expect(screen.getByText('最近注册')).toBeInTheDocument();
    expect(screen.getByText('小明')).toBeInTheDocument();
    expect(screen.getByText('阿花')).toBeInTheDocument();
    expect(screen.getByText('大伟')).toBeInTheDocument();
    expect(screen.getByText('丽丽')).toBeInTheDocument();
  });

  test('renders verification statuses in registration table', () => {
    render(<MemberRegisterPage />);
    const verified = screen.getAllByText(/已验证/);
    expect(verified.length).toBeGreaterThan(0);
    const pending = screen.getAllByText(/待验证/);
    expect(pending.length).toBeGreaterThan(0);
  });

  // ====== 边界 ======

  test('mobile input limited to 11 chars', () => {
    render(<MemberRegisterPage />);
    const mobileInput = screen.getByPlaceholderText('请输入11位手机号');
    expect(mobileInput).toHaveAttribute('maxLength', '11');
  });

  test('nickname input limited to 20 chars', () => {
    render(<MemberRegisterPage />);
    const nicknameInput = screen.getByPlaceholderText('请输入您的昵称');
    expect(nicknameInput).toHaveAttribute('maxLength', '20');
  });

  test('code input limited to 6 chars', () => {
    render(<MemberRegisterPage />);
    const codeInput = screen.getByPlaceholderText('6位验证码');
    expect(codeInput).toHaveAttribute('maxLength', '6');
  });

  test('checkbox can be checked and unchecked', () => {
    render(<MemberRegisterPage />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });
});
