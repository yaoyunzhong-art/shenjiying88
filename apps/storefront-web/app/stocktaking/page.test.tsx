/**
 * stocktaking/page.test.tsx — 盘点列表页 L1 冒烟测试
 * 适配实际页面 StocktakingPage
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('stocktaking — 正例', () => {
  it('应导出默认函数组件 StocktakingPage', () => {
    assert.ok(SOURCE.includes('export default function StocktakingPage'));
  });

  it('渲染盘点页面标题"库存盘点"', () => {
    assert.ok(SOURCE.includes('库存盘点'));
  });

  it('有 4 个盘点项', () => {
    const count = (SOURCE.match(/name: '/g) || []).length;
    assert.equal(count, 4);
  });

  it('包含游戏币、饮料、玩偶、VR手柄', () => {
    assert.ok(SOURCE.includes('游戏币'));
    assert.ok(SOURCE.includes('饮料(箱)'));
    assert.ok(SOURCE.includes('礼品玩偶'));
    assert.ok(SOURCE.includes('VR手柄'));
  });

  it('包含 expected/actual 格式', () => {
    assert.ok(SOURCE.includes('expected'));
    assert.ok(SOURCE.includes('actual'));
  });

  it('包含差异计数', () => {
    assert.ok(SOURCE.includes('diff'));
  });

  it('渲染深色主题背景', () => {
    assert.ok(SOURCE.includes('#0f172a'));
  });
});
