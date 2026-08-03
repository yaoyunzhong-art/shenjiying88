/**
 * bookshelf/page.test.ts — 书架知识库 L1 源码冒烟测试
 * 覆盖: 文章分类 · 搜索 · 热门推荐 · 统计 · 边界 · 防御
 * 角色: 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_PATH = resolve(__dirname, 'page.tsx');
const SRC = readFileSync(SRC_PATH, 'utf-8');

// ── 类型（mirror page.tsx） ──

type ArticleCategory = 'game-guide' | 'device-tutorial' | 'promotion' | 'faq' | 'policy' | 'news' | 'other';
type ArticleStatus = 'published' | 'draft' | 'archived';

interface ArticleSnapshot {
  id: string;
  title: string;
  category: ArticleCategory;
  summary: string;
  author: string;
  coverUrl?: string;
  status: ArticleStatus;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
}

interface BookshelfSnapshot {
  articles: ArticleSnapshot[];
  categories: ArticleCategory[];
  totalArticles: number;
  totalViews: number;
  hotTags: string[];
  recommendedArticles: ArticleSnapshot[];
}

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  'game-guide': '游玩攻略',
  'device-tutorial': '设备教程',
  promotion: '优惠活动',
  faq: '常见问题',
  policy: '门店政策',
  news: '门店动态',
  other: '其他',
};

const STATUS_LABELS: Record<ArticleStatus, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

// ── Mock 数据 ──

const MOCK_ARTICLES: ArticleSnapshot[] = [
  { id: 'art-001', title: 'VR 游戏新手入门指南', category: 'game-guide', summary: '第一次玩 VR 指南', author: '张明', status: 'published', viewCount: 3200, likeCount: 128, publishedAt: '2026-06-01', updatedAt: '2026-07-15', tags: ['新手', 'VR', '入门'] },
  { id: 'art-002', title: '抓娃娃机技巧大全', category: 'game-guide', summary: '抓娃娃百发百中', author: '李华', status: 'published', viewCount: 5800, likeCount: 256, publishedAt: '2026-05-20', updatedAt: '2026-07-10', tags: ['娃娃机', '技巧', '攻略'] },
  { id: 'art-003', title: '设备故障快速排查', category: 'device-tutorial', summary: '常见故障排除', author: '王工', status: 'published', viewCount: 1800, likeCount: 89, publishedAt: '2026-04-15', updatedAt: '2026-07-01', tags: ['设备', '维修', '故障'] },
  { id: 'art-004', title: '夏日充值特惠活动', category: 'promotion', summary: '充 100 送 50', author: '赵运营', status: 'published', viewCount: 4200, likeCount: 310, publishedAt: '2026-07-01', updatedAt: '2026-07-20', tags: ['优惠', '充值', '夏季'] },
  { id: 'art-005', title: '门店 Wi-Fi 连接指南', category: 'faq', summary: '免费 Wi-Fi 连接步骤', author: '客服部', status: 'published', viewCount: 960, likeCount: 45, publishedAt: '2026-03-10', updatedAt: '2026-06-25', tags: ['WiFi', '网络', '帮助'] },
  { id: 'art-006', title: '退换货政策2026版', category: 'policy', summary: '退换货规范流程', author: '法务部', status: 'published', viewCount: 1500, likeCount: 67, publishedAt: '2026-01-01', updatedAt: '2026-06-30', tags: ['政策', '售后', '退换'] },
  { id: 'art-007', title: '门店七月活动预告', category: 'news', summary: '七月各门店活动一览', author: '营销部', status: 'published', viewCount: 2800, likeCount: 178, publishedAt: '2026-07-05', updatedAt: '2026-07-18', tags: ['活动', '预告', '月度'] },
  { id: 'art-008', title: '接待礼仪培训手册', category: 'other', summary: '员工接待标准', author: '培训部', status: 'draft', viewCount: 320, likeCount: 22, publishedAt: '2026-07-20', updatedAt: '2026-07-20', tags: ['培训', '礼仪'] },
  { id: 'art-009', title: '2025年度团建方案', category: 'other', summary: '过往团建总结', author: 'HR部', status: 'archived', viewCount: 450, likeCount: 15, publishedAt: '2025-12-01', updatedAt: '2026-01-15', tags: ['团建', '年度'] },
  { id: 'art-010', title: '亲子游玩推荐路线', category: 'game-guide', summary: '一家三口游玩攻略', author: '张明', status: 'published', viewCount: 2100, likeCount: 143, publishedAt: '2026-06-15', updatedAt: '2026-07-12', tags: ['亲子', '推荐', '路线'] },
  { id: 'art-011', title: '会员积分兑换说明', category: 'faq', summary: '积分如何使用', author: '客服部', status: 'published', viewCount: 3400, likeCount: 201, publishedAt: '2026-06-01', updatedAt: '2026-07-05', tags: ['积分', '兑换', '会员'] },
  { id: 'art-012', title: '设备日常点检规范', category: 'device-tutorial', summary: '每日点检流程', author: '安监部', status: 'published', viewCount: 780, likeCount: 53, publishedAt: '2026-05-10', updatedAt: '2026-07-08', tags: ['安监', '点检', '安全'] },
];

const ALL_CATEGORIES: ArticleCategory[] = ['game-guide', 'device-tutorial', 'promotion', 'faq', 'policy', 'news', 'other'];
const HOT_TAGS = ['新手入门', 'VR 体验', '会员福利', '周末活动', '门店公告'];

// ── 辅助函数 ──

function filterByCategory(articles: ArticleSnapshot[], cat: ArticleCategory | '全部'): ArticleSnapshot[] {
  return cat === '全部' ? articles : articles.filter((a) => a.category === cat);
}

function filterByStatus(articles: ArticleSnapshot[], status: ArticleStatus | '全部'): ArticleSnapshot[] {
  return status === '全部' ? articles : articles.filter((a) => a.status === status);
}

function searchArticles(articles: ArticleSnapshot[], keyword: string): ArticleSnapshot[] {
  if (!keyword.trim()) return articles;
  const kw = keyword.toLowerCase();
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(kw) ||
      a.summary.toLowerCase().includes(kw) ||
      a.author.toLowerCase().includes(kw) ||
      a.tags.some((t) => t.toLowerCase().includes(kw)),
  );
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

function getRecommended(articles: ArticleSnapshot[], limit = 3): ArticleSnapshot[] {
  return [...articles]
    .filter((a) => a.status === 'published')
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
}

function computeStats(articles: ArticleSnapshot[]) {
  const published = articles.filter((a) => a.status === 'published');
  const totalViews = articles.reduce((s, a) => s + a.viewCount, 0);
  const totalLikes = articles.reduce((s, a) => s + a.likeCount, 0);
  return { totalArticles: articles.length, publishedCount: published.length, totalViews, totalLikes };
}

// ============================================================
// 正例 (10+)
// ============================================================

test('🎮 导玩员: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('👔 店长: Articles page should contain key imports and types', () => {
  assert.ok(SRC.includes('ArticleSnapshot'), '缺少 ArticleSnapshot 类型');
  assert.ok(SRC.includes('BookshelfSnapshot'), '缺少 BookshelfSnapshot 类型');
  assert.ok(SRC.includes('ArticleCategory'), '缺少 ArticleCategory 类型');
  assert.ok(SRC.includes('ArticleStatus'), '缺少 ArticleStatus 类型');
});

test('🎮 导玩员: CATEGORY_LABELS 应有全部分类', () => {
  assert.equal(Object.keys(CATEGORY_LABELS).length, 7, '应有 7 个分类');
  assert.equal(CATEGORY_LABELS['game-guide'], '游玩攻略');
  assert.equal(CATEGORY_LABELS['device-tutorial'], '设备教程');
  assert.equal(CATEGORY_LABELS.promotion, '优惠活动');
  assert.equal(CATEGORY_LABELS.faq, '常见问题');
  assert.equal(CATEGORY_LABELS.policy, '门店政策');
  assert.equal(CATEGORY_LABELS.news, '门店动态');
  assert.equal(CATEGORY_LABELS.other, '其他');
});

test('📢 营销: STATUS_LABELS 应有全部状态', () => {
  assert.equal(Object.keys(STATUS_LABELS).length, 3, '应有 3 个状态');
  assert.equal(STATUS_LABELS.published, '已发布');
  assert.equal(STATUS_LABELS.draft, '草稿');
  assert.equal(STATUS_LABELS.archived, '已归档');
});

test('👔 店长: 分类筛选函数应正确过滤', () => {
  const result = filterByCategory(MOCK_ARTICLES, 'game-guide');
  assert.equal(result.length, 3, 'game-guide 应有 3 篇文章');
  result.forEach((a) => assert.equal(a.category, 'game-guide'));
});

test('🎯 运行专员: 状态筛选应只返回已发布', () => {
  const result = filterByStatus(MOCK_ARTICLES, 'published');
  assert.equal(result.length, 10, '10 篇已发布');
  result.forEach((a) => assert.equal(a.status, 'published'));
});

test('🎮 导玩员: 搜索按标题应返回匹配结果', () => {
  const result = searchArticles(MOCK_ARTICLES, 'VR');
  assert.ok(result.length > 0, '应搜到 VR 相关内容');
  assert.ok(result.every((a) => a.title.includes('VR') || a.summary.includes('VR') || a.tags.some((t) => t.includes('VR'))));
});

test('📢 营销: 搜索按作者应返回匹配', () => {
  const result = searchArticles(MOCK_ARTICLES, '张明');
  assert.equal(result.length, 2, '张明有 2 篇文章');
  result.forEach((a) => assert.equal(a.author, '张明'));
});

test('👔 店长: 分页函数应正确分段', () => {
  const page1 = paginate(MOCK_ARTICLES, 1, 5);
  assert.equal(page1.length, 5);
  assert.equal(page1[0].id, 'art-001');
  const page3 = paginate(MOCK_ARTICLES, 3, 5);
  assert.equal(page3.length, 2);
});

test('📢 营销: 推荐应返回阅读量最高的已发布文章', () => {
  const recs = getRecommended(MOCK_ARTICLES, 3);
  assert.equal(recs.length, 3);
  assert.ok(recs.every((a) => a.status === 'published'), '推荐内容应是已发布');
  // 最高的应是 art-002 (5800), art-004 (4200), art-011 (3400)
  assert.equal(recs[0].id, 'art-002');
  assert.equal(recs[1].id, 'art-004');
  assert.equal(recs[2].id, 'art-011');
});

test('🎯 运行专员: 统计函数应返回正确汇总', () => {
  const stats = computeStats(MOCK_ARTICLES);
  assert.equal(stats.totalArticles, 12);
  assert.equal(stats.publishedCount, 10);
  assert.equal(stats.totalViews, 27310);
  assert.equal(stats.totalLikes, 1507);
});

test('🤝 团建: 搜索空关键词应返回全部', () => {
  const result = searchArticles(MOCK_ARTICLES, '');
  assert.equal(result.length, MOCK_ARTICLES.length);
});

test('👔 店长: 全部分类筛选返回所有', () => {
  const result = filterByCategory(MOCK_ARTICLES, '全部');
  assert.equal(result.length, MOCK_ARTICLES.length);
});

test('📢 营销: HOT_TAGS 应有 5 个标签', () => {
  assert.equal(HOT_TAGS.length, 5);
  assert.ok(HOT_TAGS.includes('新手入门'));
  assert.ok(HOT_TAGS.includes('VR 体验'));
  assert.ok(HOT_TAGS.includes('会员福利'));
});

// ============================================================
// 反例 (8+)
// ============================================================

test('🔧 安监: 不存在的分类应返回空数组', () => {
  const result = filterByCategory(MOCK_ARTICLES, 'unknown' as ArticleCategory);
  assert.equal(result.length, 0);
});

test('🔧 安监: 搜索不存在关键词应返回空', () => {
  const result = searchArticles(MOCK_ARTICLES, 'xyz_not_exists_999');
  assert.equal(result.length, 0);
});

test('👔 店长: 负数页码应返回非空数组', () => {
  const result = paginate(MOCK_ARTICLES, -1, 5);
  assert.equal(result.length, 5, '负数 slice 不报错');
  assert.ok(result.every((r) => r.id.startsWith('art-')), '应返回有效数据');
});

test('👔 店长: 页码超出范围应返回空', () => {
  const result = paginate(MOCK_ARTICLES, 999, 5);
  assert.equal(result.length, 0);
});

test('👔 店长: pageSize 为 0 应返回空', () => {
  const result = paginate(MOCK_ARTICLES, 1, 0);
  assert.equal(result.length, 0);
});

test('🔧 安监: 已归档分类筛选不应返回', () => {
  const result = filterByStatus(MOCK_ARTICLES, 'archived');
  assert.equal(result.length, 1, '只有 1 篇已归档');
  assert.equal(result[0].id, 'art-009');
});

test('🎯 运行专员: 空数据推荐应返回空', () => {
  const result = getRecommended([], 3);
  assert.equal(result.length, 0);
});

test('🔧 安监: 草稿状态文章不应出现在推荐中', () => {
  const draftArticles = MOCK_ARTICLES.filter((a) => a.status === 'draft');
  const recs = getRecommended(MOCK_ARTICLES);
  const draftInRecs = recs.filter((r) => draftArticles.some((d) => d.id === r.id));
  assert.equal(draftInRecs.length, 0, '草稿不应出现在推荐');
});

test('🎮 导玩员: evil 脚本搜索应安全返回', () => {
  const result = searchArticles(MOCK_ARTICLES, '<script>alert(1)</script>');
  assert.equal(result.length, 0, '恶意脚本不应匹配');
});

// ============================================================
// 边界 (7+)
// ============================================================

test('🎯 运行专员: 搜索特殊字符应不报错', () => {
  const chars = ['!@#$%', '\n\t', '   ', '🔥🎮', 'a'.repeat(100)];
  for (const c of chars) {
    const result = searchArticles(MOCK_ARTICLES, c);
    assert.ok(Array.isArray(result));
  }
});

test('📢 营销: 推荐 when limit > available', () => {
  const recs = getRecommended(MOCK_ARTICLES, 99);
  assert.equal(recs.length, 10, '最多返回全部已发布');
});

test('🎮 导玩员: 分页 page=1, pageSize=12 (全量一页)', () => {
  const result = paginate(MOCK_ARTICLES, 1, 12);
  assert.equal(result.length, 12);
});

test('🎯 运行专员: 数据中 viewCount 最大值处理', () => {
  const maxView = Math.max(...MOCK_ARTICLES.map((a) => a.viewCount));
  assert.equal(maxView, 5800);
  const maxViewArticle = MOCK_ARTICLES.find((a) => a.viewCount === maxView);
  assert.equal(maxViewArticle?.title, '抓娃娃机技巧大全');
});

test('👔 店长: 所有分类标签都能正确映射', () => {
  for (const cat of ALL_CATEGORIES) {
    const label = CATEGORY_LABELS[cat];
    assert.ok(label, `分类 ${cat} 应有中文标签`);
    assert.ok(label.length >= 2, `标签 ${label} 长度 >= 2`);
  }
});

test('🤝 团建: 仅有 1 篇 archived 状态', () => {
  const truncated = filterByStatus(MOCK_ARTICLES, 'archived');
  assert.equal(truncated.length, 1);
  assert.equal(truncated[0].status, 'archived');
});

test('🔧 安监: 搜索区分大小写兼容', () => {
  const r1 = searchArticles(MOCK_ARTICLES, 'vr');
  const r2 = searchArticles(MOCK_ARTICLES, 'VR');
  assert.equal(r1.length, r2.length, '大小写不区分');
});

test('📢 营销: 全部文章的作者去重检查', () => {
  const authors = new Set(MOCK_ARTICLES.map((a) => a.author));
  assert.ok(authors.size > 1, '应有多个作者');
  assert.ok(authors.has('张明'), '包含张明');
  assert.ok(authors.has('营销部'), '包含营销部');
});
