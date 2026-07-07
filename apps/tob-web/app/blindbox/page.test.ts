/**
 * page.test.ts — 盲盒抽奖页面 L1 冒烟测试
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

describe('blindbox/page — 正向测试', () => {
  it('应包含"盲盒抽奖"页面标题', () => {
    const src = readSource();
    assert.ok(src.includes('盲盒抽奖'), '缺少"盲盒抽奖"标题');
  });

  it('应包含"单抽"按钮', () => {
    const src = readSource();
    assert.ok(src.includes('单抽'), '缺少"单抽"按钮');
  });

  it('应包含"十连"按钮', () => {
    const src = readSource();
    assert.ok(src.includes('十连'), '缺少"十连"按钮');
  });

  it('应包含"概率公示"区域', () => {
    const src = readSource();
    assert.ok(src.includes('概率公示'), '缺少"概率公示"区域');
  });

  it('应包含奖池或 prize pool 区域', () => {
    const src = readSource();
    assert.ok(src.includes('奖池') || src.includes('prize pool'), '缺少奖池区域');
  });

  it('应包含"抽奖记录"区域', () => {
    const src = readSource();
    assert.ok(src.includes('抽奖记录'), '缺少"抽奖记录"区域');
  });
});

describe('blindbox/page — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应导入 PageShell from @m5/ui', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell 导入');
    assert.ok(src.includes("@m5/ui"), '缺少 @m5/ui 导入');
  });

  it('应导入 blindbox-data', () => {
    const src = readSource();
    assert.ok(src.includes('./blindbox-data') || src.includes('./blindbox-data'), '缺少 blindbox-data 导入');
  });

  it('应导入 blindbox-service', () => {
    const src = readSource();
    assert.ok(src.includes('./blindbox-service') || src.includes('./blindbox-service'), '缺少 blindbox-service 导入');
  });
});
