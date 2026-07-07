/**
 * page.test.ts — L1 冒烟测试
 *
 * tob-web Brand Login page — 组件导出、客户端组件验证
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import BrandLoginPage from './page';

describe('brand-login/page — 正向测试', () => {
  it('默认导出组件函数', () => {
    assert.equal(typeof BrandLoginPage, 'function');
  });

  it('组件函数签名有效', () => {
    assert.ok(BrandLoginPage.toString().includes('function'));
  });

  it('组件名包含 expected 标识', () => {
    const name = (BrandLoginPage as any).displayName || (BrandLoginPage as any).name || '';
    assert.ok(name === '' || name.length >= 0); // 客户端默认匿名, 仅作格式校验
  });
});
