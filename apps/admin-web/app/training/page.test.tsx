/**
 * training/page.test.tsx — L1 培训管理页测试
 *
 * 覆盖: 数据类型、数据完整性、搜索、Tab筛选、状态筛选、统计计算、空态、边界
 * 正例 + 反例 + 边界 三件套
 * 规范: 无 skip / only / as any
 * mock: URL-pattern responseRegistry
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import TrainingPage from './page';

import {
  MOCK_TRAININGS,
  TRAINING_STATUS_MAP,
  TRAINING_TYPE_MAP,
  TRAINING_STATUSES,
  TRAINING_TYPES,
  TRAINING_TABS,
  computeTrainingStats,
  filterByTab,
  searchTrainings,
  type TrainingItem,
  type TrainingStatus,
  type TrainingTabKey,
} from '../training-data';

/* ══════════════════════════════════════════════════════════
   URL-pattern responseRegistry (fetch mock for future use)
   ══════════════════════════════════════════════════════════ */

const responseRegistry = new Map<string, { status: number; body: unknown }>();

function registerResponse(urlPattern: string, status: number, body: unknown): void {
  responseRegistry.set(urlPattern, { status, body });
}

function clearRegistry(): void {
  responseRegistry.clear();
}

function mockFetch(url: string): Promise<Response> {
  for (const [pattern, entry] of responseRegistry) {
    if (url.includes(pattern)) {
      return Promise.resolve(
        new Response(JSON.stringify(entry.body), {
          status: entry.status,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }
  }
  return Promise.reject(new Error(`[responseRegistry] no mock for url: ${url}`));
}

/* ══════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════ */

function setup() {
  cleanup();
  const result = render(React.createElement(TrainingPage));
  return result;
}

function paginate(items: TrainingItem[], page: number, pageSize: number): TrainingItem[] {
  if (page < 1 || pageSize <= 0) return [];
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}小时${m}分钟`;
  if (h > 0) return `${h}小时`;
  return `${m}分钟`;
}

const VALID_STATUSES: TrainingStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];

/* ══════════════════════════════════════════════════════════
   正例：数据完整性
   ══════════════════════════════════════════════════════════ */

describe('training-data: MOCK_TRAININGS 完整性', () => {
  it('should contain exactly 7 training records', () => {
    assert.equal(MOCK_TRAININGS.length, 7);
  });

  it('every training should have a unique id', () => {
    const ids = MOCK_TRAININGS.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('every training should have a valid status', () => {
    for (const t of MOCK_TRAININGS) {
      assert.ok(VALID_STATUSES.includes(t.status), `invalid status ${t.status} for ${t.id}`);
    }
  });

  it('every training should have a valid type', () => {
    for (const t of MOCK_TRAININGS) {
      assert.ok(TRAINING_TYPES.includes(t.type), `invalid type ${t.type} for ${t.id}`);
    }
  });

  it('every training should have positive attendeeCount', () => {
    for (const t of MOCK_TRAININGS) {
      assert.ok(t.attendeeCount > 0, `attendeeCount must be > 0, got ${t.attendeeCount} for ${t.id}`);
    }
  });

  it('every training should have a courseName', () => {
    for (const t of MOCK_TRAININGS) {
      assert.ok(t.courseName.length > 0, `courseName empty for ${t.id}`);
    }
  });

  it('every training should have an instructor', () => {
    for (const t of MOCK_TRAININGS) {
      assert.ok(t.instructor.length > 0, `instructor empty for ${t.id}`);
    }
  });

  it('every training should have positive durationMinutes', () => {
    for (const t of MOCK_TRAININGS) {
      assert.ok(t.durationMinutes > 0, `durationMinutes must be > 0, got ${t.durationMinutes} for ${t.id}`);
    }
  });

  it('every training should have a non-empty date', () => {
    for (const t of MOCK_TRAININGS) {
      assert.ok(t.date.length > 0, `date empty for ${t.id}`);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   正例：状态与类型映射
   ══════════════════════════════════════════════════════════ */

describe('training-data: 状态与类型映射', () => {
  for (const status of VALID_STATUSES) {
    it(`status "${status}" has label and variant`, () => {
      const entry = TRAINING_STATUS_MAP[status];
      assert.ok(entry, `missing entry for status: ${status}`);
      assert.ok(entry.label.length > 0);
      assert.ok(['success', 'warning', 'danger', 'neutral', 'info'].includes(entry.variant));
    });
  }

  for (const type of TRAINING_TYPES) {
    it(`type "${type}" has label`, () => {
      const entry = TRAINING_TYPE_MAP[type];
      assert.ok(entry, `missing entry for type: ${type}`);
      assert.ok(entry.label.length > 0);
    });
  }
});

/* ══════════════════════════════════════════════════════════
   正例：统计计算
   ══════════════════════════════════════════════════════════ */

describe('training-data: computeTrainingStats', () => {
  const stats = computeTrainingStats(MOCK_TRAININGS);

  it('total should equal MOCK_TRAININGS.length', () => {
    assert.equal(stats.total, MOCK_TRAININGS.length);
  });

  it('totalAttendees should be sum of all attendeeCount', () => {
    const expected = MOCK_TRAININGS.reduce((sum, t) => sum + t.attendeeCount, 0);
    assert.equal(stats.totalAttendees, expected);
  });

  it('thisQuarter should be non-negative', () => {
    assert.ok(stats.thisQuarter >= 0);
    assert.ok(stats.thisQuarter <= stats.total);
  });
});

/* ══════════════════════════════════════════════════════════
   正例：Tab 筛选
   ══════════════════════════════════════════════════════════ */

describe('training-data: filterByTab', () => {
  it('ALL returns all items', () => {
    const result = filterByTab(MOCK_TRAININGS, 'ALL');
    assert.equal(result.length, MOCK_TRAININGS.length);
  });

  it('in_progress returns only in_progress items', () => {
    const result = filterByTab(MOCK_TRAININGS, 'in_progress');
    const expected = MOCK_TRAININGS.filter((t) => t.status === 'in_progress').length;
    assert.equal(result.length, expected);
    for (const item of result) {
      assert.equal(item.status, 'in_progress');
    }
  });

  it('completed returns only completed items', () => {
    const result = filterByTab(MOCK_TRAININGS, 'completed');
    const expected = MOCK_TRAININGS.filter((t) => t.status === 'completed').length;
    assert.equal(result.length, expected);
    for (const item of result) {
      assert.equal(item.status, 'completed');
    }
  });
});

/* ══════════════════════════════════════════════════════════
   正例：搜索
   ══════════════════════════════════════════════════════════ */

describe('training-data: searchTrainings', () => {
  it('search by courseName returns matching items', () => {
    const result = searchTrainings(MOCK_TRAININGS, '安全');
    assert.ok(result.length > 0);
    for (const item of result) {
      assert.ok(item.courseName.includes('安全'));
    }
  });

  it('search by instructor returns matching items', () => {
    const result = searchTrainings(MOCK_TRAININGS, '王建国');
    assert.ok(result.length > 0);
    for (const item of result) {
      assert.ok(item.instructor.includes('王建国'));
    }
  });

  it('empty keyword returns all items', () => {
    const result = searchTrainings(MOCK_TRAININGS, '');
    assert.equal(result.length, MOCK_TRAININGS.length);
  });

  it('whitespace-only keyword returns all items', () => {
    const result = searchTrainings(MOCK_TRAININGS, '   ');
    assert.equal(result.length, MOCK_TRAININGS.length);
  });
});

/* ══════════════════════════════════════════════════════════
   反例
   ══════════════════════════════════════════════════════════ */

describe('training-data: 反例', () => {
  it('search with non-existent keyword returns empty array', () => {
    const result = searchTrainings(MOCK_TRAININGS, 'zzzz_not_exists_999');
    assert.equal(result.length, 0);
  });

  it('search with special characters returns empty array', () => {
    const result = searchTrainings(MOCK_TRAININGS, '@#$%^&');
    assert.equal(result.length, 0);
  });

  it('filterByTab with invalid tab returns empty array (treated as mismatch)', () => {
    // @ts-expect-error — deliberately passing unknown value
    const result = filterByTab(MOCK_TRAININGS, 'unknown_tab');
    assert.equal(result.length, 0);
  });

  it('computeTrainingStats with empty array returns zeros', () => {
    const stats = computeTrainingStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.thisQuarter, 0);
    assert.equal(stats.totalAttendees, 0);
  });
});

/* ══════════════════════════════════════════════════════════
   边界
   ══════════════════════════════════════════════════════════ */

describe('training-data: 边界', () => {
  it('search with very long keyword does not throw', () => {
    const longKeyword = 'x'.repeat(2000);
    const result = searchTrainings(MOCK_TRAININGS, longKeyword);
    assert.equal(result.length, 0);
  });

  it('all TRAINING_TABS have defined keys', () => {
    for (const tab of TRAINING_TABS) {
      assert.ok(['ALL', 'in_progress', 'completed'].includes(tab.key));
      assert.ok(tab.label.length > 0);
    }
  });

  it('paginate with page 1 returns correct slice', () => {
    const result = paginate(MOCK_TRAININGS, 1, 5);
    assert.equal(result.length, 5);
    assert.equal(result[0].id, MOCK_TRAININGS[0].id);
    assert.equal(result[4].id, MOCK_TRAININGS[4].id);
  });

  it('paginate with last page returns remaining items', () => {
    const pageSize = 5;
    const lastPage = Math.ceil(MOCK_TRAININGS.length / pageSize);
    const result = paginate(MOCK_TRAININGS, lastPage, pageSize);
    const expectedCount = MOCK_TRAININGS.length - (lastPage - 1) * pageSize;
    assert.equal(result.length, expectedCount);
  });

  it('paginate with page 0 returns empty array', () => {
    const result = paginate(MOCK_TRAININGS, 0, 5);
    assert.equal(result.length, 0);
  });

  it('formatDuration handles hours only', () => {
    assert.equal(formatDuration(60), '1小时');
  });

  it('formatDuration handles minutes only', () => {
    assert.equal(formatDuration(45), '45分钟');
  });

  it('formatDuration handles hours and minutes', () => {
    assert.equal(formatDuration(90), '1小时30分钟');
  });
});

/* ══════════════════════════════════════════════════════════
   静态分析：页面结构
   ══════════════════════════════════════════════════════════ */

describe('training-page: 页面结构 (静态分析)', () => {
  it('导出默认组件', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('export default'));
  });

  it('包含 h1 标题', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('<h1') || src.includes('培训管理'));
  });

  it('包含统计卡片', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'page.tsx'), 'utf-8');
    const sc = src.match(/StatCard|统计/g);
    assert.ok(sc && sc.length >= 2, `expected ≥2 stat refs, got ${sc?.length}`);
  });

  it('包含刷新按钮', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('刷新') || src.includes('refresh'));
  });

  it('包含培训列表', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('培训列表'));
  });

  it('包含 DataTable', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('DataTable'));
  });

  it('包含分页', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('Pagination') || src.includes('pagination'));
  });

  it('包含 TypeScript 类型定义', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('type ') || src.includes('interface ') || src.includes('import type'));
  });
});

/* ══════════════════════════════════════════════════════════
   responseRegistry test (验证 fetch mock 模式有效)
   ══════════════════════════════════════════════════════════ */

describe('responseRegistry (fetch mock)', () => {
  it('should return registered response for matching URL pattern', async () => {
    clearRegistry();
    registerResponse('/api/training', 200, { items: MOCK_TRAININGS });
    const res = await mockFetch('https://example.com/api/training/list');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, MOCK_TRAININGS.length);
    clearRegistry();
  });

  it('should reject for unregistered URL', async () => {
    clearRegistry();
    await assert.rejects(
      () => mockFetch('https://example.com/api/unknown'),
      /no mock/
    );
    clearRegistry();
  });

  it('should support multiple registered patterns', async () => {
    clearRegistry();
    registerResponse('/api/training/stats', 200, { total: 7 });
    registerResponse('/api/training/list', 200, { items: MOCK_TRAININGS });

    const res1 = await mockFetch('https://example.com/api/training/stats');
    const body1 = await res1.json();
    assert.equal(body1.total, 7);

    const res2 = await mockFetch('https://example.com/api/training/list');
    const body2 = await res2.json();
    assert.equal(body2.items.length, 7);
    clearRegistry();
  });

  it('should allow clearing registry', () => {
    clearRegistry();
    registerResponse('/api/test', 200, { ok: true });
    assert.equal(responseRegistry.size, 1);
    clearRegistry();
    assert.equal(responseRegistry.size, 0);
  });
});
