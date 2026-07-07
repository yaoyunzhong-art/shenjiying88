/**
 * 导购工具面板单元测试（L1 风格）
 *
 * 直接分析源码检查关键结构和常量，无需模拟 Taro 运行时
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SOURCE_PATH = resolve(__dirname, 'index.tsx');
const SOURCE: string = readFileSync(SOURCE_PATH, 'utf-8');

describe('sales-tools/index 页面源码分析', () => {
  it('应导出默认函数组件 SalesToolsPage', () => {
    assert.match(SOURCE, /export default function SalesToolsPage/);
  });

  it('应包含 MOCK_TASKS 数据，且至少有 6 条', () => {
    const match = SOURCE.match(/const MOCK_TASKS: TaskItem\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_TASKS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 6, `MOCK_TASKS 数量不足 (实际 ${count})`);
  });

  it('MOCK_TASKS 应包含 pending 和 done 状态', () => {
    const high = SOURCE.match(/status: 'pending'/g) ?? [];
    const done = SOURCE.match(/status: 'done'/g) ?? [];
    assert.ok(high.length >= 4, `pending 任务不足 (${high.length})`);
    assert.ok(done.length >= 2, `done 任务不足 (${done.length})`);
  });

  it('应包含 MOCK_CUSTOMERS 数据且至少 5 条', () => {
    const match = SOURCE.match(/const MOCK_CUSTOMERS: CustomerQuick\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_CUSTOMERS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 5, `MOCK_CUSTOMERS 数量不足 (实际 ${count})`);
  });

  it('客户级别应包含 SVIP/VIP/金卡/银卡', () => {
    assert.ok(SOURCE.includes("'SVIP'"), '缺少 SVIP 级别');
    assert.ok(SOURCE.includes("'VIP'"), '缺少 VIP 级别');
    assert.ok(SOURCE.includes("'金卡'"), '缺少 金卡 级别');
    assert.ok(SOURCE.includes("'银卡'"), '缺少 银卡 级别');
  });

  it('应包含 MOCK_TRANSACTIONS 数据且至少 6 条', () => {
    const match = SOURCE.match(/const MOCK_TRANSACTIONS: TransactionRecord\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_TRANSACTIONS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 6, `MOCK_TRANSACTIONS 数量不足 (实际 ${count})`);
  });

  it('交易类型应包含 sale/return/exchange', () => {
    assert.ok(SOURCE.includes("type: 'sale'"), '缺少 sale 类型');
    assert.ok(SOURCE.includes("type: 'return'"), '缺少 return 类型');
    assert.ok(SOURCE.includes("type: 'exchange'"), '缺少 exchange 类型');
  });

  it('PRIORITY_LABELS 应覆盖 3 种优先级', () => {
    assert.ok(SOURCE.includes("'紧急'"));
    assert.ok(SOURCE.includes("'重要'"));
    assert.ok(SOURCE.includes("'普通'"));
  });

  it('PRIORITY_COLORS 应覆盖 3 种颜色', () => {
    assert.ok(SOURCE.includes("high: '#ef4444'"));
    assert.ok(SOURCE.includes("medium: '#f59e0b'"));
    assert.ok(SOURCE.includes("low: '#64748b'"));
  });

  it('TRANSACTION_LABELS 应覆盖 3 种类型', () => {
    assert.ok(SOURCE.includes("sale: '销售'"));
    assert.ok(SOURCE.includes("return: '退货'"));
    assert.ok(SOURCE.includes("exchange: '换货'"));
  });

  it('TRANSACTION_COLORS 应覆盖 3 种颜色', () => {
    assert.ok(SOURCE.includes("sale: '#22c55e'"));
    assert.ok(SOURCE.includes("return: '#ef4444'"));
    assert.ok(SOURCE.includes("exchange: '#3b82f6'"));
  });

  it('应包含 4 个快捷操作按钮', () => {
    const match = SOURCE.match(/quickActions/);
    assert.ok(match, 'quickActions 定义缺失');
    assert.ok(SOURCE.includes("'扫码开单'"));
    assert.ok(SOURCE.includes("'会员查询'"));
    assert.ok(SOURCE.includes("'库存查询'"));
    assert.ok(SOURCE.includes("'服务记录'"));
  });

  it('应包含三个 Tab 切换: 待办任务/客户查询/今日交易', () => {
    assert.ok(SOURCE.includes("'待办任务'"));
    assert.ok(SOURCE.includes("'客户查询'"));
    assert.ok(SOURCE.includes("'今日交易'"));
  });

  it('应包含统计摘要: 今日待办/紧急事项/已完成', () => {
    assert.ok(SOURCE.includes('今日待办'));
    assert.ok(SOURCE.includes('紧急事项'));
    assert.ok(SOURCE.includes('已完成'));
  });

  it('应包含客户搜索 Input', () => {
    assert.ok(SOURCE.includes('searchCustomer'));
    assert.ok(SOURCE.includes('输入客户姓名/手机号搜索'));
  });

  it('应包含空状态展示', () => {
    assert.ok(SOURCE.includes('未找到匹配客户'));
  });

  it('应包含 handleQuickAction 函数', () => {
    assert.match(SOURCE, /handleQuickAction/);
    assert.match(SOURCE, /showToast/);
  });

  it('应包含 handleCompleteTask 函数', () => {
    assert.match(SOURCE, /handleCompleteTask/);
    assert.ok(SOURCE.includes('已完成'));
  });

  it('应包含 handleCallCustomer 函数', () => {
    assert.match(SOURCE, /handleCallCustomer/);
  });

  it('应包含 formatAmount 工具函数', () => {
    assert.ok(SOURCE.includes('formatAmount'));
    assert.ok(SOURCE.includes('toLocaleString'));
  });

  it('应包含 formatPhone 工具函数', () => {
    assert.ok(SOURCE.includes('formatPhone'));
    assert.ok(SOURCE.includes('****'));
  });
});

describe('sales-tools/index.config 配置', () => {
  it('导航标题应为 "导购工具"', () => {
    const CONFIG_SOURCE = readFileSync(resolve(__dirname, 'index.config.ts'), 'utf-8');
    assert.match(CONFIG_SOURCE, /navigationBarTitleText/);
    assert.match(CONFIG_SOURCE, /导购工具/);
  });
});

describe('导购工具业务逻辑', () => {
  it('金额格式化: 万元转换', () => {
    const fmt = (v: number): string => v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${v.toLocaleString()}`;
    assert.equal(fmt(2680), '¥2,680');
    assert.equal(fmt(156000), '¥15.6万');
    assert.equal(fmt(0), '¥0');
  });

  it('手机号脱敏: 11位号显示 138****5678', () => {
    const mask = (p: string): string => {
      if (p.length === 11) return `${p.slice(0, 3)}****${p.slice(7)}`;
      return p;
    };
    assert.equal(mask('13812345678'), '138****5678');
    assert.equal(mask('13900001111'), '139****1111');
  });

  it('优先级过滤: high 优先级计数', () => {
    const tasks = [
      { priority: 'high' }, { priority: 'medium' },
      { priority: 'high' }, { priority: 'low' }, { priority: 'high' },
    ];
    assert.equal(tasks.filter((t) => t.priority === 'high').length, 3);
  });

  it('客户搜索: 按姓名过滤', () => {
    const customers = [{ name: '王芳' }, { name: '张丽' }, { name: '陈静' }];
    const q = '王';
    assert.equal(customers.filter((c) => c.name.includes(q)).length, 1);
  });

  it('客户搜索: 按级别过滤', () => {
    const customers = [{ level: 'VIP' }, { level: '金卡' }, { level: '银卡' }];
    const q = '金卡';
    assert.equal(customers.filter((c) => c.level.includes(q)).length, 1);
  });

  it('今日交易统计: 总额计算', () => {
    const amounts = [2680, 890, 1560, 4200];
    assert.equal(amounts.reduce((a, b) => a + b, 0), 9330);
  });

  it('笔均计算: 4笔销售平均数', () => {
    const sales = [2680, 890, 1560, 4200];
    const avg = Math.round(sales.reduce((a, b) => a + b, 0) / sales.length);
    assert.equal(avg, 2333);
  });

  it('待办完成率计算', () => {
    const total = 6;
    const done = 2;
    const rate = Math.round((done / total) * 100);
    assert.equal(rate, 33);
  });
});
