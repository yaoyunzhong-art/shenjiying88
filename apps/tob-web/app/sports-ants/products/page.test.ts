/**
 * 🧪 龙虾哥: sports-ants/products 页面冒烟测试
 * 正例·边界·防御 三级验证 — 🎮导玩员视角看产品中心
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

describe('sports-ants/products — 正例', () => {
  it('页面文件存在且非空', () => {
    const src = readSource();
    assert.ok(src.length > 100, '页面文件太短或不存在');
  });

  it('包含默认导出函数组件', () => {
    const src = readSource();
    assert.match(src, /(export\s+default\s+function|export\s+default\s+\w+)/, '缺少默认导出组件');
  });
});

describe('sports-ants/products — 反例防御', () => {
  it('不包含硬编码私密信息', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(password|secret|api_key|token)\s*[:=]\s*['"][^'"]+['"]/i, '存在潜在泄漏的敏感信息');
  });

  it('不使用不安全的dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/, '使用了不安全的innerHTML');
  });
});
