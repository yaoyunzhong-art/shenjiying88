/**
 * MembersScreen.test.tsx - Phase-21 T52
 * 会员列表页单元测试
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { create } from 'react-test-renderer';
import { MembersScreen } from './MembersScreen';

describe('MembersScreen', () => {
  it('renders empty state when no members', () => {
    const root = create(<MembersScreen />).root;
    const emptyText = root.findByProps({ children: '暂无会员' });
    expect(emptyText).toBeDefined();
  });
});
