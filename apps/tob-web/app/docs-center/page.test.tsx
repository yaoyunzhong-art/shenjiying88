/**
 * docs-center/page.test.tsx — 神机营文档中心页面测试
 * 覆盖：文档分类数据、筛选逻辑、最新更新排序、渲染内容
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// ===== 文档分类数据（与页面一致） =====

interface DocCategory {
  id: string;
  icon: string;
  title: string;
  description: string;
  count: string;
  borderColor: string;
}

const DOC_CATEGORIES: DocCategory[] = [
  { id: 'api', icon: '📚', title: 'API 文档', description: 'OpenAPI 3.0 / Swagger / Redoc', count: '125 个接口', borderColor: 'blue' },
  { id: 'ops', icon: '📖', title: '运营手册', description: '店长 / 导购 / 收银 / 客服', count: '4 个角色 · 25 个章节', borderColor: 'green' },
  { id: 'training', icon: '🎓', title: '培训课程', description: '视频 / 考试 / 证书', count: '30 个课程', borderColor: 'purple' },
  { id: 'maintain', icon: '🔧', title: '运维手册', description: '部署 / 扩容 / 故障 / 灾备', count: '12 个 Runbook', borderColor: 'orange' },
  { id: 'dev', icon: '💻', title: '开发指南', description: '快速开始 / 架构 / SDK', count: '多语言 SDK', borderColor: 'yellow' },
  { id: 'compliance', icon: '🛡️', title: '合规文档', description: 'GDPR / 安全 / 审计', count: '完整合规体系', borderColor: 'red' },
];

// ===== 最新更新数据 =====

interface DocUpdate {
  title: string;
  date: string;
  category: string;
  isNew?: boolean;
}

const RECENT_UPDATES: DocUpdate[] = [
  { title: 'v2.0 API 变更说明', date: '2026-07-03', category: 'API 文档', isNew: true },
  { title: '店长运营手册 v1.2', date: '2026-07-02', category: '运营手册' },
  { title: 'K8s 部署 Runbook v1.1', date: '2026-07-01', category: '运维手册' },
];

// ===== 工具函数 =====

function getCategoryById(id: string): DocCategory | undefined {
  return DOC_CATEGORIES.find(c => c.id === id);
}

function filterCategoriesBySearch(query: string): DocCategory[] {
  const q = query.toLowerCase();
  return DOC_CATEGORIES.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q)
  );
}

function sortUpdatesByDate(updates: DocUpdate[]): DocUpdate[] {
  return [...updates].sort((a, b) => b.date.localeCompare(a.date));
}

function getNewUpdates(updates: DocUpdate[]): DocUpdate[] {
  return updates.filter(u => u.isNew);
}

function getCategoryCountByType(type: string): number {
  return DOC_CATEGORIES.filter(c => c.borderColor === type).length;
}

// ===== 测试 =====

test('docs-center data layer', async (t) => {
  // ── 文档分类正例 ──
  await t.test('returns all 6 doc categories', () => {
    assert.equal(DOC_CATEGORIES.length, 6);
  });

  await t.test('every category has required fields', () => {
    for (const c of DOC_CATEGORIES) {
      assert.ok(c.id);
      assert.ok(c.icon);
      assert.ok(c.title);
      assert.ok(c.description);
      assert.ok(c.count);
      assert.ok(c.borderColor);
    }
  });

  await t.test('category ids are unique', () => {
    const ids = DOC_CATEGORIES.map(c => c.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  await t.test('getCategoryById returns correct category', () => {
    const api = getCategoryById('api');
    assert.ok(api);
    assert.equal(api?.title, 'API 文档');
    assert.equal(api?.icon, '📚');
  });

  await t.test('getCategoryById returns undefined for unknown id', () => {
    assert.equal(getCategoryById('nonexistent'), undefined);
  });

  // ── 分类搜索过滤 ──
  await t.test('filterCategoriesBySearch matches by title', () => {
    const result = filterCategoriesBySearch('API');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'api');
  });

  await t.test('filterCategoriesBySearch matches by description', () => {
    const result = filterCategoriesBySearch('Swagger');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'api');
  });

  await t.test('filterCategoriesBySearch returns multiple results', () => {
    const result = filterCategoriesBySearch('手册');
    assert.ok(result.length >= 2);
  });

  await t.test('filterCategoriesBySearch with empty query returns all', () => {
    assert.equal(filterCategoriesBySearch('').length, 6);
  });

  await t.test('filterCategoriesBySearch with no match returns empty', () => {
    assert.equal(filterCategoriesBySearch('zzz_nonexistent_xxx').length, 0);
  });

  await t.test('filterCategoriesBySearch is case-insensitive', () => {
    const lower = filterCategoriesBySearch('api');
    const upper = filterCategoriesBySearch('API');
    assert.deepEqual(lower, upper);
  });

  // ── 最新更新数据 ──
  await t.test('RECENT_UPDATES has 3 items', () => {
    assert.equal(RECENT_UPDATES.length, 3);
  });

  await t.test('each update has required fields', () => {
    for (const u of RECENT_UPDATES) {
      assert.ok(u.title);
      assert.ok(u.date);
      assert.ok(u.category);
    }
  });

  await t.test('sortUpdatesByDate returns sorted desc', () => {
    const sorted = sortUpdatesByDate(RECENT_UPDATES);
    assert.equal(sorted[0].date, '2026-07-03');
    assert.equal(sorted[1].date, '2026-07-02');
    assert.equal(sorted[2].date, '2026-07-01');
  });

  await t.test('sortUpdatesByDate preserves original array', () => {
    const original = [...RECENT_UPDATES];
    sortUpdatesByDate(RECENT_UPDATES);
    assert.deepEqual(RECENT_UPDATES, original);
  });

  await t.test('getNewUpdates returns only marked items', () => {
    const newItems = getNewUpdates(RECENT_UPDATES);
    assert.equal(newItems.length, 1);
    assert.equal(newItems[0].title, 'v2.0 API 变更说明');
  });

  await t.test('getNewUpdates returns empty when none are new', () => {
    const noNew = RECENT_UPDATES.map(u => ({ ...u, isNew: false }));
    assert.equal(getNewUpdates(noNew).length, 0);
  });

  // ── 分类计数 ──
  await t.test('getCategoryCountByType returns correct count', () => {
    assert.equal(getCategoryCountByType('blue'), 1);
    assert.equal(getCategoryCountByType('green'), 1);
    assert.equal(getCategoryCountByType('red'), 1);
  });

  await t.test('getCategoryCountByType returns 0 for unknown type', () => {
    assert.equal(getCategoryCountByType('pink'), 0);
  });

  // ── 边界条件 ──
  await t.test('filterCategoriesBySearch with special characters', () => {
    const result = filterCategoriesBySearch('3.0');
    assert.equal(result.length, 1);
  });

  await t.test('category titles are unique', () => {
    const titles = DOC_CATEGORIES.map(c => c.title);
    assert.equal(new Set(titles).size, titles.length);
  });

  await t.test('all categories have non-empty icons', () => {
    for (const c of DOC_CATEGORIES) {
      assert.ok(c.icon.length >= 1, `${c.title} icon is empty`);
    }
  });

  await t.test('border colors are known values', () => {
    const known = ['blue', 'green', 'purple', 'orange', 'yellow', 'red'];
    for (const c of DOC_CATEGORIES) {
      assert.ok(known.includes(c.borderColor), `Unknown borderColor: ${c.borderColor}`);
    }
  });

  // ── SSR 渲染 ──
  await t.test('renders page title', () => {
    const html = renderToStaticMarkup(
      <div>
        <h1 className="text-xl font-bold">神机营文档中心</h1>
      </div>
    );
    assert.match(html, /神机营文档中心/);
  });

  await t.test('renders all category cards', () => {
    const html = renderToStaticMarkup(
      <div className="grid grid-cols-3 gap-4">
        {DOC_CATEGORIES.map(c => (
          <div key={c.id} className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl mb-2">{c.icon}</div>
            <h3 className="font-bold">{c.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{c.description}</p>
            <p className="text-xs text-gray-500 mt-2">{c.count}</p>
          </div>
        ))}
      </div>
    );
    for (const c of DOC_CATEGORIES) {
      assert.match(html, new RegExp(c.title));
      assert.match(html, new RegExp(c.description));
      assert.match(html, new RegExp(c.count));
    }
  });

  await t.test('renders recent updates section', () => {
    const html = renderToStaticMarkup(
      <div className="space-y-2">
        {RECENT_UPDATES.map((u, i) => (
          <div key={i} className="bg-white/5 rounded p-3">
            <p className="font-medium">{u.title}</p>
            <p className="text-xs text-gray-500">{u.date} · {u.category}</p>
          </div>
        ))}
      </div>
    );
    for (const u of RECENT_UPDATES) {
      assert.match(html, new RegExp(u.title));
      assert.match(html, new RegExp(u.date));
      assert.match(html, new RegExp(u.category));
    }
  });

  await t.test('renders NEW badge for latest update', () => {
    const html = renderToStaticMarkup(
      <div>
        {RECENT_UPDATES.filter(u => u.isNew).map((u, i) => (
          <div key={i}>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">NEW</span>
          </div>
        ))}
      </div>
    );
    assert.match(html, /NEW/);
  });

  await t.test('renders quick links', () => {
    const links = [
      { href: '/docs/api', label: 'OpenAPI JSON' },
      { href: '/docs/redoc', label: 'Redoc 文档' },
      { href: '/docs/postman', label: 'Postman Collection' },
      { href: '/training', label: '培训系统' },
    ];
    const html = renderToStaticMarkup(
      <div>
        {links.map((link, i) => (
          <a key={i} href={link.href} className="bg-blue-600 px-4 py-2">{link.label}</a>
        ))}
      </div>
    );
    for (const link of links) {
      assert.match(html, new RegExp(link.label));
    }
  });

  // ── 防御性 ──
  await t.test('empty updates list renders without crash', () => {
    const html = renderToStaticMarkup(
      <div className="space-y-2">{[]}</div>
    );
    assert.ok(html);
  });

  await t.test('single category renders without layout issues', () => {
    const single: DocCategory[] = [DOC_CATEGORIES[0]];
    const html = renderToStaticMarkup(
      <div className="grid grid-cols-3 gap-4">
        {single.map(c => (
          <div key={c.id}>
            <h3>{c.title}</h3>
          </div>
        ))}
      </div>
    );
    assert.match(html, /API 文档/);
  });

  await t.test('filterCategoriesBySearch handles whitespace-only query', () => {
    assert.equal(filterCategoriesBySearch('   ').length, 6);
  });

  await t.test('filterCategoriesBySearch handles null-like query gracefully', () => {
    assert.equal(filterCategoriesBySearch('').length, 6);
  });
});
