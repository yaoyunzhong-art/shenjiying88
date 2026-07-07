/**
 * alerts/page.test.tsx — 警报列表页 L1 冒烟测试 (storefront-web)
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

describe('alerts — 正例', () => {
  it('应导出一个默认组件 AlertsListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AlertsListPage'), '缺少默认导出');
  });

  it('应包含 alert 类型或数据定义', () => {
    const src = readSource();
    assert.ok(src.includes('alert') || src.includes('Alert'), '缺少定义');
  });

  it('应包含 preset 预置和 count 数量', () => {
    const src = readSource();
    assert.ok(src.includes('preset'), '缺少 preset');
    assert.ok(src.includes('count'), '缺少 count');
  });
});

describe('alerts — 边界', () => {
  it('应包含 detailHrefBase 详情路径', () => {
    const src = readSource();
    assert.ok(src.includes('detailHrefBase'), '缺少详情路径');
  });

  it('应包含 mapRecords 数据转换', () => {
    const src = readSource();
    assert.ok(src.includes('mapRecords'), '缺少数据转换');
  });

  it('应包含 title 标题和 description 描述', () => {
    const src = readSource();
    assert.ok(src.includes('title='), '缺少标题');
    assert.ok(src.includes('description'), '缺少描述');
  });
});

describe('alerts — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 FoundationAlertDemoListPage 组件', () => {
    const src = readSource();
    assert.ok(src.includes('FoundationAlertDemoListPage'), '缺少 alert 组件');
  });

  it('应包含 storefrontPreset 配置', () => {
    const src = readSource();
    assert.ok(src.includes('storefrontPreset'), '缺少预置配置');
  });
});
