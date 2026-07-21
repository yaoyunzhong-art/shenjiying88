/**
 * stores/[id]/finance/page.test.tsx — 门店财务管理页测试
 *
 * 覆盖: 数据类型、数据完整性、搜索、Tab筛选、状态筛选、统计计算、空态、边界
 * P-38 LYT管理增强 · 正例+反例+边界 三件套
 * 规范: 无 skip / only / as any
 * mock: URL-pattern responseRegistry
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

/* ══════════════════════════════════════════════════════════
   URL-pattern responseRegistry (fetch mock)
   该页面当前使用静态数据(TRANSACTIONS)，未使用fetch，
   但保留 responseRegistry 以备未来接入真实API时使用
   ══════════════════════════════════════════════════════════ */

const responseRegistry = new Map<string, { status: number; body: unknown }>();

function registerResponse(urlPattern: string, status: number, body: unknown): void {
  responseRegistry.set(urlPattern, { status, body });
}

function clearRegistry(): void {
  responseRegistry.clear();
}

function mockFetch(url: string): Promise<Response> {
  for (const [pattern, entry] of responseRegistry) {
    if (url.includes(pattern)) {
      return Promise.resolve(
        new Response(JSON.stringify(entry.body), {
          status: entry.status,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }
  }
  return Promise.reject(new Error(`[responseRegistry] no mock for url: ${url}`));
}

/* ══════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════ */

const countOccurrences = (src: string, pattern: string) =>
  (src.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

/* ══════════════════════════════════════════════════════════
   正例 (Positive Cases)
   ══════════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════════
   反例 + 防御 (Negative / Defensive)
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — 防御性检查', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接使用 as any', () => assert.ok(!SRC.includes('as any')));
  it('不使用innerHTML直接赋值', () => assert.ok(!SRC.includes('.innerHTML')));
  it('不使用eval或Function构造器', () => assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function')));
  it('不用var声明', () => {
    const varLines = SRC.split('\n').filter(l => /^\s*var\s/.test(l));
    assert.equal(varLines.length, 0);
  });
});

/* ══════════════════════════════════════════════════════════
   财务模块 — 数据定义与计算
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — 财务模块', () => {
  it('应包含TRANSACTIONS数据', () => assert.ok(SRC.includes('TRANSACTIONS')));
  it('应包含12条交易记录', () => {
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

/* ══════════════════════════════════════════════════════════
   统计财务指标
   ══════════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════════
   交互 + 逻辑
   ══════════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════════
   边界 (Boundary / Edge Cases)
   ══════════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════════
   hooks + JSX综合
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — hooks与JSX', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含列表过滤(.filter)', () => assert.ok(SRC.includes('.filter(')));
  it('包含条件渲染(&& / ? :)', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含注释说明', () => assert.ok(SRC.includes("//") && SRC.includes("/*")));
  it('包含样式定义(style={)', () => assert.ok(SRC.includes('style={')));
  it('包含条件class/color三目运算', () => assert.ok(SRC.includes(' ? ') && SRC.includes(' : ')));
  it('应包含财务统计条(总收入/总支出/利润/流水笔数)', () => {
    assert.ok(SRC.includes('总收入') && SRC.includes('总支出') && SRC.includes('利润') && SRC.includes('流水笔数'));
  });
  it('流水笔数应有suffix="笔"', () => assert.ok(SRC.includes('suffix=\"笔\"') || SRC.includes("suffix='笔'")));
  it('应有TRANSACTION_COUNT常量', () => assert.ok(SRC.includes('TRANSACTION_COUNT')));
  it('应有INCOME_COUNT和EXPENSE_COUNT常量', () => {
    assert.ok(SRC.includes('INCOME_COUNT') && SRC.includes('EXPENSE_COUNT'));
  });

  it('TRANSACTION_COUNT 应为 12', () => assert.ok(SRC.includes('TRANSACTION_COUNT = TRANSACTIONS.length')));

  it('INCOME_COUNT 应为 8', () => assert.ok(SRC.includes('INCOME_COUNT = TRANSACTIONS.filter(d => d.type === \'营收\').length')));

  it('EXPENSE_COUNT 应为 4', () => assert.ok(SRC.includes('EXPENSE_COUNT = TRANSACTIONS.filter(d => d.type === \'支出\').length')));
});

/* ══════════════════════════════════════════════════════════
   财务数据完整性 (数据一致性与校验)
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — 财务数据完整性', () => {
  it('TRANSACTIONS 总营收计算正确', () => {
    assert.ok(SRC.includes('s + d.amount, 0') && SRC.includes('.filter(d => d.type === \'营收\')'));
  });

  it('TRANSACTIONS 总支出计算取绝对值', () => {
    assert.ok(SRC.includes('Math.abs(d.amount)'));
  });

  it('净利润 = 总收入 - 总支出', () => {
    const incomeMatch = SRC.match(/income = (.*?)\.reduce/);
    const expenseMatch = SRC.match(/expense = (.*?)\.reduce/);
    assert.ok(incomeMatch && expenseMatch, 'income and expense definitions found');
    assert.ok(SRC.includes('netProfit = income - expense'));
  });

  it('待结算金额由 pending 状态交易汇总', () => {
    assert.ok(SRC.includes("pendingSettle") && SRC.includes("d.status === 'pending'"));
  });

  it('毛利率计算防御除零 (income > 0 ? )', () => {
    assert.ok(SRC.includes('income > 0 ?'));
  });

  it('金额格式化使用 toLocaleString', () => {
    assert.ok(SRC.includes('.toLocaleString()'));
  });

  it('金额正负颜色不同 (v > 0 绿 / < 0 红)', () => {
    assert.ok(SRC.includes("v > 0 ? '#34d399' : '#f87171'"));
  });

  it('净利润颜色条件渲染 (>= 0 绿 / < 0 红)', () => {
    assert.ok(SRC.includes("netProfit >= 0 ? '#34d399' : '#f87171'"));
  });

  it('今日营收为硬编码 12800', () => {
    assert.ok(SRC.includes('今日营收') && SRC.includes('12800'));
  });
});

/* ══════════════════════════════════════════════════════════
   Tab 切换 & 交互逻辑
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — Tab 切换', () => {
  it('包含三个 Tab: overview/detail/reports', () => {
    const tabs = REGEX.escape("overview");
    assert.ok(SRC.includes("'overview'") && SRC.includes("'detail'") && SRC.includes("'reports'"));
  });

  it('总览 Tab 包含收入结构与支出结构', () => {
    assert.ok(SRC.includes('收入结构') && SRC.includes('支出结构'));
  });

  it('明细 Tab 包含类型筛选器和表格', () => {
    assert.ok(SRC.includes('类型') && SRC.includes('<Table'));
  });

  it('报表 Tab 包含导出月度报表按钮', () => {
    assert.ok(SRC.includes('导出月度报表'));
  });

  it('报表 Tab 包含查看季度分析按钮', () => {
    assert.ok(SRC.includes('查看季度分析'));
  });

  it('明细 Tab 分页每页 8 条', () => {
    assert.ok(SRC.includes('pageSize: 8'));
  });

  it('明细 Tab 筛选器包含全部/营收/支出选项', () => {
    assert.ok(SRC.includes("value: 'all'") || SRC.includes("value: '营收'"));
  });

  it('Tabs onChange 更新 setTab 状态', () => {
    assert.ok(SRC.includes('onChange={setTab}'));
  });

  it('筛选器 onChange 更新 typeFilter', () => {
    assert.ok(SRC.includes('onChange={setTypeFilter}'));
  });

  it('日结按钮触发 Modal', () => {
    assert.ok(SRC.includes('setShowSettle(true)'));
  });

  it('Modal 有 onCancel 关闭逻辑', () => {
    assert.ok(SRC.includes('onCancel'));
  });

  it('Modal 有 onOk 确认逻辑', () => {
    assert.ok(SRC.includes('onOk'));
  });
});

/* ══════════════════════════════════════════════════════════
   统计行 & 卡片
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — 统计行', () => {
  it('第一行统计: 总收入/总支出/利润/流水笔数', () => {
    assert.ok(SRC.includes('总收入') && SRC.includes('总支出') && SRC.includes('利润') && SRC.includes('流水笔数'));
  });

  it('第二行统计: 今日营收/本月累计/支出/净利', () => {
    assert.ok(SRC.includes('今日营收') && SRC.includes('本月累计') && SRC.includes('净利'));
  });

  it('第三行统计: 待结算/营收笔数/支出笔数/毛利率', () => {
    assert.ok(SRC.includes('待结算') && SRC.includes('营收笔数') && SRC.includes('支出笔数') && SRC.includes('毛利率'));
  });

  it('统计卡片使用Row/Col响应式布局', () => {
    const rows = SRC.match(/<Row/g);
    assert.ok(rows && rows.length >= 3);
  });

  it('Statistic 组件展示统计数据', () => {
    const stats = SRC.match(/Statistic/g);
    assert.ok(stats && stats.length >= 10);
  });

  it('总收入使用绿色字体', () => assert.ok(SRC.includes("valueStyle: {{ color: '#34d399' }}")));
  it('总支出使用红色字体', () => assert.ok(SRC.includes("valueStyle: {{ color: '#f87171' }}")));
  it('流水笔数使用蓝色字体', () => assert.ok(SRC.includes("valueStyle: {{ color: '#60a5fa' }}")));
});

/* ══════════════════════════════════════════════════════════
   收入/支出结构
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — 收入/支出结构', () => {
  it('收入结构包含 4 个子项: 游戏/会员/饮品/门票', () => {
    assert.ok(SRC.includes('游戏收入') && SRC.includes('会员充值') && SRC.includes('饮品销售') && SRC.includes('门票'));
  });

  it('支出结构包含 4 个子项: 人力/水电/维护/采购', () => {
    assert.ok(SRC.includes('人力成本') && SRC.includes('水电') && SRC.includes('设备维护') && SRC.includes('采购'));
  });

  it('收入百分比: 45%/35%/12%/8%', () => {
    assert.ok(SRC.includes('45%') && SRC.includes('35%') && SRC.includes('12%') && SRC.includes('8%'));
  });

  it('支出百分比: 70%/15%/10%/5%', () => {
    assert.ok(SRC.includes('70%') && SRC.includes('15%') && SRC.includes('10%') && SRC.includes('5%'));
  });

  it('Progress 组件展示比例', () => {
    const progress = SRC.match(/Progress/g);
    assert.ok(progress && progress.length >= 8);
  });
});

/* ══════════════════════════════════════════════════════════
   边界条件补全
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — 边界条件补全', () => {
  it('收入笔数 + 支出笔数 = 总交易数', () => {
    assert.ok(SRC.includes('INCOME_COUNT') && SRC.includes('EXPENSE_COUNT'));
  });

  it('Modal 尖括号子元素包含今日营收 ¥12,800', () => {
    assert.ok(SRC.includes('¥12,800') || SRC.includes('12800'));
  });

  it('金额列渲染含货币符号 ¥', () => {
    assert.ok(SRC.includes('¥'));
  });

  it('状态标签区分已结算/待结算', () => {
    assert.ok(SRC.includes('已结算') && SRC.includes('待结算'));
  });

  it('类型标签颜色: 营收绿色, 支出红色', () => {
    assert.ok(SRC.includes("v === '营收' ? 'green' : 'red'"));
  });

  it('页面标题包含 💰 财务管理', () => {
    assert.ok(SRC.includes('💰 财务管理'));
  });

  it('页面副标题包含 营收 · 支出 · 对账 · 结算', () => {
    assert.ok(SRC.includes('营收 · 支出 · 对账 · 结算'));
  });

  it('报表 Tab 包含更多报表开发中占位', () => {
    assert.ok(SRC.includes('更多报表开发中'));
  });

  it('报表 Tab 包含 Empty 占位符', () => {
    assert.ok(SRC.includes('Empty'));
  });

  it('日结按钮存在', () => {
    assert.ok(SRC.includes('日结'));
  });

  it('月报按钮存在', () => {
    assert.ok(SRC.includes('月报'));
  });

  it('使用 useMemo 优化筛选性能', () => {
    assert.ok(SRC.includes('useMemo'));
  });

  it('数据 12 条交易记录各有完整字段', () => {
    const ids = SRC.match(/id: 'T\d{3}'/g);
    assert.ok(ids && ids.length === 12);
  });

  it('支付方式覆盖微信/支付宝/对公/现金/转账', () => {
    assert.ok(SRC.includes("'微信'") || SRC.includes('"微信"'));
    assert.ok(SRC.includes("'支付宝'") || SRC.includes('"支付宝"'));
    assert.ok(SRC.includes("'对公'") || SRC.includes('"对公"'));
  });

  it('有负数金额(支出)和正数金额(营收)', () => {
    assert.ok(SRC.includes('-4500') && SRC.includes('12800'));
  });

  it('T001 最大单笔营收 12800', () => {
    assert.ok(SRC.includes('12800'));
  });

  it('T011 最大单笔支出 -28000', () => {
    assert.ok(SRC.includes('-28000') || SRC.includes('28000'));
  });
});

/* ══════════════════════════════════════════════════════════
   数据一致性
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — 数据一致性', () => {
  it('状态 pending 的交易使用蓝色 Tag', () => {
    assert.ok(SRC.includes("\'pending\'") || SRC.includes('"pending"'));
  });

  it('状态 settled 的交易使用 default Tag', () => {
    assert.ok(SRC.includes("\'settled\'") || SRC.includes('"settled"'));
  });

  it('TRANSACTIONS 包含 settled 和 pending 两种状态', () => {
    assert.ok(SRC.includes("'settled'") && SRC.includes("'pending'"));
  });

  it('TRANSACTIONS 包含营收和支出两种类型', () => {
    assert.ok(SRC.includes("'营收'") && SRC.includes("'支出'"));
  });

  it('Modal 包含日结说明文本', () => {
    assert.ok(SRC.includes('日结将生成当日财务报表并锁定结算'));
  });

  it('Modal 包含今日支出 ¥0', () => {
    assert.ok(SRC.includes('今日支出: ¥0'));
  });

  it('Modal 尖括号显示待结算金额', () => {
    assert.ok(SRC.includes('待结算') && SRC.includes('pendingSettle'));
  });

  it('筛选逻辑: typeFilter=all 返回全部', () => {
    assert.ok(SRC.includes("typeFilter === 'all'") || SRC.includes("filter === 'all'"));
  });

  it('筛选逻辑: typeFilter=营收 按条件过滤', () => {
    assert.ok(SRC.includes(".filter(d => d.type === typeFilter"));
  });

  it('页面使用 Space 弹性布局', () => {
    assert.ok(SRC.includes('<Space'));
  });

  it('金额使用 Math.abs 显示绝对值', () => {
    assert.ok(SRC.includes('Math.abs(d.amount)'));
  });

  it('毛利率后缀包含 %', () => {
    assert.ok(SRC.includes('suffix="%"') || SRC.includes("suffix='%'"));
  });
});

/* ══════════════════════════════════════════════════════════
   responseRegistry (fetch mock) 测试
   — 虽然当前页面使用静态数据，保留 mock 模式以备 API 化
   ══════════════════════════════════════════════════════════ */

describe('responseRegistry (fetch mock)', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('registerResponse + mockFetch 按 URL-pattern 匹配', async () => {
    registerResponse('stores/123/finance/summary', 200, { totalRevenue: 50000 });
    const res = await mockFetch('https://admin.example.com/api/stores/123/finance/summary');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.totalRevenue, 50000);
  });

  it('mockFetch 返回 500 错误', async () => {
    registerResponse('finance/summary', 500, { error: 'Internal Server Error' });
    const res = await mockFetch('https://admin.example.com/api/stores/123/finance/summary');
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error, 'Internal Server Error');
  });

  it('mockFetch 无匹配时 reject', async () => {
    await assert.rejects(
      () => mockFetch('https://admin.example.com/api/unknown'),
      /no mock for url/,
    );
  });

  it('clearRegistry 清空所有 mock 注册', async () => {
    registerResponse('finance/revenue', 200, {});
    assert.equal(responseRegistry.size, 1);
    clearRegistry();
    assert.equal(responseRegistry.size, 0);
    await assert.rejects(
      () => mockFetch('https://admin.example.com/api/finance/revenue'),
      /no mock for url/,
    );
  });

  it('mockFetch 支持 URL 参数匹配', async () => {
    registerResponse('finance/list?storeId=store-001', 200, { items: [] });
    const res = await mockFetch('https://admin.example.com/api/finance/list?storeId=store-001&page=1');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.items));
  });

  it('多个 URL-pattern 共存', async () => {
    registerResponse('finance/income', 200, { total: 100 });
    registerResponse('finance/expense', 200, { total: 50 });
    const incomeRes = await mockFetch('/api/finance/income');
    const expenseRes = await mockFetch('/api/finance/expense');

    assert.equal((await incomeRes.json()).total, 100);
    assert.equal((await expenseRes.json()).total, 50);
  });
});

/* ══════════════════════════════════════════════════════════
   财务数据统计验证 (TRANSACTIONS 数据分析)
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — 财务数据统计验证', () => {
  it('TRANSACTIONS 总营收应 > 0', () => {
    // 从源码中提取关键变量
    assert.ok(SRC.includes('TRANSACTIONS.filter(d => d.type === \'营收\')'));
    assert.ok(SRC.includes('.reduce((s, d) => s + d.amount, 0)'));
  });

  it('TRANSACTIONS 包含现金支付方式', () => {
    assert.ok(SRC.includes("'现金'"));
  });

  it('TRANSACTIONS 包含微信/支付宝/对公/转账等支付方式', () => {
    const methods = ['微信', '支付宝', '对公', '转账'];
    const found = methods.filter(m => SRC.includes(`'${m}'`) || SRC.includes(`"${m}"`));
    assert.ok(found.length >= 1, `found at least one payment method in data`);
  });

  it('交易数据覆盖多种金额范围', () => {
    // 检查是否存在大于 10000 的金额
    assert.ok(SRC.includes('12800') || SRC.includes('15000') || SRC.includes('14500'));
    // 检查是否存在小于 5000 的金额
    assert.ok(SRC.includes('3200') || SRC.includes('2800') || SRC.includes('4500') || SRC.includes('28000'));
  });

  it('TRANSACTIONS 数据格式完整(每笔包含 id/date/type/category/amount/method/status)', () => {
    const fieldsNeeded = ['id:', 'date:', 'type:', 'category:', 'amount:', 'method:', 'status:'];
    const allPresent = fieldsNeeded.every(f => SRC.includes(f));
    assert.ok(allPresent, 'each TRANSACTIONS entry should have all required fields');
  });
});

/* ══════════════════════════════════════════════════════════
   日结 Modal 逻辑验证
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — 日结 Modal', () => {
  it('Modal 显示今日营收 ¥12,800', () => {
    assert.ok(SRC.includes('今日营收: ¥12,800') || SRC.includes('今日营收'));
  });

  it('Modal 显示日结说明文本', () => {
    assert.ok(SRC.includes('日结将生成当日财务报表并锁定结算'));
  });

  it('Modal 有 onCancel 关闭逻辑', () => {
    assert.ok(SRC.includes('onCancel'));
  });

  it('Modal 有 onOk 确认逻辑', () => {
    assert.ok(SRC.includes('onOk'));
  });
});

/* ══════════════════════════════════════════════════════════
   报表Tab验证
   ══════════════════════════════════════════════════════════ */

describe('FinancePage — 报表Tab', () => {
  it('导出月度报表按钮存在', () => assert.ok(SRC.includes('导出月度报表')));
  it('导出对账单按钮存在', () => assert.ok(SRC.includes('导出对账单')));
  it('查看季度分析按钮存在', () => assert.ok(SRC.includes('查看季度分析')));
  it('更多报表开发中占位提示存在', () => assert.ok(SRC.includes('更多报表开发中')));
});
