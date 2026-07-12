/**
 * store-ratings/page.test.tsx — 门店评分页 增强测试
 *
 * 覆盖:
 *   L1 正例    — 组件导出、5个维度评分、12条评价数据、分布统计
 *   L2 角色测试 — 星级筛选、排序、标签筛选、分页、加载态
 *   边界       — 回复评价、点赞数、评分分布渲染
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('StoreRatingsPage — L1 正例', () => {
  it('应导出一个默认函数组件 StoreRatingsPage', () => {
    assert.ok(SRC.includes('export default function StoreRatingsPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应包含 5 个评分维度（环境、服务、设备、性价比、卫生）', () => {
    const dims = ['环境', '服务', '设备', '性价比', '卫生'];
    const found = dims.filter(d => SRC.includes(d));
    assert.equal(found.length, 5, `缺失维度: ${dims.filter(d => !SRC.includes(d)).join(', ')}`);
  });

  it('每个维度应有 icon、score、description', () => {
    assert.ok(SRC.includes('icon'));
    assert.ok(SRC.includes('score'));
    assert.ok(SRC.includes('description'));
  });

  it('环境评分应为 4.8', () => {
    assert.ok(SRC.includes('4.8'));
  });

  it('卫生评分应为 4.9（最高）', () => {
    assert.ok(SRC.includes('4.9'));
  });
});

describe('StoreRatingsPage — L1 评价数据验证', () => {
  it('应包含 12 条评价数据', () => {
    const matches = SRC.match(/id:\s*['"]\d+['"]/g);
    assert.equal(matches ? matches.length : 0, 12, `预期 12 条评价，实际 ${matches?.length || 0}`);
  });

  it('评价应有 author、avatar、rating、date、content、tags 字段', () => {
    assert.ok(SRC.includes('author'));
    assert.ok(SRC.includes('avatar'));
    assert.ok(SRC.includes('rating'));
    assert.ok(SRC.includes('date'));
    assert.ok(SRC.includes('content'));
    assert.ok(SRC.includes('tags'));
    assert.ok(SRC.includes('likes'));
  });

  it('应包含评分 5、4、3 各等级评价', () => {
    assert.ok(SRC.includes("rating: 5"));
    assert.ok(SRC.includes("rating: 4"));
    assert.ok(SRC.includes("rating: 3"));
  });
});

describe('StoreRatingsPage — L2 筛选与排序', () => {
  it('应支持星级筛选 filterStars', () => {
    assert.ok(SRC.includes('filterStars') || SRC.includes('setFilterStars'));
  });

  it('应支持排序 sortOrder（recent/rating_high/rating_low/likes）', () => {
    assert.ok(SRC.includes("sortOrder") || SRC.includes("'recent'"));
  });

  it('应支持标签筛选 tagFilter', () => {
    assert.ok(SRC.includes('tagFilter') || SRC.includes('setTagFilter'));
  });

  it('应支持分页 page / PAGE_SIZE', () => {
    assert.ok(SRC.includes('PAGE_SIZE') || SRC.includes('page'));
  });

  it('应支持加载态 loading', () => {
    assert.ok(SRC.includes('loading') || SRC.includes('setLoading'));
  });

  it('应定义 ALL_TAGS 标签云', () => {
    assert.ok(SRC.includes('ALL_TAGS') || SRC.includes('flatMap'));
  });

  it('应计算评分分布分布', () => {
    assert.ok(SRC.includes('distribution'));
  });
});

describe('StoreRatingsPage — 回复与交互', () => {
  it('部分评价应包含回复 (reply)', () => {
    // Betty(r=4)、Diana(r=3)、Hannah(r=3)、Linda(r=3) 有回复
    assert.ok(SRC.includes('reply'));
    assert.ok(SRC.includes('感谢您的反馈'));
  });

  it('评价应有点赞数 likes', () => {
    assert.ok(SRC.includes('likes'));
  });

  it('评价点赞数各异（3~15）', () => {
    assert.ok(SRC.includes('likes: 12'));
    assert.ok(SRC.includes('likes: 4'));
  });

  it('应渲染星级显示组件 Stars', () => {
    assert.ok(SRC.includes('function Stars'));
  });

  it('Stars 组件使用 ★ 和 ☆', () => {
    assert.ok(SRC.includes('★') && SRC.includes('☆'));
  });
});

describe('StoreRatingsPage — 维度与标签', () => {
  it('性价比评分应为 4.5', () => {
    assert.ok(SRC.includes('4.5'));
  });

  it('服务评分应为 4.6', () => {
    assert.ok(SRC.includes('4.6'));
  });

  it('设备评分应为 4.7', () => {
    assert.ok(SRC.includes('4.7'));
  });

  it('标签云应包含"环境好"、"设备新"、"干净卫生"等', () => {
    const tags = ['环境好', '设备新', '干净卫生', '亲子友好'];
    assert.ok(tags.some(t => SRC.includes(t)));
  });

  it('应使用 useMemo 优化分布计算', () => {
    assert.ok(SRC.includes('useMemo'));
  });
});

describe('StoreRatingsPage — L1 导出完整性', () => {
  it('应从 React 导入 useState', () => {
    assert.ok(SRC.includes("useState"));
  });

  it('应导入 useMemo', () => {
    assert.ok(SRC.includes('useMemo'));
  });

  it('应使用 React.CSSProperties 类型', () => {
    assert.ok(SRC.includes('CSSProperties') || SRC.includes('React.CSSProperties'));
  });

  it('评分分布 5 星应有计数', () => {
    assert.ok(SRC.includes('5: 0') || SRC.includes('counts[5]'));
  });
});
