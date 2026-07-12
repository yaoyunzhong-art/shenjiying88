/**
 * L1冒烟测试 — contact
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('contact', () => {
  it('应导出一个默认组件', () => assert.ok(SRC.includes('export default function')));
  it('应包含JSX模板', () => assert.ok(SRC.includes('return') && (SRC.includes('element') || SRC.includes('div') || SRC.includes('<>'))));
  it('不应使用dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('应包含页面内容', () => assert.ok(SRC.includes('import') && SRC.length > 100));
  it('应包含关键组件引用', () => assert.ok(SRC.includes('from') || SRC.includes('@m5/')));
});
