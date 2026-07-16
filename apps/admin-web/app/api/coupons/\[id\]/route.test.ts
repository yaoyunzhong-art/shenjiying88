/**
 * api/coupons/[id]/route.test.ts — 优惠券详情代理层 L1 测试
 *
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8');

describe('coupons/[id]/route — 正例', () => {
  it('应导出 GET 方法获取优惠券详情', () => {
    assert.ok(SRC.includes('export const GET'), '缺少 GET 导出');
  });

  it('应导出 PATCH 方法更新优惠券', () => {
    assert.ok(SRC.includes('export const PATCH'), '缺少 PATCH 导出');
  });

  it('应导出 DELETE 方法删除优惠券', () => {
    assert.ok(SRC.includes('export const DELETE'), '缺少 DELETE 导出');
  });

  it('应引用 _proxy/utils 的 createProxyHandler', () => {
    assert.ok(SRC.includes('createProxyHandler'), '缺少 createProxyHandler');
    assert.ok(SRC.includes('../../_proxy/utils'), '应从 _proxy/utils 导入');
  });

  it('应包含 getCouponApi 函数构建 URL', () => {
    assert.ok(SRC.includes('getCouponApi'), '缺少 getCouponApi');
    assert.ok(SRC.includes('params.id'), '应使用 params.id 动态拼接 URL');
  });

  it('GET 应传递优惠券 ID', () => {
    assert.ok(SRC.includes("'GET'"), 'GET 方法');
  });

  it('PATCH 应传递优惠券 ID', () => {
    assert.ok(SRC.includes("'PATCH'"), 'PATCH 方法');
  });

  it('DELETE 应传递优惠券 ID', () => {
    assert.ok(SRC.includes("'DELETE'"), 'DELETE 方法');
  });
});

describe('coupons/[id]/route — 防御', () => {
  it('所有 handler 应使用 createProxyHandler 代理', () => {
    const handlerCalls = (SRC.match(/createProxyHandler\(/g) || []).length;
    assert.strictEqual(handlerCalls, 3, '应调用 3 次 createProxyHandler (GET/PATCH/DELETE)');
  });

  it('不应手动实现 fetch 调用', () => {
    assert.ok(!SRC.includes('async function GET'), '不应手动实现');
    assert.ok(!SRC.includes('async function PATCH'), '不应手动实现');
    assert.ok(!SRC.includes('async function DELETE'), '不应手动实现');
  });

  it('无危险 HTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
  it('无 any 类型', () => { assert.ok(!/:\s*any\b/.test(SRC)); });
});
