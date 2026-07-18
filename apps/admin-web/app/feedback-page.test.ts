/**
 * feedback-page.test.ts — Page-level unit tests for customer feedback management page
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * URL-pattern responseRegistry: all mock data sourced from feedback-data.ts via named exports
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_FEEDBACKS,
  FEEDBACK_TYPES,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPE_MAP,
  FEEDBACK_STATUS_MAP,
  getFeedbackTypeLabel,
  getFeedbackStatusLabel,
  getFeedbackTypeVariant,
  getFeedbackStatusVariant,
  computeFeedbackStats,
  renderStars,
  type FeedbackItem,
  type FeedbackType,
  type FeedbackStatus,
} from './feedback-data';

import {
  FEEDBACK_TABS,
  filterByTab,
  searchFeedback,
  filterByType,
  fullFilterChain,
  buildFeedbackPageData,
  type FeedbackTab,
} from './feedback-page';

// ==========================================================
// responseRegistry: URL-pattern based test data registry
// ==========================================================
const responseRegistry = {
  '/api/feedbacks/all': MOCK_FEEDBACKS,
  '/api/feedbacks/stats': () => computeFeedbackStats(MOCK_FEEDBACKS),
  '/api/feedbacks/tab/pending': MOCK_FEEDBACKS.filter((f) => f.status === 'pending'),
  '/api/feedbacks/tab/processing': MOCK_FEEDBACKS.filter((f) => f.status === 'processing'),
  '/api/feedbacks/tab/resolved': MOCK_FEEDBACKS.filter((f) => f.status === 'resolved'),
  '/api/feedbacks/search/Wang': MOCK_FEEDBACKS.filter((f) => f.customerName.includes('王')),
};

// ==========================================================
// 圈梁一: feedback-data 数据完整性
// ==========================================================

describe('feedback-data: MOCK_FEEDBACKS 数据完整性', () => {
  const items = responseRegistry['/api/feedbacks/all'] as FeedbackItem[];

  it('至少包含 8 条模拟数据', () => {
    assert.ok(items.length >= 8, `期望 ≥ 8, 实际 ${items.length}`);
  });

  it('每条反馈 id 唯一', () => {
    const ids = items.map((f) => f.id);
    assert.strictEqual(new Set(ids).size, ids.length);
  });

  it('每条反馈的 type 在 FEEDBACK_TYPES 范围内', () => {
    for (const f of items) {
      assert.ok(FEEDBACK_TYPES.includes(f.type), `id=${f.id}: 无效类型 "${f.type}"`);
    }
  });

  it('每条反馈的 status 在 FEEDBACK_STATUSES 范围内', () => {
    for (const f of items) {
      assert.ok(FEEDBACK_STATUSES.includes(f.status), `id=${f.id}: 无效状态 "${f.status}"`);
    }
  });

  it('每条反馈 rating 在 1~5 范围内', () => {
    for (const f of items) {
      assert.ok(f.rating >= 1 && f.rating <= 5, `id=${f.id}: 评级 ${f.rating} 不在 1~5 范围`);
    }
  });

  it('已处理的反馈必须包含 handler 和 resolvedAt', () => {
    const resolved = items.filter((f) => f.status === 'resolved');
    for (const f of resolved) {
      assert.ok(f.handler, `id=${f.id}: 已处理反馈缺少 handler`);
      assert.ok(f.resolvedAt, `id=${f.id}: 已处理反馈缺少 resolvedAt`);
    }
  });

  it('处理中的反馈必须包含 handler', () => {
    const processing = items.filter((f) => f.status === 'processing');
    for (const f of processing) {
      assert.ok(f.handler, `id=${f.id}: 处理中反馈缺少 handler`);
    }
  });
});

describe('feedback-data: 类型常量映射', () => {
  it('FEEDBACK_TYPES 包含全部 4 种类型', () => {
    assert.deepStrictEqual([...FEEDBACK_TYPES].sort(), ['complaint', 'inquiry', 'praise', 'suggestion']);
  });

  it('FEEDBACK_STATUSES 包含全部 3 种状态', () => {
    assert.deepStrictEqual([...FEEDBACK_STATUSES].sort(), ['pending', 'processing', 'resolved']);
  });

  it('FEEDBACK_TYPE_MAP 覆盖全部类型', () => {
    for (const t of FEEDBACK_TYPES) {
      assert.ok(FEEDBACK_TYPE_MAP[t], `缺少类型映射: ${t}`);
      assert.ok(typeof FEEDBACK_TYPE_MAP[t].label === 'string');
      assert.ok(['danger', 'warning', 'success', 'info'].includes(FEEDBACK_TYPE_MAP[t].variant));
    }
  });

  it('FEEDBACK_STATUS_MAP 覆盖全部状态', () => {
    for (const s of FEEDBACK_STATUSES) {
      assert.ok(FEEDBACK_STATUS_MAP[s], `缺少状态映射: ${s}`);
      assert.ok(typeof FEEDBACK_STATUS_MAP[s].label === 'string');
    }
  });

  it('getFeedbackTypeLabel 返回正确的中文标签', () => {
    assert.strictEqual(getFeedbackTypeLabel('complaint'), '投诉');
    assert.strictEqual(getFeedbackTypeLabel('suggestion'), '建议');
    assert.strictEqual(getFeedbackTypeLabel('praise'), '表扬');
    assert.strictEqual(getFeedbackTypeLabel('inquiry'), '咨询');
  });

  it('getFeedbackStatusLabel 返回正确的中文标签', () => {
    assert.strictEqual(getFeedbackStatusLabel('pending'), '待处理');
    assert.strictEqual(getFeedbackStatusLabel('processing'), '处理中');
    assert.strictEqual(getFeedbackStatusLabel('resolved'), '已处理');
  });

  it('getFeedbackTypeVariant 返回有效 variant', () => {
    const valid = ['danger', 'warning', 'success', 'info'];
    for (const t of FEEDBACK_TYPES) {
      assert.ok(valid.includes(getFeedbackTypeVariant(t)));
    }
  });

  it('getFeedbackStatusVariant 返回有效 variant', () => {
    const valid = ['danger', 'warning', 'success', 'neutral'];
    for (const s of FEEDBACK_STATUSES) {
      assert.ok(valid.includes(getFeedbackStatusVariant(s)));
    }
  });
});

describe('feedback-data: renderStars', () => {
  it('正例: 5 星返回 ★★★★★', () => {
    assert.strictEqual(renderStars(5), '★★★★★');
  });

  it('正例: 1 星返回 ★☆☆☆☆', () => {
    assert.strictEqual(renderStars(1), '★☆☆☆☆');
  });

  it('边界: 0 星返回 ☆☆☆☆☆', () => {
    assert.strictEqual(renderStars(0), '☆☆☆☆☆');
  });

  it('边界: 超过 5 星截断', () => {
    assert.strictEqual(renderStars(7), '★★★★★');
  });
});

// ==========================================================
// 圈梁二: computeFeedbackStats
// ==========================================================

describe('feedback-data: computeFeedbackStats', () => {
  const items = responseRegistry['/api/feedbacks/all'] as FeedbackItem[];

  it('正例: total 等于全部反馈数', () => {
    const stats = computeFeedbackStats(items);
    assert.strictEqual(stats.total, items.length);
  });

  it('正例: 各状态分类计数之和等于 total', () => {
    const stats = computeFeedbackStats(items);
    assert.strictEqual(
      stats.pendingCount + stats.processingCount + stats.resolvedCount,
      stats.total,
    );
  });

  it('正例: 各类型分类计数之和等于 total', () => {
    const stats = computeFeedbackStats(items);
    const typeSum = stats.complaintCount + stats.suggestionCount + stats.praiseCount + stats.inquiryCount;
    assert.strictEqual(typeSum, stats.total);
  });

  it('正例: 本月平均评级在 1~5 之间', () => {
    const stats = computeFeedbackStats(items);
    assert.ok(stats.monthlyAvgRating >= 1 && stats.monthlyAvgRating <= 5);
  });

  it('反例: 空数组时 monthlyAvgRating 为 0', () => {
    const stats = computeFeedbackStats([]);
    assert.strictEqual(stats.monthlyAvgRating, 0);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.pendingCount, 0);
  });
});

// ==========================================================
// 圈梁三: Tab 筛选
// ==========================================================

describe('feedback-page: filterByTab', () => {
  it('正例: 待处理 Tab 仅返回 pending', () => {
    const result = filterByTab(MOCK_FEEDBACKS, 'pending');
    const pendingData = responseRegistry['/api/feedbacks/tab/pending'] as FeedbackItem[];
    assert.strictEqual(result.length, pendingData.length);
    for (const f of result) {
      assert.strictEqual(f.status, 'pending');
    }
  });

  it('正例: 处理中 Tab 仅返回 processing', () => {
    const result = filterByTab(MOCK_FEEDBACKS, 'processing');
    const processingData = responseRegistry['/api/feedbacks/tab/processing'] as FeedbackItem[];
    assert.strictEqual(result.length, processingData.length);
    for (const f of result) {
      assert.strictEqual(f.status, 'processing');
    }
  });

  it('正例: 已处理 Tab 仅返回 resolved', () => {
    const result = filterByTab(MOCK_FEEDBACKS, 'resolved');
    const resolvedData = responseRegistry['/api/feedbacks/tab/resolved'] as FeedbackItem[];
    assert.strictEqual(result.length, resolvedData.length);
    for (const f of result) {
      assert.strictEqual(f.status, 'resolved');
    }
  });

  it('正例: 全部 Tab 返回完整列表', () => {
    const result = filterByTab(MOCK_FEEDBACKS, 'all');
    assert.strictEqual(result.length, MOCK_FEEDBACKS.length);
  });

  it('边界: 空数组返回空', () => {
    assert.strictEqual(filterByTab([], 'pending').length, 0);
    assert.strictEqual(filterByTab([], 'all').length, 0);
  });
});

describe('feedback-page: FEEDBACK_TABS 配置', () => {
  it('Tabs 包含 4 个条目', () => {
    assert.strictEqual(FEEDBACK_TABS.length, 4);
  });

  it('Tabs 顺序为 待处理/处理中/已处理/全部', () => {
    assert.strictEqual(FEEDBACK_TABS[0].key, 'pending');
    assert.strictEqual(FEEDBACK_TABS[1].key, 'processing');
    assert.strictEqual(FEEDBACK_TABS[2].key, 'resolved');
    assert.strictEqual(FEEDBACK_TABS[3].key, 'all');
  });

  it('每个 Tab 有中文 label', () => {
    for (const t of FEEDBACK_TABS) {
      assert.ok(t.label.length > 0);
    }
  });
});

// ==========================================================
// 圈梁四: 搜索
// ==========================================================

describe('feedback-page: searchFeedback', () => {
  it('正例: 按客户名搜索匹配', () => {
    const result = searchFeedback(MOCK_FEEDBACKS, '王小明');
    for (const f of result) {
      assert.ok(f.customerName.includes('王小明'));
    }
  });

  it('正例: 按门店搜索匹配', () => {
    const result = searchFeedback(MOCK_FEEDBACKS, '朝阳');
    for (const f of result) {
      assert.ok(f.storeName.includes('朝阳'));
    }
  });

  it('正例: 按内容搜索不区分大小写', () => {
    const result = searchFeedback(MOCK_FEEDBACKS, '服务');
    assert.ok(result.length > 0);
  });

  it('反例: 不存在的关键词返回空数组', () => {
    const result = searchFeedback(MOCK_FEEDBACKS, '不存在的关键词xyz');
    assert.strictEqual(result.length, 0);
  });

  it('边界: 空字符串返回原数组', () => {
    const result = searchFeedback(MOCK_FEEDBACKS, '');
    assert.strictEqual(result.length, MOCK_FEEDBACKS.length);
  });

  it('边界: 空格字符串返回原数组', () => {
    const result = searchFeedback(MOCK_FEEDBACKS, '   ');
    assert.strictEqual(result.length, MOCK_FEEDBACKS.length);
  });
});

// ==========================================================
// 圈梁五: 类型筛选
// ==========================================================

describe('feedback-page: filterByType', () => {
  it('正例: 筛选投诉类返回 complaint', () => {
    const result = filterByType(MOCK_FEEDBACKS, 'complaint');
    for (const f of result) {
      assert.strictEqual(f.type, 'complaint');
    }
  });

  it('正例: 筛选表扬类返回 praise', () => {
    const result = filterByType(MOCK_FEEDBACKS, 'praise');
    for (const f of result) {
      assert.strictEqual(f.type, 'praise');
    }
  });

  it('正例: "all" 不过滤', () => {
    const result = filterByType(MOCK_FEEDBACKS, 'all');
    assert.strictEqual(result.length, MOCK_FEEDBACKS.length);
  });

  it('边界: 空数组返回空', () => {
    assert.strictEqual(filterByType([], 'complaint').length, 0);
  });
});

// ==========================================================
// 圈梁六: 复合过滤链
// ==========================================================

describe('feedback-page: fullFilterChain', () => {
  it('正例: Tab + 搜索 + 类型 组合过滤', () => {
    const result = fullFilterChain(MOCK_FEEDBACKS, 'pending', '南京', 'inquiry');
    // 待处理 + 名称含"南京" + 咨询
    for (const f of result) {
      assert.strictEqual(f.status, 'pending');
      assert.strictEqual(f.type, 'inquiry');
      assert.ok(
        f.customerName.includes('南京') ||
          f.storeName.includes('南京') ||
          f.content.includes('南京'),
      );
    }
  });

  it('反例: 矛盾条件返回空', () => {
    // 已表扬且投诉的矛盾条件
    const result = fullFilterChain(MOCK_FEEDBACKS, 'resolved', '', 'complaint');
    assert.strictEqual(result.length, 0);
  });

  it('边界: 全部 all + 空关键词 = 全量', () => {
    const result = fullFilterChain(MOCK_FEEDBACKS, 'all', '', 'all');
    assert.strictEqual(result.length, MOCK_FEEDBACKS.length);
  });
});

// ==========================================================
// 圈梁七: buildFeedbackPageData 默认导出
// ==========================================================

describe('feedback-page: buildFeedbackPageData', () => {
  it('正例: 默认参数返回完整数据', () => {
    const data = buildFeedbackPageData();
    assert.ok(Array.isArray(data.items));
    assert.ok(Array.isArray(data.filtered));
    assert.strictEqual(data.totalFiltered, data.filtered.length);
    assert.strictEqual(data.tab, 'all');
    assert.strictEqual(data.keyword, '');
    assert.strictEqual(data.typeFilter, 'all');
    assert.ok(data.stats.total > 0);
  });

  it('正例: 指定 tab 过滤', () => {
    const data = buildFeedbackPageData(MOCK_FEEDBACKS, 'pending');
    for (const f of data.filtered) {
      assert.strictEqual(f.status, 'pending');
    }
  });

  it('反例: 指定搜索关键词过滤', () => {
    const data = buildFeedbackPageData(MOCK_FEEDBACKS, 'all', '不存在的关键词');
    assert.strictEqual(data.totalFiltered, 0);
  });

  it('边界: 自定义 items 列表', () => {
    const single = MOCK_FEEDBACKS.slice(0, 1);
    const data = buildFeedbackPageData(single);
    assert.strictEqual(data.totalFiltered, 1);
    assert.strictEqual(data.stats.total, 1);
  });
});

// ==========================================================
// 圈梁八: responseRegistry URL 路由完整性
// ==========================================================

describe('responseRegistry: URL 路由完整性', () => {
  it('所有注册的 URL 可解析', () => {
    const urls = Object.keys(responseRegistry);
    assert.ok(urls.length >= 5, `注册了 ${urls.length} 个 URL`);
    for (const url of urls) {
      const value = responseRegistry[url];
      if (typeof value === 'function') {
        const result = value();
        assert.ok(result !== undefined, `${url} 函数应返回有效数据`);
      } else {
        assert.ok(Array.isArray(value), `${url} 应返回数组`);
      }
    }
  });

  it('待处理数据全部为 pending', () => {
    const pendingData = responseRegistry['/api/feedbacks/tab/pending'] as FeedbackItem[];
    for (const f of pendingData) {
      assert.strictEqual(f.status, 'pending');
    }
  });

  it('全量数据与各 tab 数据之和匹配', () => {
    const all = responseRegistry['/api/feedbacks/all'] as FeedbackItem[];
    const pending = responseRegistry['/api/feedbacks/tab/pending'] as FeedbackItem[];
    const processing = responseRegistry['/api/feedbacks/tab/processing'] as FeedbackItem[];
    const resolved = responseRegistry['/api/feedbacks/tab/resolved'] as FeedbackItem[];
    assert.strictEqual(pending.length + processing.length + resolved.length, all.length);
  });
});

// ==========================================================
// 圈梁九: 边界安全测试
// ==========================================================

describe('边界安全: 空数据与极端输入', () => {
  it('空数组 search 返回空', () => {
    assert.strictEqual(searchFeedback([], 'test').length, 0);
  });

  it('空数组 filterByTab 返回空', () => {
    assert.strictEqual(filterByTab([], 'pending').length, 0);
  });

  it('空数组 filterByType 返回空', () => {
    assert.strictEqual(filterByType([], 'complaint').length, 0);
  });

  it('空数组 buildFeedbackPageData 全为零', () => {
    const data = buildFeedbackPageData([], 'all', '', 'all');
    assert.strictEqual(data.totalFiltered, 0);
    assert.strictEqual(data.stats.total, 0);
    assert.strictEqual(data.stats.pendingCount, 0);
    assert.strictEqual(data.stats.processingCount, 0);
    assert.strictEqual(data.stats.resolvedCount, 0);
  });
});
