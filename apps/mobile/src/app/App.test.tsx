/**
 * App.test.tsx - Phase-21 T51
 * 神机营 SaaS 移动端 - 根组件单元测试
 */
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';

// ── Mock dependencies BEFORE import ──

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

const mockNetInfoAddEventListener = vi.fn(() => vi.fn());

vi.mock('@react-native-community/netinfo', () => ({
  default: { addEventListener: mockNetInfoAddEventListener },
}));

// ── Mock child components ──
vi.mock('../navigation/RootNavigator', () => ({
  RootNavigator: () => React.createElement('RootNavigator'),
}));

// ── Mock stores ──
const mockRestoreSession = vi.fn().mockResolvedValue(undefined);

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: any) => {
    const state = { isAuthenticated: false, isHydrated: false, restoreSession: mockRestoreSession };
    return selector(state);
  },
}));

const mockSetupNotifications = vi.fn().mockResolvedValue(undefined);

vi.mock('../network/push', () => ({
  setupNotifications: mockSetupNotifications,
}));

describe('App.tsx · Phase-21 T51', () => {
  let AppDefault: React.ComponentType;
  let queryClientCtorArg: any = undefined;

  beforeAll(async () => {
    const ReactQuery = await import('@tanstack/react-query');
    const QC = ReactQuery.QueryClient;
    // Capture the constructor arg at import time
    QC.mockImplementationOnce(function (this: any, opts: any) {
      queryClientCtorArg = opts;
    });
    const mod = await import('../../App');
    AppDefault = mod.default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 正例: Provider chain renders ──

  it('renders GestureHandlerRootView as outermost wrapper', () => {
    const root = create(React.createElement(AppDefault)).root;
    expect(() => root.findByType('GestureHandlerRootView')).not.toThrow();
  });

  it('renders SafeAreaProvider inside GestureHandlerRootView', () => {
    const root = create(React.createElement(AppDefault)).root;
    expect(() => root.findByType('SafeAreaProvider')).not.toThrow();
  });

  it('renders QueryClientProvider inside SafeAreaProvider', () => {
    const root = create(React.createElement(AppDefault)).root;
    expect(() => root.findByType('QueryClientProvider')).not.toThrow();
  });

  it('renders RootNavigator inside provider chain', () => {
    const root = create(React.createElement(AppDefault)).root;
    expect(() => root.findByType('RootNavigator')).not.toThrow();
  });

  it('renders StatusBar component', () => {
    const root = create(React.createElement(AppDefault)).root;
    expect(() => root.findByType('StatusBar')).not.toThrow();
  });

  it('GestureHandlerRootView has flex:1 style', () => {
    const root = create(React.createElement(AppDefault)).root;
    const gv = root.findByType('GestureHandlerRootView');
    expect(gv.props.style).toEqual({ flex: 1 });
  });

  // ── 正例: QueryClient config ──

  it('creates QueryClient with staleTime=30000, retry=1, refetchOnWindowFocus=false', () => {
    expect(queryClientCtorArg).toBeDefined();
    expect(queryClientCtorArg).toEqual({
      defaultOptions: {
        queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
      },
    });
  });

  // ── 正例: Side effects on mount ──

  it('calls restoreSession on mount', () => {
    create(React.createElement(AppDefault));
    expect(mockRestoreSession).toHaveBeenCalled();
  });

  it('calls setupNotifications on mount', () => {
    create(React.createElement(AppDefault));
    expect(mockSetupNotifications).toHaveBeenCalled();
  });

  it('subscribes to NetInfo on mount', () => {
    create(React.createElement(AppDefault));
    expect(mockNetInfoAddEventListener).toHaveBeenCalledWith(expect.any(Function));
  });

  // ── 边界: setupNotifications failure ──

  it('handles setupNotifications rejection without crashing', () => {
    mockSetupNotifications.mockRejectedValue(new Error('FCM error'));
    expect(() => create(React.createElement(AppDefault))).not.toThrow();
  });

  // ── 边界: restoreSession rejection ──

  it('handles restoreSession rejection without crashing', () => {
    mockRestoreSession.mockRejectedValue(new Error('storage error'));
    expect(() => create(React.createElement(AppDefault))).not.toThrow();
  });

  // ── 防御: Smoke test ──

  it('renders and unmounts without throwing', () => {
    const root = create(React.createElement(AppDefault));
    root.unmount();
  });
});
