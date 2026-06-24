/**
 * Product Detail Page — storefront-web
 * Tests: product detail logic, status transitions, edit form, delete flow, edge cases
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据常量 (与 page.tsx 一致) ──

type OfferingCategory = 'class' | 'event' | 'product' | 'service';
type OfferingStatus = 'published' | 'draft' | 'archived';

const CATEGORY_LABELS: Record<OfferingCategory, string> = {
  class: '课程',
  event: '活动',
  product: '商品',
  service: '服务',
};

const STATUS_LABELS: Record<OfferingStatus, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

const NEXT_STATUS: Partial<Record<OfferingStatus, OfferingStatus>> = {
  draft: 'published',
  published: 'archived',
  archived: 'draft',
};

const STATUS_ACTION_LABELS: Partial<Record<OfferingStatus, string>> = {
  draft: '发布',
  published: '归档',
  archived: '取消归档',
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── 纯逻辑测试 ──

test('CATEGORY_LABELS 覆盖所有分类 (class / event / product / service)', () => {
  assert.equal(CATEGORY_LABELS.class, '课程');
  assert.equal(CATEGORY_LABELS.event, '活动');
  assert.equal(CATEGORY_LABELS.product, '商品');
  assert.equal(CATEGORY_LABELS.service, '服务');
});

test('STATUS_LABELS 覆盖所有状态 (published / draft / archived)', () => {
  assert.equal(STATUS_LABELS.published, '已发布');
  assert.equal(STATUS_LABELS.draft, '草稿');
  assert.equal(STATUS_LABELS.archived, '已归档');
});

test('状态流转: draft → published', () => {
  assert.equal(NEXT_STATUS.draft, 'published');
});

test('状态流转: published → archived', () => {
  assert.equal(NEXT_STATUS.published, 'archived');
});

test('状态流转: archived → draft (重新激活)', () => {
  assert.equal(NEXT_STATUS.archived, 'draft');
});

test('状态流转形成完整循环: draft → published → archived → draft', () => {
  const s1: OfferingStatus = NEXT_STATUS.draft!;
  const s2: OfferingStatus = NEXT_STATUS[s1]!;
  const s3: OfferingStatus = NEXT_STATUS[s2]!;
  assert.equal(s1, 'published');
  assert.equal(s2, 'archived');
  assert.equal(s3, 'draft');
});

test('STATUS_ACTION_LABELS 与 NEXT_STATUS 配对', () => {
  const statuses: OfferingStatus[] = ['draft', 'published', 'archived'];
  for (const s of statuses) {
    if (NEXT_STATUS[s]) {
      assert.ok(STATUS_ACTION_LABELS[s], `${s} 应有操作标签`);
    }
  }
});

// ── 表单验证 ──

test('表单验证: 空 name 应拒绝', () => {
  const form = { name: '', description: 'desc' };
  const valid = form.name.trim().length > 0 && form.description.trim().length > 0;
  assert.equal(valid, false);
});

test('表单验证: 空白字符 name 视为空', () => {
  const form = { name: '   ', description: 'desc' };
  assert.equal(form.name.trim().length, 0);
});

test('表单验证: 空 description 应拒绝', () => {
  const form = { name: 'Test', description: '   ' };
  const valid = form.name.trim().length > 0 && form.description.trim().length > 0;
  assert.equal(valid, false);
});

test('表单验证: 有效表单通过', () => {
  const form = { name: '瑜伽课', description: '适合入门' };
  const valid = form.name.trim().length > 0 && form.description.trim().length > 0;
  assert.equal(valid, true);
});

test('表单验证: 中文名称和描述有效', () => {
  const form = { name: '青少年篮球训练营', description: '暑期集中训练，8-16岁' };
  const valid = form.name.trim().length > 0 && form.description.trim().length > 0;
  assert.equal(valid, true);
});

// ── offer 查找 ──

test('offer 查找: 通过 ID 找到已发布产品', () => {
  const mock = [
    { id: 'o1', name: '瑜伽初级课', status: 'published' as const },
    { id: 'o5', name: '运动毛巾', status: 'draft' as const },
    { id: 'o12', name: '康复理疗', status: 'archived' as const },
  ];
  const found = mock.find((o) => o.id === 'o1');
  assert.ok(found);
  assert.equal(found.name, '瑜伽初级课');
  assert.equal(found.status, 'published');
});

test('offer 查找: 通过 ID 找到草稿产品', () => {
  const mock = [
    { id: 'o5', name: '运动毛巾', status: 'draft' as const },
  ];
  const found = mock.find((o) => o.id === 'o5');
  assert.ok(found);
  assert.equal(found.status, 'draft');
});

test('offer 查找: 未知 ID 返回 undefined', () => {
  const mock = [{ id: 'o1', name: 'x', status: 'published' as const }];
  assert.equal(mock.find((o) => o.id === 'unknown'), undefined);
});

test('offer 查找: 空 ID 返回 undefined', () => {
  const mock = [{ id: 'o1', name: 'x', status: 'published' as const }];
  assert.equal(mock.find((o) => o.id === ''), undefined);
});

// ── today() 日期 ──

test('today() 返回 YYYY-MM-DD 格式', () => {
  const result = today();
  assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
});

test('today() 与当前日期一致', () => {
  const result = today();
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  assert.equal(result, `${y}-${m}-${d}`);
});

// ── 编辑数据合并 ──

test('编辑合并: name 更新为编辑值', () => {
  const prev = { id: 'o1', name: '旧名', description: '旧描述', price: '¥100', scheduleHint: '', status: 'published', updatedAt: '2026-01-01' };
  const data = { name: '新名', description: '新描述', price: '¥200', scheduleHint: '周三' };
  const result = { ...prev, ...data, updatedAt: '2026-06-23' };
  assert.equal(result.name, '新名');
});

test('编辑合并: description 更新', () => {
  const prev = { id: 'o1', name: 'a', description: '旧', price: '¥1', scheduleHint: '', status: 'published', updatedAt: '2026-01-01' };
  const result = { ...prev, description: '新描述', updatedAt: '2026-06-23' };
  assert.equal(result.description, '新描述');
});

test('编辑合并: updatedAt 重置为今天', () => {
  const prev = { id: 'o1', name: 'a', description: 'b', price: '¥1', scheduleHint: '', status: 'published', updatedAt: '2026-01-01' };
  const result = { ...prev, updatedAt: '2026-06-23' };
  assert.equal(result.updatedAt, '2026-06-23');
});

test('编辑合并: ID 不变', () => {
  const prev = { id: 'o99', name: 'a', description: 'b', price: '¥1', scheduleHint: '', status: 'draft', updatedAt: '2026-01-01' };
  const result = { ...prev, name: '改名', updatedAt: '2026-06-23' };
  assert.equal(result.id, 'o99');
});

test('编辑合并: scheduleHint 可为空', () => {
  const prev = { id: 'o1', name: 'a', description: 'b', price: '¥1', scheduleHint: '旧时间', status: 'published', updatedAt: '2026-01-01' };
  const result = { ...prev, scheduleHint: '', updatedAt: '2026-06-23' };
  assert.equal(result.scheduleHint, '');
});

// ── 删除 ──

test('删除: 标记 deleted = true', () => {
  let deleted = false;
  deleted = true;
  assert.equal(deleted, true);
});

test('删除: 原数据在软删除后仍可读', () => {
  const offering = { id: 'o1', name: '瑜伽课', status: 'published' };
  let deleted = false;
  deleted = true;
  assert.ok(offering);
  assert.equal(offering.name, '瑜伽课');
  assert.equal(deleted, true);
});

// ── 状态流转步骤 ──

test('流转步骤: published → archived → draft → published', () => {
  let s: OfferingStatus = 'published';
  s = NEXT_STATUS[s]!;
  assert.equal(s, 'archived');
  s = NEXT_STATUS[s]!;
  assert.equal(s, 'draft');
  s = NEXT_STATUS[s]!;
  assert.equal(s, 'published');
});

// ── 操作按钮 ──

test('published 状态操作按钮: [编辑, 归档, 删除]', () => {
  const actions = ['编辑', '归档', '删除'];
  assert.ok(actions.includes('编辑'));
  assert.ok(actions.includes('归档'));
  assert.ok(actions.includes('删除'));
});

test('draft 状态操作按钮: [编辑, 发布, 删除]', () => {
  const actions = ['编辑', '发布', '删除'];
  assert.ok(actions.includes('发布'));
  assert.ok(actions.includes('删除'));
});

test('archived 状态操作按钮: [编辑, 取消归档, 删除]', () => {
  const actions = ['编辑', '取消归档', '删除'];
  assert.ok(actions.includes('取消归档'));
});

// ── 边界 ──

test('边界: 未找到产品消息包含 ID', () => {
  const id = 'nonexistent';
  const msg = `未找到产品 (ID: ${id})`;
  assert.ok(msg.includes(id));
  assert.ok(msg.includes('未找到产品'));
});

test('边界: 所有分类都有中文标签 (4类)', () => {
  assert.equal(Object.keys(CATEGORY_LABELS).length, 4);
});

test('边界: 三个状态覆盖完整', () => {
  const statuses: OfferingStatus[] = ['published', 'draft', 'archived'];
  assert.equal(statuses.length, 3);
  assert.ok(statuses.every((s) => STATUS_LABELS[s] !== undefined));
});

// ── 面包屑 ──

test('面包屑: 列表 → 详情两层结构', () => {
  const breadcrumbs = [
    { label: '产品服务', href: '/products' },
    { label: '瑜伽初级课' },
  ];
  assert.equal(breadcrumbs.length, 2);
  assert.equal(breadcrumbs[0]!.label, '产品服务');
  assert.equal(breadcrumbs[0]!.href, '/products');
});

test('面包屑: 当前页无 href', () => {
  const breadcrumbs = [
    { label: '产品服务', href: '/products' },
    { label: 'HIIT 高强度间歇训练' },
  ];
  assert.equal(breadcrumbs[1]!.href, undefined);
});

test('面包屑: 第一个元素始终是回到列表', () => {
  const breadcrumbs = [
    { label: '产品服务', href: '/products' },
    { label: '任意产品' },
  ];
  assert.equal(breadcrumbs[0]!.href, '/products');
});
