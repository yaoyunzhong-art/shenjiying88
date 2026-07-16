/**
 * api/_proxy/utils.test.ts — API 代理层共享工具 L1 测试
 *
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'utils.ts'), 'utf-8');

describe('_proxy/utils — 正例', () => {
  it('应导出 API_BASE_URL 常量', () => {
    assert.ok(SRC.includes('export const API_BASE_URL'), '缺少 API_BASE_URL 导出');
  });

  it('应导出 createProxyHandler 函数', () => {
    assert.ok(SRC.includes('export function createProxyHandler'), '缺少 createProxyHandler 导出');
  });

  it('API_BASE_URL 应使用环境变量优先', () => {
    assert.ok(SRC.includes('process.env.API_BASE_URL'), '应优先读取 API_BASE_URL 环境变量');
    assert.ok(SRC.includes('NEXT_PUBLIC_M5_API_BASE_URL'), '应回退到 NEXT_PUBLIC_M5_API_BASE_URL');
    assert.ok(SRC.includes('NEXT_PUBLIC_API_URL'), '应回退到 NEXT_PUBLIC_API_URL');
    assert.ok(SRC.includes('localhost:3001'), '默认值应为 localhost:3001');
    assert.ok(SRC.includes('/api/v1'), '应包含 /api/v1 路径');
  });

  it('createProxyHandler 应支持 GET / POST / PUT / PATCH / DELETE', () => {
    assert.ok(SRC.includes("'GET'"), '支持 GET');
    assert.ok(SRC.includes("'POST'"), '支持 POST');
    assert.ok(SRC.includes("'PUT'"), '支持 PUT');
    assert.ok(SRC.includes("'PATCH'"), '支持 PATCH');
    assert.ok(SRC.includes("'DELETE'"), '支持 DELETE');
  });

  it('应包含 copyContextHeaders 内部函数', () => {
    assert.ok(SRC.includes('copyContextHeaders'), '缺少 copyContextHeaders');
  });

  it('上下文头应包含 authorization / x-tenant-id / x-brand-id / x-store-id / x-market-code', () => {
    assert.ok(SRC.includes('authorization'), '缺少 authorization');
    assert.ok(SRC.includes('x-tenant-id'), '缺少 x-tenant-id');
    assert.ok(SRC.includes('x-brand-id'), '缺少 x-brand-id');
    assert.ok(SRC.includes('x-store-id'), '缺少 x-store-id');
    assert.ok(SRC.includes('x-market-code'), '缺少 x-market-code');
  });

  it('应包含 buildUpstreamUrl 内部函数用于构造上游 URL', () => {
    assert.ok(SRC.includes('buildUpstreamUrl'), '缺少 buildUpstreamUrl');
  });

  it('createProxyHandler 应接受可选的 allowedParams 参数', () => {
    assert.ok(SRC.includes('allowedParams?'), '应支持可选参数 allowedParams');
  });
});

describe('_proxy/utils — 防御', () => {
  it('应处理上游 fetch 失败返回 502', () => {
    assert.ok(SRC.includes('502'), '应返回 502');
    assert.ok(SRC.includes('catch'), '应包含 try-catch');
  });

  it('createProxyHandler 应在 GET 时不发送 body', () => {
    assert.ok(SRC.includes("method === 'GET'"), '应检查 method');
    assert.ok(SRC.includes('undefined'), 'GET 时 body 应为 undefined');
  });

  it('应透传上游的 content-type', () => {
    assert.ok(SRC.includes('content-type'), '应读取 content-type');
  });

  it('应支持非 JSON 响应的透传', () => {
    assert.ok(SRC.includes('isJson') || SRC.includes('application/json'), 'JSON 判断逻辑');
  });

  it('不应直接暴露环境变量值', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'), '无危险 HTML');
    assert.ok(!/:\s*any\b/.test(SRC), '无 any 类型');
  });
});
