/**
 * suppliers/[id]/page.test.tsx — 供应商详情页路由测试 (ToB)
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SupplierDetailRoute from './page';

describe('SupplierDetailRoute (ToB)', () => {
  it('renders supplier detail for valid id sup-001', async () => {
    render(<SupplierDetailRoute params={Promise.resolve({ id: 'sup-001' })} />);
    expect(await screen.findByText('广州美妆供应链有限公司')).toBeTruthy();
    expect(screen.getByText('SUP-001')).toBeTruthy();
    expect(screen.getByText('合作中')).toBeTruthy();
  });

  it('renders supplier detail for another valid id sup-007', async () => {
    render(<SupplierDetailRoute params={Promise.resolve({ id: 'sup-007' })} />);
    expect(await screen.findByText('广州妆具工贸有限公司')).toBeTruthy();
  });

  it('shows 404 message for non-existent id', async () => {
    render(<SupplierDetailRoute params={Promise.resolve({ id: 'sup-999' })} />);
    expect(await screen.findByText('供应商未找到')).toBeTruthy();
    expect(screen.getByText(/未找到编码为/)).toBeTruthy();
  });

  it('shows business metrics section', async () => {
    render(<SupplierDetailRoute params={Promise.resolve({ id: 'sup-001' })} />);
    expect(await screen.findByText('合作商品数')).toBeTruthy();
    expect(screen.getByText('累计采购额')).toBeTruthy();
    expect(screen.getByText('订单数量')).toBeTruthy();
    expect(screen.getByText('平均交货天数')).toBeTruthy();
    expect(screen.getByText('质量评分')).toBeTruthy();
  });
});
