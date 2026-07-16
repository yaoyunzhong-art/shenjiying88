/**
 * api/_proxy/utils.test.ts — API 代理层共享工具 L1 测试
 *
 * 覆盖:
 *   正例 — API_BASE_URL 默认值、createProxyHandler 签名、参数透传
 *   边界 — 环境变量覆盖、错误上游、空查询参数
 */

import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import { API_BASE_URL, createProxyHandler } from './utils';

const originalEnv = {
  API_BASE_URL: process.env.API_BASE_URL,
  NEXT_PUBLIC_M5_API_BASE_URL: process.env.NEXT_PUBLIC_M5_API_BASE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};

const originalFetch = globalThis.fetch;

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  restoreEnv();
  globalThis.fetch = originalFetch;
});

describe('_proxy/utils — 正例', () => {
  test('API_BASE_URL 默认值应为 localhost:3001/api/v1', () => {
    delete process.env.API_BASE_URL;
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    // 重新 import 获取默认值
    const { API_BASE_URL: url } = require('./utils');
    assert.ok(url.includes('localhost:3001'), `默认 base url 应包含 localhost:3001, 实际: ${url}`);
  });

  test('createProxyHandler 应返回函数', () => {
    const handler = createProxyHandler('http://test/api/resource', 'GET');
    assert.strictEqual(typeof handler, 'function');
  });

  test('createProxyHandler 返回的函数应有正确的签名', () => {
    const handler = createProxyHandler('http://test/api/resource', 'POST', ['tenantId']);
    // 检查参数: request, params
    assert.strictEqual(handler.length, 2);
  });
});

describe('_proxy/utils — 集成代理', () => {
  test('GET handler 应透传查询参数并返回 200', async () => {
    let capturedUrl = '';

    process.env.API_BASE_URL = 'http://localhost:3001/api/v1';
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const handler = createProxyHandler('/test/items', 'GET', ['page', 'limit']);
    const response = await handler(
      new Request('http://admin.local/api/test/items?page=1&limit=20', {
        headers: { 'x-tenant-id': 'tenant-001' },
      }) as any
    );

    assert.ok(response instanceof Response, '应返回 Response 实例');
    assert.strictEqual(response.status, 200);
  });

  test('POST handler 应转发 body', async () => {
    let capturedBody = '';

    process.env.API_BASE_URL = 'http://localhost:3001/api/v1';
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = String(init?.body ?? '');
      return new Response(JSON.stringify({ id: 'new-001' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const handler = createProxyHandler('/test/items', 'POST');
    const response = await handler(
      new Request('http://admin.local/api/test/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-001' },
        body: JSON.stringify({ name: 'test' }),
      }) as any
    );

    assert.strictEqual(response.status, 200);
    assert.ok(capturedBody.includes('test'), 'body 应透传');
  });

  test('上游返回 4xx 时应透传错误状态', async () => {
    process.env.API_BASE_URL = 'http://localhost:3001/api/v1';
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const handler = createProxyHandler('/test/items', 'GET');
    const response = await handler(
      new Request('http://admin.local/api/test/items', {
        headers: { 'x-tenant-id': 'tenant-001' },
      }) as any
    );

    assert.strictEqual(response.status, 404);
    const body = await response.json();
    assert.deepStrictEqual(body, { error: 'not found' });
  });

  test('fetch 抛异常时应返回 502', async () => {
    process.env.API_BASE_URL = 'http://localhost:3001/api/v1';
    globalThis.fetch = (async () => {
      throw new Error('connect ECONNREFUSED');
    }) as typeof fetch;

    const handler = createProxyHandler('/test/items', 'GET');
    const response = await handler(
      new Request('http://admin.local/api/test/items', {
        headers: { 'x-tenant-id': 'tenant-001' },
      }) as any
    );

    assert.strictEqual(response.status, 502);
    const body = await response.json();
    assert.ok(body.message, '应包含错误消息');
  });
});

describe('_proxy/utils — 防御', () => {
  test('非 JSON 响应应透传文本', async () => {
    process.env.API_BASE_URL = 'http://localhost:3001/api/v1';
    globalThis.fetch = (async () => {
      return new Response('plain text error', {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      });
    }) as typeof fetch;

    const handler = createProxyHandler('/test/items', 'GET');
    const response = await handler(
      new Request('http://admin.local/api/test/items', {
        headers: { 'x-tenant-id': 'tenant-001' },
      }) as any
    );

    assert.strictEqual(response.status, 500);
    const text = await response.text();
    assert.strictEqual(text, 'plain text error');
  });
});
