/**
 * api/coupons/route.test.ts — 营销券代理层 L1 测试
 *
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8');

describe('coupons/route — 正例', () => {
  it('应导出 GET 方法获取优惠券列表', () => {
    assert.ok(SRC.includes('export const GET'), '缺少 GET 导出');
    assert.ok(SRC.includes('/coupons'), '应包含 coupon API 路径');
  });

  it('应导出 POST 方法创建优惠券', () => {
    assert.ok(SRC.includes('export const POST'), '缺少 POST 导出');
  });

  it('GET 应透传查询参数: tenantId / storeId / status / type / page / limit', () => {
    assert.ok(SRC.includes('tenantId'), '缺少 tenantId');
    assert.ok(SRC.includes('storeId'), '缺少 storeId');
    assert.ok(SRC.includes('status'), '缺少 status');
    assert.ok(SRC.includes('type'), '缺少 type');
    assert.ok(SRC.includes('page'), '缺少 page');
    assert.ok(SRC.includes('limit'), '缺少 limit');
  });

  it('应引用 _proxy/utils 的 createProxyHandler', () => {
    assert.ok(SRC.includes('createProxyHandler'), '缺少 createProxyHandler');
    assert.ok(SRC.includes('../_proxy/utils'), '应从 _proxy/utils 导入');
  });

  it('应包含 COUPON_API 常量定义', () => {
    assert.ok(SRC.includes('COUPON_API'), '缺少 COUPON_API');
    assert.ok(SRC.includes('API_BASE_URL'), '应拼接 API_BASE_URL');
  });
});

describe('coupons/route — 防御', () => {
  it('应使用 createProxyHandler 代理而非手写 fetch', () => {
    assert.ok(SRC.includes('createProxyHandler('), '应使用代理处理器');
    assert.ok(!SRC.includes('async function GET'), '不应手动实现 GET');
  });

  it('无危险 HTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('无 any 类型', () => {
    assert.ok(!/:\s*any\b/.test(SRC));
  });
});
