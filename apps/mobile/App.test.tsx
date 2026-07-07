/**
 * App.test.tsx - Phase-21 T51
 * 神机营 SaaS 移动端 - 根组件单元测试
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';

// ── Mock react-native BEFORE other imports ──
// App.tsx calls LogBox.ignoreLogs() at module top-level, so react-native
// must be mocked before App.tsx is loaded.
vi.mock('react-native', () => ({
  LogBox: { ignoreLogs: vi.fn() },
  StatusBar: 'StatusBar',
  useColorScheme: vi.fn(() => 'light'),
}));

// ── Mock dependencies that App.tsx imports ──

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('SafeAreaProvider', null, children),
}));

vi.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children, style }: { children: React.ReactNode; style?: any }) =>
    React.createElement('GestureHandlerRootView', { style }, children),
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('QueryClientProvider', null, children),
}));

vi.mock('@react-native-community/netinfo', () => ({
  default: {
    addEventListener: vi.fn(() => {
      return vi.fn(); // unsubscribe
    }),
  },
}));

vi.mock('./src/navigation/RootNavigator', () => ({
  RootNavigator: () => React.createElement('RootNavigator'),
}));

// ── Mock stores ──
const mockRestoreSession = vi.fn();

vi.mock('./src/store/authStore', () => ({
  useAuthStore: (selector: any) => {
    const state = {
      isAuthenticated: false,
      isHydrated: false,
      user: null,
      restoreSession: mockRestoreSession,
    };
    return selector(state);
  },
}));

vi.mock('./src/network/push', () => ({
  setupNotifications: vi.fn().mockResolvedValue(undefined),
}));

describe('App.tsx · Phase-21 T51', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
  });

  // ── 正例: App 渲染提供者链 ──

  it('renders GestureHandlerRootView wrapper', () => {
    const App = require('./App').default;
    const root = create(React.createElement(App)).root;
    const gestureView = root.findByType('GestureHandlerRootView');
    expect(gestureView).toBeDefined();
  });

  it('renders SafeAreaProvider inside GestureHandlerRootView', () => {
    const App = require('./App').default;
    const root = create(React.createElement(App)).root;
    const safeArea = root.findByType('SafeAreaProvider');
    expect(safeArea).toBeDefined();
  });

  it('renders QueryClientProvider inside SafeAreaProvider', () => {
    const App = require('./App').default;
    const root = create(React.createElement(App)).root;
    const queryProvider = root.findByType('QueryClientProvider');
    expect(queryProvider).toBeDefined();
  });

  it('renders RootNavigator inside providers', () => {
    const App = require('./App').default;
    const root = create(React.createElement(App)).root;
    const navigator = root.findByType('RootNavigator');
    expect(navigator).toBeDefined();
  });

  it('renders StatusBar component', () => {
    const App = require('./App').default;
    const root = create(React.createElement(App)).root;
    const statusBar = root.findByType('StatusBar');
    expect(statusBar).toBeDefined();
  });

  // ── 正例: App 初始化逻辑 ──

  it('calls restoreSession on mount', () => {
    const App = require('./App').default;
    create(React.createElement(App));
    expect(mockRestoreSession).toHaveBeenCalledTimes(1);
  });

  it('calls setupNotifications on mount', () => {
    const pushModule = require('./src/network/push');
    const App = require('./App').default;
    create(React.createElement(App));
    expect(pushModule.setupNotifications).toHaveBeenCalledTimes(1);
  });

  // ── 边界: NetInfo subscription ──

  it('subscribes to NetInfo on mount', () => {
    const NetInfo = require('@react-native-community/netinfo').default;
    const App = require('./App').default;
    create(React.createElement(App));
    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
    expect(NetInfo.addEventListener).toHaveBeenCalledWith(expect.any(Function));
  });

  // ── 边界: 卸载时取消 NetInfo 订阅 ──

  it('unsubscribes from NetInfo on unmount', () => {
    const unsubscribeSpy = vi.fn();
    const NetInfo = require('@react-native-community/netinfo').default;
    NetInfo.addEventListener.mockReturnValue(unsubscribeSpy);

    const App = require('./App').default;
    const root = create(React.createElement(App));
    root.unmount();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  // ── 防御: setupNotifications 失败不崩溃 ──

  it('handles setupNotifications failure gracefully', () => {
    const pushModule = require('./src/network/push');
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // The failure is caught inside App's useEffect, test the structure handles it
    pushModule.setupNotifications.mockRejectedValueOnce(new Error('FCM setup failed'));

    const App = require('./App').default;
    // Should not throw
    expect(() => create(React.createElement(App))).not.toThrow();

    consoleWarnSpy.mockRestore();
  });

  // ── 防御: QueryClient with default options ──

  it('creates QueryClient with correct default options', () => {
    const { QueryClient } = require('@tanstack/react-query');

    // Re-import to trigger QueryClient creation
    const App = require('./App').default;
    create(React.createElement(App));

    expect(QueryClient).toHaveBeenCalledWith({
      defaultOptions: {
        queries: {
          staleTime: 30000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  });
});
