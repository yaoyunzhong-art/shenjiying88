/**
 * recommendations/page.test.tsx — AI 智能推荐页 L1 静态结构测试
 *
 * 测试覆盖:
 * - 默认导出 & 文件结构
 * - 核心常量 & 数据完整性
 * - AI 推荐卡片字段覆盖
 * - 搜索/筛选/分页逻辑
 * - 空状态边界处理
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const PAGE_PATH = path.join(__dirname, 'page.tsx');
const pageSource = fs.readFileSync(PAGE_PATH, 'utf-8');

describe('RecommendationsPage — 结构验证', () => {

  test('页面文件存在', () => {
    assert.ok(fs.existsSync(PAGE_PATH));
  });

  test('导出一个默认函数组件 RecommendationsPage', () => {
    assert.match(pageSource, /export default function RecommendationsPage/);
    assert.match(pageSource, /'use client'/);
  });

  test('引用 AI 组件: AISummaryCard', () => {
    assert.ok(pageSource.includes('AISummaryCard'));
  });

  test('引用 UI 组件: PageShell, Pagination, SearchFilterInput, Rating, EmptyState, Card, Tag', () => {
    assert.ok(pageSource.includes('PageShell'));
    assert.ok(pageSource.includes('Pagination'));
    assert.ok(pageSource.includes('SearchFilterInput'));
    assert.ok(pageSource.includes('Rating'));
    assert.ok(pageSource.includes('EmptyState'));
    assert.ok(pageSource.includes('Card'));
    assert.ok(pageSource.includes('Tag'));
  });

  test('包含 mock 数据类型 AIRecommendation', () => {
    assert.ok(pageSource.includes('interface AIRecommendation'));
    assert.ok(pageSource.includes('productName'));
    assert.ok(pageSource.includes('predictedScore'));
    assert.ok(pageSource.includes('matchReason'));
    assert.ok(pageSource.includes('confidence'));
    assert.ok(pageSource.includes('tags'));
    assert.ok(pageSource.includes('status'));
  });

  test('mock 数据 ≥ 12 条', () => {
    const match12 = pageSource.match(/{ id: 'r12'/);
    assert.ok(match12, '应该至少有 12 条 mock 数据');
  });

  test('状态标签定义完整: recommended/applied/dismissed', () => {
    assert.ok(pageSource.includes("'recommended'"));
    assert.ok(pageSource.includes("'applied'"));
    assert.ok(pageSource.includes("'dismissed'"));
  });

  test('分类 + 状态过滤条件存在', () => {
    assert.ok(pageSource.includes('categoryFilter'));
    assert.ok(pageSource.includes('statusFilter'));
  });

  test('usePagination 分页逻辑', () => {
    assert.ok(pageSource.includes('usePagination'));
    assert.ok(pageSource.includes('PAGE_SIZE'));
    assert.ok(pageSource.includes('paginate'));
    assert.ok(pageSource.includes('totalPages'));
  });

  test('空状态处理: EmptyState + 暂无匹配推荐', () => {
    assert.ok(pageSource.includes('EmptyState'));
    assert.ok(pageSource.includes('暂无匹配推荐'));
  });

  test('AISummaryCard 统计指标: 待处理推荐/已采纳/平均推荐分/推荐转化率', () => {
    assert.ok(pageSource.includes('summaryMetrics'));
    assert.ok(pageSource.includes('待处理推荐'));
    assert.ok(pageSource.includes('已采纳'));
    assert.ok(pageSource.includes('平均推荐分'));
    assert.ok(pageSource.includes('推荐转化率'));
  });

  test('AISummaryCard summary 和 insights 字段', () => {
    assert.ok(pageSource.includes('summary='));
    assert.ok(pageSource.includes('insights'));
    assert.ok(pageSource.includes('推荐采纳率'));
  });

  test('推荐卡片包含价格字段', () => {
    assert.ok(pageSource.includes("price"));
  });

  test('置信度进度条渲染: barTrack / barFill / 配色', () => {
    assert.ok(pageSource.includes('barTrack'));
    assert.ok(pageSource.includes('barFill'));
    assert.ok(pageSource.includes('4ade80'));
    assert.ok(pageSource.includes('facc15'));
    assert.ok(pageSource.includes('f87171'));
  });

  test('过滤结果 = 0 时显示分页不渲染', () => {
    // 空状态时不渲染 pagination
    const emptyIndex = pageSource.indexOf('EmptyState');
    const pagAfterEmpty = pageSource.indexOf('Pagination', emptyIndex);
    // Pagination 仅在 totalPages > 1 时渲染
    assert.ok(pageSource.includes('totalPages > 1 &&'));
  });

  test('mock 数据覆盖所有 category 种类', () => {
    const cats = ['咖啡', '器具', '配件', '饮品', '图书', '订阅'];
    for (const c of cats) {
      assert.ok(pageSource.includes(c), `category "${c}" should exist`);
    }
  });

  test('推荐卡片使用 Tag + Rating 组件', () => {
    assert.ok(pageSource.includes('<Tag'));
    assert.ok(pageSource.includes('<Rating'));
  });

  test('STATUS_LABELS 包含中文状态名称', () => {
    assert.ok(pageSource.includes('待处理'));
    assert.ok(pageSource.includes('已采纳'));
    assert.ok(pageSource.includes('已忽略'));
  });

  test('STATUS_COLORS 配色完整', () => {
    assert.ok(pageSource.includes('recommended'));
    assert.ok(pageSource.includes('applied'));
    assert.ok(pageSource.includes('dismissed'));
    assert.ok(pageSource.includes('info'));
    assert.ok(pageSource.includes('success'));
    assert.ok(pageSource.includes('default'));
  });

  test('包含置信度级别判断逻辑 (>0.8 green, >0.6 yellow)', () => {
    assert.ok(pageSource.includes('> 0.8'));
    assert.ok(pageSource.includes('> 0.6'));
  });

  test('AISummaryCard 使用 @m5/ui 的 AISummaryCardProps 类型', () => {
    assert.ok(pageSource.includes('AISummaryCardProps'));
  });
});
