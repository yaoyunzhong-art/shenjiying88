/**
 * ProfileScreen.test.tsx - Phase-21 T52
 * 个人中心页单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { ProfileScreen } from './ProfileScreen';
import { useAuthStore } from '../store/authStore';

describe('ProfileScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
      token: null,
      refreshToken: null,
    });
  });

  it('renders fallback avatar letter ? when no user', () => {
    const root = create(<ProfileScreen />).root;
    const avatarChar = root.findByProps({ children: '?' });
    expect(avatarChar).toBeDefined();
  });

  it('renders "未登录" when no user', () => {
    const root = create(<ProfileScreen />).root;
    const text = root.findByProps({ children: '未登录' });
    expect(text).toBeDefined();
  });

  it('renders user name and avatar initial when authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u001',
        name: '李四',
        email: 'lisi@example.com',
        role: 'manager',
        tenantId: 'ten001',
      },
    });
    const root = create(<ProfileScreen />).root;
    expect(root.findByProps({ children: '李四' })).toBeDefined();
    expect(root.findByProps({ children: '李' })).toBeDefined();
  });

  it('renders user email', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u001',
        name: '李四',
        email: 'lisi@example.com',
        role: 'manager',
        tenantId: 'ten001',
      },
    });
    const root = create(<ProfileScreen />).root;
    expect(root.findByProps({ children: 'lisi@example.com' })).toBeDefined();
  });

  it('renders user role', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u001',
        name: '李四',
        email: 'lisi@example.com',
        role: 'manager',
        tenantId: 'ten001',
      },
    });
    const root = create(<ProfileScreen />).root;
    expect(root.findByProps({ children: 'manager' })).toBeDefined();
  });

  it('renders all four menu items', () => {
    const root = create(<ProfileScreen />).root;
    const labels = ['设备管理', '消息中心', '关于', '切换租户'];
    for (const label of labels) {
      expect(root.findByProps({ children: label })).toBeDefined();
    }
  });

  it('renders logout button with text', () => {
    const root = create(<ProfileScreen />).root;
    const btnText = root.findByProps({ children: '退出登录' });
    expect(btnText).toBeDefined();
  });
});
