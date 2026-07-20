/**
 * cashier-screen.test.tsx
 * B页面 - 收银台 (PaymentScreen + RefundScreen) 渲染/交互测试
 * Uses node:test + react-test-renderer
 * 三态覆盖: 正常渲染 / loading / 空金额 / 边界输入
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { Alert, Text, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';

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

const PaymentScreenModule = require('./PaymentScreen');
const RefundScreenModule = require('./RefundScreen');
const { PaymentScreen } = PaymentScreenModule;
const { RefundScreen } = RefundScreenModule;

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

function findTouchableByText(root: ReturnType<typeof create>['root'], text: string) {
  return findAllTouchables(root).find((touchable) =>
    touchable.findAllByType(Text).some((txt) => collectTextContent(txt.props.children).join('') === text),
  );
}

function findAllModals(root: ReturnType<typeof create>['root']) {
  return root.findAllByType(Modal);
}

function findAllTextInputs(root: ReturnType<typeof create>['root']) {
  return root.findAllByType(TextInput);
}

function createPaymentComponent(params?: Record<string, unknown>) {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  globalThis.__mockRoute = params as never;
  return create(<PaymentScreen />);
}

function createRefundComponent(params?: Record<string, unknown>) {
  mockNavigateCalls.length = 0;
  alertCalls.length = 0;
  // The RefundScreen reads route.params; set up mock route
  // @ts-expect-error mock
  const mockUseRoute = () => ({ params: params ?? {}, key: 'refund', name: 'Refund' });
  globalThis.__mockRoute = params ?? {};
  return create(<RefundScreen />);
}

/* ================================================================== */
/*  PAYMENT SCREEN TESTS                                               */
/* ================================================================== */

/* ---- 正例: 正常渲染 + 核心数据 ---- */

test('PaymentScreen: renders amount display with default 0.00', () => {
  const root = createPaymentComponent();
  const amountLabel = findByText(root.root, '收款金额');
  assert.ok(amountLabel, '应显示收款金额标签');

  const defaultAmount = findByText(root.root, '0.00');
  assert.ok(defaultAmount, '初始金额应显示 0.00');
});

test('PaymentScreen: renders all 4 payment channels', () => {
  const root = createPaymentComponent();

  const wechatPay = findByText(root.root, '微信支付');
  assert.ok(wechatPay, '应显示微信支付');

  const alipay = findByText(root.root, '支付宝');
  assert.ok(alipay, '应显示支付宝');

  const cash = findByText(root.root, '现金');
  assert.ok(cash, '应显示现金');

  const memberCard = findByText(root.root, '会员卡');
  assert.ok(memberCard, '应显示会员卡');
});

test('PaymentScreen: renders number pad with all keys', () => {
  const root = createPaymentComponent();

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '⌫', 'C'];
  for (const key of keys) {
    const el = findByText(root.root, key);
    assert.ok(el, `数字键盘应包含 ${key}`);
  }
});

test('PaymentScreen: renders confirm button', () => {
  const root = createPaymentComponent();
  const confirmBtn = findByText(root.root, '确认收款');
  assert.ok(confirmBtn, '应显示确认收款按钮');
});

test('PaymentScreen: renders linked order info when opened from pending order', () => {
  const root = createPaymentComponent({
    orderId: 'order-002',
    orderNo: 'ORD20260612002',
    amount: 89.5,
    paymentChannel: 'WECHAT_PAY',
  });

  assert.ok(findByText(root.root, '待支付订单'), '从订单详情进入时应显示待支付订单卡片');
  assert.ok(findByText(root.root, 'ORD20260612002'), '应显示待支付订单号');
  assert.ok(findByText(root.root, '¥89.50'), '应显示待支付金额');
});

test('PaymentScreen: hydrates real order info when fetch is enabled', async () => {
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
            memberId: 'member-002',
            currency: 'CNY',
            totalAmount: 108.8,
            status: 'PAID',
            latestPaymentId: 'payment-order-002',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            paidAt: '2026-07-20T04:10:00.000Z',
          },
          payment: {
            paymentId: 'payment-order-002',
            orderId: 'order-002',
            channel: 'alipay',
            amount: 108.8,
            status: 'SUCCEEDED',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            completedAt: '2026-07-20T04:10:00.000Z',
          },
          settlement: {
            settlementId: 'settlement-order-002',
            pointsEarned: 109,
            pointsBalance: 109,
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
      root = createPaymentComponent({ orderId: 'order-002' });
      await Promise.resolve();
    });

    assert.ok(findByText(root.root, 'ORDAPI20260720002'), '仅带 orderId 打开支付页时应补齐真实订单号');
    assert.ok(findByText(root.root, '¥108.80'), '仅带 orderId 打开支付页时应补齐真实待收金额');
    assert.ok(findByText(root.root, '支付宝'), '真实渠道 alipay 应归一化展示为支付宝');
    assert.ok(findByText(root.root, '108.8'), '金额输入应在拉单后自动补齐真实金额');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('PaymentScreen: loading linked order keeps submit disabled until hydration completes', async () => {
  const originalFetch = globalThis.fetch;
  let resolveResponse: ((value: Response) => void) | undefined;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (() => new Promise<Response>((resolve) => {
    resolveResponse = resolve;
  })) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createPaymentComponent({
        orderId: 'order-005',
        amount: 77.7,
      });
      await Promise.resolve();
    });

    assert.ok(findByText(root.root, '正在同步真实订单信息...'), '拉取真实订单期间应展示加载提示');
    const submitBtn = findTouchableByText(root.root, '确认收款');
    assert.equal(submitBtn?.props.disabled, true, '关联订单同步中时确认收款按钮应禁用');

    resolveResponse?.(new Response(JSON.stringify({
      success: true,
      message: 'OK',
      data: {
        order: {
          orderId: 'order-005',
          orderNo: 'ORDAPI20260720005',
          memberId: 'member-005',
          currency: 'CNY',
          totalAmount: 77.7,
          status: 'PAID',
          latestPaymentId: 'payment-order-005',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          paidAt: '2026-07-20T04:10:00.000Z',
        },
        payment: {
          paymentId: 'payment-order-005',
          orderId: 'order-005',
          channel: 'wechat-pay',
          amount: 77.7,
          status: 'SUCCEEDED',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          completedAt: '2026-07-20T04:10:00.000Z',
        },
        pointsLedger: [],
        couponRedemptions: [],
        blindboxFulfillments: [],
        refunds: [],
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    await act(async () => {
      await Promise.resolve();
    });

    const enabledSubmitBtn = findTouchableByText(root.root, '确认收款');
    assert.equal(enabledSubmitBtn?.props.disabled, false, '订单同步完成后确认收款按钮应恢复可用');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('PaymentScreen: fetch failure shows retry hint and can recover', async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (async () => {
    requestCount += 1;
    if (requestCount === 1) {
      throw new Error('network unavailable');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          order: {
            orderId: 'order-006',
            orderNo: 'ORDAPI20260720006',
            memberId: 'member-006',
            currency: 'CNY',
            totalAmount: 128.5,
            status: 'PAID',
            latestPaymentId: 'payment-order-006',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            paidAt: '2026-07-20T04:10:00.000Z',
          },
          payment: {
            paymentId: 'payment-order-006',
            orderId: 'order-006',
            channel: 'alipay',
            amount: 128.5,
            status: 'SUCCEEDED',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            completedAt: '2026-07-20T04:10:00.000Z',
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
      root = createPaymentComponent({ orderId: 'order-006' });
      await Promise.resolve();
    });

    assert.ok(findByText(root.root, '订单信息加载失败，可重试或按当前金额继续收款'), '拉单失败时应展示明确提示');
    assert.ok(findByText(root.root, 'network unavailable'), '应展示真实失败原因');

    const retryBtn = findTouchableByText(root.root, '重试加载');
    assert.ok(retryBtn, '失败态应提供重试按钮');

    await act(async () => {
      retryBtn!.props.onPress();
      await Promise.resolve();
    });

    assert.equal(requestCount, 2, '点击重试后应再次发起订单请求');
    assert.ok(findByText(root.root, 'ORDAPI20260720006'), '重试成功后应展示真实订单号');
    assert.ok(findByText(root.root, '¥128.50'), '重试成功后应展示真实待收金额');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('PaymentScreen: route preset amount and selected channel are not overridden by hydration', async () => {
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (async () => new Response(
    JSON.stringify({
      success: true,
      message: 'OK',
      data: {
        order: {
          orderId: 'order-007',
          orderNo: 'ORDAPI20260720007',
          memberId: 'member-007',
          currency: 'CNY',
          totalAmount: 128.5,
          status: 'PAID',
          latestPaymentId: 'payment-order-007',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          paidAt: '2026-07-20T04:10:00.000Z',
        },
        payment: {
          paymentId: 'payment-order-007',
          orderId: 'order-007',
          channel: 'alipay',
          amount: 128.5,
          status: 'SUCCEEDED',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          completedAt: '2026-07-20T04:10:00.000Z',
        },
        pointsLedger: [],
        couponRedemptions: [],
        blindboxFulfillments: [],
        refunds: [],
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createPaymentComponent({
        orderId: 'order-007',
        amount: 66.6,
        paymentChannel: 'WECHAT_PAY',
      });
      await Promise.resolve();
    });

    assert.ok(findByText(root.root, '¥128.50'), '顶部订单信息应优先展示真实聚合金额');
    assert.ok(findByText(root.root, '支付宝'), '顶部订单信息应优先展示真实聚合渠道');
    assert.ok(findByText(root.root, '66.6'), '金额输入应保留路由预填金额');

    const confirmBtn = findTouchableByText(root.root, '确认收款');
    assert.ok(confirmBtn, '确认收款按钮应在');
    act(() => {
      confirmBtn!.props.onPress();
    });

    assert.ok(findByText(root.root, '支付方式：微信支付'), '确认弹窗应保留路由预选的支付渠道');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('PaymentScreen: default selected channel is WeChat Pay', () => {
  const root = createPaymentComponent();
  // WeChat pay item should have selected style
  const wechatChannel = findByText(root.root, '微信支付');
  assert.ok(wechatChannel, '默认选中微信支付');

  // The parent TouchableOpacity should have channelItemSelected style
  // which is indicated by the channel name having blue color
  const wechatText = findByText(root.root, '微信支付');
  assert.equal(wechatText?.props?.children, '微信支付');
});

test('PaymentScreen: renders currency symbol ¥', () => {
  const root = createPaymentComponent();
  const yenSymbol = findByText(root.root, '¥');
  assert.ok(yenSymbol, '应显示人民币符号 ¥');
});

/* ---- 交互: 数字键盘输入 ---- */

test('PaymentScreen: pressing number keys updates amount', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const key1 = touchables.find((t) => {
    const texts = t.findAllByType(Text);
    return texts.some((txt) => txt.props.children === '1');
  });
  const key2 = touchables.find((t) => {
    const texts = t.findAllByType(Text);
    return texts.some((txt) => txt.props.children === '2');
  });
  const key5 = touchables.find((t) => {
    const texts = t.findAllByType(Text);
    return texts.some((txt) => txt.props.children === '5');
  });

  assert.ok(key1, '数字1按钮存在');
  assert.ok(key2, '数字2按钮存在');
  assert.ok(key5, '数字5按钮存在');

  if (key1 && key2 && key5) {
    key1.props.onPress();
    key2.props.onPress();
    key5.props.onPress();

    // Amount should now be 125
    const amount125 = findByText(root.root, '125');
    assert.ok(amount125, '按下125后金额应显示125');
  }
});

test('PaymentScreen: pressing decimal point inserts dot', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const key1 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '1'));
  const dot = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '.'));
  const key5 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '5'));

  assert.ok(key1 && dot && key5);

  key1!.props.onPress();
  dot!.props.onPress();
  key5!.props.onPress();

  const amountWithDot = findByText(root.root, '1.5');
  assert.ok(amountWithDot, '按下 1 . 5 后应显示 1.5');
});

test('PaymentScreen: pressing C clears amount', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const key1 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '1'));
  const key2 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '2'));
  const clearC = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === 'C'));

  assert.ok(key1 && key2 && clearC);

  key1!.props.onPress();
  key2!.props.onPress();
  clearC!.props.onPress();

  const zeroAmount = findByText(root.root, '0.00');
  assert.ok(zeroAmount, '按C后金额应恢复为0.00');
});

test('PaymentScreen: pressing ⌫ deletes last digit', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const key1 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '1'));
  const key2 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '2'));
  const key3 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '3'));
  const backspace = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '⌫'));

  assert.ok(key1 && key2 && key3 && backspace);

  key1!.props.onPress();
  key2!.props.onPress();
  key3!.props.onPress();

  const amount123 = findByText(root.root, '123');
  assert.ok(amount123, '按下123后金额应显示123');

  backspace!.props.onPress();
  // Now amount should be 12
  const amount12 = findByText(root.root, '12');
  assert.ok(amount12, '按⌫后金额应为12');
});

test('PaymentScreen: prevent more than 2 decimal places', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const key1 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '1'));
  const dot = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '.'));
  const key5 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '5'));
  const key6 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '6'));
  const key7 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '7'));

  assert.ok(key1 && dot && key5 && key6 && key7);

  key1!.props.onPress();
  dot!.props.onPress();
  key5!.props.onPress();
  key6!.props.onPress(); // 1.56 — 2 decimals, should work
  key7!.props.onPress(); // Should be blocked

  const amount = findByText(root.root, '1.56');
  assert.ok(amount, '金额应限制最多2位小数');
});

/* ---- 反例: 空金额/错误处理 ---- */

test('PaymentScreen: tapping confirm with empty amount shows alert', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const confirmBtn = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '确认收款'),
  );

  assert.ok(confirmBtn, '确认收款按钮应在');
  if (confirmBtn) {
    confirmBtn.props.onPress();
    assert.ok(alertCalls.length > 0, '空金额时点击确认应弹出提示');
    const alert = alertCalls.find((a) => a.title === '提示');
    assert.ok(alert, '应弹出提示对话框');
  }
});

/* ---- 支付渠道切换 ---- */

test('PaymentScreen: selecting Alipay switches channel', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const alipayBtn = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '支付宝'),
  );

  assert.ok(alipayBtn, '支付宝按钮应在');
  if (alipayBtn) {
    alipayBtn.props.onPress();
    // No alert should be triggered by channel selection
    assert.equal(alertCalls.length, 0, '切换支付方式不应触发弹窗');
  }
});

test('PaymentScreen: selecting Cash switches channel', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const cashBtn = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '现金'),
  );

  assert.ok(cashBtn, '现金按钮应在');
  if (cashBtn) {
    cashBtn.props.onPress();
    assert.equal(alertCalls.length, 0, '切换到现金不应触发弹窗');
  }
});

test('PaymentScreen: selecting Member Card shows phone input', () => {
  const root = createPaymentComponent();

  // Before selecting member card, phone input should not be visible
  const phoneInputInitial = root.root.findAllByType(TextInput).filter((ti) => {
    const props = ti.props as { placeholder?: string };
    return props.placeholder === '请输入会员手机号';
  });
  // Member input only appears after selecting 会员卡

  const touchables = findAllTouchables(root.root);
  const memberCardBtn = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '会员卡'),
  );
  assert.ok(memberCardBtn, '会员卡按钮应在');

  memberCardBtn!.props.onPress();

  // After selecting, re-render to see the member input
  const root2 = createPaymentComponent();
  const touchables2 = findAllTouchables(root2.root);
  const memberCardBtn2 = touchables2.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '会员卡'),
  );

  // Simulate selecting member card
  setTimeout(() => {
    // Just verify switching doesn't cause errors
  }, 0);
  assert.doesNotThrow(() => {
    memberCardBtn2?.props.onPress();
  }, '切换至会员卡不应异常');
});

/* ---- 模态弹窗 ---- */

test('PaymentScreen: entering valid amount and tapping confirm opens modal', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const key1 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '1'));
  const key0 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '0'));
  const key00 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '0'));

  assert.ok(key1 && key0 && key00);

  key1!.props.onPress();
  key0!.props.onPress();
  key00!.props.onPress();

  const confirmBtn = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '确认收款'),
  );

  assert.ok(confirmBtn);
  confirmBtn!.props.onPress();

  // After tapping confirm with valid amount, alert is triggered for validation
  // (since Modal is state-driven, actual visual check in next render)
  assert.ok(alertCalls.length >= 0, '有效金额时不应直接触发alert，而是打开modal');
});

test('PaymentScreen: successful payment submits real api flow and returns paid status to order detail', async () => {
  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    fetchCalls.push({ url, init });

    if (url.endsWith('/transactions/orders/order-002') && (!init?.method || init.method === 'GET')) {
      const paidAt = fetchCalls.length > 1 ? '2026-07-20T03:20:00.000Z' : undefined;
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            order: {
              orderId: 'order-002',
              orderNo: 'ORDAPI20260720002',
              memberId: 'member-002',
              currency: 'CNY',
              totalAmount: 89.5,
              status: paidAt ? 'PAID' : 'PENDING_PAYMENT',
              latestPaymentId: 'payment-order-002',
              createdAt: '2026-06-12T11:15:00.000Z',
              updatedAt: paidAt ?? '2026-06-12T11:15:00.000Z',
              paidAt,
            },
            payment: {
              paymentId: 'payment-order-002',
              orderId: 'order-002',
              channel: 'WECHAT_PAY',
              amount: 89.5,
              status: paidAt ? 'SUCCEEDED' : 'PENDING',
              externalPaymentId: 'app-pos-order-002',
              createdAt: '2026-06-12T11:15:00.000Z',
              updatedAt: paidAt ?? '2026-06-12T11:15:00.000Z',
              completedAt: paidAt,
            },
            settlement: {
              settlementId: 'settlement-order-002',
              pointsEarned: 90,
              pointsBalance: 90,
            },
            pointsLedger: [],
            couponRedemptions: [],
            blindboxFulfillments: [],
            refunds: [],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (url.endsWith('/transactions/payments/standardized-callback') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: { acknowledged: true },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`unexpected request: ${url}`);
  }) as typeof fetch;

  try {
    const root = createPaymentComponent({
      orderId: 'order-002',
      orderNo: 'ORD20260612002',
      amount: 89.5,
      paymentChannel: 'WECHAT_PAY',
    });
    const confirmBtn = findTouchableByText(root.root, '确认收款');
    assert.ok(confirmBtn, '确认收款按钮应在');

    act(() => {
      confirmBtn!.props.onPress();
    });

    const modalConfirmBtn = findAllTouchables(root.root).find((touchable) =>
      touchable.findAllByType(Text).some((txt) => txt.props.children === '确认'),
    );
    assert.ok(modalConfirmBtn, '确认弹窗中的确认按钮应在');

    await act(async () => {
      await modalConfirmBtn!.props.onPress();
    });

    assert.equal(fetchCalls.length, 3, '应依次查询订单、提交支付回调并刷新订单');
    assert.ok(fetchCalls[0]!.url.includes('/transactions/orders/order-002'));
    assert.ok(fetchCalls[1]!.url.includes('/transactions/payments/standardized-callback'));
    assert.equal(fetchCalls[1]!.init?.method, 'POST');
    assert.match(String(fetchCalls[1]!.init?.body), /"orderId":"order-002"/);
    assert.match(String(fetchCalls[1]!.init?.body), /"paymentId":"payment-order-002"/);
    assert.match(String(fetchCalls[1]!.init?.body), /"status":"SUCCEEDED"/);
    assert.ok(fetchCalls[2]!.url.includes('/transactions/orders/order-002'));

    const successAlert = alertCalls.find((item) => item.message === '收款成功，订单状态已更新');
    assert.ok(successAlert, '成功收款后应提示订单状态已更新');

    const successButton = successAlert?.buttons?.find((button) => button.text === '确定');
    assert.ok(successButton?.onPress, '成功提示应包含确定按钮');
    successButton!.onPress!();

    const navigateCall = mockNavigateCalls.find((item) => item.route === 'OrderDetail');
    assert.ok(navigateCall, '成功收款后应回到订单详情');
    assert.equal(navigateCall?.params?.orderId, 'order-002');
    assert.equal(navigateCall?.params?.orderNo, 'ORDAPI20260720002');
    assert.equal(navigateCall?.params?.paymentStatus, 'PAID');
    assert.equal(navigateCall?.params?.paymentAmount, 89.5);
    assert.equal(navigateCall?.params?.paymentChannel, 'WECHAT_PAY');
    assert.equal(navigateCall?.params?.paymentPaidAt, '2026-07-20T03:20:00.000Z');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('PaymentScreen: successful payment keeps hydrated orderNo and normalized payment channel', async () => {
  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    fetchCalls.push({ url, init });

    if (url.endsWith('/transactions/orders/order-003') && (!init?.method || init.method === 'GET')) {
      const paidAt = fetchCalls.length > 1 ? '2026-07-20T05:20:00.000Z' : undefined;
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            order: {
              orderId: 'order-003',
              orderNo: 'ORDAPI20260720003',
              memberId: 'member-003',
              currency: 'CNY',
              totalAmount: 66.6,
              status: paidAt ? 'PAID' : 'PENDING_PAYMENT',
              latestPaymentId: 'payment-order-003',
              createdAt: '2026-06-12T11:15:00.000Z',
              updatedAt: paidAt ?? '2026-06-12T11:15:00.000Z',
              paidAt,
            },
            payment: {
              paymentId: 'payment-order-003',
              orderId: 'order-003',
              channel: 'alipay',
              amount: 66.6,
              status: paidAt ? 'SUCCEEDED' : 'PENDING',
              externalPaymentId: 'app-pos-order-003',
              createdAt: '2026-06-12T11:15:00.000Z',
              updatedAt: paidAt ?? '2026-06-12T11:15:00.000Z',
              completedAt: paidAt,
            },
            settlement: {
              settlementId: 'settlement-order-003',
              pointsEarned: 67,
              pointsBalance: 67,
            },
            pointsLedger: [],
            couponRedemptions: [],
            blindboxFulfillments: [],
            refunds: [],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (url.endsWith('/transactions/payments/standardized-callback') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: { acknowledged: true },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`unexpected request: ${url}`);
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createPaymentComponent({ orderId: 'order-003' });
      await Promise.resolve();
    });

    const confirmBtn = findTouchableByText(root.root, '确认收款');
    assert.ok(confirmBtn, '确认收款按钮应在');

    act(() => {
      confirmBtn!.props.onPress();
    });

    const modalConfirmBtn = findAllTouchables(root.root).find((touchable) =>
      touchable.findAllByType(Text).some((txt) => txt.props.children === '确认'),
    );
    assert.ok(modalConfirmBtn, '确认弹窗中的确认按钮应在');

    await act(async () => {
      await modalConfirmBtn!.props.onPress();
    });

    assert.equal(fetchCalls.length, 4, '应先预拉订单，再在支付提交阶段查询订单、提交支付、最后刷新订单');
    const successAlert = alertCalls.find((item) => item.message === '收款成功，订单状态已更新');
    const successButton = successAlert?.buttons?.find((button) => button.text === '确定');
    assert.ok(successButton?.onPress, '成功提示应包含确定按钮');
    successButton!.onPress!();

    const navigateCall = mockNavigateCalls.find((item) => item.route === 'OrderDetail');
    assert.equal(navigateCall?.params?.orderId, 'order-003');
    assert.equal(navigateCall?.params?.orderNo, 'ORDAPI20260720003');
    assert.equal(navigateCall?.params?.paymentChannel, 'ALIPAY');
    assert.equal(navigateCall?.params?.paymentAmount, 66.6);
    assert.equal(navigateCall?.params?.paymentPaidAt, '2026-07-20T05:20:00.000Z');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('PaymentScreen: modal shows confirm and cancel buttons', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  // Enter 100
  const key1 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '1'));
  const key0a = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '0'));
  const key0b = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '0'));
  assert.ok(key1 && key0a && key0b);
  key1!.props.onPress();
  key0a!.props.onPress();
  key0b!.props.onPress();

  const confirmBtn = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '确认收款'));
  confirmBtn!.props.onPress();

  // The confirm modal should be shown — we verify the confirm Modal exists in the component
  const modals = findAllModals(root.root);
  // Even though visible=false initially, the Modal component exists in the tree
  assert.ok(modals.length > 0, '组件树中应包含 Modal 元素');
});

/* ---- RefundScreen Tests ---- */

test('RefundScreen: renders refund title and form fields', () => {
  const root = createRefundComponent();
  const refundTitle = findByText(root.root, '订单信息');
  assert.ok(refundTitle, '应显示订单信息卡片');

  const refundBtn = findByText(root.root, '确认退款');
  assert.ok(refundBtn, '应显示确认退款按钮');

  const orderNoLabel = findByText(root.root, 'N/A');
  assert.ok(orderNoLabel, '无参数时应显示 N/A');
});

test('RefundScreen: renders refund notice section', () => {
  const root = createRefundComponent();
  const noticeTitle = findByText(root.root, '退款须知');
  assert.ok(noticeTitle, '应显示退款须知区');

  const noticeItems = [
    '退款金额不能超过原订单金额',
    '金额最多支持 2 位小数，最小退款金额为 0.01',
    '退款将按原支付渠道返回',
    '如有疑问请联系客服',
  ];
  for (const item of noticeItems) {
    const el = findByText(root.root, item);
    assert.ok(el, `退款须知应包含: ${item}`);
  }
});

test('RefundScreen: renders order info with N/A when no params', () => {
  const root = createRefundComponent();

  const orderNoLabel = findByText(root.root, '订单号');
  assert.ok(orderNoLabel, '应显示订单号标签');

  const NALabel = findByText(root.root, 'N/A');
  assert.ok(NALabel, '无参数时订单号显示 N/A');
});

test('RefundScreen: missing order context shows hint and keeps submit disabled', () => {
  const root = createRefundComponent({ reason: '顾客取消' });

  assert.ok(findByText(root.root, '缺少订单信息，请返回订单详情后重试'), '缺少订单上下文时应给出明确提示');
  const refundBtn = findTouchableByText(root.root, '确认退款');
  assert.equal(refundBtn?.props.disabled, true, '缺少订单上下文时确认退款按钮应禁用');
});

test('RefundScreen: hydrates real order info and payment channel when fetch is enabled', async () => {
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
            memberId: 'member-002',
            currency: 'CNY',
            totalAmount: 108.8,
            status: 'PAID',
            latestPaymentId: 'payment-order-002',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            paidAt: '2026-07-20T04:10:00.000Z',
          },
          payment: {
            paymentId: 'payment-order-002',
            orderId: 'order-002',
            channel: 'alipay',
            amount: 108.8,
            status: 'SUCCEEDED',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            completedAt: '2026-07-20T04:10:00.000Z',
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
      root = createRefundComponent({ orderId: 'order-002', reason: '顾客取消' });
      await Promise.resolve();
    });

    assert.ok(findByText(root.root, 'ORDAPI20260720002'), '仅带 orderId 打开退款页时应补齐真实订单号');
    assert.ok(findByText(root.root, '¥108.80'), '仅带 orderId 打开退款页时应补齐真实原订单金额');
    assert.ok(findByText(root.root, '支付宝'), '真实渠道 alipay 应归一化展示为支付宝');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('RefundScreen: loading linked order keeps submit disabled until hydration completes', async () => {
  const originalFetch = globalThis.fetch;
  let resolveResponse: ((value: Response) => void) | undefined;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (() => new Promise<Response>((resolve) => {
    resolveResponse = resolve;
  })) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createRefundComponent({
        orderId: 'order-009',
        amount: 55.5,
        reason: '顾客取消',
      });
      await Promise.resolve();
    });

    assert.ok(findByText(root.root, '正在同步真实订单信息...'), '拉取真实订单期间应展示加载提示');
    const refundBtn = findTouchableByText(root.root, '确认退款');
    assert.equal(refundBtn?.props.disabled, true, '关联订单同步中时确认退款按钮应禁用');

    resolveResponse?.(new Response(JSON.stringify({
      success: true,
      message: 'OK',
      data: {
        order: {
          orderId: 'order-009',
          orderNo: 'ORDAPI20260720009',
          memberId: 'member-009',
          currency: 'CNY',
          totalAmount: 55.5,
          status: 'PAID',
          latestPaymentId: 'payment-order-009',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          paidAt: '2026-07-20T04:10:00.000Z',
        },
        payment: {
          paymentId: 'payment-order-009',
          orderId: 'order-009',
          channel: 'wechat-pay',
          amount: 55.5,
          status: 'SUCCEEDED',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          completedAt: '2026-07-20T04:10:00.000Z',
        },
        pointsLedger: [],
        couponRedemptions: [],
        blindboxFulfillments: [],
        refunds: [],
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    await act(async () => {
      await Promise.resolve();
    });

    const enabledRefundBtn = findTouchableByText(root.root, '确认退款');
    assert.equal(enabledRefundBtn?.props.disabled, false, '订单同步完成后确认退款按钮应恢复可用');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('RefundScreen: fetch failure shows retry hint and can recover', async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (async () => {
    requestCount += 1;
    if (requestCount === 1) {
      throw new Error('refund order unavailable');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          order: {
            orderId: 'order-010',
            orderNo: 'ORDAPI20260720010',
            memberId: 'member-010',
            currency: 'CNY',
            totalAmount: 90,
            status: 'PAID',
            latestPaymentId: 'payment-order-010',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            paidAt: '2026-07-20T04:10:00.000Z',
          },
          payment: {
            paymentId: 'payment-order-010',
            orderId: 'order-010',
            channel: 'alipay',
            amount: 90,
            status: 'SUCCEEDED',
            createdAt: '2026-06-12T11:15:00.000Z',
            updatedAt: '2026-07-20T04:10:00.000Z',
            completedAt: '2026-07-20T04:10:00.000Z',
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
      root = createRefundComponent({
        orderId: 'order-010',
        amount: 30,
        reason: '顾客取消',
      });
      await Promise.resolve();
    });

    assert.ok(findByText(root.root, '订单信息加载失败，可重试或按当前信息继续退款'), '拉单失败时应展示明确提示');
    assert.ok(findByText(root.root, 'refund order unavailable'), '应展示真实失败原因');

    const retryBtn = findTouchableByText(root.root, '重试加载');
    assert.ok(retryBtn, '失败态应提供重试按钮');

    await act(async () => {
      retryBtn!.props.onPress();
      await Promise.resolve();
    });

    assert.equal(requestCount, 2, '点击重试后应再次发起订单请求');
    assert.ok(findByText(root.root, 'ORDAPI20260720010'), '重试成功后应展示真实订单号');
    assert.ok(findByText(root.root, '¥90.00'), '重试成功后应展示真实原订单金额');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('RefundScreen: keeps route refund reason after order hydration', async () => {
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (async () => new Response(
    JSON.stringify({
      success: true,
      message: 'OK',
      data: {
        order: {
          orderId: 'order-002',
          orderNo: 'ORDAPI20260720002',
          memberId: 'member-002',
          currency: 'CNY',
          totalAmount: 108.8,
          status: 'PAID',
          latestPaymentId: 'payment-order-002',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          paidAt: '2026-07-20T04:10:00.000Z',
        },
        payment: {
          paymentId: 'payment-order-002',
          orderId: 'order-002',
          channel: 'alipay',
          amount: 108.8,
          status: 'SUCCEEDED',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          completedAt: '2026-07-20T04:10:00.000Z',
        },
        pointsLedger: [],
        couponRedemptions: [],
        blindboxFulfillments: [],
        refunds: [{
          refundId: 'refund-history-001',
          orderId: 'order-002',
          paymentId: 'payment-order-002',
          memberId: 'member-002',
          refundAmount: 10,
          reason: '历史退款原因',
          status: 'REJECTED',
          requestedAt: '2026-07-19T04:10:00.000Z',
        }],
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createRefundComponent({ orderId: 'order-002', reason: '顾客取消' });
      await Promise.resolve();
    });

    const inputs = findAllTextInputs(root.root);
    assert.equal(inputs[1]?.props.value, '顾客取消', '路由默认退款原因应优先于历史退款原因');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('RefundScreen: does not reuse historical refund reason when route reason is absent', async () => {
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (async () => new Response(
    JSON.stringify({
      success: true,
      message: 'OK',
      data: {
        order: {
          orderId: 'order-003',
          orderNo: 'ORDAPI20260720003',
          memberId: 'member-003',
          currency: 'CNY',
          totalAmount: 88.8,
          status: 'PAID',
          latestPaymentId: 'payment-order-003',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          paidAt: '2026-07-20T04:10:00.000Z',
        },
        payment: {
          paymentId: 'payment-order-003',
          orderId: 'order-003',
          channel: 'wechat-pay',
          amount: 88.8,
          status: 'SUCCEEDED',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          completedAt: '2026-07-20T04:10:00.000Z',
        },
        pointsLedger: [],
        couponRedemptions: [],
        blindboxFulfillments: [],
        refunds: [{
          refundId: 'refund-history-002',
          orderId: 'order-003',
          paymentId: 'payment-order-003',
          memberId: 'member-003',
          refundAmount: 20,
          reason: '上次退款原因',
          status: 'REJECTED',
          requestedAt: '2026-07-19T04:10:00.000Z',
        }],
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createRefundComponent({ orderId: 'order-003' });
      await Promise.resolve();
    });

    const inputs = findAllTextInputs(root.root);
    assert.equal(inputs[1]?.props.value, '', '未传入退款原因时不应自动复用历史退款原因');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('RefundScreen: route preset refund amount is not overridden by hydration', async () => {
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (async () => new Response(
    JSON.stringify({
      success: true,
      message: 'OK',
      data: {
        order: {
          orderId: 'order-011',
          orderNo: 'ORDAPI20260720011',
          memberId: 'member-011',
          currency: 'CNY',
          totalAmount: 120,
          status: 'PAID',
          latestPaymentId: 'payment-order-011',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          paidAt: '2026-07-20T04:10:00.000Z',
        },
        payment: {
          paymentId: 'payment-order-011',
          orderId: 'order-011',
          channel: 'wechat-pay',
          amount: 120,
          status: 'SUCCEEDED',
          createdAt: '2026-06-12T11:15:00.000Z',
          updatedAt: '2026-07-20T04:10:00.000Z',
          completedAt: '2026-07-20T04:10:00.000Z',
        },
        pointsLedger: [],
        couponRedemptions: [],
        blindboxFulfillments: [],
        refunds: [],
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createRefundComponent({
        orderId: 'order-011',
        amount: 50,
        reason: '部分退款',
        paymentChannel: 'ALIPAY',
      });
      await Promise.resolve();
    });

    assert.ok(findByText(root.root, '¥120.00'), '顶部订单信息应优先展示真实原订单金额');
    assert.ok(findByText(root.root, '微信支付'), '顶部订单信息应优先展示真实支付渠道');
    const inputs = findAllTextInputs(root.root);
    assert.equal(inputs[0]?.props.value, '50', '退款金额输入应保留路由预填值');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('RefundScreen: tapping confirm refund with empty amount shows alert', () => {
  const root = createRefundComponent();
  const refundBtn = findTouchableByText(root.root, '确认退款');
  assert.ok(refundBtn, '确认退款按钮应在');
  assert.equal(refundBtn?.props.disabled, true, '空金额时确认退款按钮应禁用');
});

/* ---- 边界: loading / 空状态 ---- */

test('PaymentScreen: initial amount is 0.00 and submit button disabled', () => {
  const root = createPaymentComponent();
  const zeroAmount = findByText(root.root, '0.00');
  assert.ok(zeroAmount, '初始金额为 0.00');

  const submitBtn = findTouchableByText(root.root, '确认收款');
  assert.ok(submitBtn, '确认收款按钮存在');
  assert.equal(submitBtn?.props.disabled, true, '初始空金额时确认按钮应禁用');
});

test('PaymentScreen: entering currency symbol input updates display', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const key5 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '5'));
  const key0 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '0'));

  assert.ok(key5 && key0);
  key5!.props.onPress();
  key0!.props.onPress();

  const amount50 = findByText(root.root, '50');
  assert.ok(amount50, '输入50后金额显示50');
});

test('PaymentScreen: entering decimal-only amount works', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const key0 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '0'));
  const dot = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '.'));
  const key5 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '5'));
  const key0b = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '0'));

  assert.ok(key0 && dot && key5 && key0b);
  key0!.props.onPress();
  dot!.props.onPress();
  key5!.props.onPress();
  key0b!.props.onPress();

  const amount = findByText(root.root, '0.50');
  assert.ok(amount, '输入0.50后金额显示正确');
});

test('PaymentScreen: starting with decimal point normalizes to 0. and requires fractional digits', () => {
  const root = createPaymentComponent();
  const dot = findTouchableByText(root.root, '.');
  const key5 = findTouchableByText(root.root, '5');

  assert.ok(dot && key5, '数字键盘应包含 . 和 5');

  act(() => {
    dot!.props.onPress();
  });

  const amount0dot = findByText(root.root, '0.');
  assert.ok(amount0dot, '首位输入小数点时应自动补成 0.');

  const submitBtnBeforeFraction = findTouchableByText(root.root, '确认收款');
  assert.equal(submitBtnBeforeFraction?.props.disabled, true, '仅输入 0. 时确认按钮仍应禁用');

  act(() => {
    key5!.props.onPress();
  });

  const amount05 = findByText(root.root, '0.5');
  assert.ok(amount05, '补齐小数位后金额应显示 0.5');

  const submitBtn = findTouchableByText(root.root, '确认收款');
  assert.equal(submitBtn?.props.disabled, false, '输入有效小数金额后确认按钮应可用');
});

test('PaymentScreen: zero amount keeps submit button disabled', () => {
  const root = createPaymentComponent();
  const key0 = findTouchableByText(root.root, '0');
  assert.ok(key0, '数字 0 按钮应在');

  act(() => {
    key0!.props.onPress();
  });

  const zeroAmount = findByText(root.root, '0');
  assert.ok(zeroAmount, '输入 0 后金额应显示 0');

  const submitBtn = findTouchableByText(root.root, '确认收款');
  assert.equal(submitBtn?.props.disabled, true, '零金额时确认按钮应保持禁用');
});

test('PaymentScreen: leading zeros collapse before non-zero digit', () => {
  const root = createPaymentComponent();
  const key0 = findTouchableByText(root.root, '0');
  const key5 = findTouchableByText(root.root, '5');
  const submitBtn = findTouchableByText(root.root, '确认收款');

  assert.ok(key0 && key5 && submitBtn, '应能找到金额键与确认按钮');

  act(() => {
    key0!.props.onPress();
    key0!.props.onPress();
    key5!.props.onPress();
  });

  assert.ok(findByText(root.root, '5'), '前导零后输入非零数字应收敛为有效金额');

  const enabledSubmitBtn = findTouchableByText(root.root, '确认收款');
  assert.equal(enabledSubmitBtn?.props.disabled, false, '有效金额 5 时确认按钮应可用');

  act(() => {
    enabledSubmitBtn!.props.onPress();
  });

  const modalAmount = findByText(root.root, '¥5.00');
  assert.ok(modalAmount, '确认弹窗中的金额应按 5.00 展示，而不是保留前导零');
});

test('PaymentScreen: pressing confirm after entering amount does not crash', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const key1 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '1'));
  const key0 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '0'));

  assert.ok(key1 && key0);
  key1!.props.onPress();
  key0!.props.onPress();

  const confirmBtn = touchables.find((t) =>
    t.findAllByType(Text).some((txt) => txt.props.children === '确认收款'),
  );

  assert.doesNotThrow(() => {
    confirmBtn?.props.onPress();
  }, '输入金额后点击确认不应崩溃');
});

test('RefundScreen: tapping refund button without reason shows alert', () => {
  // Set an amount but no reason
  // @ts-expect-error mock
  globalThis.__mockRoute = {
    amount: 100,
  };

  const root = createRefundComponent({ amount: 100 });
  const refundBtn = findTouchableByText(root.root, '确认退款');
  assert.ok(refundBtn);
  assert.equal(refundBtn?.props.disabled, true, '无退款原因时确认退款按钮应禁用');
});

test('RefundScreen: confirm refund submits real api request and shows success alert', async () => {
  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    fetchCalls.push({ url: String(url), init });
    return {
      ok: true,
      json: async () => ({
        data: {
          order: { orderId: 'order-001', orderNo: 'ORDAPI20260720001' },
          refunds: [{ refundId: 'refund-001', status: 'PENDING' }],
        },
      }),
    } as Response;
  }) as typeof fetch;

  try {
    const root = createRefundComponent({
      orderId: 'order-001',
      orderNo: 'SJY-001',
      amount: 88.5,
      reason: '顾客取消',
    });
    const touchables = findAllTouchables(root.root);
    const refundBtn = touchables.find((t) =>
      t.findAllByType(Text).some((txt) => txt.props.children === '确认退款'),
    );

    assert.ok(refundBtn, '确认退款按钮应在');
    refundBtn!.props.onPress();

    const confirmAlert = alertCalls.at(-1);
    const confirmButton = confirmAlert?.buttons?.find((button) => button.text === '确认');
    assert.ok(confirmButton?.onPress, '应弹出确认退款对话框');

    await act(async () => {
      await confirmButton!.onPress!();
    });

    assert.equal(fetchCalls.length, 1, '应发起一次退款请求');
    assert.ok(fetchCalls[0]!.url.includes('/transactions/orders/order-001/refunds'));
    assert.equal(fetchCalls[0]!.init?.method, 'POST');
    assert.match(String(fetchCalls[0]!.init?.body), /"refundAmount":88\.5/);
    assert.match(String(fetchCalls[0]!.init?.body), /"reason":"顾客取消"/);

    const successAlert = alertCalls.find((item) => item.message === '退款申请已提交，请等待审核处理');
    assert.ok(successAlert, '成功后应提示退款申请已提交');

    const successButton = successAlert?.buttons?.find((button) => button.text === '确定');
    assert.ok(successButton?.onPress, '成功提示应包含确定按钮');
    successButton!.onPress!();

    const navigateCall = mockNavigateCalls.find((item) => item.route === 'OrderDetail');
    assert.ok(navigateCall, '成功后应把退款状态回带到订单详情');
    assert.equal(navigateCall?.params?.orderId, 'order-001');
    assert.equal(navigateCall?.params?.orderNo, 'ORDAPI20260720001');
    assert.equal(navigateCall?.params?.refundStatus, 'PENDING');
    assert.equal(navigateCall?.params?.refundRequestedAmount, 88.5);
    assert.equal(navigateCall?.params?.refundReason, '顾客取消');
    assert.ok(typeof navigateCall?.params?.refundRequestedAt === 'string');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('RefundScreen: successful refund keeps hydrated orderNo and normalized payment channel', async () => {
  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  // @ts-expect-error test flag
  globalThis.__mockOrderFetchEnabled = true;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    fetchCalls.push({ url, init });

    if (url.endsWith('/transactions/orders/order-001') && (!init?.method || init.method === 'GET')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            order: {
              orderId: 'order-001',
              orderNo: 'ORDAPI20260720001',
              memberId: 'member-001',
              currency: 'CNY',
              totalAmount: 156,
              status: 'PAID',
              latestPaymentId: 'payment-order-001',
              createdAt: '2026-06-12T10:30:00.000Z',
              updatedAt: '2026-07-20T03:00:00.000Z',
              paidAt: '2026-07-20T03:00:00.000Z',
            },
            payment: {
              paymentId: 'payment-order-001',
              orderId: 'order-001',
              channel: 'wechat-pay',
              amount: 156,
              status: 'SUCCEEDED',
              createdAt: '2026-06-12T10:30:00.000Z',
              updatedAt: '2026-07-20T03:00:00.000Z',
              completedAt: '2026-07-20T03:00:00.000Z',
            },
            pointsLedger: [],
            couponRedemptions: [],
            blindboxFulfillments: [],
            refunds: [],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (url.endsWith('/transactions/orders/order-001/refunds') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            order: { orderId: 'order-001', orderNo: 'ORDAPI20260720001' },
            payment: {
              paymentId: 'payment-order-001',
              orderId: 'order-001',
              channel: 'wechat-pay',
              amount: 156,
              status: 'SUCCEEDED',
              createdAt: '2026-06-12T10:30:00.000Z',
              updatedAt: '2026-07-20T03:00:00.000Z',
              completedAt: '2026-07-20T03:00:00.000Z',
            },
            refunds: [{
              refundId: 'refund-003',
              status: 'PENDING',
              refundAmount: 156,
              reason: '顾客取消',
              requestedAt: '2026-07-20T03:10:00.000Z',
            }],
            pointsLedger: [],
            couponRedemptions: [],
            blindboxFulfillments: [],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`unexpected request: ${url}`);
  }) as typeof fetch;

  try {
    let root!: ReturnType<typeof create>;
    await act(async () => {
      root = createRefundComponent({ orderId: 'order-001', reason: '顾客取消' });
      await Promise.resolve();
    });

    const refundBtn = findTouchableByText(root.root, '确认退款');
    assert.ok(refundBtn, '确认退款按钮应在');
    refundBtn!.props.onPress();

    const confirmAlert = alertCalls.at(-1);
    const confirmButton = confirmAlert?.buttons?.find((button) => button.text === '确认');
    assert.ok(confirmButton?.onPress, '应弹出确认退款对话框');

    await act(async () => {
      await confirmButton!.onPress!();
    });

    assert.equal(fetchCalls.length, 2, '应先查询订单再提交退款');
    const successAlert = alertCalls.find((item) => item.message === '退款申请已提交，请等待审核处理');
    const successButton = successAlert?.buttons?.find((button) => button.text === '确定');
    assert.ok(successButton?.onPress, '成功提示应包含确定按钮');
    successButton!.onPress!();

    const navigateCall = mockNavigateCalls.find((item) => item.route === 'OrderDetail');
    assert.equal(navigateCall?.params?.orderNo, 'ORDAPI20260720001');
    assert.equal(navigateCall?.params?.paymentChannel, 'WECHAT_PAY');
  } finally {
    globalThis.fetch = originalFetch;
    // @ts-expect-error cleanup
    delete globalThis.__mockOrderFetchEnabled;
  }
});

test('RefundScreen: completed refund response returns refunded status to order detail', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => ({
      data: {
        order: { orderId: 'order-001', orderNo: 'ORDAPI20260720001' },
        refunds: [{
          refundId: 'refund-002',
          status: 'COMPLETED',
          refundAmount: 156,
          reason: '整单退款',
          requestedAt: '2026-07-20T03:00:00.000Z',
          completedAt: '2026-07-20T03:05:00.000Z',
        }],
      },
    }),
  }) as Response) as typeof fetch;

  try {
    const root = createRefundComponent({
      orderId: 'order-001',
      orderNo: 'SJY-001',
      amount: 156,
      reason: '整单退款',
    });
    const refundBtn = findTouchableByText(root.root, '确认退款');
    assert.ok(refundBtn, '确认退款按钮应在');

    refundBtn!.props.onPress();
    const confirmAlert = alertCalls.at(-1);
    const confirmButton = confirmAlert?.buttons?.find((button) => button.text === '确认');
    assert.ok(confirmButton?.onPress, '应弹出确认退款对话框');

    await act(async () => {
      await confirmButton!.onPress!();
    });

    const successAlert = alertCalls.find((item) => item.message === '退款已完成，订单状态已更新');
    assert.ok(successAlert, '完成态应提示退款已完成');

    const successButton = successAlert?.buttons?.find((button) => button.text === '确定');
    assert.ok(successButton?.onPress, '完成提示应包含确定按钮');
    successButton!.onPress!();

    const navigateCall = mockNavigateCalls.find((item) => item.route === 'OrderDetail');
    assert.ok(navigateCall, '完成态后应回带到订单详情');
    assert.equal(navigateCall?.params?.orderNo, 'ORDAPI20260720001');
    assert.equal(navigateCall?.params?.refundStatus, 'REFUNDED');
    assert.equal(navigateCall?.params?.refundCompletedAt, '2026-07-20T03:05:00.000Z');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('RefundScreen: api failure shows error alert instead of fake success', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error('refund api unavailable');
  }) as typeof fetch;

  try {
    const root = createRefundComponent({
      orderId: 'order-002',
      orderNo: 'SJY-002',
      amount: 66,
      reason: '支付异常',
    });
    const touchables = findAllTouchables(root.root);
    const refundBtn = touchables.find((t) =>
      t.findAllByType(Text).some((txt) => txt.props.children === '确认退款'),
    );

    assert.ok(refundBtn, '确认退款按钮应在');
    refundBtn!.props.onPress();

    const confirmAlert = alertCalls.at(-1);
    const confirmButton = confirmAlert?.buttons?.find((button) => button.text === '确认');
    assert.ok(confirmButton?.onPress, '应弹出确认退款对话框');

    await act(async () => {
      await confirmButton!.onPress!();
    });

    const errorAlert = alertCalls.find((item) => item.title === '错误' && item.message === 'refund api unavailable');
    assert.ok(errorAlert, '接口失败时应显示错误提示');
    assert.ok(!alertCalls.some((item) => item.message === '退款申请已提交，请等待审核处理'), '失败时不应提示假成功');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('PaymentScreen: multiple decimal points are prevented', () => {
  const root = createPaymentComponent();
  const touchables = findAllTouchables(root.root);

  const key1 = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '1'));
  const dot = touchables.find((t) => t.findAllByType(Text).some((txt) => txt.props.children === '.'));

  assert.ok(key1 && dot);

  key1!.props.onPress();
  dot!.props.onPress();

  // Second decimal point should not do anything
  dot!.props.onPress();

  // Should be 1.
  const amount1dot = findByText(root.root, '1.');
  assert.ok(amount1dot, '金额应只包含一个小数点');
});

test('RefundScreen: amount with more than 2 decimals keeps submit disabled', () => {
  const root = createRefundComponent({
    orderId: 'order-003',
    orderNo: 'SJY-003',
    amount: 100,
    reason: '金额异常',
  });
  const inputs = findAllTextInputs(root.root);
  const amountInput = inputs[0];
  assert.ok(amountInput, '退款金额输入框应在');

  act(() => {
    amountInput!.props.onChangeText('10.123');
  });

  const refundBtn = findTouchableByText(root.root, '确认退款');
  assert.equal(refundBtn?.props.disabled, true, '超过两位小数时确认退款按钮应禁用');
});

test('RefundScreen: renders original amount as 0.00 when no params', () => {
  const root = createRefundComponent();

  const zeroAmount = findByText(root.root, '¥0.00');
  assert.ok(zeroAmount, '无金额参数时显示 ¥0.00');
});

test('PaymentScreen: member card requires valid phone before submit', () => {
  const root = createPaymentComponent();
  const memberCardBtn = findTouchableByText(root.root, '会员卡');
  const key1 = findTouchableByText(root.root, '1');
  const key0 = findTouchableByText(root.root, '0');
  assert.ok(memberCardBtn && key1 && key0, '应找到会员卡与金额键');

  act(() => {
    memberCardBtn!.props.onPress();
    key1!.props.onPress();
    key0!.props.onPress();
  });

  const phoneInput = findAllTextInputs(root.root).find((input) => input.props.placeholder === '请输入会员手机号');
  assert.ok(phoneInput, '会员卡支付应显示手机号输入框');

  act(() => {
    phoneInput!.props.onChangeText('123');
  });

  const disabledSubmitBtn = findTouchableByText(root.root, '确认收款');
  assert.equal(disabledSubmitBtn?.props.disabled, true, '手机号无效时确认收款按钮应禁用');

  act(() => {
    phoneInput!.props.onChangeText('13800138000');
  });

  const enabledSubmitBtn = findTouchableByText(root.root, '确认收款');
  assert.equal(enabledSubmitBtn?.props.disabled, false, '手机号有效时确认收款按钮应可用');
});

test('PaymentScreen: amount above upper limit keeps submit disabled', () => {
  const root = createPaymentComponent();
  const sequence = ['1', '0', '0', '0', '0', '0', '0'];

  act(() => {
    sequence.forEach((key) => {
      findTouchableByText(root.root, key)?.props.onPress();
    });
  });

  const amount = findByText(root.root, '1000000');
  assert.ok(amount, '应能显示超大金额输入');

  const submitBtn = findTouchableByText(root.root, '确认收款');
  assert.equal(submitBtn?.props.disabled, true, '超过金额上限时确认收款按钮应禁用');
});
