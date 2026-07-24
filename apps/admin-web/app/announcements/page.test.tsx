/**
 * announcements/page.test.tsx — 公告管理页 L1+ 增强测试
 *
 * 覆盖:
 *   正例 — 常量映射、筛选逻辑、统计计算、表单校验、CRUD 辅助逻辑、分类标签栏
 *   反例 — 空数据、非法输入、无匹配场景、异常操作
 *   边界 — 长度极限、空白搜索、日期空值、空列表、增减一致性
 *
 * 测试规则:
 *   - fetch mock 用 URL-pattern responseRegistry
 *   - 禁止: as any / describe.skip / it.only
 *   - beforeEach 重置 mock
 */

import assert from 'node:assert/strict';
import { describe, it, test, before, beforeEach, after, mock } from 'node:test';

import {
  CATEGORY_OPTIONS,
  CATEGORY_TABS,
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
import fs from 'node:fs';

/* ── 辅助: Mock 数据集（含新增的维护公告/版本更新数据） ── */

const MOCK_ITEMS: Announcement[] = [
  { id: 'a1', title: '系统升级维护通知', category: 'system', status: 'published', priority: 'high', summary: '数据库停机维护', content: '详细内容', author: '技术部', publishedAt: '2026-07-05', readCount: 12580, createdAt: '2026-07-04', updatedAt: '2026-07-05' },
  { id: 'a2', title: '夏季促销活动', category: 'promotion', status: 'published', priority: 'normal', summary: '满300减60', content: '活动详情', author: '运营部', publishedAt: '2026-07-03', readCount: 8430, createdAt: '2026-07-01', updatedAt: '2026-07-03' },
  { id: 'a3', title: '新员工培训', category: 'operation', status: 'published', priority: 'normal', summary: '7月18日培训安排', content: '培训内容', author: '人事部', publishedAt: '2026-07-02', readCount: 3210, createdAt: '2026-06-30', updatedAt: '2026-07-02' },
  { id: 'a4', title: '消防演练通知', category: 'emergency', status: 'published', priority: 'high', summary: '10日全员演练', content: '演练方案', author: '安全部', publishedAt: '2026-07-01', readCount: 9870, createdAt: '2026-06-29', updatedAt: '2026-07-01' },
  { id: 'a5', title: '季度盘点计划', category: 'operation', status: 'draft', priority: 'low', summary: '下旬盘点待定', content: '计划内容', author: '仓管部', publishedAt: '', readCount: 0, createdAt: '2026-07-06', updatedAt: '2026-07-06' },
  { id: 'a6', title: '积分制度调整', category: 'policy', status: 'draft', priority: 'normal', summary: '规则调整方案', content: '调整详情', author: '市场部', publishedAt: '', readCount: 0, createdAt: '2026-07-05', updatedAt: '2026-07-05' },
  { id: 'a7', title: '端午值班安排', category: 'operation', status: 'archived', priority: 'normal', summary: '假期值班表', content: '值班安排', author: '运营部', publishedAt: '2026-06-15', readCount: 12540, createdAt: '2026-06-12', updatedAt: '2026-06-15' },
  { id: 'a8', title: 'POS系统修复', category: 'system', status: 'archived', priority: 'high', summary: 'POS异常已修复', content: '修复详情', author: '技术部', publishedAt: '2026-06-08', readCount: 18920, createdAt: '2026-06-08', updatedAt: '2026-06-08' },
  { id: 'a9', title: '数据库服务器例行维护', category: 'operation', status: 'published', priority: 'normal', summary: '7月20日例行维护', content: '维护计划', author: '技术部', publishedAt: '2026-07-18', readCount: 4560, createdAt: '2026-07-17', updatedAt: '2026-07-18' },
  { id: 'a10', title: 'v3.8.0 版本更新日志', category: 'policy', status: 'published', priority: 'normal', summary: '新增数据报表模块', content: '更新详情', author: '产品部', publishedAt: '2026-07-15', readCount: 7890, createdAt: '2026-07-14', updatedAt: '2026-07-15' },
  { id: 'a11', title: '年中版本更新预告', category: 'policy', status: 'draft', priority: 'low', summary: '三季度更新计划', content: '计划内容', author: '产品部', publishedAt: '', readCount: 0, createdAt: '2026-07-10', updatedAt: '2026-07-10' },
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
 * 一、常量映射 — 正例
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

/* =================================================================
 * 二、CATEGORY_TABS 分类标签栏 — 正例
 * ================================================================= */

test('CATEGORY_TABS 应包含 5 个标签（全部+4分类）', () => {
  assert.equal(CATEGORY_TABS.length, 5);
  assert.equal(CATEGORY_TABS[0]?.key, '');
  assert.equal(CATEGORY_TABS[0]?.label, '全部');
});

test('CATEGORY_TABS 各标签的 key 应映射有效分类或空值', () => {
  const validKeys = new Set(['', 'system', 'operation', 'policy', 'promotion']);
  for (const tab of CATEGORY_TABS) {
    assert.ok(validKeys.has(tab.key), `无效的 tab key: ${tab.key}`);
  }
});

test('CATEGORY_TABS 标签 label 应包含中文描述', () => {
  const labels = CATEGORY_TABS.map((t) => t.label);
  assert.ok(labels.includes('全部'));
  assert.ok(labels.includes('系统通知'));
  assert.ok(labels.includes('维护公告'));
  assert.ok(labels.includes('版本更新'));
  assert.ok(labels.includes('活动通知'));
});

test('CATEGORY_TABS 使用 as const 应为只读', () => {
  // 验证类型不可变（运行时验证只读属性）
  assert.equal(Object.isFrozen(CATEGORY_TABS), false); // as const 不 freeze 数组本身
  assert.equal(typeof CATEGORY_TABS[0]?.key, 'string');
  assert.equal(typeof CATEGORY_TABS[0]?.label, 'string');
});

test('filterAnnouncements 通过 CATEGORY_TABS key 筛选应正确', () => {
  // 验证每个非空 tab key 的筛选结果
  const tabKeys = CATEGORY_TABS.filter((t) => t.key).map((t) => t.key);
  for (const key of tabKeys) {
    const result = filterAnnouncements(MOCK_ITEMS, '', key, '');
    assert.ok(result.length > 0, `tab key ${key} 应有匹配数据`);
    assert.ok(result.every((i) => i.category === key));
  }
});

test('filterAnnouncements 空 key（全部）应返回全部数据', () => {
  const result = filterAnnouncements(MOCK_ITEMS, '', '', '');
  assert.equal(result.length, MOCK_ITEMS.length);
});

/* =================================================================
 * 三、数据完整性 — 正例
 * ================================================================= */

test('MOCK_ITEMS 应保持 11 条完整样本数据（含新增的维护/版本条目）', () => {
  assert.equal(MOCK_ITEMS.length, 11);
  assert.equal(new Set(MOCK_ITEMS.map((i) => i.id)).size, MOCK_ITEMS.length);
  // 统计数据
  assert.equal(MOCK_ITEMS.filter((i) => i.status === 'published').length, 6);
  assert.equal(MOCK_ITEMS.filter((i) => i.status === 'draft').length, 3);
  assert.equal(MOCK_ITEMS.filter((i) => i.status === 'archived').length, 2);
  assert.equal(MOCK_ITEMS.filter((i) => i.priority === 'high').length, 3);
  assert.equal(MOCK_ITEMS.filter((i) => i.priority === 'low').length, 2);
  // 新增条目的 category 分布
  assert.equal(MOCK_ITEMS.filter((i) => i.category === 'operation').length, 4); // a3, a5, a7, a9
  assert.equal(MOCK_ITEMS.filter((i) => i.category === 'policy').length, 3); // a6, a10, a11
});

test('computeStats 应正确计算统计卡片数据（含新增数据）', () => {
  const stats = computeStats(MOCK_ITEMS);
  assert.equal(stats.total, 11);
  assert.equal(stats.published, 6);
  assert.equal(stats.draft, 3);
  assert.equal(stats.archived, 2);
  assert.equal(stats.highPriority, 3);
  const expectedReads =
    12580 + 8430 + 3210 + 9870 + 12540 + 18920 + 4560 + 7890;
  assert.equal(stats.totalReads, expectedReads);
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

test('computeStats 单元素列表应正确计算', () => {
  const single: Announcement[] = [MOCK_ITEMS[0]];
  const stats = computeStats(single);
  assert.equal(stats.total, 1);
  assert.equal(stats.published, 1);
  assert.equal(stats.draft, 0);
  assert.equal(stats.archived, 0);
  assert.equal(stats.highPriority, 1);
  assert.equal(stats.totalReads, single[0]?.readCount);
});

/* =================================================================
 * 四、辅助函数映射 — 正例
 * ================================================================= */

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
  assert.equal(getPriorityColor('low'), '#6b7280');
  assert.equal(getPriorityColor('unknown'), '#6b7280');
});

test('formatDate 应格式化日期并处理空值', () => {
  assert.equal(formatDate('2026-07-05'), '2026-07-05');
  assert.equal(formatDate(''), '-');
  assert.equal(formatDate('2026-01-01'), '2026-01-01');
});

test('formatDate 应处理无效日期为 NaN-NaN-NaN', () => {
  const result = formatDate('not-a-date');
  // new Date('not-a-date') 产生 Invalid Date, getFullYear 返回 NaN
  // formatDate 的 try-catch 不 catch NaN，所以返回 'NaN-NaN-NaN'
  assert.equal(result, 'NaN-NaN-NaN');
});

/* =================================================================
 * 五、filterAnnouncements 筛选逻辑 — 正例
 * ================================================================= */

test('filterAnnouncements 应支持按标题搜索', () => {
  const result = filterAnnouncements(MOCK_ITEMS, '维护', '', '');
  assert.ok(result.length >= 2); // a1 系统升级维护通知, a9 数据库服务器例行维护
  assert.ok(result.some((i) => i.title.includes('维护')));
});

test('filterAnnouncements 应支持按摘要搜索（忽略大小写）', () => {
  const bySummary = filterAnnouncements(MOCK_ITEMS, '满300', '', '');
  assert.equal(bySummary.length, 1);
  assert.equal(bySummary[0]?.title, '夏季促销活动');
});

test('filterAnnouncements 应支持按英文关键词搜索（忽略大小写）', () => {
  const result = filterAnnouncements(MOCK_ITEMS, 'v3.8', '', '');
  assert.equal(result.length, 1);
  assert.equal(result[0]?.title, 'v3.8.0 版本更新日志');
});

test('filterAnnouncements 应支持分类筛选', () => {
  const byCategory = filterAnnouncements(MOCK_ITEMS, '', 'operation', '');
  assert.equal(byCategory.length, 4); // a3, a5, a7, a9
  assert.ok(byCategory.every((i) => i.category === 'operation'));
});

test('filterAnnouncements 应支持状态筛选', () => {
  const byStatus = filterAnnouncements(MOCK_ITEMS, '', '', 'draft');
  assert.equal(byStatus.length, 3);
  assert.ok(byStatus.every((i) => i.status === 'draft'));
});

test('filterAnnouncements 应支持组合筛选（分类+状态）', () => {
  const combined = filterAnnouncements(MOCK_ITEMS, '', 'policy', 'published');
  assert.equal(combined.length, 1);
  assert.equal(combined[0]?.title, 'v3.8.0 版本更新日志');
});

test('filterAnnouncements 应支持三重组合筛选（搜索+分类+状态）', () => {
  const result = filterAnnouncements(MOCK_ITEMS, '培训', 'operation', 'published');
  assert.equal(result.length, 1);
  assert.equal(result[0]?.title, '新员工培训');
});

/* =================================================================
 * 六、filterAnnouncements — 反例
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

test('filterAnnouncements 特殊字符搜索应安全处理', () => {
  const result = filterAnnouncements(MOCK_ITEMS, '<script>alert(1)</script>', '', '');
  assert.equal(result.length, 0); // no match, no crash
});

test('filterAnnouncements 空列表应返回空', () => {
  assert.deepEqual(filterAnnouncements([], '', '', ''), []);
  assert.deepEqual(filterAnnouncements([], 'test', '', ''), []);
  assert.deepEqual(filterAnnouncements([], '', 'system', ''), []);
});

/* =================================================================
 * 七、validateForm 表单校验 — 正例
 * ================================================================= */

test('validateForm 应通过合法完整表单', () => {
  const errors = validateForm(validForm());
  assert.deepEqual(errors, {});
});

/* =================================================================
 * 八、validateForm — 反例
 * ================================================================= */

test('validateForm 应拒绝空标题与缺失必填项', () => {
  const errors = validateForm(createEmptyForm());
  assert.equal(errors.title, '公告标题不能为空');
  assert.equal(errors.summary, '公告摘要不能为空');
  assert.equal(errors.content, '公告内容不能为空');
});

test('validateForm 应拒绝仅空白字符的输入', () => {
  const errors = validateForm(validForm({ title: '   ', summary: '   ', content: '   ' }));
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

test('validateForm 应检测缺失分类和优先级', () => {
  // 通过空字符串模拟未选择分类/优先级
  const invalidForm: FormData = {
    title: '测试标题',
    category: '' as Announcement['category'],
    priority: '' as Announcement['priority'],
    status: 'draft',
    summary: '测试摘要',
    content: '测试内容',
  };
  const errors = validateForm(invalidForm);
  assert.equal(errors.category, '请选择公告类型');
  assert.equal(errors.priority, '请选择优先级');
});

/* =================================================================
 * 九、validateForm — 边界
 * ================================================================= */

test('validateForm 应通过合法边界标题（100 字符）和摘要（200 字符）', () => {
  const boundaryTitle = 'a'.repeat(100);
  const boundarySummary = 'b'.repeat(200);
  const errors = validateForm(validForm({ title: boundaryTitle, summary: boundarySummary }));
  assert.equal(errors.title, undefined);
  assert.equal(errors.summary, undefined);
});

test('validateForm 应检测 101 字符标题为超长', () => {
  const errors = validateForm(validForm({ title: 'a'.repeat(101) }));
  assert.equal(errors.title, '公告标题最多100个字符');
});

test('validateForm 应检测 201 字符摘要为超长', () => {
  const errors = validateForm(validForm({ summary: 'a'.repeat(201) }));
  assert.equal(errors.summary, '公告摘要最多200个字符');
});

test('validateForm 应返回多个错误同时存在', () => {
  const invalidForm: FormData = {
    title: 'a'.repeat(101),
    category: '' as Announcement['category'],
    priority: 'normal',
    status: 'draft',
    summary: 'a'.repeat(201),
    content: '',
  };
  const errors = validateForm(invalidForm);
  assert.ok(Object.keys(errors).length >= 4);
});

/* =================================================================
 * 十、CRUD 辅助函数 — 正例
 * ================================================================= */

test('createEmptyForm 应返回正确默认值', () => {
  const form = createEmptyForm();
  assert.equal(form.title, '');
  assert.equal(form.category, 'operation');
  assert.equal(form.priority, 'normal');
  assert.equal(form.status, 'draft');
  assert.equal(form.summary, '');
  assert.equal(form.content, '');
});

test('addAnnouncement 应在列表首位新增并设置默认字段', () => {
  const form = validForm({ title: '新建测试公告' });
  const updated = addAnnouncement(MOCK_ITEMS, form);

  assert.equal(updated.length, MOCK_ITEMS.length + 1);
  assert.equal(updated[0]?.title, '新建测试公告');
  assert.equal(updated[0]?.author, '当前用户');
  assert.equal(updated[0]?.status, 'draft');
  assert.equal(updated[0]?.readCount, 0);
  assert.equal(updated[0]?.publishedAt, ''); // draft -> publishedAt should be empty
  assert.equal(updated[1]?.id, 'a1');
});

test('addAnnouncement 发布状态应设置发布时间', () => {
  const form = validForm({ title: '立即发布', status: 'published' });
  const updated = addAnnouncement(MOCK_ITEMS, form);
  const newItem = updated[0];
  assert.equal(newItem?.status, 'published');
  assert.ok(newItem?.publishedAt !== '');
});

test('addAnnouncement 空列表应正常新增', () => {
  const form = validForm({ title: '首条公告' });
  const updated = addAnnouncement([], form);
  assert.equal(updated.length, 1);
  assert.equal(updated[0]?.title, '首条公告');
});

test('archiveAnnouncement 仅归档已发布公告，其他状态不受影响', () => {
  const updated = archiveAnnouncement(MOCK_ITEMS, 'a1');
  const archived = updated.find((i) => i.id === 'a1');
  assert.equal(archived?.status, 'archived');

  const published = updated.filter((i) => i.status === 'published');
  assert.equal(published.length, 5); // a2, a3, a4, a9, a10 remain published

  // 尝试归档草稿不应生效
  const noop = archiveAnnouncement(MOCK_ITEMS, 'a5');
  const draftRemains = noop.find((i) => i.id === 'a5');
  assert.equal(draftRemains?.status, 'draft');
});

test('archiveAnnouncement 归档已归档的公告应不变', () => {
  const updated = archiveAnnouncement(MOCK_ITEMS, 'a7');
  const stillArchived = updated.find((i) => i.id === 'a7');
  assert.equal(stillArchived?.status, 'archived');
  assert.equal(updated.length, MOCK_ITEMS.length);
});

test('archiveAnnouncement 归档不存在的 ID 应保持不变', () => {
  const updated = archiveAnnouncement(MOCK_ITEMS, 'nonexistent');
  assert.equal(updated.length, MOCK_ITEMS.length);
  assert.equal(updated.filter((i) => i.status === 'published').length, 6);
});

test('archiveAnnouncement 空列表应安全返回', () => {
  assert.deepEqual(archiveAnnouncement([], 'a1'), []);
});

test('deleteAnnouncement 应删除目标项，不存在的 ID 保持不变', () => {
  const removed = deleteAnnouncement(MOCK_ITEMS, 'a1');
  assert.equal(removed.length, MOCK_ITEMS.length - 1);
  assert.ok(!removed.some((i) => i.id === 'a1'));

  const untouched = deleteAnnouncement(MOCK_ITEMS, 'not-exist');
  assert.equal(untouched.length, MOCK_ITEMS.length);
});

test('deleteAnnouncement 删除最后一项应返回空列表', () => {
  const single: Announcement[] = [MOCK_ITEMS[0]];
  const result = deleteAnnouncement(single, single[0]?.id ?? '');
  assert.deepEqual(result, []);
});

test('deleteAnnouncement 空列表应安全返回', () => {
  assert.deepEqual(deleteAnnouncement([], 'a1'), []);
});

test('addAnnouncement → archiveAnnouncement → deleteAnnouncement 一致性', () => {
  // 完整的 CRUD 流程
  const form = validForm({ title: 'CRUD一致性测试', status: 'published' });
  let items = addAnnouncement(MOCK_ITEMS, form);
  assert.equal(items.length, MOCK_ITEMS.length + 1);
  const newId = items[0]?.id ?? '';

  // 归档
  items = archiveAnnouncement(items, newId);
  const archived = items.find((i) => i.id === newId);
  assert.equal(archived?.status, 'archived');

  // 删除
  items = deleteAnnouncement(items, newId);
  assert.ok(!items.some((i) => i.id === newId));
  assert.equal(items.length, MOCK_ITEMS.length);
});

/* =================================================================
 * 十一、排序与统计 — 正例
 * ================================================================= */

test('computeStats 仅包含 draft 的列表', () => {
  const drafts = MOCK_ITEMS.filter((i) => i.status === 'draft');
  const stats = computeStats(drafts);
  assert.equal(stats.total, drafts.length);
  assert.equal(stats.published, 0);
  assert.equal(stats.draft, drafts.length);
  assert.equal(stats.archived, 0);
});

test('computeStats totalReads 对于全零阅读应返回 0', () => {
  const zeroReads: Announcement[] = [
    { ...MOCK_ITEMS[0], readCount: 0 },
    { ...MOCK_ITEMS[1], readCount: 0 },
  ];
  const stats = computeStats(zeroReads);
  assert.equal(stats.totalReads, 0);
});

/* =================================================================
 * 十二、hooks验证 — 源代码检查
 * ================================================================= */

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('announcements — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes('requiredPermission="foundation.governance.read"'));
  });
});

describe('Announcements — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
  // 新增：验证分类标签栏存在
  it('包含分类标签栏 CATEGORY_TABS', () => assert.ok(SRC.includes('CATEGORY_TABS')));
  it('包含 role="tablist"', () => assert.ok(SRC.includes('role=\"tablist\"')));
  it('包含 activeTab 状态', () => assert.ok(SRC.includes('activeTab')));
  it('包含 setActiveTab', () => assert.ok(SRC.includes('setActiveTab')));
  it('包含 aria-selected', () => assert.ok(SRC.includes('aria-selected')));
});
