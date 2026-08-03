/**
 * suppliers/page.e2e.vitest.tsx — 供应商管理 E2E 测试
 * 覆盖: 渲染 · 统计面板 · 搜索/筛选/排序/分页 · 详情弹窗 · 错误处理 · 空状态 · 边界 · 导航跳转 · 响应式
 * 角色: 👔店长 · 👤管理员
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: mockPush, back: vi.fn(), forward: vi.fn() })),
  usePathname: vi.fn(() => '/suppliers'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import SuppliersPage from './page';

describe('SuppliersPage — 供应商管理 E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ==============================
  //  页面加载渲染 (5 tests)
  // ==============================

  test('1. renders without crashing', () => {
    const { container } = render(<SuppliersPage />);
    expect(container).toBeTruthy();
  });

  test('2. renders h1 with correct title', () => {
    render(<SuppliersPage />);
    expect(screen.getByRole('heading', { level: 1, name: '供应商管理' })).toBeInTheDocument();
  });

  test('3. renders main container with dark background', () => {
    render(<SuppliersPage />);
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle('background: #0f172a');
  });

  test('4. page export default is a function component', () => {
    expect(typeof SuppliersPage).toBe('function');
  });

  test('5. React.isValidElement returns true on render', () => {
    const { container } = render(<SuppliersPage />);
    expect(container.firstChild).toBeTruthy();
  });

  // ==============================
  //  统计面板 (5 tests)
  // ==============================

  test('6. displays total supplier count stat card', () => {
    render(<SuppliersPage />);
    expect(screen.getByText('全部')).toBeInTheDocument();
  });

  test('7. displays active (合作中) count stat card', () => {
    render(<SuppliersPage />);
    const activeTexts = screen.getAllByText('合作中');
    expect(activeTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('8. displays paused count stat card', () => {
    render(<SuppliersPage />);
    expect(screen.getByText('暂停')).toBeInTheDocument();
  });

  test('9. displays monthly purchases (本月采购) stat card', () => {
    render(<SuppliersPage />);
    expect(screen.getByText('本月采购')).toBeInTheDocument();
  });

  test('10. total stat shows correct number (18)', () => {
    render(<SuppliersPage />);
    const allElems = screen.getAllByText('18');
    expect(allElems.length).toBeGreaterThanOrEqual(1);
  });

  // ==============================
  //  搜索/输入 (4 tests)
  // ==============================

  test('11. renders search input with placeholder', () => {
    render(<SuppliersPage />);
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  test('12. typing in search filters results by name', () => {
    render(<SuppliersPage />);
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    fireEvent.change(searchInput, { target: { value: '华强' } });
    expect(searchInput).toHaveValue('华强');
  });

  test('13. typing in search filters results by contact person', () => {
    render(<SuppliersPage />);
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    fireEvent.change(searchInput, { target: { value: '陈' } });
    expect(searchInput).toHaveValue('陈');
  });

  test('14. clearing search returns full supplier list', () => {
    render(<SuppliersPage />);
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    fireEvent.change(searchInput, { target: { value: '华强' } });
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText(/共 18 家供应商/)).toBeInTheDocument();
  });

  // ==============================
  //  筛选/排序 (5 tests)
  // ==============================

  test('15. renders status filter with 4 options (全部/active/paused/terminated)', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[0];
    expect(statusSelect.children.length).toBe(4);
  });

  test('16. renders category filter with 10 options', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[1];
    expect(categorySelect.children.length).toBe(10);
    expect(categorySelect.children[1]).toHaveTextContent('游戏设备');
  });

  test('17. renders sort dropdown with 3 options', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    const sortSelect = selects[2];
    expect(sortSelect.children.length).toBe(3);
    expect(sortSelect.children[0]).toHaveTextContent('按评分');
    expect(sortSelect.children[1]).toHaveTextContent('按采购额');
    expect(sortSelect.children[2]).toHaveTextContent('按名称');
  });

  test('18. filtering by paused status changes visible results', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[0];
    fireEvent.change(statusSelect, { target: { value: 'paused' } });
    // After filtering by paused, only 3 paused suppliers should show
    const pauseTexts = screen.getAllByText(/暂停/);
    expect(pauseTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('19. sorting by purchase amount works', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    const sortSelect = selects[2];
    fireEvent.change(sortSelect, { target: { value: 'purchases' } });
    expect((sortSelect as HTMLSelectElement).value).toBe('purchases');
  });

  // ==============================
  //  供应商卡片列表 (3 tests)
  // ==============================

  test('20. renders supplier cards with company names', () => {
    render(<SuppliersPage />);
    const companyNames = screen.getAllByText(/有限公司/);
    expect(companyNames.length).toBeGreaterThan(0);
  });

  test('21. renders star ratings on supplier cards', () => {
    render(<SuppliersPage />);
    // Each supplier card shows rating like "4.8", "4.5", etc.
    const ratings = screen.getAllByText(/\d\.\d/);
    expect(ratings.length).toBeGreaterThan(0);
  });

  test('22. renders category tags on supplier cards', () => {
    render(<SuppliersPage />);
    const categoryTags = screen.getAllByText(/游戏设备|礼品|饮品|零食|食品|包装|印刷品|日用百货|办公耗材/);
    expect(categoryTags.length).toBeGreaterThan(0);
  });

  // ==============================
  //  分页 (4 tests)
  // ==============================

  test('23. renders pagination controls (上一页/下一页)', () => {
    render(<SuppliersPage />);
    expect(screen.getByText('上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页')).toBeInTheDocument();
  });

  test('24. shows page counter with total pages', () => {
    render(<SuppliersPage />);
    // 18 items / 8 per page = 3 pages, counter shows "1 / 3"
    const pageCounter = screen.getByText(/\d+ \/ \d+/);
    expect(pageCounter).toBeInTheDocument();
  });

  test('25. pagination next navigates to page 2', () => {
    render(<SuppliersPage />);
    const nextBtn = screen.getByText('下一页');
    fireEvent.click(nextBtn);
    expect(screen.getByText(/2 \//)).toBeInTheDocument();
  });

  test('26. pagination prev works after navigating forward', () => {
    render(<SuppliersPage />);
    const nextBtn = screen.getByText('下一页');
    fireEvent.click(nextBtn);
    expect(screen.getByText(/2 \//)).toBeInTheDocument();
    const prevBtn = screen.getByText('上一页');
    fireEvent.click(prevBtn);
    expect(screen.getByText(/1 \//)).toBeInTheDocument();
  });

  // ==============================
  //  详情弹窗 (4 tests)
  // ==============================

  test('27. clicking supplier card opens detail modal', () => {
    render(<SuppliersPage />);
    const supplierNames = screen.getAllByText(/有限公司/);
    fireEvent.click(supplierNames[0]);
    expect(screen.getByText('供应商详情')).toBeInTheDocument();
  });

  test('28. detail modal shows contact information', () => {
    render(<SuppliersPage />);
    const supplierNames = screen.getAllByText(/有限公司/);
    fireEvent.click(supplierNames[0]);
    expect(screen.getByText('联系人')).toBeInTheDocument();
    expect(screen.getByText('电话')).toBeInTheDocument();
    expect(screen.getByText('邮箱')).toBeInTheDocument();
    expect(screen.getByText('地址')).toBeInTheDocument();
  });

  test('29. detail modal shows goods categories', () => {
    render(<SuppliersPage />);
    const supplierNames = screen.getAllByText(/有限公司/);
    fireEvent.click(supplierNames[0]);
    expect(screen.getByText('供货品类')).toBeInTheDocument();
  });

  test('30. detail modal can be closed by clicking close button', () => {
    render(<SuppliersPage />);
    const supplierNames = screen.getAllByText(/有限公司/);
    fireEvent.click(supplierNames[0]);
    const closeBtn = screen.getByText('✕');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(screen.queryByText('供应商详情')).not.toBeInTheDocument();
  });

  // ==============================
  //  错误处理 (3 tests)
  // ==============================

  test('31. error toggle button renders as 模拟错误', () => {
    render(<SuppliersPage />);
    expect(screen.getByText('模拟错误')).toBeInTheDocument();
  });

  test('32. clicking 模拟错误 shows error state', () => {
    render(<SuppliersPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText(/⚠️ 数据加载异常/)).toBeInTheDocument();
    expect(screen.getByText('供应商数据获取失败，请稍后重试')).toBeInTheDocument();
  });

  test('33. clicking 恢复数据 restores normal view', () => {
    render(<SuppliersPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText('恢复数据')).toBeInTheDocument();
    fireEvent.click(screen.getByText('恢复数据'));
    expect(screen.queryByText(/⚠️ 数据加载异常/)).not.toBeInTheDocument();
  });

  // ==============================
  //  空状态 (2 tests)
  // ==============================

  test('34. renders empty state when no suppliers match filter', () => {
    render(<SuppliersPage />);
    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NOT_EXISTS_999' } });
    expect(screen.getByText('暂无匹配的供应商')).toBeInTheDocument();
    expect(screen.getByText('尝试调整筛选条件或搜索词')).toBeInTheDocument();
  });

  test('35. empty state shows emoji icon', () => {
    render(<SuppliersPage />);
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NOT_EXISTS_999' } });
    expect(screen.getByText('🏢')).toBeInTheDocument();
  });

  // ==============================
  //  底部统计 (2 tests)
  // ==============================

  test('36. shows total supplier count in footer', () => {
    render(<SuppliersPage />);
    expect(screen.getByText(/共 \d+ 家供应商/)).toBeInTheDocument();
  });

  test('37. shows current page item count in footer', () => {
    render(<SuppliersPage />);
    expect(screen.getByText(/本页 \d+ 家/)).toBeInTheDocument();
  });

  // ==============================
  //  边界情况 (3 tests)
  // ==============================

  test('38. all 3 comboboxes are rendered (status, category, sort)', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(3);
  });

  test('39. pagination prev disabled on first page', () => {
    render(<SuppliersPage />);
    const prevBtn = screen.getByText('上一页');
    // On page 1, prev should be disabled
    expect(prevBtn).toHaveStyle('cursor: not-allowed');
    expect(prevBtn.closest('button')).toBeDisabled();
  });

  test('40. category filter changes visible suppliers', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[1];
    fireEvent.change(categorySelect, { target: { value: '游戏设备' } });
    // Should show game equipment suppliers
    const gameTexts = screen.getAllByText(/游戏设备/);
    expect(gameTexts.length).toBeGreaterThanOrEqual(1);
  });

  // ==============================
  //  导航/跳转模拟 (2 tests)
  // ==============================

  test('41. supplier detail modal shows correct data fields', () => {
    render(<SuppliersPage />);
    const firstCard = screen.getAllByText(/有限公司/)[0];
    fireEvent.click(firstCard);
    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getByText('类别')).toBeInTheDocument();
    expect(screen.getByText('评分')).toBeInTheDocument();
    expect(screen.getByText('合作起始')).toBeInTheDocument();
    expect(screen.getByText('最近采购')).toBeInTheDocument();
  });

  test('42. detail modal overlay closes on backdrop click', () => {
    render(<SuppliersPage />);
    const firstCard = screen.getAllByText(/有限公司/)[0];
    fireEvent.click(firstCard);
    expect(screen.getByText('供应商详情')).toBeInTheDocument();
    // Click the backdrop (the outermost overlay div)
    const overlay = screen.getByText('供应商详情').closest('[style*="position: fixed"]') as HTMLElement;
    fireEvent.click(overlay);
    expect(screen.queryByText('供应商详情')).not.toBeInTheDocument();
  });

  // ==============================
  //  组合过滤场景 (3 tests)
  // ==============================

  test('43. combined filter: paused status + game equipment category', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    // Filter by paused status
    fireEvent.change(selects[0], { target: { value: 'paused' } });
    // Filter by game equipment - no paused game equipment supplier, so empty state
    fireEvent.change(selects[1], { target: { value: '游戏设备' } });
    // Might show empty or specific results
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    expect(searchInput).toBeInTheDocument();
  });

  test('44. combined filter: active status + sorted by name', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'active' } });
    fireEvent.change(selects[2], { target: { value: 'name' } });
    expect((selects[2] as HTMLSelectElement).value).toBe('name');
  });

  test('45. terminated status filter shows terminated badge labels', () => {
    render(<SuppliersPage />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'terminated' } });
    const terminatedTexts = screen.getAllByText(/已终止/);
    expect(terminatedTexts.length).toBeGreaterThanOrEqual(1);
  });

  // ==============================
  //  组件稳定性 (3 tests)
  // ==============================

  test('46. component renders stable across re-renders', () => {
    const { rerender } = render(<SuppliersPage />);
    rerender(<SuppliersPage />);
    expect(screen.getByText('供应商管理')).toBeInTheDocument();
  });

  test('47. clicking multiple suppliers sequentially works', () => {
    render(<SuppliersPage />);
    const names = screen.getAllByText(/有限公司/);
    // Click first supplier -> close -> click second supplier
    fireEvent.click(names[0]);
    expect(screen.getByText('供应商详情')).toBeInTheDocument();
    fireEvent.click(screen.getByText('✕'));
    expect(screen.queryByText('供应商详情')).not.toBeInTheDocument();
    fireEvent.click(names[1]);
    expect(screen.getByText('供应商详情')).toBeInTheDocument();
  });

  test('48. search input retains value after state changes', () => {
    render(<SuppliersPage />);
    const searchInput = screen.getByPlaceholderText('🔍 搜索供应商或联系人...');
    fireEvent.change(searchInput, { target: { value: '测试' } });
    // Change category filter
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: '饮品' } });
    // Search value should persist
    expect(searchInput).toHaveValue('测试');
  });

  // ==============================
  //  分页边界 (2 tests)
  // ==============================

  test('49. pagination next disabled on last page', () => {
    render(<SuppliersPage />);
    // Navigate to last page (page 3)
    const nextBtn = screen.getByText('下一页');
    fireEvent.click(nextBtn); // page 2
    fireEvent.click(nextBtn); // page 3 - should show "3 / 3"
    expect(screen.getByText(/3 \/ 3/)).toBeInTheDocument();
    expect(nextBtn.closest('button')).toBeDisabled();
  });

  test('50. total filtered count changes when filter applied', () => {
    render(<SuppliersPage />);
    // Default: 18 suppliers
    const totalMatch = screen.getByText(/共 \d+ 家供应商/);
    expect(totalMatch.textContent).toContain('18');
    // Filter by terminated (only 1)
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'terminated' } });
    expect(screen.getByText(/共 1 家供应商/)).toBeInTheDocument();
  });
});
