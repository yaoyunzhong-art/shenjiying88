/**
 * help-center/page.test.ts — 帮助中心页 L1 JMeter 风格测试
 *
 * 覆盖:
 *   正例 — 页面导出、Metadata、Suspense/ErrorBoundary、HelpCenterClient、分类配置、文章数据引用
 *   反例 — console.log、硬编码 token、== 比较、空函数、DOM 操作
 *   边界 — JSON-LD、加载/错误/搜索无结果三态、联系支持、数据层边界分析
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const DATA_SOURCE = resolve(__dirname, 'help-center-data.ts');

// ---- 正例 (页面源码分析) ----

test('[正例] 应导出默认帮助中心页面组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export default function HelpCenterPage'), '缺少 HelpCenterPage 默认导出');
});

test('[正例] 页面应包含 Metadata 导出', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export const metadata'), '缺少 metadata 导出');
  assert.ok(src.includes('title'), '缺少 title');
  assert.ok(src.includes('description'), '缺少 description');
});

test('[正例] 页面应包含 openGraph 元数据', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('openGraph'), '缺少 openGraph');
});

test('[正例] 页面应包含 Suspense 懒加载', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('Suspense'), '缺少 Suspense');
});

test('[正例] 页面应包含 ErrorBoundary 错误边界', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ErrorBoundary'), '缺少 ErrorBoundary');
});

test('[正例] 页面应包含 HelpCenterClient 客户端组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('HelpCenterClient'), '缺少 HelpCenterClient');
});

test('[正例] 页面应引用 getHelpArticles 数据函数', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('getHelpArticles'), '缺少 getHelpArticles');
});

test('[正例] 页面应包含 HELP_CATEGORIES 分类配置', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('HELP_CATEGORIES'), '缺少 HELP_CATEGORIES');
});

test('[正例] 页面分类应包含所有核心入口', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const categories = ['入门指南', '门店运营', '设备维护', '财务管理', 'AI 功能', '故障排查'];
  const found = categories.filter((c) => src.includes(c));
  assert.ok(found.length >= 4, `至少包含 4 个分类, 实际: ${found.length}`);
});

test('[正例] 页面应有 LoadingFallback 加载占位', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('HelpCenterLoadingFallback'), '缺少 HelpCenterLoadingFallback');
  assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
});

test('[正例] 页面应有 ErrorFallback 错误回退', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('HelpCenterErrorFallback'), '缺少 HelpCenterErrorFallback');
  assert.ok(src.includes('帮助文档加载异常'), '缺少错误提示文字');
});

test('[正例] 页面应有搜索无结果空状态', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('SearchNoResultsState'), '缺少 SearchNoResultsState');
  assert.ok(src.includes('未找到相关文档'), '缺少搜索无结果提示');
});

test('[正例] 页面应有文章总数统计', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('articleCount'), '缺少 articleCount');
  assert.ok(src.includes('总计'), '缺少总计显示');
});

test('[正例] 页面应有最后更新日期', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('最后更新'), '缺少最后更新日期');
});

test('[正例] 页面应有联系支持区域', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('没有找到答案'), '缺少联系支持引导');
  assert.ok(src.includes('在线客服'), '缺少在线客服信息');
});

// ---- 反例 ----

test('[反例] 不应包含 console.log 调试残留', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const codeLines = src.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  const hasConsoleLog = codeLines.some((l) => /console\.(log|warn|error|debug)\s*\(/.test(l));
  assert.ok(!hasConsoleLog, '不应有 console 调试残留');
});

test('[反例] 不应包含硬编码 API Token', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const secrets = [/api[_-]?key\s*[:=]\s*['"][^'"]{16,}['"]/i, /secret\s*[:=]\s*['"][^'"]{8,}['"]/i];
  for (const pat of secrets) {
    assert.ok(!pat.test(src), `不应包含硬编码秘钥: ${pat}`);
  }
});

test('[反例] 不应使用 == 宽松比较', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const loose = /(?:status|type|count)\s*==\s*['"]?\w+/;
  assert.ok(!loose.test(src), '应使用 ===');
});

test('[反例] 不应有直接全局 DOM 操作', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(!src.includes('document.'), '不应操作 document');
  assert.ok(!src.includes('window.'), '不应操作 window');
});

test('[反例] 不应有空白或未实现的函数体', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const emptyFuncs = src.match(/function\s+\w+\s*\(\s*\)\s*\{\s*\}/g);
  assert.ok(!emptyFuncs || emptyFuncs.length === 0, '不应有空函数');
});

// ---- 边界 ----

test('[边界] 页面源码应大于 4KB', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.length > 4096, `源码长度不足, 实际 ${src.length} bytes`);
});

test('[边界] 页面应有 JSON-LD 结构化数据', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ld+json'), '缺少 ld+json');
  assert.ok(src.includes('WebApplication'), '缺少 schema');
});

test('[边界] 页面应有加载/错误/空三种状态组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('HelpCenterLoadingFallback'), '缺少加载组件');
  assert.ok(src.includes('HelpCenterErrorFallback'), '缺少错误组件');
  assert.ok(src.includes('SearchNoResultsState'), '缺少空结果组件');
});

test('[边界] 页面分类应显示文章数徽标', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('count'), '分类应显示文章数');
});

test('[边界] 搜索无结果时应有浏览全部文档链接', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('浏览全部文档'), '缺少浏览全部链接');
});

test('[边界] 错误回退应有重试链接', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('href="/help-center"'), '应有重试链接');
});

test('[边界] 分类标签应有 hover 过渡效果', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('transition'), '应有过渡效果');
});

// ---- 数据层测试 (readFileSync 源码分析) ----

test('[数据层] help-center-data 应导出 getHelpArticles', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function getHelpArticles'), '缺少 getHelpArticles 导出');
});

test('[数据层] help-center-data 应导出 getHelpFaqs', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function getHelpFaqs'), '缺少 getHelpFaqs 导出');
});

test('[数据层] help-center-data 应导出 HELP_CATEGORIES', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export const HELP_CATEGORIES'), '缺少 HELP_CATEGORIES 导出');
});

test('[数据层] help-center-data 应导出 getCategoryName', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function getCategoryName'), '缺少 getCategoryName 导出');
});

test('[数据层] help-center-data 应导出 searchArticles', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function searchArticles'), '缺少 searchArticles 导出');
});

test('[数据层] help-center-data 应导出 computeArticleStats', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function computeArticleStats'), '缺少 computeArticleStats 导出');
});

test('[数据层] help-center-data 应导出 filterArticlesByCategory', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function filterArticlesByCategory'), '缺少 filterArticlesByCategory');
});

test('[数据层] help-center-data 应导出 getPopularFaqs', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function getPopularFaqs'), '缺少 getPopularFaqs');
});

test('[数据层] help-center-data 应定义 HelpArticle 接口', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export interface HelpArticle'), '缺少 HelpArticle 接口');
});

test('[数据层] help-center-data 应定义 HelpCategory 接口', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export interface HelpCategory'), '缺少 HelpCategory 接口');
});

test('[数据层] help-center-data 应定义 HelpFaqItem 接口', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export interface HelpFaqItem'), '缺少 HelpFaqItem 接口');
});

test('[数据层] help-center-data 应有 9 个分类 articleCount 配置', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  const counts = src.match(/articleCount:\s*\d+/g);
  assert.ok(counts, '缺少 articleCount 字段');
  assert.equal(counts.length, 9, `应有 9 个分类, 实际 ${counts.length}`);
});

test('[数据层] help-center-data 应包含 18 条文章 mock', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  const articles = src.match(/id:\s*'a\d{3}'/g);
  assert.ok(articles, '缺少文章 id');
  assert.equal(articles.length, 18, `应有 18 篇文章, 实际 ${articles.length}`);
});

test('[数据层] help-center-data 应包含 10 条 FAQ', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  const faqs = src.match(/id:\s*'f\d{3}'/g);
  assert.ok(faqs, '缺少 FAQ id');
  assert.equal(faqs.length, 10, `应有 10 条 FAQ, 实际 ${faqs.length}`);
});

test('[数据层] HELP_CATEGORIES 应有 id/name/icon/description/order 字段', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('id:'), '缺少 id');
  assert.ok(src.includes('name:'), '缺少 name');
  assert.ok(src.includes('icon:'), '缺少 icon');
  assert.ok(src.includes('description:'), '缺少 description');
  assert.ok(src.includes('order:'), '缺少 order');
});
