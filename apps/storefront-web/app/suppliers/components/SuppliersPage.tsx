/**
 * SuppliersPage — 供应商管理列表页组件 (Client-side compatible)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 搜索、分类筛选、状态筛选、分页
 */
'use client';

import React from 'react';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import type { SupplierItem, SupplierStatus } from './SupplierStatusBadge';

/* ── Helpers ── */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

/* ── Props ── */
export interface SuppliersPageProps {
  items: SupplierItem[];
  total: number;
  page: number;
  pageSize: number;
  categoryFilter?: string;
  statusFilter?: SupplierStatus | '';
  searchQuery?: string;
}

/* ── 类别常量 ── */
export const SUPPLIER_CATEGORIES = ['全部', '护肤品', '彩妆', '香水', '美妆工具', '包装材料', '其他'];

/* ── Component ── */
export function SuppliersPage({
  items,
  total,
  page,
  pageSize,
  categoryFilter = '',
  statusFilter = '',
  searchQuery = '',
}: SuppliersPageProps): React.ReactElement {
  const safeItems = items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /* 供应商摘要 */
  const activeCount = safeItems.filter((i) => i.status === 'active').length;
  const pendingCount = safeItems.filter((i) => i.status === 'pending').length;
  const terminatedCount = safeItems.filter((i) => i.status === 'terminated').length;
  const totalValue = safeItems.reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* 页面标题 */}
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111827' }}>
        🏭 供应商管理
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
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>合作中</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#14532d' }}>{activeCount}</div>
        </div>
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
          border: '1px solid #fde68a',
        }}>
          <div style={{ fontSize: 13, color: '#92400e', marginBottom: 4 }}>待审批</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#78350f' }}>{pendingCount}</div>
        </div>
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          border: '1px solid #fecaca',
        }}>
          <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 4 }}>已终止</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#7f1d1d' }}>{terminatedCount}</div>
        </div>
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: '1px solid #bfdbfe',
        }}>
          <div style={{ fontSize: 13, color: '#1e40af', marginBottom: 4 }}>采购总额</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1e3a8a' }}>
            {formatCurrency(totalValue)}
          </div>
        </div>
      </div>

      {/* 搜索/筛选工具栏 */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap',
        padding: '12px 16px', borderRadius: 10,
        background: '#f9fafb', border: '1px solid #e5e7eb',
      }}>
        <input
          data-testid="supplier-search-input"
          type="text"
          placeholder="搜索供应商名称/编码/联系人…"
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
          data-testid="supplier-category-filter"
          defaultValue={categoryFilter}
          style={{ padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        >
          {SUPPLIER_CATEGORIES.map((cat) => (
            <option key={cat} value={cat === '全部' ? '' : cat}>{cat}</option>
          ))}
        </select>
        <select
          data-testid="supplier-status-filter"
          defaultValue={statusFilter}
          style={{ padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        >
          <option value="">全部状态</option>
          <option value="active">合作中</option>
          <option value="paused">暂停合作</option>
          <option value="terminated">终止合作</option>
          <option value="pending">审批中</option>
        </select>
        <button
          data-testid="supplier-search-btn"
          style={{
            padding: '7px 18px', borderRadius: 6, border: 'none',
            backgroundColor: '#2563eb', color: '#fff', fontWeight: 600,
            fontSize: 14, cursor: 'pointer',
          }}
        >
          搜索
        </button>
        <button
          data-testid="supplier-reset-btn"
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
        <span>共 <strong data-testid="supplier-total-count">{total}</strong> 家供应商</span>
        <span>显示 <strong>{safeItems.length}</strong> 条</span>
      </div>

      {/* 供应商表格 */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <table
          data-testid="supplier-table"
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>编码</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>供应商名称</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>联系人</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>分类</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>合作商品</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>采购金额</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>状态</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>合作开始</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>更新时间</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {safeItems.map((item) => (
              <tr
                key={item.id}
                data-testid={`supplier-row-${item.id}`}
                style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
              >
                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>
                  {item.code}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>
                  <div>{item.contactPerson}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.phone}</div>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{item.category}</td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>
                  {item.totalProducts} 种
                </td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>
                  {formatCurrency(item.totalAmount)}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <SupplierStatusBadge status={item.status} />
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{item.cooperationStart}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{item.updatedAt}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      data-testid={`supplier-view-${item.id}`}
                      style={{
                        padding: '4px 10px', borderRadius: 4,
                        border: '1px solid #d1d5db', backgroundColor: '#fff',
                        fontSize: 12, cursor: 'pointer', color: '#374151',
                      }}
                    >
                      查看
                    </button>
                    <button
                      data-testid={`supplier-edit-${item.id}`}
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
                  colSpan={10}
                  style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🏭</div>
                  <div>暂无供应商数据</div>
                  <div style={{ fontSize: 12, color: '#d1d5db', marginTop: 4 }}>
                    请调整筛选条件或新增供应商
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div
        data-testid="supplier-pagination"
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
          data-testid="supplier-page-prev"
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
        <span data-testid="supplier-page-info" style={{ color: '#6b7280' }}>
          第 <strong>{page}</strong> / <strong>{totalPages}</strong> 页
        </span>
        <button
          data-testid="supplier-page-next"
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
