/**
 * SupplierDetailPage.test.tsx — 供应商详情页测试 (ToB)
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { SupplierDetailPage, type SupplierDetail } from './SupplierDetailPage';

const MOCK_DETAIL: SupplierDetail = {
  id: 'sup-001',
  code: 'SUP-001',
  name: '广州美妆供应链有限公司',
  contactPerson: '李明',
  phone: '13800138001',
  email: 'liming@gzbeauty.com',
  category: '护肤品',
  status: 'active',
  totalProducts: 48,
  totalAmount: 1268000,
  cooperationStart: '2024-01-15',
  updatedAt: '2026-06-25 10:32',
  address: '广州市白云区美妆产业园区A栋',
  description: '长期合作供应商，产品质量稳定，交货及时。',
  orderCount: 156,
  returnRate: '2.3%',
  avgDeliveryDays: 3,
  qualityScore: 4.5,
  recentOrders: [
    { id: 'PO-2026-0601', product: '玻尿酸精华液', amount: 58000, date: '2026-06-20', status: '已收货' },
    { id: 'PO-2026-0598', product: '神经酰胺面霜', amount: 42000, date: '2026-06-18', status: '运输中' },
    { id: 'PO-2026-0590', product: 'VC 亮肤面膜（箱）', amount: 35000, date: '2026-06-15', status: '已收货' },
    { id: 'PO-2026-0582', product: '氨基酸洁面乳', amount: 28000, date: '2026-06-10', status: '已完成' },
    { id: 'PO-2026-0575', product: '防晒霜 SPF50', amount: 45000, date: '2026-06-05', status: '已完成' },
    { id: 'PO-2026-0568', product: '修护精华液', amount: 62000, date: '2026-05-28', status: '已完成' },
  ],
  evaluations: [
    { date: '2026-06-15', score: 5, comment: '产品质量很好，交货准时，推荐合作。', reviewer: '张采购' },
    { date: '2026-05-20', score: 4, comment: '整体满意，包装可以进一步改进。', reviewer: '李经理' },
    { date: '2026-04-10', score: 5, comment: '响应速度快，品质稳定。', reviewer: '王采购' },
  ],
};

describe('SupplierDetailPage (ToB)', () => {
  it('renders breadcrumb navigation', () => {
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);
    expect(screen.getByText('供应商管理')).toBeTruthy();
    expect(screen.getByText(MOCK_DETAIL.code)).toBeTruthy();
    expect(screen.getByText(MOCK_DETAIL.name)).toBeTruthy();
  });

  it('renders supplier header with name and status badge', () => {
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);
    expect(screen.getByText('广州美妆供应链有限公司')).toBeTruthy();
    expect(screen.getByTestId('detail-status-badge-active')).toBeTruthy();
    expect(screen.getByText('合作中')).toBeTruthy();
  });

  it('shows basic info section with contact details', () => {
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);
    expect(screen.getByText('李明')).toBeTruthy();
    expect(screen.getByText('13800138001')).toBeTruthy();
    expect(screen.getByText('liming@gzbeauty.com')).toBeTruthy();
    expect(screen.getByText('护肤品')).toBeTruthy();
    expect(screen.getByText('广州市白云区美妆产业园区A栋')).toBeTruthy();
  });

  it('shows business metrics', () => {
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);
    expect(screen.getByText('48 种')).toBeTruthy();
    expect(screen.getByText('156 单')).toBeTruthy();
    expect(screen.getByText('2.3%')).toBeTruthy();
    expect(screen.getByText('3 天')).toBeTruthy();
    expect(screen.getByText('4.5 分')).toBeTruthy();
  });

  it('toggles edit mode', async () => {
    const user = userEvent.setup();
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);

    const editBtn = screen.getByTestId('detail-edit-btn');
    await user.click(editBtn);

    // edit inputs should appear
    expect(screen.getByTestId('edit-contact-person')).toBeTruthy();
    expect(screen.getByTestId('edit-phone')).toBeTruthy();
    expect(screen.getByTestId('edit-email')).toBeTruthy();
    expect(screen.getByTestId('edit-address')).toBeTruthy();
    expect(screen.getByTestId('edit-description')).toBeTruthy();
    expect(screen.getByTestId('detail-save-btn')).toBeTruthy();

    // cancel should revert
    await user.click(editBtn);
    expect(screen.queryByTestId('detail-save-btn')).toBeNull();
  });

  it('shows status transition menu', async () => {
    const user = userEvent.setup();
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);

    const statusBtn = screen.getByTestId('detail-status-btn');
    await user.click(statusBtn);

    // active supplier can go to paused or terminated
    expect(screen.getByTestId('detail-status-transition-paused')).toBeTruthy();
    expect(screen.getByTestId('detail-status-transition-terminated')).toBeTruthy();
  });

  it('changes status when clicking a transition option', async () => {
    const user = userEvent.setup();
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);

    // open status menu
    await user.click(screen.getByTestId('detail-status-btn'));
    await user.click(screen.getByTestId('detail-status-transition-paused'));

    // badge should change to paused
    expect(screen.getByTestId('detail-status-badge-paused')).toBeTruthy();
    expect(screen.getByText('暂停合作')).toBeTruthy();
  });

  it('hides status menu after selecting an option', async () => {
    const user = userEvent.setup();
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);

    await user.click(screen.getByTestId('detail-status-btn'));
    expect(screen.getByTestId('detail-status-menu')).toBeTruthy();

    await user.click(screen.getByTestId('detail-status-transition-terminated'));
    expect(screen.queryByTestId('detail-status-menu')).toBeNull();
  });

  it('shows recent orders table with order data', () => {
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);
    const table = screen.getByTestId('detail-recent-orders');
    expect(table).toBeTruthy();
    expect(screen.getByText('PO-2026-0601')).toBeTruthy();
    expect(screen.getByText('玻尿酸精华液')).toBeTruthy();
    expect(screen.getByText('已收货')).toBeTruthy();
  });

  it('shows evaluation records', () => {
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);
    const evalTable = screen.getByTestId('detail-evaluations');
    expect(evalTable).toBeTruthy();
    expect(screen.getByText('产品质量很好，交货准时，推荐合作。')).toBeTruthy();
    expect(screen.getByText('张采购')).toBeTruthy();
  });

  it('renders delete button', () => {
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);
    expect(screen.getByTestId('detail-delete-btn')).toBeTruthy();
  });

  it('shows empty state when no recent orders', () => {
    const noOrders = { ...MOCK_DETAIL, recentOrders: [] };
    render(<SupplierDetailPage supplier={noOrders} />);
    expect(screen.getByText('暂无采购订单记录')).toBeTruthy();
  });

  it('shows empty state when no evaluations', () => {
    const noEval = { ...MOCK_DETAIL, evaluations: [] };
    render(<SupplierDetailPage supplier={noEval} />);
    expect(screen.getByText('暂无评价记录')).toBeTruthy();
  });

  it('shows pending status no-transition message', async () => {
    const user = userEvent.setup();
    const pendingSup = { ...MOCK_DETAIL, status: 'terminated' as const };
    render(<SupplierDetailPage supplier={pendingSup} />);

    await user.click(screen.getByTestId('detail-status-btn'));
    // terminated → only "重新合作" to active
    expect(screen.getByTestId('detail-status-transition-active')).toBeTruthy();
  });

  it('shows order pagination info', () => {
    render(<SupplierDetailPage supplier={MOCK_DETAIL} />);
    expect(screen.getByTestId('detail-order-page-info')).toHaveTextContent('第 1 / 2 页');
  });
});
