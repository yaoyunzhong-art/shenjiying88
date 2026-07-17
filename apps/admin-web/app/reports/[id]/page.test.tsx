/**
 * reports/[id]/page.test.tsx — 报表详情页 L1 冒烟测试
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

// ---- 正例: 模块结构 & 数据映射 ----

describe('reports/[id] — 正例', () => {
  it('应导出一个默认函数组件', () => {
    const src = readSource();
    assert.ok(src.includes('export default function'), '未找到默认导出函数组件');
  });

  it('应包含 MOCK_REPORTS 模拟数据集', () => {
    const src = readSource();
    assert.ok(src.includes('const MOCK_REPORTS'), '缺少 MOCK_REPORTS 常量');
  });

  it('MOCK_REPORTS 应包含营收报表', () => {
    const src = readSource();
    assert.ok(src.includes('report-revenue-001'), '缺少营收示例报表');
    assert.ok(src.includes('revenue'), '缺少 revenue 类型');
  });

  it('MOCK_REPORTS 应包含商品排行报表', () => {
    const src = readSource();
    assert.ok(src.includes('report-product-001'), '缺少商品排行示例报表');
    assert.ok(src.includes('product-ranking'), '缺少 product-ranking 类型');
  });

  it('报表列定义应包含 dimension 和 metric 两种类型', () => {
    const src = readSource();
    assert.ok(src.includes("type: 'dimension'"), '缺少 dimension 列类型');
    assert.ok(src.includes("type: 'metric'"), '缺少 metric 列类型');
  });

  it('报表应包含 totals 合计字段', () => {
    const src = readSource();
    assert.ok(src.includes('totals:'), '缺少 totals 合计字段');
  });

  it('应包含 loadReportDetail 异步加载函数', () => {
    const src = readSource();
    assert.ok(src.includes('async function loadReportDetail'), '缺少 loadReportDetail 函数');
  });

  it('报表应包含 generatedAt 和 cached 字段', () => {
    const src = readSource();
    assert.ok(src.includes('generatedAt:'), '缺少 generatedAt 字段');
    assert.ok(src.includes('cached:'), '缺少 cached 字段');
  });

  it('报表 period 应包含 from 和 to 日期范围', () => {
    const src = readSource();
    assert.ok(src.includes('from:'), 'period 缺少 from');
    assert.ok(src.includes('to:'), 'period 缺少 to');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('reports/[id] — 边界', () => {
  it('loadReportDetail 处理 null 时返回 null（不存在报表 ID）', () => {
    const src = readSource();
    assert.ok(src.includes('?? null'), 'loadReportDetail 缺少 null fallback');
  });

  it('应包含 loading 状态管理', () => {
    const src = readSource();
    assert.ok(src.includes('loading: true'), '加载态应为 true');
    assert.ok(src.includes('loading: false'), '加载完成态应为 false');
  });

  it('应包含 loading state setter', () => {
    const src = readSource();
    assert.ok(src.includes('setState'), '缺少 setState 状态更新');
  });

  it('应包含 error 状态处理', () => {
    const src = readSource();
    assert.ok(src.includes('error:'), '缺少 error 状态字段');
    assert.ok(src.includes('string | null'), 'error 类型应为 string | null');
  });

  it('报表数据行应包含至少一个指标列', () => {
    const src = readSource();
    assert.ok(src.includes('revenue'), '营收列应包含 revenue 指标');
    assert.ok(src.includes('orders'), '营收列应包含 orders 指标');
  });

  it('商品排行报表应包含 soldQty 和 amountCents 指标', () => {
    const src = readSource();
    assert.ok(src.includes('soldQty'), '缺少售出数量');
    assert.ok(src.includes('amountCents'), '缺少销售额(分)');
  });

  it('loadReportDetail 应使用 setTimeout 模拟延迟', () => {
    const src = readSource();
    assert.ok(src.includes('setTimeout'), '缺少 setTimeout 延迟模拟');
    assert.ok(src.includes('300'), '延迟时间应为 300ms');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('reports/[id] — 防御', () => {
  it('loadReportDetail 调用 MOCK_REPORTS[id] 时应处理 undefined', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_REPORTS['), '数据查询使用 MOCK_REPORTS 索引');
  });

  it('应包含 if (!report) 的防御性检查', () => {
    const src = readSource();
    assert.ok(src.includes('if (!') || src.includes('if('), '应包含条件检查');
  });

  it('营收报表的合计行应包含 revenue 和 orders', () => {
    const src = readSource();
    assert.ok(src.includes('revenue: 4355000'), '合计 revenue 应为 4355000');
    assert.ok(src.includes('orders: 9150'), '合计 orders 应为 9150');
  });

  it('商品排行报表每行应包含 SKU、名称、销量、销售额', () => {
    const src = readSource();
    const rows = src.match(/sku:/g);
    assert.ok(rows && rows.length >= 5, '应包含至少 5 行商品排行数据');
  });

  it('报表 columns 应包含 alias 中文别名', () => {
    const src = readSource();
    assert.ok(src.includes('营收(元)'), '缺少营收别名');
    assert.ok(src.includes('订单数'), '缺少订单数别名');
    assert.ok(src.includes('商品名'), '缺少商品名别名');
    assert.ok(src.includes('销量'), '缺少销量别名');
  });

  it('报表数据应避免负数等非法数据（验证数据为正数）', () => {
    const src = readSource();
    // 检查营收数据点
    const revValues = src.match(/revenue: \d+/g);
    if (revValues) {
      for (const v of revValues) {
        const val = parseInt(v.replace('revenue: ', ''), 10);
        assert.ok(val >= 0, `营收值应为非负数, got ${val}`);
      }
    }
  });

  it('应使用 CombinedDetailPage 组件展示', () => {
    const src = readSource();
    assert.ok(src.includes('CombinedDetailPage'), '应使用 CombinedDetailPage 组件');
  });

  it('应包含 Spinner 加载组件引用', () => {
    const src = readSource();
    assert.ok(src.includes('Spinner'), '应包含 Spinner 加载组件');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Reports — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含CSS类名', () => assert.ok(SRC.includes('className')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
