/**
 * page.test.ts — 异业联盟看板页面 L1 冒烟测试
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

describe('alliance-dashboard/page — 正向测试', () => {
  it('应包含"异业联盟"页面标题', () => {
    const src = readSource();
    assert.ok(src.includes('异业联盟'), '缺少"异业联盟"标题');
  });

  it('应包含"伙伴管理"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('伙伴管理'), '缺少"伙伴管理"Tab');
  });

  it('应包含"分账管理"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('分账管理'), '缺少"分账管理"Tab');
  });

  it('应包含"预警中心"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('预警中心'), '缺少"预警中心"Tab');
  });

  it('应包含"全渠道触达"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('全渠道触达'), '缺少"全渠道触达"Tab');
  });

  it('应包含合作伙伴相关展示', () => {
    const src = readSource();
    assert.ok(src.includes('合作伙伴') || src.includes('partner'), '缺少合作伙伴相关展示');
  });
});

describe('alliance-dashboard/page — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应导入 PageShell from @m5/ui', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell 导入');
    assert.ok(src.includes("@m5/ui"), '缺少 @m5/ui 导入');
  });

  it('应导入 alliance-data', () => {
    const src = readSource();
    assert.ok(src.includes('./alliance-data'), '缺少 alliance-data 导入');
  });

  it('应导入 alliance-service', () => {
    const src = readSource();
    assert.ok(src.includes('./alliance-service'), '缺少 alliance-service 导入');
  });
});