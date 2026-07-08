/**
 * InventoryScreen.test.tsx - 门店库存管理页面单元测试
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { InventoryScreen } from './InventoryScreen';

describe('InventoryScreen', () => {
  it('renders search bar', () => {
    const root = create(<InventoryScreen />).root;
    const searchInput = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
    expect(searchInput).toBeDefined();
  });

  it('renders empty state when no items', () => {
    const root = create(<InventoryScreen />).root;
    const emptyText = root.findByProps({ children: '暂无库存数据' });
    expect(emptyText).toBeDefined();
  });

  it('renders empty state icon', () => {
    const root = create(<InventoryScreen />).root;
    const emptyIcon = root.findByProps({ children: '📦' });
    expect(emptyIcon).toBeDefined();
  });

  it('renders empty sub text', () => {
    const root = create(<InventoryScreen />).root;
    const subText = root.findByProps({ children: '请先同步门店库存信息' });
    expect(subText).toBeDefined();
  });

  it('renders search input with placeholder', () => {
    const root = create(<InventoryScreen />).root;
    const input = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
    expect(input).toBeDefined();
  });

  it('renders tab 全部', () => {
    const root = create(<InventoryScreen />).root;
    const tab = root.findByProps({ children: '全部' });
    expect(tab).toBeDefined();
  });

  it('renders tab 高库存', () => {
    const root = create(<InventoryScreen />).root;
    const tab = root.findByProps({ children: '高库存' });
    expect(tab).toBeDefined();
  });

  it('renders low stock tab with count text', () => {
    const root = create(<InventoryScreen />).root;
    const touchables = root.findAllByType('Text');
    const lowTab = touchables.find(
      (t: any) => typeof t.props.children === 'string' && t.props.children.includes('低库存'),
    );
    expect(lowTab).toBeDefined();
  });
});
