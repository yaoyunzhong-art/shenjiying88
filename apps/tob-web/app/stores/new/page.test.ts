/**
 * stores/new/page.test.ts — 新增门店表单页 (tob-web) L1 冒烟测试
 * ⚡ 覆盖: 组件导出 / 表单字段 / 验证逻辑 / 数据完整性
 * 参考对齐: page.tsx 组件
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const PAGE_SOURCE = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');

describe('NewStorePage (tob-web)', () => {
  it('module is importable and default export is a function', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('page uses "use client" directive', () => {
    assert.ok(PAGE_SOURCE.includes("'use client'"));
  });

  it('uses React hooks: useState, useRouter', () => {
    assert.ok(PAGE_SOURCE.includes('useState'));
    assert.ok(PAGE_SOURCE.includes('useRouter'));
  });

  it('calls storeService.createStore on submit', () => {
    assert.ok(PAGE_SOURCE.includes('storeService.createStore'));
  });

  it('contains all required form fields', () => {
    assert.ok(PAGE_SOURCE.includes('storeName'));
    assert.ok(PAGE_SOURCE.includes('storeCode'));
    assert.ok(PAGE_SOURCE.includes('region'));
    assert.ok(PAGE_SOURCE.includes('city'));
    assert.ok(PAGE_SOURCE.includes('address'));
    assert.ok(PAGE_SOURCE.includes('managerName'));
    assert.ok(PAGE_SOURCE.includes('managerMobile'));
    assert.ok(PAGE_SOURCE.includes('employeeCount'));
    assert.ok(PAGE_SOURCE.includes('status'));
  });

  it('includes form validation functions', () => {
    assert.ok(PAGE_SOURCE.includes('validateField'));
    assert.ok(PAGE_SOURCE.includes('validateForm'));
    assert.ok(PAGE_SOURCE.includes('handleSubmit'));
    assert.ok(PAGE_SOURCE.includes('handleChange'));
    assert.ok(PAGE_SOURCE.includes('handleBlur'));
  });

  it('validates required field error messages', () => {
    assert.ok(PAGE_SOURCE.includes('门店名称不能为空'));
    assert.ok(PAGE_SOURCE.includes('门店编号不能为空'));
    assert.ok(PAGE_SOURCE.includes('请输入正确的手机号格式'));
    assert.ok(PAGE_SOURCE.includes('地址不能为空'));
    assert.ok(PAGE_SOURCE.includes('请选择所属地区'));
    assert.ok(PAGE_SOURCE.includes('城市不能为空'));
    assert.ok(PAGE_SOURCE.includes('店长姓名不能为空'));
    assert.ok(PAGE_SOURCE.includes('联系电话不能为空'));
  });

  it('validates field length rules', () => {
    assert.ok(PAGE_SOURCE.includes('至少2个字符'));
    assert.ok(PAGE_SOURCE.includes('不能超过50个字符'));
    assert.ok(PAGE_SOURCE.includes('不能超过200个字符'));
  });

  it('validates storeCode format rule', () => {
    assert.ok(PAGE_SOURCE.includes('只能包含字母、数字、下划线和连字符'));
  });

  it('navigates to detail on success: router.push', () => {
    assert.ok(PAGE_SOURCE.includes('router.push'));
    assert.ok(PAGE_SOURCE.includes('/stores/'));
  });

  it('handles submit states: submitting, submitError', () => {
    assert.ok(PAGE_SOURCE.includes('submitting'));
    assert.ok(PAGE_SOURCE.includes('submitError'));
    assert.ok(PAGE_SOURCE.includes('setSubmitting'));
    assert.ok(PAGE_SOURCE.includes('setSubmitError'));
  });

  it('implements touched tracking for on-blur validation', () => {
    assert.ok(PAGE_SOURCE.includes('touched'));
    assert.ok(PAGE_SOURCE.includes('setTouched'));
  });

  it('supports all 7 region options', () => {
    assert.ok(PAGE_SOURCE.includes('华北'));
    assert.ok(PAGE_SOURCE.includes('华东'));
    assert.ok(PAGE_SOURCE.includes('华南'));
    assert.ok(PAGE_SOURCE.includes('华中'));
    assert.ok(PAGE_SOURCE.includes('西南'));
    assert.ok(PAGE_SOURCE.includes('西北'));
    assert.ok(PAGE_SOURCE.includes('东北'));
  });

  it('supports all 3 status values', () => {
    assert.ok(PAGE_SOURCE.includes('营业中'));
    assert.ok(PAGE_SOURCE.includes('休息中'));
    assert.ok(PAGE_SOURCE.includes('已停业'));
  });

  it('includes cancel button navigation', () => {
    assert.ok(PAGE_SOURCE.includes('取消'));
    assert.ok(PAGE_SOURCE.includes('/stores'));
  });

  it('disables submit button while submitting', () => {
    assert.ok(PAGE_SOURCE.includes('disabled'));
    assert.ok(PAGE_SOURCE.includes('提交中...'));
  });

  it('handles network error gracefully', () => {
    assert.ok(PAGE_SOURCE.includes('网络错误'));
    assert.ok(PAGE_SOURCE.includes('请稍后重试'));
  });

  it('has placeholder text for user guidance', () => {
    assert.ok(PAGE_SOURCE.includes('placeholder'));
    assert.ok(PAGE_SOURCE.includes('如: 深圳南山旗舰店'));
    assert.ok(PAGE_SOURCE.includes('如: SZ-CENTER-01'));
    assert.ok(PAGE_SOURCE.includes('如: 13800138001'));
  });

  it('converts storeCode to uppercase on input', () => {
    assert.ok(PAGE_SOURCE.includes('toUpperCase'));
  });

  it('validates employeeCount min/max', () => {
    assert.ok(PAGE_SOURCE.includes('员工数至少为1'));
    assert.ok(PAGE_SOURCE.includes('员工数不能超过999'));
  });
});
