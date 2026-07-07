/**
 * ReturnsPage — 退货单管理列表页组件 (Client-side compatible)
 * 角色视角: 👔店长 / 🛒客服 / 💰财务
 * 功能: 搜索、状态筛选、退款原因筛选、分页
 */
'use client';

import React from 'react';
import { ReturnStatusBadge, RETURN_STATUS_LABELS, RETURN_STATUS_COLORS } from './ReturnStatusBadge';
import type { ReturnItem, ReturnStatus } from './ReturnStatusBadge';

/* ── Helpers ── */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

/* ── Props ── */
export interface ReturnsPageProps {
  items: ReturnItem[];
  total: number;
  page: number;
  pageSize: number;
  statusFilter?: ReturnStatus | '';
  reasonFilter?: string;
  searchQuery?: string;
}

/* ── 退款原因常量 ── */
export const RETURN_REASONS = ['全部', '商品质量问题', '尺寸/规格不符', '发错商品', '不想要了', '收到已损坏', '其他'];

/* ── Component ── */
export function ReturnsPage({
  items,
  total,
  page,
  pageSize,
  statusFilter = '',
  reasonFilter = '',
  searchQuery = '',
}: ReturnsPageProps): React.ReactElement {
  const safeItems = items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /* 退货单摘要 */
  const pendingCount = safeItems.filter((i) => i.status === 'pending').length;
  const processingCount = safeItems.filter((i) => i.status === 'processing').length;
  const completedCount = safeItems.filter((i) => i.status === 'completed').length;
  const totalRefundAmount = safeItems.reduce((s, i) => s + i.amount, 0);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* 页面标题 */}
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111827' }}>
        🔄 退货单管理
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
          background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
          border: '1px solid #fde68a',
        }}>
          <div style={{ fontSize: 13, color: '#92400e', marginBottom: 4 }}>待审核</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#78350f' }}>{pendingCount}</div>
        </div>
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
          border: '1px solid #fed7aa',
        }}>
          <div style={{ fontSize: 13, color: '#9a3412', marginBottom: 4 }}>处理中</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#7c2d12' }}>{processingCount}</div>
        </div>
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>已完成</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#14532d' }}>{completedCount}</div>
        </div>
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          border: '1px solid #fecaca',
        }}>
          <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 4 }}>退款总额</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#7f1d1d' }}>
            {formatCurrency(totalRefundAmount)}
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
          data-testid="return-search-input"
          type="text"
          placeholder="搜索退货单号/订单号/客户名…"
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
          data-testid="return-reason-filter"
          defaultValue={reasonFilter}
          style={{ padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        >
          {RETURN_REASONS.map((reason) => (
            <option key={reason} value={reason === '全部' ? '' : reason}>{reason}</option>
          ))}
        </select>
        <select
          data-testid="return-status-filter"
          defaultValue={statusFilter}
          style={{ padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        >
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="processing">处理中</option>
          <option value="shipped">已寄回</option>
          <option value="received">已收货</option>
          <option value="completed">已完成</option>
          <option value="rejected">已拒绝</option>
        </select>
        <button
          data-testid="return-search-btn"
          style={{
            padding: '7px 18px', borderRadius: 6, border: 'none',
            backgroundColor: '#2563eb', color: '#fff', fontWeight: 600,
            fontSize: 14, cursor: 'pointer',
          }}
        >
          搜索
        </button>
        <button
          data-testid="return-reset-btn"
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
        <span>共 <strong data-testid="return-total-count">{total}</strong> 条退货单</span>
        <span>显示 <strong>{safeItems.length}</strong> 条</span>
      </div>

      {/* 退货单表格 */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <table
          data-testid="return-table"
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>退货单号</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>订单号</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>客户</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>商品</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>数量</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>退款金额</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>原因</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>状态</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>申请人</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>申请时间</th>
              <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {safeItems.map((item) => (
              <tr
                key={item.id}
                data-testid={`return-row-${item.id}`}
                style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
              >
                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>
                  {item.returnNo}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>
                  {item.orderNo}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500 }}>
                  <div>{item.customerName}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.customerPhone}</div>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>
                  <div>{item.productName}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{item.productSku}</div>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>
                  x{item.quantity}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                  {formatCurrency(item.amount)}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280', maxWidth: 140 }}>
                  <span style={{
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 130,
                  }} title={item.reason}>
                    {item.reason}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <ReturnStatusBadge status={item.status} />
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{item.createdBy}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{item.createdAt}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      data-testid={`return-view-${item.id}`}
                      style={{
                        padding: '4px 10px', borderRadius: 4,
                        border: '1px solid #d1d5db', backgroundColor: '#fff',
                        fontSize: 12, cursor: 'pointer', color: '#374151',
                      }}
                    >
                      详情
                    </button>
                    {(item.status === 'pending' || item.status === 'approved') && (
                      <button
                        data-testid={`return-process-${item.id}`}
                        style={{
                          padding: '4px 10px', borderRadius: 4,
                          border: '1px solid #2563eb', backgroundColor: '#eff6ff',
                          fontSize: 12, cursor: 'pointer', color: '#2563eb',
                        }}
                      >
                        处理
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {safeItems.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔄</div>
                  <div>暂无退货单数据</div>
                  <div style={{ fontSize: 12, color: '#d1d5db', marginTop: 4 }}>
                    请调整筛选条件
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div
        data-testid="return-pagination"
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
          data-testid="return-page-prev"
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
        <span data-testid="return-page-info" style={{ color: '#6b7280' }}>
          第 <strong>{page}</strong> / <strong>{totalPages}</strong> 页
        </span>
        <button
          data-testid="return-page-next"
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
