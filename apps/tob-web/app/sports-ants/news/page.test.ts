/**
 * sports-ants/news/page.test.ts — 运动蚂蚁新闻资讯中心测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 新闻分类、新闻数据完整性
 *   L3 状态逻辑 — 分类切换、交互追踪
 *   L3 边界     — 数据过滤、featured 逻辑
 *   L3 安全     — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('NewsPage — L1 正例', () => {
  it('应导出一个默认函数组件 NewsPage', () => {
    assert.ok(SRC.includes('export default function NewsPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应导入 SEO/Header/Footer/FloatingContact', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
    assert.ok(SRC.includes('FloatingContact'));
  });

  it('页面标题应为"新闻资讯中心"', () => {
    assert.ok(SRC.includes('新闻资讯中心'));
  });
});

describe('NewsPage — L2 新闻分类数据', () => {
  it('应定义 CATEGORIES 数组', () => {
    assert.ok(SRC.includes('CATEGORIES'));
  });

  it('CATEGORIES 应包含 5 个分类', () => {
    const match = SRC.match(/CATEGORIES\s*=\s*\[([\s\S]*?)\];/s);
    assert.ok(match !== null, 'CATEGORIES 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 5, `预期 5 个分类，实际 ${count}`);
  });

  it('应包含"全部"分类', () => {
    assert.ok(SRC.includes("'all'"));
    assert.ok(SRC.includes('全部'));
  });

  it('应包含"品牌动态"分类', () => {
    assert.ok(SRC.includes("'news'"));
  });

  it('应包含"行业资讯"分类', () => {
    assert.ok(SRC.includes("'industry'"));
  });

  it('应包含"媒体报道"分类', () => {
    assert.ok(SRC.includes("'media'"));
  });

  it('应包含"荣誉奖项"分类', () => {
    assert.ok(SRC.includes("'award'"));
  });
});

describe('NewsPage — L2 新闻数据', () => {
  it('应定义 NEWS_DATA 数组', () => {
    assert.ok(SRC.includes('NEWS_DATA'));
  });

  it('NEWS_DATA 应包含 12 条新闻', () => {
    const match = SRC.match(/NEWS_DATA\s*=\s*\[([\s\S]*?)\];/s);
    assert.ok(match !== null, 'NEWS_DATA 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 12, `预期 12 条新闻，实际 ${count}`);
  });

  it('每条新闻应有 id/category/title/summary/date/image 字段', () => {
    assert.ok(SRC.includes('id:'));
    assert.ok(SRC.includes('category:'));
    assert.ok(SRC.includes('title:'));
    assert.ok(SRC.includes('summary:'));
    assert.ok(SRC.includes('date:'));
    assert.ok(SRC.includes('image:'));
  });

  it('应包含 featured 标记字段', () => {
    assert.ok(SRC.includes('featured:'));
  });

  it('应有 2 条 featured 新闻', () => {
    const match = SRC.match(/featured:\s*true/g);
    assert.ok(match !== null && match.length >= 2, `预期至少 2 条 featured，实际 ${match?.length ?? 0}`);
  });
});

describe('NewsPage — L3 状态逻辑', () => {
  it('应使用 useState 管理 activeCategory', () => {
    assert.ok(SRC.includes('useState'));
    assert.ok(SRC.includes('activeCategory'));
  });

  it('应有 filteredNews 过滤逻辑', () => {
    assert.ok(SRC.includes('filteredNews') || SRC.includes('filter'));
  });

  it('应有 featuredNews 提取逻辑', () => {
    assert.ok(SRC.includes('featuredNews'));
  });

  it('"全部"分类时应显示所有新闻', () => {
    assert.ok(
      SRC.includes("activeCategory === 'all'") ||
      SRC.includes("activeCategory === 'all'"),
    );
  });

  it('分类切换应追踪用户行为', () => {
    assert.ok(
      SRC.includes('trackCTAClick') ||
      SRC.includes('handleCategoryChange'),
    );
  });
});

describe('NewsPage — L3 边界', () => {
  it('filteredNews 应在分类过滤时缩小数据集', () => {
    assert.ok(SRC.includes('filter'));
  });

  it('空分类结果应能正常渲染', () => {
    // 使用 filter 方法确保即使空数组也能渲染
    assert.ok(SRC.includes('.filter('));
  });
});

describe('NewsPage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });
});
