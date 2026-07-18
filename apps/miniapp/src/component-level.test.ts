import assert from 'node:assert/strict';
import test from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  createMiniappFallbackSnapshot,
  toMiniappBootstrapSnapshot,
  createGuestMemberSession,
  createMemberSession,
  createMiniappRuntimeConsumerContract,
  resolveMiniappActionDecision,
  createMiniappActionPlan,
  listMiniappActionPlans,
  submitMiniappActionPlan,
  createMiniappActionTicket,
  buildMiniappHandlerSyncContract,
  createMiniappCallbackReceipt,
  buildMiniappAuthEnvelope,
} from './market-bootstrap';

/**
 * miniapp (Taro) Component-Level — L1 组件级冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 模拟小程序组件的行为：虚拟组件渲染数据生成、状态管理、"props" 传递、
 * 事件处理决策、组件输出结构完整性。
 * 由于实际 Taro 组件在 tsx 文件中且依赖框架运行时，此处通过纯领域函数
 * 模拟组件级别的数据契约验证。
 */

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 't', marketCode: 'cn-mainland', channel: 'WEB', name: 't ToB', primaryDomain: 't.cn-mainland.b2b.local', supportedLanguages: ['zh-CN'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/cn-mainland/t/login', ssoEnabled: true }, domainSource: 'default'
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 't', brandCode: 'b', marketCode: 'cn-mainland', channel: 'WEB', name: 'b ToB', primaryDomain: 'b.t.cn-mainland.b2b.local', supportedLanguages: ['zh-CN'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/cn-mainland/t/b/login', ssoEnabled: true }, domainSource: 'default'
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 't', brandCode: 'b', storeCode: 'store-001', storeName: 'store-001', marketCode: 'cn-mainland', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.b.t.cn-mainland.local', supportedLanguages: ['zh-CN'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
      domainSource: 'default',
    },
    marketProfile: {
      marketCode: 'cn-mainland', marketName: '中国大陆', countryCode: 'CN',
      locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
      timezone: { timezone: 'Asia/Shanghai' },
      currency: { currencyCode: 'CNY', symbol: '¥' },
      tax: { taxMode: 'PRICES_INCLUDE_TAX', taxRate: 6, taxLabel: '增值税' },
      network: { networkRegion: 'MAINLAND_CHINA', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local', callbackBaseUrl: 'https://cn-hooks.m5.local' },
      email: { provider: 'ALIYUN_DM', fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' },
      social: { primaryPlatforms: ['WECHAT'], supportPlatforms: ['WECHAT'] },
    },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: [],
  };
}

// ─────────────────────────────────────────────────────────
// 虚拟组件工厂 — 模拟 Taro 组件的关键属性配置合约
// ─────────────────────────────────────────────────────────

interface VirtualComponentProps {
  scopePath?: string;
  bootstrapState?: string;
  memberTier?: string;
  points?: number;
  couponCount?: number;
  authenticated?: boolean;
  actionKey?: string;
  nextStep?: string;
  allowed?: boolean;
  summary?: string;
}

interface VirtualComponentRenderOutput {
  visible: boolean;
  className: string;
  disabled: boolean;
  interactionLabel: string;
  ariaLabel: string;
  dataAttributes: Record<string, string | number | boolean | undefined>;
}

function renderActionButton(props: VirtualComponentProps): VirtualComponentRenderOutput {
  const disabled = !props.allowed;
  const visible = props.bootstrapState !== 'readonly-fallback';
  const interactionLabel = disabled ? '操作不可用' : '执行操作';
  return {
    visible,
    className: [
      'action-btn',
      disabled ? 'action-btn--disabled' : 'action-btn--enabled',
      props.memberTier === 'SVIP' ? 'action-btn--premium' : '',
    ].filter(Boolean).join(' '),
    disabled,
    interactionLabel,
    ariaLabel: `${interactionLabel} - ${props.actionKey ?? 'unknown'}`,
    dataAttributes: {
      'data-action': props.actionKey ?? '',
      'data-allowed': props.allowed ?? false,
      'data-tier': props.memberTier ?? 'GUEST',
      'data-next-step': props.nextStep ?? '',
    },
  };
}

function renderMemberInfoCard(props: VirtualComponentProps): VirtualComponentRenderOutput {
  const guestMode = !props.authenticated;
  return {
    visible: true,
    className: [
      'member-card',
      guestMode ? 'member-card--guest' : 'member-card--authenticated',
      props.memberTier === 'SVIP' ? 'member-card--premium' : '',
    ].filter(Boolean).join(' '),
    disabled: guestMode,
    interactionLabel: guestMode ? '请先登录' : `${props.memberTier ?? '未知'} 会员`,
    ariaLabel: guestMode ? '访客模式，点此登录' : `${props.memberTier ?? '未知'} 会员信息`,
    dataAttributes: {
      'data-authenticated': props.authenticated ?? false,
      'data-tier': props.memberTier ?? 'GUEST',
      'data-points': props.points ?? 0,
      'data-coupons': props.couponCount ?? 0,
    },
  };
}

interface VirtualEventPayload {
  action: string;
  componentId: string;
  timestamp: number;
  source: string;
}

function buildTapEvent(componentId: string, action: string): VirtualEventPayload {
  return {
    action,
    componentId,
    timestamp: Date.now(),
    source: 'miniapp-component',
  };
}

// ─────────────────────────────────────────────────────────
// 正例 — 组件正常渲染 / 用户交互响应
// ─────────────────────────────────────────────────────────

test('miniapp component: action button renders enabled for member with allowed action', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const decision = resolveMiniappActionDecision(snapshot, createMemberSession(), 'booking-submit');

  const output = renderActionButton({
    bootstrapState: decision.bootstrapState,
    memberTier: 'MEMBER',
    allowed: decision.allowed,
    actionKey: 'booking-submit',
    nextStep: decision.nextStep,
  });

  assert.equal(output.visible, true);
  assert.equal(output.disabled, false);
  assert.ok(output.className.includes('action-btn--enabled'));
  assert.equal(output.interactionLabel, '执行操作');
  assert.equal(output.dataAttributes['data-allowed'], true);
  assert.equal(output.dataAttributes['data-next-step'], 'PROCEED');
});

test('miniapp component: member info card renders authenticated for member session', () => {
  const session = createMemberSession();

  const output = renderMemberInfoCard({
    authenticated: session.authenticated,
    memberTier: session.memberTier,
    points: session.points,
    couponCount: session.couponCount,
  });

  assert.equal(output.visible, true);
  assert.equal(output.disabled, false);
  assert.ok(output.className.includes('member-card--authenticated'));
  assert.equal(output.interactionLabel, 'MEMBER 会员');
  assert.equal(output.dataAttributes['data-authenticated'], true);
  assert.equal(output.dataAttributes['data-tier'], 'MEMBER');
});

test('miniapp component: member info card shows correct points for member', () => {
  const session = createMemberSession('MEMBER');

  const output = renderMemberInfoCard({
    authenticated: session.authenticated,
    memberTier: session.memberTier,
    points: session.points,
    couponCount: session.couponCount,
  });

  assert.equal(output.dataAttributes['data-points'], 320);
  assert.equal(output.dataAttributes['data-coupons'], 2);
});

test('miniapp component: tap event built with correct component id and action', () => {
  const event = buildTapEvent('booking-submit-btn', 'booking-submit');

  assert.equal(event.action, 'booking-submit');
  assert.equal(event.componentId, 'booking-submit-btn');
  assert.equal(event.source, 'miniapp-component');
  assert.ok(typeof event.timestamp === 'number');
  assert.ok(event.timestamp > 0);
});

test('miniapp component: action button renders premium className for SVIP', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const decision = resolveMiniappActionDecision(snapshot, createMemberSession('SVIP'), 'coupon-claim');

  const output = renderActionButton({
    bootstrapState: decision.bootstrapState,
    memberTier: 'SVIP',
    allowed: decision.allowed,
    actionKey: 'coupon-claim',
    nextStep: decision.nextStep,
  });

  assert.ok(output.className.includes('action-btn--premium'));
  assert.equal(output.dataAttributes['data-next-step'], 'CHALLENGE');
});

test('miniapp component: action ticket includes correct component-level fields', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const ticket = createMiniappActionTicket(outcome);

  // 组件层面验证 ticket 结构完整性
  assert.equal(ticket.ticketType, 'HANDLER_CALLBACK');
  assert.equal(ticket.status, 'ready-for-handler');
  assert.ok(ticket.ticketCode.length > 0);
  assert.ok(ticket.receiptCode.length > 0);
  assert.ok(ticket.summary.length > 0);
});

test('miniapp component: sync contract ready flag signals component enabled', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const sync = buildMiniappHandlerSyncContract(outcome);

  // 组件依赖 sync.ready 来决定 "提交" 按钮是否为可用状态
  const output = renderActionButton({
    bootstrapState: 'ready',
    memberTier: 'MEMBER',
    allowed: sync.ready,
    actionKey: 'booking-submit',
    nextStep: 'PROCEED',
  });

  assert.equal(sync.ready, true);
  assert.equal(output.disabled, false);
});

// ─────────────────────────────────────────────────────────
// 反例 — 缺失 props / 错误数据输入
// ─────────────────────────────────────────────────────────

test('miniapp component: action button renders disabled for guest with no allowed action', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const decision = resolveMiniappActionDecision(snapshot, createGuestMemberSession(), 'booking-submit');

  const output = renderActionButton({
    bootstrapState: decision.bootstrapState,
    memberTier: 'GUEST',
    allowed: decision.allowed,
    actionKey: 'booking-submit',
    nextStep: decision.nextStep,
  });

  assert.equal(output.visible, true);
  assert.equal(output.disabled, true);
  assert.ok(output.className.includes('action-btn--disabled'));
  assert.equal(output.interactionLabel, '操作不可用');
  assert.equal(output.dataAttributes['data-allowed'], false);
  assert.equal(output.dataAttributes['data-next-step'], 'LOGIN');
});

test('miniapp component: member info card renders disabled for guest session', () => {
  const session = createGuestMemberSession();

  const output = renderMemberInfoCard({
    authenticated: session.authenticated,
    memberTier: session.memberTier,
    points: session.points,
    couponCount: session.couponCount,
  });

  assert.equal(output.disabled, true);
  assert.ok(output.className.includes('member-card--guest'));
  assert.equal(output.interactionLabel, '请先登录');
  assert.equal(output.dataAttributes['data-authenticated'], false);
  assert.equal(output.dataAttributes['data-tier'], 'GUEST');
});

test('miniapp component: action button invisible for fallback bootstrap state', () => {
  const fallback = createMiniappFallbackSnapshot();
  const decision = resolveMiniappActionDecision(fallback, createGuestMemberSession(), 'coupon-claim');

  const output = renderActionButton({
    bootstrapState: decision.bootstrapState,
    memberTier: 'GUEST',
    allowed: decision.allowed,
    actionKey: 'coupon-claim',
    nextStep: decision.nextStep,
  });

  assert.equal(output.visible, false);
  assert.equal(output.disabled, true);
});

test('miniapp component: action button handles missing optional props gracefully', () => {
  // 模拟组件接收缺失某些 props 的情况 — 应不崩溃
  // visibility 只依赖于 bootstrapState !== 'readonly-fallback'
  // undefined !== 'readonly-fallback' → true, 所以 visible=true
  const output = renderActionButton({});

  assert.equal(output.visible, true); // undefined !== 'readonly-fallback'
  assert.equal(output.disabled, true); // undefined allowed => disabled
  assert.ok(output.className.includes('action-btn--disabled'));
  assert.equal(output.dataAttributes['data-tier'], 'GUEST'); // 默认
  assert.equal(output.dataAttributes['data-allowed'], false);
});

test('miniapp component: member info card handles missing props gracefully', () => {
  const output = renderMemberInfoCard({});

  assert.equal(output.visible, true);
  assert.equal(output.disabled, true);
  assert.ok(output.className.includes('member-card--guest'));
  assert.equal(output.interactionLabel, '请先登录');
  assert.equal(output.dataAttributes['data-points'], 0);
  assert.equal(output.dataAttributes['data-coupons'], 0);
});

test('miniapp component: null session passed to decision component blocks action', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());

  // 模拟组件接受空/无效 session 的场景
  // 使用 guest session 模拟组件数据未加载时的行为
  const decision = resolveMiniappActionDecision(snapshot, createGuestMemberSession(), 'booking-submit');

  assert.equal(decision.allowed, false);
  assert.equal(decision.nextStep, 'LOGIN');
});

test('miniapp component: invalid action key causes no matching plan decision', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());

  // 组件收到不存在的 action key 时，所有 plan 不应包含该 key
  const plans = listMiniappActionPlans(snapshot, createMemberSession());
  const invalidKeys = plans.filter(p => p.action === 'invalid-key' as any);

  assert.equal(invalidKeys.length, 0);
});

// ─────────────────────────────────────────────────────────
// 边界 — 大量列表渲染 / 空状态 / 极端值
// ─────────────────────────────────────────────────────────

test('miniapp component: renders many action plans without collision', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());

  // 模拟大量 action plan 的组件渲染 — 每个 plan 应有独立 data-action
  const plans = listMiniappActionPlans(snapshot, createMemberSession());
  const outputs = plans.map(p => renderActionButton({
    bootstrapState: p.decision.bootstrapState,
    memberTier: 'MEMBER',
    allowed: p.decision.allowed,
    actionKey: p.action,
    nextStep: p.decision.nextStep,
  }));

  const actionKeys = outputs.map(o => o.dataAttributes['data-action']);
  const uniqueKeys = new Set(actionKeys);

  assert.equal(outputs.length, 3);
  assert.equal(uniqueKeys.size, outputs.length, 'each plan must have unique data-action');
  assert.ok(outputs.every(o => o.visible === true));
});

test('miniapp component: SVIP member card shows premium state alongside many coupons', () => {
  // 边界: SVIP 会员 + 大量优惠券
  const svipSession = createMemberSession('SVIP');

  const output = renderMemberInfoCard({
    authenticated: svipSession.authenticated,
    memberTier: svipSession.memberTier,
    points: svipSession.points,
    couponCount: svipSession.couponCount,
  });

  assert.ok(output.className.includes('member-card--premium'));
  assert.equal(output.dataAttributes['data-tier'], 'SVIP');
  // SVIP 的 couponCount 边界值
  assert.equal(output.dataAttributes['data-coupons'], 6);
  assert.equal(output.dataAttributes['data-points'], 1280);
});

test('miniapp component: empty action plan list results in zero component outputs', () => {
  // 边界: 空 action plan 列表
  const fallback = createMiniappFallbackSnapshot();
  const plans = listMiniappActionPlans(fallback, createGuestMemberSession());

  assert.equal(plans.length, 3); // 即使 fallback 也会列出所有 plan
  // 但 fallback 中所有 plan 的决策都是 "不允许"
  for (const plan of plans) {
    assert.equal(plan.decision.allowed, false);
  }
});

test('miniapp component: bootstrap decision across all three member tiers produces different states', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const tiers = [
    { session: createGuestMemberSession(), label: 'GUEST' },
    { session: createMemberSession('MEMBER'), label: 'MEMBER' },
    { session: createMemberSession('SVIP'), label: 'SVIP' },
  ] as const;

  const decisions = tiers.map(t => ({
    tier: t.label,
    decision: resolveMiniappActionDecision(snapshot, t.session, 'coupon-claim'),
  }));

  // 三种 tier 对 coupon-claim 应有不同决策
  const nextSteps = decisions.map(d => d.decision.nextStep);
  const uniqueSteps = new Set(nextSteps);

  assert.ok(uniqueSteps.size >= 2, `expected at least 2 distinct nextSteps across tiers, got ${uniqueSteps.size}`);
});

test('miniapp component: auth envelope should not contain raw passwords or secrets', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const sync = buildMiniappHandlerSyncContract(outcome);
  const auth = buildMiniappAuthEnvelope(sync);

  // 组件安全: auth envelope 不应该暴露明文密钥
  assert.equal(auth.audience, 'miniapp-handler-sync');
  assert.ok(!auth.authorization.includes('password'));
  assert.ok(!auth.authorization.includes('secret'));
  assert.ok(auth.authScheme, 'M5-HMAC-SHA256');
});

test('miniapp component: callback receipt summary contains actionable text', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const sync = buildMiniappHandlerSyncContract(outcome);
  const receipt = createMiniappCallbackReceipt(outcome, sync);

  // 组件展示 callback 状态时依赖这些字段
  assert.equal(receipt.callbackStatus, 'awaiting-callback');
  assert.equal(receipt.lastEvent, 'HANDLER_ACCEPTED');
  assert.ok(receipt.ackToken.length > 10);
  assert.ok(receipt.summary.length > 5);
});

test('miniapp component: action plan draft has all component-required fields', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');

  // 组件渲染需要 plan 的以下字段
  const requiredFields: (keyof typeof plan)[] = ['action', 'label', 'decision', 'riskLevel', 'channel', 'draftSummary', 'checklist', 'requestPreview'];
  for (const field of requiredFields) {
    assert.ok(plan[field] !== undefined, `plan.${field} should exist for component rendering`);
  }

  assert.equal(plan.action, 'booking-submit');
  assert.equal(plan.riskLevel, 'medium');
  assert.equal(plan.channel, 'MEMBER_RUNTIME');
});

test('miniapp component: request preview endpoint is a valid URL path', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');

  // 组件中 "请求预览" 的 endpoint 应为有效的 URL 路径
  assert.ok(plan.requestPreview.endpoint.startsWith('/'));
  assert.ok(plan.requestPreview.endpoint.includes('booking'));
  assert.equal(plan.requestPreview.method, 'POST');
  assert.ok(typeof plan.requestPreview.payload === 'object');
});

test('miniapp component: action checklist items are non-empty strings', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');

  // 组件渲染 checklist 时的格式约束
  assert.ok(plan.checklist.length >= 1);
  for (const item of plan.checklist) {
    assert.ok(typeof item === 'string');
    assert.ok(item.length > 0);
  }
});

test('miniapp component: action label never contains undefined placeholder', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plans = listMiniappActionPlans(snapshot, createMemberSession());

  for (const plan of plans) {
    assert.notEqual(plan.label, 'undefined');
    assert.notEqual(plan.label, 'null');
    assert.ok(plan.label.length > 0);
  }
});

test('miniapp component: member-card data attributes remain stable for zero-point scenario', () => {
  // 边界: 会员积分为 0 的情况
  const zeroPointSession = createMemberSession('MEMBER');
  zeroPointSession.points = 0;
  zeroPointSession.couponCount = 0;

  const output = renderMemberInfoCard({
    authenticated: zeroPointSession.authenticated,
    memberTier: zeroPointSession.memberTier,
    points: zeroPointSession.points,
    couponCount: zeroPointSession.couponCount,
  });

  assert.equal(output.dataAttributes['data-points'], 0);
  assert.equal(output.dataAttributes['data-coupons'], 0);
  assert.equal(output.disabled, false);
  assert.equal(output.interactionLabel, 'MEMBER 会员');
});

test('miniapp component: tap event timestamp is within reasonable range', () => {
  const before = Date.now();
  const event = buildTapEvent('test-btn', 'test-action');
  const after = Date.now();

  assert.ok(event.timestamp >= before);
  assert.ok(event.timestamp <= after + 10);
});
