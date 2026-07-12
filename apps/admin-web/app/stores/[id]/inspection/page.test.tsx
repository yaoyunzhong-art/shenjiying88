/**
 * inspection/page.test.tsx — 巡检管理页面 L1 冒烟测试
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

describe('inspection — 正例', () => {
  it('应导出一个默认组件 InspectionPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function InspectionPage'), '缺少默认导出组件');
  });

  it('应包含巡检标题', () => {
    const src = readSource();
    assert.ok(src.includes('巡检管理'), '缺少巡检管理标题');
  });

  it('应包含巡检记录描述', () => {
    const src = readSource();
    assert.ok(src.includes('巡检记录'), '缺少巡检记录说明');
  });
});

// ---- 边界 ----

describe('inspection — 边界', () => {
  it('应包含设备/安全分类', () => {
    const src = readSource();
    assert.ok(src.includes('设备') && src.includes('安全'), '缺少分类');
  });

  it('不应包含危险外部数据渲染', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'));
  });
});

// ---- 防御 ----

describe('inspection — 防御', () => {
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
