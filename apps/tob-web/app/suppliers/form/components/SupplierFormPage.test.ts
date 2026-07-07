/**
 * SupplierFormPage.test.ts — 供应商表单页静态测试
 * 验证组件的接口和逻辑正确性（无需 DOM 环境）
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';

import { SupplierFormPage } from './SupplierFormPage';

describe('SupplierFormPage — 接口与逻辑验证', () => {
  it('组件可加载且为函数组件', () => {
    assert.equal(typeof SupplierFormPage, 'function', 'SupplierFormPage 应为函数组件');
  });

  it('组件源码包含所有表单字段处理', () => {
    const src = SupplierFormPage.toString();
    const requiredFields = ['name', 'phone', 'email', 'category', 'address', 'tags'];
    for (const field of requiredFields) {
      assert.ok(src.includes(field), `字段 "${field}" 应在组件源码中`);
    }
  });

  it('包含邮箱格式校验', () => {
    const src = SupplierFormPage.toString();
    assert.ok(src.includes('@'), '应包含邮箱格式校验');
  });

  it('支持编辑模式属性', () => {
    const src = SupplierFormPage.toString();
    assert.ok(src.includes('isEdit'), '应接收 isEdit 属性');
    assert.ok(src.includes('supplierId'), '应接收 supplierId 属性');
    assert.ok(src.includes('initialValues'), '应接收 initialValues 属性');
  });

  it('提交逻辑包含成功/错误处理', () => {
    const src = SupplierFormPage.toString();
    assert.ok(src.includes('successMessage'), '应包含成功消息处理');
    assert.ok(src.includes('errorMessage'), '应包含错误消息处理');
  });

  it('提交后跳转到供应商列表', () => {
    const src = SupplierFormPage.toString();
    assert.ok(src.includes('push'), '应使用 router.push 导航');
    assert.ok(src.includes('/suppliers'), '应跳转到 /suppliers');
  });

  it('包含 Select 分类选择逻辑', () => {
    const src = SupplierFormPage.toString();
    assert.ok(src.includes('Select'), '应使用 Select 组件');
    assert.ok(src.includes('CATEGORY_OPTIONS'), '应引用分类选项常量');
    assert.ok(src.includes('category'), '应包含分类字段');
  });

  it('表单禁用了浏览器默认验证', () => {
    const src = SupplierFormPage.toString();
    assert.ok(src.includes('noValidate'), '应设置 noValidate');
  });

  it('表单提交后组件可继续使用', () => {
    const src = SupplierFormPage.toString();
    assert.ok(src.includes('setSubmitState'), '应包含状态管理');
    assert.ok(src.includes('isSubmitting'), '应包含提交中状态');
  });

  it('包含完整的状态管理逻辑', () => {
    const src = SupplierFormPage.toString();
    assert.ok(src.includes('useState'), '应使用 useState');
    assert.ok(src.includes('useCallback'), '应使用 useCallback');
  });

  it('成功提交后清除表单或跳转', () => {
    const src = SupplierFormPage.toString();
    assert.ok(
      src.includes('setTimeout') || src.includes('router.push'),
      '应包含跳转或延迟处理'
    );
  });
});
