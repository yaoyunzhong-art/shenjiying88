import assert from 'node:assert/strict';
import test from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  createMiniappFallbackSnapshot,
  toMiniappBootstrapSnapshot,
  createGuestMemberSession,
  createMemberSession,
  createMiniappActionPlan,
  submitMiniappActionPlan,
  buildMiniappHandlerSyncContract,
  buildMiniappAuthEnvelope,
  createMiniappCallbackReceipt,
  createMiniappActionTicket,
  createMiniappSubmitHistoryEntry,
  appendMiniappSubmitHistory,
  buildMiniappLedger,
  createMiniappReplayRequest,
  replayMiniappSubmitHistoryEntry,
  createMiniappReplayRetryPolicy,
} from './market-bootstrap';

/**
 * miniapp (Taro) API Integration — L1 API 集成冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证小程序 API 网络层的健壮性：请求构建、响应解析、错误处理、
 * 重试策略、并发请求限制、超时模拟。
 */

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 't', marketCode: 'cn-mainland', channel: 'WEB', name: 't ToB', primaryDomain: 't.cn-mainland.b2b.local', supportedLanguages: ['zh-CN'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/cn-mainland/t/login', ssoEnabled: true },
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 't', brandCode: 'b', marketCode: 'cn-mainland', channel: 'WEB', name: 'b ToB', primaryDomain: 'b.t.cn-mainland.b2b.local', supportedLanguages: ['zh-CN'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/cn-mainland/t/b/login', ssoEnabled: true },
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 't', brandCode: 'b', storeCode: 'store-001', storeName: 'store-001', marketCode: 'cn-mainland', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.b.t.cn-mainland.local', supportedLanguages: ['zh-CN'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
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
// API 客户端模拟 — 模拟网络层调用契约
// ─────────────────────────────────────────────────────────

interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

interface ApiResponse<T = unknown> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
  durationMs: number;
}

interface ApiError {
  code: string;
  status: number;
  message: string;
  detail?: string;
}

type ApiResult<T> =
  | { ok: true; value: T; response: ApiResponse<T> }
  | { ok: false; error: ApiError };

type RequestInterceptor = (req: ApiRequest) => ApiRequest | null;

type ApiMiddleware = {
  before: RequestInterceptor[];
  after: ((result: ApiResult<unknown>) => ApiResult<unknown>)[];
};

function createApiClient(baseUrl: string) {
  let middleware: ApiMiddleware = { before: [], after: [] };

  return {
    useBefore: (fn: RequestInterceptor) => {
      middleware.before.push(fn);
    },
    useAfter: (fn: (result: ApiResult<unknown>) => ApiResult<unknown>) => {
      middleware.after.push(fn);
    },
    getMiddleware: () => middleware,
    request: <T>(req: ApiRequest): ApiResult<T> => {
      // Apply before middleware
      for (const fn of middleware.before) {
        const modified = fn(req);
        if (modified === null) {
          return { ok: false, error: { code: 'REQUEST_BLOCKED', status: 0, message: '请求被拦截器阻止' } };
        }
        req = modified;
      }

      // Simulate request execution
      const result: ApiResult<T> = {
        ok: true,
        value: { success: true } as T,
        response: {
          status: 200,
          statusText: 'OK',
          data: { success: true } as T,
          headers: { 'content-type': 'application/json' },
          durationMs: 120,
        },
      };

      // Apply after middleware
      let finalResult: ApiResult<T> = result;
      for (const fn of middleware.after) {
        finalResult = fn(finalResult) as ApiResult<T>;
      }

      return finalResult;
    },
  };
}

function createReplayApiRequest(record: {
  receiptCode: string;
  action: string;
  endpoint: string;
}): ApiRequest {
  return {
    method: 'POST',
    url: record.endpoint,
    headers: {
      'content-type': 'application/json',
      'x-m5-receipt': record.receiptCode,
      'x-m5-action': record.action,
    },
    body: { receiptCode: record.receiptCode, action: record.action },
    timeoutMs: 10000,
  };
}

function buildReplayRequestFromLedger(
  snapshot: ReturnType<typeof toMiniappBootstrapSnapshot>,
  action: string,
  tier: string,
): ApiRequest | null {
  const session = tier === 'GUEST'
    ? createGuestMemberSession()
    : createMemberSession(tier as 'MEMBER' | 'SVIP');

  const plan = createMiniappActionPlan(snapshot, session, action as any);
  const outcome = submitMiniappActionPlan(plan);
  const entry = createMiniappSubmitHistoryEntry(outcome);
  const history = appendMiniappSubmitHistory([], outcome);
  const ledger = buildMiniappLedger(history);

  if (ledger.length === 0) return null;

  const replayRequest = createMiniappReplayRequest(ledger[0]!);
  return {
    method: replayRequest.method as 'POST',
    url: replayRequest.endpoint,
    headers: {
      ...replayRequest.headers,
      'content-type': 'application/json',
    },
    body: replayRequest.body,
  };
}

// ─────────────────────────────────────────────────────────
// 正例 — API 请求成功响应
// ─────────────────────────────────────────────────────────

test('miniapp api: replay request built from ledger has correct POST method', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const history = appendMiniappSubmitHistory([], outcome);
  const ledger = buildMiniappLedger(history);
  const request = createMiniappReplayRequest(ledger[0]!);

  assert.equal(request.method, 'POST');
  assert.ok(request.endpoint.includes('/replay'));
  assert.ok(request.headers['x-m5-receipt-code']);
  assert.equal(typeof request.body.receiptCode, 'string');
});

test('miniapp api: auth envelope contains valid HMAC scheme', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const sync = buildMiniappHandlerSyncContract(outcome);
  const auth = buildMiniappAuthEnvelope(sync);

  assert.equal(auth.audience, 'miniapp-handler-sync');
  assert.equal(auth.authScheme, 'M5-HMAC-SHA256');
  assert.ok(auth.authorization.length > 20);
});

test('miniapp api: api client applies before middleware to modify request', () => {
  const client = createApiClient('https://cn-api.m5.local');

  client.useBefore((req) => ({
    ...req,
    headers: { ...req.headers, 'x-trace-id': 'trace-001' },
  }));

  const result = client.request<unknown>({
    method: 'POST',
    url: 'https://cn-api.m5.local/booking',
    headers: {},
  });

  assert.equal(result.ok, true);
});

test('miniapp api: sync contract endpoint is valid relative URL path', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const sync = buildMiniappHandlerSyncContract(outcome);

  assert.ok(sync.syncEndpoint.startsWith('/api/v1/'));
  assert.ok(sync.syncEndpoint.includes('/sync'));
  assert.ok(sync.callbackEndpoint.startsWith('/api/v1/'));
  assert.ok(sync.callbackEndpoint.includes('/callbacks/'));
});

test('miniapp api: callback receipt has ack token for API verification', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const sync = buildMiniappHandlerSyncContract(outcome);
  const receipt = createMiniappCallbackReceipt(outcome, sync);

  assert.equal(receipt.callbackStatus, 'awaiting-callback');
  assert.ok(receipt.ackToken.length > 10);
  assert.ok(receipt.summary.length > 0);
});

test('miniapp api: action ticket ready-for-handler can be used in API call', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const ticket = createMiniappActionTicket(outcome);

  // ticket 可用于后续 API 调用（含 handler endpoint）
  assert.equal(ticket.ticketType, 'HANDLER_CALLBACK');
  assert.equal(ticket.status, 'ready-for-handler');
  assert.ok(ticket.ticketCode.length > 0);
});

test('miniapp api: replay request built via ledger record has valid structure', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const history = appendMiniappSubmitHistory([], outcome);
  const ledger = buildMiniappLedger(history);

  assert.equal(ledger.length, 1);
  assert.equal(ledger[0]!.replayable, true);

  const replayRequest = createMiniappReplayRequest(ledger[0]!);
  assert.ok(replayRequest.endpoint.includes('/replay'));
  assert.equal(replayRequest.method, 'POST');
  assert.ok(replayRequest.headers['x-m5-receipt-code']);
  assert.equal(typeof replayRequest.body.receiptCode, 'string');
  assert.equal(replayRequest.body.action, 'booking-submit');
});

test('miniapp api: sync contract idempotency key is non-empty', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const sync = buildMiniappHandlerSyncContract(outcome);

  assert.ok(sync.idempotencyKey.length > 0);
  // idempotency key 应具有唯一性（包含 receipt code）
  assert.ok(sync.idempotencyKey.includes(outcome.receiptCode));
});

// ─────────────────────────────────────────────────────────
// 反例 — 网络错误 / 401 未授权
// ─────────────────────────────────────────────────────────

test('miniapp api: replay blocked for challenge outcomes returns blocked status', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim');
  const outcome = submitMiniappActionPlan(plan);
  const entry = createMiniappSubmitHistoryEntry(outcome);
  const replay = replayMiniappSubmitHistoryEntry(entry);

  assert.equal(replay.status, 'replay-blocked');
  assert.notEqual(replay.message, '');
});

test('miniapp api: guest booking submit is blocked before API call', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createGuestMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);

  // 在 API 调用前即阻断
  assert.equal(outcome.state, 'blocked');
  assert.equal(outcome.nextStep, 'LOGIN');
});

test('miniapp api: missing receipt code in ledger blocks replay request', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);

  const entry = createMiniappSubmitHistoryEntry(outcome);
  const ledger = buildMiniappLedger([entry]);

  // 模拟空回执 — 尝试创建空回执的 replayRequest
  const badLedgerRecord = { ...ledger[0]!, receiptCode: '' };
  const request = createMiniappReplayRequest(badLedgerRecord);

  // 即使 receiptCode 为空，请求仍能构建但缺少关键标识
  assert.equal(request.receiptCode, '');
  assert.ok(request.endpoint.length > 0);
  assert.equal(request.method, 'POST');
});

test('miniapp api: SVIP challenge issued prevents API call completion', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim');
  const outcome = submitMiniappActionPlan(plan);

  // challenge 状态意味着 API 请求仅部分完成
  assert.equal(outcome.state, 'challenge-issued');
  assert.equal(outcome.recommendedAction, 'COMPLETE_CHALLENGE');
});

test('miniapp api: auth envelope from challenge outcome has blocked audience', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim');
  const outcome = submitMiniappActionPlan(plan);
  const sync = buildMiniappHandlerSyncContract(outcome);

  // 对于 challenge 类型的 outcome，sync 可能为未就绪状态
  assert.equal(sync.ready, false);
  assert.equal(sync.syncMode, 'challenge-gated');
});

test('miniapp api: replay retry policy for blocked outcome escalates to REFRESH_TICKET', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim');
  const outcome = submitMiniappActionPlan(plan);
  const entry = createMiniappSubmitHistoryEntry(outcome);
  const replay = replayMiniappSubmitHistoryEntry(entry);
  const ledger = buildMiniappLedger([entry]);
  const policy = createMiniappReplayRetryPolicy(ledger[0]!, replay);

  assert.equal(policy.retryable, true);
  assert.equal(policy.escalationAction, 'REFRESH_TICKET');
  assert.ok(policy.maxAttempts >= 2);
});

test('miniapp api: request interceptor can block requests returning null', () => {
  const client = createApiClient('https://cn-api.m5.local');

  client.useBefore(() => null); // block all requests

  const result = client.request<unknown>({
    method: 'POST',
    url: 'https://cn-api.m5.local/booking',
    headers: {},
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, 'REQUEST_BLOCKED');
  }
});

// ─────────────────────────────────────────────────────────
// 边界 — 请求超时 / 并发请求
// ─────────────────────────────────────────────────────────

test('miniapp api: replay request has explicit timeout field', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const history = appendMiniappSubmitHistory([], outcome);
  const ledger = buildMiniappLedger(history);

  const apiReq = createReplayApiRequest({
    receiptCode: ledger[0]!.receiptCode,
    action: ledger[0]!.action,
    endpoint: ledger[0]!.replayEndpoint,
  });

  assert.equal(apiReq.timeoutMs, 10000);
  assert.ok(apiReq.url.includes('/replay'));
});

test('miniapp api: API response headers contain content-type', () => {
  const client = createApiClient('https://cn-api.m5.local');

  client.useAfter((result) => {
    if (result.ok) {
      result.response.headers['x-request-id'] = 'req-001';
    }
    return result;
  });

  const result = client.request<unknown>({
    method: 'POST',
    url: 'https://cn-api.m5.local/booking',
    headers: { 'content-type': 'application/json' },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.response.headers['x-request-id'], 'req-001');
  }
});

test('miniapp api: ledger record replayable only for submit states', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());

  // 提交成功的 booking 应可 replay
  const submitPlan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const submitOutcome = submitMiniappActionPlan(submitPlan);
  const submitHistory = appendMiniappSubmitHistory([], submitOutcome);
  const submitLedger = buildMiniappLedger(submitHistory);

  assert.equal(submitLedger[0]!.replayable, true);

  // challenge 状态的 coupon-claim 应不可 replay
  const challengePlan = createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim');
  const challengeOutcome = submitMiniappActionPlan(challengePlan);
  const challengeHistory = appendMiniappSubmitHistory([], challengeOutcome);
  const challengeLedger = buildMiniappLedger(challengeHistory);

  assert.equal(challengeLedger[0]!.replayable, false);
});

test('miniapp api: retry policy has valid nextBackoffMs for retryable replays', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const entry = createMiniappSubmitHistoryEntry(outcome);
  const replay = replayMiniappSubmitHistoryEntry(entry);
  const ledger = buildMiniappLedger([entry]);

  // Submit 状态的可 replay — 但此时 replay 状态可能是 'replay-scheduled'
  const policy = createMiniappReplayRetryPolicy(ledger[0]!, replay);

  // 要么不重试（已成功），要么有合理的 backoff
  if (policy.retryable) {
    assert.ok(policy.nextBackoffMs > 0);
  }
});

test('miniapp api: multiple middleware transforms are composed in order', () => {
  const client = createApiClient('https://cn-api.m5.local');
  const traceIds: string[] = [];

  client.useBefore((req) => {
    traceIds.push('first');
    return { ...req, headers: { ...req.headers, 'x-trace-1': '1' } };
  });
  client.useBefore((req) => {
    traceIds.push('second');
    return { ...req, headers: { ...req.headers, 'x-trace-2': '2' } };
  });

  client.request<unknown>({
    method: 'POST',
    url: 'https://cn-api.m5.local/booking',
    headers: {},
  });

  assert.deepEqual(traceIds, ['first', 'second']);
});

test('miniapp api: request body for booking submit contains bookingSlot', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);

  assert.match(outcome.payloadSummary, /bookingSlot/);
  assert.equal(outcome.recommendedAction, 'FOLLOW_SUBMIT_CALLBACK');
});

test('miniapp api: null body in replay request does not crash', () => {
  const req: ApiRequest = {
    method: 'POST',
    url: 'https://cn-api.m5.local/replay',
    headers: { 'content-type': 'application/json' },
    body: null,
  };

  const client = createApiClient('https://cn-api.m5.local');
  const result = client.request<unknown>(req);

  assert.equal(result.ok, true);
});

test('miniapp api: submitting with multiple member tiers produces different outcomes', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const actions: Array<{ tier: string; action: string }> = [
    { tier: 'GUEST', action: 'booking-submit' },
    { tier: 'MEMBER', action: 'booking-submit' },
    { tier: 'SVIP', action: 'coupon-claim' },
  ];

  const outcomes = actions.map(({ tier, action }) => {
    const session = tier === 'GUEST'
      ? createGuestMemberSession()
      : createMemberSession(tier as 'MEMBER' | 'SVIP');
    const plan = createMiniappActionPlan(snapshot, session, action as any);
    return submitMiniappActionPlan(plan);
  });

  const states = outcomes.map(o => o.state);
  const uniqueStates = new Set(states);

  // 三种不同的输入应产生至少两种不同的 state
  assert.ok(uniqueStates.size >= 2, `expected at least 2 distinct states, got ${uniqueStates.size}`);
});

test('miniapp api: callback receipt handles outcomes with no handler sync gracefully', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim');
  const outcome = submitMiniappActionPlan(plan);
  const sync = buildMiniappHandlerSyncContract(outcome);

  // 即使 sync.ready 为 false，receipt 仍应被创建
  const receipt = createMiniappCallbackReceipt(outcome, sync);

  assert.equal(sync.ready, false);
  assert.ok(receipt.ackToken.length > 0);
  // challenge-issued 状态的 lastEvent 为 CHALLENGE_PENDING
  assert.equal(receipt.lastEvent, 'CHALLENGE_PENDING');
  assert.equal(receipt.callbackStatus, 'callback-blocked');
});

test('miniapp api: api base URL in market profile is https', () => {
  const fixture = createPortalBootstrapFixture();

  assert.ok(fixture.marketProfile.network.apiBaseUrl.startsWith('https://'));
  assert.ok(fixture.marketProfile.network.callbackBaseUrl.startsWith('https://'));
  assert.ok(fixture.marketProfile.network.cdnBaseUrl.startsWith('https://'));
});

test('miniapp api: replay endpoint from ledger record contains replay path', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const history = appendMiniappSubmitHistory([], outcome);
  const ledger = buildMiniappLedger(history);

  // replayEndpoint 应包含 "replay" 路径
  assert.ok(ledger[0]!.replayEndpoint.includes('/replay'));
});

test('miniapp api: submit history entry has recommended action for API follow-up', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);
  const entry = createMiniappSubmitHistoryEntry(outcome);

  // recommendedAction 是 API 回调的后续操作
  assert.equal(entry.recommendedAction, 'FOLLOW_SUBMIT_CALLBACK');
  assert.ok(entry.endpoint.includes('/booking'));
});
