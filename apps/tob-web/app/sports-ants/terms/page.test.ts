/**
 * 🧪 龙虾哥: sports-ants/terms 服务条款页冒烟测试
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

describe('sports-ants/terms — 正例', () => {
  it('文件存在且非空', () => {
    assert.ok(readSource().length > 100);
  });

  it('包含默认导出组件', () => {
    assert.match(readSource(), /export\s+default\s+/);
  });
});

describe('sports-ants/terms — 防御', () => {
  it('不包含敏感硬编码', () => {
    assert.doesNotMatch(readSource(), /(password|secret)\s*[:=]\s*['"][^'"]+['"]/i);
  });
});
