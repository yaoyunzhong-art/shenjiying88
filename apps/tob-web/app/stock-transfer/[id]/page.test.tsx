/**
 * stock-transfer/[id]/page.test.tsx — 库存调拨详情页测试
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
const mockRouterPush = vi.fn();
const mockParams = vi.fn(() => ({ id: '1' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useParams: () => mockParams(),
}));

// Mock the data module
vi.mock('../data', () => ({
  TRANSFER_STATUS_LABELS: {
    draft: '草稿',
    pending: '待审批',
    approved: '已审批',
    in_transit: '调拨中',
    completed: '已完成',
    cancelled: '已取消',
  },
  TRANSFER_TYPE_LABELS: {
    store_to_store: '门店⇄门店',
    warehouse_to_store: '仓库→门店',
    store_to_warehouse: '门店→仓库',
  },
  MOCK_TRANSFERS: [
    {
      id: '1',
      transferNo: 'DB-20260628-001',
      type: 'warehouse_to_store',
      fromLocation: '中央仓库',
      toLocation: '上海旗舰店',
      status: 'in_transit',
      itemsCount: 8,
      totalQuantity: 120,
      applicant: '张经理',
      approver: '陈主管',
      reason: '门店补货-洁面系列',
      appliedAt: '2026-06-28 08:30',
      completedAt: null,
      createdAt: '2026-06-28 08:30',
    },
    {
      id: '2',
      transferNo: 'DB-20260628-002',
      type: 'store_to_store',
      fromLocation: '上海旗舰店',
      toLocation: '北京分店',
      status: 'pending',
      itemsCount: 3,
      totalQuantity: 15,
      applicant: '李店长',
      approver: '',
      reason: '调拨热销口红品',
      appliedAt: '2026-06-28 09:00',
      completedAt: null,
      createdAt: '2026-06-28 09:00',
    },
  ],
}));

import StockTransferDetailPage from './page';

describe('StockTransferDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders transfer detail with correct title and transfer number', async () => {
    render(<StockTransferDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('DB-20260628-001')).toBeInTheDocument();
    });
    expect(screen.getByText('调拨单详情 · 仓库→门店')).toBeInTheDocument();
  });

  it('displays basic transfer information sections', async () => {
    render(<StockTransferDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('调拨信息')).toBeInTheDocument();
      expect(screen.getByText('人员信息')).toBeInTheDocument();
      expect(screen.getByText('商品明细')).toBeInTheDocument();
      expect(screen.getByText('操作日志')).toBeInTheDocument();
    });
  });

  it('displays from/to location', async () => {
    render(<StockTransferDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('中央仓库')).toBeInTheDocument();
      expect(screen.getByText('上海旗舰店')).toBeInTheDocument();
    });
  });

  it('displays line items table when items exist', async () => {
    render(<StockTransferDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('M5-FC-001')).toBeInTheDocument();
      expect(screen.getByText('氨基酸洁面乳')).toBeInTheDocument();
      expect(screen.getByText('120ml')).toBeInTheDocument();
    });
  });

  it('displays approval logs', async () => {
    render(<StockTransferDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('提交申请')).toBeInTheDocument();
      expect(screen.getByText('审批通过')).toBeInTheDocument();
      expect(screen.getByText('开始发货')).toBeInTheDocument();
    });
  });

  it('shows "返回列表" button that navigates back', async () => {
    render(<StockTransferDetailPage />);

    await waitFor(() => {
      const backBtn = screen.getByText('返回列表');
      expect(backBtn).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('返回列表'));
    expect(mockRouterPush).toHaveBeenCalledWith('/stock-transfer');
  });

  it('shows fallback text when transfer is not found', async () => {
    mockParams.mockReturnValue({ id: 'non-existent' });

    render(<StockTransferDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/未找到调拨单/)).toBeInTheDocument();
    });
  });

  it('renders stat badges with correct data', async () => {
    render(<StockTransferDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('仓库→门店')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // SKU数
      expect(screen.getByText('120')).toBeInTheDocument(); // 总数量
      expect(screen.getByText('调拨中')).toBeInTheDocument(); // 状态
    });
  });

  describe('interactive workflows', () => {
    it('opens edit modal when transfer is editable (pending status)', async () => {
      mockParams.mockReturnValue({ id: '2' });

      render(<StockTransferDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('DB-20260628-002')).toBeInTheDocument();
      });

      const editBtn = screen.getByText('编辑');
      expect(editBtn).toBeInTheDocument();

      fireEvent.click(editBtn);

      await waitFor(() => {
        expect(screen.getByText('编辑调拨单')).toBeInTheDocument();
      });
    });

    it('opens approve modal when status is pending', async () => {
      mockParams.mockReturnValue({ id: '2' });

      render(<StockTransferDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('DB-20260628-002')).toBeInTheDocument();
      });

      const approveBtn = screen.getByText('审批通过');
      expect(approveBtn).toBeInTheDocument();

      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByText('确认审批通过')).toBeInTheDocument();
      });

      // Submit approval
      fireEvent.click(screen.getByText('确认审批通过'));

      // Status should change
      await waitFor(() => {
        expect(screen.getByText('在途')).toBeInTheDocument();
      });
    });

    it('does not show edit button for in_transit status', async () => {
      mockParams.mockReturnValue({ id: '1' });

      render(<StockTransferDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('DB-20260628-001')).toBeInTheDocument();
      });

      // Should not have edit or approve button for in_transit
      expect(screen.queryByText('编辑')).not.toBeInTheDocument();
      expect(screen.queryByText('审批通过')).not.toBeInTheDocument();
    });
  });
});
