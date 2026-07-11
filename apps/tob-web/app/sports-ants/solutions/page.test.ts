/**
 * 🧪 龙虾哥: sports-ants/solutions 解决方案页冒烟测试
 * 正例·边界·防御 — 👔店长视角看行业解决方案
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

describe('sports-ants/solutions — 正例', () => {
  it('页面文件存在且非空', () => {
    const src = readSource();
    assert.ok(src.length > 100);
  });

  it('包含默认导出组件', () => {
    const src = readSource();
    assert.match(src, /export\s+default\s+/);
  });
});

describe('sports-ants/solutions — 反例防御', () => {
  it('不引入可能泄露的信息', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(apiKey|secretKey|private_key)\s*[:=]/i);
  });
});
