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
});
