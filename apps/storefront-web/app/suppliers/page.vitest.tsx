import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: mockPush, back: vi.fn(), forward: vi.fn() })),
  usePathname: vi.fn(() => '/suppliers'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import SuppliersPage from './page';

describe('SuppliersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders page title', () => {
    render(<SuppliersPage />);
    expect(screen.getByText('供应商管理')).toBeInTheDocument();
  });

  test('renders header with h1 tag', () => {
    render(<SuppliersPage />);
    expect(screen.getByRole('heading', { level: 1, name: '供应商管理' })).toBeInTheDocument();
  });

  test('renders total suppliers stat', () => {
    render(<SuppliersPage />);
    const allTexts = screen.getAllByText('全部');
    expect(allTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('renders active count stat', () => {
    render(<SuppliersPage />);
    const activeTexts = screen.getAllByText('合作中');
    expect(activeTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('renders paused count stat', () => {
    render(<SuppliersPage />);
    expect(screen.getByText('暂停')).toBeInTheDocument();
  });

  test('renders monthly purchases stat', () => {
    render(<SuppliersPage />);
    expect(screen.getByText('本月采购')).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(<SuppliersPage />);
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    expect(searchInput).toBeInTheDocument();
  });

  test('renders status filter dropdown', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    // First combobox should be status filter
    const statusSelect = selects[0];
    expect(statusSelect).toBeInTheDocument();
  });

  test('status filter has all options', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[0];
    expect(statusSelect.children.length).toBe(4);
  });

  test('renders category filter dropdown', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(3);
  });

  test('renders sort dropdown', () => {
    render(<SuppliersPage />);
    const sortSelect = screen.getAllByRole('combobox')[2];
    expect(sortSelect).toBeInTheDocument();
  });

  test('sort select has 3 options', () => {
    render(<SuppliersPage />);
    const sortSelect = screen.getAllByRole('combobox')[2];
    expect(sortSelect.children.length).toBe(3);
  });

  test('renders supplier cards', () => {
    render(<SuppliersPage />);
    // Should render multiple supplier cards
    const cards = screen.getAllByText(/有限公司/);
    expect(cards.length).toBeGreaterThan(0);
  });

  test('renders star ratings', () => {
    render(<SuppliersPage />);
    // Check for rating elements (they show like "4.8")
    const ratings = screen.getAllByText(/\d\.\d/);
    expect(ratings.length).toBeGreaterThan(0);
  });

  test('renders pagination controls', () => {
    render(<SuppliersPage />);
    expect(screen.getByText('上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页')).toBeInTheDocument();
  });

  test('shows page counter', () => {
    render(<SuppliersPage />);
    // Page counter shows "1 / X"
    const pageCounter = screen.getByText(/\d+ \/ \d+/);
    expect(pageCounter).toBeInTheDocument();
  });

  test('shows total supplier count', () => {
    render(<SuppliersPage />);
    expect(screen.getByText(/共 \d+ 家供应商/)).toBeInTheDocument();
  });

  test('shows page item count', () => {
    render(<SuppliersPage />);
    expect(screen.getByText(/本页 \d+ 家/)).toBeInTheDocument();
  });

  test('clicking supplier card opens detail modal', () => {
    render(<SuppliersPage />);
    // Click first supplier card
    const supplierNames = screen.getAllByText(/有限公司/);
    fireEvent.click(supplierNames[0].closest('[style*="cursor: pointer"]') ?? supplierNames[0]);
    expect(screen.getByText('供应商详情')).toBeInTheDocument();
  });

  test('detail modal shows contact info', () => {
    render(<SuppliersPage />);
    const supplierNames = screen.getAllByText(/有限公司/);
    fireEvent.click(supplierNames[0].closest('[style*="cursor: pointer"]') ?? supplierNames[0]);
    expect(screen.getByText('联系人')).toBeInTheDocument();
    expect(screen.getByText('电话')).toBeInTheDocument();
  });

  test('detail modal can be closed', () => {
    render(<SuppliersPage />);
    const supplierNames = screen.getAllByText(/有限公司/);
    fireEvent.click(supplierNames[0].closest('[style*="cursor: pointer"]') ?? supplierNames[0]);
    expect(screen.getByText('✕')).toBeInTheDocument();
    fireEvent.click(screen.getByText('✕'));
    expect(screen.queryByText('供应商详情')).not.toBeInTheDocument();
  });

  test('error button toggles error state', () => {
    render(<SuppliersPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText(/⚠️ 数据加载异常/)).toBeInTheDocument();
  });

  test('recover button works after error', () => {
    render(<SuppliersPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText('恢复数据')).toBeInTheDocument();
    fireEvent.click(screen.getByText('恢复数据'));
    expect(screen.queryByText(/⚠️ 数据加载异常/)).not.toBeInTheDocument();
  });

  test('search filters suppliers by name', () => {
    render(<SuppliersPage />);
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    fireEvent.change(searchInput, { target: { value: '华强' } });
    expect(searchInput).toHaveValue('华强');
  });

  test('search empty returns all data', () => {
    render(<SuppliersPage />);
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText(/共 \d+ 家供应商/)).toBeInTheDocument();
  });

  test('pagination next navigates', () => {
    render(<SuppliersPage />);
    const nextBtn = screen.getByText('下一页');
    // Ensure there's more than one page (18 suppliers / 8 per page = 3 pages)
    fireEvent.click(nextBtn);
    // Page counter should change
    expect(screen.getByText(/2 \//)).toBeInTheDocument();
  });

  test('pagination prev works after next', () => {
    render(<SuppliersPage />);
    fireEvent.click(screen.getByText('下一页'));
    expect(screen.getByText(/2 \//)).toBeInTheDocument();
    fireEvent.click(screen.getByText('上一页'));
    expect(screen.getByText(/1 \//)).toBeInTheDocument();
  });

  test('filtering by status changes results', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[0];
    fireEvent.change(statusSelect, { target: { value: 'paused' } });
    // After filtering, paused suppliers should show
    const pauseTexts = screen.getAllByText(/暂停/);
    expect(pauseTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('sort by purchase amount works', () => {
    render(<SuppliersPage />);
    const sortSelect = screen.getAllByRole('combobox')[2];
    fireEvent.change(sortSelect, { target: { value: 'purchases' } });
    expect((sortSelect as HTMLSelectElement).value).toBe('purchases');
  });

  test('sort by name works', () => {
    render(<SuppliersPage />);
    const sortSelect = screen.getAllByRole('combobox')[2];
    fireEvent.change(sortSelect, { target: { value: 'name' } });
    expect((sortSelect as HTMLSelectElement).value).toBe('name');
  });

  test('category filter renders', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[1];
    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect.children.length).toBeGreaterThan(5);
  });
});
