import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const countOccurrences = (src: string, pattern: string) =>
  (src.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

// ─── 正例 (Positive Cases) ───────────────────────────────────────────────────
describe('FinancePage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function FinancePage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
  it('应包含PageShell作为外层容器', () => assert.ok(SRC.includes('PageShell')));
  it('应包含Card组件', () => assert.ok(SRC.includes('<Card')));
  it('应包含Statistic组件展示统计', () => assert.ok(SRC.includes('Statistic')));
  it('应包含Table组件展示明细', () => assert.ok(SRC.includes('Table')));
  it('应包含Modal组件用于日结', () => assert.ok(SRC.includes('Modal')));
  it('应包含Tabs组件切换视图', () => assert.ok(SRC.includes('Tabs')));
  it('应包含message.success调用', () => assert.ok(SRC.includes('message.success')));
});

// ─── 反例 + 防御 (Negative / Defensive) ──────────────────────────────────────
describe('FinancePage — 防御性检查', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接使用 as any', () => assert.ok(!SRC.includes('as any')));
  it('不使用innerHTML直接赋值', () => assert.ok(!SRC.includes('.innerHTML')));
  it('不使用eval或Function构造器', () => assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function')));
  it('不用var声明', () => {
    // 允许 let/const 和文件内的 var 注释
    const varLines = SRC.split('\n').filter(l => /^\s*var\s/.test(l));
    assert.equal(varLines.length, 0);
  });
});

// ─── 财务模块 — 数据定义与计算 ────────────────────────────────────────────
describe('FinancePage — 财务模块', () => {
  it('应包含TRANSACTIONS数据', () => assert.ok(SRC.includes('TRANSACTIONS')));
  it('应包含12条交易记录', () => {
    // count TRANSACTIONS entries
    const match = SRC.match(/\{ id:/g);
    assert.ok(match && match.length >= 12);
  });
  it('应使用useMemo筛选', () => assert.ok(SRC.includes('useMemo')));
  it('应支持overview/detail/reports三个Tab', () => {
    assert.ok(SRC.includes("'overview'") && SRC.includes("'detail'") && SRC.includes("'reports'"));
  });
  it('TRANSACTIONS应包含营收和支出两种类型', () => {
    assert.ok(SRC.includes("'营收'") || SRC.includes("type: '营收'"));
    assert.ok(SRC.includes("'支出'") || SRC.includes("type: '支出'"));
  });
  it('TRANSACTIONS应包含settled和pending两种状态', () => {
    assert.ok(SRC.includes("'settled'") && SRC.includes("'pending'"));
  });
  it('应有6种不同分类(游戏/饮品/电费/会员/门票/人力)', () => {
    const cats = ['游戏', '饮品', '电费', '会员', '门票', '人力'];
    const found = cats.filter(c => SRC.includes(c));
    assert.ok(found.length >= 4, `found only ${found.length}/6: ${found.join(', ')}`);
  });
  it('COLUMNS应包含日期/类型/分类/金额/支付/状态六列', () => {
    const cols = ['日期', '类型', '分类', '金额', '支付方式', '状态'];
    const found = cols.filter(c => SRC.includes(c));
    assert.ok(found.length >= 5);
  });
});

// ─── 统计财务指标 ─────────────────────────────────────────────────────────
describe('FinancePage — 统计财务指标', () => {
  it('应计算营收', () => assert.ok(SRC.includes('income') && SRC.includes('expense')));
  it('应计算净利润', () => assert.ok(SRC.includes('netProfit')));
  it('应计算毛利率', () => assert.ok(SRC.includes('毛利率') || SRC.includes('margin')));
  it('应展示收入/支出结构', () => assert.ok(SRC.includes('Progress')));
  it('应展示收入结构各部分(游戏/会员/饮品/门票)', () => {
    assert.ok(SRC.includes('45%') && SRC.includes('35%') && SRC.includes('12%') && SRC.includes('8%'));
  });
  it('应展示支出结构各部分(人力/水电/维护/采购)', () => {
    assert.ok(SRC.includes('70%') && SRC.includes('15%') && SRC.includes('10%') && SRC.includes('5%'));
  });
  it('应计算待结算金额', () => assert.ok(SRC.includes('pendingSettle')));
});

// ─── 交互 + 逻辑 ─────────────────────────────────────────────────────────
describe('FinancePage — 交互', () => {
  it('应包含日结Modal', () => assert.ok(SRC.includes('showSettle') && SRC.includes('Modal')));
  it('应支持类型筛选', () => assert.ok(SRC.includes('typeFilter')));
  it('应展示统计卡片(Row/Col/Statistic)', () => {
    const statCount = countOccurrences(SRC, 'Statistic');
    assert.ok(statCount >= 10, `Statistic count: ${statCount}`);
  });
  it('应包含付款方式筛选器(Select)', () => assert.ok(SRC.includes('<Select')));
  it('应包含onClick事件处理器', () => {
    assert.ok(SRC.includes('onClick=') || SRC.includes('onOk={'));
  });
  it('应包含onChange事件处理器', () => assert.ok(SRC.includes('onChange={')));
  it('应支持"导出月度报表"按钮', () => assert.ok(SRC.includes('导出月度报表')));
  it('应支持"导出对账单"按钮', () => assert.ok(SRC.includes('导出对账单')));
  it('应包含Empty占位提示', () => assert.ok(SRC.includes('Empty')));
});

// ─── 边界 (Boundary / Edge Cases) ─────────────────────────────────────────
describe('FinancePage — 边界条件', () => {
  it('净利应有正负两色(>=0绿/<0红)', () => {
    assert.ok(SRC.includes("netProfit >= 0 ? '#34d399' : '#f87171'"));
  });
  it('毛利计算应防止除零(income=0时显示0)', () => {
    assert.ok(SRC.includes("income > 0 ?"));
  });
  it('金额应有格式化(toLocaleString)', () => {
    assert.ok(SRC.includes('.toLocaleString()'));
  });
  it('应处理空数据: Empty占位符', () => assert.ok(SRC.includes('Empty')));
  it('营收金额正数绿色/支出金额负数红色', () => {
    assert.ok(SRC.includes("v > 0 ? '#34d399' : '#f87171'"));
  });
  it('状态字段应有结算/待结算两种标记', () => {
    assert.ok(SRC.includes('已结算') && SRC.includes('待结算'));
  });
  it('类型Tag应有绿(营收)/红(支出)两色', () => {
    assert.ok(SRC.includes("v === '营收' ? 'green' : 'red'"));
  });
  it('分页参数应为每页8条', () => assert.ok(SRC.includes('pageSize: 8')));
  it('交易总数应为12', () => {
    const match = SRC.match(/\{ id:/g);
    assert.ok(match, 'TRANSACTIONS not found');
    assert.equal(match.length, 12, `expected 12 transactions, got ${match.length}`);
  });
  it('营收笔数/支出笔数应展示', () => {
    assert.ok(SRC.includes('营收笔数') && SRC.includes('支出笔数'));
  });
});

// ─── hooks + JSX综合 ─────────────────────────────────────────────────────
describe('FinancePage — hooks与JSX', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含列表过滤(.filter)', () => assert.ok(SRC.includes('.filter(')));
  it('包含条件渲染(&& / ? :)', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含注释说明', () => assert.ok(SRC.includes("//") && SRC.includes("/*")));
  it('包含样式定义(style={)', () => assert.ok(SRC.includes('style={')));
  it('包含条件class/color三目运算', () => assert.ok(SRC.includes(' ? ') && SRC.includes(' : ')));

  // 新增财务统计条校验
  it('应包含财务统计条(总收入/总支出/利润/流水笔数)', () => {
    assert.ok(SRC.includes('总收入') && SRC.includes('总支出') && SRC.includes('利润') && SRC.includes('流水笔数'));
  });
  it('流水笔数应有suffix="笔"', () => assert.ok(SRC.includes('suffix=\"笔\"') || SRC.includes("suffix='笔'")));
  it('应有TRANSACTION_COUNT常量', () => assert.ok(SRC.includes('TRANSACTION_COUNT')));
  it('应有INCOME_COUNT和EXPENSE_COUNT常量', () => {
    assert.ok(SRC.includes('INCOME_COUNT') && SRC.includes('EXPENSE_COUNT'));
  });
});
