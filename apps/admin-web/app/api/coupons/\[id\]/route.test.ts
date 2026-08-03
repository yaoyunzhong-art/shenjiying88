/**
 * api/coupons/[id]/route.test.ts — 优惠券详情/更新/删除 API L1 测试
 *
 * 覆盖: GET / PATCH / DELETE — 正例·边界·防御
 * 策略: 静态源码分析 (因为 'use server' 环境无法直接导入 route handler)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8');

describe('coupons/[id] — GET 详情', () => {
  it('G1. 应导出 GET 方法', () => {
    assert.ok(SRC.includes('export const GET'), '缺少 GET 导出');
  });

  it('G2. 应使用 createProxyHandler 代理', () => {
    assert.ok(SRC.includes('createProxyHandler'), '缺少代理处理器');
  });

  it('G3. 应构造 /coupons/:id URL', () => {
    assert.ok(SRC.includes("`${API_BASE_URL}/coupons/"), '缺少 API URL 构造');
  });

  it('G4. 应请求 GET 方法', () => {
    assert.ok(SRC.includes("'GET'"), '缺少 GET 请求方法');
  });

  it('G5. 应接收 params.id 获取优惠券 ID', () => {
    assert.ok(SRC.includes('getCouponApi(params.id)'), '缺少 params.id 使用');
  });

  it('G6. 应透传 req 给代理处理器', () => {
    assert.ok(SRC.includes('handler(req)'), '缺少 handler(req)');
  });
});

describe('coupons/[id] — PATCH 更新', () => {
  it('P1. 应导出 PATCH 方法', () => {
    assert.ok(SRC.includes('export const PATCH'), '缺少 PATCH 导出');
  });

  it('P2. 应使用 createProxyHandler 代理', () => {
    assert.ok(SRC.includes("'PATCH'"), '缺少 PATCH 方法');
  });

  it('P3. 应构造 /coupons/:id URL', () => {
    assert.ok(SRC.includes("`${API_BASE_URL}/coupons/"), '缺少 API URL');
  });

  it('P4. 应接收 params.id', () => {
    assert.ok(SRC.includes('getCouponApi(params.id)'), '缺少 params.id');
  });
});

describe('coupons/[id] — DELETE 删除', () => {
  it('D1. 应导出 DELETE 方法', () => {
    assert.ok(SRC.includes('export const DELETE'), '缺少 DELETE 导出');
  });

  it('D2. 应使用 createProxyHandler 代理', () => {
    assert.ok(SRC.includes("'DELETE'"), '缺少 DELETE 方法');
  });

  it('D3. 应构造 /coupons/:id URL', () => {
    assert.ok(SRC.includes("`${API_BASE_URL}/coupons/"), '缺少 API URL');
  });
});

describe('coupons/[id] — 防御 & 边界', () => {
  it('E1. 应从 _proxy/utils 导入 createProxyHandler', () => {
    assert.ok(SRC.includes("createProxyHandler"), '缺少 createProxyHandler 导入');
  });

  it('E2. 应从 _proxy/utils 导入 API_BASE_URL', () => {
    assert.ok(SRC.includes("API_BASE_URL"), '缺少 API_BASE_URL 导入');
  });

  it('E3. 函数签名包含 params.id 类型', () => {
    assert.ok(SRC.includes('params: { id: string }'), '缺少 params 类型');
  });

  it('E4. 无危险 HTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('E5. 无 any 类型', () => {
    assert.ok(!/:\s*any\b/.test(SRC));
  });
});
