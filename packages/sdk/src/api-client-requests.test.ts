/**
 * api-client-requests.test.ts — SDK ApiClient HTTP 请求与数据转换深度测试
 *
 * 覆盖 index.test.ts 未涉及的路由:
 * - get/put/patch/delete 四种 HTTP 方法
 * - 查询字符串构建
 * - 告警生命周期端点
 * - 配置治理端点
 * - 错误处理 (ApiError)
 * - 数据脱敏/Headers
 * - 边界值与空值处理
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  FoundationAlertMutationResponse,
  FoundationAlertDrilldownResponse,
  RuntimeGovernanceReceipt,
} from '@m5/types';
import { ApiClient, buildActorHeaders, ApiError } from './index';

// ─── Helpers ──────────────────────────────────────────────────────────

/** 全局 fetch mock 栈 */
type FetchCall = { url: string; method: string; headers: Record<string, string>; body?: string };

function createMockFetch(
  responseMap: Record<string, { status?: number; data?: unknown; error?: { message: string; code?: string; i18nKey?: string } }>,
) {
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = String(init?.method ?? 'GET');
    let body: string | undefined;
    if (typeof init?.body === 'string') body = init.body;
    calls.push({ url, method, headers: (init?.headers ?? {}) as Record<string, string>, body });

    const match = responseMap[`${method}:${url}`] ?? responseMap[url];
    if (!match) {
      return new Response(JSON.stringify({ success: false, message: 'Not Found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (match.error) {
      const status = match.status ?? 403;
      return new Response(
        JSON.stringify({
          success: false,
          message: match.error.message,
          code: match.error.code,
          i18nKey: match.error.i18nKey,
          statusCode: status,
        }),
        { status, headers: { 'content-type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: match.data,
        timestamp: new Date().toISOString(),
      }),
      { status: match.status ?? 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;
  return calls;
}

function createClient(overrides?: Record<string, string>) {
  return new ApiClient({
    baseUrl: 'http://localhost:3001/api/v1',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    ...overrides,
  });
}

// =====================================================================
// 测试
// =====================================================================

describe('ApiClient — GET 请求', () => {
  it('getFoundationBootstrap 发送正确路径', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/bootstrap': { data: { tenantContext: { tenantId: 'T001' } } },
    });
    const client = createClient();
    const result = await client.getFoundationBootstrap();
    assert.ok(result.tenantContext != null);
    assert.equal(calls[0]?.url, 'http://localhost:3001/api/v1/foundation/bootstrap');
    assert.equal(calls[0]?.method, 'GET');
  });

  it('getPortalDomainGovernanceSummary 发送正确路径', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/portals/domain-governance': { data: { requiresAttention: false, lastEvaluatedAt: '2026-07-22T00:00:00Z', totalMissingPrimaryScopes: 0, totalActiveWithoutPrimaryDomains: 0, recommendedReadyScopes: 0, tenantMissingPrimaryScopes: 0, brandMissingPrimaryScopes: 0, storeMissingPrimaryScopes: 0, currentScopes: [] } },
    });
    const client = createClient();
    const result = await client.getPortalDomainGovernanceSummary();
    assert.equal(result.requiresAttention, false);
    assert.equal(calls[0]?.method, 'GET');
  });

  it('getConfigurationGovernanceSnapshot 拼接 query 参数', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/configuration-governance/snapshot?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland':
        { data: { snapshotId: 'ss-001', scopeChain: {}, context: {}, config: {}, featureFlags: [], secrets: [], checksum: 'abc' } },
    });
    const client = createClient();
    const result = await client.getConfigurationGovernanceSnapshot({
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      marketCode: 'cn-mainland',
    });
    assert.equal(result.snapshotId, 'ss-001');
  });

  it('listObservabilitySignals 拼接 status query', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/resilience-operations/observability?status=degraded':
        { data: [{ signal: 'metrics', status: 'degraded', coverage: 95, collectionLagSeconds: 30, lastCollectedAt: '2026-07-22T00:00:00Z', owner: 'ops', alertRoutes: [], evidence: [] }] },
    });
    const client = createClient();
    const result = await client.listObservabilitySignals({ status: 'degraded' });
    assert.equal(result.length, 1);
    assert.equal(result[0]?.signal, 'metrics');
  });

  it('listResilienceRecoveryPlans 拼接 status query', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/resilience-operations/recovery-plans?status=attention':
        { data: [{ resource: 'plan-001', status: 'attention', rtoMinutes: 60, rpoMinutes: 15, lastDrillAt: '2026-07-22T00:00:00Z', staleAfterDays: 30, dependencies: [] }] },
    });
    const client = createClient();
    const result = await client.listResilienceRecoveryPlans({ status: 'attention' });
    assert.equal(result.length, 1);
    assert.equal(result[0]?.resource, 'plan-001');
  });

  it('describeResilienceRecoveryPlan 编码 resource 参数', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/resilience-operations/recovery-plans/database%2Ftenant-demo':
        { data: { status: 'ready', resource: 'database/tenant-demo', baseline: [], plan: null } },
    });
    const client = createClient();
    const result = await client.describeResilienceRecoveryPlan('database/tenant-demo');
    assert.equal(result.status, 'ready');
    assert.equal(result.resource, 'database/tenant-demo');
  });

  it('getFoundationAlertDrilldown 发送正确路径', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/overview/alerts/observability-degradation/drilldown':
        { data: { alert: { code: 'observability-degradation', summary: 'drilldown' }, history: [], acknowledgement: { status: 'UNACKED' } } },
    });
    const client = createClient();
    const result = await client.getFoundationAlertDrilldown('observability-degradation');
    assert.equal(result.alert?.code, 'observability-degradation');
    assert.equal(calls[0]?.method, 'GET');
  });
});

describe('ApiClient — POST 请求', () => {
  it('batchReplayRuntimeGovernanceActions 发送正确数据', async () => {
    const calls = createMockFetch({
      'POST:http://localhost:3001/api/v1/foundation/runtime-governance/actions/batch-replay':
        { data: { results: [{ receiptCode: 'rc-001', status: 'replayed' }], total: 1 } },
    });
    const client = createClient();
    const result = await client.batchReplayRuntimeGovernanceActions({
      items: [{ receiptCode: 'rc-001', ledgerKey: 'ledger-001', requestedFrom: 'ADMIN_WEB_RUNTIME', ticketCode: 'tc-001', idempotencyKey: 'batch-replay-001' }],
    });
    assert.equal(result.total, 1);
    assert.match(calls[0]?.body ?? '', /receiptCode/);
  });

  it('stageResilienceEdgeReplay 发送正确数据', async () => {
    const calls = createMockFetch({
      'POST:http://localhost:3001/api/v1/foundation/resilience-operations/edge-replay/stage':
        { data: { status: 'staged', storeId: 'store-001', operationCount: 5, replayPipeline: [], observabilityHooks: [] } },
    });
    const client = createClient();
    const result = await client.stageResilienceEdgeReplay({
      storeId: 'store-001',
      operationCount: 5,
    });
    assert.equal(result.storeId, 'store-001');
    assert.equal(calls[0]?.method, 'POST');
  });

  it('ingestIntegrationWebhook 编码 source 并发送 body', async () => {
    const calls = createMockFetch({
      'POST:http://localhost:3001/api/v1/foundation/integration-orchestration/webhooks/shopify/ingest':
        { data: { status: 'accepted', source: 'shopify', signatureVerified: true, idempotency: { key: 'ingest-001', firstSeenAt: '2026-07-22T00:00:00Z' }, pipeline: ['webhook'] } },
    });
    const client = createClient();
    const result = await client.ingestIntegrationWebhook('shopify', {
      payload: { event: 'order.created' },
      signature: 'sha256-abc',
      timestamp: '2026-07-22T00:00:00Z',
    });
    assert.equal(result.status, 'accepted');
    assert.match(calls[0]?.body ?? '', /order.created/);
  });

  it('publishIntegrationEvent 发送正确 body', async () => {
    const calls = createMockFetch({
      'POST:http://localhost:3001/api/v1/foundation/integration-orchestration/events':
        { data: { status: 'accepted', envelope: { eventId: 'evt-001', eventName: 'order.created', source: 'lyt', payload: {}, timestamp: '2026-07-22T00:00:00Z' }, persistedEventId: 'evt-001', guarantees: ['at-least-once'] } },
    });
    const client = createClient();
    const result = await client.publishIntegrationEvent({
      source: 'lyt',
      eventName: 'order.created',
      payload: { orderId: 'ord-001' },
      idempotencyKey: 'evt-001',
    });
    assert.equal(result.persistedEventId, 'evt-001');
  });

  it('acknowledgeFoundationAlert 附带 note body', async () => {
    const calls = createMockFetch({
      'POST:http://localhost:3001/api/v1/foundation/overview/alerts/alert-001/ack':
        { data: { code: 'alert-001', acknowledgement: { status: 'ACKED', note: 'handled' } } },
    });
    const client = createClient();
    const result = await client.acknowledgeFoundationAlert('alert-001', { note: 'handled' });
    assert.equal(result.acknowledgement?.status, 'ACKED');
    assert.match(calls[0]?.body ?? '', /handled/);
  });

  it('muteFoundationAlert 附带 mutedUntil', async () => {
    const calls = createMockFetch({
      'POST:http://localhost:3001/api/v1/foundation/overview/alerts/alert-001/mute':
        { data: { code: 'alert-001', acknowledgement: { status: 'MUTED', note: 'muted' } } },
    });
    const client = createClient();
    const result = await client.muteFoundationAlert('alert-001', {
      note: 'muted',
      mutedUntil: '2026-07-23T10:00:00Z',
    });
    assert.equal(result.acknowledgement?.status, 'MUTED');
    assert.match(calls[0]?.body ?? '', /2026-07-23/);
  });

  it('unmuteFoundationAlert 发送请求', async () => {
    const calls = createMockFetch({
      'POST:http://localhost:3001/api/v1/foundation/overview/alerts/alert-001/unmute':
        { data: { code: 'alert-001', acknowledgement: { status: 'ACKED', note: 'restored' } } },
    });
    const client = createClient();
    const result = await client.unmuteFoundationAlert('alert-001', { note: 'restored' });
    assert.equal(result.acknowledgement?.status, 'ACKED');
  });
});

describe('ApiClient — PUT 请求', () => {
  it('putData 更新 agent config', async () => {
    const calls = createMockFetch({
      'PUT:http://localhost:3001/api/v1/agent/configs/agent-001':
        { data: { id: 'agent-001', name: 'Updated Agent' } },
    });
    const client = createClient();
    const result = await client.updateAgentConfig('agent-001', { name: 'Updated Agent' });
    assert.equal(result.name, 'Updated Agent');
    assert.equal(calls[0]?.method, 'PUT');
    assert.match(calls[0]?.body ?? '', /Updated Agent/);
  });
});

describe('ApiClient — DELETE 请求', () => {
  it('deleteData 删除 agent config', async () => {
    const calls = createMockFetch({
      'DELETE:http://localhost:3001/api/v1/agent/configs/agent-001':
        { data: { deleted: true } },
    });
    const client = createClient();
    const result = await client.deleteAgentConfig('agent-001');
    assert.equal(result.deleted, true);
    assert.equal(calls[0]?.method, 'DELETE');
  });
});

describe('ApiError — 错误处理', () => {
  it('403 响应抛出 ApiError 含 status', async () => {
    createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/bootstrap': {
        status: 403,
        error: { message: 'Forbidden', code: 'FORBIDDEN' },
      },
    });
    const client = createClient();
    await assert.rejects(
      () => client.getFoundationBootstrap(),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 403);
        assert.equal(err.message, 'Forbidden');
        assert.equal(err.code, 'FORBIDDEN');
        return true;
      },
    );
  });

  it('500 响应带 i18nKey', async () => {
    createMockFetch({
      'GET:http://localhost:3001/api/v1/markets/bootstrap': {
        status: 500,
        error: { message: 'Internal Server Error', code: 'INTERNAL', i18nKey: 'error.internal_server_error' },
      },
    });
    const client = createClient();
    await assert.rejects(
      () => client.getMarketBootstrap(),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 500);
        assert.equal(err.i18nKey, 'error.internal_server_error');
        return true;
      },
    );
  });

  it('非 JSON 错误体回退到状态码消息', async () => {
    globalThis.fetch = (async () => new Response('Internal Server Error', { status: 502 })) as typeof fetch;
    const client = createClient();
    await assert.rejects(
      () => client.getFoundationBootstrap(),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 502);
        assert.equal(err.message, 'Request failed with status 502');
        return true;
      },
    );
  });
});

describe('buildActorHeaders — Headers 构建', () => {
  it('全参数构建完整的 actor headers', () => {
    const headers = buildActorHeaders({
      actorId: 'user-001',
      actorType: 'employee-user',
      actorName: '张三',
      tenantId: 'T001',
      brandId: 'B001',
      storeId: 'S001',
      roles: ['STORE_MANAGER', 'OPERATIONS'],
      permissions: ['order:write', 'order:read'],
      authenticated: true,
    });
    assert.equal(headers['x-actor-id'], 'user-001');
    assert.equal(headers['x-actor-type'], 'employee-user');
    assert.equal(headers['x-actor-name'], '张三');
    assert.equal(headers['x-actor-roles'], 'STORE_MANAGER,OPERATIONS');
    assert.equal(headers['x-roles'], 'STORE_MANAGER,OPERATIONS');
    assert.equal(headers['x-actor-permissions'], 'order:write,order:read');
    assert.equal(headers['x-permissions'], 'order:write,order:read');
    assert.equal(headers['x-actor-authenticated'], 'true');
  });

  it('最小参数只包含必填', () => {
    const headers = buildActorHeaders({ actorId: 'user-001' });
    assert.equal(headers['x-actor-id'], 'user-001');
    assert.equal(headers['x-actor-roles'], undefined);
    assert.equal(headers['x-actor-authenticated'], undefined);
  });

  it('roles 做去重和 trim（大小写不同时视为不同）', () => {
    const headers = buildActorHeaders({
      actorId: 'user-001',
      roles: [' ADMIN ', 'admin', '  ADMIN '],
    });
    // ' ADMIN ' -> 'ADMIN', 'admin' -> 'admin', '  ADMIN ' -> 'ADMIN'
    // Set dedup: 'ADMIN' 和 'admin' 大小写不同，保留两个
    const vals = (headers['x-actor-roles'] ?? '').split(',').sort();
    assert.deepEqual(vals, ['ADMIN', 'admin']);
  });

  it('permissions 做去重和 trim', () => {
    const headers = buildActorHeaders({
      actorId: 'user-001',
      permissions: [' order:read ', 'order:read'],
    });
    assert.equal(headers['x-actor-permissions'], 'order:read');
    assert.equal(headers['x-permissions'], 'order:read');
  });

  it('authenticated=false 正确序列化', () => {
    const headers = buildActorHeaders({
      actorId: 'user-001',
      authenticated: false,
    });
    assert.equal(headers['x-actor-authenticated'], 'false');
  });
});

describe('ApiClient — getFoundationModuleDetail', () => {
  it('获取模块详情', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/overview/modules/portal':
        { data: { generatedAt: '2026-07-22T00:00:00Z', moduleKey: 'portal', health: { module: 'portal', score: 85, status: 'healthy', indicators: { highRiskAudits: 0, pendingApprovals: 1, executionFailures: 0, blockedCount: 0 } } } },
    });
    const client = createClient();
    const result = await client.getFoundationModuleDetail('portal');
    assert.equal(result.moduleKey, 'portal');
    assert.equal(result.health?.score, 85);
    assert.equal(result.health?.status, 'healthy');
    assert.equal(calls[0]?.method, 'GET');
  });
});

describe('ApiClient — 空/边界值', () => {
  it('无 token、无 scope headers 时只发送基础 headers', async () => {
    const calls: FetchCall[] = [];
    globalThis.fetch = (async (_input, init) => {
      calls.push({
        url: String(_input),
        method: String(init?.method ?? 'GET'),
        headers: (init?.headers ?? {}) as Record<string, string>,
      });
      return new Response(
        JSON.stringify({ success: true, data: {}, timestamp: new Date().toISOString() }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;

    const minimalClient = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1' });
    await minimalClient.getWorkbenchBootstrap();
    assert.equal(calls[0]?.headers?.['x-tenant-id'], undefined);
    assert.equal(calls[0]?.headers?.['Authorization'], undefined);
    assert.equal(calls[0]?.headers?.['content-type'], undefined);
  });

  it('空 search query 参数不附加', async () => {
    const calls: FetchCall[] = [];
    globalThis.fetch = (async (input) => {
      calls.push({ url: String(input), method: 'GET', headers: {} });
      return new Response(
        JSON.stringify({ success: true, data: [], timestamp: new Date().toISOString() }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;

    const client = createClient();
    await client.listObservabilitySignals({});
    // 没有 status 参数时不应拼接到 url
    assert.ok(!calls[0]?.url.includes('status='));
  });
});

describe('ApiClient — 配置治理端点', () => {
  it('listConfigurationFeatureFlags 拼接 query', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/configuration-governance/feature-flag-records?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland':
        { data: [{ key: 'ff-001', name: 'New Checkout', enabled: true }] },
    });
    const client = createClient();
    const result = await client.listConfigurationFeatureFlags({
      tenantId: 'tenant-demo', brandId: 'brand-demo', storeId: 'store-001', marketCode: 'cn-mainland',
    });
    assert.equal(result.length, 1);
    assert.equal(result[0]?.key, 'ff-001');
  });

  it('listConfigurationSecrets 发送 GET', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/configuration-governance/secrets':
        { data: [{ name: 'api-key-1', status: 'active' }] },
    });
    const client = createClient();
    const result = await client.listConfigurationSecrets();
    assert.equal(result.length, 1);
    assert.equal(result[0]?.name, 'api-key-1');
  });

  it('listConfigurationCertificates 发送 GET', async () => {
    const calls = createMockFetch({
      'GET:http://localhost:3001/api/v1/foundation/configuration-governance/certificates':
        { data: [{ name: 'wildcard', format: 'PEM' }] },
    });
    const client = createClient();
    const result = await client.listConfigurationCertificates();
    assert.equal(result.length, 1);
    assert.equal(result[0]?.name, 'wildcard');
  });
});
