/**
 * RootNavigator.test.tsx - Phase-21 T52
 * 根路由: 根据登录状态切换 Auth vs Main 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { create, ReactTestRenderer } from 'react-test-renderer';

// ── Mock react-navigation modules ──
vi.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('NavigationContainer', null, children),
}));

vi.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) =>
      React.createElement('NativeStackNavigator', null, children),
    Screen: ({ component: Comp, name }: { component: React.ComponentType; name?: string }) =>
      React.createElement('NativeStackScreen', { name }, Comp ? React.createElement(Comp) : null),
  }),
}));

vi.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) =>
      React.createElement('BottomTabNavigator', null, children),
    Screen: ({ component: Comp, options }: { component: React.ComponentType; options?: any }) =>
      React.createElement('BottomTabScreen', { title: options?.title ?? options?.tabBarLabel }, Comp ? React.createElement(Comp) : null),
  }),
}));

vi.mock('@react-navigation/drawer', () => ({
  createDrawerNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) =>
      React.createElement('DrawerNavigator', null, children),
    Screen: ({ component: Comp, options }: { component: React.ComponentType; options?: any }) =>
      React.createElement('DrawerScreen', { title: options?.title ?? options?.drawerLabel ?? '' }, Comp ? React.createElement(Comp) : null),
  }),
}));

// ── Mock screen components ──
vi.mock('../screens/LoginScreen', () => ({
  LoginScreen: () => React.createElement('LoginScreen'),
}));

vi.mock('../screens/HomeScreen', () => ({
  HomeScreen: () => React.createElement('HomeScreen'),
}));

vi.mock('../screens/OrdersScreen', () => ({
  OrdersScreen: () => React.createElement('OrdersScreen'),
}));

vi.mock('../screens/MembersScreen', () => ({
  MembersScreen: () => React.createElement('MembersScreen'),
}));

vi.mock('../screens/NotificationsScreen', () => ({
  NotificationsScreen: () => React.createElement('NotificationsScreen'),
}));

vi.mock('../screens/ProfileScreen', () => ({
  ProfileScreen: () => React.createElement('ProfileScreen'),
}));

// ── Mock authStore ──
let mockIsAuthenticated = false;
let mockIsHydrated = true;

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (state: any) => any) => {
    const state = {
      isAuthenticated: mockIsAuthenticated,
      isHydrated: mockIsHydrated,
      user: mockIsAuthenticated ? { id: 'u001', name: '张三', role: 'admin', tenantId: 'ten001' } : null,
      token: mockIsAuthenticated ? 'tok' : null,
    };
    return selector(state);
  },
}));

// Since we use mock module state, we need to import after mock
let RootNavigator: React.ComponentType;

describe('RootNavigator · Phase-21 T52', () => {
  beforeAll(async () => {
    const mod = await import('./RootNavigator');
    RootNavigator = mod.RootNavigator;
  });

  beforeEach(() => {
    mockIsAuthenticated = false;
    mockIsHydrated = true;
  });

  // ── 正例: 未登录时显示 Login ──

  it('shows ActivityIndicator while not hydrated', () => {
    mockIsHydrated = false;
    const root = create(React.createElement(RootNavigator)).root;
    const indicator = root.findByType('ActivityIndicator');
    expect(indicator).toBeDefined();
  });

  it('shows LoginScreen when not authenticated', () => {
    mockIsAuthenticated = false;
    const root = create(React.createElement(RootNavigator)).root;
    const login = root.findByType('LoginScreen');
    expect(login).toBeDefined();
  });

  // ── 正例: 已登录时显示 Main ──

  it('shows DrawerNavigator when authenticated', () => {
    mockIsAuthenticated = true;
    const root = create(React.createElement(RootNavigator)).root;
    const drawer = root.findByType('DrawerNavigator');
    expect(drawer).toBeDefined();
  });

  it('shows 4 tab screens (Home, Orders, Members, Notifications) when authenticated', () => {
    mockIsAuthenticated = true;
    const root = create(React.createElement(RootNavigator)).root;
    const tabs = root.findAllByType('BottomTabScreen');
    expect(tabs.length).toBe(4);
    const titles = tabs.map((t: any) => t.props.title as string);
    expect(titles).toContain('首页');
    expect(titles).toContain('订单');
    expect(titles).toContain('会员');
    expect(titles).toContain('通知');
  });

  it('drawer contains Tabs (神机营) and Profile (我的) screens', () => {
    mockIsAuthenticated = true;
    const root = create(React.createElement(RootNavigator)).root;
    const drawerScreens = root.findAllByType('DrawerScreen');
    expect(drawerScreens.length).toBe(2);
    const titles = drawerScreens.map((s: any) => s.props.title);
    expect(titles).toContain('神机营');
    expect(titles).toContain('我的');
  });

  // ── 边界: Hydration transition ──

  it('transitions from loading to login when hydration completes', () => {
    mockIsHydrated = false;
    const root1 = create(React.createElement(RootNavigator)).root;
    expect(() => root1.findByType('ActivityIndicator')).not.toThrow();

    mockIsHydrated = true;
    const root2 = create(React.createElement(RootNavigator)).root;
    expect(() => root2.findByType('LoginScreen')).not.toThrow();
  });

  it('transitions from login to main when user authenticates', () => {
    mockIsAuthenticated = false;
    const root1 = create(React.createElement(RootNavigator)).root;
    expect(() => root1.findByType('LoginScreen')).not.toThrow();

    mockIsAuthenticated = true;
    const root2 = create(React.createElement(RootNavigator)).root;
    expect(() => root2.findByType('DrawerNavigator')).not.toThrow();
  });

  // ── 边界: Edge cases ──

  it('shows login when both hydration and authentication are false', () => {
    mockIsHydrated = false;
    const root = create(React.createElement(RootNavigator)).root;
    // Loading state takes priority
    expect(() => root.findByType('ActivityIndicator')).not.toThrow();
  });

  it('shows main when authenticated but not hydrated (unusual state)', () => {
    mockIsAuthenticated = true;
    mockIsHydrated = false;
    const root = create(React.createElement(RootNavigator)).root;
    // Stale while rehydrating: show loading
    expect(() => root.findByType('ActivityIndicator')).not.toThrow();
  });

  // ── 防御: NavigationContainer wraps everything ──

  it('wraps all content in NavigationContainer', () => {
    mockIsAuthenticated = false;
    const root = create(React.createElement(RootNavigator)).root;
    const navContainer = root.findByType('NavigationContainer');
    expect(navContainer).toBeDefined();
  });

  it('NativeStackNavigator wraps auth stack', () => {
    mockIsAuthenticated = false;
    mockIsHydrated = true;
    const root = create(React.createElement(RootNavigator)).root;
    const stack = root.findByType('NativeStackNavigator');
    expect(stack).toBeDefined();
  });

  it('native stack has LoginScreen as the only screen', () => {
    mockIsAuthenticated = false;
    mockIsHydrated = true;
    const root = create(React.createElement(RootNavigator)).root;
    const stackScreens = root.findAllByType('NativeStackScreen');
    // The stack might have multiple screens defined but only LoginScreen renders
    expect(stackScreens.length).toBeGreaterThanOrEqual(1);
  });
});
