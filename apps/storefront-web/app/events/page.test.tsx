/**
 * events/page.test.tsx — L1 冒烟测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('events — 正例', () => {
  it('应导出一个默认组件', () => {
    assert.ok(SRC.includes('export default function'));
  });
  it('应包含 use client', () => {
    assert.ok(SRC.includes("'use client'"));
  });
  it('应包含深色主题', () => {
    assert.ok(SRC.includes('bg-gray') || SRC.includes('gray-900'));
  });
});
