/**
 * HomeScreen.test.tsx - Phase-21 T52
 * 首页 - Dashboard 入口单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { HomeScreen } from './HomeScreen';
import { useAuthStore } from '../store/authStore';

describe('HomeScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
      token: null,
      refreshToken: null,
    });
  });

  it('renders welcome text with default "用户" when no user', () => {
    const root = create(<HomeScreen />).root;
    const allTexts = root.findAllByType('Text');
    const welcome = allTexts.find(
      (t) =>
        Array.isArray(t.props.children) &&
        t.props.children.length >= 2 &&
        t.props.children[0] === '欢迎, ' &&
        t.props.children[1] === '用户',
    );
    expect(welcome).toBeDefined();
  });

  it('renders welcome text with user name when authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u001',
        name: '张三',
        email: 'zhangsan@example.com',
        role: 'manager',
        tenantId: 'ten001',
      },
    });
    const root = create(<HomeScreen />).root;
    const allTexts = root.findAllByType('Text');
    const welcome = allTexts.find(
      (t) =>
        Array.isArray(t.props.children) &&
        t.props.children.length >= 2 &&
        t.props.children[0] === '欢迎, ' &&
        t.props.children[1] === '张三',
    );
    expect(welcome).toBeDefined();
  });

  it('renders tenant id when user exists', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u001',
        name: '张三',
        email: 'zhangsan@example.com',
        role: 'manager',
        tenantId: 'ten001',
      },
    });
    const root = create(<HomeScreen />).root;
    const tenantText = root.findByProps({ children: 'ten001' });
    expect(tenantText).toBeDefined();
  });

  it('renders four stat cards with placeholder values', () => {
    const root = create(<HomeScreen />).root;
    const titles = ['今日订单', '活跃会员', '待办事项', '营收 (今日)'];
    for (const title of titles) {
      expect(root.findByProps({ children: title })).toBeDefined();
    }
  });

  it('shows "--" as default value for stat cards', () => {
    const root = create(<HomeScreen />).root;
    const allTexts = root.findAllByType('Text');
    const dashedTexts = allTexts.filter((t) => t.props.children === '--');
    expect(dashedTexts.length).toBe(4);
  });

  it('renders quick action buttons', () => {
    const root = create(<HomeScreen />).root;
    const actions = ['新建订单', '会员充值', '营销活动'];
    for (const label of actions) {
      expect(root.findByProps({ children: label })).toBeDefined();
    }
  });

  it('renders "加载中..." subtitle for stat cards', () => {
    const root = create(<HomeScreen />).root;
    const allTexts = root.findAllByType('Text');
    const subtitleTexts = allTexts.filter((t) => t.props.children === '加载中...');
    expect(subtitleTexts.length).toBe(4);
  });

  it('renders section title "快捷操作"', () => {
    const root = create(<HomeScreen />).root;
    const section = root.findByProps({ children: '快捷操作' });
    expect(section).toBeDefined();
  });

  it('renders a ScrollView container', () => {
    const root = create(<HomeScreen />).root;
    const scrollView = root.findByType('RCTScrollView');
    expect(scrollView).toBeDefined();
  });
});
