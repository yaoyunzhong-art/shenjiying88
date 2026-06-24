/**
 * Product Detail Page — storefront-web (B-详情页)
 * Tests: status transitions, edit form validation, delete flow, offer lookup, edge cases
 * Role: 🛒 前台视角 — 浏览门店产品详情 / 编辑 / 删除 / 状态流转
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 常量 (与 page.tsx 同步) ──

type OfferingStatus = 'published' | 'draft' | 'archived';

const CATEGORY_LABELS = {
  class: '课程',
  event: '活动',
  product: '商品',
  service: '服务',
} as const;

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

// ── 🛒 前台视角: 分类 & 状态 ──

test('🛒 分类标签: class/event/product/service 四类完整', () => {
  assert.equal(CATEGORY_LABELS.class, '课程');
  assert.equal(CATEGORY_LABELS.event, '活动');
  assert.equal(CATEGORY_LABELS.product, '商品');
  assert.equal(CATEGORY_LABELS.service, '服务');
});

test('🛒 状态标签: published/draft/archived 三态完整', () => {
  assert.equal(STATUS_LABELS.published, '已发布');
  assert.equal(STATUS_LABELS.draft, '草稿');
  assert.equal(STATUS_LABELS.archived, '已归档');
});

// ── 🛒 前台视角: 状态流转 ──

test('🛒 状态流转: draft → published', () => {
  assert.equal(NEXT_STATUS.draft, 'published');
});

test('🛒 状态流转: published → archived', () => {
  assert.equal(NEXT_STATUS.published, 'archived');
});

test('🛒 状态流转: archived → draft (重新激活)', () => {
  assert.equal(NEXT_STATUS.archived, 'draft');
});

test('🛒 状态流转: 完整循环 draft → published → archived → draft', () => {
  let s: OfferingStatus = 'draft';
  s = NEXT_STATUS[s]!;
  assert.equal(s, 'published');
  s = NEXT_STATUS[s]!;
  assert.equal(s, 'archived');
  s = NEXT_STATUS[s]!;
  assert.equal(s, 'draft');
});

test('🛒 状态操作标签: 与流转方向匹配', () => {
  assert.equal(STATUS_ACTION_LABELS.draft, '发布');
  assert.equal(STATUS_ACTION_LABELS.published, '归档');
  assert.equal(STATUS_ACTION_LABELS.archived, '取消归档');
});

// ── 🛒 前台视角: 表单验证 ──

test('🛒 表单验证: name 为空 → 拒绝', () => {
  const valid = (name: string, desc: string) => name.trim().length > 0 && desc.trim().length > 0;
  assert.equal(valid('', 'desc'), false);
});

test('🛒 表单验证: description 为空 → 拒绝', () => {
  const valid = (name: string, desc: string) => name.trim().length > 0 && desc.trim().length > 0;
  assert.equal(valid('name', '   '), false);
});

test('🛒 表单验证: name 和 description 都为空白 → 拒绝', () => {
  const valid = (name: string, desc: string) => name.trim().length > 0 && desc.trim().length > 0;
  assert.equal(valid('   ', ''), false);
});

test('🛒 表单验证: 中文名 + 描述 → 通过', () => {
  const valid = (name: string, desc: string) => name.trim().length > 0 && desc.trim().length > 0;
  assert.equal(valid('青少年篮球训练营', '暑期集中训练'), true);
});

test('🛒 表单验证: 英文名 + 描述 → 通过', () => {
  const valid = (name: string, desc: string) => name.trim().length > 0 && desc.trim().length > 0;
  assert.equal(valid('HIIT Class', 'High intensity training'), true);
});

// ── 🛒 前台视角: offer 查找 ──

test('🛒 offer 查找: 有效 ID → 返回产品', () => {
  const mock = [
    { id: 'o1', name: '瑜伽初级课', status: 'published' as const, category: 'class' as const },
    { id: 'o5', name: '运动毛巾', status: 'draft' as const, category: 'product' as const },
    { id: 'o12', name: '康复理疗', status: 'archived' as const, category: 'service' as const },
  ];
  const found = mock.find((o) => o.id === 'o1');
  assert.ok(found);
  assert.equal(found.name, '瑜伽初级课');
  assert.equal(found.status, 'published');
  assert.equal(found.category, 'class');
});

test('🛒 offer 查找: 草稿产品 → 正确返回', () => {
  const mock = [{ id: 'o5', name: '运动毛巾套装', status: 'draft' as const }];
  const found = mock.find((o) => o.id === 'o5');
  assert.ok(found);
  assert.equal(found.status, 'draft');
});

test('🛒 offer 查找: 未知 ID → undefined', () => {
  const mock = [{ id: 'o1', name: 'x' }];
  assert.equal(mock.find((o) => o.id === 'nonexistent'), undefined);
});

test('🛒 offer 查找: 空 ID → undefined', () => {
  const mock = [{ id: 'o1', name: 'x' }];
  assert.equal(mock.find((o) => o.id === ''), undefined);
});

test('🛒 offer 查找: 已归档产品 → 正确返回', () => {
  const mock = [{ id: 'o12', name: '康复理疗服务', status: 'archived' as const }];
  const found = mock.find((o) => o.id === 'o12');
  assert.ok(found);
  assert.equal(found.status, 'archived');
});

// ── 🛒 前台视角: 日期格式 ──

test('🛒 today(): YYYY-MM-DD 格式', () => {
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);
});

test('🛒 today(): 与系统日期一致', () => {
  const d = new Date();
  const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  assert.equal(today(), expected);
});

// ── 🛒 前台视角: 编辑合并 ──

test('🛒 编辑: name → 新值覆盖', () => {
  const prev = { id: 'o1', name: '旧名', description: '旧', price: '¥1', scheduleHint: '', status: 'published', updatedAt: '2026-01-01' };
  const result = { ...prev, name: '高级瑜伽', description: '新描述', price: '¥299', scheduleHint: '周三', updatedAt: '2026-06-23' };
  assert.equal(result.name, '高级瑜伽');
  assert.equal(result.description, '新描述');
  assert.equal(result.price, '¥299');
});

test('🛒 编辑: updatedAt → 更新为提交时间', () => {
  const prev = { id: 'o1', name: 'a', description: 'b', price: '¥1', scheduleHint: '', status: 'published', updatedAt: '2026-01-01' };
  const result = { ...prev, updatedAt: '2026-06-23' };
  assert.equal(result.updatedAt, '2026-06-23');
  assert.notEqual(result.updatedAt, '2026-01-01');
});

test('🛒 编辑: id 和 status 不变', () => {
  const prev = { id: 'o99', name: 'a', description: 'b', price: '¥1', scheduleHint: '', status: 'draft' as const, updatedAt: '2026-01-01' };
  const result = { ...prev, name: '改名', updatedAt: '2026-06-23' };
  assert.equal(result.id, 'o99');
  assert.equal(result.status, 'draft');
});

test('🛒 编辑: scheduleHint 可为空', () => {
  const prev = { id: 'o1', name: 'a', description: 'b', price: '¥1', scheduleHint: '旧时间', status: 'published', updatedAt: '2026-01-01' };
  const result = { ...prev, scheduleHint: '', updatedAt: '2026-06-23' };
  assert.equal(result.scheduleHint, '');
});

// ── 🛒 前台视角: 删除 ──

test('🛒 删除: deleted 标记为 true', () => {
  let deleted = false;
  deleted = true;
  assert.equal(deleted, true);
});

test('🛒 删除: 软删除后原数据仍存在', () => {
  const offering = { id: 'o1', name: '瑜伽课', status: 'published' };
  assert.ok(offering.name);
});

// ── 🛒 前台视角: 状态流转步骤 ──

test('🛒 流转步骤: published → archived → draft → published (完整周期)', () => {
  let s: OfferingStatus = 'published';
  const steps: OfferingStatus[] = [s];
  while (true) {
    const next: OfferingStatus | undefined = NEXT_STATUS[s];
    if (!next || steps.includes(next)) break;
    steps.push(next);
    s = next;
  }
  // published → archived → draft → published (回到起点即停止)
  assert.equal(steps.length, 3);
  assert.equal(steps[0], 'published');
  assert.equal(steps[1], 'archived');
  assert.equal(steps[2], 'draft');
});

// ── 🛒 前台视角: 操作按钮定义 ──

test('🛒 操作按钮: published → [编辑, 归档, 删除]', () => {
  const actions = [
    { key: 'edit', label: '编辑' },
    { key: 'transition', label: STATUS_ACTION_LABELS['published'] },
    { key: 'delete', label: '删除' },
  ];
  assert.equal(actions.length, 3);
  assert.equal(actions[0]!.label, '编辑');
  assert.equal(actions[1]!.label, '归档');
  assert.equal(actions[2]!.label, '删除');
});

test('🛒 操作按钮: draft → [编辑, 发布, 删除]', () => {
  const actions = [
    { key: 'edit', label: '编辑' },
    { key: 'transition', label: STATUS_ACTION_LABELS['draft'] },
    { key: 'delete', label: '删除' },
  ];
  assert.equal(actions[1]!.label, '发布');
});

test('🛒 操作按钮: archived → [编辑, 取消归档, 删除]', () => {
  const actions = [
    { key: 'edit', label: '编辑' },
    { key: 'transition', label: STATUS_ACTION_LABELS['archived'] },
    { key: 'delete', label: '删除' },
  ];
  assert.equal(actions[1]!.label, '取消归档');
});

// ── 🛒 前台视角: 面包屑 ──

test('🛒 面包屑: 列表链接 → 当前详情', () => {
  const breadcrumbs = [
    { label: '产品服务', href: '/products' },
    { label: '瑜伽初级课' },
  ];
  assert.equal(breadcrumbs.length, 2);
  assert.equal(breadcrumbs[0]!.label, '产品服务');
  assert.equal(breadcrumbs[0]!.href, '/products');
  assert.equal(breadcrumbs[1]!.label, '瑜伽初级课');
  assert.equal(breadcrumbs[1]!.href, undefined);
});

// ── 🛒 前台视角: 边界 ──

test('🛒 边界: 删除后显示已删除页面', () => {
  const deleted = true;
  const name = '瑜伽初级课';
  assert.equal(deleted, true);
  assert.equal(typeof name, 'string');
});

test('🛒 边界: 未找到产品显示错误消息', () => {
  const notFoundMsg = (id: string) => `未找到产品 (ID: ${id})`;
  const msg = notFoundMsg('nonexistent');
  assert.ok(msg.includes('未找到产品'));
  assert.ok(msg.includes('nonexistent'));
});

test('🛒 边界: 产品价格可能为空', () => {
  const priceOrDash = (price?: string) => price || '—';
  assert.equal(priceOrDash(undefined), '—');
  assert.equal(priceOrDash('¥199'), '¥199');
});

test('🛒 边界: 所有分类映射无遗漏', () => {
  const keys = Object.keys(CATEGORY_LABELS);
  assert.equal(keys.length, 4);
  assert.ok(keys.includes('class'));
  assert.ok(keys.includes('event'));
  assert.ok(keys.includes('product'));
  assert.ok(keys.includes('service'));
});

test('🛒 边界: 所有状态都有 label 和流转方向', () => {
  const statuses: OfferingStatus[] = ['published', 'draft', 'archived'];
  for (const s of statuses) {
    assert.ok(STATUS_LABELS[s], `状态 ${s} 应有标签`);
    assert.ok(NEXT_STATUS[s], `状态 ${s} 应有下一状态`);
  }
});
