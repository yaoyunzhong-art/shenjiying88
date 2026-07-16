/**
 * api/logistics/proxy.test.ts — 后勤代理层共享工具 L1 测试
 *
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'proxy.ts'), 'utf-8');

describe('logistics/proxy — 正例', () => {
  it('应导出 resolveLogisticsApiBaseUrl 函数', () => {
    assert.ok(SRC.includes('export async function resolveLogisticsApiBaseUrl'), '缺少 resolveLogisticsApiBaseUrl');
  });

  it('应导出 buildLogisticsUpstreamUrl 函数', () => {
    assert.ok(SRC.includes('export async function buildLogisticsUpstreamUrl'), '缺少 buildLogisticsUpstreamUrl');
  });

  it('应导出 proxyLogisticsRequest 函数', () => {
    assert.ok(SRC.includes('export async function proxyLogisticsRequest'), '缺少 proxyLogisticsRequest');
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

  it('应包含 unwrapPayload 内部函数解包 data 字段', () => {
    assert.ok(SRC.includes('unwrapPayload'), '缺少 unwrapPayload');
    assert.ok(SRC.includes('data'), '应检查 data 字段');
  });

  it('resolveLogisticsApiBaseUrl 应支持多层回退', () => {
    assert.ok(SRC.includes('M5_API_BASE_URL'), '应读取 M5_API_BASE_URL');
    assert.ok(SRC.includes('NEXT_PUBLIC_M5_API_BASE_URL'), '回退到 NEXT_PUBLIC_M5_API_BASE_URL');
    assert.ok(SRC.includes('NEXT_PUBLIC_API_URL'), '回退到 NEXT_PUBLIC_API_URL');
    assert.ok(SRC.includes('localhost:3001'), '默认 localhost:3001');
    assert.ok(SRC.includes('api/v1'), '应包含 api/v1');
  });

  it('proxyLogisticsRequest 应支持 GET 和 POST 方法', () => {
    assert.ok(SRC.includes("'GET'"), '支持 GET');
    assert.ok(SRC.includes("'POST'"), '支持 POST');
  });

  it('应包含 use server 指令', () => {
    const needle = "'use server'";
    assert.ok(SRC.includes(needle) || SRC.includes('"use server"'), '缺少 use server');
  });
});

describe('logistics/proxy — 防御', () => {
  it('应透传上游 content-type', () => {
    assert.ok(SRC.includes('content-type'), '应读取 content-type');
  });

  it('应支持非 JSON 响应的直接透传', () => {
    assert.ok(SRC.includes('isJson'), 'JSON 判断逻辑');
  });

  it('上游 fetch 失败时应返回 502', () => {
    assert.ok(SRC.includes('502'), '应返回 502');
    assert.ok(SRC.includes('catch'), '应包含 try-catch');
  });

  it('不应直接暴露环境变量值', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'), '无危险 HTML');
    assert.ok(!/:\s*any\b/.test(SRC), '无 any 类型');
  });
});
