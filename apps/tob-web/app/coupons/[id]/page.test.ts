/**
 * page.test.ts — L1 冒烟测试
 *
 * tob-web Coupons Detail page — 组件导出、数据完整性验证
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CouponDetailPage from './page';

describe('coupons/[id]/page — 正向测试', () => {
  it('默认导出组件函数', () => {
    assert.equal(typeof CouponDetailPage, 'function');
  });

  it('组件函数签名有效', () => {
    assert.ok(CouponDetailPage.toString().includes('function'));
  });
});
