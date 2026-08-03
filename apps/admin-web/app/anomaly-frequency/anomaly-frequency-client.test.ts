const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const SOURCE = resolve(__dirname, './anomaly-frequency-client.tsx');
const REFRESH_CARD_SOURCE = resolve(__dirname, '../components/snapshot-refresh-card.tsx');
const REFRESH_HOOK_SOURCE = resolve(__dirname, '../components/use-snapshot-refresh.ts');

function readSource() {
  return readFileSync(SOURCE, 'utf-8');
}

function readRefreshCardSource() {
  return readFileSync(REFRESH_CARD_SOURCE, 'utf-8');
}

function readRefreshHookSource() {
  return readFileSync(REFRESH_HOOK_SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('AnomalyFrequencyClient — 正例', () => {
  test('导出存在且为函数组件', () => {
    const src = readSource();
    assert.ok(src.includes('export function AnomalyFrequencyClient'));
    assert.ok(src.includes('export default AnomalyFrequencyClient'));
  });

  test('渲染页面标题与副标题文案', () => {
    const src = readSource();
    assert.ok(src.includes('异常时序频率'), '应展示页面标题');
    assert.ok(src.includes('监控各时段异常分布趋势'), '应展示页面副标题');
  });

  test('渲染统计卡片字段', () => {
    const src = readSource();
    assert.ok(src.includes('总异常数'), '应展示总异常数统计');
    assert.ok(src.includes('关键异常'), '应展示关键异常统计');
    assert.ok(src.includes('已处理'), '应展示已处理统计');
    assert.ok(src.includes('处理率'), '应展示处理率统计');
  });

  test('渲染时间范围按钮', () => {
    const src = readSource();
    assert.ok(src.includes('近6小时'), '应展示近6小时按钮');
    assert.ok(src.includes('近24小时'), '应展示近24小时按钮');
    assert.ok(src.includes('近7天'), '应展示近7天按钮');
    assert.ok(src.includes('近30天'), '应展示近30天按钮');
  });

  test('渲染严重程度过滤按钮', () => {
    const src = readSource();
    assert.ok(src.includes('全部'), '应展示全部按钮');
    assert.ok(src.includes('关键'), '应展示关键按钮');
    assert.ok(src.includes('高'), '应展示高按钮');
    assert.ok(src.includes('中'), '应展示中按钮');
    assert.ok(src.includes('低'), '应展示低按钮');
  });

  test('渲染刷新按钮', () => {
    // 刷新按钮文案已下沉到 snapshot-refresh-card, hook 走 use-snapshot-refresh
    const cardSrc = readRefreshCardSource();
    const hookSrc = readRefreshHookSource();
    assert.ok(cardSrc.includes('刷新快照'), 'snapshot-refresh-card 应展示刷新按钮');
    assert.ok(hookSrc.includes('router.refresh()'), 'use-snapshot-refresh hook 应调用 router.refresh');
  });

  test('渲染异常时序图组件', () => {
    const src = readSource();
    assert.ok(src.includes('AnomalyFrequencyTimeline'), '应渲染 AnomalyFrequencyTimeline');
    assert.ok(src.includes('anomaly-frequency-timeline-page'), '应配置 timeline test id');
    assert.ok(src.includes('异常时序分布'), '应展示图表标题');
  });

  test('渲染底部说明', () => {
    const src = readSource();
    assert.ok(src.includes('说明'), '应展示说明区域');
    assert.ok(src.includes('异常时序图展示各时段内不同严重级别异常的分布'), '应展示说明内容');
  });

  test('离线模式标识与来源态文案共存', () => {
    const src = readSource();
    assert.ok(src.includes('离线模式'), 'fallback 模式应展示离线标识');
    assert.ok(src.includes('Delivery {snapshot.deliveryMode}'), '应展示 deliveryMode');
    assert.ok(src.includes('业务数据: {snapshot.businessDataSource}'), '应展示业务数据来源');
    // sourceLabel 已下沉到 snapshot-refresh-card
    const cardSrc = readRefreshCardSource();
    assert.ok(cardSrc.includes('sourceLabel'), 'snapshot-refresh-card 应展示 sourceLabel');
  });

  test('显式展示快照说明与时间证据', () => {
    const src = readSource();
    assert.ok(src.includes('generatedAt: {snapshot.generatedAt}'));
    assert.ok(src.includes('{snapshot.note}'));
    // refreshPath 已下沉到 snapshot-refresh-card
    const cardSrc = readRefreshCardSource();
    assert.ok(cardSrc.includes('refreshPath'), 'snapshot-refresh-card 应展示 refreshPath');
  });

  test('初始时间范围为近24小时（默认选中）', () => {
    const src = readSource();
    assert.ok(src.includes("useState<AnomalyTimeRange>('24h')"));
  });
});

// ---- 边界 ----

describe('AnomalyFrequencyClient — 边界', () => {
  test('severityFilter 不是 all 时应仅保留对应严重级别', () => {
    const src = readSource();
    assert.ok(src.includes('projectBucketsBySeverity'));
    assert.ok(src.includes("severityFilter === 'all'"));
    assert.ok(src.includes('bucket.bySeverity[severityFilter]'));
  });

  test('超长时间范围（30天）不崩溃', () => {
    const src = readSource();
    assert.ok(src.includes('maxBuckets={'));
    assert.ok(src.includes("timeRange === '7d' ? 14 : 30"));
    assert.ok(src.includes('? 14 : 30'));
  });

  test('无可见数据时显示空态提示', () => {
    const src = readSource();
    assert.ok(src.includes('hasVisibleData ? ('));
    assert.ok(src.includes('暂无可展示的异常频率数据'));
  });
});

// ---- 反例 ----

describe('AnomalyFrequencyClient — 反例', () => {
  test('组件不再直接加载治理读模型', () => {
    const src = readSource();
    assert.ok(!src.includes('loadAdminGovernanceReadModel'));
  });

  test('组件以 snapshot 为唯一输入合同', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot: AnomalyFrequencySnapshot'));
    assert.ok(src.includes('snapshot.bucketsByRange'));
  });
});
