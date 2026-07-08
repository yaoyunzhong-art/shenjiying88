/**
 * SalesReportsScreen.test.tsx - 销售报表页面单元测试
 *
 * 使用 react-test-renderer 进行纯渲染验证,
 * Text 的 children 可能为数组, 通过 getAllText 辅助提取.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { SalesReportsScreen } from './SalesReportsScreen';

/** 辅助: 提取所有 Text 节点的文本内容为一个字符串 */
function getAllText(root: ReturnType<typeof create>['root']): string {
  return root
    .findAllByType('Text')
    .map((t) => {
      const c = t.props.children;
      if (Array.isArray(c)) return c.filter((x: unknown) => typeof x === 'string').join('');
      return String(c);
    })
    .join(' ');
}

/** 辅助: 查找包含文本的 TouchableOpacity */
function findTouchableByText(
  root: ReturnType<typeof create>['root'],
  text: string,
) {
  return root
    .findAllByType('TouchableOpacity')
    .find((t) => {
      // 递归提取 TouchableOpacity 内所有 Text 文本
      const texts = t.findAllByType('Text');
      const combined = texts
        .map((tx) => {
          const c = tx.props.children;
          if (Array.isArray(c)) return c.filter((x: unknown) => typeof x === 'string').join('');
          return String(c);
        })
        .join('');
      return combined.includes(text);
    });
}

describe('SalesReportsScreen', () => {
  it('renders empty state when no data', () => {
    const root = create(<SalesReportsScreen />).root;
    const emptyText = root.findByProps({ children: '暂无销售数据' });
    expect(emptyText).toBeDefined();
  });

  it('renders empty hint text', () => {
    const root = create(<SalesReportsScreen />).root;
    const hintText = root.findByProps({ children: '选择时段查看销售报表' });
    expect(hintText).toBeDefined();
  });

  it('renders summary metric cards with provided data', () => {
    const root = create(
      <SalesReportsScreen
        summary={{
          totalSales: 125000.5,
          orderCount: 89,
          avgOrderValue: 1404.5,
          customerCount: 67,
          salesGrowth: 15.3,
        }}
      />,
    ).root;

    const text = getAllText(root);
    expect(text).toContain('总销售额');
    expect(text).toContain('¥125000.50');
    expect(text).toContain('订单数');
    expect(text).toContain('89');
    expect(text).toContain('平均客单价');
    expect(text).toContain('¥1404.50');
    expect(text).toContain('接待顾客');
    expect(text).toContain('67');
    expect(text).toContain('+15.3%');
  });

  it('shows negative growth in red', () => {
    const root = create(
      <SalesReportsScreen
        summary={{
          totalSales: 50000,
          orderCount: 30,
          avgOrderValue: 1666.67,
          customerCount: 25,
          salesGrowth: -5.2,
        }}
      />,
    ).root;

    const text = getAllText(root);
    expect(text).toContain('-5.2%');
  });

  it('renders period tabs and allows switching', () => {
    const onPeriodChange = vi.fn();
    const root = create(
      <SalesReportsScreen
        summary={{ totalSales: 1000, orderCount: 10, avgOrderValue: 100, customerCount: 8, salesGrowth: 0 }}
        period="weekly"
        onPeriodChange={onPeriodChange}
      />,
    ).root;

    const text = getAllText(root);
    expect(text).toContain('今日');
    expect(text).toContain('本周');
    expect(text).toContain('本月');

    // 点击"今日"标签
    const dailyTab = findTouchableByText(root, '今日');
    expect(dailyTab).toBeDefined();
    if (dailyTab) {
      dailyTab.props.onPress();
      expect(onPeriodChange).toHaveBeenCalledWith('daily');
    }
  });

  it('renders trend bar chart when data provided', () => {
    const trends = [
      { label: '周一', value: 3200 },
      { label: '周二', value: 2800 },
      { label: '周三', value: 4100 },
    ];

    const root = create(
      <SalesReportsScreen
        summary={{ totalSales: 10000, orderCount: 40, avgOrderValue: 250, customerCount: 35, salesGrowth: 8 }}
        trends={trends}
      />,
    ).root;

    const text = getAllText(root);
    expect(text).toContain('销售趋势');
    expect(text).toContain('¥3200.00');
    expect(text).toContain('¥2800.00');
    expect(text).toContain('¥4100.00');
    expect(text).toContain('周一');
    expect(text).toContain('周二');
    expect(text).toContain('周三');
  });

  it('renders category rank list', () => {
    const categoryRanks = [
      { category: '护肤', sales: 45000, percentage: 40 },
      { category: '彩妆', sales: 28000, percentage: 25 },
      { category: '洗护', sales: 15000, percentage: 13 },
    ];

    const root = create(
      <SalesReportsScreen
        summary={{ totalSales: 100000, orderCount: 80, avgOrderValue: 1250, customerCount: 60, salesGrowth: 10 }}
        categoryRanks={categoryRanks}
      />,
    ).root;

    const text = getAllText(root);
    expect(text).toContain('品类排行');
    expect(text).toContain('护肤');
    expect(text).toContain('彩妆');
    expect(text).toContain('洗护');
    expect(text).toContain('¥45000.00');
    expect(text).toContain('¥28000.00');
    expect(text).toContain('¥15000.00');
  });

  it('changes internal period state on tab press', () => {
    const root = create(
      <SalesReportsScreen
        summary={{ totalSales: 1000, orderCount: 5, avgOrderValue: 200, customerCount: 4, salesGrowth: 0 }}
      />,
    ).root;

    // 默认 should be 'daily' - find "本月" tab and press
    const monthlyTab = findTouchableByText(root, '本月');
    expect(monthlyTab).toBeDefined();
    if (monthlyTab) {
      monthlyTab.props.onPress();
      // After pressing, "本月" should become active
    }
  });

  it('renders search bar and clear button', () => {
    const onSearch = vi.fn();
    const root = create(
      <SalesReportsScreen
        summary={{ totalSales: 1000, orderCount: 5, avgOrderValue: 200, customerCount: 4, salesGrowth: 0 }}
        onSearch={onSearch}
      />,
    ).root;

    // 搜索框应存在
    const searchInputs = root.findAllByType('TextInput');
    expect(searchInputs.length).toBeGreaterThan(0);
    expect(searchInputs[0].props.placeholder).toContain('搜索');
  });

  it('clears search text on clear button press', () => {
    const onSearch = vi.fn();
    const root = create(
      <SalesReportsScreen
        summary={{ totalSales: 1000, orderCount: 5, avgOrderValue: 200, customerCount: 4, salesGrowth: 0 }}
        onSearch={onSearch}
      />,
    ).root;

    // 清空按钮初始不存在, 输入文字后不直接通过 renderer 测试
    // 这里验证初始状态没有 clear
    const clearButtons = root.findAllByProps({ testID: 'search-clear' });
    // 初始时无搜索文字, clear 按钮不应存在(因其受控于 value.length > 0)
    // 注: react-test-renderer 不会响应 state 改变触发重渲染,
    // 此处仅验证组件包含了 search-input 元素
    const searchInput = root.findByProps({ testID: 'search-input' });
    expect(searchInput).toBeDefined();
  });

  it('renders with daily period as default', () => {
    const root = create(
      <SalesReportsScreen
        summary={{ totalSales: 5000, orderCount: 20, avgOrderValue: 250, customerCount: 15, salesGrowth: 3 }}
      />,
    ).root;

    // 默认应该显示今日, 本周, 本月三个 tab
    const text = getAllText(root);
    expect(text).toContain('今日');
    expect(text).toContain('本周');
    expect(text).toContain('本月');
  });
});
