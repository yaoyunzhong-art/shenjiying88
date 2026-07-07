import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * span-attributes.test.ts - Phase-22 T67
 * Span 数据模型单元测试 (rpc/db/http/cache)
 */
import assert from 'node:assert/strict';
import {
  ATTR_KEYS,
  applyBusinessContext,
  setRpcSpan,
  setDbSpan,
  setHttpSpan,
  setCacheSpan,
  buildSpanName,
  recommendSpanKind,
} from './span-attributes';

// 用 mock Span 记录 setAttribute 调用
function createMockSpan(): { attrs: Record<string, unknown>; status: { code?: number; message?: string }; setAttribute: (k: string, v: unknown) => void; setStatus: (s: { code: number; message?: string }) => void } {
  const attrs: Record<string, unknown> = {};
  const status: { code?: number; message?: string } = {};
  return {
    attrs,
    status,
    setAttribute: (k, v) => { attrs[k] = v; },
    setStatus: (s) => { status.code = s.code; status.message = s.message; },
  };
}

describe('span-attributes · rpc span', () => {
  it('setRpcSpan 填充 system/service/method', () => {
    const span = createMockSpan();
    setRpcSpan(span as never, { service: 'cashier', method: 'createOrder' });
    assert.equal(span.attrs[ATTR_KEYS.RPC_SYSTEM], 'nestjs');
    assert.equal(span.attrs[ATTR_KEYS.RPC_SERVICE], 'cashier');
    assert.equal(span.attrs[ATTR_KEYS.RPC_METHOD], 'createOrder');
  });
});

describe('span-attributes · db span', () => {
  it('setDbSpan 填充 system/operation/table', () => {
    const span = createMockSpan();
    setDbSpan(span as never, { system: 'postgresql', operation: 'INSERT', table: 'orders' });
    assert.equal(span.attrs[ATTR_KEYS.DB_SYSTEM], 'postgresql');
    assert.equal(span.attrs[ATTR_KEYS.DB_OPERATION], 'INSERT');
    assert.equal(span.attrs[ATTR_KEYS.DB_SQL_TABLE], 'orders');
  });

  it('Redis 操作: operation=findMany', () => {
    const span = createMockSpan();
    setDbSpan(span as never, { system: 'redis', operation: 'findMany' });
    assert.equal(span.attrs[ATTR_KEYS.DB_SYSTEM], 'redis');
    assert.equal(span.attrs[ATTR_KEYS.DB_OPERATION], 'findMany');
  });
});

describe('span-attributes · http span', () => {
  it('setHttpSpan 正常请求 200', () => {
    const span = createMockSpan();
    setHttpSpan(span as never, { method: 'POST', url: '/api/v1/orders', statusCode: 200 });
    assert.equal(span.attrs[ATTR_KEYS.HTTP_METHOD], 'POST');
    assert.equal(span.attrs[ATTR_KEYS.HTTP_STATUS_CODE], 200);
  });

  it('setHttpSpan 5xx 自动 setStatus(ERROR)', () => {
    const span = createMockSpan();
    setHttpSpan(span as never, { method: 'GET', statusCode: 503 });
    assert.equal(span.status.code, 2); // ERROR
  });

  it('sanitizeUrl 移除敏感 query 参数', () => {
    const span = createMockSpan();
    setHttpSpan(span as never, {
      method: 'GET',
      url: 'https://api.example.com/v1?token=abc123&page=1',
    });
    const sanitized = span.attrs[ATTR_KEYS.HTTP_URL] as string;
    // URL 会被 encode,所以 [REDACTED] → %5BREDACTED%5D
    assert.ok(
      sanitized.includes('[REDACTED]') || sanitized.includes('%5BREDACTED%5D'),
      `应 redact token,实际: ${sanitized}`,
    );
    assert.ok(sanitized.includes('page=1'), `应保留正常参数 page=1,实际: ${sanitized}`);
    assert.ok(!sanitized.includes('abc123'), `不应泄漏 token 值`);
  });
});

describe('span-attributes · cache span', () => {
  it('setCacheSpan 缓存命中', () => {
    const span = createMockSpan();
    setCacheSpan(span as never, { system: 'redis', key: 'user:123', hit: true });
    assert.equal(span.attrs[ATTR_KEYS.CACHE_SYSTEM], 'redis');
    assert.equal(span.attrs[ATTR_KEYS.CACHE_KEY], 'user:123');
    assert.equal(span.attrs[ATTR_KEYS.CACHE_HIT], true);
  });

  it('setCacheSpan 缓存未命中', () => {
    const span = createMockSpan();
    setCacheSpan(span as never, { system: 'memory', key: 'session:abc', hit: false });
    assert.equal(span.attrs[ATTR_KEYS.CACHE_HIT], false);
  });
});

describe('span-attributes · business context', () => {
  it('applyBusinessContext 填充 tenant/brand/store/user', () => {
    const span = createMockSpan();
    applyBusinessContext(span as never, {
      tenantId: 't-A',
      brandId: 'b-X',
      storeId: 's-1',
      userId: 'u-9',
    });
    assert.equal(span.attrs[ATTR_KEYS.TENANT_ID], 't-A');
    assert.equal(span.attrs[ATTR_KEYS.BRAND_ID], 'b-X');
    assert.equal(span.attrs[ATTR_KEYS.STORE_ID], 's-1');
    assert.equal(span.attrs[ATTR_KEYS.USER_ID], 'u-9');
  });

  it('applyBusinessContext 跳过 undefined 字段', () => {
    const span = createMockSpan();
    applyBusinessContext(span as never, { tenantId: 't-A' });
    assert.equal(span.attrs[ATTR_KEYS.TENANT_ID], 't-A');
    assert.equal(span.attrs[ATTR_KEYS.BRAND_ID], undefined);
  });
});

describe('span-attributes · name conventions', () => {
  it('buildSpanName 拼接 rpc service.method', () => {
    assert.equal(buildSpanName('rpc', ['cashier', 'createOrder']), 'cashier.createOrder');
  });

  it('buildSpanName 拼接 db table.op', () => {
    assert.equal(buildSpanName('db', ['pg', 'orders', 'insert']), 'pg.orders.insert');
  });

  it('buildSpanName 过滤空字符串', () => {
    assert.equal(buildSpanName('http', ['', 'GET', '/orders']), 'GET./orders');
  });
});

describe('span-attributes · recommendSpanKind', () => {
  it('rpc → CLIENT', () => {
    assert.equal(recommendSpanKind('rpc'), 2 /* CLIENT */);
  });
  it('db → CLIENT', () => {
    assert.equal(recommendSpanKind('db'), 2 /* CLIENT */);
  });
});
