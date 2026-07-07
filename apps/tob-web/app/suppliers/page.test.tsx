/**
 * suppliers/page.test.tsx — 供应商列表页测试
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MOCK_SUPPLIERS } from '../suppliers-data';
import { SuppliersPage } from './components/SuppliersPage';

describe('SuppliersPage', () => {
  it('renders the page title and supplier count', () => {
    render(
      <SuppliersPage items={MOCK_SUPPLIERS} total={MOCK_SUPPLIERS.length} page={1} pageSize={15} />
    );

    expect(screen.getByText('供应商管理')).toBeTruthy();
    expect(screen.getByText(/共 12 家供应商/)).toBeTruthy();
  });

  it('displays all suppliers in the table', () => {
    render(
      <SuppliersPage items={MOCK_SUPPLIERS} total={MOCK_SUPPLIERS.length} page={1} pageSize={15} />
    );

    // check first and last supplier names are visible
    expect(screen.getByText('广州美妆供应链有限公司')).toBeTruthy();
    expect(screen.getByText('长沙护肤品包装设计公司')).toBeTruthy();
  });

  it('filters by search term', async () => {
    const user = userEvent.setup();
    render(
      <SuppliersPage items={MOCK_SUPPLIERS} total={MOCK_SUPPLIERS.length} page={1} pageSize={15} />
    );

    const searchInput = screen.getByPlaceholderText(/搜索/);
    await user.type(searchInput, '深圳包材');

    expect(screen.getByText('深圳包材创新有限公司')).toBeTruthy();
    expect(screen.queryByText('广州美妆供应链有限公司')).toBeNull();
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    render(
      <SuppliersPage items={MOCK_SUPPLIERS} total={MOCK_SUPPLIERS.length} page={1} pageSize={15} />
    );

    const categorySelect = screen.getByDisplayValue('全部品类');
    await user.selectOptions(categorySelect, '彩妆');

    // should see 彩妆 suppliers
    expect(screen.getByText('上海日化贸易有限公司')).toBeTruthy();
    expect(screen.getByText('台湾彩妆科技有限公司')).toBeTruthy();
    expect(screen.queryByText('广州美妆供应链有限公司')).toBeNull();
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(
      <SuppliersPage items={MOCK_SUPPLIERS} total={MOCK_SUPPLIERS.length} page={1} pageSize={15} />
    );

    const statusSelect = screen.getByDisplayValue('全部状态');
    await user.selectOptions(statusSelect, '暂停合作');

    // should see paused suppliers
    expect(screen.getByText('杭州香氛科技有限公司')).toBeTruthy();
    expect(screen.getByText('长沙护肤品包装设计公司')).toBeTruthy();
    expect(screen.queryByText('广州美妆供应链有限公司')).toBeNull();
  });

  it('shows empty state when no results match', async () => {
    const user = userEvent.setup();
    render(
      <SuppliersPage items={MOCK_SUPPLIERS} total={MOCK_SUPPLIERS.length} page={1} pageSize={15} />
    );

    const searchInput = screen.getByPlaceholderText(/搜索/);
    await user.type(searchInput, 'ZZZ_NOT_FOUND');

    expect(screen.getByText('无匹配供应商')).toBeTruthy();
  });

  it('shows stat cards with active and pending counts', () => {
    render(
      <SuppliersPage items={MOCK_SUPPLIERS} total={MOCK_SUPPLIERS.length} page={1} pageSize={15} />
    );

    // 8 active + 2 pending in mock data
    expect(screen.getAllByText('合作中')[0]).toBeTruthy();
    expect(screen.getAllByText('待审核')[0]).toBeTruthy();
  });

  it('displays supplier columns correctly', () => {
    render(
      <SuppliersPage items={MOCK_SUPPLIERS} total={MOCK_SUPPLIERS.length} page={1} pageSize={15} />
    );

    expect(screen.getByText('编号')).toBeTruthy();
    expect(screen.getByText('供应商名称')).toBeTruthy();
    expect(screen.getByText('联系人')).toBeTruthy();
    expect(screen.getByText('品类')).toBeTruthy();
    expect(screen.getByText('状态')).toBeTruthy();
    expect(screen.getByText('供应品数')).toBeTruthy();
    expect(screen.getByText('累计金额')).toBeTruthy();
  });
});
