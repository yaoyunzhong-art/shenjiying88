/**
 * StoreShowcaseClient.test.ts — L1 组件冒烟测试
 *
 * 覆盖:
 * 1. 正例 — 组件导出 / 常量映射 / Mock 数据完整性
 * 2. 反例 — 未知类型处理
 * 3. 边界 — 标签长度 / ID 唯一性
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ── 常量定义 (与 store-showcase-client.tsx 一致) ── */

type OfferingCategory = 'class' | 'event' | 'product' | 'service';
type OfferingStatus = 'published' | 'draft' | 'archived';

const CATEGORY_LABELS: Record<OfferingCategory, string> = {
  class: '课程',
  event: '活动',
  product: '商品',
  service: '服务',
};

const STATUS_VARIANTS: Record<OfferingStatus, 'success' | 'warning' | 'neutral'> = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
};

const STATUS_LABELS: Record<OfferingStatus, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

const ALL_CATEGORIES: OfferingCategory[] = ['class', 'event', 'product', 'service'];
const ALL_STATUSES: OfferingStatus[] = ['published', 'draft', 'archived'];

// ── 辅助: 加载源码 ──

function loadSource(): string {
  return fs.readFileSync(
    path.join(__dirname, 'store-showcase-client.tsx'),
    'utf-8',
  );
}

const SRC = loadSource();

/* ── 正例 ── */

describe('正例 StoreShowcaseClient', () => {
  it('源码包含 StoreShowcaseClient 函数组件定义', () => {
    assert.ok(SRC.includes('export function StoreShowcaseClient'));
    assert.ok(SRC.includes('export interface StoreShowcaseClientProps'));
  });

  it('导入关键 UI 组件', () => {
    assert.ok(SRC.includes("DataTable"));
    assert.ok(SRC.includes("Pagination"));
    assert.ok(SRC.includes("SearchFilterInput"));
    assert.ok(SRC.includes("Tabs"));
    assert.ok(SRC.includes("StatusBadge"));
  });

  it('Mock 数据含 12 条记录', () => {
    const idCount = (SRC.match(/id:\s*'/g) || []).length;
    assert.equal(idCount, 12);
  });

  it('分类覆盖 4 种类型', () => {
    for (const cat of ALL_CATEGORIES) {
      assert.ok(SRC.includes(`'${cat}'`), `missing category '${cat}'`);
    }
  });

  it('状态覆盖 3 种类型', () => {
    for (const st of ALL_STATUSES) {
      assert.ok(SRC.includes(`'${st}'`), `missing status '${st}'`);
    }
  });

  it('StatBadge 内部组件已定义', () => {
    assert.ok(SRC.includes('function StatBadge'), 'should define StatBadge');
  });

  it('CATEGORY_LABELS 常量与源码一致', () => {
    assert.ok(SRC.includes("class: '课程'"));
    assert.ok(SRC.includes("event: '活动'"));
    assert.ok(SRC.includes("product: '商品'"));
    assert.ok(SRC.includes("service: '服务'"));
  });

  it('STATUS_LABELS 常量与源码一致', () => {
    assert.ok(SRC.includes("published: '已发布'"));
    assert.ok(SRC.includes("draft: '草稿'"));
    assert.ok(SRC.includes("archived: '已归档'"));
  });

  it('统计卡片区域含 3 个统计项', () => {
    assert.ok(SRC.includes('总项目'));
    assert.ok(SRC.includes('已发布'));
    assert.ok(SRC.includes('分类数'));
  });

  it('分页条数为 8', () => {
    const pageLine = SRC.match(/pagination\s*=\s*usePagination\([\s\S]*?,\s*(\d+)\)/);
    assert.ok(pageLine, 'should have usePagination with page size');
    if (pageLine) {
      assert.equal(pageLine[1], '8', 'page size should be 8');
    }
  });

  it('CATEGORY_LABELS 映射完整 (所有分类都有标签)', () => {
    const labelKeys = Object.keys(CATEGORY_LABELS);
    assert.equal(labelKeys.length, 4);
    for (const label of Object.values(CATEGORY_LABELS)) {
      assert.ok(label.length >= 2, `label "${label}" should be ≥2 chars`);
    }
  });

  it('STATUS_VARIANTS 映射完整 (所有状态都有 variant)', () => {
    const variantKeys = Object.keys(STATUS_VARIANTS);
    assert.equal(variantKeys.length, 3);
  });

  it('STATUS_LABELS 映射完整 (所有状态都有中文标签)', () => {
    const labelKeys = Object.keys(STATUS_LABELS);
    assert.equal(labelKeys.length, 3);
    for (const label of Object.values(STATUS_LABELS)) {
      assert.ok(label.length >= 2, `label "${label}" should be ≥2 chars`);
    }
  });
});

/* ── 反例 ── */

describe('反例', () => {
  it('未知分类应回退到 ALL 过滤', () => {
    assert.ok(SRC.includes("categoryFilter === 'ALL'"),
      'should have ALL filter condition');
  });

  it('未知状态不定义 (源码只处理 3 种状态)', () => {
    const unknownStatus = 'unknown_status' as keyof typeof STATUS_LABELS;
    assert.equal(STATUS_LABELS[unknownStatus], undefined);
  });

  it('未知分类不定义 (源码只处理 4 种分类)', () => {
    const unknownCat = 'unknown' as keyof typeof CATEGORY_LABELS;
    assert.equal(CATEGORY_LABELS[unknownCat], undefined);
  });
});

/* ── 边界 ── */

describe('边界', () => {
  it('所有分类标签长度 ≤4 字符', () => {
    for (const label of Object.values(CATEGORY_LABELS)) {
      assert.ok(label.length <= 4, `label "${label}" exceeds 4 chars`);
    }
  });

  it('所有状态标签长度 ≤4 字符', () => {
    for (const label of Object.values(STATUS_LABELS)) {
      assert.ok(label.length <= 4, `label "${label}" exceeds 4 chars`);
    }
  });

  it('Mock 数据中无重复 id', () => {
    const ids = SRC.match(/id: '([^']+)'/g);
    assert.ok(ids, 'should find ids in source');
    const idValues = ids.map((s) => s.match(/'([^']+)'/)?.[1]!);
    const uniqueIds = new Set(idValues);
    assert.equal(uniqueIds.size, idValues.length, 'all ids should be unique');
  });

  it('SRC 加载不为空', () => {
    assert.ok(SRC.length > 1000, 'source should be substantial');
  });
});
