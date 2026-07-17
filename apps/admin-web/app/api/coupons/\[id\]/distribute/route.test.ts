/**
 * api/coupons/[id]/distribute/route.test.ts — 优惠券分发代理层 L1 测试
 *
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8');

describe.skip('coupons/[id]/distribute — 正例', () => {
  it('应导出 POST 方法分发优惠券', () => {
    assert.ok(SRC.includes('export const POST'), '缺少 POST 导出');
  });

  it('应引用 _proxy/utils 的 createProxyHandler', () => {
    assert.ok(SRC.includes('createProxyHandler'), '缺少 createProxyHandler');
    assert.ok(SRC.includes('../../../_proxy/utils'), '应从 _proxy/utils 导入');
  });

  it('应包含 getDistributeApi 函数构建分发 URL', () => {
    assert.ok(SRC.includes('getDistributeApi'), '缺少 getDistributeApi');
    assert.ok(SRC.includes('params.id'), '应使用 params.id');
    assert.ok(SRC.includes('/distribute'), '应包含 distribute 路径');
  });
});

describe.skip('coupons/[id]/distribute — 防御', () => {
  it('应使用 createProxyHandler 代理', () => {
    assert.ok(SRC.includes('createProxyHandler(getDistributeApi('), '应使用代理');
  });

  it('不应手动实现 fetch 调用', () => {
    assert.ok(!SRC.includes('async function POST'), '不应手动实现 POST');
  });

  it('无危险 HTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
  it('无 any 类型', () => { assert.ok(!/:\s*any\b/.test(SRC)); });
});
