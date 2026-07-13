/**
 * store-scope unit tests — storefront-web
 *
 * 覆盖: store scope 解析 / 默认 market 补全 / 无效格式 / 边界条件
 * L1 JMeter 风格: 正例 + 反例 + 边界
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveStoreScope, type StoreScopeParams } from './store-scope';

describe('store-scope: 正例 — 正常解析', () => {
  it('应当解析 3 段路径并补齐默认 market (cn-mainland)', () => {
    const result = resolveStoreScope(['tenant-a', 'brand-b', 'store-c']);
    assert.notEqual(result, null);
    assert.deepEqual(result, {
      marketCode: 'cn-mainland',
      tenantCode: 'tenant-a',
      brandCode: 'brand-b',
      storeCode: 'store-c',
    } satisfies StoreScopeParams);
  });

  it('应当解析 4 段路径并保留显式 market', () => {
    const result = resolveStoreScope(['us-default', 'tenant-a', 'brand-b', 'store-c']);
    assert.notEqual(result, null);
    assert.deepEqual(result, {
      marketCode: 'us-default',
      tenantCode: 'tenant-a',
      brandCode: 'brand-b',
      storeCode: 'store-c',
    } satisfies StoreScopeParams);
  });

  it('应当正确解析非中文 market 4 段路径', () => {
    const result = resolveStoreScope(['eu-de', 'acme', 'luxury', 'paris-001']);
    assert.notEqual(result, null);
    assert.equal(result!.marketCode, 'eu-de');
    assert.equal(result!.storeCode, 'paris-001');
  });

  it('应当解析 3 段短 storeCode', () => {
    const result = resolveStoreScope(['t', 'b', 's']);
    assert.notEqual(result, null);
    assert.equal(result!.marketCode, 'cn-mainland');
    assert.equal(result!.storeCode, 's');
  });

  it('应当解析带中文字符的 4 段路径', () => {
    const result = resolveStoreScope(['cn-mainland', '租户', '品牌', '门店']);
    assert.notEqual(result, null);
    assert.equal(result!.tenantCode, '租户');
    assert.equal(result!.brandCode, '品牌');
    assert.equal(result!.storeCode, '门店');
  });
});

describe('store-scope: 反例 — 无效解析', () => {
  it('应当拒绝 2 段路径（过短）', () => {
    assert.equal(resolveStoreScope(['only', 'two']), null);
  });

  it('应当拒绝 5 段路径（过长）', () => {
    assert.equal(resolveStoreScope(['cn', 't', 'b', 's', 'extra']), null);
  });

  it('应当拒绝空数组', () => {
    assert.equal(resolveStoreScope([]), null);
  });

  it('undefined/null 输入会导致 TypeError', () => {
    assert.throws(() => resolveStoreScope(undefined as unknown as string[]), TypeError);
    assert.throws(() => resolveStoreScope(null as unknown as string[]), TypeError);
  });
});

describe('store-scope: 边界 — 特殊输入', () => {
  it('应当处理包含数字和连字符的 code', () => {
    const result = resolveStoreScope(['market-2026', 'tenant_01', 'BRAND-X', 'store_999']);
    assert.notEqual(result, null);
    assert.equal(result!.marketCode, 'market-2026');
    assert.equal(result!.tenantCode, 'tenant_01');
    assert.equal(result!.storeCode, 'store_999');
  });

  it('应当处理值为空字符串的 segments', () => {
    const result = resolveStoreScope(['', '', '', '']);
    assert.notEqual(result, null);
    assert.equal(result!.marketCode, '');
    assert.equal(result!.tenantCode, '');
    assert.equal(result!.brandCode, '');
    assert.equal(result!.storeCode, '');
  });

  it('应当处理 4 段中前导 segment 为 "cn-mainland" 的显式完整路径', () => {
    const result = resolveStoreScope(['cn-mainland', 'demo', 'demo-brand', 'store-001']);
    assert.notEqual(result, null);
    // 4 段路径使用显式 marketCode，不触发默认补全
    assert.equal(result!.marketCode, 'cn-mainland');
    assert.equal(result!.storeCode, 'store-001');
  });

  it('应当处理 3 段含特殊字符的路径', () => {
    const result = resolveStoreScope(['demo-corps', 'brand_2026', 'store@001']);
    assert.notEqual(result, null);
    assert.equal(result!.marketCode, 'cn-mainland');
    assert.equal(result!.tenantCode, 'demo-corps');
    assert.equal(result!.storeCode, 'store@001');
  });

  it('应当处理长度为 9 字符的短 segment', () => {
    const result = resolveStoreScope(['abc', 'def', 'ghi']);
    assert.notEqual(result, null);
    assert.equal(result!.tenantCode, 'abc');
    assert.equal(result!.storeCode, 'ghi');
  });

  it('不应当修改输入数组', () => {
    const input = ['cn', 't', 'b', 's'];
    const result = resolveStoreScope(input);
    assert.notEqual(result, null);
    assert.equal(input.length, 4, '输入数组不应被修改');
  });

  it('解析后应包含所有4个字段', () => {
    const result = resolveStoreScope(['a', 'b', 'c']);
    assert.notEqual(result, null);
    const keys = Object.keys(result!);
    assert.ok(keys.includes('marketCode'));
    assert.ok(keys.includes('tenantCode'));
    assert.ok(keys.includes('brandCode'));
    assert.ok(keys.includes('storeCode'));
  });
});
