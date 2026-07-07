/**
 * page.test.ts — 财务看板页面 L1 冒烟测试
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

describe('finance-dashboard/page — 正向测试', () => {
  it('应包含"财务看板"页面标题', () => {
    const src = readSource();
    assert.ok(src.includes('财务看板'), '缺少"财务看板"标题');
  });

  it('应包含"门店损益"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('门店损益'), '缺少"门店损益"Tab');
  });

  it('应包含"品牌损益"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('品牌损益'), '缺少"品牌损益"Tab');
  });

  it('应包含"分账日志"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('分账日志'), '缺少"分账日志"Tab');
  });

  it('应包含营收或 revenue 相关内容', () => {
    const src = readSource();
    assert.ok(src.includes('营收') || src.includes('revenue'), '缺少营收相关展示');
  });

  it('应包含分账状态筛选', () => {
    const src = readSource();
    assert.ok(src.includes('全部状态'), '缺少分账状态筛选');
  });
});

describe('finance-dashboard/page — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应导入 PageShell from @m5/ui', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell 导入');
    assert.ok(src.includes("@m5/ui"), '缺少 @m5/ui 导入');
  });

  it('应导入 finance-dashboard-data', () => {
    const src = readSource();
    assert.ok(src.includes('./finance-dashboard-data'), '缺少 finance-dashboard-data 导入');
  });

  it('应导入 finance-dashboard-service', () => {
    const src = readSource();
    assert.ok(src.includes('./finance-dashboard-service'), '缺少 finance-dashboard-service 导入');
  });
});
