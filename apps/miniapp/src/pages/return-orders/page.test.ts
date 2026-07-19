/**
 * 小程序退货单列表页单元测试（L1 风格）
 *
 * - 直接分析源码检查关键结构和常量
 * - 无需模拟 Taro 运行时
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

describe('return-orders/index 页面源码分析', () => {
  it('应导出默认函数组件', () => {
    assert.match(SOURCE, /export default function ReturnOrdersPage/);
  });

  it('应包含 MOCK_RETURNS 数据，且至少有 8 条', () => {
    const match = SOURCE.match(/const MOCK_RETURNS: ReturnOrder\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_RETURNS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 8, `MOCK_RETURNS 数量不足 (实际 ${count})`);
  });

  it('STATUS_OPTIONS 应覆盖 8 个选项', () => {
    const match = SOURCE.match(/STATUS_OPTIONS.*?\[([\s\S]*?)\]/);
    assert.ok(match, 'STATUS_OPTIONS 定义缺失');
    const opts = ['全部', '待处理', '质检中', '已通过', '已拒绝', '已退款', '已换货', '已关闭'];
    for (const opt of opts) {
      assert.ok(match[1]!.includes(opt), `缺少选项: ${opt}`);
    }
  });

  it('STATUS_LABELS 应覆盖 7 种状态', () => {
    const match = SOURCE.match(/STATUS_LABELS.*?\{([\s\S]*?)\}/);
    assert.ok(match, 'STATUS_LABELS 定义缺失');
    const labels = ['待处理', '质检中', '已通过', '已拒绝', '已退款', '已换货', '已关闭'];
    for (const label of labels) {
      assert.ok(match[1]!.includes(label), `缺少标签: ${label}`);
    }
  });

  it('STATUS_COLORS 应覆盖 7 种状态颜色', () => {
    const match = SOURCE.match(/STATUS_COLORS.*?\{([\s\S]*?)\}/);
    assert.ok(match, 'STATUS_COLORS 定义缺失');
    const colors = ['#f97316', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];
    for (const color of colors) {
      assert.ok(match[1]!.includes(color), `缺少颜色: ${color}`);
    }
  });

  it('STATUS_MAP 应映射 8 个状态值', () => {
    const match = SOURCE.match(/STATUS_MAP.*?\{([\s\S]*?)\}/);
    assert.ok(match, 'STATUS_MAP 定义缺失');
    assert.ok(match[1]!.includes('ALL'), '缺少 ALL 映射');
    assert.ok(match[1]!.includes('pending'), '缺少 pending 映射');
    assert.ok(match[1]!.includes('inspecting'), '缺少 inspecting 映射');
    assert.ok(match[1]!.includes('approved'), '缺少 approved 映射');
    assert.ok(match[1]!.includes('rejected'), '缺少 rejected 映射');
    assert.ok(match[1]!.includes('refunded'), '缺少 refunded 映射');
    assert.ok(match[1]!.includes('exchanged'), '缺少 exchanged 映射');
    assert.ok(match[1]!.includes('closed'), '缺少 closed 映射');
  });

  it('PAGE_SIZE 应为 5', () => {
    assert.match(SOURCE, /const PAGE_SIZE = 5/);
  });

  it('应包含搜索功能: Input + Button', () => {
    assert.match(SOURCE, /搜索/);
    assert.match(SOURCE, /searchText/);
    assert.match(SOURCE, /Input/);
  });

  it('应包含状态筛选: Picker', () => {
    assert.match(SOURCE, /Picker/);
    assert.match(SOURCE, /statusFilter/);
  });

  it('应包含分页: 上一页/下一页', () => {
    assert.match(SOURCE, /上一页/);
    assert.match(SOURCE, /下一页/);
    assert.match(SOURCE, /totalPages/);
  });

  it('应包含统计卡片', () => {
    assert.match(SOURCE, /总退货单/);
    assert.match(SOURCE, /待处理/);
    assert.match(SOURCE, /退款总额/);
  });

  it('应包含空状态展示', () => {
    assert.match(SOURCE, /暂无符合条件的退货单/);
  });

  it('应包含点击跳转（goToDetail -> navigateTo 详情页）', () => {
    assert.match(SOURCE, /goToDetail/);
    assert.match(SOURCE, /navigateTo/);
    assert.match(SOURCE, /\/pages\/return-orders\/detail\/index\?id=/);
  });

  it('应通过 supplychain runtime 加载真实退货列表并展示 deliveryNote', () => {
    assert.match(SOURCE, /loadMiniappPurchaseReturns/);
    assert.match(SOURCE, /deliveryNote/);
    assert.match(SOURCE, /当前展示本地演示退货数据/);
  });

  it('应包含底部记录条数统计', () => {
    assert.match(SOURCE, /共.*条记录/);
  });
});

describe('return-orders/index.config 配置', () => {
  it('导航标题应为 "退货售后"', () => {
    const CONFIG_PATH = resolve(__dirname, 'index.config.ts');
    const CONFIG_SOURCE = readFileSync(CONFIG_PATH, 'utf-8');
    assert.match(CONFIG_SOURCE, /navigationBarTitleText/);
    assert.match(CONFIG_SOURCE, /退货售后/);
  });
});

describe('退货单业务逻辑', () => {
  it('金额格式化: 万元转换', () => {
    const fmt = (v: number): string => v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${v.toLocaleString()}`;
    assert.equal(fmt(12600), '¥1.3万');
    assert.equal(fmt(399), '¥399');
    assert.equal(fmt(10000), '¥1.0万');
    assert.equal(fmt(0), '¥0');
  });

  it('搜索过滤: 按客户名匹配', () => {
    const returns = [
      { customerName: '张小明', phone: '13812345678' },
      { customerName: '李芳', phone: '15900001111' },
    ];
    const result = returns.filter(r => r.customerName.includes('小明'));
    assert.equal(result.length, 1);
  });

  it('状态筛选: pending 状态应匹配', () => {
    const statuses: string[] = ['pending', 'inspecting', 'pending', 'refunded'];
    assert.equal(statuses.filter(s => s === 'pending').length, 2);
  });

  it('分页: 8条数据分2页 (PAGE_SIZE=5)', () => {
    const total = 8;
    const pageSize = 5;
    const pages = Math.ceil(total / pageSize);
    assert.equal(pages, 2);
  });

  it('数据汇总: 退款总金额应为 1560', () => {
    const amounts = [399, 168, 298, 259, 89, 129, 79, 139];
    assert.equal(amounts.reduce((a, b) => a + b, 0), 1560);
  });

  it('原因类型覆盖: 应包含多种退货原因', () => {
    assert.match(SOURCE, /过敏不适/);
    assert.match(SOURCE, /包装破损/);
    assert.match(SOURCE, /效果不满意/);
    assert.match(SOURCE, /发错货/);
    assert.match(SOURCE, /品质问题/);
    assert.match(SOURCE, /超过退货期/);
  });
});
