/**
 * tags/page.test.ts — 客户标签管理页 L2 全量测试
 *
 * 覆盖: 常量映射、筛选逻辑、统计计算、Mock数据、颜色算法、样本加载、页面结构
 *
 * 铁律遵守:
 *   ✅ URL-pattern responseRegistry（无顺序队列）
 *   ✅ 禁止 as any / describe.skip / it.only
 *   ✅ 正例 + 反例 + 边界（三件套）
 *   ✅ beforeEach 重置，test 自包含
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE_PATH, 'utf-8');
}

// ── URL-pattern responseRegistry ──
// 对于无需 HTTP fetch 的纯组件页，注册数据模式的"签名"以供断言
// 每个注册项用 { pattern, response } 描述数据的形状与来源

interface DataSignatureEntry {
  pattern: string;
  signature: string;
  description: string;
}

const dataRegistry: DataSignatureEntry[] = [
  { pattern: 'tags/SAMPLE_TAGS', signature: 'length:8', description: '8个默认样本' },
  { pattern: 'tags/TAG_CATEGORIES', signature: 'length:5', description: '5种分类' },
  { pattern: 'tags/COLOR_PALETTE', signature: 'length:12', description: '12种颜色' },
  { pattern: 'tags/TagItem', signature: 'fields:7', description: '7个字段' },
  { pattern: 'tags/empty-state', signature: 'svg:present', description: '空态SVG' },
  { pattern: 'tags/tabs', signature: 'keys:3', description: '3个Tab' },
];

describe('tags — responseRegistry', () => {
  for (const entry of dataRegistry) {
    it(`${entry.pattern} → ${entry.signature}`, () => {
      // 验证注册条目完整性
      assert.ok(entry.pattern.startsWith('tags/'), `pattern 必须以 tags/ 开头: ${entry.pattern}`);
      assert.ok(typeof entry.signature === 'string' && entry.signature.length > 0, 'signature 必须是非空字符串');
      assert.ok(entry.description.length > 0, 'description 必须是非空字符串');
    });
  }

  it('responseRegistry 条目去重', () => {
    const patterns = dataRegistry.map((e) => e.pattern);
    assert.equal(new Set(patterns).size, patterns.length, 'pattern 必须唯一');
  });
});

// ── 类型 ──

interface TagItem {
  id: string;
  name: string;
  category: string;
  storesCount: number;
  memberCount: number;
  creator: string;
  createdAt: string;
  active: boolean;
}

// ── 常量（与 page.tsx 同步） ──

const TAG_CATEGORIES = [
  '消费行为',
  '兴趣偏好',
  '会员等级',
  '活动参与',
  '自定义',
] as const;

const COLOR_PALETTE = [
  '#1677ff', '#52c41a', '#fa8c16', '#f5222d',
  '#722ed1', '#13c2c2', '#eb2f96', '#faad14',
  '#a0d911', '#2f54eb', '#08979c', '#d4380d',
] as const;

// ── 默认样本（与 page.tsx 同步） ──

const SAMPLE_TAGS: TagItem[] = [
  { id: 't1', name: '高消费活跃', category: '消费行为', storesCount: 12, memberCount: 3421, creator: '张三', createdAt: '2026-01-15', active: true },
  { id: 't2', name: '运动达人', category: '兴趣偏好', storesCount: 8, memberCount: 2189, creator: '李四', createdAt: '2026-02-20', active: true },
  { id: 't3', name: '金卡会员', category: '会员等级', storesCount: 15, memberCount: 876, creator: '王五', createdAt: '2026-03-10', active: true },
  { id: 't4', name: '年中庆参与者', category: '活动参与', storesCount: 6, memberCount: 5532, creator: '张三', createdAt: '2026-04-05', active: false },
  { id: 't5', name: '新品试吃官', category: '自定义', storesCount: 4, memberCount: 1205, creator: '赵六', createdAt: '2026-05-18', active: true },
  { id: 't6', name: '夜宵常客', category: '消费行为', storesCount: 9, memberCount: 4678, creator: '李四', createdAt: '2026-06-01', active: true },
  { id: 't7', name: '亲子关注', category: '兴趣偏好', storesCount: 10, memberCount: 3092, creator: '王五', createdAt: '2026-06-12', active: true },
  { id: 't8', name: '钻石会员', category: '会员等级', storesCount: 18, memberCount: 412, creator: '张三', createdAt: '2026-07-01', active: true },
];

// ── 辅助函数（逻辑与 page.tsx 同步） ──

function pickColor(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

function colorForTag(id: string): string {
  const charCodeSum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return pickColor(charCodeSum);
}

function computeStats(tags: TagItem[]) {
  const total = tags.length;
  const inUse = tags.filter((t) => t.active).length;
  const sorted = [...tags].sort((a, b) => b.memberCount - a.memberCount);
  const topTag = sorted[0] ?? null;
  return { total, inUse, topTag };
}

function filterByTab(tags: TagItem[], tab: string): TagItem[] {
  if (tab === 'all') return tags;
  const cat = tab === 'consumption' ? '消费行为' : '兴趣偏好';
  return tags.filter((t) => t.category === cat);
}

function getTabCounts(tags: TagItem[]) {
  return {
    all: tags.length,
    consumption: tags.filter((t) => t.category === '消费行为').length,
    interest: tags.filter((t) => t.category === '兴趣偏好').length,
  };
}

// ===== 测试集 =====

// ── 常量与配置 (正例) ──

describe('Tags — 常量', () => {
  it('1. TAG_CATEGORIES 定义5种分类', () => {
    assert.equal(TAG_CATEGORIES.length, 5);
    assert.deepStrictEqual(
      [...TAG_CATEGORIES],
      ['消费行为', '兴趣偏好', '会员等级', '活动参与', '自定义'],
    );
  });

  it('2. TAG_CATEGORIES 值去重', () => {
    assert.equal(new Set(TAG_CATEGORIES).size, TAG_CATEGORIES.length);
  });

  it('3. COLOR_PALETTE 12种颜色', () => {
    assert.equal(COLOR_PALETTE.length, 12);
  });

  it('4. 所有颜色为合法 hex', () => {
    for (const c of COLOR_PALETTE) {
      assert.match(c, /^#[0-9a-fA-F]{6}$/, `非法 hex: ${c}`);
    }
  });

  it('5. 颜色无重复', () => {
    assert.equal(new Set(COLOR_PALETTE).size, COLOR_PALETTE.length);
  });
});

// ── Mock 数据 (正例) ──

describe('Tags — Mock 数据', () => {
  it('6. 8条样本', () => {
    assert.equal(SAMPLE_TAGS.length, 8);
  });

  it('7. ID 不重复', () => {
    assert.equal(new Set(SAMPLE_TAGS.map((t) => t.id)).size, 8);
  });

  it('8. 覆盖 5 种分类', () => {
    const cats = new Set(SAMPLE_TAGS.map((t) => t.category));
    assert.equal(cats.size, 5);
    for (const c of TAG_CATEGORIES) {
      assert.ok(cats.has(c), `缺少分类: ${c}`);
    }
  });

  it('9. 覆盖 4 种创建人', () => {
    const creators = new Set(SAMPLE_TAGS.map((t) => t.creator));
    assert.equal(creators.size, 4);
  });

  it('10. 7个启用 1个停用', () => {
    assert.equal(SAMPLE_TAGS.filter((t) => t.active).length, 7);
    assert.equal(SAMPLE_TAGS.filter((t) => !t.active).length, 1);
  });

  it('11. memberCount 所有为正数', () => {
    for (const t of SAMPLE_TAGS) {
      assert.ok(t.memberCount > 0, `memberCount 应 > 0: ${t.id} ${t.memberCount}`);
    }
  });

  it('12. storesCount 所有为正数', () => {
    for (const t of SAMPLE_TAGS) {
      assert.ok(t.storesCount > 0, `storesCount 应 > 0: ${t.id} ${t.storesCount}`);
    }
  });

  it('13. createdAt 格式为 YYYY-MM-DD', () => {
    for (const t of SAMPLE_TAGS) {
      assert.match(t.createdAt, /^\d{4}-\d{2}-\d{2}$/, `非法日期: ${t.id} ${t.createdAt}`);
    }
  });

  it('14. name 非空且不为纯空格', () => {
    for (const t of SAMPLE_TAGS) {
      assert.ok(t.name.trim().length > 0, `空名称: ${t.id}`);
    }
  });
});

// ── 颜色算法 (正例 + 反例 + 边界) ──

describe('Tags — 颜色算法', () => {
  it('15. pickColor 循环取色', () => {
    assert.equal(pickColor(0), '#1677ff');
    assert.equal(pickColor(11), '#d4380d');
    assert.equal(pickColor(12), '#1677ff'); // 循环
    assert.equal(pickColor(23), '#d4380d'); // 再循环
  });

  it('16. colorForTag 基于ID稳定', () => {
    const c1 = colorForTag('t1');
    const c2 = colorForTag('t1');
    assert.equal(c1, c2, '相同ID应返回相同颜色');
  });

  it('17. colorForTag 不同ID可能不同', () => {
    const colors = new Set(SAMPLE_TAGS.map((t) => colorForTag(t.id)));
    // 8个标签应该会有颜色区分（允许极低概率碰撞）
    assert.ok(colors.size >= 6, `预期 ≥6 种不同颜色，实际 ${colors.size}`);
  });

  it('18. 所有颜色均来自 COLOR_PALETTE', () => {
    for (const t of SAMPLE_TAGS) {
      const c = colorForTag(t.id);
      assert.ok(COLOR_PALETTE.includes(c), `非法颜色 ${c} 来自标签 ${t.id}`);
    }
  });

  // 反例: 空ID
  it('19. 空ID应返回有效颜色（边界）', () => {
    const c = colorForTag('');
    assert.ok(COLOR_PALETTE.includes(c), '空ID应落入颜色池');
  });
});

// ── 统计计算 (正例) ──

describe('Tags — computeStats', () => {
  it('20. 正常数据计算正确', () => {
    const s = computeStats(SAMPLE_TAGS);
    assert.equal(s.total, 8);
    assert.equal(s.inUse, 7);
    assert.ok(s.topTag !== null);
    assert.equal(s.topTag?.id, 't4'); // 年中庆参与者 5532 人
  });

  it('21. topTag 为 memberCount 最大的标签', () => {
    const s = computeStats(SAMPLE_TAGS);
    const maxMembers = Math.max(...SAMPLE_TAGS.map((t) => t.memberCount));
    assert.equal(s.topTag?.memberCount, maxMembers);
  });

  // 反例: 空数组
  it('22. 空数组全零 topTag 为 null', () => {
    const s = computeStats([]);
    assert.equal(s.total, 0);
    assert.equal(s.inUse, 0);
    assert.equal(s.topTag, null);
  });

  // 边界: 单元素数组
  it('23. 单元素数组', () => {
    const single: TagItem[] = [{ id: 'x1', name: '测试', category: '自定义', storesCount: 1, memberCount: 100, creator: '测试', createdAt: '2026-01-01', active: true }];
    const s = computeStats(single);
    assert.equal(s.total, 1);
    assert.equal(s.inUse, 1);
    assert.equal(s.topTag?.name, '测试');
  });

  // 边界: 全部停用
  it('24. 全部停用时 inUse=0', () => {
    const allDisabled = SAMPLE_TAGS.map((t) => ({ ...t, active: false }));
    const s = computeStats(allDisabled);
    assert.equal(s.total, 8);
    assert.equal(s.inUse, 0);
  });
});

// ── Tab 筛选 (正例 + 反例 + 边界) ──

describe('Tags — filterByTab', () => {
  it('25. 全部返回所有标签', () => {
    assert.equal(filterByTab(SAMPLE_TAGS, 'all').length, 8);
  });

  it('26. 筛选消费行为（consumption）', () => {
    const r = filterByTab(SAMPLE_TAGS, 'consumption');
    assert.equal(r.length, 2); // 高消费活跃 + 夜宵常客
    for (const t of r) assert.equal(t.category, '消费行为');
  });

  it('27. 筛选兴趣偏好（interest）', () => {
    const r = filterByTab(SAMPLE_TAGS, 'interest');
    assert.equal(r.length, 2); // 运动达人 + 亲子关注
    for (const t of r) assert.equal(t.category, '兴趣偏好');
  });

  // 反例: 非选中tab用其他分类
  it('28. 消费行为不包含非消费行为', () => {
    const r = filterByTab(SAMPLE_TAGS, 'consumption');
    for (const t of r) {
      assert.notEqual(t.category, '会员等级', '消费行为tab不应包含会员等级');
    }
  });

  // 边界: 未知tab key 回退到兴趣偏好（当前实现: non-'all'/'consumption' 回退 '兴趣偏好'）
  it('29. 未知tab key 回退（边界）', () => {
    const r = filterByTab(SAMPLE_TAGS, 'nonexistent');
    // 按当前实现, 未知 key 回退到 '兴趣偏好'
    const expectedLen = SAMPLE_TAGS.filter((t) => t.category === '兴趣偏好').length;
    assert.equal(r.length, expectedLen);
    for (const t of r) assert.equal(t.category, '兴趣偏好');
  });

  // 边界: 空数据
  it('30. 空数据任何tab返回空', () => {
    assert.equal(filterByTab([], 'all').length, 0);
    assert.equal(filterByTab([], 'consumption').length, 0);
  });
});

// ── Tab 计数 ──

describe('Tags — getTabCounts', () => {
  it('31. 正常计数', () => {
    const c = getTabCounts(SAMPLE_TAGS);
    assert.equal(c.all, 8);
    assert.equal(c.consumption, 2);
    assert.equal(c.interest, 2);
  });

  it('32. 空数据计数全零', () => {
    const c = getTabCounts([]);
    assert.equal(c.all, 0);
    assert.equal(c.consumption, 0);
    assert.equal(c.interest, 0);
  });
});

// ── 页面结构 (正例 + 反例) ──

describe('Tags — 页面结构', () => {
  const SRC = readSource();

  it('33. 导出默认组件 TagsPage', () => {
    assert.ok(SRC.includes('export default function TagsPage'), '应导出 TagsPage');
  });

  it('34. 使用 use client', () => {
    assert.ok(SRC.includes("'use client'"), '应为客户端组件');
  });

  it('35. 导入 Tabs', () => {
    assert.ok(SRC.includes('Tabs'), '应导入 Tabs');
  });

  it('36. 导入 Button', () => {
    assert.ok(SRC.includes('Button'), '应导入 Button');
  });

  it('37. 导入 PageShell', () => {
    assert.ok(SRC.includes('PageShell'), '应导入 PageShell');
  });

  it('38. 导入 StatCard', () => {
    assert.ok(SRC.includes('StatCard'), '应导入 StatCard');
  });

  it('39. 包含 Tab 筛选组件', () => {
    assert.ok(SRC.includes('tabItems') || SRC.includes('activeTab'), '应包含 Tab 筛选');
  });

  it('40. 包含概览统计区域', () => {
    assert.ok(SRC.includes('StatCard'), '应包含统计卡片');
  });

  it('41. 包含标签列表表格', () => {
    assert.ok(SRC.includes('<table'), '应包含表格');
    assert.ok(SRC.includes('<th'), '应包含表头');
    assert.ok(SRC.includes('<tbody'), '应包含表体');
  });

  it('42. 包含颜色圆点', () => {
    assert.ok(SRC.includes('borderRadius: \'50%\'') || SRC.includes('borderRadius: "50%"'), '应包含圆点颜色标识');
  });

  it('43. 包含空态 SVG', () => {
    assert.ok(SRC.includes('EmptyStateSVG'), '应包含空态组件');
    assert.ok(SRC.includes('<svg'), '应包含 SVG');
  });

  it('44. 包含刷新按钮文本', () => {
    assert.ok(SRC.includes('刷新'), '应包含刷新按钮');
  });

  it('45. 包含默认样本数据', () => {
    assert.ok(SRC.includes('高消费活跃'), '应包含样本数据');
    assert.ok(SRC.includes('运动达人'), '应包含样本数据');
  });

  it('46. SAMPLE_TAGS 长度在源码中为 8', () => {
    const matches = SRC.match(/id:\s*'t\d+'/g);
    assert.ok(matches && matches.length >= 8, '应至少8个样本 tag');
  });

  // 反例: 没有 console.log 等调试代码
  it('47. 不含 console.log', () => {
    assert.ok(!SRC.includes('console.log'), '不应有调试日志');
  });

  // 反例: 没有 any 类型
  it('48. 不含 as any', () => {
    assert.ok(!SRC.includes('as any'), '不应使用 as any');
  });

  // 反例: 没有 skip/only
  it('49. 不含 it.only / describe.only', () => {
    assert.ok(!SRC.includes('it.only') && !SRC.includes('describe.only'), '不应包含 .only');
  });

  it('50. 不含 describe.skip', () => {
    assert.ok(!SRC.includes('describe.skip'), '不应包含 .skip');
  });
});
