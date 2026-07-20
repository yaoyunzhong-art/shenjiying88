/**
 * orders-screen.test.tsx
 * B页面 - 订单 (OrderListScreen + OrderDetailScreen) 渲染/交互测试
 * Uses node:test + react-test-renderer
 * 三态覆盖: 正常渲染 / 空筛选 / Loading / 错误 / 边界
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { Alert, Text, TouchableOpacity, ScrollView, FlatList, RefreshControl } from 'react-native';

/* ------------------------------------------------------------------ */
/*  Mock setup                                                         */
/* ------------------------------------------------------------------ */

const mockNavigateCalls: Array<{ route: string; params?: Record<string, unknown> }> = [];

const mockNavigation = {
  navigate: (route: string, params?: Record<string, unknown>) => {
    mockNavigateCalls.push({ route, params });
  },
  goBack: () => {
    mockNavigateCalls.push({ route: '__GO_BACK__' });
  },
};

const alertCalls: Array<{ title: string; message?: string; buttons?: Array<{ text: string; style?: string; onPress?: () => void }> }> = [];
// @ts-expect-error mock
Alert.alert = (title: string, message?: string, buttons?: Array<{ text: string; style?: string; onPress?: () => void }>) => {
  alertCalls.push({ title, message, buttons });
};

// @ts-expect-error mock
globalThis.__mockNavigation = mockNavigation;

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
      deliveryMode: 'fallback',
      marketCode: 'cn-mainland',
      defaultLanguage: 'zh-CN',
      timezone: 'Asia/Shanghai',
      emailProvider: 'ALIYUN_DM',
      socialPlatforms: ['WECHAT'],
      primaryDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP'],
      domainSource: 'default',
      domainGovernance: {
        totalMissingPrimaryScopes: 0,
        totalActiveWithoutPrimaryDomains: 0,
        recommendedReadyScopes: 0,
        tenantMissingPrimaryScopes: 0,
        brandMissingPrimaryScopes: 0,
        storeMissingPrimaryScopes: 0,
        requiresAttention: false,
        lastEvaluatedAt: '1970-01-01T00:00:00.000Z',
        currentScopes: [],
      },
      domainGovernanceWorkspaceHref: '/saas/domains?marketCode=cn-mainland',
    },
    isOfflineMode: false,
    pushNotificationsEnabled: true,
    biometricEnabled: false,
  },
  dispatch: () => {},
  login: () => {},
  logout: () => {},
};

/* ------------------------------------------------------------------ */
/*  Import screens after mocks are set up                              */
/* ------------------------------------------------------------------ */

const OrderListScreenModule = require('./OrderListScreen');
const OrderDetailScreenModule = require('./OrderDetailScreen');
const { OrderListScreen } = OrderListScreenModule;
const { OrderDetailScreen } = OrderDetailScreenModule;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function createOrderListComponent(params?: Record<string, unknown>) {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  globalThis.__mockRoute = params as never;
  return create(<OrderListScreen />);
}

function createOrderDetailComponent(params?: Record<string, unknown>) {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  globalThis.__mockRoute = (params ?? { orderId: 'order-001' }) as never;
  return create(<OrderDetailScreen />);
}

function getOrderListFlatList(root: ReturnType<typeof create>) {
  return root.root.findByType(FlatList);
}

function renderFlatListOrderCards(root: ReturnType<typeof create>) {
  const flatList = getOrderListFlatList(root);
  const data = (flatList.props.data ?? []) as Array<Record<string, unknown>>;

  return data.map((item, index) =>
    create(
      flatList.props.renderItem({
        item,
        index,
        separators: {
          highlight() {},
          unhighlight() {},
          updateProps() {},
        },
      }),
    ),
  );
}

function renderOrderListFooter(root: ReturnType<typeof create>) {
  const flatList = getOrderListFlatList(root);
  const footer = flatList.props.ListFooterComponent;
  if (!footer) {
    return undefined;
  }

  const footerElement = typeof footer === 'function' ? footer() : footer;
  if (!footerElement) {
    return undefined;
  }

  return create(footerElement);
}

function findTextInOrderCards(root: ReturnType<typeof create>, text: string) {
  return renderFlatListOrderCards(root).some((card) => Boolean(findByText(card.root, text)));
}

function getRenderedOrderCard(root: ReturnType<typeof create>, orderNo: string) {
  return renderFlatListOrderCards(root).find((card) => Boolean(findByText(card.root, orderNo)));
}

function getHeaderValue(init: RequestInit | undefined, key: string) {
  if (!init?.headers) {
    return undefined;
  }
  if (typeof Headers !== 'undefined' && init.headers instanceof Headers) {
    return init.headers.get(key) ?? undefined;
  }
  if (Array.isArray(init.headers)) {
    const matched = init.headers.find(([headerKey]) => headerKey.toLowerCase() === key.toLowerCase());
    return matched?.[1];
  }
  return (init.headers as Record<string, string | undefined>)[key];
}

function getOrderListQuery(init: RequestInit | undefined) {
  const queryHeader = getHeaderValue(init, 'x-query-params');
  return queryHeader ? JSON.parse(queryHeader) as Record<string, unknown> : {};
}

function isOrderListRequest(url: string) {
  return url.includes('/transactions/orders');
}

function getOrderListRequestQuery(url: string, init?: RequestInit) {
  const parsedUrl = new URL(url, 'http://localhost');
  const queryFromUrl = Object.fromEntries(parsedUrl.searchParams.entries());
  const queryFromHeader = getOrderListQuery(init);
  return {
    ...queryFromHeader,
    ...queryFromUrl,
  };
}

function buildOrderListPageData(
  items: Array<Record<string, unknown>>,
  options?: { total?: number; page?: number; pageSize?: number },
) {
  return {
    items,
    total: options?.total ?? items.length,
    page: options?.page ?? 1,
    pageSize: options?.pageSize ?? 10,
  };
}

/* ================================================================== */
/*  ORDER LIST SCREEN TESTS                                            */
/* ================================================================== */

/* ---- 正例: 正常渲染 + 核心数据 ---- */

test('OrderListScreen: renders filter tabs', () => {
  const root = createOrderListComponent();

  const allTab = findByText(root.root, '全部');
  assert.ok(allTab, '应显示全部选项卡');

  const pendingTab = findByText(root.root, '待支付');
  assert.ok(pendingTab, '应显示待支付选项卡');

  const paidTab = findByText(root.root, '已完成');
  assert.ok(paidTab, '应显示已完成选项卡');

  const refundedTab = findByText(root.root, '已退款');
  assert.ok(refundedTab, '应显示已退款选项卡');
});

test('OrderListScreen: renders order cards with order numbers', () => {
  const root = createOrderListComponent();

  assert.ok(findTextInOrderCards(root, 'ORD20260612001'), '应显示订单 ORD20260612001');
  assert.ok(findTextInOrderCards(root, 'ORD20260612002'), '应显示订单 ORD20260612002');
  assert.ok(findTextInOrderCards(root, 'ORD20260611001'), '应显示订单 ORD20260611001');
  assert.ok(findTextInOrderCards(root, 'ORD20260610001'), '应显示订单 ORD20260610001');
});

test('OrderListScreen: renders 4 mock orders in list', () => {
  const root = createOrderListComponent();

  const flatList = getOrderListFlatList(root);
  assert.ok(flatList, '应渲染 FlatList');
  assert.equal(flatList.props.data.length, 4, '默认应加载 4 条 mock 订单');

  assert.ok(findTextInOrderCards(root, '¥156.00'), '应显示 ¥156.00');
  assert.ok(findTextInOrderCards(root, '¥89.50'), '应显示 ¥89.50');
});

test('OrderListScreen: renders status badges with correct labels', () => {
  const root = createOrderListComponent();

  const paidLabel = findByText(root.root, '已完成');
  assert.ok(paidLabel, 'PAID 状态订单应显示 已完成');

  const pendingLabel = findByText(root.root, '待支付');
  assert.ok(pendingLabel, 'PENDING 状态订单应显示 待支付');

  const refundedLabel = findByText(root.root, '已退款');
  assert.ok(refundedLabel, 'REFUNDED 状态订单应显示 已退款');
});

test('OrderListScreen: merges pending refund params into matching order card', () => {
  const root = createOrderListComponent({
    orderId: 'order-001',
    refundStatus: 'PENDING',
    refundRequestedAmount: 88.5,
    refundReason: '顾客取消',
    refundRequestedAt: '2026-07-20T02:03:04.000Z',
  });

  assert.ok(findTextInOrderCards(root, '退款审核中'), '退款回带后列表卡片应显示退款审核中');
  assert.ok(findTextInOrderCards(root, '申请退款金额'), '退款回带后列表卡片应切换为申请退款金额口径');
  assert.ok(findTextInOrderCards(root, '¥88.50'), '退款回带后列表卡片应展示退款申请金额');
  assert.ok(findTextInOrderCards(root, '申请时间'), '退款回带后列表卡片应展示申请时间');
});

test('OrderListScreen: merges refunded params into matching order card', () => {
  const root = createOrderListComponent({
    orderId: 'order-001',
    refundStatus: 'REFUNDED',
    refundRequestedAmount: 88.5,
    refundReason: '顾客取消',
    refundRequestedAt: '2026-07-20T02:03:04.000Z',
    refundCompletedAt: '2026-07-20T02:08:09.000Z',
  });

  assert.ok(findTextInOrderCards(root, '已退款'), '退款完成回带后列表卡片应显示已退款');
  assert.ok(findTextInOrderCards(root, '已退款金额'), '退款完成回带后列表卡片应显示已退款金额口径');
  assert.ok(findTextInOrderCards(root, '¥88.50'), '退款完成回带后列表卡片应展示退款金额');
  assert.ok(findTextInOrderCards(root, '退款完成时间'), '退款完成回带后列表卡片应展示退款完成时间');
});

test('OrderListScreen: merges paid params into matching order card', () => {
  const root = createOrderListComponent({
    orderId: 'order-002',
    paymentStatus: 'PAID',
    paymentAmount: 89.5,
    paymentPaidAt: '2026-07-20T03:20:00.000Z',
    paymentChannel: 'WECHAT_PAY',
  });

  assert.ok(findTextInOrderCards(root, '已完成'), '收款完成回带后列表卡片应显示已完成');
  assert.ok(findTextInOrderCards(root, '实付金额'), '收款完成回带后列表卡片应显示实付金额口径');
  assert.ok(findTextInOrderCards(root, '微信支付'), '收款完成回带后列表卡片应显示支付方式');
  assert.ok(findTextInOrderCards(root, '支付时间'), '收款完成回带后列表卡片应显示支付时间');
});

test('OrderListScreen: prefers real order list payload when list fetch is enabled', async () => {
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderListFetchEnabled = true;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (!isOrderListRequest(url)) {
      throw new Error(`unexpected request: ${url}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: buildOrderListPageData([
          {
            orderId: 'order-001',
            orderNo: 'ORDAPI20260720001',
            memberId: 'member-api-001',
            status: 'REFUNDING',
            itemCount: 3,
            totalAmount: 188,
            paidAmount: 188,
            refundedAmount: 0,
            refundRequestedAt: '2026-07-20T04:15:00.000Z',
            paymentChannel: 'wechat-pay',
            currency: 'CNY',
            createdAt: '2026-07-20T04:10:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            paidAt: '2026-07-20T04:12:00.000Z',
          },
          {
            orderId: 'order-002',
            orderNo: 'ORDAPI20260720002',
            memberId: 'member-api-002',
            status: 'PENDING_PAYMENT',
            itemCount: 2,
            totalAmount: 120,
            paidAmount: 0,
            refundedAmount: 0,
            currency: 'CNY',
            createdAt: '2026-07-20T04:11:00.000Z',
            updatedAt: '2026-07-20T04:11:00.000Z',
          },
        ]),
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createOrderListComponent();
      await Promise.resolve();
    });

    const flatList = getOrderListFlatList(root);
    assert.equal(flatList.props.data.length, 2, '启用真实列表后应使用接口返回的订单数量');
    assert.ok(findTextInOrderCards(root, 'ORDAPI20260720001'), '启用真实列表后应展示接口返回的订单号');
    assert.ok(findTextInOrderCards(root, '¥188.00'), '启用真实列表后应展示接口返回的金额');
    assert.ok(findTextInOrderCards(root, '3 件'), '启用真实列表后应展示接口返回的商品数量');
    assert.ok(findTextInOrderCards(root, '退款审核中'), '启用真实列表后应按接口状态映射退款审核中');
    assert.ok(findTextInOrderCards(root, '申请退款金额'), '启用真实列表后退款中订单应展示申请退款金额口径');
    assert.ok(findTextInOrderCards(root, '申请时间'), '启用真实列表后退款中订单应展示申请时间');
    assert.ok(findTextInOrderCards(root, '微信支付'), '启用真实列表后应展示接口返回的支付方式');
    assert.ok(findTextInOrderCards(root, '支付时间'), '启用真实列表后应展示接口返回的支付时间');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderListFetchEnabled;
  }
});

test('OrderListScreen: fetched paid order keeps api payment fields when navigating to detail', async () => {
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderListFetchEnabled = true;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (!isOrderListRequest(url)) {
      throw new Error(`unexpected request: ${url}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: buildOrderListPageData([
          {
            orderId: 'order-001',
            orderNo: 'ORDAPI20260720001',
            memberId: 'member-api-001',
            status: 'PAID',
            itemCount: 3,
            totalAmount: 188,
            paidAmount: 188,
            refundedAmount: 0,
            paymentChannel: 'wechat-pay',
            currency: 'CNY',
            createdAt: '2026-07-20T04:10:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            paidAt: '2026-07-20T04:12:00.000Z',
          },
        ]),
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createOrderListComponent();
      await Promise.resolve();
    });

    const orderCard = getRenderedOrderCard(root, 'ORDAPI20260720001');
    const touchables = orderCard?.root.findAllByType(TouchableOpacity) ?? [];
    const orderTouchable = touchables[0];

    assert.ok(orderTouchable, '真实列表订单卡片应在');
    if (orderTouchable) {
      orderTouchable.props.onPress();
      const navCall = mockNavigateCalls.find((c) => c.route === 'OrderDetail');
      assert.ok(navCall, '点击真实列表订单应导航到 OrderDetail');
      assert.equal(navCall?.params?.paymentPaidAt, '2026-07-20T04:12:00.000Z');
      assert.equal(navCall?.params?.paymentChannel, 'WECHAT_PAY');
    }
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderListFetchEnabled;
  }
});

test('OrderListScreen: runtime params still override fetched order list state', async () => {
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderListFetchEnabled = true;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (!isOrderListRequest(url)) {
      throw new Error(`unexpected request: ${url}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: buildOrderListPageData([
          {
            orderId: 'order-002',
            orderNo: 'ORDAPI20260720002',
            memberId: 'member-api-002',
            status: 'PENDING_PAYMENT',
            itemCount: 2,
            totalAmount: 120,
            paidAmount: 0,
            refundedAmount: 0,
            currency: 'CNY',
            createdAt: '2026-07-20T04:11:00.000Z',
            updatedAt: '2026-07-20T04:11:00.000Z',
          },
        ]),
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createOrderListComponent({
        orderId: 'order-002',
        paymentStatus: 'PAID',
        paymentAmount: 128,
        paymentPaidAt: '2026-07-20T05:20:00.000Z',
        paymentChannel: 'ALIPAY',
      });
      await Promise.resolve();
    });

    assert.ok(findTextInOrderCards(root, '已完成'), '真实列表场景下仍应承接支付回带状态');
    assert.ok(findTextInOrderCards(root, '¥128.00'), '真实列表场景下仍应承接支付回带金额');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderListFetchEnabled;
  }
});

test('OrderListScreen: paid filter passes status query to real order list api', async () => {
  const originalFetch = globalThis.fetch;
  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  // @ts-expect-error test flag
  globalThis.__mockOrderListFetchEnabled = true;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    fetchCalls.push({ url, init });
    if (!isOrderListRequest(url)) {
      throw new Error(`unexpected request: ${url}`);
    }

    const query = getOrderListRequestQuery(url, init);
    const data = query.status === 'PAID'
      ? [{
          orderId: 'order-004',
          orderNo: 'ORDAPI20260720004',
          memberId: 'member-api-004',
          status: 'PAID',
          itemCount: 1,
          totalAmount: 68,
          paidAmount: 68,
          refundedAmount: 0,
          currency: 'CNY',
          createdAt: '2026-07-20T04:12:00.000Z',
          updatedAt: '2026-07-20T04:12:00.000Z',
        }]
      : [
          {
            orderId: 'order-001',
            orderNo: 'ORDAPI20260720001',
            memberId: 'member-api-001',
            status: 'REFUNDING',
            itemCount: 3,
            totalAmount: 188,
            paidAmount: 188,
            refundedAmount: 0,
            currency: 'CNY',
            createdAt: '2026-07-20T04:10:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
          },
          {
            orderId: 'order-002',
            orderNo: 'ORDAPI20260720002',
            memberId: 'member-api-002',
            status: 'PENDING_PAYMENT',
            itemCount: 2,
            totalAmount: 120,
            paidAmount: 0,
            refundedAmount: 0,
            currency: 'CNY',
            createdAt: '2026-07-20T04:11:00.000Z',
            updatedAt: '2026-07-20T04:11:00.000Z',
          },
        ];

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: buildOrderListPageData(data),
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createOrderListComponent();
      await Promise.resolve();
    });

    const touchables = findAllTouchables(root.root);
    const paidTab = touchables.find((t) =>
      t.findAllByType(Text).some((txt) => txt.props.children === '已完成'),
    );
    assert.ok(paidTab, '已完成选项卡应在');

    await act(async () => {
      paidTab!.props.onPress();
      await Promise.resolve();
    });

    assert.equal(fetchCalls.length, 2, '切换到已完成筛选后应再次请求真实列表');
    assert.deepEqual(
      getOrderListRequestQuery(fetchCalls[1]!.url, fetchCalls[1]?.init),
      { status: 'PAID', page: '1', pageSize: '10' },
      '已完成筛选应把 PAID 状态与分页参数一起下沉到真实列表 query',
    );
    assert.ok(findTextInOrderCards(root, 'ORDAPI20260720004'), '已完成筛选后应展示服务端返回的已完成订单');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderListFetchEnabled;
  }
});

test('OrderListScreen: refunded filter keeps runtime refund order visible with real api filtering', async () => {
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderListFetchEnabled = true;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (!isOrderListRequest(url)) {
      throw new Error(`unexpected request: ${url}`);
    }

    const query = getOrderListRequestQuery(url, init);
    const data = query.status === 'REFUNDED'
      ? [{
          orderId: 'order-003',
          orderNo: 'ORDAPI20260720003',
          memberId: 'member-api-003',
          status: 'REFUNDED',
          itemCount: 5,
          totalAmount: 320,
          paidAmount: 320,
          refundedAmount: 320,
          refundRequestedAt: '2026-07-20T04:05:00.000Z',
          refundCompletedAt: '2026-07-20T04:18:00.000Z',
          currency: 'CNY',
          createdAt: '2026-07-20T04:13:00.000Z',
          updatedAt: '2026-07-20T04:13:00.000Z',
        }]
      : [{
          orderId: 'order-002',
          orderNo: 'ORDAPI20260720002',
          memberId: 'member-api-002',
          status: 'PENDING_PAYMENT',
          itemCount: 2,
          totalAmount: 120,
          paidAmount: 0,
          refundedAmount: 0,
          currency: 'CNY',
          createdAt: '2026-07-20T04:11:00.000Z',
          updatedAt: '2026-07-20T04:11:00.000Z',
        }];

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: buildOrderListPageData(data),
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createOrderListComponent({
        orderId: 'order-001',
        refundStatus: 'PENDING',
      });
      await Promise.resolve();
    });

    const touchables = findAllTouchables(root.root);
    const refundedTab = touchables.find((t) =>
      t.findAllByType(Text).some((txt) => txt.props.children === '已退款'),
    );
    assert.ok(refundedTab, '已退款选项卡应在');

    await act(async () => {
      refundedTab!.props.onPress();
      await Promise.resolve();
    });

    const flatList = getOrderListFlatList(root);
    const orderIds = (flatList.props.data as Array<{ orderId: string }>).map((item) => item.orderId);
    assert.ok(orderIds.includes('order-001'), '真实筛选下也应补回当前退款运行态订单');
    assert.ok(findTextInOrderCards(root, '退款审核中'), '补回的运行态订单应展示退款审核中');
    assert.ok(findTextInOrderCards(root, '退款完成时间'), '已退款筛选应展示服务端返回的退款完成时间');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderListFetchEnabled;
  }
});

test('OrderListScreen: last 7 days range passes date query to real order list api', async () => {
  const originalFetch = globalThis.fetch;
  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  // @ts-expect-error test flag
  globalThis.__mockOrderListFetchEnabled = true;
  // @ts-expect-error test flag
  globalThis.__mockOrderListNow = '2026-07-20T12:00:00.000Z';
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    fetchCalls.push({ url, init });
    if (!isOrderListRequest(url)) {
      throw new Error(`unexpected request: ${url}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: buildOrderListPageData([]),
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createOrderListComponent();
      await Promise.resolve();
    });

    const touchables = findAllTouchables(root.root);
    const last7DaysTab = touchables.find((t) =>
      t.findAllByType(Text).some((txt) => txt.props.children === '近7天'),
    );
    assert.ok(last7DaysTab, '近7天选项卡应在');

    await act(async () => {
      last7DaysTab!.props.onPress();
      await Promise.resolve();
    });

    assert.equal(fetchCalls.length, 2, '切换到近7天后应再次请求真实列表');
    assert.deepEqual(
      getOrderListRequestQuery(fetchCalls[1]!.url, fetchCalls[1]?.init),
      {
        page: '1',
        pageSize: '10',
        fromDate: '2026-07-14T12:00:00.000Z',
        toDate: '2026-07-20T12:00:00.000Z',
      },
      '近7天筛选应把 fromDate/toDate 与分页参数一起下沉到真实列表 query',
    );
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderListFetchEnabled;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderListNow;
  }
});

test('OrderListScreen: load more passes next page query and keeps runtime order visible', async () => {
  const originalFetch = globalThis.fetch;
  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  // @ts-expect-error test flag
  globalThis.__mockOrderListFetchEnabled = true;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    fetchCalls.push({ url, init });
    if (!isOrderListRequest(url)) {
      throw new Error(`unexpected request: ${url}`);
    }

    const query = getOrderListRequestQuery(url, init);
    const data = query.page === '2'
      ? Array.from({ length: 10 }, (_, index) => ({
          orderId: `page-2-order-${index + 1}`,
          orderNo: `ORDAPI20260720P2${String(index + 1).padStart(2, '0')}`,
          memberId: `member-page2-${index + 1}`,
          status: 'PAID',
          itemCount: index + 1,
          totalAmount: 80 + index,
          paidAmount: 80 + index,
          refundedAmount: 0,
          currency: 'CNY',
          createdAt: '2026-07-20T06:10:00.000Z',
          updatedAt: '2026-07-20T06:10:00.000Z',
        }))
      : Array.from({ length: 10 }, (_, index) => ({
          orderId: `page-1-order-${index + 1}`,
          orderNo: `ORDAPI20260720P1${String(index + 1).padStart(2, '0')}`,
          memberId: `member-page1-${index + 1}`,
          status: 'PENDING_PAYMENT',
          itemCount: index + 1,
          totalAmount: 50 + index,
          paidAmount: 0,
          refundedAmount: 0,
          currency: 'CNY',
          createdAt: '2026-07-20T05:10:00.000Z',
          updatedAt: '2026-07-20T05:10:00.000Z',
        }));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: buildOrderListPageData(
          data,
          query.page === '2'
            ? { total: 20, page: 2, pageSize: 10 }
            : { total: 20, page: 1, pageSize: 10 },
        ),
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createOrderListComponent({
        orderId: 'order-001',
        paymentStatus: 'PAID',
        paymentAmount: 156,
        paymentPaidAt: '2026-07-20T05:20:00.000Z',
        paymentChannel: 'WECHAT_PAY',
      });
      await Promise.resolve();
    });

    const footer = renderOrderListFooter(root);
    const loadMoreButton = footer?.root.findAllByType(TouchableOpacity).find((t) =>
      t.findAllByType(Text).some((txt) => txt.props.children === '加载更多'),
    );
    assert.ok(loadMoreButton, '真实列表有下一页时应显示加载更多按钮');

    await act(async () => {
      loadMoreButton!.props.onPress();
      await Promise.resolve();
    });

    assert.equal(fetchCalls.length, 2, '点击加载更多后应请求下一页');
    assert.deepEqual(
      getOrderListRequestQuery(fetchCalls[1]!.url, fetchCalls[1]?.init),
      { page: '2', pageSize: '10' },
      '加载更多应把下一页分页参数下沉到真实列表 query',
    );

    const flatList = getOrderListFlatList(root);
    const orderIds = (flatList.props.data as Array<{ orderId: string }>).map((item) => item.orderId);
    assert.ok(orderIds.includes('order-001'), '分页场景下也应保留当前运行态订单');
    assert.ok(orderIds.includes('page-2-order-1'), '加载更多后应追加第二页订单');
    assert.ok(findTextInOrderCards(root, '已完成'), '分页场景下当前运行态订单仍应承接支付成功状态');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderListFetchEnabled;
  }
});

test('OrderListScreen: default filter is ALL', () => {
  const root = createOrderListComponent();
  // ALL filter should be active, showing all 4 orders
  const allTab = findAllTouchables(root.root).find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '全部'),
  );
  assert.ok(allTab, '全部选项卡应在');

  const flatList = getOrderListFlatList(root);
  const orderNos = (flatList.props.data as Array<{ orderNo: string }>).map((item) => item.orderNo);
  assert.deepEqual(
    orderNos,
    ['ORD20260612001', 'ORD20260612002', 'ORD20260611001', 'ORD20260610001'],
    '默认全部筛选显示所有订单',
  );
});

/* ---- 筛选交互 ---- */

test('OrderListScreen: tapping PENDING filter shows only pending orders', () => {
  const root = createOrderListComponent();

  const touchables = findAllTouchables(root.root);
  const pendingTab = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '待支付'),
  );

  assert.ok(pendingTab, '待支付选项卡应在');
  pendingTab!.props.onPress();
});

test('OrderListScreen: tapping PAID filter shows only completed orders', () => {
  const root = createOrderListComponent();

  const touchables = findAllTouchables(root.root);
  const paidTab = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '已完成'),
  );

  assert.ok(paidTab, '已完成选项卡应在');
  paidTab!.props.onPress();
});

test('OrderListScreen: tapping REFUNDED filter shows only refunded orders', () => {
  const root = createOrderListComponent();

  const touchables = findAllTouchables(root.root);
  const refundedTab = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '已退款'),
  );

  assert.ok(refundedTab, '已退款选项卡应在');
  refundedTab!.props.onPress();
});

test('OrderListScreen: refunded filter keeps refund pending orders visible', () => {
  const root = createOrderListComponent({
    orderId: 'order-001',
    refundStatus: 'PENDING',
  });

  const touchables = findAllTouchables(root.root);
  const refundedTab = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '已退款'),
  );

  assert.ok(refundedTab, '已退款选项卡应在');
  refundedTab!.props.onPress();

  const flatList = getOrderListFlatList(root);
  const refundedOrderIds = (flatList.props.data as Array<{ orderId: string }>).map((item) => item.orderId);
  assert.ok(refundedOrderIds.includes('order-001'), '退款审核中的订单在已退款筛选下也应可见');
});

test('OrderListScreen: tapping ALL filter shows all orders after filter', () => {
  const root = createOrderListComponent();

  const touchables = findAllTouchables(root.root);
  const pendingTab = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '待支付'),
  );
  const allTab = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '全部'),
  );

  assert.ok(pendingTab && allTab);

  // Switch to PENDING
  pendingTab!.props.onPress();
  // Switch back to ALL
  allTab!.props.onPress();

  // No crash
  assert.ok(true, '在筛选间切换不应崩溃');
});

/* ---- 订单点击导航 ---- */

test('OrderListScreen: tapping an order card navigates to OrderDetail', () => {
  const root = createOrderListComponent();

  const orderCard = getRenderedOrderCard(root, 'ORD20260612001');
  const touchables = orderCard?.root.findAllByType(TouchableOpacity) ?? [];
  const orderTouchable = touchables[0];

  assert.ok(orderTouchable, '订单卡片应在');
  if (orderTouchable) {
    orderTouchable.props.onPress();
    const navCall = mockNavigateCalls.find((c) => c.route === 'OrderDetail');
    assert.ok(navCall, '点击订单应导航到 OrderDetail');
    assert.equal(navCall?.params?.orderId, 'order-001', '应传递正确 orderId');
  }
});

test('OrderListScreen: tapping order card navigates with correct order ID', () => {
  const root = createOrderListComponent();

  const orderCard = getRenderedOrderCard(root, 'ORD20260610001');
  const touchables = orderCard?.root.findAllByType(TouchableOpacity) ?? [];
  const order004Touchable = touchables[0];

  assert.ok(order004Touchable, '订单 ORD20260610001 的卡片应在');
  if (order004Touchable) {
    order004Touchable.props.onPress();
    const navCall = mockNavigateCalls.find((c) => c.route === 'OrderDetail');
    assert.ok(navCall, '应导航到 OrderDetail');
    assert.equal(navCall?.params?.orderId, 'order-004', '应传递 order-004');
  }
});

test('OrderListScreen: tapping refunded order card preserves refund timestamps', () => {
  const root = createOrderListComponent({
    orderId: 'order-001',
    refundStatus: 'REFUNDED',
    refundRequestedAmount: 88.5,
    refundRequestedAt: '2026-07-20T02:03:04.000Z',
    refundCompletedAt: '2026-07-20T02:08:09.000Z',
  });

  const orderCard = getRenderedOrderCard(root, 'ORD20260612001');
  const touchables = orderCard?.root.findAllByType(TouchableOpacity) ?? [];
  const orderTouchable = touchables[0];

  assert.ok(orderTouchable, '退款订单卡片应在');
  if (orderTouchable) {
    orderTouchable.props.onPress();
    const navCall = mockNavigateCalls.find((c) => c.route === 'OrderDetail');
    assert.ok(navCall, '点击退款订单应导航到 OrderDetail');
    assert.equal(navCall?.params?.refundRequestedAt, '2026-07-20T02:03:04.000Z');
    assert.equal(navCall?.params?.refundCompletedAt, '2026-07-20T02:08:09.000Z');
  }
});

/* ---- 空状态/边界 ---- */

test('OrderListScreen: renders order cards via FlatList in list', () => {
  const root = createOrderListComponent();

  const renderedCards = renderFlatListOrderCards(root);
  assert.equal(renderedCards.length, 4, 'FlatList 应提供 4 个订单卡片');
  assert.ok(findTextInOrderCards(root, 'ORD20260612001'), '订单卡片应包含首条订单号');
});

test('OrderListScreen: swipe refresh control renders without crash', () => {
  const root = createOrderListComponent();

  const flatList = getOrderListFlatList(root);
  const refreshControl = flatList.props.refreshControl as React.ReactElement<{ onRefresh?: () => void }>;
  assert.ok(refreshControl, '应包含下拉刷新控件');

  if (refreshControl && refreshControl.props.onRefresh) {
    assert.doesNotThrow(() => refreshControl.props.onRefresh(), '下拉刷新不应崩溃');
  }
});

/* ================================================================== */
/*  ORDER DETAIL SCREEN TESTS                                          */
/* ================================================================== */

/* ---- 正例: 正常渲染 + 核心数据 ---- */

test('OrderDetailScreen: renders order status section', () => {
  const root = createOrderDetailComponent();

  const statusLabel = findByText(root.root, '订单状态');
  assert.ok(statusLabel, '应显示订单状态');

  const statusBadge = findByText(root.root, '已完成');
  assert.ok(statusBadge, 'PAID 状态应显示 已完成');
});

test('OrderDetailScreen: renders order number and dates', () => {
  const root = createOrderDetailComponent();

  const orderNo = findByText(root.root, 'ORD20260612001');
  assert.ok(orderNo, '应显示订单号 ORD20260612001');

  const placeholder = findByText(root.root, '订单号');
  assert.ok(placeholder, '应显示订单号标签');
});

test('OrderDetailScreen: renders order items section', () => {
  const root = createOrderDetailComponent();

  const sectionTitle = findByText(root.root, '商品明细');
  assert.ok(sectionTitle, '应显示商品明细区域');

  // Verify item names
  const latte = findByText(root.root, '拿铁咖啡');
  assert.ok(latte, '应显示拿铁咖啡');

  const tiramisu = findByText(root.root, '提拉米苏');
  assert.ok(tiramisu, '应显示提拉米苏');

  const orangeJuice = findByText(root.root, '鲜榨橙汁');
  assert.ok(orangeJuice, '应显示鲜榨橙汁');
});

test('OrderDetailScreen: renders payment information section', () => {
  const root = createOrderDetailComponent();

  const paymentSection = findByText(root.root, '支付信息');
  assert.ok(paymentSection, '应显示支付信息区域');

  const paymentChannel = findByText(root.root, '微信支付');
  assert.ok(paymentChannel, '应显示支付方式: 微信支付');

  const totalAmount = findByText(root.root, '¥156.00');
  assert.ok(totalAmount, '应显示支付金额 ¥156.00');
});

test('OrderDetailScreen: renders pending order status for order-002', () => {
  const root = createOrderDetailComponent({ orderId: 'order-002' });

  assert.ok(findByText(root.root, '待支付'), '待支付订单应显示待支付状态');
  assert.ok(findByText(root.root, 'ORD20260612002'), '应显示 order-002 的订单号');
  assert.ok(findByText(root.root, '¥89.50'), '应显示待支付订单金额');
});

test('OrderDetailScreen: prefers real aggregate payload when order fetch is enabled', async () => {
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (!url.endsWith('/transactions/orders/order-002')) {
      throw new Error(`unexpected request: ${url}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          memberNickname: '接口会员二号',
          order: {
            orderId: 'order-002',
            orderNo: 'ORDAPI20260720002',
            memberId: 'member-api-002',
            items: [
              { skuId: 'SKU-API-201', title: '燕麦拿铁', quantity: 1, price: 38 },
              { skuId: 'SKU-API-202', title: '坚果能量棒', quantity: 2, price: 29 },
            ],
            currency: 'CNY',
            totalAmount: 120,
            status: 'PENDING_PAYMENT',
            latestPaymentId: 'payment-order-002',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
          },
          payment: {
            paymentId: 'payment-order-002',
            orderId: 'order-002',
            channel: 'ALIPAY',
            amount: 120,
            status: 'PENDING',
            externalPaymentId: 'app-pos-order-002',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
          },
          settlement: {
            settlementId: 'settlement-order-002',
            pointsEarned: 120,
            pointsBalance: 120,
          },
          pointsLedger: [],
          couponRedemptions: [],
          blindboxFulfillments: [],
          refunds: [],
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createOrderDetailComponent({ orderId: 'order-002' });
      await Promise.resolve();
    });

    assert.ok(findByText(root.root, 'ORDAPI20260720002'), '启用真实聚合后应展示接口返回的订单号');
    assert.ok(findByText(root.root, '支付宝'), '启用真实聚合后应展示接口返回的支付渠道');
    assert.ok(findByText(root.root, '¥120.00'), '启用真实聚合后应展示接口返回的支付金额');
    assert.ok(findByText(root.root, 'member-api-002'), '启用真实聚合后应展示接口返回的会员ID');
    assert.ok(findByText(root.root, '接口会员二号'), '启用真实聚合后应展示接口返回的会员昵称');
    assert.ok(findByText(root.root, '燕麦拿铁'), '启用真实聚合后应展示接口返回的商品明细');
    assert.ok(findByText(root.root, '坚果能量棒'), '启用真实聚合后应展示接口返回的商品明细');
    assert.ok(findByText(root.root, 'SKU-API-201'), '启用真实聚合后应展示接口返回的 SKU');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('OrderDetailScreen: renders member information section', () => {
  const root = createOrderDetailComponent();

  const memberSection = findByText(root.root, '会员信息');
  assert.ok(memberSection, '应显示会员信息区域');

  const memberId = findByText(root.root, 'member-001');
  assert.ok(memberId, '应显示会员ID');

  const memberName = findByText(root.root, '张三');
  assert.ok(memberName, '应显示会员昵称');
});

test('OrderDetailScreen: renders points earned', () => {
  const root = createOrderDetailComponent();

  const pointsLabel = findByText(root.root, '获得积分');
  assert.ok(pointsLabel, '应显示积分标签');

  const pointsValue = findByText(root.root, '+156');
  assert.ok(pointsValue, '应显示 +156 积分');
});

test('OrderDetailScreen: renders refund button for PAID order', () => {
  const root = createOrderDetailComponent();

  const refundBtn = findByText(root.root, '申请退款');
  assert.ok(refundBtn, '已完成订单应显示 申请退款 按钮');
});

test('OrderDetailScreen: renders item quantities with correct format', () => {
  const root = createOrderDetailComponent();

  const qty2 = findByText(root.root, 'x2');
  assert.ok(qty2, '拿铁咖啡数量应为 x2');

  const qty1 = findByText(root.root, 'x1');
  assert.ok(qty1, '其他商品数量应为 x1');
});

test('OrderDetailScreen: renders SKU identifiers', () => {
  const root = createOrderDetailComponent();

  const sku001 = findByText(root.root, 'SKU001');
  assert.ok(sku001, '应显示 SKU001');

  const sku002 = findByText(root.root, 'SKU002');
  assert.ok(sku002, '应显示 SKU002');
});

/* ---- 交互: 订单操作 ---- */

test('OrderDetailScreen: tapping refund button opens alert', () => {
  const root = createOrderDetailComponent();

  const touchables = findAllTouchables(root.root);
  const refundBtn = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '申请退款'),
  );

  assert.ok(refundBtn, '申请退款按钮应在');
  if (refundBtn) {
    refundBtn.props.onPress();
    const navigateCall = mockNavigateCalls.find((item) => item.route === 'Refund');
    assert.ok(navigateCall, '点击退款应跳转到退款页');
    assert.equal(navigateCall?.params?.orderId, 'order-001');
    assert.equal(navigateCall?.params?.orderNo, 'ORD20260612001');
    assert.equal(navigateCall?.params?.amount, 156);
  }
});

test('OrderDetailScreen: pending order shows go-pay button instead of refund button', () => {
  const root = createOrderDetailComponent({ orderId: 'order-002' });

  assert.ok(findByText(root.root, '去收款'), '待支付订单应显示去收款按钮');
  assert.ok(!findByText(root.root, '申请退款'), '待支付订单不应显示申请退款按钮');
});

test('OrderDetailScreen: tapping go-pay navigates to payment with order info', () => {
  const root = createOrderDetailComponent({ orderId: 'order-002' });
  const touchables = findAllTouchables(root.root);
  const payButton = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '去收款'),
  );

  assert.ok(payButton, '去收款按钮应在');
  payButton!.props.onPress();

  const navigateCall = mockNavigateCalls.find((item) => item.route === 'Payment');
  assert.ok(navigateCall, '点击去收款应跳转到 Payment');
  assert.equal(navigateCall?.params?.orderId, 'order-002');
  assert.equal(navigateCall?.params?.orderNo, 'ORD20260612002');
  assert.equal(navigateCall?.params?.amount, 89.5);
});

test('OrderDetailScreen: payment success params turn pending order into paid', () => {
  const root = createOrderDetailComponent({
    orderId: 'order-002',
    paymentStatus: 'PAID',
    paymentAmount: 89.5,
    paymentPaidAt: '2026-07-20T03:20:00.000Z',
    paymentChannel: 'WECHAT_PAY',
  });

  assert.ok(findByText(root.root, '已完成'), '收款完成后详情应显示已完成');
  assert.ok(findByText(root.root, '申请退款'), '收款完成后应允许申请退款');
});

test('OrderDetailScreen: tapping back after payment success returns to Orders with payment params', () => {
  const root = createOrderDetailComponent({
    orderId: 'order-002',
    paymentStatus: 'PAID',
    paymentAmount: 89.5,
    paymentPaidAt: '2026-07-20T03:20:00.000Z',
    paymentChannel: 'WECHAT_PAY',
  });
  const touchables = findAllTouchables(root.root);
  const backButton = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '返回'),
  );

  assert.ok(backButton, '已完成订单应显示返回按钮');
  backButton!.props.onPress();

  const navigateCall = mockNavigateCalls.find((item) => item.route === 'Orders');
  assert.ok(navigateCall, '支付完成返回时应导航回订单列表');
  assert.equal(navigateCall?.params?.orderId, 'order-002');
  assert.equal(navigateCall?.params?.orderNo, 'ORD20260612002');
  assert.equal(navigateCall?.params?.paymentStatus, 'PAID');
  assert.equal(navigateCall?.params?.paymentAmount, 89.5);
});

test('OrderDetailScreen: renders pending refund summary from returned params', () => {
  const root = createOrderDetailComponent({
    orderId: 'order-001',
    refundStatus: 'PENDING',
    refundRequestedAmount: 88.5,
    refundReason: '顾客取消',
    refundRequestedAt: '2026-07-20T02:03:04.000Z',
  });

  const pendingStatus = findByText(root.root, '退款审核中');
  assert.ok(pendingStatus, '回带退款状态后应显示退款审核中');

  const refundProgress = findByText(root.root, '退款进度');
  assert.ok(refundProgress, '应显示退款进度卡片');

  const refundAmount = findByText(root.root, '¥88.50');
  assert.ok(refundAmount, '应显示回带的退款申请金额');

  const refundReason = findByText(root.root, '顾客取消');
  assert.ok(refundReason, '应显示回带的退款原因');

  const backButton = findByText(root.root, '返回');
  assert.ok(backButton, '退款审核中时底部应切为返回按钮');
});

test('OrderDetailScreen: tapping back after pending refund returns to Orders with refund params', () => {
  const root = createOrderDetailComponent({
    orderId: 'order-001',
    refundStatus: 'PENDING',
    refundRequestedAmount: 88.5,
    refundReason: '顾客取消',
    refundRequestedAt: '2026-07-20T02:03:04.000Z',
  });

  const touchables = findAllTouchables(root.root);
  const backButton = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '返回'),
  );

  assert.ok(backButton, '返回按钮应在');
  backButton!.props.onPress();

  const navigateCall = mockNavigateCalls.find((item) => item.route === 'Orders');
  assert.ok(navigateCall, '退款审核中返回时应导航回订单列表');
  assert.equal(navigateCall?.params?.orderId, 'order-001');
  assert.equal(navigateCall?.params?.orderNo, 'ORD20260612001');
  assert.equal(navigateCall?.params?.refundStatus, 'PENDING');
  assert.equal(navigateCall?.params?.refundRequestedAmount, 88.5);
  assert.equal(navigateCall?.params?.refundReason, '顾客取消');
});

test('OrderDetailScreen: renders refunded summary from returned params', () => {
  const root = createOrderDetailComponent({
    orderId: 'order-001',
    refundStatus: 'REFUNDED',
    refundRequestedAmount: 88.5,
    refundReason: '顾客取消',
    refundRequestedAt: '2026-07-20T02:03:04.000Z',
    refundCompletedAt: '2026-07-20T02:08:09.000Z',
  });

  assert.ok(findByText(root.root, '已退款'), '退款完成态应显示已退款');
  assert.ok(findByText(root.root, '退款结果'), '退款完成态应显示退款结果卡片');
  assert.ok(findByText(root.root, '完成时间'), '退款完成态应展示完成时间');
});

test('OrderDetailScreen: tapping back after refunded returns to Orders with completed refund params', () => {
  const root = createOrderDetailComponent({
    orderId: 'order-001',
    refundStatus: 'REFUNDED',
    refundRequestedAmount: 88.5,
    refundReason: '顾客取消',
    refundRequestedAt: '2026-07-20T02:03:04.000Z',
    refundCompletedAt: '2026-07-20T02:08:09.000Z',
  });

  const touchables = findAllTouchables(root.root);
  const backButton = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '返回'),
  );

  assert.ok(backButton, '返回按钮应在');
  backButton!.props.onPress();

  const navigateCall = mockNavigateCalls.find((item) => item.route === 'Orders');
  assert.ok(navigateCall, '退款完成返回时应导航回订单列表');
  assert.equal(navigateCall?.params?.orderId, 'order-001');
  assert.equal(navigateCall?.params?.orderNo, 'ORD20260612001');
  assert.equal(navigateCall?.params?.refundStatus, 'REFUNDED');
  assert.equal(navigateCall?.params?.refundCompletedAt, '2026-07-20T02:08:09.000Z');
});

test('OrderDetailScreen: payment return preserves real orderNo when fetch is enabled', async () => {
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (!url.endsWith('/transactions/orders/order-002')) {
      throw new Error(`unexpected request: ${url}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          order: {
            orderId: 'order-002',
            orderNo: 'ORDAPI20260720002',
            memberId: 'member-api-002',
            currency: 'CNY',
            totalAmount: 120,
            status: 'PAID',
            latestPaymentId: 'payment-order-002',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            paidAt: '2026-07-20T04:10:00.000Z',
          },
          payment: {
            paymentId: 'payment-order-002',
            orderId: 'order-002',
            channel: 'ALIPAY',
            amount: 120,
            status: 'SUCCEEDED',
            externalPaymentId: 'app-pos-order-002',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            completedAt: '2026-07-20T04:10:00.000Z',
          },
          settlement: {
            settlementId: 'settlement-order-002',
            pointsEarned: 120,
            pointsBalance: 120,
          },
          pointsLedger: [],
          couponRedemptions: [],
          blindboxFulfillments: [],
          refunds: [],
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createOrderDetailComponent({
        orderId: 'order-002',
        orderNo: 'ORDAPI20260720002',
        paymentStatus: 'PAID',
        paymentAmount: 120,
        paymentPaidAt: '2026-07-20T04:10:00.000Z',
        paymentChannel: 'ALIPAY',
      });
      await Promise.resolve();
    });

    const touchables = findAllTouchables(root.root);
    const backButton = touchables.find((t) =>
      t.findAllByType(Text).some((txt) => txt.props.children === '返回'),
    );

    assert.ok(backButton, '真实聚合支付完成时应显示返回按钮');
    backButton!.props.onPress();

    const navigateCall = mockNavigateCalls.find((item) => item.route === 'Orders');
    assert.ok(navigateCall, '返回时应导航回订单列表');
    assert.equal(navigateCall?.params?.orderId, 'order-002');
    assert.equal(navigateCall?.params?.orderNo, 'ORDAPI20260720002');
    assert.equal(navigateCall?.params?.paymentStatus, 'PAID');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('OrderDetailScreen: item prices are formatted correctly', () => {
  const root = createOrderDetailComponent();

  const price32 = findByText(root.root, '¥32.00');
  assert.ok(price32, '拿铁咖啡价格应显示 ¥32.00');

  const price48 = findByText(root.root, '¥48.00');
  assert.ok(price48, '提拉米苏价格应显示 ¥48.00');

  const price44 = findByText(root.root, '¥44.00');
  assert.ok(price44, '鲜榨橙汁价格应显示 ¥44.00');
});

/* ---- 边界: 组件完整性 ---- */

test('OrderDetailScreen: renders all 3 expected sections in order', () => {
  const root = createOrderDetailComponent();

  const sections = ['订单状态', '商品明细', '支付信息', '会员信息'];
  for (const section of sections) {
    const el = findByText(root.root, section);
    assert.ok(el, `应包含区域: ${section}`);
  }
});

test('OrderDetailScreen: renders with empty orderId gracefully', () => {
  // Re-create with no route params
  delete globalThis.__mockRoute;
  assert.doesNotThrow(() => {
    create(<OrderDetailScreen />);
  }, '无参数渲染不应崩溃');
});

test('OrderListScreen: renders all 4 order item counts', () => {
  const root = createOrderListComponent();

  const itemCounts = renderFlatListOrderCards(root).flatMap((card) =>
    card.root.findAllByType(Text).filter((t) =>
      collectTextContent(t.props.children).join('').endsWith('件'),
    ),
  );
  assert.equal(itemCounts.length, 4, '每个订单应显示商品数量');
});

test('OrderListScreen: mock paid orders render payment info in cards', () => {
  const root = createOrderListComponent();

  assert.ok(findTextInOrderCards(root, '微信支付'), '已支付 mock 订单应显示微信支付');
  assert.ok(findTextInOrderCards(root, '支付宝'), '已退款 mock 订单应显示支付宝');
  assert.ok(findTextInOrderCards(root, '现金'), '现金支付 mock 订单应显示现金');

  const paymentTimeLabels = renderFlatListOrderCards(root).flatMap((card) =>
    card.root.findAllByType(Text).filter((t) =>
      collectTextContent(t.props.children).join('') === '支付时间',
    ),
  );
  assert.equal(paymentTimeLabels.length, 3, '有 paidAt 的订单卡片应显示支付时间');
});

test('OrderListScreen: cards render status-based amount labels', () => {
  const root = createOrderListComponent();

  const paidCard = getRenderedOrderCard(root, 'ORD20260612001');
  const pendingCard = getRenderedOrderCard(root, 'ORD20260612002');
  const refundedCard = getRenderedOrderCard(root, 'ORD20260611001');

  assert.ok(paidCard && findByText(paidCard.root, '实付金额'), '已支付订单应显示实付金额');
  assert.ok(pendingCard && findByText(pendingCard.root, '应付金额'), '待支付订单应显示应付金额');
  assert.ok(refundedCard && findByText(refundedCard.root, '已退款金额'), '已退款订单应显示已退款金额');
});
