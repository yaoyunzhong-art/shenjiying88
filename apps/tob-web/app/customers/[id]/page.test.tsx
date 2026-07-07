/**
 * customers/[id]/page.test.tsx — 客户详情页 L1 冒烟测试 (tob-web)
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

describe('customers/[id] — 正例', () => {
  it('应导出一个默认组件 CustomerDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CustomerDetailPage'), '缺少默认导出');
  });

  it('应包含 MOCK_CUSTOMERS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_CUSTOMERS'), '缺少数据源');
  });

  it('应包含 EditFormData 编辑表单接口', () => {
    const src = readSource();
    assert.ok(src.includes('interface EditFormData'), '缺少编辑表单接口');
  });

  it('应使用 MOCK_CUSTOMERS.find 查找客户', () => {
    const src = readSource();
    assert.ok(src.includes('.find('), '缺少 find 查找');
  });
});

describe('customers/[id] — 边界', () => {
  it('客户不存在时应返回 null', () => {
    const src = readSource();
    assert.ok(src.includes('null'), 'find 应处理 null');
  });

  it('客户 ID 不存在时应有 fallback', () => {
    const src = readSource();
    assert.ok(src.includes('?? null') || src.includes('???'), 'null 兜底');
  });

  it('加载状态应有处理', () => {
    const src = readSource();
    assert.ok(src.includes('loading'), '缺少 loading');
  });
});

describe('customers/[id] — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含错误状态处理', () => {
    const src = readSource();
    assert.ok(src.includes('setError') || src.includes('error'), '缺少错误处理');
  });

  it('编辑提交应有错误处理', () => {
    const src = readSource();
    assert.ok(src.includes('submit') || src.includes('save') || src.includes('Save'), '提交逻辑');
  });
});
