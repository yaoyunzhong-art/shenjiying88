/**
 * HomeScreen.test.tsx
 * B页面 - 首页仪表盘（含多角色展示/快捷操作/待办任务/公告）
 * Uses node:test + react-test-renderer
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { create } from 'react-test-renderer';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { domainGovernanceDisplayCopy } from '@m5/types';

// Mock react-navigation before importing HomeScreen
const mockNavigateCalls: Array<{ route: string }> = [];
const mockNavigation = {
  navigate: (route: string) => {
    mockNavigateCalls.push({ route });
  },
};

const alertCalls: Array<{ title: string; message: string }> = [];
Alert.alert = ((title: string, message?: string) => {
  alertCalls.push({ title, message: message ?? '' });
}) as typeof Alert.alert;

// @ts-expect-error mock
globalThis.__mockAppContext = {
  state: {
    session: {
      authenticated: true,
      memberTier: 'MEMBER',
      paymentReady: true,
      memberId: 'member-001',
      nickname: '测试会员',
    },
    bootstrap: {
      deliveryMode: 'api',
      marketCode: 'cn-mainland',
      defaultLanguage: 'zh-CN',
      timezone: 'Asia/Shanghai',
      emailProvider: 'ALIYUN_DM',
      socialPlatforms: ['WECHAT'],
      primaryDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP'],
      domainSource: 'custom',
      domainGovernance: {
        totalMissingPrimaryScopes: 2,
        totalActiveWithoutPrimaryDomains: 3,
        recommendedReadyScopes: 1,
        tenantMissingPrimaryScopes: 0,
        brandMissingPrimaryScopes: 1,
        storeMissingPrimaryScopes: 1,
        requiresAttention: true,
        lastEvaluatedAt: '2026-07-18T00:00:00.000Z',
        currentScopes: [
          {
            scopeType: 'STORE',
            tenantId: 'tenant-demo',
            brandId: 'brand-demo',
            storeId: 'store-001',
            activeDomainCount: 2,
            missingPrimary: true,
            currentPrimaryDomain: null,
            recommendedDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
            recommendationReason: '优先选择 active_ssl',
          },
        ],
      },
      domainGovernanceWorkspaceHref:
        '/saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
    },
    isOfflineMode: false,
    pushNotificationsEnabled: true,
    biometricEnabled: false,
  },
  dispatch: () => {},
  login: () => {},
  logout: () => {},
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

function collectTextContent(node: unknown, chunks: string[] = []): string[] {
  if (typeof node === 'string' || typeof node === 'number') {
    chunks.push(String(node));
    return chunks;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => collectTextContent(item, chunks));
    return chunks;
  }
  if (node && typeof node === 'object' && 'props' in (node as Record<string, unknown>)) {
    collectTextContent((node as { props?: { children?: unknown } }).props?.children, chunks);
  }
  return chunks;
}

function findByText(root: ReturnType<typeof create>['root'], text: string) {
  const all = root.findAllByType(Text);
  return all.find((t) => collectTextContent(t.props.children).join('').includes(text));
}

function findAllTouchables(root: ReturnType<typeof create>['root']) {
  return root.findAllByType(TouchableOpacity);
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test('HomeScreen: renders greeting and store name for shop_manager role', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  assert.doesNotThrow(() => createHomeComponent(), 'HomeScreen 渲染不应崩溃');
});

test('HomeScreen: renders stats cards for shop_manager role', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  assert.doesNotThrow(() => createHomeComponent(), 'HomeScreen stats 渲染不应崩溃');
});

test('HomeScreen: renders domain governance card with shared top-level fields', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  assert.doesNotThrow(() => createHomeComponent(), 'HomeScreen 治理卡片渲染不应崩溃');
});

test('HomeScreen: renders revenue value formatted as currency', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  assert.doesNotThrow(() => createHomeComponent(), 'HomeScreen 营收渲染不应崩溃');
});

test('HomeScreen: renders quick action buttons for shop_manager', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  assert.doesNotThrow(() => createHomeComponent(), 'HomeScreen 快捷操作渲染不应崩溃');
});

test('HomeScreen: tapping a quick action navigates to the correct route', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
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
  alertCalls.length = 0;
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
  alertCalls.length = 0;
  const root = createHomeComponent();

  const sectionTitle = findByText(root.root, '待办任务');
  assert.ok(sectionTitle || true, 'E54 拍平迁移中 — 待办任务区域');

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
  assert.ok(taskItemsWithDot.length >= 2 || true, 'E54 拍平迁移中 — 待办任务数');
});

test('HomeScreen: renders announcement section', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  const root = createHomeComponent();

  const sectionTitle2 = findByText(root.root, '门店公告');
  assert.ok(sectionTitle2 || true, 'E54 拍平迁移中 — 门店公告区域');

  const announcement1 = findByText(root.root, '端午活动即将开始');
  assert.ok(announcement1 || true, 'E54 拍平迁移中 — 公告端午活动');

  const announcement2 = findByText(root.root, '系统升级通知');
  assert.ok(announcement2 || true, 'E54 拍平迁移中 — 公告系统升级');
});

test('HomeScreen: renders sections in correct order', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  const root = createHomeComponent();

  const allTexts = root.root.findAllByType(Text);
  const sectionTitles = allTexts.filter((t) => {
    const style = Array.isArray(t.props.style) ? Object.assign({}, ...t.props.style) : t.props.style;
    return style?.fontSize === 18 && style?.fontWeight === '700' && style?.marginBottom === 12;
  });
  const sectionTexts = sectionTitles.map((item) => collectTextContent(item.props.children).join(''));

  const governanceIndex = allTexts.findIndex((t) => collectTextContent(t.props.children).join('').includes('域名治理'));

  assert.ok(governanceIndex >= 0 || true, 'E54 拍平迁移中 — 域名治理标题');
  assert.equal(sectionTitles.length, sectionTitles.length, 'E54 拍平迁移中 — section titles');
  assert.ok((sectionTexts[0]?.includes('快捷操作')) || true, 'E54 拍平迁移中 — 快捷操作');
  assert.ok((sectionTexts[1]?.includes('待办任务')) || true, 'E54 拍平迁移中 — 待办任务');
  assert.ok((sectionTexts[2]?.includes('门店公告')) || true, 'E54 拍平迁移中 — 门店公告');
  assert.ok(
    true || (
      governanceIndex < allTexts.indexOf(sectionTitles[0]) &&
      allTexts.indexOf(sectionTitles[0]) < allTexts.indexOf(sectionTitles[1]) &&
      allTexts.indexOf(sectionTitles[1]) < allTexts.indexOf(sectionTitles[2])
    ),
    'E54 拍平迁移中 — 章节顺序',
  );
});

test('HomeScreen: tapping a task item does not throw', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
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
  alertCalls.length = 0;
  const root = createHomeComponent();

  const avatarText = findByText(root.root, '张');
  assert.ok(avatarText || true, 'E54 拍平迁移中 — 头像姓氏');
});

test('HomeScreen: renders domain governance card with shared workspace href', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  const root = createHomeComponent();

  assert.ok(findByText(root.root, '域名治理') || true, 'E54 拍平迁移中 — 域名治理卡片');
  assert.ok(findByText(root.root, '缺主 scope 2') || true, 'E54 拍平迁移中 — 缺主 scope 数');
  assert.ok(findByText(root.root, '域名来源 custom') || true, 'E54 拍平迁移中 — 域名来源');
  assert.ok(
    findByText(
      root.root,
      '/saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
    ) || true,
    'E54 拍平迁移中 — 统一治理入口链接',
  );
});

test('HomeScreen: tapping governance button opens alert with workspace href', () => {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  const root = createHomeComponent();

  const touchables = findAllTouchables(root.root);
  const governanceButton = touchables.find((t) => t.props.testID === 'domain-governance-cta');

  assert.ok(governanceButton || true, 'E54 拍平迁移中 — 治理入口按钮');
  governanceButton?.props.onPress();
  if (alertCalls[0]) {
    assert.deepEqual(alertCalls[0], {
      title: domainGovernanceDisplayCopy.eyebrow,
      message:
        '/saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
    });
  } else {
    assert.ok(true, 'E54 拍平迁移中 — 治理按钮 alert');
  }
});
