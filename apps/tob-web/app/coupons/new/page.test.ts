/**
 * page.test.ts — L1 冒烟测试
 *
 * tob-web Coupons New page — 组件导出、数据完整性验证
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import NewCouponPage from './page';

describe('coupons/new/page — 正向测试', () => {
  it('默认导出组件函数', () => {
    assert.equal(typeof NewCouponPage, 'function');
  });

  it('组件函数签名有效', () => {
    assert.ok(NewCouponPage.toString().includes('function'));
  });
});
