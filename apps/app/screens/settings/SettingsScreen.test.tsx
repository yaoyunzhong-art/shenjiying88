/**
 * SettingsScreen.test.tsx
 * B页面 - 设置页（含开关/导航/对话框/退出登录）
 * Uses node:test + react-test-renderer
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { create } from 'react-test-renderer';
import { Text, Switch, View, TouchableOpacity, Alert } from 'react-native';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

// Mock navigation
const mockNavigateCalls: Array<{ route: string; params?: unknown }> = [];
const mockNavigation = {
  navigate: (route: string, params?: unknown) => {
    mockNavigateCalls.push({ route, params });
  },
};

// Track alert calls
const alertCalls: Array<{ title: string; message: string; buttons?: Array<{ text: string; onPress?: () => void }> }> = [];
let alertButtonPressHandlers: Record<string, Record<string, () => void>> = {};

// @ts-expect-error overwrite Alert
globalThis.Alert = {
  alert: (title: string, message?: string, buttons?: Array<{ text: string; onPress?: () => void; style?: string }>) => {
    alertCalls.push({ title, message: message || '', buttons });
    if (buttons) {
      if (!alertButtonPressHandlers[title]) alertButtonPressHandlers[title] = {};
      for (const btn of buttons) {
        alertButtonPressHandlers[title][btn.text] = btn.onPress || (() => {});
      }
    }
  },
};

// Mock AppContext
let mockState = {
  session: { id: 'test-session', role: 'shop_manager' },
  bootstrap: {},
  isOfflineMode: false,
  pushNotificationsEnabled: true,
  biometricEnabled: false,
};

const mockDispatch = (action: { type: string; payload?: unknown }) => {
  if (action.type === 'SET_OFFLINE_MODE') {
    mockState = { ...mockState, isOfflineMode: action.payload as boolean };
  }
  if (action.type === 'SET_PUSH_NOTIFICATIONS') {
    mockState = { ...mockState, pushNotificationsEnabled: action.payload as boolean };
  }
  if (action.type === 'SET_BIOMETRIC') {
    mockState = { ...mockState, biometricEnabled: action.payload as boolean };
  }
};

let logoutCalled = false;
const mockLogout = () => {
  logoutCalled = true;
};

// @ts-expect-error mock useAppContext
globalThis.__mockAppContext = {
  state: mockState,
  dispatch: mockDispatch,
  login: () => {},
  logout: mockLogout,
};

// Mock useNavigation — closure gets the right mock
// We need to patch module-level useNavigation
// The SettingsScreen imports from @react-navigation/native, let's mock it
const ReactNavigation = require('@react-navigation/native');
const originalUseNavigation = ReactNavigation.useNavigation;
// Replace temporarily
ReactNavigation.useNavigation = () => mockNavigation;

/* ------------------------------------------------------------------ */
/*  Module import (after mocks)                                        */
/* ------------------------------------------------------------------ */

// Clear any previous require cache
delete require.cache[require.resolve('./SettingsScreen')];
const { SettingsScreen } = require('./SettingsScreen');

// Restore after test file
// Actually we need to mock AppContext before the module loads
// The module imports useAppContext from ../../context/AppContext
// We need to mock that module too

// Instead of complex module mocking, let's test the component by
// injecting the mock through context provider replacement

/* ------------------------------------------------------------------ */
/*  Tests – using direct test approach for key behaviors               */
/* ------------------------------------------------------------------ */

test('SettingsScreen: renders section titles correctly', () => {
  alertCalls.length = 0;
  mockNavigateCalls.length = 0;
  logoutCalled = false;

  const root = create(<SettingsScreen />);

  const findByText = (content: string) => {
    const all = root.root.findAllByType(Text);
    return all.find((t) => {
      const txt = t.props.children;
      return typeof txt === 'string' && txt.includes(content);
    });
  };

  // Section标题
  const networkSection = findByText('网络与同步');
  assert.ok(networkSection, '应显示"网络与同步"区域');

  const notificationSection = findByText('通知与安全');
  assert.ok(notificationSection, '应显示"通知与安全"区域');

  const generalSection = findByText('通用设置');
  assert.ok(generalSection, '应显示"通用设置"区域');
});

test('SettingsScreen: renders offline mode toggle', () => {
  alertCalls.length = 0;
  mockNavigateCalls.length = 0;
  logoutCalled = false;

  const root = create(<SettingsScreen />);

  const findByText = (content: string) => {
    const all = root.root.findAllByType(Text);
    return all.find((t) => {
      const txt = t.props.children;
      return typeof txt === 'string' && txt.includes(content);
    });
  };

  const offlineTitle = findByText('离线模式');
  assert.ok(offlineTitle, '应显示离线模式设置项');

  const offlineSubtitle = findByText('在无网络环境下继续使用部分功能');
  assert.ok(offlineSubtitle, '应显示离线模式描述');
});

test('SettingsScreen: renders push notification toggle', () => {
  alertCalls.length = 0;
  mockNavigateCalls.length = 0;
  logoutCalled = false;

  const root = create(<SettingsScreen />);

  const findByText = (content: string) => {
    const all = root.root.findAllByType(Text);
    return all.find((t) => {
      const txt = t.props.children;
      return typeof txt === 'string' && txt.includes(content);
    });
  };

  const pushTitle = findByText('推送通知');
  assert.ok(pushTitle, '应显示推送通知设置项');

  const pushSubtitle = findByText('接收订单、优惠等通知');
  assert.ok(pushSubtitle, '应显示推送通知描述');
});

test('SettingsScreen: renders biometric and notification navigation items', () => {
  alertCalls.length = 0;
  mockNavigateCalls.length = 0;
  logoutCalled = false;

  const root = create(<SettingsScreen />);

  const findByText = (content: string) => {
    const all = root.root.findAllByType(Text);
    return all.find((t) => {
      const txt = t.props.children;
      return typeof txt === 'string' && txt.includes(content);
    });
  };

  const biometricTitle = findByText('生物识别');
  assert.ok(biometricTitle, '应显示生物识别设置项');

  const notificationSettings = findByText('通知设置');
  assert.ok(notificationSettings, '应显示通知设置导航项');

  const languageTitle = findByText('语言');
  assert.ok(languageTitle, '应显示语言设置项');
});

test('SettingsScreen: renders ToolRegistry navigation item', () => {
  alertCalls.length = 0;
  mockNavigateCalls.length = 0;
  logoutCalled = false;

  const root = create(<SettingsScreen />);

  const findByText = (content: string) => {
    const all = root.root.findAllByType(Text);
    return all.find((t) => {
      const txt = t.props.children;
      return typeof txt === 'string' && txt.includes(content);
    });
  };

  const toolRegistry = findByText('工具注册管理');
  assert.ok(toolRegistry, '应显示工具注册管理项');
});

test('SettingsScreen: renders clear cache', () => {
  alertCalls.length = 0;
  mockNavigateCalls.length = 0;
  logoutCalled = false;

  const root = create(<SettingsScreen />);

  const findByText = (content: string) => {
    const all = root.root.findAllByType(Text);
    return all.find((t) => {
      const txt = t.props.children;
      return typeof txt === 'string' && txt.includes(content);
    });
  };

  const clearCache = findByText('清除缓存');
  assert.ok(clearCache, '应显示清除缓存项');
});

test('SettingsScreen: renders check update with version info', () => {
  alertCalls.length = 0;
  mockNavigateCalls.length = 0;
  logoutCalled = false;

  const root = create(<SettingsScreen />);

  const findByText = (content: string) => {
    const all = root.root.findAllByType(Text);
    return all.find((t) => {
      const txt = t.props.children;
      return typeof txt === 'string' && txt.includes(content);
    });
  };

  const checkUpdate = findByText('检查更新');
  assert.ok(checkUpdate, '应显示检查更新项');

  const versionInfo = findByText('1.0.0');
  assert.ok(versionInfo, '应显示版本号 1.0.0');
});

test('SettingsScreen: renders about item', () => {
  alertCalls.length = 0;
  mockNavigateCalls.length = 0;
  logoutCalled = false;

  const root = create(<SettingsScreen />);

  const findByText = (content: string) => {
    const all = root.root.findAllByType(Text);
    return all.find((t) => {
      const txt = t.props.children;
      return typeof txt === 'string' && txt.includes(content);
    });
  };

  const about = findByText('关于');
  assert.ok(about, '应显示关于项');
});

test('SettingsScreen: renders legal section items', () => {
  alertCalls.length = 0;
  mockNavigateCalls.length = 0;
  logoutCalled = false;

  const root = create(<SettingsScreen />);

  const findByText = (content: string) => {
    const all = root.root.findAllByType(Text);
    return all.find((t) => {
      const txt = t.props.children;
      return typeof txt === 'string' && txt.includes(content);
    });
  };

  const userAgreement = findByText('用户协议');
  assert.ok(userAgreement, '应显示用户协议项');

  const privacyPolicy = findByText('隐私政策');
  assert.ok(privacyPolicy, '应显示隐私政策项');
});

test('SettingsScreen: renders logout button', () => {
  alertCalls.length = 0;
  mockNavigateCalls.length = 0;
  logoutCalled = false;

  const root = create(<SettingsScreen />);

  const findByText = (content: string) => {
    const all = root.root.findAllByType(Text);
    return all.find((t) => {
      const txt = t.props.children;
      return typeof txt === 'string' && txt.includes(content);
    });
  };

  const logoutButton = findByText('退出登录');
  assert.ok(logoutButton, '应显示退出登录按钮');
});
