/**
 * SupplierDetailPage — 供应商详情页 (ToB)
 * 角色视角: 👔品牌运营 / 💳采购经理
 * 功能: 基础信息查看/编辑、状态流转、采购订单历史、评价记录
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { SupplierItem, SupplierStatus } from '../../suppliers-data';

/* ── 扩展供应商详情类型 ── */
export interface SupplierDetail extends SupplierItem {
  description: string;
  orderCount: number;
  returnRate: string;
  avgDeliveryDays: number;
  qualityScore: number;
  recentOrders: { id: string; product: string; amount: number; date: string; status: string }[];
  evaluations: { date: string; score: number; comment: string; reviewer: string }[];
}

/* ── Props ── */
export interface SupplierDetailPageProps {
  supplier: SupplierDetail;
}

/* ── 辅助 ── */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

const STATUS_LABELS: Record<SupplierStatus, string> = {
  active: '合作中',
  paused: '暂停合作',
  pending: '待审核',
  terminated: '已终止',
};

const STATUS_COLORS: Record<SupplierStatus, string> = {
  active: '#059669',
  paused: '#d97706',
  pending: '#7c3aed',
  terminated: '#dc2626',
};

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
  pending: [
    { label: '通过审批', target: 'active' },
    { label: '拒绝入驻', target: 'terminated' },
  ],
  terminated: [
    { label: '重新合作', target: 'active' },
  ],
};

/* ── Status Badge ── */
function StatusBadge({ status }: { status: SupplierStatus }): React.ReactElement {
  const label = STATUS_LABELS[status] ?? status;
  const color = STATUS_COLORS[status] ?? '#6b7280';
  return (
    <span
      data-testid={`detail-status-badge-${status}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
        backgroundColor: color + '18', color, border: `1px solid ${color}40`, whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

/* ── 主组件 ── */
export function SupplierDetailPage({ supplier }: SupplierDetailPageProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<SupplierStatus>(supplier.status);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const transitions = STATUS_TRANSITIONS[status] ?? [];
  const totalOrderPages = Math.max(1, Math.ceil(supplier.recentOrders.length / 5));

  const handleStatusChange = (target: SupplierStatus) => {
    setStatus(target);
    setShowStatusMenu(false);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      {/* 面包屑 */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 14 }}>
        <Link href="/suppliers" style={{ color: '#2563eb', textDecoration: 'none' }}>← 供应商管理</Link>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ color: '#6b7280' }}>{supplier.code}</span>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontWeight: 600, color: '#111827' }}>{supplier.name}</span>
      </nav>

      {/* 头部操作栏 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              {supplier.name}
            </h1>
            <StatusBadge status={status} />
          </div>
          <div style={{ display: 'flex', gap: 20, color: '#9ca3af', fontSize: 13, flexWrap: 'wrap' }}>
            <span>编码: <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{supplier.code}</strong></span>
            <span>品类: {supplier.category}</span>
            <span>合作起始: {supplier.cooperationStart}</span>
            <span>最新更新: {supplier.updatedAt}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="detail-edit-btn"
            onClick={() => setEditing(!editing)}
            style={{
              padding: '8px 18px', borderRadius: 6, border: `1px solid ${editing ? '#fca5a5' : '#2563eb'}`,
              backgroundColor: editing ? '#fef2f2' : '#fff',
              color: editing ? '#dc2626' : '#2563eb', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            {editing ? '✕ 取消编辑' : '✏️ 编辑信息'}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              data-testid="detail-status-btn"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              style={{
                padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db',
                backgroundColor: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              🔄 状态流转
            </button>
            {showStatusMenu && (
              <div
                data-testid="detail-status-menu"
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb', minWidth: 170, zIndex: 50, overflow: 'hidden',
                }}
              >
                {transitions.length === 0 ? (
                  <div style={{ padding: '10px 14px', color: '#9ca3af', fontSize: 13 }}>无可用流转</div>
                ) : transitions.map((t) => (
                  <button
                    key={t.target}
                    data-testid={`detail-status-transition-${t.target}`}
                    onClick={() => handleStatusChange(t.target)}
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px',
                      border: 'none', backgroundColor: 'transparent',
                      textAlign: 'left', fontSize: 14, cursor: 'pointer',
                      color: '#374151',
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
            data-testid="detail-delete-btn"
            style={{
              padding: '8px 18px', borderRadius: 6, border: '1px solid #fca5a5',
              backgroundColor: '#fff', color: '#dc2626', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            🗑️ 删除
          </button>
        </div>
      </div>

      {/* 双列卡片布局 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* 基本信息 */}
        <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: 15, color: '#111827' }}>
            📋 基本信息
          </div>
          <div style={{ padding: '16px 18px' }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: 13, color: '#374151' }}>
                  联系人:
                  <input data-testid="edit-contact-person" defaultValue={supplier.contactPerson}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
                </label>
                <label style={{ fontSize: 13, color: '#374151' }}>
                  联系电话:
                  <input data-testid="edit-phone" defaultValue={supplier.phone}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
                </label>
                <label style={{ fontSize: 13, color: '#374151' }}>
                  邮箱:
                  <input data-testid="edit-email" defaultValue={supplier.email}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
                </label>
                <label style={{ fontSize: 13, color: '#374151' }}>
                  地址:
                  <input data-testid="edit-address" defaultValue={supplier.address}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
                </label>
                <label style={{ fontSize: 13, color: '#374151' }}>
                  备注描述:
                  <textarea data-testid="edit-description" defaultValue={supplier.description} rows={3}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
                </label>
                <button
                  data-testid="detail-save-btn"
                  onClick={() => setEditing(false)}
                  style={{
                    padding: '8px 20px', borderRadius: 6, border: 'none',
                    backgroundColor: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start',
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
                <InfoRow label="品类" value={supplier.category} />
                <InfoRow label="地址" value={supplier.address} span />
                <InfoRow label="备注描述" value={supplier.description || '暂无'} span />
              </div>
            )}
          </div>
        </div>

        {/* 经营数据 */}
        <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: 15, color: '#111827' }}>
            📊 经营数据
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <MetricCard label="合作商品数" value={`${supplier.totalProducts} 种`} color="#2563eb" />
              <MetricCard label="累计采购额" value={formatCurrency(supplier.totalAmount)} color="#059669" />
              <MetricCard label="订单数量" value={`${supplier.orderCount} 单`} color="#d97706" />
              <MetricCard label="退货率" value={supplier.returnRate || '-'} color="#7c3aed" />
              <MetricCard label="平均交货天数" value={`${supplier.avgDeliveryDays} 天`} color="#0891b2" />
              <MetricCard label="质量评分" value={`${supplier.qualityScore} 分`} color="#dc2626" />
            </div>
          </div>
        </div>
      </div>

      {/* 最近采购订单 */}
      <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: 15, color: '#111827' }}>
          📦 最近采购订单
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table data-testid="detail-recent-orders" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>订单号</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>产品</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>金额</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>日期</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>状态</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {supplier.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                    <div>暂无采购订单记录</div>
                  </td>
                </tr>
              ) : supplier.recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>
                    {order.id}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500 }}>{order.product}</td>
                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>{formatCurrency(order.amount)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{order.date}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, backgroundColor: '#f0fdf4', color: '#059669' }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 12, cursor: 'pointer', color: '#374151' }}>
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {supplier.recentOrders.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '12px 18px', borderTop: '1px solid #e5e7eb', fontSize: 14 }}>
            <span style={{ color: '#9ca3af' }}>每页 5 条</span>
            <button disabled style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 13, cursor: 'not-allowed', color: '#d1d5db' }}>
              上一页
            </button>
            <span data-testid="detail-order-page-info" style={{ color: '#6b7280' }}>
              第 <strong>1</strong> / <strong>{totalOrderPages}</strong> 页
            </span>
            <button style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: totalOrderPages <= 1 ? '#f3f4f6' : '#fff', fontSize: 13, cursor: totalOrderPages <= 1 ? 'not-allowed' : 'pointer', color: totalOrderPages <= 1 ? '#d1d5db' : '#374151' }}>
              下一页
            </button>
          </div>
        )}
      </div>

      {/* 供应商评价 */}
      <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: 15, color: '#111827' }}>
          ⭐ 供应商评价记录
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table data-testid="detail-evaluations" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>日期</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>评分</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>评价内容</th>
                <th style={{ padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#374151' }}>评价人</th>
              </tr>
            </thead>
            <tbody>
              {supplier.evaluations.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>⭐</div>
                    <div>暂无评价记录</div>
                  </td>
                </tr>
              ) : supplier.evaluations.map((ev, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{ev.date}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontWeight: 700, color: ev.score >= 4 ? '#059669' : ev.score >= 3 ? '#d97706' : '#dc2626' }}>
                      {'★'.repeat(ev.score)}{'☆'.repeat(5 - ev.score)}
                    </span>
                    <span style={{ marginLeft: 6, fontSize: 13, color: '#374151' }}>{ev.score}/5</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#374151' }}>{ev.comment}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{ev.reviewer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    <div style={{ borderRadius: 8, padding: '12px 14px', background: color + '08', border: `1px solid ${color}20` }}>
      <div style={{ fontSize: 12, color, marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
