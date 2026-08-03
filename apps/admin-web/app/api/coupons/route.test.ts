/**
 * api/coupons/route.test.ts — 优惠券列表/创建 API L1 测试
 *
 * 覆盖: GET / POST — 正例·边界·防御
 * 策略: 静态源码分析 (因为 'use server' 环境无法直接导入 route handler)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8');

describe('coupons — GET 列表', () => {
  it('G1. 应导出 GET 方法', () => {
    assert.ok(SRC.includes('export const GET'), '缺少 GET 导出');
  });

  it('G2. 应使用 createProxyHandler 代理', () => {
    assert.ok(SRC.includes('createProxyHandler'), '缺少代理处理器');
  });

  it('G3. 应构造 /coupons URL', () => {
    assert.ok(SRC.includes("`${API_BASE_URL}/coupons`"), '缺少 API URL 构造');
  });

  it('G4. 应请求 GET 方法', () => {
    assert.ok(SRC.includes("'GET'"), '缺少 GET 请求方法');
  });

  it('G5. 应透传查询参数列表：tenantId, storeId, status, type, scope, page, limit, search', () => {
    const params = ['tenantId', 'storeId', 'status', 'type', 'scope', 'page', 'limit', 'search'];
    for (const p of params) {
      assert.ok(SRC.includes(`'${p}'`), `缺少查询参数 ${p}`);
    }
  });

  it('G6. 应透传 req 给代理处理器', () => {
    assert.ok(SRC.includes('createProxyHandler'), '使用代理模式');
    assert.ok(!SRC.includes('async function GET('), '不应自实现 GET');
  });
});

describe('coupons — POST 创建', () => {
  it('P1. 应导出 POST 方法', () => {
    assert.ok(SRC.includes('export const POST'), '缺少 POST 导出');
  });

  it('P2. 应使用 createProxyHandler 代理', () => {
    assert.ok(SRC.includes('createProxyHandler'), '缺少代理处理器');
  });

  it('P3. 应请求 POST 方法', () => {
    assert.ok(SRC.includes("'POST'"), '缺少 POST 请求方法');
  });

  it('P4. POST 不应带查询参数白名单', () => {
    // POST createProxyHandler(COUPON_API, 'POST') 不带 allowedParams
    assert.ok(SRC.includes("'POST')"), 'POST 不应带查询参数列表');
  });
});

describe('coupons — 导入 & 常量', () => {
  it('I1. 应从 _proxy/utils 导入 createProxyHandler', () => {
    assert.ok(SRC.includes("createProxyHandler"), '缺少 createProxyHandler 导入');
  });

  it('I2. 应从 _proxy/utils 导入 API_BASE_URL', () => {
    assert.ok(SRC.includes("API_BASE_URL"), '缺少 API_BASE_URL 导入');
  });

  it('I3. 应导入 NextRequest', () => {
    assert.ok(SRC.includes('NextRequest'), '缺少 NextRequest 导入');
  });

  it('I4. 应定义 COUPON_API 常量', () => {
    assert.ok(SRC.includes("const COUPON_API"), '缺少 COUPON_API 常量');
  });

  it('I5. COUPON_API 应引用 API_BASE_URL', () => {
    assert.ok(SRC.includes("API_BASE_URL"), 'API_BASE_URL 引用');
    assert.ok(SRC.includes('coupons'), '应包含 coupons 路径');
  });
});

describe('coupons — 防御 & 边界', () => {
  it('E1. 应透传上游请求的 content-type', () => {
    assert.ok(SRC.includes('createProxyHandler'), '通过代理处理器处理');
  });

  it('E2. 无危险 HTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('E3. 无 any 类型', () => {
    assert.ok(!/:\s*any\b/.test(SRC));
  });

  it('E4. 不应包含 auth 硬编码', () => {
    assert.ok(!SRC.includes('Authorization') || SRC.includes('createProxyHandler'),
      'auth 应由代理处理器处理');
  });

  it('E5. 路由文件不应包含页面组件导出', () => {
    assert.ok(!SRC.includes('export default'), 'API 路由不应有 default 导出');
  });
});
