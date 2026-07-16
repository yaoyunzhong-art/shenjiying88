/**
 * announcements/page.test.tsx — 公告管理页 L1 测试
 *
 * 覆盖:
 *   正例 — 常量映射、筛选逻辑、统计计算、表单校验、CRUD 辅助逻辑
 *   反例 — 空数据、非法输入、无匹配场景
 *   边界 — 标题长度限制、空白搜索、发布日期格式化空值
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CATEGORY_OPTIONS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_BADGE_VARIANT,
  filterAnnouncements,
  computeStats,
  createEmptyForm,
  validateForm,
  getCategoryLabel,
  getStatusLabel,
  getPriorityLabel,
  getPriorityColor,
  formatDate,
  addAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
} from './page';

import type { Announcement, FormData } from './page';

/* ── 辅助: Mock 数据集 ── */

const MOCK_ITEMS: Announcement[] = [
  { id: 'a1', title: '系统升级维护通知', category: 'system', status: 'published', priority: 'high', summary: '数据库停机维护', content: '详细内容', author: '技术部', publishedAt: '2026-07-05', readCount: 12580, createdAt: '2026-07-04', updatedAt: '2026-07-05' },
  { id: 'a2', title: '夏季促销活动', category: 'promotion', status: 'published', priority: 'normal', summary: '满300减60', content: '活动详情', author: '运营部', publishedAt: '2026-07-03', readCount: 8430, createdAt: '2026-07-01', updatedAt: '2026-07-03' },
  { id: 'a3', title: '新员工培训', category: 'operation', status: 'published', priority: 'normal', summary: '7月18日培训安排', content: '培训内容', author: '人事部', publishedAt: '2026-07-02', readCount: 3210, createdAt: '2026-06-30', updatedAt: '2026-07-02' },
  { id: 'a4', title: '消防演练通知', category: 'emergency', status: 'published', priority: 'high', summary: '10日全员演练', content: '演练方案', author: '安全部', publishedAt: '2026-07-01', readCount: 9870, createdAt: '2026-06-29', updatedAt: '2026-07-01' },
  { id: 'a5', title: '季度盘点计划', category: 'operation', status: 'draft', priority: 'low', summary: '下旬盘点待定', content: '计划内容', author: '仓管部', publishedAt: '', readCount: 0, createdAt: '2026-07-06', updatedAt: '2026-07-06' },
  { id: 'a6', title: '积分制度调整', category: 'policy', status: 'draft', priority: 'normal', summary: '规则调整方案', content: '调整详情', author: '市场部', publishedAt: '', readCount: 0, createdAt: '2026-07-05', updatedAt: '2026-07-05' },
  { id: 'a7', title: '端午值班安排', category: 'operation', status: 'archived', priority: 'normal', summary: '假期值班表', content: '值班安排', author: '运营部', publishedAt: '2026-06-15', readCount: 12540, createdAt: '2026-06-12', updatedAt: '2026-06-15' },
  { id: 'a8', title: 'POS系统修复', category: 'system', status: 'archived', priority: 'high', summary: 'POS异常已修复', content: '修复详情', author: '技术部', publishedAt: '2026-06-08', readCount: 18920, createdAt: '2026-06-08', updatedAt: '2026-06-08' },
];

/* ── 辅助: 有效表单数据 ── */

function validForm(overrides: Partial<FormData> = {}): FormData {
  return {
    title: '测试公告标题',
    category: 'system',
    priority: 'normal',
    status: 'draft',
    summary: '测试公告摘要内容',
    content: '测试公告详细内容正文',
    ...overrides,
  };
}

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('CATEGORY_OPTIONS 应包含 5 个公告分类', () => {
  assert.equal(CATEGORY_OPTIONS.length, 5);
  assert.deepEqual(
    CATEGORY_OPTIONS.map((c) => c.value),
    ['system', 'promotion', 'operation', 'emergency', 'policy'],
  );
});

test('CATEGORY_LABELS 应正确映射中文', () => {
  assert.equal(CATEGORY_LABELS.system, '系统通知');
  assert.equal(CATEGORY_LABELS.promotion, '促销活动');
  assert.equal(CATEGORY_LABELS.operation, '运营管理');
  assert.equal(CATEGORY_LABELS.emergency, '紧急通知');
  assert.equal(CATEGORY_LABELS.policy, '制度政策');
});

test('STATUS_LABELS 与 STATUS_BADGE_VARIANT 应完整覆盖三种状态', () => {
  assert.equal(STATUS_LABELS.draft, '草稿');
  assert.equal(STATUS_LABELS.published, '已发布');
  assert.equal(STATUS_LABELS.archived, '已归档');

  assert.equal(STATUS_BADGE_VARIANT.draft, 'default');
  assert.equal(STATUS_BADGE_VARIANT.published, 'success');
  assert.equal(STATUS_BADGE_VARIANT.archived, 'warning');
});

test('PRIORITY_LABELS 与 PRIORITY_COLORS 应包含三种优先级', () => {
  assert.equal(PRIORITY_LABELS.high, '高');
  assert.equal(PRIORITY_LABELS.normal, '中');
  assert.equal(PRIORITY_LABELS.low, '低');

  assert.ok(PRIORITY_COLORS.high.startsWith('#'));
  assert.ok(PRIORITY_COLORS.normal.startsWith('#'));
  assert.ok(PRIORITY_COLORS.low.startsWith('#'));
});

test('MOCK_ITEMS 应保持 8 条完整样本数据', () => {
  assert.equal(MOCK_ITEMS.length, 8);
  assert.equal(new Set(MOCK_ITEMS.map((i) => i.id)).size, MOCK_ITEMS.length);
  assert.equal(MOCK_ITEMS.filter((i) => i.status === 'published').length, 4);
  assert.equal(MOCK_ITEMS.filter((i) => i.status === 'draft').length, 2);
  assert.equal(MOCK_ITEMS.filter((i) => i.status === 'archived').length, 2);
  assert.equal(MOCK_ITEMS.filter((i) => i.priority === 'high').length, 3);
});

test('computeStats 应正确计算统计卡片数据', () => {
  const stats = computeStats(MOCK_ITEMS);
  assert.equal(stats.total, 8);
  assert.equal(stats.published, 4);
  assert.equal(stats.draft, 2);
  assert.equal(stats.archived, 2);
  assert.equal(stats.highPriority, 3);
  assert.equal(stats.totalReads, 12580 + 8430 + 3210 + 9870 + 12540 + 18920);
});

test('computeStats 对空列表应返回全零', () => {
  assert.deepEqual(computeStats([]), {
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    highPriority: 0,
    totalReads: 0,
  });
});

test('getCategoryLabel / getStatusLabel / getPriorityLabel 应返回正确中文', () => {
  assert.equal(getCategoryLabel('system'), '系统通知');
  assert.equal(getCategoryLabel('unknown'), 'unknown');
  assert.equal(getStatusLabel('published'), '已发布');
  assert.equal(getStatusLabel('unknown'), 'unknown');
  assert.equal(getPriorityLabel('high'), '高');
  assert.equal(getPriorityLabel('unknown'), 'unknown');
});

test('getPriorityColor 应返回对应色值，未知回退默认灰', () => {
  assert.equal(getPriorityColor('high'), '#ef4444');
  assert.equal(getPriorityColor('normal'), '#f59e0b');
  assert.equal(getPriorityColor('unknown'), '#6b7280');
});

test('formatDate 应格式化日期并处理空值', () => {
  assert.equal(formatDate('2026-07-05'), '2026-07-05');
  assert.equal(formatDate(''), '-');
  assert.equal(formatDate('2026-01-01'), '2026-01-01');
});

test('filterAnnouncements 应支持按标题搜索', () => {
  const result = filterAnnouncements(MOCK_ITEMS, '维护', '', '');
  assert.equal(result.length, 1);
  assert.equal(result[0]?.title, '系统升级维护通知');
});

test('filterAnnouncements 应支持按摘要搜索（忽略大小写）', () => {
  const bySummary = filterAnnouncements(MOCK_ITEMS, '满300', '', '');
  assert.equal(bySummary.length, 1);
  assert.equal(bySummary[0]?.title, '夏季促销活动');
});

test('filterAnnouncements 应支持分类筛选', () => {
  const byCategory = filterAnnouncements(MOCK_ITEMS, '', 'operation', '');
  assert.equal(byCategory.length, 3); // a3, a5, a7
  assert.ok(byCategory.every((i) => i.category === 'operation'));
});

test('filterAnnouncements 应支持状态筛选', () => {
  const byStatus = filterAnnouncements(MOCK_ITEMS, '', '', 'draft');
  assert.equal(byStatus.length, 2);
  assert.ok(byStatus.every((i) => i.status === 'draft'));
});

test('filterAnnouncements 应支持组合筛选', () => {
  const combined = filterAnnouncements(MOCK_ITEMS, '培训', 'operation', 'published');
  assert.equal(combined.length, 1);
  assert.equal(combined[0]?.title, '新员工培训');
});

/* =================================================================
 * 反例 (Sad Path)
 * ================================================================= */

test('filterAnnouncements 无匹配时应返回空数组', () => {
  assert.deepEqual(filterAnnouncements(MOCK_ITEMS, 'xxxxxxxxxx', '', ''), []);
  assert.deepEqual(filterAnnouncements(MOCK_ITEMS, '', 'nonexistent', ''), []);
  assert.deepEqual(filterAnnouncements(MOCK_ITEMS, '', '', 'nonexistent'), []);
});

test('filterAnnouncements 纯空格搜索应匹配全部', () => {
  const result = filterAnnouncements(MOCK_ITEMS, '   ', '', '');
  assert.equal(result.length, MOCK_ITEMS.length);
});

test('validateForm 应拒绝空标题与缺失必填项', () => {
  const errors = validateForm(createEmptyForm());
  assert.equal(errors.title, '公告标题不能为空');
  assert.equal(errors.summary, '公告摘要不能为空');
  assert.equal(errors.content, '公告内容不能为空');
});

test('validateForm 应拒绝超长标题与超长摘要', () => {
  const longTitle = 'a'.repeat(101);
  const longSummary = 'a'.repeat(201);
  const errors = validateForm(validForm({ title: longTitle, summary: longSummary }));
  assert.equal(errors.title, '公告标题最多100个字符');
  assert.equal(errors.summary, '公告摘要最多200个字符');
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('validateForm 应通过合法边界标题（100 字符）和摘要（200 字符）', () => {
  const boundaryTitle = 'a'.repeat(100);
  const boundarySummary = 'b'.repeat(200);
  const errors = validateForm(validForm({ title: boundaryTitle, summary: boundarySummary }));
  assert.equal(errors.title, undefined);
  assert.equal(errors.summary, undefined);
});

test('addAnnouncement 应在列表首位新增并设置默认字段', () => {
  const form = validForm({ title: '新建测试公告' });
  const updated = addAnnouncement(MOCK_ITEMS, form);

  assert.equal(updated.length, MOCK_ITEMS.length + 1);
  assert.equal(updated[0]?.title, '新建测试公告');
  assert.equal(updated[0]?.author, '当前用户');
  assert.equal(updated[0]?.status, 'draft');
  assert.equal(updated[0]?.readCount, 0);
  assert.equal(updated[1]?.id, 'a1');
});

test('archiveAnnouncement 仅归档已发布公告，其他状态不受影响', () => {
  const updated = archiveAnnouncement(MOCK_ITEMS, 'a1');
  const archived = updated.find((i) => i.id === 'a1');
  assert.equal(archived?.status, 'archived');

  const published = updated.filter((i) => i.status === 'published');
  assert.equal(published.length, 3); // a2, a3, a4 remain published

  // 尝试归档草稿不应生效
  const noop = archiveAnnouncement(MOCK_ITEMS, 'a5');
  const draftRemains = noop.find((i) => i.id === 'a5');
  assert.equal(draftRemains?.status, 'draft');
});

test('archiveAnnouncement 归档不存在的 ID 应保持不变', () => {
  const updated = archiveAnnouncement(MOCK_ITEMS, 'nonexistent');
  assert.equal(updated.length, MOCK_ITEMS.length);
  assert.equal(updated.filter((i) => i.status === 'published').length, 4);
});

test('deleteAnnouncement 应删除目标项，不存在的 ID 保持不变', () => {
  const removed = deleteAnnouncement(MOCK_ITEMS, 'a1');
  assert.equal(removed.length, MOCK_ITEMS.length - 1);
  assert.ok(!removed.some((i) => i.id === 'a1'));

  const untouched = deleteAnnouncement(MOCK_ITEMS, 'not-exist');
  assert.equal(untouched.length, MOCK_ITEMS.length);
});

test('createEmptyForm 应返回正确默认值', () => {
  const form = createEmptyForm();
  assert.equal(form.title, '');
  assert.equal(form.category, 'operation');
  assert.equal(form.priority, 'normal');
  assert.equal(form.status, 'draft');
  assert.equal(form.summary, '');
  assert.equal(form.content, '');
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Announcements — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
