/**
 * Sales Forecast Page — storefront-web (源码分析模式)
 * Tests: status mapping, stat computation, data formatting, validation, forecast logic
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ═══════════════════════════════════════════════
//  类型 & 常量（与 page.tsx 一致）
// ═══════════════════════════════════════════════

type ForecastTrend = 'up' | 'down' | 'stable';
type StatTrend = 'up' | 'down' | 'neutral';
type ModelStatus = 'active' | 'training' | 'deprecated';
type FactorDirection = 'positive' | 'negative' | 'neutral';

interface ForecastStat {
  label: string;
  value: string;
  trend: StatTrend;
}

interface ForecastDataPoint {
  label: string;
  predicted: number;
  optimistic: number;
  pessimistic: number;
  actual?: number;
}

interface CategoryForecast {
  category: string;
  predictedAmount: number;
  lastWeekAmount: number;
  growthRate: number;
  confidence: number;
  stockSuggestion: string;
}

interface ForecastModel {
  name: string;
  accuracy: number;
  mape: number;
  mae: number;
  status: ModelStatus;
  description: string;
}

interface AccuracyHistory {
  period: string;
  predicted: number;
  actual: number;
  error: number;
  errorRate: number;
}

interface SeasonalFactor {
  factor: string;
  impact: number;
  direction: FactorDirection;
  description: string;
}

// ── 与 page.tsx 一致的常量 ──

const FORECAST_STATS: ForecastStat[] = [
  { label: '明日预测', value: '¥52,380', trend: 'up' },
  { label: '周同比', value: '+12.5%', trend: 'up' },
  { label: '预测置信度', value: '88%', trend: 'neutral' },
  { label: '库存建议', value: '补货 3,200 件', trend: 'neutral' },
];

const CATEGORY_FORECASTS: CategoryForecast[] = [
  { category: '男装', predictedAmount: 18600, lastWeekAmount: 16200, growthRate: 14.8, confidence: 89, stockSuggestion: '加单 420 件' },
  { category: '女装', predictedAmount: 22400, lastWeekAmount: 20100, growthRate: 11.4, confidence: 87, stockSuggestion: '加单 580 件' },
  { category: '童装', predictedAmount: 8200, lastWeekAmount: 7300, growthRate: 12.3, confidence: 85, stockSuggestion: '加单 180 件' },
  { category: '配饰', predictedAmount: 5400, lastWeekAmount: 5100, growthRate: 5.9, confidence: 78, stockSuggestion: '维持库存' },
  { category: '鞋类', predictedAmount: 3800, lastWeekAmount: 3600, growthRate: 5.6, confidence: 76, stockSuggestion: '维持库存' },
];

const FORECAST_MODELS: ForecastModel[] = [
  { name: 'ARIMA + 季节分解', accuracy: 91, mape: 6.2, mae: 3120, status: 'active', description: '基于历史时序的统计模型' },
  { name: 'LSTM 深度学习', accuracy: 93, mape: 5.8, mae: 2850, status: 'active', description: '多特征深度时序预测' },
  { name: 'Prophet 模型', accuracy: 88, mape: 7.1, mae: 3560, status: 'training', description: 'Facebook 开源预测框架' },
  { name: '集成模型', accuracy: 94, mape: 5.3, mae: 2640, status: 'active', description: '多模型加权集成预测' },
];

const ACCURACY_HISTORY: AccuracyHistory[] = [
  { period: '7月第1周', predicted: 342000, actual: 335800, error: -6200, errorRate: 1.81 },
  { period: '7月第2周', predicted: 358000, actual: 364200, error: 6200, errorRate: 1.70 },
  { period: '7月第3周', predicted: 366000, actual: 356400, error: -9600, errorRate: 2.69 },
  { period: '7月第4周(当前)', predicted: 372000, actual: 368500, error: -3500, errorRate: 0.95 },
];

const SEASONAL_FACTORS: SeasonalFactor[] = [
  { factor: '夏季高温', impact: 8, direction: 'positive', description: '持续高温带动夏装、冷饮等品类需求' },
  { factor: '暑假出行', impact: 5, direction: 'positive', description: '旅游旺季带动户外、防晒品类' },
  { factor: '新品上市', impact: 12, direction: 'positive', description: '秋季新品预售预热，转化率预计提升' },
  { factor: '库存压力', impact: -6, direction: 'negative', description: '部分春季款库存积压，需促销清理' },
  { factor: '竞品活动', impact: -4, direction: 'negative', description: '商圈内同类品牌折扣促销活动' },
];

const MODEL_STATUS_LABELS: Record<ModelStatus, string> = {
  active: '运行中',
  training: '训练中',
  deprecated: '已弃用',
};

// ── 工具函数（从 page.tsx 提取） ──

function renderTrendArrow(trend: StatTrend): string | null {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return null;
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function generateForecastDays(count: number): ForecastDataPoint[] {
  const points: ForecastDataPoint[] = [];
  for (let i = 0; i < count; i++) {
    const predicted = 48000 + Math.round(Math.sin(i * 0.8 + 0.5) * 12000 + (Math.random() - 0.5) * 3000);
    const actual = i < 3 ? predicted + Math.round((Math.random() - 0.5) * 6000) : undefined;
    const optimistic = Math.round(predicted * (1.08 + Math.random() * 0.06));
    const pessimistic = Math.round(predicted * (0.85 + Math.random() * 0.05));
    const d = new Date();
    d.setDate(d.getDate() + i - 3);
    const label = d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    points.push({ label, predicted, optimistic, pessimistic, actual });
  }
  return points;
}

function computeGaugeValue(dataPoints: ForecastDataPoint[]): number {
  const last7 = dataPoints.slice(-7);
  if (last7.length === 0) return 0;
  const avg = last7.reduce((s, p) => s + p.predicted, 0) / last7.length;
  return Math.round((avg / 60000) * 100);
}

function computeGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return +((((current - previous) / previous) * 100).toFixed(1));
}

function renderConfidenceColor(confidence: number): string {
  if (confidence >= 85) return '#4ade80';
  if (confidence >= 70) return '#fbbf24';
  return '#f87171';
}

function renderModelStatusLabel(status: ModelStatus): string {
  return MODEL_STATUS_LABELS[status] ?? '未知';
}

function filterCategories(forecasts: CategoryForecast[], query: string): CategoryForecast[] {
  return forecasts.filter((f) => f.category.includes(query));
}

function computeForecastAccuracy(predicted: number, actual: number): number {
  if (predicted === 0) return 0;
  return +((Math.abs(predicted - actual) / predicted) * 100).toFixed(2);
}

function aggregateCategoryStats(forecasts: CategoryForecast[]): {
  totalPredicted: number;
  totalLastWeek: number;
  avgGrowthRate: number;
  avgConfidence: number;
} {
  if (forecasts.length === 0) return { totalPredicted: 0, totalLastWeek: 0, avgGrowthRate: 0, avgConfidence: 0 };
  const totalPredicted = forecasts.reduce((s, f) => s + f.predictedAmount, 0);
  const totalLastWeek = forecasts.reduce((s, f) => s + f.lastWeekAmount, 0);
  const avgGrowthRate = forecasts.length > 0 ? +(forecasts.reduce((s, f) => s + f.growthRate, 0) / forecasts.length).toFixed(1) : 0;
  const avgConfidence = forecasts.length > 0 ? Math.round(forecasts.reduce((s, f) => s + f.confidence, 0) / forecasts.length) : 0;
  return { totalPredicted, totalLastWeek, avgGrowthRate, avgConfidence };
}

function findBestModel(models: ForecastModel[]): ForecastModel | null {
  if (models.length === 0) return null;
  return models.reduce((best, m) => (m.accuracy > best.accuracy ? m : best), models[0]);
}

function computeSeasonalImpactSum(factors: SeasonalFactor[]): { positive: number; negative: number; neutral: number } {
  return {
    positive: factors.filter((f) => f.direction === 'positive').reduce((s, f) => s + f.impact, 0),
    negative: factors.filter((f) => f.direction === 'negative').reduce((s, f) => s + Math.abs(f.impact), 0),
    neutral: factors.filter((f) => f.direction === 'neutral').reduce((s, f) => s + f.impact, 0),
  };
}

function mockFetchForecast(): Promise<{ data: ForecastDataPoint[] }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data: generateForecastDays(10) }), 200);
  });
}

// ═══════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════

// ── 1. 分类标签标签化 ──

test('renderTrendArrow: 向上箭头', () => {
  assert.equal(renderTrendArrow('up'), '↑');
});

test('renderTrendArrow: 向下箭头', () => {
  assert.equal(renderTrendArrow('down'), '↓');
});

test('renderTrendArrow: 中性不显示箭头', () => {
  assert.equal(renderTrendArrow('neutral'), null);
  assert.equal(renderTrendArrow('stable'), null);
});

test('renderModelStatusLabel: 完整的状态映射', () => {
  assert.equal(renderModelStatusLabel('active'), '运行中');
  assert.equal(renderModelStatusLabel('training'), '训练中');
  assert.equal(renderModelStatusLabel('deprecated'), '已弃用');
});

test('renderModelStatusLabel: 未知状态兜底', () => {
  assert.equal(renderModelStatusLabel('' as ModelStatus), '未知');
});

test('renderConfidenceColor: 高置信度绿色', () => {
  assert.equal(renderConfidenceColor(90), '#4ade80');
  assert.equal(renderConfidenceColor(85), '#4ade80');
});

test('renderConfidenceColor: 中置信度黄色', () => {
  assert.equal(renderConfidenceColor(80), '#fbbf24');
  assert.equal(renderConfidenceColor(70), '#fbbf24');
});

test('renderConfidenceColor: 低置信度红色', () => {
  assert.equal(renderConfidenceColor(69), '#f87171');
  assert.equal(renderConfidenceColor(0), '#f87171');
});

test('FORECAST_STATS: 所有统计项结构正确', () => {
  assert.equal(FORECAST_STATS.length, 4);
  for (const stat of FORECAST_STATS) {
    assert.ok(typeof stat.label === 'string');
    assert.ok(typeof stat.value === 'string');
    assert.ok(['up', 'down', 'neutral'].includes(stat.trend));
  }
});

// ── 2. 统计计算 ──

test('computeGaugeValue: 正常计算', () => {
  const points = generateForecastDays(10);
  const gauge = computeGaugeValue(points);
  assert.ok(gauge >= 0 && gauge <= 100);
});

test('computeGaugeValue: 空列表返回0', () => {
  assert.equal(computeGaugeValue([]), 0);
});

test('computeGrowthRate: 正增长', () => {
  assert.equal(computeGrowthRate(120, 100), 20.0);
});

test('computeGrowthRate: 负增长', () => {
  assert.equal(computeGrowthRate(80, 100), -20.0);
});

test('computeGrowthRate: 零增长', () => {
  assert.equal(computeGrowthRate(100, 100), 0.0);
});

test('computeGrowthRate: previous为0', () => {
  assert.equal(computeGrowthRate(0, 0), 0);
  assert.equal(computeGrowthRate(100, 0), 100);
});

test('aggregateCategoryStats: 正常聚合', () => {
  const stats = aggregateCategoryStats(CATEGORY_FORECASTS);
  assert.equal(stats.totalPredicted, 58400);
  assert.equal(stats.totalLastWeek, 52300);
  assert.ok(stats.avgGrowthRate > 0);
  assert.ok(stats.avgConfidence >= 80);
});

test('aggregateCategoryStats: 空列表', () => {
  const stats = aggregateCategoryStats([]);
  assert.equal(stats.totalPredicted, 0);
  assert.equal(stats.totalLastWeek, 0);
  assert.equal(stats.avgGrowthRate, 0);
  assert.equal(stats.avgConfidence, 0);
});

test('aggregateCategoryStats: 单个品类', () => {
  const stats = aggregateCategoryStats([{ category: '男装', predictedAmount: 10000, lastWeekAmount: 8000, growthRate: 25, confidence: 90, stockSuggestion: '加单' }]);
  assert.equal(stats.totalPredicted, 10000);
  assert.equal(stats.avgGrowthRate, 25);
  assert.equal(stats.avgConfidence, 90);
});

test('computeForecastAccuracy: 计算准确度', () => {
  const err = computeForecastAccuracy(1000, 950);
  assert.ok(err > 0);
  assert.ok(err < 10);
});

test('computeForecastAccuracy: 完全准确', () => {
  assert.equal(computeForecastAccuracy(1000, 1000), 0);
});

test('findBestModel: 返回准确率最高模型', () => {
  const best = findBestModel(FORECAST_MODELS);
  assert.ok(best !== null);
  assert.equal(best!.accuracy, 94);
  assert.equal(best!.name, '集成模型');
});

test('findBestModel: 空列表返回null', () => {
  assert.equal(findBestModel([]), null);
});

test('findBestModel: 单个模型', () => {
  const best = findBestModel([{ name: 'ARIMA', accuracy: 90, mape: 5, mae: 2000, status: 'active', description: 'd' }]);
  assert.equal(best!.name, 'ARIMA');
});

test('computeSeasonalImpactSum: 各项累加正确', () => {
  const sums = computeSeasonalImpactSum(SEASONAL_FACTORS);
  assert.equal(sums.positive, 25); // 8 + 5 + 12
  assert.equal(sums.negative, 10); // 6 + 4
  assert.equal(sums.neutral, 0);
});

test('computeSeasonalImpactSum: 空列表', () => {
  const sums = computeSeasonalImpactSum([]);
  assert.equal(sums.positive, 0);
  assert.equal(sums.negative, 0);
  assert.equal(sums.neutral, 0);
});

// ── 3. 数据转换/格式化 ──

test('formatCurrency: 标准格式', () => {
  assert.equal(formatCurrency(52800), '¥52,800');
  assert.equal(formatCurrency(1000), '¥1,000');
  assert.equal(formatCurrency(0), '¥0');
});

test('formatCurrency: 大数值', () => {
  assert.equal(formatCurrency(12345678), '¥12,345,678');
});

test('formatPercent: 正数', () => {
  assert.equal(formatPercent(12.5), '+12.5%');
});

test('formatPercent: 负数', () => {
  assert.equal(formatPercent(-3.2), '-3.2%');
});

test('formatPercent: 零', () => {
  assert.equal(formatPercent(0), '+0.0%');
});

// ── 4. 验证函数 ──

test('generateForecastDays: 生成正确数量', () => {
  const points = generateForecastDays(10);
  assert.equal(points.length, 10);
});

test('generateForecastDays: 每条数据有有效字段', () => {
  const points = generateForecastDays(10);
  for (const point of points) {
    assert.ok(typeof point.label === 'string' && point.label.length > 0);
    assert.ok(typeof point.predicted === 'number' && point.predicted > 0);
    assert.ok(typeof point.optimistic === 'number');
    assert.ok(typeof point.pessimistic === 'number');
  }
});

test('generateForecastDays: optimistic >= predicted >= pessimistic', () => {
  const points = generateForecastDays(10);
  for (const point of points) {
    assert.ok(point.optimistic >= point.predicted, `${point.label}: optimistic ${point.optimistic} < predicted ${point.predicted}`);
    assert.ok(point.predicted >= point.pessimistic, `${point.label}: predicted ${point.predicted} < pessimistic ${point.pessimistic}`);
  }
});

test('generateForecastDays: 过去3天有actual', () => {
  const points = generateForecastDays(10);
  for (let i = 0; i < 3; i++) {
    assert.ok(points[i].actual !== undefined, `Day ${i} should have actual`);
  }
});

test('generateForecastDays: 未来天数无actual', () => {
  const points = generateForecastDays(10);
  for (let i = 3; i < points.length; i++) {
    assert.equal(points[i].actual, undefined, `Day ${i} should not have actual`);
  }
});

test('generateForecastDays: 预测值在合理范围', () => {
  const points = generateForecastDays(10);
  for (const point of points) {
    assert.ok(point.predicted >= 20000 && point.predicted <= 80000,
      `${point.label}: predicted ${point.predicted} out of range 20k-80k`);
  }
});

test('generateForecastDays: 0天返回空', () => {
  assert.equal(generateForecastDays(0).length, 0);
});

// ── 5. 搜索/过滤 ──

test('filterCategories: 搜索到品类', () => {
  assert.equal(filterCategories(CATEGORY_FORECASTS, '男装').length, 1);
  assert.equal(filterCategories(CATEGORY_FORECASTS, '装').length, 3);
});

test('filterCategories: 空搜索返回全部', () => {
  assert.equal(filterCategories(CATEGORY_FORECASTS, '').length, 5);
});

test('filterCategories: 无匹配返回空', () => {
  assert.equal(filterCategories(CATEGORY_FORECASTS, '食品').length, 0);
});

test('filterCategories: 空列表返回空', () => {
  assert.equal(filterCategories([], '男装').length, 0);
});

// ── 6. 加载/数据完整性 ──

test('CATEGORY_FORECASTS: 5个品类', () => {
  assert.equal(CATEGORY_FORECASTS.length, 5);
});

test('CATEGORY_FORECASTS: 每条数据完整', () => {
  for (const f of CATEGORY_FORECASTS) {
    assert.ok(f.category);
    assert.ok(f.predictedAmount > 0);
    assert.ok(f.lastWeekAmount > 0);
    assert.ok(f.stockSuggestion);
    assert.ok(f.confidence >= 0 && f.confidence <= 100);
  }
});

test('FORECAST_MODELS: 4个模型', () => {
  assert.equal(FORECAST_MODELS.length, 4);
});

test('FORECAST_MODELS: 模型数据合理', () => {
  for (const m of FORECAST_MODELS) {
    assert.ok(m.accuracy > 0 && m.accuracy <= 100);
    assert.ok(m.mape > 0);
    assert.ok(m.mae > 0);
    assert.ok(['active', 'training', 'deprecated'].includes(m.status));
  }
});

test('ACCURACY_HISTORY: 4周数据', () => {
  assert.equal(ACCURACY_HISTORY.length, 4);
});

test('ACCURACY_HISTORY: 误差率在合理范围', () => {
  for (const h of ACCURACY_HISTORY) {
    assert.ok(h.errorRate > 0 && h.errorRate < 5);
  }
});

test('SEASONAL_FACTORS: 5个因子', () => {
  assert.equal(SEASONAL_FACTORS.length, 5);
});

test('SEASONAL_FACTORS: 方向值正确', () => {
  for (const f of SEASONAL_FACTORS) {
    assert.ok(['positive', 'negative', 'neutral'].includes(f.direction));
    assert.ok(typeof f.impact === 'number');
  }
});

test('mockFetchForecast: 返回正确数据结构', async () => {
  const result = await mockFetchForecast();
  assert.equal(result.data.length, 10);
});

// ── 7. 完整数据流 ──

test('computeGaugeValue: 模拟全流程', () => {
  const points = generateForecastDays(10);
  const gauge = computeGaugeValue(points);
  const growth = computeGrowthRate(points[0].predicted, points[1]?.predicted ?? 0);
  const bestModel = findBestModel(FORECAST_MODELS);
  const categoryStats = aggregateCategoryStats(CATEGORY_FORECASTS);
  assert.ok(gauge >= 0 && gauge <= 100);
  assert.ok(typeof growth === 'number');
  assert.ok(bestModel !== null);
  assert.ok(categoryStats.totalPredicted > 0);
});
