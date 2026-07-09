/**
 * 补货申请列表页 — 单元测试
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ReplenishmentPage, { type ReplenishmentOrder } from './page';
import { ReplenishmentListClient } from './replenishment-client';

// --- Mock useRouter ---
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/replenishment',
}));

// --- 9 mock orders used in the server page ---
// reuse the same mock data from page.tsx

describe('ReplenishmentListClient', () => {
  const sampleOrders: ReplenishmentOrder[] = [
    {
      id: 'rp-001', orderNo: 'BC-20260709-001', storeName: '朝阳旗舰店',
      applicant: '张三', itemCount: 15, totalEstimatedQty: 320, urgent: true,
      status: 'pending_approval', reason: '库存预警',
      createdAt: '2026-07-09 08:30',
    },
    {
      id: 'rp-002', orderNo: 'BC-20260709-002', storeName: '朝阳旗舰店',
      applicant: '李四', itemCount: 8, totalEstimatedQty: 150, urgent: false,
      status: 'draft', reason: '下周活动备货',
      createdAt: '2026-07-09 09:00',
    },
    {
      id: 'rp-003', orderNo: 'BC-20260708-001', storeName: '海淀分店',
      applicant: '王五', itemCount: 22, totalEstimatedQty: 480, urgent: true,
      status: 'approved', reason: '周末活动大促备货',
      createdAt: '2026-07-08 14:00', approvedAt: '2026-07-08 16:30',
    },
    {
      id: 'rp-004', orderNo: 'BC-20260708-002', storeName: '西单体验店',
      applicant: '赵六', itemCount: 5, totalEstimatedQty: 60, urgent: false,
      status: 'completed', reason: '常规补货',
      createdAt: '2026-07-08 10:00',
    },
  ];

  it('渲染页面标题和统计卡片', () => {
    render(<ReplenishmentListClient orders={sampleOrders} />);
    expect(screen.getByText('补货申请')).toBeTruthy();
    expect(screen.getByText('全部申请')).toBeTruthy();
    expect(screen.getByText('待审批')).toBeTruthy();
    expect(screen.getByText('已完成')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy(); // total = 4
  });

  it('渲染数据表格行', () => {
    render(<ReplenishmentListClient orders={sampleOrders} />);
    expect(screen.getByText('BC-20260709-001')).toBeTruthy();
    expect(screen.getByText('BC-20260709-002')).toBeTruthy();
    expect(screen.getByText('BC-20260708-001')).toBeTruthy();
    expect(screen.getByText('BC-20260708-002')).toBeTruthy();
  });

  it('按状态标签筛选', () => {
    render(<ReplenishmentListClient orders={sampleOrders} />);
    // "待审批" tab filter
    const pendingTab = screen.getByText(/待审批.*1/);
    fireEvent.click(pendingTab);
    expect(screen.getByText('BC-20260709-001')).toBeTruthy();
    expect(screen.queryByText('BC-20260709-002')).toBeNull();
  });

  it('搜索功能', () => {
    render(<ReplenishmentListClient orders={sampleOrders} />);
    const searchInput = screen.getByPlaceholderText(/搜索/);
    fireEvent.change(searchInput, { target: { value: '海淀' } });
    expect(screen.getByText('海淀分店')).toBeTruthy();
    expect(screen.queryByText('朝阳旗舰店')).toBeNull();
  });

  it('显示紧急标签', () => {
    render(<ReplenishmentListClient orders={sampleOrders} />);
    const urgentRow = screen.getByText('BC-20260709-001');
    expect(urgentRow).toBeTruthy();
    // 紧急 status badge 应该存在（在对应行附近）
    const urgentBadges = screen.getAllByText('紧急');
    expect(urgentBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('显示状态标签', () => {
    render(<ReplenishmentListClient orders={sampleOrders} />);
    expect(screen.getByText('待审批')).toBeTruthy();
    expect(screen.getByText('草稿')).toBeTruthy();
    expect(screen.getByText('已审批')).toBeTruthy();
    expect(screen.getByText('已完成')).toBeTruthy();
  });

  it('显示新建补货申请按钮', () => {
    render(<ReplenishmentListClient orders={sampleOrders} />);
    expect(screen.getByText('+ 新建补货申请')).toBeTruthy();
  });

  it('显示分页信息', () => {
    render(<ReplenishmentListClient orders={sampleOrders} />);
    expect(screen.getByText(/共 4 条记录/)).toBeTruthy();
  });
});

describe('ReplenishmentPage (Server Page)', () => {
  it('通过服务端组件渲染客户端组件', () => {
    const { container } = render(<ReplenishmentPage />);
    // 服务端组件应返回客户端组件并渲染标题
    expect(screen.getByText('补货申请')).toBeTruthy();
  });
});
