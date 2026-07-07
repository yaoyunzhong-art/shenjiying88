/**
 * SupplierDetailPage — 供应商详情页组件 (Client-side compatible)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 基础信息展示、编辑表单、状态流转按钮、采购订单历史
 */
'use client';

import React, { useState } from 'react';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import type { SupplierStatus, SupplierItem } from './SupplierStatusBadge';

/* ── 扩展供应商类型 ── */
export interface SupplierDetail extends SupplierItem {
  description: string;
  orderCount: number;
  returnRate: string;
  recentOrders: { id: string; product: string; amount: number; date: string; status: string }[];
}

/* ── Props ── */
export interface SupplierDetailPageProps {
  supplier: SupplierDetail;
}

/* ── Helpers ── */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

/* ── 状态流转选项 ── */
const STATUS_TRANSITIONS: Record<SupplierStatus, { label: string; target: SupplierStatus }[]> = {
  active: [
    { label: '暂停合作', target: 'paused' },
    { label: '终止合作', target: 'terminated' },
  ],
  paused: [
    { label: '恢复合作', target: 'active' },
    { label: '终止合作', target: 'terminated' },
  ],
  terminated: [
    { label: '重新合作', target: 'active' },
  ],
  pending: [
    { label: '通过审批', target: 'active' },
    { label: '拒绝', target: 'terminated' },
  ],
};

/* ── Component ── */
export function SupplierDetailPage({ supplier }: SupplierDetailPageProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<SupplierStatus>(supplier.status);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const transitions = STATUS_TRANSITIONS[status] ?? [];

  const handleStatusChange = (target: SupplierStatus) => {
    setStatus(target);
    setShowStatusMenu(false);
  };

  // 模拟最近采购订单的格式
  const totalPage = Math.max(1, Math.ceil(supplier.recentOrders.length / 5));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      {/* 面包屑导航 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 14 }}>
        <a href="/suppliers" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← 供应商管理
        </a>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ color: '#6b7280' }}>{supplier.name}</span>
      </div>

      {/* 头部信息 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              {supplier.name}
            </h1>
            <SupplierStatusBadge status={status} />
          </div>
          <div style={{ display: 'flex', gap: 16, color: '#9ca3af', fontSize: 14 }}>
            <span>编码: <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{supplier.code}</strong></span>
            <span>创建: {supplier.cooperationStart}</span>
            <span>更新: {supplier.updatedAt}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="supplier-edit-btn"
            onClick={() => setEditing(!editing)}
            style={{
              padding: '8px 18px', borderRadius: 6, border: '1px solid #2563eb',
              backgroundColor: editing ? '#dbeafe' : '#fff',
              color: '#2563eb', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            {editing ? '取消编辑' : '✏️ 编辑信息'}
          </button>

          {/* 状态流转按钮 */}
          <div style={{ position: 'relative' }}>
            <button
              data-testid="supplier-status-btn"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              style={{
                padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db',
                backgroundColor: '#fff', color: '#374151', fontWeight: 600,
                fontSize: 14, cursor: 'pointer',
              }}
            >
              🔄 状态流转
            </button>
            {showStatusMenu && (
              <div
                data-testid="supplier-status-menu"
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb', minWidth: 160, zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                {transitions.length === 0 ? (
                  <div style={{ padding: '10px 14px', color: '#9ca3af', fontSize: 13 }}>
                    无可用流转
                  </div>
                ) : transitions.map((t) => (
                  <button
                    key={t.target}
                    data-testid={`status-transition-${t.target}`}
                    onClick={() => handleStatusChange(t.target)}
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px',
                      border: 'none', backgroundColor: 'transparent',
                      textAlign: 'left', fontSize: 14, cursor: 'pointer',
                      color: '#374151', transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            data-testid="supplier-delete-btn"
            style={{
              padding: '8px 18px', borderRadius: 6, border: '1px solid #fca5a5',
              backgroundColor: '#fff', color: '#dc2626', fontWeight: 600,
              fontSize: 14, cursor: 'pointer',
            }}
          >
            🗑️ 删除
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* 基本信息卡片 */}
        <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: 15, color: '#111827' }}>
            📋 基本信息
          </div>
          <div style={{ padding: '16px 18px' }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: 13, color: '#374151' }}>
                  联系人:
                  <input
                    data-testid="edit-contact-person"
                    defaultValue={supplier.contactPerson}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </label>
                <label style={{ fontSize: 13, color: '#374151' }}>
                  联系电话:
                  <input
                    data-testid="edit-phone"
                    defaultValue={supplier.phone}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </label>
                <label style={{ fontSize: 13, color: '#374151' }}>
                  邮箱:
                  <input
                    data-testid="edit-email"
                    defaultValue={supplier.email}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </label>
                <label style={{ fontSize: 13, color: '#374151' }}>
                  地址:
                  <input
                    data-testid="edit-address"
                    defaultValue={supplier.address}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </label>
                <label style={{ fontSize: 13, color: '#374151' }}>
                  描述:
                  <textarea
                    data-testid="edit-description"
                    defaultValue={supplier.description}
                    rows={3}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }}
                  />
                </label>
                <button
                  data-testid="supplier-save-btn"
                  onClick={() => setEditing(false)}
                  style={{
                    padding: '8px 20px', borderRadius: 6, border: 'none',
                    backgroundColor: '#2563eb', color: '#fff', fontWeight: 600,
                    fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start',
                  }}
                >
                  💾 保存修改
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                <InfoRow label="联系人" value={supplier.contactPerson} />
                <InfoRow label="联系电话" value={supplier.phone} />
                <InfoRow label="邮箱" value={supplier.email} />
                <InfoRow label="分类" value={supplier.category} />
                <InfoRow label="地址" value={supplier.address} span />
                <InfoRow label="描述" value={supplier.description} span />
              </div>
            )}
          </div>
        </div>

        {/* 经营数据卡片 */}
        <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: 15, color: '#111827' }}>
            📊 经营数据
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <MetricCard label="合作商品" value={`${supplier.totalProducts} 种`} color="#2563eb" />
              <MetricCard label="采购总额" value={formatCurrency(supplier.totalAmount)} color="#059669" />
              <MetricCard label="订单数量" value={`${supplier.orderCount} 单`} color="#d97706" />
              <MetricCard label="退货率" value={supplier.returnRate} color={supplier.returnRate === '-' ? '#9ca3af' : '#7c3aed'} />
            </div>
          </div>
        </div>
      </div>

      {/* 最近采购订单 */}
      <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: 15, color: '#111827' }}>
          📦 最近采购订单
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            data-testid="supplier-recent-orders"
            style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>订单号</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>产品</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>金额</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>订单日期</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>状态</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {supplier.recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>
                    {order.id}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500 }}>{order.product}</td>
                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>
                    {formatCurrency(order.amount)}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{order.date}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                      fontSize: 12, fontWeight: 600,
                      backgroundColor: '#f0fdf4', color: '#059669',
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button style={{
                      padding: '4px 10px', borderRadius: 4,
                      border: '1px solid #d1d5db', backgroundColor: '#fff',
                      fontSize: 12, cursor: 'pointer', color: '#374151',
                    }}>
                      查看
                    </button>
                  </td>
                </tr>
              ))}
              {supplier.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                    <div>暂无采购订单记录</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {supplier.recentOrders.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '12px 18px', borderTop: '1px solid #e5e7eb', fontSize: 14 }}>
            <span style={{ color: '#9ca3af' }}>每页 5 条</span>
            <button style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid #d1d5db',
              backgroundColor: '#fff', fontSize: 13, cursor: 'not-allowed', color: '#d1d5db',
            }} disabled>
              上一页
            </button>
            <span data-testid="supplier-order-page-info" style={{ color: '#6b7280' }}>
              第 <strong>1</strong> / <strong>{totalPage}</strong> 页
            </span>
            <button style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid #d1d5db',
              backgroundColor: totalPage <= 1 ? '#f3f4f6' : '#fff',
              fontSize: 13, cursor: totalPage <= 1 ? 'not-allowed' : 'pointer',
              color: totalPage <= 1 ? '#d1d5db' : '#374151',
            }}>
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 辅助小组件 ── */

function InfoRow({ label, value, span }: { label: string; value: string; span?: boolean }): React.ReactElement {
  return (
    <div style={span ? { gridColumn: '1 / -1' } : {}}>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{value || '-'}</div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }): React.ReactElement {
  return (
    <div style={{
      borderRadius: 8, padding: '12px 14px',
      background: color + '08',
      border: `1px solid ${color}20`,
    }}>
      <div style={{ fontSize: 12, color, marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
