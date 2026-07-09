/**
 * inventory/[id]/page.test.tsx — 库存详情页测试
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
const mockRouterPush = vi.fn();
const mockParams = vi.fn(() => ({ id: 'P001' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useParams: () => mockParams(),
}));

// Mock the data module
vi.mock('../inventory-data', () => ({
  MOCK_PRODUCTS: [
    { productId: 'P001', name: '氨基酸洁面乳', category: '护肤', brand: '花西子', unit: '支', status: 'active', createdAt: '2026-01-15' },
  ],
  MOCK_SKUS: [
    { skuId: 'S001-1', productId: 'P001', skuCode: 'SKU-P001-50ml', name: '氨基酸洁面乳 50ml', specs: { '规格': '50ml' }, stock: 120, safetyStock: 20, costPrice: 25, retailPrice: 68 },
    { skuId: 'S001-2', productId: 'P001', skuCode: 'SKU-P001-100ml', name: '氨基酸洁面乳 100ml', specs: { '规格': '100ml' }, stock: 85, safetyStock: 15, costPrice: 42, retailPrice: 108 },
  ],
  MOCK_PURCHASE_ORDERS: [
    { poId: 'PO2026070101', poNo: 'PO-20260701-001', supplierId: 'SUP001', supplierName: '杭州花西子供应链', status: 'approved', items: [{ itemId: 'POI-001', skuId: 'S001-1', skuName: '氨基酸洁面乳 50ml', quantity: 100, receivedQuantity: 0, unitCost: 25 }], totalAmount: 4600, appliedAt: '2026-07-01 09:00', approvedAt: '2026-07-01 10:30', receivedAt: null },
  ],
  MOCK_INVENTORY_CHECKS: [
    { checkId: 'CK001', checkNo: 'CK-20260701-001', storeId: 'S001', storeName: '上海旗舰店', status: 'completed', items: [{ itemId: 'CKI-001', skuId: 'S001-1', skuName: '氨基酸洁面乳 50ml', bookStock: 120, actualStock: 118, difference: -2 }], checkedAt: '2026-07-01 14:00', completedAt: '2026-07-01 14:30' },
  ],
  MOCK_TRANSFERS: [
    { transferId: 'DB001', transferNo: 'DB-20260628-001', type: 'warehouse_to_store', fromStore: '中央仓库', toStore: '上海旗舰店', status: 'in_transit', items: [{ itemId: 'TRI-001', skuId: 'S001-1', skuName: '氨基酸洁面乳 50ml', quantity: 50, costPrice: 25 }], totalCost: 1250, applicant: '张经理', approver: '陈主管', appliedAt: '2026-06-28 08:30', approvedAt: '2026-06-28 09:00', executedAt: null, receivedAt: null },
  ],
  PO_STATUS_LABELS: { approved: '已审批', draft: '草稿', pending: '待审批', received: '已收货', cancelled: '已取消' },
  CHECK_STATUS_LABELS: { draft: '待盘点', in_progress: '盘点中', completed: '已完成' },
  TRANSFER_STATUS_LABELS: { draft: '草稿', pending: '待审批', approved: '已审批', in_transit: '调拨中', completed: '已完成', cancelled: '已取消' },
  TRANSFER_TYPE_LABELS: { store_to_store: '门店⇄门店', warehouse_to_store: '仓库→门店', store_to_warehouse: '门店→仓库' },
  formatCurrency: (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  formatDate: (isoString: string) => new Date(isoString).toLocaleString('zh-CN', { hour12: false }),
  getSKUStockStatus: (sku: { stock: number; safetyStock: number }) => {
    if (sku.stock === 0) return 'out';
    if (sku.stock < sku.safetyStock) return 'low';
    return 'normal';
  },
  getProductById: (productId: string) => {
    const products = [
      { productId: 'P001', name: '氨基酸洁面乳', category: '护肤', brand: '花西子', unit: '支', status: 'active', createdAt: '2026-01-15' },
    ];
    return products.find(p => p.productId === productId);
  },
  getSKUsByProductId: (productId: string) => {
    const skus = [
      { skuId: 'S001-1', productId: 'P001', skuCode: 'SKU-P001-50ml', name: '氨基酸洁面乳 50ml', specs: { '规格': '50ml' }, stock: 120, safetyStock: 20, costPrice: 25, retailPrice: 68 },
      { skuId: 'S001-2', productId: 'P001', skuCode: 'SKU-P001-100ml', name: '氨基酸洁面乳 100ml', specs: { '规格': '100ml' }, stock: 85, safetyStock: 15, costPrice: 42, retailPrice: 108 },
    ];
    return productId === 'P001' ? skus : [];
  },
}));

import InventoryDetailPage from './page';

describe('InventoryDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product name and subtitle', async () => {
    render(<InventoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('氨基酸洁面乳')).toBeInTheDocument();
    });
    expect(screen.getByText(/产品编号: P001/)).toBeInTheDocument();
  });

  it('renders stock overview statistics', async () => {
    render(<InventoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('SKU数量')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 SKUs
    });
    expect(screen.getByText('总库存')).toBeInTheDocument();
    // 120 + 85 = 205
    expect(screen.getByText('205')).toBeInTheDocument();
    expect(screen.getByText('低库存预警')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('缺货')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders product info section with category, brand, unit', async () => {
    render(<InventoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('产品信息')).toBeInTheDocument();
    });
    expect(screen.getByText('护肤')).toBeInTheDocument();
    expect(screen.getByText('花西子')).toBeInTheDocument();
    expect(screen.getByText('支')).toBeInTheDocument();
  });

  it('renders SKU table with detail rows', async () => {
    render(<InventoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('SKU 库存明细 (2)')).toBeInTheDocument();
    });
    expect(screen.getByText('SKU-P001-50ml')).toBeInTheDocument();
    expect(screen.getByText('SKU-P001-100ml')).toBeInTheDocument();
  });

  it('renders purchase orders section', async () => {
    render(<InventoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('采购订单 (1)')).toBeInTheDocument();
    });
    expect(screen.getByText('PO-20260701-001')).toBeInTheDocument();
    expect(screen.getByText('杭州花西子供应链')).toBeInTheDocument();
  });

  it('renders check records section', async () => {
    render(<InventoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('盘点记录 (1)')).toBeInTheDocument();
    });
    expect(screen.getByText('CK-20260701-001')).toBeInTheDocument();
    expect(screen.getByText('上海旗舰店')).toBeInTheDocument();
  });

  it('renders transfer records section', async () => {
    render(<InventoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('调拨记录 (1)')).toBeInTheDocument();
    });
    expect(screen.getByText('DB-20260628-001')).toBeInTheDocument();
  });

  it('shows "产品未找到" for unknown product id', async () => {
    mockParams.mockReturnValueOnce({ id: 'UNKNOWN' });
    render(<InventoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('产品未找到')).toBeInTheDocument();
    });
  });

  it('renders action buttons in DetailShell', async () => {
    render(<InventoryDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('开始盘点')).toBeInTheDocument();
      expect(screen.getByText('编辑')).toBeInTheDocument();
      expect(screen.getByText('删除')).toBeInTheDocument();
    });
  });

  it('opens delete modal when delete action is clicked', async () => {
    render(<InventoryDetailPage />);

    fireEvent.click(screen.getByText('删除'));

    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument();
    });
  });

  it('closes delete modal when cancel is clicked', async () => {
    render(<InventoryDetailPage />);

    fireEvent.click(screen.getByText('删除'));

    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('取消'));

    await waitFor(() => {
      expect(screen.queryByText('确认删除')).not.toBeInTheDocument();
    });
  });
});
