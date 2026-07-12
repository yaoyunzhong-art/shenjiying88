/**
 * L1冒烟测试 — fire-prevention 消防安全
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
  it('应包含 use client 指令', () => assert.ok(SRC.includes("'use client'")));
  it('应包含 fire safety inspection form', () => assert.ok(SRC.includes('inspection') || SRC.includes('检查')));
  it('应包含 equipment checklist', () => assert.ok(SRC.includes('equipment') || SRC.includes('设备')));
  it('应包含 emergency plan', () => assert.ok(SRC.includes('emergency') || SRC.includes('应急')));
  it('应包含 fire drill log', () => assert.ok(SRC.includes('drill') || SRC.includes('演练')));
  it('应包含 status indicators', () => assert.ok(SRC.includes('status') || SRC.includes('Status')));
  it('不应使用dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('应包含 JSX return', () => assert.ok(SRC.includes('return')));
});
