/**
 * LoginScreen.test.tsx - Phase-21 T52
 * 登录页 - 邮箱/密码 + 租户选择 单元测试
 *
 * 覆盖场景:
 * - 正常渲染 (标题/副标题/输入框/按钮)
 * - 空邮箱/密码时点击登录触发 Alert
 * - 输入邮箱和密码
 * - 成功登录: 调用 api.post + authStore.login
 * - 登录失败: api.post 返回错误 -> Alert
 * - 加载状态: ActivityIndicator + 按钮禁用
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { LoginScreen } from './LoginScreen';
import { useAuthStore } from '../store/authStore';
import * as apiModule from '../network/api';
import ReactNative from 'react-native';

// ── Mock axios ──────────────────────────────────────────────────
vi.mock('axios', () => {
  const mockAxiosInstance = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn((e: unknown) => e?.isAxiosError === true),
    },
    AxiosError: class AxiosErrorMock extends Error {
      isAxiosError = true;
      response: any;
      constructor(message?: string, status?: number, data?: any) {
        super(message);
        this.name = 'AxiosError';
        this.response = { status, data };
      }
    },
  };
});

// Re-import after mock
const axios = await import('axios');

describe('LoginScreen', () => {
  const mockApiPost = vi.fn();

  beforeEach(() => {
    // Reset auth store
    useAuthStore.setState({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
      token: null,
      refreshToken: null,
    });

    // Reset api mock
    mockApiPost.mockReset();
    // @ts-expect-error - we assign our mock post to the api instance
    apiModule.api.post = mockApiPost;
  });

  // ── 渲染测试 ──

  it('renders app title 神机营', () => {
    const root = create(<LoginScreen />).root;
    const title = root.findByProps({ children: '神机营' });
    expect(title).toBeDefined();
  });

  it('renders subtitle', () => {
    const root = create(<LoginScreen />).root;
    const subtitle = root.findByProps({ children: '门店 · 会员 · 营销 一体化' });
    expect(subtitle).toBeDefined();
  });

  it('renders email input', () => {
    const root = create(<LoginScreen />).root;
    const emailInput = root.findByProps({ placeholder: '邮箱' });
    expect(emailInput).toBeDefined();
  });

  it('renders password input', () => {
    const root = create(<LoginScreen />).root;
    const passwordInput = root.findByProps({ placeholder: '密码' });
    expect(passwordInput).toBeDefined();
  });

  it('renders login button with text 登录', () => {
    const root = create(<LoginScreen />).root;
    const loginText = root.findByProps({ children: '登录' });
    expect(loginText).toBeDefined();
  });

  it('renders password input with secureTextEntry', () => {
    const root = create(<LoginScreen />).root;
    const passwordInput = root.findByProps({ placeholder: '密码' });
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('renders email input with email-address keyboard type', () => {
    const root = create(<LoginScreen />).root;
    const emailInput = root.findByProps({ placeholder: '邮箱' });
    expect(emailInput.props.keyboardType).toBe('email-address');
  });

  it('renders email input with autoCapitalize none', () => {
    const root = create(<LoginScreen />).root;
    const emailInput = root.findByProps({ placeholder: '邮箱' });
    expect(emailInput.props.autoCapitalize).toBe('none');
  });

  // ── 输入交互 ──

  it('updates email state when typing into email input', () => {
    const root = create(<LoginScreen />).root;
    const emailInput = root.findByProps({ placeholder: '邮箱' });
    emailInput.props.onChangeText('admin@test.com');
    expect(emailInput.props.value).toBe('admin@test.com');
  });

  it('updates password state when typing into password input', () => {
    const root = create(<LoginScreen />).root;
    const passwordInput = root.findByProps({ placeholder: '密码' });
    passwordInput.props.onChangeText('secret123');
    expect(passwordInput.props.value).toBe('secret123');
  });

  // ── 空字段验证 ──

  it('shows Alert when email is empty on login press', () => {
    const alertSpy = vi.spyOn(ReactNative.Alert, 'alert');
    const root = create(<LoginScreen />).root;

    // Set password but not email
    const passwordInput = root.findByProps({ placeholder: '密码' });
    passwordInput.props.onChangeText('somepass');

    // Press login button
    const loginButton = root.findByType('TouchableOpacity');
    loginButton.props.onPress();

    expect(alertSpy).toHaveBeenCalledWith('错误', '请输入邮箱和密码');
    alertSpy.mockRestore();
  });

  it('shows Alert when password is empty on login press', () => {
    const alertSpy = vi.spyOn(ReactNative.Alert, 'alert');
    const root = create(<LoginScreen />).root;

    // Set email but not password
    const emailInput = root.findByProps({ placeholder: '邮箱' });
    emailInput.props.onChangeText('admin@test.com');

    // Press login button
    const loginButton = root.findByType('TouchableOpacity');
    loginButton.props.onPress();

    expect(alertSpy).toHaveBeenCalledWith('错误', '请输入邮箱和密码');
    alertSpy.mockRestore();
  });

  it('shows Alert when both fields empty on login press', () => {
    const alertSpy = vi.spyOn(ReactNative.Alert, 'alert');
    const root = create(<LoginScreen />).root;

    const loginButton = root.findByType('TouchableOpacity');
    loginButton.props.onPress();

    expect(alertSpy).toHaveBeenCalledWith('错误', '请输入邮箱和密码');
    alertSpy.mockRestore();
  });

  // ── 登录成功 ──

  it('calls api.post and authStore.login on successful login', async () => {
    const mockUser = {
      id: 'u001',
      name: '张三',
      email: 'admin@test.com',
      role: 'admin' as const,
      tenantId: 'ten001',
    };
    const mockResponse = {
      data: {
        user: mockUser,
        token: 'tok_abc123',
        refreshToken: 'rtok_xyz789',
      },
    };

    mockApiPost.mockResolvedValueOnce(mockResponse);

    const loginSpy = vi.spyOn(useAuthStore.getState(), 'login');

    const root = create(<LoginScreen />).root;
    const emailInput = root.findByProps({ placeholder: '邮箱' });
    const passwordInput = root.findByProps({ placeholder: '密码' });
    const loginButton = root.findByType('TouchableOpacity');

    emailInput.props.onChangeText('admin@test.com');
    passwordInput.props.onChangeText('pass123');
    loginButton.props.onPress();

    // Allow microtasks to settle
    await vi.waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/auth/login', {
        email: 'admin@test.com',
        password: 'pass123',
      });
    });

    await vi.waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        user: mockUser,
        token: 'tok_abc123',
        refreshToken: 'rtok_xyz789',
      });
    });

    loginSpy.mockRestore();
  });

  // ── 登录失败 ──

  it('shows Alert on login failure', async () => {
    const axiosError = new Error('Request failed');
    (axiosError as any).isAxiosError = true;
    (axiosError as any).response = {
      status: 401,
      data: { code: 'AUTH_FAILED', message: '邮箱或密码错误' },
    };
    mockApiPost.mockRejectedValueOnce(axiosError);

    const alertSpy = vi.spyOn(ReactNative.Alert, 'alert');

    const root = create(<LoginScreen />).root;
    const emailInput = root.findByProps({ placeholder: '邮箱' });
    const passwordInput = root.findByProps({ placeholder: '密码' });
    const loginButton = root.findByType('TouchableOpacity');

    emailInput.props.onChangeText('wrong@test.com');
    passwordInput.props.onChangeText('wrongpass');
    loginButton.props.onPress();

    await vi.waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
      const callArgs = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
      expect(callArgs[0]).toBe('登录失败');
      expect(callArgs[1]).toContain('AUTH_FAILED');
    });

    alertSpy.mockRestore();
  });

  // ── 加载状态 ──

  it('shows ActivityIndicator when loading', async () => {
    // Return a promise that never resolves during test
    mockApiPost.mockImplementationOnce(() => new Promise(() => {}));

    const root = create(<LoginScreen />).root;
    const emailInput = root.findByProps({ placeholder: '邮箱' });
    const passwordInput = root.findByProps({ placeholder: '密码' });
    const loginButton = root.findByType('TouchableOpacity');

    emailInput.props.onChangeText('admin@test.com');
    passwordInput.props.onChangeText('pass123');
    loginButton.props.onPress();

    // After press, we should see ActivityIndicator
    await vi.waitFor(() => {
      expect(root.findAllByType('ActivityIndicator').length).toBeGreaterThan(0);
    });
  });

  it('disables login button when loading', async () => {
    mockApiPost.mockImplementationOnce(() => new Promise(() => {}));

    const root = create(<LoginScreen />).root;
    const emailInput = root.findByProps({ placeholder: '邮箱' });
    const passwordInput = root.findByProps({ placeholder: '密码' });
    const loginButton = root.findByType('TouchableOpacity');

    emailInput.props.onChangeText('admin@test.com');
    passwordInput.props.onChangeText('pass123');
    loginButton.props.onPress();

    await vi.waitFor(() => {
      expect(loginButton.props.disabled).toBe(true);
    });
  });

  it('applies buttonDisabled style when loading', async () => {
    mockApiPost.mockImplementationOnce(() => new Promise(() => {}));

    const root = create(<LoginScreen />).root;
    const emailInput = root.findByProps({ placeholder: '邮箱' });
    const passwordInput = root.findByProps({ placeholder: '密码' });
    const loginButton = root.findByType('TouchableOpacity');

    emailInput.props.onChangeText('admin@test.com');
    passwordInput.props.onChangeText('pass123');
    loginButton.props.onPress();

    await vi.waitFor(() => {
      const style = loginButton.props.style;
      const opacity = Array.isArray(style)
        ? style.find((s: any) => s?.opacity !== undefined)
        : style;
      expect(opacity?.opacity).toBe(0.6);
    });
  });

  // ── 容器布局 ──

  it('renders a View container with justifyContent center', () => {
    const root = create(<LoginScreen />).root;
    const container = root.findAllByType('View')[0];
    expect(container).toBeDefined();
    const style = container.props.style;
    const justifyContent = Array.isArray(style)
      ? style.find((s: any) => s?.justifyContent)
      : style;
    expect(justifyContent?.justifyContent).toBe('center');
  });

  it('renders with white background', () => {
    const root = create(<LoginScreen />).root;
    const container = root.findAllByType('View')[0];
    const style = container.props.style;
    const bgColor = Array.isArray(style)
      ? style.find((s: any) => s?.backgroundColor)
      : style;
    expect(bgColor?.backgroundColor).toBe('#fff');
  });
});
