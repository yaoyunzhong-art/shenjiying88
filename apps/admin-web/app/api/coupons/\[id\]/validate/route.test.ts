/**
 * api/coupons/[id]/validate/route.test.ts — 优惠券验证 API L1 测试
 *
 * 覆盖: POST — 正例·边界·防御
 * 策略: 静态源码分析
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8');

describe('coupons/[id]/validate — POST 正例', () => {
  it('V1. 应导出 POST 方法', () => {
    assert.ok(SRC.includes('export const POST'), '缺少 POST 导出');
  });

  it('V2. 应使用 createProxyHandler 代理', () => {
    assert.ok(SRC.includes('createProxyHandler'), '缺少代理处理器');
  });

  it('V3. 应构造 /coupons/:id/validate URL', () => {
    assert.ok(SRC.includes("`${API_BASE_URL}/coupons/"), '缺少 API URL');
    assert.ok(SRC.includes('/validate'), '缺少 validate 路径');
  });

  it('V4. 应请求 POST 方法', () => {
    assert.ok(SRC.includes("'POST'"), '缺少 POST 请求方法');
  });

  it('V5. 应接收 params.id 获取优惠券 ID', () => {
    assert.ok(SRC.includes('params.id'), '缺少 params.id');
  });
});

describe('coupons/[id]/validate — 防御 & 边界', () => {
  it('E1. 应从 ../_proxy/utils 导入', () => {
    assert.ok(SRC.includes('_proxy/utils'), '缺少 utils 导入');
  });

  it('E2. 函数签名包含 params.id 类型', () => {
    assert.ok(SRC.includes('params: { id: string }'), '缺少 params 类型');
  });

  it('E3. 应透传 req 给代理处理器', () => {
    assert.ok(SRC.includes('handler(req)'), '缺少 handler(req)');
  });

  it('E4. 无危险 HTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('E5. 无 any 类型', () => {
    assert.ok(!/:\s*any\b/.test(SRC));
  });

  it('E6. 应包含 API_BASE_URL 引用', () => {
    assert.ok(SRC.includes('API_BASE_URL'), '缺少 API_BASE_URL');
  });
});
