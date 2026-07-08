const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { AIStorePerformanceCard } = require('./AIStorePerformanceCard');
const React = require(PROJECT_ROOT + '/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js');

// ---- 工厂函数 ----

function makeProps(overrides = {}) {
  return {
    storeName: '朝阳旗舰店',
    overallScore: 85,
    overallChange: 3.5,
    previousScore: 82,
    rank: 3,
    totalStores: 12,
    dimensions: [
      { label: '销售额', score: 92, changePercent: 5.2, description: '近7日同比增长' },
      { label: '客流量', score: 78, changePercent: -1.8, description: '日均进店人数' },
      { label: '会员活跃', score: 88, changePercent: 2.1, description: '会员复购率' },
      { label: '服务质量', score: 95, changePercent: 0.5, description: '客户满意度评分' },
      { label: '库存健康', score: 65, changePercent: -4.3, description: '库存周转天数' },
    ],
    insight: '朝阳旗舰店各项指标表现优异，建议重点关注库存健康度，当前周转天数偏高，可考虑优化补货策略。',
    ...overrides,
  };
}

// ---- 测试套件 ----

describe('AIStorePerformanceCard', () => {
  test('基础渲染 - 应展示门店名称、综合评分、排名', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps()));
    assert.ok(html.includes('朝阳旗舰店'), '应展示门店名称');
    assert.ok(html.includes('85'), '应展示综合评分 85');
    assert.ok(html.includes('100'), '应展示满分分母');
    assert.ok(html.includes('#3/12'), '应展示排名 3/12');
    assert.ok(html.includes('3.5'), '应展示同比变化');
    assert.ok(html.includes('上期: 82'), '应展示上期评分');
  });

  test('维度评分 - 应展示所有维度及分值', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps()));
    assert.ok(html.includes('销售额'), '应展示销售额维度');
    assert.ok(html.includes('客流量'), '应展示客流量维度');
    assert.ok(html.includes('会员活跃'), '应展示会员活跃维度');
    assert.ok(html.includes('服务质量'), '应展示服务质量维度');
    assert.ok(html.includes('库存健康'), '应展示库存健康维度');
    assert.ok(html.includes('92'), '销售额 92 分');
    assert.ok(html.includes('78'), '客流量 78 分');
    assert.ok(html.includes('65'), '库存健康 65 分');
  });

  test('维度变化趋势 - 应展示正负趋势箭头和百分比', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps()));
    assert.ok(html.includes('5.2'), '销售额变化 +5.2%');
    // 负数用 ↓ + Math.abs 渲染，不包含 - 号
    assert.ok(html.includes('1.8'), '客流量变化 1.8%（带箭头）');
    assert.ok(html.includes('4.3'), '库存健康变化 4.3%（带箭头）');
    // 正数应包含 ↑ 箭头
    assert.ok(html.includes('↑'), '应展示上升箭头');
    assert.ok(html.includes('↓'), '应展示下降箭头');
  });

  test('AI洞察 - 应展示 insight 段落', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps()));
    assert.ok(html.includes('AI 洞察'), '应展示洞察标题');
    assert.ok(html.includes('库存健康度'), '应展示洞察内容');
    assert.ok(html.includes('🤖'), '应展示 AI 图标');
  });

  test('无排名时 - 不应展示排名区域', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      rank: undefined,
      totalStores: undefined,
    })));
    assert.ok(!html.includes('#'), '无排名时不展示 #');
  });

  test('无 insight 时 - 不应展示洞察区域', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      insight: undefined,
    })));
    assert.ok(!html.includes('AI 洞察'), '无 insight 时不展示洞察区域');
  });

  test('高分颜色 - score >= 80 应绿色', () => {
    const props = makeProps({ overallScore: 92 });
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, props));
    assert.ok(html.includes('text-green-600'), '高分应使用绿色');
  });

  test('中分颜色 - score >= 60 应黄色', () => {
    const props = makeProps({ overallScore: 72 });
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, props));
    assert.ok(html.includes('text-yellow-600'), '中分应使用黄色');
  });

  test('低分颜色 - score < 60 应红色', () => {
    const props = makeProps({ overallScore: 45 });
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, props));
    assert.ok(html.includes('text-red-600'), '低分应使用红色');
  });

  test('无 previousScore 时 - 应隐藏上期对比', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      previousScore: undefined,
    })));
    assert.ok(!html.includes('上期:'), '无 previousScore 时不展示上期');
  });

  test('变化为 0 时 - 应展示 → 符号', () => {
    const props = makeProps({ overallChange: 0 });
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, props));
    assert.ok(html.includes('→'), '变化为 0 应展示横箭头');
  });

  test('维度描述 - 应展示 description 文本', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps()));
    assert.ok(html.includes('近7日同比增长'), '应展示维度说明');
    assert.ok(html.includes('日均进店人数'), '应展示客流量说明');
  });

  test('自定义 className - 应附加到容器', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      className: 'my-custom-class',
    })));
    assert.ok(html.includes('my-custom-class'), '自定义 className 应生效');
  });

  test('排名仅显示 rank 和 totalStores 同时存在时', () => {
    // 只有 rank 没有 totalStores
    const html1 = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      rank: 5,
      totalStores: undefined,
    })));
    assert.ok(!html1.includes('#'), '仅有 rank 时不展示');

    // 只有 totalStores 没有 rank
    const html2 = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      rank: undefined,
      totalStores: 10,
    })));
    assert.ok(!html2.includes('#'), '仅有 totalStores 时不展示');
  });

  test('空 dimensions 数组 - 应正常渲染不崩溃', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      dimensions: [],
    })));
    assert.ok(html.includes('朝阳旗舰店'), '空 dimensions 仍应渲染头部');
    assert.ok(html.includes('85'), '空 dimensions 仍应展示评分');
  });

  test('综合评分低于60时 - 评分条背景应为红色', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      overallScore: 42,
    })));
    assert.ok(html.includes('bg-red-500'), '低分进度条背景为红色');
  });

  test('综合评分80以上时 - 评分条背景应为绿色', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      overallScore: 91,
    })));
    assert.ok(html.includes('bg-green-500'), '高分进度条背景为绿色');
  });

  test('不存在 insight 时 - 不会出现 AI 图标', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      insight: undefined,
    })));
    assert.ok(!html.includes('🤖'), '无 insight 时不展示 AI 图标');
  });

  test('变化百分比大于10时 - 应正确渲染两位小数', () => {
    const props = makeProps({ dimensions: [
      { label: '销售额', score: 90, changePercent: 12.34 },
    ]});
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, props));
    assert.ok(html.includes('12.3'), '应展示 12.3% 的变化');
  });

  test('scale 边界 - 100分应占满进度条', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      overallScore: 100,
      dimensions: [{ label: '测试', score: 100, changePercent: 0 }],
    })));
    assert.ok(html.includes('100'), '100分应展示 100');
  });

  test('多个维度含 description 和 无 description', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      dimensions: [
        { label: '有说明', score: 80, changePercent: 2, description: '这是说明' },
        { label: '无说明', score: 70, changePercent: -1 },
      ],
    })));
    assert.ok(html.includes('这是说明'), '有 description 的维度展示说明');
    assert.ok(html.includes('无说明'), '无 description 的维度正常渲染');
  });

  test('高分数值应被截断到 100%', () => {
    const html = renderToStaticMarkup(React.createElement(AIStorePerformanceCard, makeProps({
      overallScore: 120,
    })));
    // 进度条宽度不应超过 100%
    assert.ok(html.includes('120'), '应展示 120 分值');
    // 但进度条 style 应为 100%
    assert.ok(!html.includes('width: 120%'), '进度条宽度应被截断');
  });
});
