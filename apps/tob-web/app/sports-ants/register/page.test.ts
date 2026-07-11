/**
 * 🧪 龙虾哥: sports-ants/register 注册页冒烟测试
 * 正例·边界·防御 — 🛒前台视角看注册流程
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

describe('sports-ants/register — 正例', () => {
  it('页面文件存在且含注册表单元素', () => {
    const src = readSource();
    assert.ok(src.length > 200, '页面内容不足');
    // 检查常见的注册相关关键字
    const hasFormKeywords = /(form|input|button|submit|regist|signup)/i.test(src);
    assert.ok(hasFormKeywords, '页面缺少注册相关元素');
  });

  it('包含默认导出组件', () => {
    const src = readSource();
    assert.match(src, /export\s+default\s+/);
  });
});

describe('sports-ants/register — 反例防御', () => {
  it('不包含硬编码凭据', () => {
    const src = readSource();
    assert.doesNotMatch(src, /password\s*[:=]\s*['"][^'"]+['"]/i);
  });
});
