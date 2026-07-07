/**
 * operations/page.test.tsx — 运营操作列表页 L1 冒烟测试 (storefront-web)
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

describe('operations — 正例', () => {
  it('应导出一个默认组件 OperationsListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function OperationsListPage'), '缺少默认导出');
  });

  it('应包含 operation 或类型定义', () => {
    const src = readSource();
    assert.ok(src.includes('operation') || src.includes('Operation'), '缺少定义');
  });

  it('应包含 preset 和 count 配置', () => {
    const src = readSource();
    assert.ok(src.includes('preset'), '缺少 preset');
    assert.ok(src.includes('count'), '缺少 count');
  });
});

describe('operations — 边界', () => {
  it('应包含 detailHrefBase 路径', () => {
    const src = readSource();
    assert.ok(src.includes('detailHrefBase'), '缺少详情路径');
  });

  it('应包含 title 标题属性', () => {
    const src = readSource();
    assert.ok(src.includes('title=') || src.includes('title:'), '缺少标题');
  });

  it('应包含 description 描述属性', () => {
    const src = readSource();
    assert.ok(src.includes('description'), '缺少描述');
  });
});

describe('operations — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 RuntimeOperationDemoListPage 组件', () => {
    const src = readSource();
    assert.ok(src.includes('RuntimeOperationDemoListPage'), '缺少 demo 组件');
  });

  it('应包含 storefrontPreset 预置配置', () => {
    const src = readSource();
    assert.ok(src.includes('storefrontPreset'), '缺少预置配置');
  });
});
