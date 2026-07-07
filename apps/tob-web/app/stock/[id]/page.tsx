/**
 * TOB 库存详情页 — Stock Detail Page (Next.js App Router Page)
 * 功能: 查看库存详情、编辑库存信息、删除记录、状态流转
 * 角色视角: 📋运营经理
 */
'use client';

import React, { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@m5/ui';

import {
  type TobStockStatus,
  type TobStockItem,
  STATUS_LABELS,
  STATUS_COLORS,
  NEXT_STATUS,
  PREV_STATUS,
  formatCurrency,
  calcMarginPercent,
  MOCK_ITEMS,
} from './constants';

/* ── 信息行组件 ── */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 0', borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: 13, color: '#6b7280', minWidth: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ fontSize: 14, color: '#111827', textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

/* ── 页面组件 ── */
export default function TobStockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const item = MOCK_ITEMS[id];

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TobStockStatus>(item?.status ?? 'normal');

  const handleStatusUp = useCallback(() => {
    const next = NEXT_STATUS[currentStatus];
    if (next) setCurrentStatus(next);
  }, [currentStatus]);

  const handleStatusDown = useCallback(() => {
    const prev = PREV_STATUS[currentStatus];
    if (prev) setCurrentStatus(prev);
  }, [currentStatus]);

  const handleSave = useCallback(() => {
    setEditing(false);
  }, []);

  const handleDelete = useCallback(() => {
    setDeleting(true);
    setTimeout(() => router.push('/stock'), 500);
  }, [router]);

  const handleBack = useCallback(() => router.push('/stock'), [router]);

  /* 未找到 */
  if (!item) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>库存商品未找到</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          ID 为 <strong>{id}</strong> 的商品不存在，可能已被删除。
        </p>
        <button
          onClick={handleBack}
          style={{
            padding: '8px 24px', borderRadius: 8, border: '1px solid #d1d5db',
            background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
          }}
          data-testid="tob-stock-detail-back-list"
        >
          返回库存列表
        </button>
      </div>
    );
  }

  /* 删除中 */
  if (deleting) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>删除完成</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          <strong>{item.name}</strong> 已删除，正在返回列表...
        </p>
      </div>
    );
  }

  const marginPercent = calcMarginPercent(item);
  const totalCost = item.quantity * item.costPrice;
  const totalValue = item.quantity * item.price;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      {/* 返回 */}
      <button
        onClick={handleBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
          background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
          marginBottom: 20,
        }}
        data-testid="tob-stock-detail-back"
      >
        ← 返回库存列表
      </button>

      {/* 标题 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 }}>
            📦 {item.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280' }}>
            <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{item.sku}</span>
            <span>·</span>
            <span>{item.category}</span>
            <span>·</span>
            <Badge
              variant={currentStatus === 'out_of_stock' || currentStatus === 'critical' ? 'error' : currentStatus === 'low' ? 'warning' : 'success'}
            >
              {STATUS_LABELS[currentStatus]}
            </Badge>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid #2563eb',
                  background: '#eff6ff', color: '#2563eb', fontWeight: 600,
                  fontSize: 14, cursor: 'pointer',
                }}
                data-testid="tob-stock-detail-edit"
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
                data-testid="tob-stock-detail-delete"
              >
                🗑️ 删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* 删除确认 */}
      {showConfirmDelete && (
        <div style={{
          marginBottom: 24, padding: 20, borderRadius: 12,
          background: '#fef2f2', border: '1px solid #fecaca',
        }} data-testid="tob-stock-detail-delete-confirm">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>
            确认删除此商品？
          </div>
          <p style={{ fontSize: 14, color: '#b91c1c', marginBottom: 16 }}>
            此操作不可撤销。商品 &ldquo;{item.name}&rdquo; 将被永久删除。
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#dc2626', color: '#fff', fontWeight: 600,
                fontSize: 14, cursor: 'pointer',
              }}
              data-testid="tob-stock-detail-delete-confirm-btn"
            >
              确认删除
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              style={{
                padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db',
                background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
              }}
              data-testid="tob-stock-detail-delete-cancel"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 状态流转 */}
      <div style={{
        marginBottom: 24, padding: 16, borderRadius: 12,
        background: '#f0f9ff', border: '1px solid #bae6fd',
        display: 'flex', alignItems: 'center', gap: 16,
      }} data-testid="tob-stock-detail-status-bar">
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0369a1' }}>
          库存状态流转:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleStatusDown}
            disabled={!PREV_STATUS[currentStatus]}
            style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #93c5fd',
              background: '#dbeafe', color: '#1e40af', fontSize: 13,
              cursor: PREV_STATUS[currentStatus] ? 'pointer' : 'not-allowed',
              opacity: PREV_STATUS[currentStatus] ? 1 : 0.5,
            }}
            data-testid="tob-stock-detail-status-down"
          >
            ← 降级
          </button>
          <span style={{
            padding: '4px 12px', borderRadius: 6,
            background: STATUS_COLORS[currentStatus],
            color: '#fff', fontSize: 13, fontWeight: 600, minWidth: 60, textAlign: 'center',
          }} data-testid="tob-stock-detail-status-current">
            {STATUS_LABELS[currentStatus]}
          </span>
          <button
            onClick={handleStatusUp}
            disabled={!NEXT_STATUS[currentStatus]}
            style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #93c5fd',
              background: '#dbeafe', color: '#1e40af', fontSize: 13,
              cursor: NEXT_STATUS[currentStatus] ? 'pointer' : 'not-allowed',
              opacity: NEXT_STATUS[currentStatus] ? 1 : 0.5,
            }}
            data-testid="tob-stock-detail-status-up"
          >
            升级 →
          </button>
        </div>
      </div>

      {/* 信息卡片 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24,
      }}>
        {/* 基本信息 */}
        <div style={{
          padding: 20, borderRadius: 12,
          background: '#fff', border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
            基本信息
          </h2>
          <InfoRow label="商品名称" value={item.name} />
          <InfoRow label="SKU编码" value={item.sku} />
          <InfoRow label="分类" value={item.category} />
          <InfoRow label="供应商" value={item.supplier} />
          <InfoRow label="所属仓库" value={item.warehouse} />
          <InfoRow label="负责人" value={item.manager} />
          <InfoRow label="描述" value={
            <span style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{item.description}</span>
          } />
        </div>

        {/* 库存数据 */}
        <div style={{
          padding: 20, borderRadius: 12,
          background: '#fff', border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
            库存数据
          </h2>
          <InfoRow label="当前库存" value={
            <span style={{ fontSize: 20, fontWeight: 700, color: STATUS_COLORS[currentStatus] }}>
              {item.quantity.toLocaleString()} {item.unit}
            </span>
          } />
          <InfoRow label="最低阈值" value={`${item.minThreshold} ${item.unit}`} />
          <InfoRow label="最高阈值" value={`${item.maxThreshold} ${item.unit}`} />
          <InfoRow label="销售单价" value={formatCurrency(item.price)} />
          <InfoRow label="成本单价" value={formatCurrency(item.costPrice)} />
          <InfoRow label="毛利率" value={
            <span style={{ color: marginPercent >= 40 ? '#059669' : '#d97706' }}>
              {marginPercent.toFixed(1)}%
            </span>
          } />
          <InfoRow label="库存总成本" value={formatCurrency(totalCost)} />
          <InfoRow label="库存总价值" value={formatCurrency(totalValue)} />
        </div>
      </div>

      {/* 时间 */}
      <div style={{
        padding: 16, borderRadius: 12, marginBottom: 24,
        background: '#f9fafb', border: '1px solid #e5e7eb',
        display: 'flex', gap: 32, fontSize: 13, color: '#9ca3af',
      }}>
        <span>创建时间: {item.createdAt}</span>
        <span>更新时间: {item.updatedAt}</span>
      </div>
    </div>
  );
}
