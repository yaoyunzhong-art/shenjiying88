import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('采购 — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含hook', () => assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback')));
});

describe('采购 — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
});

describe('采购 — 业务', () => {
  it('包含业务数据引用', () => assert.ok(SRC.includes('MOCK_') || SRC.includes('const ') || SRC.includes('useState')));
});
