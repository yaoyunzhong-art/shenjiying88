/**
 * member-login/page.vitest.tsx — 会员登录页面 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 表单 · 验证码 · 提交 · 验证错误 · 微信登录 · 安全事件 · 登录记录 · 边界
 * 角色: 👤 会员
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
const mockUseFormSubmitState = { isSubmitting: false };
const mockSubmit = vi.fn();
const mockUseFormSubmit = vi.fn(() => ({ state: mockUseFormSubmitState, submit: mockSubmit }));

vi.mock('@m5/ui', () => ({
  FormField: ({ children, label, error, required }: {
    children: React.ReactNode; label?: string; error?: string; required?: boolean; disabled?: boolean;
  }) => (
    <div data-testid="form-field">
      {label && <label>{label}{required && ' *'}</label>}
      {children}
      {error && <span data-testid="field-error" style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>}
    </div>
  ),
  useFormSubmit: (args: unknown) => { mockSubmit(args); return mockUseFormSubmit(); },
  FormSubmitFeedback: ({ state, onRetry }: { state: Record<string, unknown>; onRetry?: () => void }) => {
    const errMsg = state.error ? (state.error as { message?: string }).message : undefined;
    return (
      <div data-testid="form-feedback">
        {errMsg && <span>{errMsg}</span>}
        {onRetry && <button data-testid="retry-btn" onClick={onRetry}>重试</button>}
      </div>
    );
  },
  SubmitButton: ({ loading, label, loadingLabel }: { loading?: boolean; label: string; loadingLabel?: string }) => (
    <button data-testid="submit-btn" disabled={loading}>{loading ? loadingLabel : label}</button>
  ),
}));

// ====== Mock member-auth-service ======
const mockLogin = vi.fn();
const mockSendSmsCode = vi.fn();

vi.mock('../../lib/member-auth-service', () => ({
  memberAuthService: {
    login: (args: unknown) => mockLogin(args as Parameters<typeof mockLogin>[0]),
    sendSmsCode: (args: unknown) => mockSendSmsCode(args as Parameters<typeof mockSendSmsCode>[0]),
  },
}));

vi.mock('@m5/sdk', () => ({
  getDefaultApiBaseUrl: () => 'https://api.example.com',
}));

// ====== Mock localStorage ======
const localStorageStore: Record<string, string | null> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach(k => { delete localStorageStore[k]; }); }),
});

// ====== Mock fetch ======
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ====== Mock storefront-transactions ======
vi.mock('../../lib/storefront-transactions', () => ({
  buildStorefrontScopeHeaders: () => ({ 'X-Store-Id': 'test-store' }),
  resolveStorefrontScope: () => ({ storeId: 'test-store' }),
}));

// ====== Test Subject ======
import MemberLoginPage from './page';

describe('MemberLoginPage — 会员登录', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(localStorageStore).forEach(k => { delete localStorageStore[k]; });
    mockPush.mockReset();
    mockSubmit.mockReset();
    mockLogin.mockReset();
    mockSendSmsCode.mockReset();
    mockUseFormSubmit.mockReturnValue({ state: { isSubmitting: false }, submit: mockSubmit });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<MemberLoginPage />)).not.toThrow();
  });

  test('renders page title', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('会员登录')).toBeInTheDocument();
  });

  test('renders subtitle', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('神机营 SaaS 会员服务')).toBeInTheDocument();
  });

  test('renders mobile input field', () => {
    render(<MemberLoginPage />);
    const input = screen.getByPlaceholderText('13800138000');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'tel');
  });

  test('renders code input field', () => {
    render(<MemberLoginPage />);
    const input = screen.getByPlaceholderText('6位验证码');
    expect(input).toBeInTheDocument();
  });

  test('renders submit button', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('登录')).toBeInTheDocument();
  });

  test('renders register link', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('立即注册')).toBeInTheDocument();
    const registerLink = screen.getByText('立即注册').closest('a');
    expect(registerLink).toHaveAttribute('href', '/member-register');
  });

  test('renders WeChat login button', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('微信一键登录')).toBeInTheDocument();
  });

  // ====== 登录建议 ======

  test('renders login suggestions panel', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('登录建议')).toBeInTheDocument();
    expect(screen.getByText('建议开启微信登录快捷入口')).toBeInTheDocument();
    expect(screen.getByText('开启登录提醒通知，保障账户安全')).toBeInTheDocument();
    expect(screen.getByText('建议绑定邮箱作为备用验证方式')).toBeInTheDocument();
    expect(screen.getByText('定期检查登录设备列表')).toBeInTheDocument();
  });

  // ====== 统计面板 ======

  test('renders stats panel with today logins', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('今日登录')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument(); // todayLogins
  });

  test('renders success rate stat', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('成功率')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  test('renders failed attempts stat', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('失败次数')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('renders active users stat', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('活跃用户')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
  });

  // ====== 表单验证 ======

  test('shows error for empty mobile on send code', async () => {
    render(<MemberLoginPage />);
    const codeBtn = screen.getByText('获取验证码');
    fireEvent.click(codeBtn);
    await waitFor(() => {
      expect(screen.getByText('请输入有效的手机号')).toBeInTheDocument();
    });
  });

  test('shows error for invalid mobile on send code', async () => {
    render(<MemberLoginPage />);
    const mobileInput = screen.getByPlaceholderText('13800138000');
    fireEvent.change(mobileInput, { target: { value: '123' } });
    const codeBtn = screen.getByText('获取验证码');
    fireEvent.click(codeBtn);
    await waitFor(() => {
      expect(screen.getByText('请输入有效的手机号')).toBeInTheDocument();
    });
  });

  test('submitting empty form shows validation errors', async () => {
    mockUseFormSubmit.mockReturnValue({ state: { isSubmitting: false }, submit: vi.fn() });
    render(<MemberLoginPage />);
    const submitBtn = screen.getByText('登录');
    fireEvent.click(submitBtn);
    // Form validation should prevent submit
    await waitFor(() => {
      expect(screen.getByText('请输入有效的手机号')).toBeInTheDocument();
    });
  });

  test('submitting with invalid mobile shows error', async () => {
    mockUseFormSubmit.mockReturnValue({ state: { isSubmitting: false }, submit: vi.fn() });
    render(<MemberLoginPage />);
    const mobileInput = screen.getByPlaceholderText('13800138000');
    fireEvent.change(mobileInput, { target: { value: '12345' } });
    const submitBtn = screen.getByText('登录');
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('请输入有效的手机号')).toBeInTheDocument();
    });
  });

  test('code input only accepts up to 6 digits', () => {
    render(<MemberLoginPage />);
    const codeInput = screen.getByPlaceholderText('6位验证码');
    fireEvent.change(codeInput, { target: { value: '1234567' } });
    expect(codeInput).toHaveValue('123456');
  });

  test('code input filters non-digit characters', () => {
    render(<MemberLoginPage />);
    const codeInput = screen.getByPlaceholderText('6位验证码');
    fireEvent.change(codeInput, { target: { value: 'abc123' } });
    expect(codeInput).toHaveValue('123');
  });

  // ====== 验证码发送 ======

  test('send code button triggers countdown on valid mobile', async () => {
    mockSendSmsCode.mockResolvedValue({ success: true });
    render(<MemberLoginPage />);
    const mobileInput = screen.getByPlaceholderText('13800138000');
    fireEvent.change(mobileInput, { target: { value: '13800138000' } });
    const codeBtn = screen.getByText('获取验证码');
    fireEvent.click(codeBtn);
    await waitFor(() => {
      expect(screen.getByText(/60s/)).toBeInTheDocument();
    });
  });

  test('send code button is disabled during countdown', async () => {
    mockSendSmsCode.mockResolvedValue({ success: true });
    render(<MemberLoginPage />);
    const mobileInput = screen.getByPlaceholderText('13800138000');
    fireEvent.change(mobileInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('获取验证码'));
    await waitFor(() => {
      const btn = screen.getByText(/60s/);
      expect(btn).toBeDisabled();
    });
  });

  // ====== 安全事件 ======

  test('renders security events panel when data exists', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/security-events')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { id: 'e1', type: 'failed_attempt' as const, time: '10:30', detail: '来自北京IP登录失败', severity: 'medium' as const },
          { id: 'e2', type: 'new_device' as const, time: '09:15', detail: '新设备 iPhone 15', severity: 'low' as const },
        ]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    localStorageStore['member_info'] = JSON.stringify({ memberId: 'mem-001' });
    render(<MemberLoginPage />);
    await waitFor(() => {
      expect(screen.getByText('安全事件')).toBeInTheDocument();
      expect(screen.getByText('登录失败')).toBeInTheDocument();
      expect(screen.getByText('新设备')).toBeInTheDocument();
    });
  });

  test('shows "暂无安全事件记录" when events empty', async () => {
    localStorageStore['member_info'] = JSON.stringify({ memberId: 'mem-001' });
    render(<MemberLoginPage />);
    await waitFor(() => {
      expect(screen.getByText('暂无安全事件记录')).toBeInTheDocument();
    });
  });

  // ====== 登录记录 ======

  test('renders login history section when member is logged in', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/login-history')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { id: 'r1', mobile: '138****0000', time: '10:00', ip: '192.168.1.1', device: 'iPhone', success: true },
        ]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    localStorageStore['member_info'] = JSON.stringify({ memberId: 'mem-001' });
    render(<MemberLoginPage />);
    await waitFor(() => {
      expect(screen.getByText('登录记录')).toBeInTheDocument();
    });
  });

  test('shows login history empty state', async () => {
    localStorageStore['member_info'] = JSON.stringify({ memberId: 'mem-001' });
    render(<MemberLoginPage />);
    await waitFor(() => {
      expect(screen.getByText('暂无登录记录')).toBeInTheDocument();
    });
  });

  test('shows loading state for data panels', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    localStorageStore['member_info'] = JSON.stringify({ memberId: 'mem-001' });
    render(<MemberLoginPage />);
    await waitFor(() => {
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });
  });

  test('shows "查看完整登录历史" button', async () => {
    localStorageStore['member_info'] = JSON.stringify({ memberId: 'mem-001' });
    render(<MemberLoginPage />);
    await waitFor(() => {
      expect(screen.getByText('查看完整登录历史')).toBeInTheDocument();
    });
  });

  // ====== 边界 ======

  test('handles fetch failure gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    localStorageStore['member_info'] = JSON.stringify({ memberId: 'mem-001' });
    render(<MemberLoginPage />);
    await waitFor(() => {
      expect(screen.getByText('暂无安全事件记录')).toBeInTheDocument();
    });
  });

  test('handles no member_id in localStorage gracefully', async () => {
    localStorageStore['member_info'] = JSON.stringify({ nickname: 'test' });
    render(<MemberLoginPage />);
    await waitFor(() => {
      expect(screen.getByText('暂无安全事件记录')).toBeInTheDocument();
    });
  });

  test('handles missing member_info gracefully', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText('暂无安全事件记录')).toBeInTheDocument();
  });

  test('renders footer copyright', () => {
    render(<MemberLoginPage />);
    expect(screen.getByText(/© 2024 神机营 SaaS/)).toBeInTheDocument();
  });
});
