/**
 * audit/page.test.tsx — 审计日志页面 L1 冒烟测试
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

describe('audit — 正例', () => {
  it('应导出一个默认组件 AuditPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AuditPage'), '缺少默认导出组件');
  });

  it('应包含审计标题', () => {
    const src = readSource();
    assert.ok(src.includes('审计日志'), '缺少审计日志标题');
  });

  it('应包含操作记录描述', () => {
    const src = readSource();
    assert.ok(src.includes('操作记录'), '缺少操作记录说明');
  });
});

// ---- 边界 ----

describe('audit — 边界', () => {
  it('应包含可追溯说明', () => {
    const src = readSource();
    assert.ok(src.includes('可追溯'), '缺少可追溯说明');
  });

  it('不应包含危险外部数据渲染', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'));
  });
});

// ---- 防御 ----

describe('audit — 防御', () => {
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
