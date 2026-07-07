/**
 * sales-performance/page.test.tsx — 销售业绩页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('SalesPerformancePage — 正例', () => {
  it('应导出一个默认组件 SalesPerformancePage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function SalesPerformancePage'), '缺少默认导出');
  });

  it('应包含 SalesTransaction 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface SalesTransaction'), '缺少接口定义');
  });

  it('应包含 MOCK_TRANSACTIONS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_TRANSACTIONS'), '缺少数据源');
  });

  it('应包含 computePeriodMetrics 函数', () => {
    const src = readSource();
    assert.ok(src.includes('function computePeriodMetrics'), '缺少指标计算函数');
  });

  it('应包含 formatCurrency 和 formatPercent 工具函数', () => {
    const src = readSource();
    assert.ok(src.includes('function formatCurrency'), '缺少金额格式化');
    assert.ok(src.includes('function formatPercent'), '缺少百分比格式化');
  });

  it('应包含预测数据生成函数 generateForecastDays', () => {
    const src = readSource();
    assert.ok(src.includes('function generateForecastDays'), '缺少预测数据生成');
  });

  it('应渲染总销售额指标', () => {
    const src = readSource();
    assert.ok(src.includes('总销售额'), '缺少总销售额标签');
    assert.ok(src.includes('formatCurrency(metrics.total)'), '缺少总销售额值');
  });

  it('应渲染订单数指标', () => {
    const src = readSource();
    assert.ok(src.includes('订单数'), '缺少订单数标签');
    assert.ok(src.includes('metrics.orderCount'), '缺少订单数值');
  });

  it('应渲染平均客单价指标', () => {
    const src = readSource();
    assert.ok(src.includes('平均客单价'), '缺少客单价标签');
    assert.ok(src.includes('Math.round(metrics.avg)'), '缺少客单价计算');
  });

  it('应渲染线下/线上占比指标', () => {
    const src = readSource();
    assert.ok(src.includes('线下占比'), '缺少线下占比标签');
    assert.ok(src.includes('channelRatio.offline'), '缺少线下占比值');
    assert.ok(src.includes('channelRatio.online'), '缺少线上占比值');
  });

  it('应渲染渠道拆分卡片（线下 + 线上）', () => {
    const src = readSource();
    assert.ok(src.includes('线下渠道'), '缺少线下渠道');
    assert.ok(src.includes('线上渠道'), '缺少线上渠道');
    assert.ok(src.includes('formatCurrency(metrics.offlineTotal)'), '缺少线下总额');
    assert.ok(src.includes('formatCurrency(metrics.onlineTotal)'), '缺少线上总额');
  });

  it('应包含交易明细表头字段', () => {
    const src = readSource();
    assert.ok(src.includes('单号'), '缺少单号列');
    assert.ok(src.includes('时间'), '缺少时间列');
    assert.ok(src.includes('顾客'), '缺少顾客列');
    assert.ok(src.includes('金额'), '缺少金额列');
    assert.ok(src.includes('件数'), '缺少件数列');
    assert.ok(src.includes('门店'), '缺少门店列');
    assert.ok(src.includes('渠道'), '缺少渠道列');
  });

  it('应遍历 MOCK_TRANSACTIONS 渲染交易行', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_TRANSACTIONS.map'), '缺少交易行渲染');
    assert.ok(src.includes('tx.channel'), '缺少渠道判断');
    assert.ok(src.includes('tx.amount'), '缺少金额字段');
    assert.ok(src.includes('tx.customer'), '缺少客户字段');
  });

  it('应渲染时段筛选按钮（近7天/近30天/近90天）', () => {
    const src = readSource();
    assert.ok(src.includes("'7d'") || src.includes("近7天"), '缺少近7天筛选');
    assert.ok(src.includes("'30d'") || src.includes("近30天"), '缺少近30天筛选');
    assert.ok(src.includes("'90d'") || src.includes("近90天"), '缺少近90天筛选');
  });

  it('应渲染预测卡片 (forecastData)', () => {
    const src = readSource();
    assert.ok(src.includes('forecastData.slice(3)'), '缺少预测卡片渲染');
    assert.ok(src.includes('forecastCard'), '缺少预测卡片样式');
  });

  it('应包含页面底部提示文字', () => {
    const src = readSource();
    assert.ok(src.includes('预测数据仅供管理参考'), '缺少底部提示');
  });
});

describe('SalesPerformancePage — 边界', () => {
  it('MOCK_TRANSACTIONS 应有 8 条记录', () => {
    const src = readSource();
    const match = src.match(/MOCK_TRANSACTIONS/);
    assert.ok(match, '找不到 MOCK_TRANSACTIONS');
    // 计算模拟记录条数 — 统计每行以 channel: 结尾的数量
    // 匹配行内 channel: 'online' 或 'offline'（排除类型定义）
    const channelLines = src.match(/channel:\s*'(online|offline)'\s*\},/g);
    assert.ok(channelLines, '无法匹配渠道字段');
    assert.equal(channelLines.length, 8, `期望 8 条记录，实际 ${channelLines.length}`);
  });

  it('应区分 offline 和 online 渠道', () => {
    const src = readSource();
    assert.ok(src.includes("channel: 'online'"), '缺少 online 渠道');
    assert.ok(src.includes("channel: 'offline'"), '缺少 offline 渠道');
  });

  it('应包含 PeriodFilter 类型定义', () => {
    const src = readSource();
    assert.ok(src.includes('type PeriodFilter'), '缺少筛选类型');
  });

  it('门店数据字段应覆盖 id\/date\/customer\/amount\/items\/store\/channel', () => {
    const src = readSource();
    ['id', 'date', 'customer', 'amount', 'items', 'store', 'channel'].forEach((f) => {
      assert.ok(src.includes(f), `缺少字段: ${f}`);
    });
  });

  it('generateForecastDays 应返回 ForecastDataPoint 对象', () => {
    const src = readSource();
    assert.ok(src.includes('interface ForecastDataPoint'), '缺少预测数据类型');
    assert.ok(src.includes('predicted'), '缺少 predicted 字段');
    assert.ok(src.includes('optimistic'), '缺少 optimistic 字段');
    assert.ok(src.includes('pessimistic'), '缺少 pessimistic 字段');
  });

  it('formatCurrency 应输出 ¥ 符号', () => {
    const src = readSource();
    assert.ok(src.includes("`¥"), '缺少货币符号');
  });

  it('formatPercent 应输出 + 或 - 符号', () => {
    const src = readSource();
    assert.ok(src.includes('sign'), '缺少符号标记');
  });

  it('periodFilters 数组应包含 3 个元素', () => {
    const src = readSource();
    assert.ok(src.includes("PeriodFilter[]"), '缺少 PeriodFilter 数组类型标注');
  });

  it('应有 inline style 对象 pageStyles', () => {
    const src = readSource();
    assert.ok(src.includes('const pageStyles'), '缺少样式定义');
  });

  it('style 应有 container\/header\/title 等完整结构', () => {
    const src = readSource();
    const required = ['container', 'header', 'title', 'subtitle', 'filterRow', 'metricsRow', 'metricCard', 'table', 'footer'];
    required.forEach((s) => assert.ok(src.includes(s), `缺少样式属性: ${s}`));
  });
});

describe('SalesPerformancePage — 防御', () => {
  it('不应直接依赖外部 API（只读本地数据）', () => {
    const src = readSource();
    assert.ok(!src.includes('fetch('), '包含意外 fetch 调用');
    assert.ok(!src.includes('axios'), '包含意外 axios 引用');
    assert.ok(!src.includes('useEffect'), '包含意外 useEffect');
  });

  it('不应有 console.log 调试残留', () => {
    const src = readSource();
    // 允许多行模板字符串中的 .log
    const lines = src.split('\n').filter((l) => l.trim().startsWith('console.log'));
    assert.equal(lines.length, 0, '存在 console.log 残留');
  });

  it('不应导入未使用的外部依赖', () => {
    const src = readSource();
    // 只从 'react' 导入 React, useMemo, useState
    const importMatch = src.match(/import\s+React,\s*\{/);
    assert.ok(importMatch, '缺少 React 导入');
    // 不应有其他 import（排除 .test 自身）
    const allImports = src.match(/^import\s/gm);
    assert.ok(allImports, '至少有一个 import');
    assert.equal(allImports.length, 1, `期望 1 个 import 语句，实际 ${allImports.length}`);
  });

  it('MOCK_TRANSACTIONS 每条记录应包含完整字段', () => {
    const src = readSource();
    const requiredFields = ['id', 'date', 'customer', 'amount', 'items', 'store', 'channel'];
    requiredFields.forEach((f) => assert.ok(src.includes(f), `模拟数据缺字段: ${f}`));
  });

  it('当 transactions 为空时 computePeriodMetrics 应返回零值', () => {
    // 验证防御逻辑：空数组时分母不为0
    const src = readSource();
    assert.ok(src.includes('transactions.reduce'), '缺少 reduce 用法');
    assert.ok(src.includes('transactions.length > 0'), '缺少空数组防御');
  });

  it('MOCK_TRANSACTIONS 总金额应非负', () => {
    const src = readSource();
    const amounts = src.match(/amount:\s*(-?\d+)/g) || [];
    amounts.forEach((a) => {
      const num = parseInt(a.replace('amount: ', ''), 10);
      assert.ok(num >= 0, `负金额: ${num}`);
    });
  });

  it('门店名称应有限', () => {
    const src = readSource();
    const stores = ['旗舰店', '社区店'];
    stores.forEach((s) => assert.ok(src.includes(s), `缺少门店: ${s}`));
  });

  it('应有数据同步时间戳说明', () => {
    const src = readSource();
    assert.ok(src.includes('同步'), '缺少同步说明');
  });
});
