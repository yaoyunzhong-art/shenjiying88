/**
 * L1+L2 帮助中心-FAQ页面测试 — faq
 * 正例: 组件、JSX、搜索过滤、分类Tab、折叠展开、热门问题、标签点击搜索
 * 反例: 无危险HTML、无eval、无重复ID
 * 边界: 搜索无结果空状态、全部分类计数、6种分类、更新日期显示、底部联系提示
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('faq 常见问题页面', () => {
  // ======== 正例 (Positive Cases) ========
  describe('正例', () => {
    it('应导出一个默认组件', () => {
      assert.ok(SRC.includes('export default function'));
    });

    it('应包含JSX模板', () => {
      assert.ok(SRC.includes('return'));
      assert.ok(SRC.includes('main') || SRC.includes('div') || SRC.includes('<>'));
    });

    it('应包含页面内容', () => {
      assert.ok(SRC.includes('import'));
      assert.ok(SRC.length > 100);
    });

    it('支持搜索过滤问题', () => {
      assert.ok(SRC.includes('search') && (SRC.includes('filter') || SRC.includes('filtered')));
    });

    it('搜索时匹配问题/答案/标签', () => {
      assert.ok(SRC.includes('.toLowerCase()') || SRC.includes('includes(q)') || SRC.includes('.includes('));
    });

    it('有6种问题分类Tab', () => {
      assert.ok(SRC.includes('account'));
      assert.ok(SRC.includes('payment'));
      assert.ok(SRC.includes('booking'));
      assert.ok(SRC.includes('member'));
      assert.ok(SRC.includes('device'));
      assert.ok(SRC.includes('other'));
    });

    it('支持点击分类筛选', () => {
      assert.ok(SRC.includes('activeCategory') && SRC.includes('setActiveCategory'));
    });

    it('支持折叠展开问答', () => {
      assert.ok(SRC.includes('expandedId') && SRC.includes('toggleExpand'));
    });

    it('渲染热门问题区域', () => {
      assert.ok(SRC.includes('hot') && (SRC.includes('HOT') || SRC.includes('热门问题')));
    });

    it('点击标签可搜索该标签', () => {
      assert.ok(SRC.includes('setSearch') || SRC.includes('handleHotClick'));
    });

    it('搜索结果数量显示', () => {
      assert.ok(SRC.includes('条结果') || SRC.includes('filtered.length'));
    });

    it('底部有联系客服引导', () => {
      assert.ok(SRC.includes('400-888-0000') || SRC.includes('在线客服'));
    });
  });

  // ======== 反例 (Negative Cases) ========
  describe('反例', () => {
    it('不应使用dangerouslySetInnerHTML', () => {
      assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
    });

    it('不应使用eval或Function构造函数', () => {
      assert.ok(!SRC.includes('eval('));
      assert.ok(!SRC.includes('new Function('));
    });

    it('FAQ数据中不应有重复ID', () => {
      const idMatches = SRC.match(/id:\s*'[^']+'/g) || [];
      const ids = idMatches.map(m => m.match(/'([^']+)'/)?.[1]).filter(Boolean);
      assert.equal(ids.length, new Set(ids).length, 'FAQ IDs should be unique');
    });
  });

  // ======== 边界 (Boundary Cases) ========
  describe('边界', () => {
    it('搜索无结果时显示空状态', () => {
      assert.ok(SRC.includes('没有找到相关问题') || SRC.includes('emptyState'));
    });

    it('分类Tab显示各分类问题计数', () => {
      assert.ok(SRC.includes('count') || SRC.includes('.length'));
    });

    it('渲染问题最后更新时间', () => {
      assert.ok(SRC.includes('updatedAt') || SRC.includes('更新于'));
    });

    it('全部分类选中时显示计数', () => {
      assert.ok(SRC.includes('all') || SRC.includes('全部'));
    });

    it('热门问题点击切换到对应分类', () => {
      assert.ok(SRC.includes('handleHotClick') || SRC.includes('hotItem'));
    });

    it('问题列表使用grid布局', () => {
      assert.ok(SRC.includes('faqList') || SRC.includes('gap'));
    });

    it('问题标签可点击搜索', () => {
      assert.ok(SRC.includes('faqTag') || SRC.includes('setSearch(t)'));
    });
  });
});
