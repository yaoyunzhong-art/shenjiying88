/**
 * events/page.test.tsx — 活动管理页面 L1 冒烟测试
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

// ---- 正例 ----

describe('events — 正例', () => {
  it('应导出一个默认组件 EventsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function EventsPage'), '缺少默认导出组件');
  });

  it('应包含活动数据数组 EVENTS', () => {
    const src = readSource();
    assert.ok(src.includes('EVENTS'), '缺少活动数据定义');
  });

  it('应包含状态映射 STATUS_MAP', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_MAP'), '缺少状态映射');
  });

  it('应包含活动状态 Tag 渲染', () => {
    const src = readSource();
    assert.ok(src.includes('Tag'), '缺少 Tag 组件');
  });
});

// ---- 边界 ----

describe('events — 边界', () => {
  it('应包含活动创建操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('创建活动'), '缺少创建活动按钮');
  });

  it('应包含 Columns 列定义', () => {
    const src = readSource();
    assert.ok(src.includes('COLUMNS'), '缺少列定义');
  });

  it('应包含状态颜色映射', () => {
    const src = readSource();
    assert.ok(src.includes('published'), '缺少已发布状态');
  });
});

// ---- 防御 ----

describe('events — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 PageShell 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'));
  });
});
