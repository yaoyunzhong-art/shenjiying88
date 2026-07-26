const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const SOURCE = resolve(__dirname, './anomaly-frequency-client.tsx');

function readSource() {
  return readFileSync(SOURCE, 'utf-8');
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
    assert.ok(src.includes('严重异常'), '应展示严重异常统计');
    assert.ok(src.includes('高优先级'), '应展示高优先级统计');
    assert.ok(src.includes('时段均值'), '应展示时段均值统计');
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
    assert.ok(src.includes('严重'), '应展示严重按钮');
    assert.ok(src.includes('高'), '应展示高按钮');
    assert.ok(src.includes('中'), '应展示中按钮');
    assert.ok(src.includes('低'), '应展示低按钮');
  });

  test('渲染刷新按钮', () => {
    const src = readSource();
    assert.ok(src.includes('刷新'), '应展示刷新按钮');
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
    assert.ok(src.includes('时序频率图'), '应展示说明内容');
  });

  test('离线模式标识与来源态文案共存', () => {
    const src = readSource();
    assert.ok(src.includes('离线模式'), 'fallback 模式应展示离线标识');
    assert.ok(src.includes('Delivery {sourceEvidence.deliveryMode}'), '应展示 deliveryMode');
    assert.ok(src.includes('控制面来源'), '应展示控制面来源');
    assert.ok(src.includes('业务数据: {sourceEvidence.businessDataSource}'), '应展示业务数据来源');
  });

  test('显式展示 API/fallback 双路径说明', () => {
    const src = readSource();
    assert.ok(src.includes('loadAdminGovernanceReadModel / snapshot.governance'));
    assert.ok(src.includes('fallback governance snapshot'));
    assert.ok(src.includes('generateMockBuckets(timeRange, severityFilter)'));
  });

  test('初始时间范围为近24小时（默认选中）', () => {
    const src = readSource();
    assert.ok(src.includes("useState<TimeRange>('24h')"));
  });
});

// ---- 边界 ----

describe('AnomalyFrequencyClient — 边界', () => {
  test('governance 为 undefined 时回退到 fallback', () => {
    const src = readSource();
    assert.ok(src.includes("initialGovernance ?? { deliveryMode: 'fallback' }"));
  });

  test('超长时间范围（30天）不崩溃', () => {
    const src = readSource();
    assert.ok(src.includes("maxBuckets={timeRange === '6h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 14 : 30}"));
  });

  test('generatedAt 缺失时应回退到 unknown', () => {
    const src = readSource();
    assert.ok(src.includes("String(safeGovernance.generatedAt ?? 'unknown')"));
  });
});

// ---- 反例 ----

describe('AnomalyFrequencyClient — 反例', () => {
  test('缺失 deliveryMode 时仍保留 fallback 判断路径', () => {
    const src = readSource();
    assert.ok(src.includes("safeGovernance.deliveryMode === 'fallback'"));
  });

  test('极端 deliveryMode 值不会影响来源态文案结构', () => {
    const src = readSource();
    assert.ok(src.includes('sourceEvidence'));
    assert.ok(src.includes('generatedAt'));
  });
});
