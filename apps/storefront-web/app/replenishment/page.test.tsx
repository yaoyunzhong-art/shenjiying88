/**
 * 补货管理页 — 单元测试
 * 适配实际页面组件 ReplenishmentPage
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('ReplenishmentPage', () => {
  it('应导出默认函数组件 ReplenishmentPage', () => {
    assert.ok(SOURCE.includes('export default function ReplenishmentPage'));
  });

  it('渲染页面标题 补货管理', () => {
    assert.ok(SOURCE.includes('补货管理'));
  });

  it('应有 3 个补货项', () => {
    const count = (SOURCE.match(/name: '/g) || []).length;
    assert.equal(count, 3);
  });

  it('包含打印纸、可乐、游戏币', () => {
    assert.ok(SOURCE.includes('打印纸'));
    assert.ok(SOURCE.includes('饮品-可乐'));
    assert.ok(SOURCE.includes('游戏币'));
  });

  it('包含优先级标签', () => {
    assert.ok(SOURCE.includes('优先级') || SOURCE.includes('item.priority'));
  });

  it('包含状态标识', () => {
    assert.ok(SOURCE.includes('待采购') || SOURCE.includes('已下单'));
  });

  it('渲染深色主题背景', () => {
    assert.ok(SOURCE.includes('#0f172a'));
  });
});
