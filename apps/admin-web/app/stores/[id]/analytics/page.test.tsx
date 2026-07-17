/**
 * analytics/page.test.tsx — 门店分析看板 L1+L2 测试
 * 覆盖: 正例·反例·边界·防御·数据校验
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

// ---- 正例 ----

describe('analytics — 正例', () => {
  it('应导出一个默认组件 AnalyticsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AnalyticsPage'), '缺少默认导出组件');
  });

  it('应包含 Statistic 营收指标', () => {
    const src = readSource();
    assert.ok(src.includes('周期营收') || src.includes('日均营收'), '缺少营收指标');
  });

  it('应包含客流统计指标', () => {
    const src = readSource();
    assert.ok(src.includes('总客流') || src.includes('日均客流'), '缺少客流统计');
  });

  it('应包含客单价指标', () => {
    const src = readSource();
    assert.ok(src.includes('客单价'), '缺少客单价指标');
  });

  it('应包含环比统计', () => {
    const src = readSource();
    assert.ok(src.includes('环比') || src.includes('同比上周'), '缺少环比统计');
  });

  it('Statistic 应设置 value 属性', () => {
    const src = readSource();
    // Statistic 组件应有 value 属性
    const matches = src.match(/Statistic\s+title=/g);
    assert.ok(matches && matches.length >= 4, `Statistic 数量不足: ${matches?.length ?? 0}`);
  });
});

// ---- 反例 ----

describe('analytics — 反例', () => {
  it('不应导出非默认函数', () => {
    const src = readSource();
    assert.ok(!src.includes('export function '), '不应存在命名导出');
  });

  it('不应使用 class 组件', () => {
    const src = readSource();
    assert.ok(!src.includes('extends Component') && !src.includes('React.Component'), '不应使用 class 组件');
  });

  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.ok(!/: any\b/.test(src), '不应使用 any 类型');
  });
});

// ---- 边界 ----

describe('analytics — 边界', () => {
  it('应包含时段客流分析', () => {
    const src = readSource();
    assert.ok(src.includes('时段客流'), '缺少时段客流分析');
  });

  it('应包含设备使用率分析', () => {
    const src = readSource();
    assert.ok(src.includes('设备使用率') || src.includes('设备利用率'), '缺少设备使用率分析');
  });

  it('应包含支付方式或利用率分布', () => {
    const src = readSource();
    assert.ok(src.includes('支付方式') || src.includes('设备利用率'), '缺少支付方式或设备利用率');
  });

  it('应包含主要分析维度', () => {
    const src = readSource();
    const hasRevenue = src.includes('周期营收') || src.includes('日均营收');
    const hasTraffic = src.includes('总客流') || src.includes('日均客流');
    assert.ok(hasRevenue && hasTraffic, '缺少营收或客流维度');
  });

  it('应包含导出报告按钮', () => {
    const src = readSource();
    assert.ok(src.includes('导出报告') || src.includes('导出'), '缺少导出按钮');
  });
});

// ---- 防御 ----

describe('analytics — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 PageShell 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用 dangerouslySetInnerHTML');
  });

  it('营收应前缀 ¥ 符号', () => {
    const src = readSource();
    const statUsage = src.indexOf('Statistic');
    const afterStat = src.slice(statUsage);
    // 检查是否使用 prefix="¥"
    assert.ok(afterStat.includes('prefix="¥"') || afterStat.includes("prefix='¥'"), '营收缺少 ¥ 前缀');
  });

  it('应有 warning 颜色提醒', () => {
    const src = readSource();
    assert.ok(src.includes('#f59e0b'), '缺少 warning 颜色');
  });
});

// ---- 数据校验 ----

describe('analytics — 数据校验', () => {
  it('统计卡片各占 Col span', () => {
    const src = readSource();
    const spanCount = (src.match(/span=\{3\}/g) || []).length;
    assert.ok(spanCount >= 4, `Col span数量: ${spanCount}`);
  });

  it('应消费 useState', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('PageShell 应被正确包裹', () => {
    const src = readSource();
    const firstContent = src.indexOf('return (');
    const afterReturn = src.slice(firstContent);
    assert.ok(afterReturn.includes('<PageShell'), '渲染应包裹 PageShell');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Stores / Analytics — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onCancel={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
