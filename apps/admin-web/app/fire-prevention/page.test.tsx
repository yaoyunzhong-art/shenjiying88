/**
 * L1冒烟测试 - FirePrevention
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('FirePrevention', () => {
  it('应导出一个默认组件', () => assert.ok(SRC.includes('export default function')));
  it('应包含use client指令', () => assert.ok(SRC.includes("'use client'")));
  it('应包含JSX模板', () => assert.ok(SRC.includes('return') && SRC.includes('element')));
  it('不应使用dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('应包含PageShell', () => assert.ok(SRC.includes('PageShell')));
  it('应包含安全/消防相关关键词', () => assert.ok(SRC.includes('fire') || SRC.includes('消防')));
  it('应包含检查表或列表内容', () => assert.ok(SRC.includes('inspection') || SRC.includes('检查')));
  it('应包含操作按钮', () => assert.ok(SRC.includes('Button') || SRC.includes('button')));
});
