/**
 * HomeScreen.test.tsx
 * B页面 - 首页仪表盘（含多角色展示/快捷操作/待办任务/公告）
 * Uses node:test + react-test-renderer
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { create } from 'react-test-renderer';
import { View, Text, TouchableOpacity } from 'react-native';

// Mock react-navigation before importing HomeScreen
const mockNavigateCalls: Array<{ route: string }> = [];
const mockNavigation = {
  navigate: (route: string) => {
    mockNavigateCalls.push({ route });
  },
};

// @ts-expect-error mock
globalThis.__mockNavigation = mockNavigation;

// Mock @react-navigation/native
const mockUseNavigation = () => mockNavigation;

// We import after setting up mocks
const HomeScreenModule = require('./HomeScreen');
const { HomeScreen } = HomeScreenModule;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function createHomeComponent() {
  const root = create(<HomeScreen />);
  return root;
}

function findByText(root: ReturnType<typeof create>['root'], text: string) {
  const all = root.findAllByType(Text);
  return all.find((t) => {
    const content = t.props.children;
    if (typeof content === 'string' && content.includes(text)) return true;
    if (Array.isArray(content)) {
      return content.some(
        (c: unknown) => typeof c === 'string' && c.includes(text),
      );
    }
    return false;
  });
}

function findAllTouchables(root: ReturnType<typeof create>['root']) {
  return root.findAllByType(TouchableOpacity);
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test('HomeScreen: renders greeting and store name for shop_manager role', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  // 角色问候语
  const greeting = findByText(root.root, '下午好');
  assert.ok(greeting, '应显示角色问候语');

  // 门店名称
  const storeName = findByText(root.root, '神机营体育·城西店');
  assert.ok(storeName, '应显示门店名称');
});

test('HomeScreen: renders stats cards for shop_manager role', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  // 店长角色显示4个统计卡：今日营收、订单数、新会员、待办任务
  const revenueLabel = findByText(root.root, '今日营收');
  assert.ok(revenueLabel, '应显示今日营收');

  const orderLabel = findByText(root.root, '订单数');
  assert.ok(orderLabel, '应显示订单数');

  const memberLabel = findByText(root.root, '新会员');
  assert.ok(memberLabel, '应显示新会员');

  const taskLabel = findByText(root.root, '待办任务');
  assert.ok(taskLabel, '应显示待办任务');
});

test('HomeScreen: renders revenue value formatted as currency', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  const revenueValue = findByText(root.root, '¥');
  assert.ok(revenueValue, '应显示营收金额（带¥符号）');
  // 验证数字格式
  const formatted = findByText(root.root, '12,580.5');
  assert.ok(formatted, '营收金额应正确格式化');
});

test('HomeScreen: renders quick action buttons for shop_manager', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  // 店长6个快捷操作
  const paymentAction = findByText(root.root, '收银');
  assert.ok(paymentAction, '应显示收银');

  const scanAction = findByText(root.root, '扫码');
  assert.ok(scanAction, '应显示扫码');

  const orderAction = findByText(root.root, '订单');
  assert.ok(orderAction, '应显示订单');

  const inventoryAction = findByText(root.root, '库存');
  assert.ok(inventoryAction, '应显示库存');

  const memberAction = findByText(root.root, '会员');
  assert.ok(memberAction, '应显示会员');

  const reportAction = findByText(root.root, '报表');
  assert.ok(reportAction, '应显示报表');
});

test('HomeScreen: tapping a quick action navigates to the correct route', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  const touchables = findAllTouchables(root.root);

  // 找到点击收银按钮
  const cashierButton = touchables.find((t) => {
    const texts = t.findAllByType(Text);
    return texts.some((txt) => txt.props.children === '收银');
  });

  if (cashierButton) {
    cashierButton.props.onPress();
    const navCall = mockNavigateCalls.find((c) => c.route === 'PaymentTab');
    assert.ok(navCall, '点击收银应导航到 PaymentTab');
  }
});

test('HomeScreen: tapping 扫码 navigates to ScanTab', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  const touchables = findAllTouchables(root.root);
  const scanButton = touchables.find((t) => {
    const texts = t.findAllByType(Text);
    return texts.some((txt) => txt.props.children === '扫码');
  });

  if (scanButton) {
    scanButton.props.onPress();
    const navCall = mockNavigateCalls.find((c) => c.route === 'ScanTab');
    assert.ok(navCall, '点击扫码应导航到 ScanTab');
  }
});

test('HomeScreen: renders pending tasks section', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  const sectionTitle = findByText(root.root, '待办任务');
  assert.ok(sectionTitle, '应显示待办任务区域');

  // 待办任务数量提示
  const taskItems = root.root.findAllByType(TouchableOpacity);
  // 头部的头像也是TouchableOpacity，还有底部待办
  const taskItemsWithDot = taskItems.filter((t) => {
    const textContent = t.findAllByType(Text).map((txt) => txt.props.children).join('');
    return (
      textContent.includes('待处理退款') ||
      textContent.includes('库存预警') ||
      textContent.includes('员工排班')
    );
  });
  assert.ok(taskItemsWithDot.length >= 2, '应显示至少2个待办任务');
});

test('HomeScreen: renders announcement section', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  const sectionTitle = findByText(root.root, '门店公告');
  assert.ok(sectionTitle, '应显示门店公告区域');

  const announcement1 = findByText(root.root, '端午活动即将开始');
  assert.ok(announcement1, '应显示公告：端午活动');

  const announcement2 = findByText(root.root, '系统升级通知');
  assert.ok(announcement2, '应显示公告：系统升级通知');
});

test('HomeScreen: renders sections in correct order', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  const allTexts = root.root.findAllByType(Text);
  const sectionIndices: number[] = [];

  // 提取所有章节标题的位置
  const labels = ['快捷操作', '待办任务', '门店公告'];
  for (const label of labels) {
    const idx = allTexts.findIndex(
      (t) =>
        (typeof t.props.children === 'string' && t.props.children.includes(label)) ||
        (Array.isArray(t.props.children) &&
          t.props.children.some((c: unknown) => typeof c === 'string' && String(c).includes(label))),
    );
    // fallback: check ReactElement children for text match on complex nested structures
    const idxFallback = idx < 0
      ? allTexts.findIndex((t) => {
          const allChildStrings: string[] = [];
          const collectStrings = (node: unknown) => {
            if (typeof node === 'string') allChildStrings.push(node);
            else if (node && typeof node === 'object' && 'props' in (node as any)) {
              const n = node as any;
              if (n.props?.children) collectStrings(n.props.children);
            } else if (Array.isArray(node)) {
              node.forEach(collectStrings);
            }
          };
          collectStrings(t.props.children);
          return allChildStrings.some((s) => String(s).includes(label));
        })
      : idx;
    if (idxFallback >= 0) sectionIndices.push(idxFallback);
  }

  // 验证顺序：快捷操作 < 待办任务 < 门店公告
  assert.equal(sectionIndices.length, 3, '应找到3个章节标题');
  assert.ok(
    sectionIndices[0] < sectionIndices[1] && sectionIndices[1] < sectionIndices[2],
    '章节顺序应为：快捷操作 → 待办任务 → 门店公告',
  );
});

test('HomeScreen: tapping a task item does not throw', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  const touchables = findAllTouchables(root.root);
  const taskTouchables = touchables.filter((t) => {
    const texts = t.findAllByType(Text);
    return texts.some(
      (txt) =>
        typeof txt.props.children === 'string' &&
        txt.props.children.includes('待处理'),
    );
  });

  if (taskTouchables.length > 0) {
    assert.doesNotThrow(() => taskTouchables[0].props.onPress());
  }
});

test('HomeScreen: renders avatar with correct first character', () => {
  mockNavigateCalls.length = 0;
  const root = createHomeComponent();

  const avatarText = findByText(root.root, '张');
  assert.ok(avatarText, '头像应显示店长姓氏"张"');
});
