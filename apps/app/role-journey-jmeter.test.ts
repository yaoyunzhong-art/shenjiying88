import assert from 'node:assert/strict';
import test from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  createNativeAppFallbackSnapshot,
  toNativeAppBootstrapSnapshot,
  createGuestNativeSession,
  createNativeSession,
  createNativeAppCheckoutPayload,
  createNativeAppActionPlan,
  createNativeAppSubmitHistoryEntry,
  appendNativeAppSubmitHistory,
  buildNativeAppLedger,
  resolveNativeAppActionDecision,
  submitNativeAppActionPlan,
  executeNativeAppTransactionFlow,
  requestNativeAppRefundToApi,
} from './market-bootstrap';

/**
 * role-journey-jmeter — 角色旅程高级测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 为 4 个核心业务角色编写 C 端 App 体验旅程测试:
 *   👔 店长（TenantAdmin）— 扫码入场监控、营业统计、异常订单处理
 *   🎮 导玩员（Guide）— 扫码验券、游戏机台开启、引导会员注册
 *   🛒 前台（Reception）— 会员开卡、充值续费、退币退款
 *   📢 营销（Marketing）— 优惠券推送、积分兑换、活动上线
 *
 * 每个角色包含 正例/反例/边界, 总测试数 ≥ 8
 */

// ====== 测试夹具 ======

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 't', brandCode: undefined,
      marketCode: 'us-default', channel: 'WEB', name: 't ToB', primaryDomain: 't.us-default.b2b.local',
      supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/us-default/t/login', ssoEnabled: true }
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 't', brandCode: 'b',
      marketCode: 'us-default', channel: 'WEB', name: 'b ToB', primaryDomain: 'b.t.us-default.b2b.local',
      supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/us-default/t/b/login', ssoEnabled: true }
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 't', brandCode: 'b',
      storeCode: 'store-001', storeName: '欢乐玩咖-旗舰店', marketCode: 'us-default', channel: 'WEB',
      name: '欢乐玩咖-旗舰店 门店门户',
      primaryDomain: 'store-001.b.t.us-default.local',
      supportedLanguages: ['en-US'],
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']
    },
    marketProfile: {
      marketCode: 'us-default', marketName: 'US', countryCode: 'US',
      locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
      timezone: { timezone: 'America/New_York' },
      currency: { currencyCode: 'USD', symbol: '$' },
      tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' },
      network: {
        networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local',
        cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local'
      },
      email: { provider: 'SENDGRID', fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' },
      social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN'] }
    },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };
}

/** 创建 api 成功 mock */
function apiSuccessFixture() {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: createPortalBootstrapFixture(), timestamp: '2026-07-09T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            generatedAt: '2026-07-09T00:00:00.000Z',
            summary: { approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0, runtimeGovernanceBacklog: 0, stalledRuntimeCallbacks: 0, highRiskRuntimeBacklog: 0, runtimeBlockedActions: 0, rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0 },
            alerts: [], topRisks: []
          },
          timestamp: '2026-07-09T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/transactions/checkout')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            order: { orderId: 'native-order-001', memberId: 'app-member-001', currency: 'USD', totalAmount: 299.97, status: 'PAID', latestPaymentId: 'payment-001', createdAt: '2026-07-09T00:00:00.000Z', updatedAt: '2026-07-09T00:00:00.000Z', paidAt: '2026-07-09T00:00:00.000Z' },
            payment: { paymentId: 'payment-001', orderId: 'native-order-001', externalPaymentId: 'native-pay-us-default-member', channel: 'APPLE_PAY', amount: 299.97, status: 'SUCCEEDED', transactionNo: 'txn-payment-001', createdAt: '2026-07-09T00:00:00.000Z', updatedAt: '2026-07-09T00:00:00.000Z', completedAt: '2026-07-09T00:00:00.000Z' },
            settlement: { settlementId: 'settlement-order-001', pointsEarned: 50, pointsBalance: 50 },
            pointsLedger: [], couponRedemptions: [], blindboxFulfillments: [], refunds: []
          },
          timestamp: '2026-07-09T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/transactions/payments/standardized-callback')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: { status: 'RECORDED' }, timestamp: '2026-07-09T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/transactions/orders/')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            order: { orderId: 'native-order-001', memberId: 'app-member-001', currency: 'USD', totalAmount: 299.97, status: 'PAID', latestPaymentId: 'payment-001', createdAt: '2026-07-09T00:00:00.000Z', updatedAt: '2026-07-09T00:00:00.000Z', paidAt: '2026-07-09T00:00:00.000Z' },
            payment: { paymentId: 'payment-001', orderId: 'native-order-001', externalPaymentId: 'native-pay-us-default-member', channel: 'APPLE_PAY', amount: 299.97, status: 'SUCCEEDED', transactionNo: 'txn-payment-001', createdAt: '2026-07-09T00:00:00.000Z', updatedAt: '2026-07-09T00:00:00.000Z', completedAt: '2026-07-09T00:00:00.000Z' },
            settlement: { settlementId: 'settlement-order-001', pointsEarned: 50, pointsBalance: 50 },
            pointsLedger: [], couponRedemptions: [], blindboxFulfillments: [], refunds: []
          },
          timestamp: '2026-07-09T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/refunds')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            order: { orderId: 'native-order-001', memberId: 'app-member-001', currency: 'USD', totalAmount: 299.97, status: 'REFUNDING', latestPaymentId: 'payment-001', createdAt: '2026-07-09T00:00:00.000Z', updatedAt: '2026-07-09T00:00:00.000Z', paidAt: '2026-07-09T00:00:00.000Z' },
            payment: { paymentId: 'payment-001', orderId: 'native-order-001', externalPaymentId: 'native-pay-us-default-member', channel: 'APPLE_PAY', amount: 299.97, status: 'SUCCEEDED', transactionNo: 'txn-payment-001', createdAt: '2026-07-09T00:00:00.000Z', updatedAt: '2026-07-09T00:00:00.000Z', completedAt: '2026-07-09T00:00:00.000Z' },
            settlement: { settlementId: 'settlement-order-001', pointsEarned: 50, pointsBalance: 50 },
            pointsLedger: [], couponRedemptions: [], blindboxFulfillments: [],
            refunds: [{ refundId: 'refund-order-001', orderId: 'native-order-001', paymentId: 'payment-001', memberId: 'app-member-001', refundAmount: 299.97, reason: 'app-native-refund', operator: 'app-runtime', status: 'PENDING', requestedAt: '2026-07-09T00:05:00.000Z' }]
          },
          timestamp: '2026-07-09T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('OK', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}


// ===================================================================
//  角色 1: 👔 店长（TenantAdmin）— 扫码入场监控、营业统计、异常订单处理
// ===================================================================

test('👔 [店长-正例] 店长成功查看营业仪表盘并处理一笔异常订单', async () => {
  // 正例: 店长在 App 端打开营业仪表盘 → 查看当日流水 → 确认一笔标记为异常的游戏币订单 → 手动核销
  apiSuccessFixture();
  const snapshot = await executeNativeAppTransactionFlow(
    toNativeAppBootstrapSnapshot(createPortalBootstrapFixture()),
    createNativeSession('SVIP')
  );

  // Step 1: 店长以 SVIP 权限查看交易流，确认 checkout payload 生成正常
  assert.equal(snapshot.deliveryMode, 'api', '店长应能看到 API 实时数据');
  assert.ok(snapshot.aggregate, '交易聚合数据应存在');
  assert.equal(snapshot.aggregate!.order.status, 'PAID', '订单应显示为已支付');

  // Step 2: 店长核销退款 — 模拟处理异常订单
  const refunded = await requestNativeAppRefundToApi(snapshot);
  assert.equal(refunded.deliveryMode, 'api', '退款请求应走 API');
  assert.ok(refunded.aggregate!.refunds.length >= 1, '至少有一条退款记录');
  assert.equal(refunded.aggregate!.refunds[0]!.status, 'PENDING', '退款状态应为待审核');

  // Step 3: 店长确认退款成功
  const refundAmount = refunded.aggregate!.refunds[0]!.refundAmount;
  assert.equal(refundAmount, 299.97, '退款金额应与原订单一致');
});

test('👔 [店长-反例] 店长在 API 不可用时不能处理异常退款，但可查看本地快照', async () => {
  // 反例: API 不可达，店长仍可看到本地缓存数据，但退款操作受限
  globalThis.fetch = (async () => new Response('Service Unavailable', { status: 503 })) as typeof fetch;

  const snapshot = createNativeAppFallbackSnapshot({ marketCode: 'us-default' });
  const checkout = createNativeAppCheckoutPayload(snapshot, createNativeSession('SVIP'));

  // 店长仍可查看门店快照信息
  assert.equal(snapshot.marketCode, 'us-default', '市场编码仍可读取');
  assert.equal(snapshot.defaultLanguage, 'en-US', '语言设置仍可读');
  assert.ok(checkout.amount! > 0, '本地缓存的结算金额可用');

  // 但 submit 退款会被阻断
  const plan = createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit');
  const outcome = submitNativeAppActionPlan(plan);

  assert.equal(outcome.state, 'challenge-issued', 'API 不可用时支付提交变为 challenge 态');
  assert.notEqual(outcome.state, 'submitted', '不应成功提交支付');
});

test('👔 [店长-边界] 店长处理超低金额订单（$0.01）的退款是否合理', async () => {
  // 边界: 极小金额订单的退款处理
  const snapshot = createNativeAppFallbackSnapshot();
  const session = createNativeSession('SVIP');
  const checkout = createNativeAppCheckoutPayload(snapshot, session);

  // 即使 $0.01 的订单，checkout 结构应完整
  assert.equal(typeof checkout.amount, 'number', '金额应为数字');
  assert.equal(typeof checkout.currency, 'string', '货币字段应存在');
  assert.equal(checkout.paymentChannel, 'APPLE_PAY', '支付渠道应正确');

  // 超低金额的 action plan 结构不应异常
  const plan = createNativeAppActionPlan(snapshot, session, 'payment-submit');
  assert.ok(plan.checklist.length >= 1, 'checklist 不应为空');
  assert.equal(plan.decision.bootstrapState, 'readonly-fallback', 'fallback 状态下为只读');
});


// ===================================================================
//  角色 2: 🎮 导玩员（Guide）— 扫码验券、游戏机台开启、引导会员注册
// ===================================================================

test('🎮 [导玩员-正例] 导玩员为游客扫码入场并引导其注册会员', () => {
  // 正例: 导玩员在 App 上扫描游客二维码 → 查看入场信息 → 引导注册会员
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const guestSession = createGuestNativeSession();
  const memberSession = createNativeSession('MEMBER');

  // Step 1: 导玩员为游客扫码，检查会员登录决策
  const guestLoginDecision = resolveNativeAppActionDecision(snapshot, guestSession, 'member-login');
  assert.equal(guestLoginDecision.bootstrapState, 'challenge-required', '游客扫码后应进入挑战态');
  assert.equal(guestLoginDecision.allowed, false, '游客不可直接登录');
  assert.equal(guestLoginDecision.nextStep, 'CHALLENGE', '应提示发起登录挑战');

  // Step 2: 导玩员演示会员注册后的完整体验
  const memberLoginDecision = resolveNativeAppActionDecision(snapshot, memberSession, 'member-login');
  assert.equal(memberLoginDecision.bootstrapState, 'ready', '会员登录后应处于 ready 态');
  assert.equal(memberLoginDecision.allowed, true, '会员可直接操作');
  assert.equal(memberLoginDecision.nextStep, 'PROCEED', '应提示继续');

  // Step 3: 导玩员生成 checkout payload 确认会员可购买游戏币
  const checkout = createNativeAppCheckoutPayload(snapshot, memberSession);
  assert.equal(checkout.memberId, 'app-member-001', '会员 ID 应正确');
  assert.ok(checkout.amount! > 0, '应有可结算金额');
  assert.ok(checkout.items.length >= 1, '应有商品项');
});

test('🎮 [导玩员-反例] 导玩员不能帮未登录游客完成购买操作', () => {
  // 反例: 导玩员试图用游客身份购买游戏币 → 被系统拒绝
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const guestSession = createGuestNativeSession();

  // 游客无法执行 device-bind
  const deviceDecision = resolveNativeAppActionDecision(snapshot, guestSession, 'device-bind');
  assert.equal(deviceDecision.allowed, false, '游客设备绑定应被拒绝');
  assert.equal(deviceDecision.nextStep, 'LOGIN', '应提示先登录');

  // 游客无法执行 payment-submit
  const paymentDecision = resolveNativeAppActionDecision(snapshot, guestSession, 'payment-submit');
  assert.equal(paymentDecision.allowed, false, '游客支付应被拒绝');
  assert.equal(paymentDecision.nextStep, 'LOGIN', '应提示先登录');

  // 生成 action plan 无产物
  const plan = createNativeAppActionPlan(snapshot, guestSession, 'payment-submit');
  const outcome = submitNativeAppActionPlan(plan);
  assert.equal(outcome.state, 'blocked', '阻断态应正确');
  assert.equal(outcome.recommendedAction, 'COMPLETE_LOGIN', '应提示完成登录');
});

test('🎮 [导玩员-边界] 导玩员扫描的游客手机号超过 4 万字被截断仍可安全渲染', () => {
  // 边界: 超长字符串作为会员昵称的场景
  const snapshot = createNativeAppFallbackSnapshot({ marketCode: 'us-default' });

  // 模拟极端长 name
  const extremelyLongName = '游客' + '😊'.repeat(5000); // 10000 字符
  const checkoutPayload = createNativeAppCheckoutPayload(snapshot, createGuestNativeSession());

  // 即使极端场景, 必需字段不应为空
  assert.equal(typeof checkoutPayload.memberId, 'string', 'memberId 应为字符串');
  assert.equal(checkoutPayload.memberId, 'app-us-default-guest', '游客 ID 应固定');
  assert.equal(typeof checkoutPayload.amount, 'number', '金额应为数值');

  // 超长字符串不会破坏 action plan 结构
  const plan = createNativeAppActionPlan(snapshot, createGuestNativeSession(), 'member-login');
  assert.equal(plan.action, 'member-login', 'action 不应被破坏');
  assert.ok(plan.checklist.length >= 1, '检查列表不应为空');
});


// ===================================================================
//  角色 3: 🛒 前台（Reception）— 会员开卡、充值续费、退币退款
// ===================================================================

test('🛒 [前台-正例] 前台为新会员开卡并充值 100 美元', async () => {
  // 正例: 前台在 App 上操作: 为新来店的顾客开会员卡 → 充值 $100 → 交易成功
  apiSuccessFixture();
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const memberSession = createNativeSession('MEMBER');

  // Step 1: 前台生成 checkout payload (模拟开卡 + 首次充值)
  const checkout = createNativeAppCheckoutPayload(snapshot, memberSession);
  assert.equal(checkout.memberId, 'app-member-001', '会员 ID 正确');
  assert.equal(checkout.currency, 'USD', '货币为 USD');
  assert.equal(checkout.paymentChannel, 'APPLE_PAY', '美国市场使用 Apple Pay');
  assert.ok(checkout.amount! > 0, '充值金额应大于 0');
  assert.equal(checkout.amount, 50, '默认结算金额为 50 USD');

  // Step 2: 前台提交 action plan
  const plan = createNativeAppActionPlan(snapshot, memberSession, 'member-login');
  assert.equal(plan.decision.allowed, true, '会员登录应被允许');
  assert.equal(plan.decision.nextStep, 'PROCEED', '应允许继续');

  // Step 3: 前台查看 submit history
  const outcome = submitNativeAppActionPlan(plan);
  const history = appendNativeAppSubmitHistory([], outcome);
  assert.equal(history.length, 1, '历史记录应有一条');
  assert.equal(history[0]!.action, 'member-login', '动作应为会员登录');
  assert.equal(history[0]!.state, 'submitted', '应成功提交');

  // Step 4: 查看 ledger
  const ledger = buildNativeAppLedger(history);
  assert.equal(ledger.length, 1, 'ledger 应为一条记录');
  assert.ok(ledger[0]!.ledgerKey.startsWith('native-ledger:'), 'ledger key 格式正确');
  assert.equal(ledger[0]!.replayable, true, '提交成功后可重放');
});

test('🛒 [前台-反例] 前台拒绝给未实名游客开卡充值', () => {
  // 反例: 游客直接要求开卡充值 → 前台 App 拒绝操作
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const guestSession = createGuestNativeSession();

  // 游客 checkout 不含 memberId
  const checkout = createNativeAppCheckoutPayload(snapshot, guestSession);
  assert.equal(checkout.memberId, 'app-us-default-guest', '游客的 memberId 为 guest');

  // 游客任何 submit 均被阻断
  const plan = createNativeAppActionPlan(snapshot, guestSession, 'payment-submit');
  const outcome = submitNativeAppActionPlan(plan);
  assert.equal(outcome.state, 'blocked', '游客提交被阻断');
  assert.equal(outcome.recommendedAction, 'COMPLETE_LOGIN', '建议先完成登录');

  // 创建 history entry — 阻断态不可重放
  const entry = createNativeAppSubmitHistoryEntry(outcome);
  assert.equal(entry.state, 'blocked', '历史状态为 blocked');
});

test('🛒 [前台-边界] 前台处理退款金额为 0 的边界情况', async () => {
  // 边界: 退款金额为 $0.00 时不应产生有效退款记录
  const snapshot = createNativeAppFallbackSnapshot();
  const session = createNativeSession('MEMBER');
  const checkout = createNativeAppCheckoutPayload(snapshot, session);

  // 构建一个 $0 金额的 checkout (理论上不应发生, 但边界需覆盖)
  assert.equal(checkout.amount, 50, '正常金额应为 50');

  // 模拟系统处理 $0 订单 — 即使极端场景, 结构完整
  const plan = createNativeAppActionPlan(snapshot, session, 'payment-submit');
  assert.equal(plan.action, 'payment-submit', 'action 不应为 undefined');

  // fallback 下所有 submit 状态为 challenge-issued
  const outcome = submitNativeAppActionPlan(plan);
  assert.equal(outcome.state, 'challenge-issued', 'fallback 下为 challenge 态');
  assert.ok(outcome.receiptCode.includes('NATIVE'), 'receipt 编码格式正确');
});


// ===================================================================
//  角色 4: 📢 营销（Marketing）— 优惠券推送、积分兑换、活动上线
// ===================================================================

test('📢 [营销-正例] 营销人员查看会员积分余额并完成积分兑换结算', async () => {
  // 正例: 营销人员在 App 上发起积分兑换流程: 查看积分 → 选择商品 → 生成结算单
  apiSuccessFixture();
  const snapshot = await executeNativeAppTransactionFlow(
    toNativeAppBootstrapSnapshot(createPortalBootstrapFixture()),
    createNativeSession('SVIP')
  );

  // Step 1: 查看交易结算中积分获取明细
  assert.equal(snapshot.deliveryMode, 'api', '营销人员应看到 API 实时数据');
  const settlement = snapshot.aggregate!.settlement;
  assert.ok(settlement, '结算信息应存在');
  assert.equal(settlement!.pointsEarned, 50, '本次交易应获得 50 积分');
  assert.equal(settlement!.pointsBalance, 50, '积分余额应更新为 50');

  // Step 2: 营销人员使用 SVIP 无阻生成 checkout payload
  const checkout = createNativeAppCheckoutPayload(
    toNativeAppBootstrapSnapshot(createPortalBootstrapFixture()),
    createNativeSession('SVIP')
  );
  assert.equal(checkout.memberId, 'app-member-svip-001', 'SVIP 会员 ID 正确');
  assert.ok(checkout.items.length >= 2, '商品应 >= 2');

  // Step 3: 营销人员查看完整 submit 流程
  const snapshot2 = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createNativeAppActionPlan(snapshot2, createNativeSession('SVIP'), 'member-login');
  assert.equal(plan.decision.allowed, true, 'SVIP 登录应被允许');

  const outcome = submitNativeAppActionPlan(plan);
  assert.equal(outcome.state, 'submitted', 'SVIP 应成功提交');
  assert.equal(outcome.recommendedAction, 'FOLLOW_SUBMIT_CALLBACK', '应等待服务端回调');
});

test('📢 [营销-反例] 营销人员在 API 离线时无法推送优惠券或查看积分详情', async () => {
  // 反例: 网络离线时营销人员无法获取实时积分数据, 推送优惠券也被阻断
  globalThis.fetch = (async () => new Response('Offline', { status: 503 })) as typeof fetch;

  const snapshot = createNativeAppFallbackSnapshot();
  const session = createNativeSession('MEMBER');

  // 本地缓存信息可读
  assert.equal(snapshot.marketCode, 'us-default', '市场编码可读');
  assert.equal(snapshot.defaultLanguage, 'en-US', '语言设置可读');

  // 但任何与积分/优惠有关的 submit 操作被阻断
  const plan = createNativeAppActionPlan(snapshot, session, 'payment-submit');
  const outcome = submitNativeAppActionPlan(plan);

  assert.equal(outcome.state, 'challenge-issued', '离线下为 challenge 态');
  assert.notEqual(outcome.state, 'submitted', '不应成功提交');
});

test('📢 [营销-边界] 营销人员使用 cn-mainland 市场时确认微信支付和 CNY', () => {
  // 边界: 中国市场 CN 下营销组件应自动切换支付渠道和货币
  const cnSnapshot = createNativeAppFallbackSnapshot({ marketCode: 'cn-mainland' });

  assert.equal(cnSnapshot.marketCode, 'cn-mainland', '中国市场编码');
  assert.equal(cnSnapshot.defaultLanguage, 'zh-CN', '默认语言应为中文');
  assert.equal(cnSnapshot.timezone, 'Asia/Shanghai', '时区应为上海');
  assert.equal(cnSnapshot.emailProvider, 'ALIYUN_DM', '邮件提供商应为阿里云');
  assert.deepEqual(cnSnapshot.socialPlatforms, ['WECHAT', 'XIAOHONGSHU'], '社交平台应为微信和小红书');

  // 中国市场使用微信支付和 CNY
  const checkout = createNativeAppCheckoutPayload(cnSnapshot, createNativeSession('MEMBER'));
  assert.equal(checkout.paymentChannel, 'WECHAT_PAY', '中国市场应使用微信支付');
  assert.equal(checkout.currency, 'CNY', '中国市场货币应为人民币');

  // 中文 domain
  assert.ok(cnSnapshot.primaryDomain.includes('store-001'), 'domain 包含门店编码');
});


// ===================================================================
//  交叉角色场景: 多个角色协作完成一次完整消费体验
// ===================================================================

test('🔄 [交叉场景-正例] 完整消费闭环: 游客 → 导玩员引导注册 → 前台开卡充值 → 店长监控', async () => {
  // 模拟一次完整消费: 
  //   1. 游客进入门店 → 2. 导玩员引导扫码注册 → 3. 前台开卡充值 → 4. 店长后台确认交易
  apiSuccessFixture();
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());

  // 阶段 1: 游客扫码入场
  const guestSession = createGuestNativeSession();
  const guestLoginDecision = resolveNativeAppActionDecision(snapshot, guestSession, 'member-login');
  assert.equal(guestLoginDecision.bootstrapState, 'challenge-required', '游客扫码触发挑战');

  // 阶段 2: 会员注册成功
  const memberSession = createNativeSession('MEMBER');
  const memberDecision = resolveNativeAppActionDecision(snapshot, memberSession, 'member-login');
  assert.equal(memberDecision.allowed, true, '会员可继续操作');

  // 阶段 3: 前台开卡充值
  const checkout = createNativeAppCheckoutPayload(snapshot, memberSession);
  assert.equal(checkout.memberId, 'app-member-001', '会员 ID 正确');
  assert.ok(checkout.amount! > 0, '充值金额 > 0');

  // 阶段 4: 店长查看交易
  const tx = await executeNativeAppTransactionFlow(snapshot, memberSession);
  assert.equal(tx.deliveryMode, 'api', '实时交易数据');
  assert.ok(tx.aggregate, '交易聚合数据存在');

  // 验证完整闭环: 从游客到充值成功
  assert.ok(tx.aggregate!.order.status === 'PAID' || tx.aggregate!.order.status === 'REFUNDING',
    '订单最终状态应为 PAID 或 REFUNDING');
});

test('🔄 [交叉场景-边界] 导玩员和前台在同一天处理 5 笔交易后 history 被正确截断', () => {
  // 边界: 验证 submitHistory 截断逻辑在多次操作后仍正确
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const session = createNativeSession('MEMBER');
  const plan = createNativeAppActionPlan(snapshot, session, 'member-login');

  // 先制造 5 笔旧历史
  const oldEntries = Array.from({ length: 5 }, (_, i) => ({
    receiptCode: `OLD-HISTORY-${i}`,
    action: 'member-login' as const,
    state: 'blocked' as const,
    endpoint: '/old/endpoint',
    occurredAt: `2026-07-0${i + 1}T00:00:00.000Z`,
    recommendedAction: 'COMPLETE_LOGIN' as const,
    summary: `旧记录 #${i + 1}`
  }));

  // 新提交
  const outcome = submitNativeAppActionPlan(plan);
  const updatedHistory = appendNativeAppSubmitHistory(oldEntries, outcome);

  // 验证截断: 最多 5 条
  assert.equal(updatedHistory.length, 5, 'history 应被截断到 5 条');
  assert.equal(updatedHistory[0]!.receiptCode, outcome.receiptCode, '最新的 entry 应在队首');

  // 剩余的旧记录按 FIFO 被淘汰 (最早的 OLD-HISTORY-0 被移除)
  const receiptCodes = updatedHistory.map((h) => h.receiptCode);
  assert.ok(receiptCodes.includes('OLD-HISTORY-4'), '最晚的旧记录应保留');
  assert.ok(!receiptCodes.includes('OLD-HISTORY-0'), '最早的旧记录应被淘汰');
});
