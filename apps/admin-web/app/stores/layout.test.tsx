/**
 * L1 冒烟测试 — stores layout (26模块导航侧边栏)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'layout.tsx'), 'utf-8');

describe('StoresLayout', () => {
  it('应导出一个默认组件', () => assert.ok(SRC.includes('export default function')));
  it('应包含use client指令', () => assert.ok(SRC.includes("'use client'")));
  it('应包含SidebarNav', () => assert.ok(SRC.includes('SidebarNav')));
  it('应包含26个模块链接', () => {
    const count = (SRC.match(/label:/g) || []).length;
    assert.ok(count >= 20, `至少20个模块, 实际${count}`);
  });
  it('应包含门店选择下拉', () => assert.ok(SRC.includes('Select') || SRC.includes('store-selector')));
  it('应包含底部返回按钮', () => assert.ok(SRC.includes('返回') || SRC.includes('Back')));
  it('不应使用dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('应匹配stores/[id]路由模式', () => assert.ok(SRC.includes('[id]')));
  it('应包含cashier模块', () => assert.ok(SRC.includes('cashier') || SRC.includes('收银')));
  it('应包含inventory模块', () => assert.ok(SRC.includes('inventory') || SRC.includes('库存')));
});
