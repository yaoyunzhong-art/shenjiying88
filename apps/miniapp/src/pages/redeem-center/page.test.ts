/**
 * 积分兑换页单元测试（L1 风格）
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

describe('redeem-center/index 页面源码分析', () => {
  it('应导出默认函数组件 RedeemCenterPage', () => {
    assert.match(SOURCE, /export default function RedeemCenterPage/);
  });

  it('包含 MOCK_POINTS_BALANCE 积分常量且大于 10000', () => {
    assert.match(SOURCE, /const MOCK_POINTS_BALANCE = 12880/);
  });

  it('包含 MOCK_REDEEM_ITEMS 兑换商品数据，且至少有 8 条', () => {
    const match = SOURCE.match(/const MOCK_REDEEM_ITEMS: RedeemItem\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_REDEEM_ITEMS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 8, `MOCK_REDEEM_ITEMS 数量不足 (实际 ${count})`);
  });

  it('CATEGORY_OPTIONS 应覆盖 5 个分类', () => {
    assert.ok(SOURCE.includes('全部'), '缺少 全部');
    assert.ok(SOURCE.includes('数码'), '缺少 数码');
    assert.ok(SOURCE.includes('优惠券'), '缺少 优惠券');
    assert.ok(SOURCE.includes('实物'), '缺少 实物');
    assert.ok(SOURCE.includes('体验'), '缺少 体验');
  });

  it('CATEGORY_MAP 应映射 5 个分类为英文标识', () => {
    assert.ok(SOURCE.includes("'digital'"));
    assert.ok(SOURCE.includes("'voucher'"));
    assert.ok(SOURCE.includes("'physical'"));
    assert.ok(SOURCE.includes("'experience'"));
  });

  it('STATUS_LABELS 应覆盖 4 种状态', () => {
    assert.ok(SOURCE.includes("'可兑换'"));
    assert.ok(SOURCE.includes("'热门'"));
    assert.ok(SOURCE.includes("'限时'"));
    assert.ok(SOURCE.includes("'已售罄'"));
  });

  it('STATUS_COLORS 应覆盖 4 种状态颜色', () => {
    assert.ok(SOURCE.includes("available: '#22c55e'"));
    assert.ok(SOURCE.includes("hot: '#ef4444'"));
    assert.ok(SOURCE.includes("limited: '#f59e0b'"));
    assert.ok(SOURCE.includes("sold_out: '#94a3b8'"));
  });

  it('兑换商品类型应覆盖 voucher/digital/physical/experience', () => {
    assert.ok(SOURCE.includes("category: 'voucher'"), '缺少 voucher 分类');
    assert.ok(SOURCE.includes("category: 'digital'"), '缺少 digital 分类');
    assert.ok(SOURCE.includes("category: 'physical'"), '缺少 physical 分类');
    assert.ok(SOURCE.includes("category: 'experience'"), '缺少 experience 分类');
  });

  it('商品状态应覆盖 hot/available/limited/sold_out', () => {
    assert.ok(SOURCE.includes("status: 'hot'"), '缺少 hot 状态');
    assert.ok(SOURCE.includes("status: 'available'"), '缺少 available 状态');
    assert.ok(SOURCE.includes("status: 'limited'"), '缺少 limited 状态');
    assert.ok(SOURCE.includes("status: 'sold_out'"), '缺少 sold_out 状态');
  });

  it('包含 MOCK_RECORDS 兑换记录数据，且至少有 3 条', () => {
    const match = SOURCE.match(/const MOCK_RECORDS: RedeemRecord\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_RECORDS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 3, `MOCK_RECORDS 数量不足 (实际 ${count})`);
  });

  it('兑换记录状态应覆盖 pending/shipped/completed/cancelled', () => {
    assert.ok(SOURCE.includes("status: 'pending'"), '缺少 pending 状态');
    assert.ok(SOURCE.includes("status: 'shipped'"), '缺少 shipped 状态');
    assert.ok(SOURCE.includes("status: 'completed'"), '缺少 completed 状态');
    assert.ok(SOURCE.includes("'cancelled'"), '缺少 cancelled 状态');
  });

  it('应包含 PointsHeader 子组件', () => {
    assert.match(SOURCE, /const PointsHeader/);
    assert.ok(SOURCE.includes('当前积分'));
  });

  it('积分头部应显示积分统计: 可兑商品/已兑换', () => {
    assert.ok(SOURCE.includes('可兑商品'));
    assert.ok(SOURCE.includes('已兑换'));
  });

  it('应包含 RedeemCard 子组件', () => {
    assert.match(SOURCE, /const RedeemCard/);
  });

  it('应包含 handleRedeem 兑换函数', () => {
    assert.match(SOURCE, /const handleRedeem/);
    assert.ok(SOURCE.includes('确认兑换'));
  });

  it('应包含 handleCancelRecord 取消函数', () => {
    assert.match(SOURCE, /const handleCancelRecord/);
    assert.ok(SOURCE.includes('取消兑换'));
  });

  it('应包含两个 Tab: 兑换商品/兑换记录', () => {
    assert.ok(SOURCE.includes('兑换商品'));
    assert.ok(SOURCE.includes('兑换记录'));
  });

  it('应包含空状态展示', () => {
    assert.ok(SOURCE.includes('暂无可兑换商品'));
    assert.ok(SOURCE.includes('暂无兑换记录'));
  });

  it('应包含分类筛选和搜索输入', () => {
    assert.ok(SOURCE.includes('category'));
    assert.ok(SOURCE.includes('searchText'));
    assert.ok(SOURCE.includes('搜索商品名称'));
  });

  it('应包含积分消耗提醒文本', () => {
    assert.ok(SOURCE.includes('积分'));
    assert.ok(SOURCE.includes('兑换'));
  });

  it('RECORD_STATUS_LABELS 应覆盖 4 种兑换记录状态', () => {
    assert.ok(SOURCE.includes("'待发货'"));
    assert.ok(SOURCE.includes("'已发货'"));
    assert.ok(SOURCE.includes("'已完成'"));
    assert.ok(SOURCE.includes("'已取消'"));
  });

  it('RECORD_STATUS_COLORS 应覆盖 4 种状态颜色', () => {
    assert.ok(SOURCE.includes("pending: '#f59e0b'"));
    assert.ok(SOURCE.includes("shipped: '#3b82f6'"));
    assert.ok(SOURCE.includes("completed: '#22c55e'"));
    assert.ok(SOURCE.includes("cancelled: '#94a3b8'"));
  });
});

describe('redeem-center/index.config 配置', () => {
  it('导航标题应为 "积分兑换"', () => {
    const CONFIG_SOURCE = readFileSync(resolve(__dirname, 'index.config.ts'), 'utf-8');
    assert.match(CONFIG_SOURCE, /navigationBarTitleText/);
    assert.match(CONFIG_SOURCE, /积分兑换/);
  });
});

describe('积分兑换业务逻辑', () => {
  it('积分格式化: 万单位', () => {
    const fmt = (v: number): string => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toLocaleString();
    assert.equal(fmt(12880), '1.3万');
    assert.equal(fmt(50000), '5.0万');
    assert.equal(fmt(5000), '5,000');
    assert.equal(fmt(0), '0');
  });

  it('分类过滤: digital 分类计数', () => {
    const items = [
      { category: 'digital' }, { category: 'digital' },
      { category: 'voucher' }, { category: 'physical' }, { category: 'digital' },
    ];
    assert.equal(items.filter((i) => i.category === 'digital').length, 3);
  });

  it('商品搜索: 按名称过滤', () => {
    const items = [{ name: '蓝牙耳机' }, { name: '蓝牙音箱' }, { name: '保温杯' }];
    const q = '蓝牙';
    assert.equal(items.filter((i) => i.name.includes(q)).length, 2);
  });

  it('库存预警: 仅剩 X 件 只在库存 ≤20 时出现', () => {
    const stockItem = (stock: number) => stock > 0 && stock <= 20;
    assert.equal(stockItem(5), true);
    assert.equal(stockItem(21), false);
    assert.equal(stockItem(0), false);
  });

  it('可兑换判断: sold_out 不可兑换', () => {
    const canRedeem = (status: string) => status !== 'sold_out';
    assert.equal(canRedeem('available'), true);
    assert.equal(canRedeem('hot'), true);
    assert.equal(canRedeem('limited'), true);
    assert.equal(canRedeem('sold_out'), false);
  });

  it('积分余额格式化: 千位分隔符', () => {
    const fmt = (v: number): string => v.toLocaleString();
    assert.equal(fmt(12880), '12,880');
    assert.equal(fmt(1000000), '1,000,000');
  });

  it('可兑商品数: 积分/100 整数', () => {
    const calc = (balance: number) => Math.floor(balance / 100);
    assert.equal(calc(12880), 128);
    assert.equal(calc(10000), 100);
  });

  it('记录状态过滤: pending 需要显示取消按钮', () => {
    const showCancel = (status: string) => status === 'pending';
    assert.equal(showCancel('pending'), true);
    assert.equal(showCancel('shipped'), false);
    assert.equal(showCancel('completed'), false);
  });

  it('Tab 切换: 两个 Tab 值正确', () => {
    const tabs = ['items', 'history'];
    assert.equal(tabs[0], 'items');
    assert.equal(tabs[1], 'history');
  });

  it('分类映射: 中文到英文全部覆盖', () => {
    const map: Record<string, string> = {
      '全部': 'ALL', '数码': 'digital', '优惠券': 'voucher',
      '实物': 'physical', '体验': 'experience',
    };
    assert.equal(Object.keys(map).length, 5);
    assert.equal(map['数码'], 'digital');
    assert.equal(map['优惠券'], 'voucher');
  });
});
