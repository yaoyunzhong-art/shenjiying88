/**
 * authStore.test.ts - Phase-21 T53
 * 认证状态管理 (Zustand + persist) 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, type User } from './authStore';

const mockUser: User = {
  id: 'u001',
  name: '张三',
  email: 'zhangsan@example.com',
  role: 'manager',
  tenantId: 'ten001',
};

describe('authStore · Phase-21 T53', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      isAuthenticated: false,
      isHydrated: false,
      user: null,
      token: null,
      refreshToken: null,
    });
  });

  // ── 正例: 登录 ──

  it('login: sets isAuthenticated and stores user/token/refreshToken', () => {
    useAuthStore.getState().login({
      user: mockUser,
      token: 'tok_abc123',
      refreshToken: 'rtok_xyz789',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('tok_abc123');
    expect(state.refreshToken).toBe('rtok_xyz789');
  });

  it('login: stores correct user properties', () => {
    useAuthStore.getState().login({
      user: mockUser,
      token: 'tok_abc',
      refreshToken: 'rtok_xyz',
    });

    const user = useAuthStore.getState().user;
    expect(user?.id).toBe('u001');
    expect(user?.name).toBe('张三');
    expect(user?.email).toBe('zhangsan@example.com');
    expect(user?.role).toBe('manager');
    expect(user?.tenantId).toBe('ten001');
  });

  it('login: preserves refreshToken exactly as passed', () => {
    useAuthStore.getState().login({
      user: mockUser,
      token: 'tok_abc',
      refreshToken: 'rtok_with_special_chars_!@#',
    });

    expect(useAuthStore.getState().refreshToken).toBe('rtok_with_special_chars_!@#');
  });

  // ── 正例: 登出 ──

  it('logout: clears authentication state', () => {
    // First login
    useAuthStore.getState().login({
      user: mockUser,
      token: 'tok_abc123',
      refreshToken: 'rtok_xyz789',
    });

    // Then logout
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  // ── 正例: 更新用户信息 ──

  it('updateUser: patches user fields correctly', () => {
    useAuthStore.getState().login({
      user: mockUser,
      token: 'tok_abc',
      refreshToken: 'rtok_xyz',
    });

    useAuthStore.getState().updateUser({ name: '李四' });
    expect(useAuthStore.getState().user?.name).toBe('李四');
    expect(useAuthStore.getState().user?.email).toBe('zhangsan@example.com'); // unchanged
  });

  it('updateUser: can update role and multiple fields', () => {
    useAuthStore.getState().login({
      user: mockUser,
      token: 'tok_abc',
      refreshToken: 'rtok_xyz',
    });

    useAuthStore.getState().updateUser({
      role: 'admin',
      email: 'admin@shenjiying.com',
    });

    const user = useAuthStore.getState().user;
    expect(user?.role).toBe('admin');
    expect(user?.email).toBe('admin@shenjiying.com');
    expect(user?.name).toBe('张三'); // unchanged
  });

  // ── 边界: 登出时无用户 ──

  it('logout: does not throw when already logged out', () => {
    expect(() => useAuthStore.getState().logout()).not.toThrow();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  // ── 边界: 更新用户时尚未登录 ──

  it('updateUser: does nothing when no user is logged in', () => {
    // No user logged in
    useAuthStore.getState().updateUser({ name: '李四' });
    expect(useAuthStore.getState().user).toBeNull();
  });

  // ── 防御: 初始状态 ──

  it('initial state: isAuthenticated is false and user is null', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isHydrated).toBe(false);
  });

  it('initial state: restoreSession sets isHydrated to true', async () => {
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });

  // ── 防御: double login overwrites previous ──

  it('login: second call overwrites first login state', () => {
    const user2: User = {
      id: 'u002',
      name: '李四',
      email: 'lisi@example.com',
      role: 'staff',
      tenantId: 'ten002',
    };

    useAuthStore.getState().login({
      user: mockUser,
      token: 'tok_first',
      refreshToken: 'rtok_first',
    });

    useAuthStore.getState().login({
      user: user2,
      token: 'tok_second',
      refreshToken: 'rtok_second',
    });

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe('u002');
    expect(state.token).toBe('tok_second');
    expect(state.refreshToken).toBe('rtok_second');
  });
});
