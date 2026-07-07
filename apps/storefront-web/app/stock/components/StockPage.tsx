/**
 * StockPage — 库存管理列表页组件 (Client-side compatible)
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 功能: 搜索、分类筛选、状态筛选、分页
 */
'use client';

import React from 'react';
import { StockStatusBadge } from './StockStatusBadge';
import type { StockItem, StockStatus } from './StockStatusBadge';

/* ── Helpers ── */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

/* ── Props ── */
export interface StockPageProps {
  items: StockItem[];
  total: number;
  page: number;
  pageSize: number;
  categoryFilter?: string;
  statusFilter?: StockStatus | '';
  searchQuery?: string;
}

/* ── 类别常量 ── */
export const STOCK_CATEGORIES = ['全部', '护肤品', '彩妆', '香水', '身体护理', '头发护理', '工具配件', '其他'];

/* ── Component ── */
export function StockPage({
  items,
  total,
  page,
  pageSize,
  categoryFilter = '',
  statusFilter = '',
  searchQuery = '',
}: StockPageProps): React.ReactElement {
  const safeItems = items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /* 库存摘要 */
  const totalStock = safeItems.reduce((s, i) => s + i.quantity, 0);
  const totalValue = safeItems.reduce((s, i) => s + i.quantity * i.price, 0);
  const criticalItems = safeItems.filter((i) => i.status === 'critical' || i.status === 'out_of_stock').length;
  const overstockedItems = safeItems.filter((i) => i.status === 'overstocked').length;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* 页面标题 */}
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111827' }}>
        📦 库存管理
      </h1>

      {/* 核心指标卡 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 20,
      }}>
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: '1px solid #bfdbfe',
        }}>
          <div style={{ fontSize: 13, color: '#1e40af', marginBottom: 4 }}>库存总件数</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1e3a8a' }}>
            {totalStock.toLocaleString()}
          </div>
        </div>
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>库存总值</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#14532d' }}>
            {formatCurrency(totalValue)}
          </div>
        </div>
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          border: '1px solid #fecaca',
        }}>
          <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 4 }}>⚠️ 告急/缺货</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#7f1d1d' }}>{criticalItems}</div>
        </div>
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
          border: '1px solid #ddd6fe',
        }}>
          <div style={{ fontSize: 13, color: '#5b21b6', marginBottom: 4 }}>库存积压</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#4c1d95' }}>{overstockedItems}</div>
        </div>
      </div>

      {/* 搜索/筛选工具栏 */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap',
        padding: '12px 16px', borderRadius: 10,
        background: '#f9fafb', border: '1px solid #e5e7eb',
      }}>
        <input
          data-testid="stock-search-input"
          type="text"
          placeholder="搜索商品名称/SKU编码…"
          defaultValue={searchQuery}
          style={{
            padding: '7px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            minWidth: 220,
          }}
        />
        <select
          data-testid="stock-category-filter"
          defaultValue={categoryFilter}
          style={{ padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        >
          {STOCK_CATEGORIES.map((cat) => (
            <option key={cat} value={cat === '全部' ? '' : cat}>{cat}</option>
          ))}
        </select>
        <select
          data-testid="stock-status-filter"
          defaultValue={statusFilter}
          style={{ padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        >
          <option value="">全部状态</option>
          <option value="sufficient">充足</option>
          <option value="low">偏低</option>
          <option value="critical">告急</option>
          <option value="out_of_stock">缺货</option>
          <option value="overstocked">过剩</option>
        </select>
        <button
          data-testid="stock-search-btn"
          style={{
            padding: '7px 18px', borderRadius: 6, border: 'none',
            backgroundColor: '#2563eb', color: '#fff', fontWeight: 600,
            fontSize: 14, cursor: 'pointer',
          }}
        >
          搜索
        </button>
        <button
          data-testid="stock-reset-btn"
          style={{
            padding: '7px 18px', borderRadius: 6,
            border: '1px solid #d1d5db', backgroundColor: '#fff',
            color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          重置
        </button>
      </div>

      {/* 统计摘要 */}
      <div style={{ marginBottom: 12, fontSize: 14, color: '#6b7280', display: 'flex', gap: 16 }}>
        <span>共 <strong data-testid="stock-total-count">{total}</strong> 种商品</span>
        <span>显示 <strong>{safeItems.length}</strong> 条</span>
      </div>

      {/* 库存表格 */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <table
          data-testid="stock-table"
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>SKU</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>商品名称</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>分类</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>库存数量</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>阈值</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>单价</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>库存状态</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>更新时间</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {safeItems.map((item) => (
              <tr
                key={item.id}
                data-testid={`stock-row-${item.id}`}
                style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
              >
                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>
                  {item.sku}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{item.category}</td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>
                  {item.quantity.toLocaleString()} {item.unit}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#9ca3af' }}>
                  {item.minThreshold} ~ {item.maxThreshold} {item.unit}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>
                  {formatCurrency(item.price)}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <StockStatusBadge status={item.status} />
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{item.updatedAt}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      data-testid={`stock-view-${item.id}`}
                      style={{
                        padding: '4px 10px', borderRadius: 4,
                        border: '1px solid #d1d5db', backgroundColor: '#fff',
                        fontSize: 12, cursor: 'pointer', color: '#374151',
                      }}
                    >
                      查看
                    </button>
                    <button
                      data-testid={`stock-edit-${item.id}`}
                      style={{
                        padding: '4px 10px', borderRadius: 4,
                        border: '1px solid #2563eb', backgroundColor: '#eff6ff',
                        fontSize: 12, cursor: 'pointer', color: '#2563eb',
                      }}
                    >
                      编辑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {safeItems.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <div>暂无库存数据</div>
                  <div style={{ fontSize: 12, color: '#d1d5db', marginTop: 4 }}>
                    请调整筛选条件或导入库存信息
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div
        data-testid="stock-pagination"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          marginTop: 16,
          fontSize: 14,
        }}
      >
        <span style={{ color: '#9ca3af', marginRight: 8 }}>
          每页 {pageSize} 条
        </span>
        <button
          data-testid="stock-page-prev"
          disabled={page <= 1}
          style={{
            padding: '5px 14px', borderRadius: 6,
            border: '1px solid #d1d5db',
            backgroundColor: page <= 1 ? '#f3f4f6' : '#fff',
            color: page <= 1 ? '#d1d5db' : '#374151',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            fontSize: 13,
          }}
        >
          上一页
        </button>
        <span data-testid="stock-page-info" style={{ color: '#6b7280' }}>
          第 <strong>{page}</strong> / <strong>{totalPages}</strong> 页
        </span>
        <button
          data-testid="stock-page-next"
          disabled={page >= totalPages}
          style={{
            padding: '5px 14px', borderRadius: 6,
            border: '1px solid #d1d5db',
            backgroundColor: page >= totalPages ? '#f3f4f6' : '#fff',
            color: page >= totalPages ? '#d1d5db' : '#374151',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            fontSize: 13,
          }}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
