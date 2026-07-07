/**
 * 订单详情页 — Order Detail Page (Next.js App Router Page)
 * 功能: 查看订单详情、编辑订单信息、删除订单、状态流转(待确认→已确认→备货中→已发货→已送达/已取消)
 * 角色视角: 👔店长 / 🛒前台
 */
'use client';

import React, { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrderStatusBadge, type OrderStatus } from '../components/OrderStatusBadge';

/* ── 常量 ── */

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  preparing: '备货中',
  shipped: '已发货',
  delivered: '已送达',
  cancelled: '已取消',
  refunded: '已退款',
};

/** 正序流转：待确认 → 已确认 → 备货中 → 已发货 → 已送达 */
const FORWARD_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];

/* ── Mock 数据 ── */

interface OrderDetailItem {
  id: string;
  orderNo: string;
  memberName: string;
  memberPhone: string;
  storeName: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  address: string;
  expressCompany: string;
  expressNo: string;
  remark: string;
  products: { name: string; qty: number; price: number }[];
}

const MOCK_ORDERS: Record<string, OrderDetailItem> = {
  '1': {
    id: '1', orderNo: 'ORD-20260625-001', memberName: '张伟', memberPhone: '138****1234',
    storeName: 'Demo Store 旗舰店', status: 'pending',
    totalAmount: 35600, itemCount: 3,
    createdAt: '2026-06-25 14:30', updatedAt: '2026-06-25 14:30', paidAt: null,
    address: '北京市朝阳区建国路88号SOHO现代城A座1508',
    expressCompany: '', expressNo: '', remark: '请尽快发货，急用',
    products: [
      { name: '玫瑰精华爽肤水', qty: 2, price: 16800 },
      { name: '玻尿酸保湿面霜', qty: 1, price: 23800 },
    ],
  },
  '2': {
    id: '2', orderNo: 'ORD-20260625-002', memberName: '李娜', memberPhone: '139****5678',
    storeName: 'Demo Store 旗舰店', status: 'confirmed',
    totalAmount: 8900, itemCount: 1,
    createdAt: '2026-06-25 10:15', updatedAt: '2026-06-25 10:30', paidAt: '2026-06-25 10:16',
    address: '上海市浦东新区陆家嘴金融中心B座2201',
    expressCompany: '顺丰速运', expressNo: 'SF1234567890', remark: '',
    products: [
      { name: '丝绒哑光口红·正红色', qty: 1, price: 8900 },
    ],
  },
  '3': {
    id: '3', orderNo: 'ORD-20260624-015', memberName: '王芳', memberPhone: '137****9012',
    storeName: 'Demo Store 社区店', status: 'shipped',
    totalAmount: 45600, itemCount: 4,
    createdAt: '2026-06-24 18:00', updatedAt: '2026-06-25 08:00', paidAt: '2026-06-24 18:05',
    address: '广东省深圳市南山区科技园南区W1-A栋1001',
    expressCompany: '中通快递', expressNo: 'ZTO9876543210', remark: '放快递柜',
    products: [
      { name: '氨基酸洁面乳', qty: 2, price: 7900 },
      { name: '水感防晒霜 SPF50+', qty: 1, price: 16800 },
      { name: '玻尿酸保湿面霜', qty: 1, price: 23800 },
    ],
  },
  '4': {
    id: '4', orderNo: 'ORD-20260623-008', memberName: '赵强', memberPhone: '136****3456',
    storeName: 'Demo Store 旗舰店', status: 'delivered',
    totalAmount: 12800, itemCount: 2,
    createdAt: '2026-06-23 09:00', updatedAt: '2026-06-25 12:00', paidAt: '2026-06-23 09:02',
    address: '浙江省杭州市西湖区文三路478号华星科技大厦1206',
    expressCompany: '京东快递', expressNo: 'JD555566667777',
    remark: '',
    products: [
      { name: '眼影盘·日落余晖', qty: 1, price: 8900 },
      { name: '定妆喷雾', qty: 1, price: 3900 },
    ],
  },
};

function formatCurrency(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

/* ── 信息行小组件 ── */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '8px 0', borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: 13, color: '#6b7280', minWidth: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ fontSize: 14, color: '#111827', textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

/* ── 页面 ── */

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const item = MOCK_ORDERS[id];

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(item ? item.status : 'pending');

  // 编辑态表单
  const [editRemark, setEditRemark] = useState(item?.remark ?? '');
  const [editAddress, setEditAddress] = useState(item?.address ?? '');
  const [editExpressCompany, setEditExpressCompany] = useState(item?.expressCompany ?? '');
  const [editExpressNo, setEditExpressNo] = useState(item?.expressNo ?? '');

  const handleStatusForward = useCallback(() => {
    const idx = FORWARD_FLOW.indexOf(currentStatus);
    if (idx >= 0 && idx < FORWARD_FLOW.length - 1) {
      const next = FORWARD_FLOW[idx + 1]!;
      setCurrentStatus(next);
    } else if (currentStatus === 'shipped') {
      setCurrentStatus('delivered');
    }
  }, [currentStatus]);

  const handleStatusBack = useCallback(() => {
    if (currentStatus === 'cancelled') {
      setCurrentStatus('pending');
      return;
    }
    const idx = FORWARD_FLOW.indexOf(currentStatus);
    if (idx > 0) {
      setCurrentStatus(FORWARD_FLOW[idx - 1]!);
    }
  }, [currentStatus]);

  const handleCancel = useCallback(() => {
    setCurrentStatus('cancelled');
  }, []);

  const handleSave = useCallback(() => {
    setEditing(false);
  }, []);

  const handleDelete = useCallback(() => {
    setDeleting(true);
    setTimeout(() => {
      router.push('/orders');
    }, 500);
  }, [router]);

  const handleBack = useCallback(() => {
    router.push('/orders');
  }, [router]);

  function enterEdit() {
    setEditRemark(item?.remark ?? '');
    setEditAddress(item?.address ?? '');
    setEditExpressCompany(item?.expressCompany ?? '');
    setEditExpressNo(item?.expressNo ?? '');
    setEditing(true);
  }

  /* 未找到 */
  if (!item) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>订单未找到</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          未找到 ID 为 <strong>{id}</strong> 的订单，可能已被删除。
        </p>
        <button
          onClick={handleBack}
          style={{
            padding: '8px 24px', borderRadius: 8, border: '1px solid #d1d5db',
            background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
          }}
          data-testid="order-detail-back-list"
        >
          返回订单列表
        </button>
      </div>
    );
  }

  /* 正在删除 */
  if (deleting) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>删除完成</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          订单 <strong>{item.orderNo}</strong> 已成功删除，正在返回订单列表...
        </p>
      </div>
    );
  }

  const canForward =
    currentStatus !== 'cancelled' &&
    currentStatus !== 'refunded' &&
    currentStatus !== 'delivered';
  const canBack =
    currentStatus !== 'delivered' && currentStatus !== 'refunded';
  const canCancel = currentStatus === 'pending' || currentStatus === 'confirmed';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      {/* ← 返回按钮 */}
      <button
        onClick={handleBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
          background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
          marginBottom: 20,
        }}
        data-testid="order-detail-back"
      >
        ← 返回订单列表
      </button>

      {/* 标题区 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 }}>
            📋 订单详情
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280' }}>
            <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{item.orderNo}</span>
            <span>·</span>
            <span>{item.storeName}</span>
            <span>·</span>
            <OrderStatusBadge status={currentStatus} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!editing && (
            <>
              <button
                onClick={enterEdit}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid #2563eb',
                  background: '#eff6ff', color: '#2563eb', fontWeight: 600,
                  fontSize: 14, cursor: 'pointer',
                }}
                data-testid="order-detail-edit"
              >
                ✏️ 编辑
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid #dc2626',
                  background: '#fef2f2', color: '#dc2626', fontWeight: 600,
                  fontSize: 14, cursor: 'pointer',
                }}
                data-testid="order-detail-delete"
              >
                🗑️ 删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* 确认删除对话框 */}
      {showConfirmDelete && (
        <div style={{
          marginBottom: 24, padding: 20, borderRadius: 12,
          background: '#fef2f2', border: '1px solid #fecaca',
        }} data-testid="order-detail-delete-confirm">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>
            确认删除此订单？
          </div>
          <p style={{ fontSize: 14, color: '#b91c1c', marginBottom: 16 }}>
            此操作不可撤销。订单 &ldquo;{item.orderNo}&rdquo; 将被永久删除。
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#dc2626', color: '#fff', fontWeight: 600,
                fontSize: 14, cursor: 'pointer',
              }}
              data-testid="order-detail-delete-confirm-btn"
            >
              确认删除
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              style={{
                padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db',
                background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
              }}
              data-testid="order-detail-delete-cancel"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 状态流转操作栏 */}
      {!editing && (
        <div style={{
          marginBottom: 24, padding: 16, borderRadius: 12,
          background: '#f0f9ff', border: '1px solid #bae6fd',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }} data-testid="order-detail-status-bar">
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0369a1' }}>
            订单状态流转:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handleStatusBack}
              disabled={!canBack || currentStatus === 'pending' || currentStatus === 'cancelled'}
              style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid #93c5fd',
                background: '#dbeafe', color: '#1e40af', fontSize: 13,
                cursor: canBack && currentStatus !== 'pending' ? 'pointer' : 'not-allowed',
                opacity: canBack && currentStatus !== 'pending' ? 1 : 0.5,
              }}
              data-testid="order-detail-status-back"
            >
              ← 回退
            </button>
            <span style={{
              padding: '4px 12px', borderRadius: 6,
              background: '#0284c7', color: '#fff', fontSize: 13,
              fontWeight: 600, minWidth: 60, textAlign: 'center',
            }} data-testid="order-detail-status-current">
              {STATUS_LABEL[currentStatus]}
            </span>
            <button
              onClick={handleStatusForward}
              disabled={!canForward}
              style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid #93c5fd',
                background: '#dbeafe', color: '#1e40af', fontSize: 13,
                cursor: canForward ? 'pointer' : 'not-allowed',
                opacity: canForward ? 1 : 0.5,
              }}
              data-testid="order-detail-status-forward"
            >
              推进 →
            </button>
          </div>
          {canCancel && (
            <button
              onClick={handleCancel}
              style={{
                padding: '4px 14px', borderRadius: 6, border: '1px solid #fca5a5',
                background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="order-detail-cancel-order"
            >
              取消订单
            </button>
          )}
        </div>
      )}

      {/* 两列布局 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24,
      }}>
        {/* 会员 & 收货信息 */}
        <div style={{
          padding: 20, borderRadius: 12,
          background: '#fff', border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
            会员信息
          </h2>
          <InfoRow label="会员姓名" value={item.memberName} />
          <InfoRow label="手机号" value={item.memberPhone} />
          <InfoRow label="所属门店" value={item.storeName} />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 20 }}>
            收货信息
          </h2>
          {editing ? (
            <>
              <InfoRow label="收货地址" value={
                <textarea
                  defaultValue={item.address}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  style={{ width: '100%', borderRadius: 6, border: '1px solid #d1d5db', padding: 6, fontSize: 14 }}
                  data-testid="order-detail-edit-address"
                />
              } />
              <InfoRow label="快递公司" value={
                <select
                  defaultValue={item.expressCompany}
                  onChange={(e) => setEditExpressCompany(e.target.value)}
                  style={{ borderRadius: 6, border: '1px solid #d1d5db', padding: '4px 8px', fontSize: 14 }}
                  data-testid="order-detail-edit-express"
                >
                  <option value="">请选择</option>
                  <option value="顺丰速运">顺丰速运</option>
                  <option value="中通快递">中通快递</option>
                  <option value="圆通速递">圆通速递</option>
                  <option value="韵达快递">韵达快递</option>
                  <option value="京东快递">京东快递</option>
                </select>
              } />
              <InfoRow label="快递单号" value={
                <input
                  defaultValue={item.expressNo}
                  onChange={(e) => setEditExpressNo(e.target.value)}
                  style={{ borderRadius: 6, border: '1px solid #d1d5db', padding: '4px 8px', fontSize: 14 }}
                  data-testid="order-detail-edit-express-no"
                />
              } />
            </>
          ) : (
            <>
              <InfoRow label="收货地址" value={
                <span style={{ fontSize: 14, lineHeight: 1.5 }}>{item.address}</span>
              } />
              <InfoRow label="快递公司" value={item.expressCompany || <span style={{ color: '#9ca3af' }}>未分配</span>} />
              <InfoRow label="快递单号" value={item.expressNo || <span style={{ color: '#9ca3af' }}>暂无</span>} />
            </>
          )}
          <InfoRow label="备注" value={
            editing ? (
              <input
                defaultValue={item.remark}
                onChange={(e) => setEditRemark(e.target.value)}
                style={{ borderRadius: 6, border: '1px solid #d1d5db', padding: '4px 8px', fontSize: 14, width: '100%' }}
                data-testid="order-detail-edit-remark"
              />
            ) : (
              item.remark || <span style={{ color: '#9ca3af' }}>无备注</span>
            )
          } />
        </div>

        {/* 金额 & 时间线 */}
        <div style={{
          padding: 20, borderRadius: 12,
          background: '#fff', border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
            金额信息
          </h2>
          <InfoRow label="订单金额" value={
            <span style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
              {formatCurrency(item.totalAmount)}
            </span>
          } />
          <InfoRow label="商品数量" value={`${item.itemCount} 件`} />
          <InfoRow label="支付状态" value={
            item.paidAt
              ? <span style={{ color: '#059669', fontWeight: 500 }}>已支付</span>
              : <span style={{ color: '#f59e0b', fontWeight: 500 }}>待支付</span>
          } />

          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 20 }}>
            时间线
          </h2>
          <InfoRow label="创建时间" value={item.createdAt} />
          <InfoRow label="更新时间" value={item.updatedAt} />
          {item.paidAt && (
            <InfoRow label="支付时间" value={item.paidAt} />
          )}
        </div>
      </div>

      {/* 商品清单 */}
      <div style={{
        padding: 20, borderRadius: 12, marginBottom: 24,
        background: '#fff', border: '1px solid #e5e7eb',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
          商品清单
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="order-detail-products-table">
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>商品名称</th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13, textAlign: 'right' }}>单价</th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13, textAlign: 'right' }}>数量</th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13, textAlign: 'right' }}>小计</th>
            </tr>
          </thead>
          <tbody>
            {item.products.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 12px', fontSize: 14 }}>{p.name}</td>
                <td style={{ padding: '10px 12px', fontSize: 14, textAlign: 'right' }}>{formatCurrency(p.price)}</td>
                <td style={{ padding: '10px 12px', fontSize: 14, textAlign: 'right' }}>{p.qty}</td>
                <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600, textAlign: 'right' }}>
                  {formatCurrency(p.price * p.qty)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700, textAlign: 'right' }}>
                合计
              </td>
              <td style={{ padding: '10px 12px', fontSize: 16, fontWeight: 700, textAlign: 'right', color: '#059669' }}>
                {formatCurrency(item.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 编辑模式下保存/取消按钮 */}
      {editing && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 28px', borderRadius: 8, border: 'none',
              background: '#2563eb', color: '#fff', fontWeight: 600,
              fontSize: 14, cursor: 'pointer',
            }}
            data-testid="order-detail-save"
          >
            💾 保存修改
          </button>
          <button
            onClick={() => setEditing(false)}
            style={{
              padding: '10px 28px', borderRadius: 8, border: '1px solid #d1d5db',
              background: '#fff', color: '#374151', fontWeight: 600,
              fontSize: 14, cursor: 'pointer',
            }}
            data-testid="order-detail-cancel"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
