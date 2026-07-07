/**
 * 库存管理列表页 — Stock List Page (ToB Next.js App Router)
 * 角色: 品牌运营 / 仓库管理员
 * 功能: 搜索、品类筛选、状态筛选、分页浏览库存明细
 */
import React from 'react';
import { StockPage } from './components/StockPage';
import { MOCK_STOCK } from '../stock-data';

export default async function StockListPage() {
  return (
    <StockPage
      items={MOCK_STOCK}
      total={MOCK_STOCK.length}
      page={1}
      pageSize={15}
    />
  );
}
