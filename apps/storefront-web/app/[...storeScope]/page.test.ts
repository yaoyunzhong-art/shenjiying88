/**
 * page.test.ts — L1 冒烟测试
 *
 * storefront-web StoreScope catch-all page — 组件导出、async 组件签名验证
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import StoreSitePage from './page';

describe('[...storeScope]/page — 正向测试', () => {
  it('默认导出组件函数', () => {
    assert.equal(typeof StoreSitePage, 'function');
  });

  it('组件函数签名包含 async 关键词', () => {
    assert.ok(StoreSitePage.toString().includes('async'));
  });
});
