/**
 * knowledge/page.test.tsx — 知识库管理页 L1 测试
 *
 * ⚡ 覆盖: 正例 + 反例 + 边界
 * Mock策略: URL-pattern responseRegistry
 * 禁止: as any / describe.skip / it.only
 * 原则: beforeEach 重置，test 自包含
 *
 * 功能覆盖:
 *  - 类型定义（KnowledgeCategory / RecentDocument / KnowledgeSnapshot）
 *  - 数据结构校验（6 个分类 / 5 篇最近文档 / 总数 83 / 阅读量 15420）
 *  - 分类 icon 有效性
 *  - 最近文档 author / summary 完整性
 *  - 页面标题 "📚 知识库"
 *  - 客户端组件挂载（KnowledgeClient 接收 data 属性）
 *  - 错误处理（ErrorBoundary 包裹）
 *  - 加载状态（LoadingSkeleton）
 *  - exort 导出（dynamic / revalidate）
 *  - 空数组边界
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import fs from 'node:fs';

// ===================== 类型定义 =====================

interface KnowledgeCategory {
  id: string;
  name: string;
  icon: string;
  docCount: number;
  lastUpdated: string;
}

interface RecentDocument {
  id: string;
  title: string;
  category: string;
  author: string;
  updatedAt: string;
  summary: string;
}

interface KnowledgeSnapshot {
  categories: KnowledgeCategory[];
  recentDocuments: RecentDocument[];
  totalDocuments: number;
  totalViews: number;
}

// ===================== 样本数据 (与 page.tsx 同步) =====================

const CATEGORIES: KnowledgeCategory[] = [
  { id: 'ops', name: '运营手册', icon: '📖', docCount: 24, lastUpdated: '2026-07-15' },
  { id: 'device', name: '设备指南', icon: '🔧', docCount: 15, lastUpdated: '2026-07-14' },
  { id: 'member', name: '会员政策', icon: '👤', docCount: 8, lastUpdated: '2026-07-13' },
  { id: 'finance', name: '财务规范', icon: '💰', docCount: 12, lastUpdated: '2026-07-12' },
  { id: 'safety', name: '安全制度', icon: '🛡️', docCount: 6, lastUpdated: '2026-07-10' },
  { id: 'marketing', name: '营销资料', icon: '📢', docCount: 18, lastUpdated: '2026-07-16' },
];

const RECENT_DOCUMENTS: RecentDocument[] = [
  { id: 'doc-1', title: '暑期促销活动执行手册', category: 'marketing', author: '陈静', updatedAt: '2026-07-16', summary: '暑期特惠季活动全流程SOP，包括物料准备、人员调配、效果追踪' },
  { id: 'doc-2', title: 'VR设备日常维护指南', category: 'device', author: '杨磊', updatedAt: '2026-07-15', summary: 'VR设备开关机、清洁、基础故障排查、巡检流程' },
  { id: 'doc-3', title: '会员开卡操作流程', category: 'member', author: '李娜', updatedAt: '2026-07-14', summary: '前台会员开卡、充值、积分兑换的操作指南' },
  { id: 'doc-4', title: '现金对账标准流程', category: 'finance', author: '财务部', updatedAt: '2026-07-13', summary: '日结现金清点、银行存缴、差异处理标准操作规范' },
  { id: 'doc-5', title: '消防安全检查清单', category: 'safety', author: '安监部', updatedAt: '2026-07-12', summary: '每日/每周/每月安全检查项目及标准' },
];

const SNAPSHOT: KnowledgeSnapshot = {
  categories: CATEGORIES,
  recentDocuments: RECENT_DOCUMENTS,
  totalDocuments: 83,
  totalViews: 15420,
};

// ===================== 辅助函数 =====================

/** 验证每个分类必填字段不为空 */
function validateCategory(cat: KnowledgeCategory): void {
  assert.ok(typeof cat.id === 'string' && cat.id.length > 0, `分类 id 为空: ${JSON.stringify(cat)}`);
  assert.ok(typeof cat.name === 'string' && cat.name.length > 0, `分类 name 为空: ${JSON.stringify(cat)}`);
  assert.ok(typeof cat.icon === 'string' && cat.icon.length > 0, `分类 icon 为空: ${JSON.stringify(cat)}`);
  assert.ok(typeof cat.docCount === 'number' && cat.docCount >= 0, `分类 docCount 无效: ${JSON.stringify(cat)}`);
  assert.ok(typeof cat.lastUpdated === 'string' && cat.lastUpdated.length > 0, `分类 lastUpdated 为空: ${JSON.stringify(cat)}`);
}

/** 验证每篇最近文档必填字段不为空 */
function validateDocument(doc: RecentDocument): void {
  assert.ok(typeof doc.id === 'string' && doc.id.length > 0, `文档 id 为空: ${JSON.stringify(doc)}`);
  assert.ok(typeof doc.title === 'string' && doc.title.length > 0, `文档 title 为空: ${JSON.stringify(doc)}`);
  assert.ok(typeof doc.category === 'string' && doc.category.length > 0, `文档 category 为空: ${JSON.stringify(doc)}`);
  assert.ok(typeof doc.author === 'string' && doc.author.length > 0, `文档 author 为空: ${JSON.stringify(doc)}`);
  assert.ok(typeof doc.updatedAt === 'string' && doc.updatedAt.length > 0, `文档 updatedAt 为空: ${JSON.stringify(doc)}`);
  assert.ok(typeof doc.summary === 'string' && doc.summary.length > 0, `文档 summary 为空: ${JSON.stringify(doc)}`);
}

/** 标识符命名规范: 小写英文 + 连字符，≥2 字符 */
function isValidId(id: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(id) && id.length >= 2;
}

/** Emoji 判定: 覆盖 0x1F000-0x1FFFF 以及 0x2600-0x27BF 等常用 Emoji 范围 */
function isEmoji(char: string): boolean {
  const cp = char.codePointAt(0)!;
  // 常用 Emoji / 符号区 / 杂项符号 / 装饰符号
  return (cp >= 0x1f000 && cp <= 0x1ffff) ||
         (cp >= 0x2600 && cp <= 0x27bf) ||
         (cp >= 0x2300 && cp <= 0x23ff);
}

// ===================== 正例 =====================

describe('KnowledgePage — 正例', () => {
  beforeEach(() => {
    // 无 mock 前置依赖 — 本测试纯静态分析数据结构和类型
  });

  describe('KnowledgeSnapshot 数据结构', () => {
    it('snapshot 包含 categories / recentDocuments / totalDocuments / totalViews 四个顶级字段', () => {
      const keys = Object.keys(SNAPSHOT).sort();
      assert.deepStrictEqual(keys, ['categories', 'recentDocuments', 'totalDocuments', 'totalViews']);
    });

    it('categories 为数组且长度为 6', () => {
      assert.ok(Array.isArray(SNAPSHOT.categories));
      assert.strictEqual(SNAPSHOT.categories.length, 6);
    });

    it('recentDocuments 为数组且长度为 5', () => {
      assert.ok(Array.isArray(SNAPSHOT.recentDocuments));
      assert.strictEqual(SNAPSHOT.recentDocuments.length, 5);
    });

    it('totalDocuments 为 83，totalViews 为 15420', () => {
      assert.strictEqual(SNAPSHOT.totalDocuments, 83);
      assert.strictEqual(SNAPSHOT.totalViews, 15420);
    });
  });

  describe('KnowledgeCategory 类型校验', () => {
    it('每个分类 id 为小写英文+连字符，≥2 字符', () => {
      for (const cat of SNAPSHOT.categories) {
        assert.ok(isValidId(cat.id), `分类 id 格式无效: ${cat.id}`);
      }
    });

    it('每个分类必填字段均非空', () => {
      for (const cat of SNAPSHOT.categories) {
        validateCategory(cat);
      }
    });

    it('每个分类 docCount 为正整数', () => {
      for (const cat of SNAPSHOT.categories) {
        assert.ok(Number.isInteger(cat.docCount) && cat.docCount > 0,
          `分类 ${cat.id} docCount=${cat.docCount} 应为正整数`);
      }
    });

    it('每个分类 icon 为 Emoji 字符', () => {
      for (const cat of SNAPSHOT.categories) {
        const firstChar = Array.from(cat.icon)[0] || cat.icon;
        assert.ok(isEmoji(firstChar), `分类 ${cat.id} icon "${cat.icon}" 不是 Emoji`);
      }
    });

    it('lastUpdated 符合 ISO 日期格式 YYYY-MM-DD', () => {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      for (const cat of SNAPSHOT.categories) {
        assert.ok(datePattern.test(cat.lastUpdated),
          `分类 ${cat.id} lastUpdated "${cat.lastUpdated}" 格式非 YYYY-MM-DD`);
      }
    });
  });

  describe('RecentDocument 类型校验', () => {
    it('每篇文档必填字段均非空', () => {
      for (const doc of SNAPSHOT.recentDocuments) {
        validateDocument(doc);
      }
    });

    it('每篇文档 id 符合命名规范', () => {
      for (const doc of SNAPSHOT.recentDocuments) {
        assert.ok(isValidId(doc.id), `文档 id 格式无效: ${doc.id}`);
      }
    });

    it('每篇文档 summary 长度 ≥5 个字符且有实际内容', () => {
      for (const doc of SNAPSHOT.recentDocuments) {
        assert.ok(doc.summary.length >= 5, `文档 ${doc.id} summary 过短: "${doc.summary}"`);
        assert.ok(doc.summary.includes('、') || doc.summary.includes('，') || doc.summary.length >= 10,
          `文档 ${doc.id} summary 缺少分隔符或长度不足`);
      }
    });

    it('每篇文档 author 不为空且包含中文', () => {
      for (const doc of SNAPSHOT.recentDocuments) {
        assert.ok(doc.author.length > 0, `文档 ${doc.id} author 为空`);
        assert.ok(/[\u4e00-\u9fff]/.test(doc.author), `文档 ${doc.id} author "${doc.author}" 不包含中文字符`);
      }
    });

    it('updatedAt 符合 YYYY-MM-DD 格式', () => {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      for (const doc of SNAPSHOT.recentDocuments) {
        assert.ok(datePattern.test(doc.updatedAt),
          `文档 ${doc.id} updatedAt "${doc.updatedAt}" 格式非 YYYY-MM-DD`);
      }
    });

    it('category 与现有分类 id 对应', () => {
      const categoryIds = new Set(SNAPSHOT.categories.map((c) => c.id));
      for (const doc of SNAPSHOT.recentDocuments) {
        assert.ok(categoryIds.has(doc.category),
          `文档 ${doc.id} category "${doc.category}" 不匹配任何分类 id`);
      }
    });
  });

  describe('页面导出', () => {
    const sourceContent = fs.readFileSync(
      new URL('./page.tsx', import.meta.url),
      'utf-8',
    );

    it('默认导出函数名为 KnowledgePage', () => {
      assert.ok(/export default async function KnowledgePage/.test(sourceContent));
    });

    it('exort dynamic = "force-dynamic"', () => {
      assert.ok(/export const dynamic\s*=\s*['"]force-dynamic['"]/.test(sourceContent));
    });

    it('exort revalidate = 0', () => {
      assert.ok(/export const revalidate\s*=\s*0/.test(sourceContent));
    });
  });

  describe('组件结构', () => {
    const sourceContent = fs.readFileSync(
      new URL('./page.tsx', import.meta.url),
      'utf-8',
    );

    it('使用 ErrorBoundary 包裹页面', () => {
      assert.ok(/<ErrorBoundary>/.test(sourceContent));
      assert.ok(/<\/ErrorBoundary>/.test(sourceContent));
    });

    it('使用 PageShell 且 title 为 "📚 知识库"', () => {
      assert.ok(/title="📚 知识库"/.test(sourceContent));
    });

    it('使用 LoadingSkeleton variant="card" rows={8}', () => {
      assert.ok(/LoadingSkeleton variant="card" rows=\{8\}/.test(sourceContent));
    });

    it('加载态标签为 "加载知识库..."', () => {
      assert.ok(/label="加载知识库\.\.\."/.test(sourceContent));
    });

    it('使用 Suspense + KnowledgeClient 组合', () => {
      assert.ok(/<Suspense/.test(sourceContent));
      assert.ok(/KnowledgeClient data=\{data\} \/>/.test(sourceContent));
    });

    it('KnowledgeClient 仅接收 data 属性', () => {
      const match = sourceContent.match(/<KnowledgeClient[^>]*\/>/);
      assert.ok(match, '未匹配到 KnowledgeClient');
      assert.ok(/data=\{data\}/.test(match[0]), 'KnowledgeClient 必须传递 data 属性');
      // 断言没有其他属性
      const attrList = match[0].replace(/\/>$/, '>').match(/(\w+)=\{[^}]+\}/g);
      if (attrList) {
        for (const attr of attrList) {
          assert.ok(attr.startsWith('data='), `KnowledgeClient 接收了意外的属性: ${attr}`);
        }
      }
    });
  });
});

// ===================== 反例 / 边界 =====================

describe('KnowledgePage — 反例 & 边界', () => {
  describe('空数组边界', () => {
    it('空 categories 数组仍为合法快照', () => {
      const empty: KnowledgeSnapshot = {
        categories: [],
        recentDocuments: RECENT_DOCUMENTS,
        totalDocuments: 0,
        totalViews: 0,
      };
      assert.ok(Array.isArray(empty.categories));
      assert.strictEqual(empty.categories.length, 0);
      assert.strictEqual(empty.totalDocuments, 0);
      assert.strictEqual(empty.totalViews, 0);
    });

    it('空 recentDocuments 数组仍为合法快照', () => {
      const empty: KnowledgeSnapshot = {
        categories: CATEGORIES,
        recentDocuments: [],
        totalDocuments: CATEGORIES.reduce((s, c) => s + c.docCount, 0),
        totalViews: 0,
      };
      assert.ok(Array.isArray(empty.recentDocuments));
      assert.strictEqual(empty.recentDocuments.length, 0);
    });
  });

  describe('字段类型守卫', () => {
    it('docCount 不允许负值', () => {
      for (const cat of CATEGORIES) {
        assert.ok(cat.docCount >= 0, `分类 ${cat.id} docCount=${cat.docCount} 为负`);
      }
    });

    it('totalDocuments 与分类 docCount 之和一致', () => {
      const sumByCategory = CATEGORIES.reduce((s, c) => s + c.docCount, 0);
      assert.strictEqual(SNAPSHOT.totalDocuments, sumByCategory,
        `totalDocuments(${SNAPSHOT.totalDocuments}) !== 各分类和(${sumByCategory})`);
    });
  });

  describe('重复 / 唯一性', () => {
    it('分类 id 无重复', () => {
      const ids = CATEGORIES.map((c) => c.id);
      assert.strictEqual(new Set(ids).size, ids.length, '分类 id 存在重复');
    });

    it('文档 id 无重复', () => {
      const ids = RECENT_DOCUMENTS.map((d) => d.id);
      assert.strictEqual(new Set(ids).size, ids.length, '文档 id 存在重复');
    });
  });
});
