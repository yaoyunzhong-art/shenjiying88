/**
 * L1冒烟测试 — safety 安全管理
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
  it('应包含 use client 指令', () => assert.ok(SRC.includes("'use client'")));
  it('应包含 safety inspection checklist', () => assert.ok(SRC.includes('inspection') || SRC.includes('检查')));
  it('应包含 incident report', () => assert.ok(SRC.includes('incident') || SRC.includes('事故')));
  it('应包含 risk assessment', () => assert.ok(SRC.includes('risk') || SRC.includes('风险')));
  it('应包含 safety training', () => assert.ok(SRC.includes('training') || SRC.includes('培训')));
  it('应包含 hazard identification', () => assert.ok(SRC.includes('hazard') || SRC.includes('隐患')));
  it('不应使用dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('应包含 JSX return', () => assert.ok(SRC.includes('return')));
});
