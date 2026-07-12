/**
 * L1冒烟测试 - Safety
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('Safety', () => {
  it('应导出一个默认组件', () => assert.ok(SRC.includes('export default function')));
  it('应包含use client指令', () => assert.ok(SRC.includes("'use client'")));
  it('应包含JSX模板', () => assert.ok(SRC.includes('return') && SRC.includes('element')));
  it('不应使用dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('应包含PageShell', () => assert.ok(SRC.includes('PageShell')));
  it('应包含安全相关关键词', () => assert.ok(SRC.includes('safety') || SRC.includes('安全')));
  it('应包含日志或记录功能', () => assert.ok(SRC.includes('log') || SRC.includes('record') || SRC.includes('记录')));
  it('应包含状态显示', () => assert.ok(SRC.includes('status') || SRC.includes('statusVariant') || SRC.includes('状态')));
});
