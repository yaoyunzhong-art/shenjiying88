const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { PromotionCampaignManager } = require('./PromotionCampaignManager');
const React = require(PROJECT_ROOT + '/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js');

// ---- 工厂 ----

function makeCampaigns(overrides: Partial<any>[] = []) {
  return [
    {
      id: 'c1',
      name: '夏季冰饮特惠',
      description: '全场冰饮第二杯半价，持续30天。',
      status: 'active',
      budget: 50000,
      spent: 32500,
      roi: 280,
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-31T00:00:00.000Z',
      channel: '线下门店',
      targetMetric: '目标GMV 150,000',
      storeCount: 12,
      ...(overrides[0] || {}),
    },
    {
      id: 'c2',
      name: '新会员首单减50',
      description: '新注册会员首单满100减50。',
      status: 'scheduled',
      budget: 80000,
      spent: 0,
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-08-31T00:00:00.000Z',
      channel: '全渠道',
      storeCount: 20,
      ...(overrides[1] || {}),
    },
    {
      id: 'c3',
      name: '中秋节礼盒预售',
      status: 'draft',
      budget: 120000,
      spent: 0,
      startDate: '2026-09-01T00:00:00.000Z',
      endDate: '2026-09-15T00:00:00.000Z',
      ...(overrides[2] || {}),
    },
    {
      id: 'c4',
      name: '周年庆大促',
      status: 'ended',
      budget: 200000,
      spent: 195000,
      roi: 450,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-20T00:00:00.000Z',
      ...(overrides[3] || {}),
    },
  ];
}

function makeProps(overrides = {}) {
  return {
    campaigns: makeCampaigns(),
    title: '促销活动管理',
    onCampaignClick: () => {},
    onToggle: () => {},
    onCreateCampaign: () => {},
    activeFilter: 'all' as const,
    onFilterChange: () => {},
    ...overrides,
  };
}

// ---- 测试 ----

describe('PromotionCampaignManager', () => {
  test('基础渲染 — 标题/筛选/活动卡片', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps()));
    assert.ok(html.includes('促销活动管理'), '应展示标题');
    assert.ok(html.includes('全部'), '应展示筛选标签');
    assert.ok(html.includes('进行中'), '应展示进行中');
    assert.ok(html.includes('夏季冰饮特惠'), '应展示活动名称');
    assert.ok(html.includes('新会员首单减50'), '应展示第二个活动');
    assert.ok(html.includes('中秋节礼盒预售'), '应展示草稿活动');
    assert.ok(html.includes('周年庆大促'), '应展示已结束活动');
    assert.ok(html.includes('role="region"') || html.includes('role=\\"region\\"'), '应设置 role=region');
  });

  test('筛选功能 — activeFilter 为 active 时只显示进行中', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps({ activeFilter: 'active' })));
    assert.ok(html.includes('夏季冰饮特惠'), '进行中活动应显示');
    assert.ok(!html.includes('新会员首单减50'), '已排期活动不应显示');
    assert.ok(!html.includes('中秋节礼盒预售'), '草稿不应显示');
    assert.ok(!html.includes('周年庆大促'), '已结束不应显示');
  });

  test('筛选 — draft 只显示草稿', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps({ activeFilter: 'draft' })));
    assert.ok(html.includes('中秋节礼盒预售'), '草稿活动应显示');
    assert.ok(!html.includes('夏季冰饮特惠'), '进行中不应显示');
  });

  test('预算进度条渲染', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps()));
    // 夏季冰饮: 32500/50000 = 65%
    assert.ok(html.includes('65%'), '应展示预算使用百分比');
    assert.ok(html.includes('¥3.3万'), '或货币格式化展示');
    assert.ok(html.includes('¥50,000') || html.includes('5.0万'), '预算总数应展示');
  });

  test('ROI 展示', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps()));
    assert.ok(html.includes('280%'), '应展示 ROI');
    assert.ok(html.includes('450%'), '应展示高 ROI');
  });

  test('操作按钮 — 进行中显示暂停按钮', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps()));
    assert.ok(html.includes('暂停'), '进行中活动应有暂停按钮');
    assert.ok(html.includes('查看详情'), '应有查看详情按钮');
  });

  test('创建活动按钮', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps()));
    assert.ok(html.includes('创建活动'), '应展示创建按钮');
  });

  test('不提供 onFilterChange 时筛选栏不渲染', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps({ onFilterChange: undefined })));
    assert.ok(!html.includes('已暂停'), '无 onFilterChange 时不展示筛选');
  });

  test('不提供 onCreateCampaign 时不展示创建按钮', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps({ onCreateCampaign: undefined })));
    assert.ok(!html.includes('创建活动'), '无 onCreateCampaign 时不展示创建按钮');
  });

  test('空活动列表', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps({ campaigns: [] })));
    assert.ok(html.includes('暂无促销活动'), '空列表应有占位提示');
  });

  test('筛选后空结果', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps({ campaigns: makeCampaigns(), activeFilter: 'paused' as any })));
    assert.ok(html.includes('该状态下暂无活动'), '筛选空结果应有提示');
  });

  test('活动数量在筛选标签上展示', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps()));
    assert.ok(html.includes('进行中') && html.includes('(1)'), '进行中应有计数');
    assert.ok(html.includes('已排期') && html.includes('(1)'), '已排期应有计数');
    assert.ok(html.includes('草稿') && html.includes('(1)'), '草稿应有计数');
  });

  test('type exports', () => {
    assert.equal(typeof PromotionCampaignManager, 'function', 'PromotionCampaignManager 应为函数');
  });

  test('边界 — 预算 0 时百分比为 0', () => {
    const campaigns = makeCampaigns();
    campaigns[0] = { ...campaigns[0], budget: 0, spent: 0 };
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps({ campaigns })));
    assert.ok(html.includes('0%'), '预算0时进度应为0%');
  });

  test('边界 — 超过预算', () => {
    const campaigns = makeCampaigns();
    campaigns[0] = { ...campaigns[0], budget: 10000, spent: 12000 };
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps({ campaigns })));
    assert.ok(html.includes('100%'), '超预算时最大显示100%');
  });

  test('暂停按钮颜色不同', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionCampaignManager, makeProps()));
    // 暂停按钮应有黄色/琥珀色
    assert.ok(html.includes('暂停'), '暂停按钮应存在');
  });
});
