/**
 * inventory-keeper/page.vitest.tsx — 库存看板 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 加载状态 · 渲染 · 统计卡片 · 搜索 · 分类筛选 · 状态筛选 · 展开详情 · 分页 · 空状态 · 边界
 * 角色: 👔店长 · 🛒前台
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import InventoryKeeperPage from './page';

async function waitForData() {
  await screen.findByText('库存看板', {}, { timeout: 5000 });
}

describe('InventoryKeeperPage — 库存看板', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 加载状态测试 ======

  test('renders without crashing', () => {
    expect(() => render(<InventoryKeeperPage />)).not.toThrow();
  });

  // ====== 渲染测试 ======

  test('renders page title', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    expect(screen.getByText('库存看板')).toBeInTheDocument();
  });

  test('renders all inventory stats', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    expect(screen.getByText('品类总数')).toBeInTheDocument();
    expect(screen.getByText('库存总额')).toBeInTheDocument();
    expect(screen.getByText('预警商品')).toBeInTheDocument();
    expect(screen.getByText('过剩商品')).toBeInTheDocument();
  });

  test('renders stat values', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    // 22 items total
    expect(screen.getByText('22')).toBeInTheDocument(); // 品类总数
  });

  test('renders search input', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    expect(screen.getByPlaceholderText('🔍 搜索商品/分类/库位...')).toBeInTheDocument();
  });

  test('renders category filter select', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    expect(screen.getByText('全部')).toBeInTheDocument();
  });

  test('renders status filter select', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    expect(screen.getByText('正常')).toBeInTheDocument();
    expect(screen.getByText('偏少')).toBeInTheDocument();
    expect(screen.getByText('严重不足')).toBeInTheDocument();
    expect(screen.getByText('偏多')).toBeInTheDocument();
  });

  // ====== 库存项目渲染测试 ======

  test('renders first page inventory items', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    // PAGE_SIZE = 8, first page shows first 8 items
    expect(screen.getByText('游戏币')).toBeInTheDocument();
    expect(screen.getByText('可口可乐(箱)')).toBeInTheDocument();
    expect(screen.getByText('毛绒公仔-中号')).toBeInTheDocument();
    expect(screen.getByText('彩票打印纸')).toBeInTheDocument();
    expect(screen.getByText('VR手柄')).toBeInTheDocument();
    expect(screen.getByText('一次性杯盖')).toBeInTheDocument();
    expect(screen.getByText('冰激凌机原料')).toBeInTheDocument();
    expect(screen.getByText('奶茶珍珠')).toBeInTheDocument();
  });

  test('shows stock counts and units', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    expect(screen.getByText('4980 枚')).toBeInTheDocument();
    expect(screen.getByText('56 箱')).toBeInTheDocument();
  });

  test('shows item category and location', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    expect(screen.getByText(/游戏消耗 · 主库-A01/)).toBeInTheDocument();
    expect(screen.getByText(/饮品 · 冷库-B02/)).toBeInTheDocument();
  });

  test('shows status badges with colors', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    expect(screen.getByText('正常')).toBeInTheDocument();
    expect(screen.getByText('偏少')).toBeInTheDocument();
    expect(screen.getByText('严重不足')).toBeInTheDocument();
    expect(screen.getByText('偏多')).toBeInTheDocument();
  });

  // ====== 搜索测试 ======

  test('search by product name works', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    const searchInput = screen.getByPlaceholderText('🔍 搜索商品/分类/库位...');
    fireEvent.change(searchInput, { target: { value: '咖啡豆' } });
    await waitFor(() => {
      // The page uses a wrapper/select filter check, item 9 is '彩票打印纸' - not matching
      // '橙汁' doesn't start appearing until page 2 normally
      // With search narrowed, we filter down
      expect(screen.queryByText('咖啡机专用除垢剂')).toBeInTheDocument();
    });
  });

  test('search by category works', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    const searchInput = screen.getByPlaceholderText('🔍 搜索商品/分类/库位...');
    fireEvent.change(searchInput, { target: { value: '饮品' } });
    await waitFor(() => {
      expect(screen.getByText('可口可乐(箱)')).toBeInTheDocument();
      expect(screen.getByText('橙汁(箱)')).toBeInTheDocument();
      expect(screen.getByText('碳酸饮料(箱)')).toBeInTheDocument();
      expect(screen.queryByText('游戏币')).not.toBeInTheDocument();
    });
  });

  test('search by location works', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    const searchInput = screen.getByPlaceholderText('🔍 搜索商品/分类/库位...');
    fireEvent.change(searchInput, { target: { value: 'D01' } });
    await waitFor(() => {
      expect(screen.getByText('彩票打印纸')).toBeInTheDocument();
    });
  });

  test('search with no results shows empty state', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    const searchInput = screen.getByPlaceholderText('🔍 搜索商品/分类/库位...');
    fireEvent.change(searchInput, { target: { value: 'zzz不存在的商品' } });
    await waitFor(() => {
      expect(screen.getByText('暂无匹配的库存商品')).toBeInTheDocument();
    });
  });

  // ====== 分类筛选测试 ======

  test('category filter: 礼品 shows only gift items', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    const categorySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(categorySelect, { target: { value: '礼品' } });
    await waitFor(() => {
      expect(screen.getByText('毛绒公仔-中号')).toBeInTheDocument();
      expect(screen.getByText('桌游卡牌')).toBeInTheDocument();
      expect(screen.getByText('抓娃娃机礼品-小号')).toBeInTheDocument();
      expect(screen.queryByText('游戏币')).not.toBeInTheDocument();
    });
  });

  // ====== 状态筛选测试 ======

  test('status filter: 严重不足 shows only critical items', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    const statusSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(statusSelect, { target: { value: 'critical' } });
    await waitFor(() => {
      expect(screen.getByText('奶茶珍珠')).toBeInTheDocument();
      expect(screen.queryByText('游戏币')).not.toBeInTheDocument();
    });
  });

  test('status filter: 偏多 shows overstock items', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    const statusSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(statusSelect, { target: { value: 'overstock' } });
    await waitFor(() => {
      expect(screen.getByText('桌游卡牌')).toBeInTheDocument();
      expect(screen.queryByText('游戏币')).not.toBeInTheDocument();
    });
  });

  // ====== 展开详情测试 ======

  test('clicking item expands detail', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    fireEvent.click(screen.getByText('奶茶珍珠'));
    await waitFor(() => {
      expect(screen.getByText('库存范围:')).toBeInTheDocument();
      expect(screen.getByText(/3 ~ 12/)).toBeInTheDocument();
      expect(screen.getByText(/进货单价/)).toBeInTheDocument();
    });
  });

  test('expanded detail shows action buttons', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    fireEvent.click(screen.getByText('奶茶珍珠'));
    await waitFor(() => {
      expect(screen.getByText('出入库记录')).toBeInTheDocument();
      expect(screen.getByText('调整库存')).toBeInTheDocument();
    });
  });

  test('clicking expanded item collapses it', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    fireEvent.click(screen.getByText('奶茶珍珠'));
    await waitFor(() => {
      expect(screen.getByText(/进货单价/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('奶茶珍珠'));
    await waitFor(() => {
      expect(screen.queryByText(/进货单价/)).not.toBeInTheDocument();
    });
  });

  // ====== 补货建议测试 ======

  test('low stock items show restock suggestion', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    expect(screen.getByText('🟡 库存偏低')).toBeInTheDocument();
    expect(screen.getByText('🔴 严重短缺')).toBeInTheDocument();
  });

  test('restock bar shows suggested quantity', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    // 奶茶珍珠: min=3, max=12, stock=1, suggested = min(12, 3*3-1) = min(12, 8) = 8
    expect(screen.getByText(/建议补货: 8 袋/)).toBeInTheDocument();
  });

  test('restock button exists on low stock items', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    const restockButtons = screen.getAllByText('补货');
    expect(restockButtons.length).toBeGreaterThanOrEqual(3);
  });

  // ====== 分页测试 ======

  test('renders pagination when items > PAGE_SIZE', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    // 22 items, PAGE_SIZE=8, totalPages=3
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  test('clicking next page shows page 2 items', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    fireEvent.click(screen.getByText('下一页'));
    await waitFor(() => {
      expect(screen.getByText('橙汁(箱)')).toBeInTheDocument();
      expect(screen.queryByText('游戏币')).not.toBeInTheDocument();
    });
  });

  test('clicking prev page goes back', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    fireEvent.click(screen.getByText('下一页'));
    await waitFor(() => {
      expect(screen.getByText('橙汁(箱)')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('上一页'));
    await waitFor(() => {
      expect(screen.getByText('游戏币')).toBeInTheDocument();
    });
  });

  test('prev button is disabled on first page', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    const prevButton = screen.getByText('上一页');
    expect(prevButton).toBeDisabled();
  });

  test('next button is disabled on last page', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    // Go to last page (page 3)
    fireEvent.click(screen.getByText('下一页'));
    await waitFor(() => { expect(screen.getByText('2 / 3')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('下一页'));
    await waitFor(() => { expect(screen.getByText('3 / 3')).toBeInTheDocument(); });
    const nextButton = screen.getByText('下一页');
    expect(nextButton).toBeDisabled();
  });

  // ====== 边界情况 ======

  test('dark theme background applied', async () => {
    const { container } = render(<InventoryKeeperPage />);
    await waitForData();
    const main = container.querySelector('main');
    expect(main).toHaveStyle('background: #0f172a');
  });

  test('bottom stats show item count', async () => {
    render(<InventoryKeeperPage />);
    await waitForData();
    expect(screen.getByText(/共 22 种商品/)).toBeInTheDocument();
    expect(screen.getByText(/本页 8 种/)).toBeInTheDocument();
  });
});
