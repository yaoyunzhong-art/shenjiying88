/**
 * page.test.ts — L1 冒烟测试
 *
 * tob-web Tenant Login page — 组件导出、客户端组件验证
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import TenantLoginPage from './page';

describe('tenant-login/page — 正向测试', () => {
  it('默认导出组件函数', () => {
    assert.equal(typeof TenantLoginPage, 'function');
  });

  it('组件函数签名有效', () => {
    assert.ok(TenantLoginPage.toString().includes('function'));
  });
});
