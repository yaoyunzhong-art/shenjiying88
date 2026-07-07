/**
 * OrdersScreen.test.tsx - Phase-21 T52
 * 订单列表页单元测试
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { OrdersScreen } from './OrdersScreen';

describe('OrdersScreen', () => {
  it('renders empty state when no orders', () => {
    const root = create(<OrdersScreen />).root;
    const emptyText = root.findByProps({ children: '暂无订单' });
    expect(emptyText).toBeDefined();
  });
});
