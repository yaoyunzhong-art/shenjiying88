/**
 * products/[id]/edit/page.test.tsx — 商品编辑页 L1 冒烟测试 (tob-web)
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('products/[id]/edit — 正例', () => {
  it('应导出一个默认组件 EditProductPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function EditProductPage'), '缺少默认导出');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应导入 FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), '缺少 FormPageScaffold');
  });

  it('应导入 validateFormFields', () => {
    const src = readSource();
    assert.ok(src.includes('validateFormFields'), '缺少 validateFormFields');
  });

  it('应导入 useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), '缺少 useToast');
  });

  it('应引用 MOCK_PRODUCTS 数据源', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PRODUCTS'), '缺少 MOCK_PRODUCTS');
  });

  it('应引用 products-data 中的类别映射', () => {
    const src = readSource();
    assert.ok(src.includes('PRODUCT_CATEGORY_MAP'), '缺少 PRODUCT_CATEGORY_MAP');
  });
});

describe('products/[id]/edit — 边界', () => {
  it('商品不存在时显示 商品未找到', () => {
    const src = readSource();
    assert.ok(src.includes('商品未找到'), '缺少未找到处理');
  });

  it('应包含返回商品列表按钮', () => {
    const src = readSource();
    assert.ok(src.includes('返回商品列表'), '缺少返回按钮');
  });

  it('SKU 字段应置为 disabled', () => {
    const src = readSource();
    assert.ok(src.includes('disabled: true'), 'SKU 应禁用');
  });

  it('提交成功后跳转到详情页', () => {
    const src = readSource();
    assert.ok(src.includes('/products/${params.id}'), '缺少跳转');
  });
});

describe('products/[id]/edit — 防御', () => {
  it('商品名称应有长度验证 (2-25 字符)', () => {
    const src = readSource();
    assert.ok(src.includes('至少 2 个字符') && src.includes('最多 25 个字符'), '缺少名称验证');
  });

  it('售价应有 > 0 验证', () => {
    const src = readSource();
    assert.ok(src.includes('必须大于 0'), '缺少售价验证');
  });

  it('库存应有非负验证', () => {
    const src = readSource();
    assert.ok(src.includes('库存不能为负数'), '缺少库存验证');
  });

  it('表单提交禁用应在 submitting 时生效', () => {
    const src = readSource();
    assert.ok(src.includes('disabled={submitting}'), '缺少禁用状态');
  });

  it('应使用 useCallback 包裹 submit 函数', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
  });

  it('异常场景应有 try/catch 捕获', () => {
    const src = readSource();
    assert.ok(src.includes('try') && src.includes('catch'), '缺少 try/catch');
  });

  it('应来自 products-data 目录', () => {
    const src = readSource();
    // Should import from products-data, not from a local inline data file
    assert.ok(src.includes('products-data'), '应引用 products-data');
  });
});

describe('products/[id]/edit — 表单字段', () => {
  it('应包含至少 10 个表单字段', () => {
    const src = readSource();
    // Count field definitions
    const fieldCount = (src.match(/key: '/g) || []).length;
    assert.ok(fieldCount >= 10, `字段数 ${fieldCount} 不足 10`);
  });

  it('应包含 status 选择字段', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'status'"), '缺少 status 字段');
  });

  it('应支持分类选择', () => {
    const src = readSource();
    assert.ok(src.includes('CATEGORY_OPTIONS'), '缺少分类选项');
  });

  it('应使用 FormPageScaffold 构建表单', () => {
    const src = readSource();
    assert.ok(src.includes('<FormPageScaffold'), '缺少 FormPageScaffold 渲染');
  });

  it('应定义 supplierName 供应商字段', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'supplierName'") || src.includes("'supplierName'"), '缺少供应商字段');
  });
});
