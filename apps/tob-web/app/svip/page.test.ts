/**
 * page.test.ts — SVIP 会员页面 L1 冒烟测试
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

describe('svip/page — 正向测试', () => {
  it('应包含"SVIP 会员"页面标题', () => {
    const src = readSource();
    assert.ok(src.includes('SVIP 会员'), '缺少"SVIP 会员"标题');
  });

  it('应包含套餐卡片区域', () => {
    const src = readSource();
    assert.ok(src.includes('选择套餐') || src.includes('plan'), '缺少套餐卡片区域');
  });

  it('应包含"SVIP"徽章或开通提示', () => {
    const src = readSource();
    assert.ok(src.includes('SVIP'), '缺少 SVIP 徽章');
  });

  it('应包含"立即开通"按钮', () => {
    const src = readSource();
    assert.ok(src.includes('立即开通'), '缺少"立即开通"按钮');
  });

  it('应包含特权或 benefits 区域', () => {
    const src = readSource();
    assert.ok(src.includes('特权') || src.includes('benefit'), '缺少特权区域');
  });
});

describe('svip/page — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应导入 PageShell from @m5/ui', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell 导入');
    assert.ok(src.includes("@m5/ui"), '缺少 @m5/ui 导入');
  });

  it('应导入 svip-data', () => {
    const src = readSource();
    assert.ok(src.includes('./svip-data') || src.includes('./svip-data'), '缺少 svip-data 导入');
  });

  it('应导入 svip-service', () => {
    const src = readSource();
    assert.ok(src.includes('./svip-service') || src.includes('./svip-service'), '缺少 svip-service 导入');
  });
});
