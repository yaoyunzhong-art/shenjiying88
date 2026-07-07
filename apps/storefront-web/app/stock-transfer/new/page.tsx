/**
 * 新建库存调拨单 — New Stock Transfer Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购 / 📦仓管
 * 功能: 调拨单创建表单（选择类型/门店/商品明细）
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  PageShell,
  Button,
  useToast,
} from '@m5/ui';

// ---- 类型 ----

type TransferType = 'store_to_store' | 'warehouse_to_store' | 'store_to_warehouse';

interface TransferLineItem {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
}

interface FormState {
  type: TransferType;
  fromLocation: string;
  toLocation: string;
  reason: string;
  items: TransferLineItem[];
  errors: Record<string, string>;
  submitting: boolean;
}

// ---- 常量 ----

const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  store_to_store: '门店⇄门店',
  warehouse_to_store: '仓库→门店',
  store_to_warehouse: '门店→仓库',
};

const TRANSFER_TYPE_DIRECTIONS: Record<TransferType, { from: string; to: string }> = {
  store_to_store: { from: '调出门店', to: '调入门店' },
  warehouse_to_store: { from: '仓库', to: '门店' },
  store_to_warehouse: { from: '门店', to: '仓库' },
};

const INITIAL_FORM: FormState = {
  type: 'warehouse_to_store',
  fromLocation: '',
  toLocation: '',
  reason: '',
  items: [],
  errors: {},
  submitting: false,
};

// ---- 模拟门店/仓库选项 ----

const LOCATION_OPTIONS: Record<string, string[]> = {
  store: ['旗舰店(天河城)', '分店(体育西)', '分店(珠江新城)', '分店(北京路)'],
  warehouse: ['中央仓库', '华南仓库', '华东仓库'],
};

const SUGGESTED_PRODUCTS: TransferLineItem[] = [
  { sku: 'CL-001', name: '氨基酸洁面乳', quantity: 0, unit: '支' },
  { sku: 'CL-002', name: '泡沫洁面啫喱', quantity: 0, unit: '支' },
  { sku: 'LK-001', name: '哑光丝绒口红 #520', quantity: 0, unit: '支' },
  { sku: 'LK-002', name: '水润唇釉 #301', quantity: 0, unit: '支' },
  { sku: 'EX-001', name: '防晒喷雾 SPF50', quantity: 0, unit: '瓶' },
];

// ---- 组件 ----

export default function NewStockTransferPage(): React.ReactElement {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM, errors: {}, items: [] });

  const typeDir = TRANSFER_TYPE_DIRECTIONS[form.type];

    const getLocationOptions = useCallback((which: 'from' | 'to', type: TransferType): string[] => {
    if (type === 'store_to_store') return LOCATION_OPTIONS.store ?? [];
    if (type === 'warehouse_to_store') return which === 'from' ? (LOCATION_OPTIONS.warehouse ?? []) : (LOCATION_OPTIONS.store ?? []);
    return which === 'from' ? (LOCATION_OPTIONS.store ?? []) : (LOCATION_OPTIONS.warehouse ?? []);
  }, []);

  const fromOptions = getLocationOptions('from', form.type);
  const toOptions = getLocationOptions('to', form.type);

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!form.fromLocation) errors.fromLocation = '请选择调出地';
    if (!form.toLocation) errors.toLocation = '请选择调入地';
    if (form.fromLocation && form.toLocation && form.fromLocation === form.toLocation) {
      errors.toLocation = '调出地和调入地不能相同';
    }
    if (!form.reason.trim()) errors.reason = '请填写调拨原因';
    const validItems = form.items.filter((i) => i.quantity > 0);
    if (validItems.length === 0) errors.items = '请至少添加一个商品且数量大于0';
    setForm((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [form.fromLocation, form.toLocation, form.reason, form.items]);

  const handleTypeChange = useCallback((type: TransferType) => {
    setForm((prev) => ({
      ...prev,
      type,
      fromLocation: '',
      toLocation: '',
      errors: {},
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!validate()) {
      toast.error('请修正表单中的错误');
      return;
    }
    setForm((prev) => ({ ...prev, submitting: true }));
    // 模拟提交
    setTimeout(() => {
      toast.success('调拨单创建成功');
      setForm((prev) => ({ ...prev, submitting: false }));
      router.push('/stock-transfer');
    }, 800);
  }, [validate, toast, router]);

  const toggleItem = useCallback((sku: string) => {
    setForm((prev) => {
      const exists = prev.items.find((i) => i.sku === sku);
      if (exists) {
        return { ...prev, items: prev.items.filter((i) => i.sku !== sku), errors: { ...prev.errors, items: '' } };
      }
      const product = SUGGESTED_PRODUCTS.find((p) => p.sku === sku);
      if (product) {
        return {
          ...prev,
          items: [...prev.items, { ...product, quantity: 1 }],
          errors: { ...prev.errors, items: '' },
        };
      }
      return prev;
    });
  }, []);

  const updateItemQty = useCallback((sku: string, quantity: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.sku === sku ? { ...i, quantity: Math.max(0, quantity) } : i)),
      errors: { ...prev.errors, items: '' },
    }));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box',
    outline: 'none',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 12, color: '#dc2626', marginTop: 4,
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'auto' as const };

  return (
    <PageShell title="新建调拨单">
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div>
            <button
              onClick={() => router.push('/stock-transfer')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff',
                color: '#374151', fontSize: 14, cursor: 'pointer', marginBottom: 12,
              }}
              data-testid="transfer-new-back"
            >
              ← 返回调拨单列表
            </button>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              新建库存调拨单
            </h1>
          </div>
        </div>

        {/* 调拨类型选择 */}
        <div style={{
          marginBottom: 24, padding: 20, borderRadius: 12,
          background: '#fff', border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>
            调拨类型
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(Object.entries(TRANSFER_TYPE_LABELS) as [TransferType, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleTypeChange(key)}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid',
                  borderColor: form.type === key ? '#3b82f6' : '#d1d5db',
                  background: form.type === key ? '#eff6ff' : '#fff',
                  color: form.type === key ? '#2563eb' : '#374151',
                  fontWeight: form.type === key ? 600 : 400,
                  fontSize: 14, cursor: 'pointer',
                }}
                data-testid={`transfer-new-type-${key}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 调拨信息 */}
        <div style={{
          marginBottom: 24, padding: 20, borderRadius: 12,
          background: '#fff', border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 16px' }}>
            调拨信息
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 调出地 */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                {typeDir.from} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={form.fromLocation}
                onChange={(e) => setForm((p) => ({ ...p, fromLocation: e.target.value, errors: { ...p.errors, fromLocation: '' } }))}
                style={selectStyle}
                data-testid="transfer-new-from-location"
              >
                <option value="">请选择</option>
                {fromOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {form.errors.fromLocation && <div style={errorStyle} data-testid="transfer-new-error-from">{form.errors.fromLocation}</div>}
            </div>

            {/* 调入地 */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                {typeDir.to} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={form.toLocation}
                onChange={(e) => setForm((p) => ({ ...p, toLocation: e.target.value, errors: { ...p.errors, toLocation: '' } }))}
                style={selectStyle}
                data-testid="transfer-new-to-location"
              >
                <option value="">请选择</option>
                {toOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {form.errors.toLocation && <div style={errorStyle} data-testid="transfer-new-error-to">{form.errors.toLocation}</div>}
            </div>
          </div>

          {/* 调拨原因 */}
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
              调拨原因 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value, errors: { ...p.errors, reason: '' } }))}
              placeholder="例如：门店补货 — 洁面系列"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              data-testid="transfer-new-reason"
            />
            {form.errors.reason && <div style={errorStyle} data-testid="transfer-new-error-reason">{form.errors.reason}</div>}
          </div>
        </div>

        {/* 商品明细 */}
        <div style={{
          marginBottom: 24, padding: 20, borderRadius: 12,
          background: '#fff', border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>
            商品明细 <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400 }}>选择需要调拨的商品并输入数量</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SUGGESTED_PRODUCTS.map((product) => {
              const selected = form.items.find((i) => i.sku === product.sku);
              return (
                <div
                  key={product.sku}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 8,
                    border: `1px solid ${selected ? '#3b82f6' : '#e5e7eb'}`,
                    background: selected ? '#eff6ff' : '#fafafa',
                  }}
                  data-testid={`transfer-new-item-${product.sku}`}
                >
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => toggleItem(product.sku)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                    data-testid={`transfer-new-item-check-${product.sku}`}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{product.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{product.sku}</div>
                  </div>
                  {selected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => updateItemQty(product.sku, selected.quantity - 1)}
                        style={{
                          width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db',
                          background: '#fff', fontSize: 16, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        data-testid={`transfer-new-item-dec-${product.sku}`}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={selected.quantity}
                        onChange={(e) => updateItemQty(product.sku, parseInt(e.target.value, 10) || 0)}
                        min={0}
                        style={{
                          width: 60, padding: '6px 8px', borderRadius: 6,
                          border: '1px solid #d1d5db', fontSize: 14, textAlign: 'center',
                        }}
                        data-testid={`transfer-new-item-qty-${product.sku}`}
                      />
                      <button
                        onClick={() => updateItemQty(product.sku, selected.quantity + 1)}
                        style={{
                          width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db',
                          background: '#fff', fontSize: 16, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        data-testid={`transfer-new-item-inc-${product.sku}`}
                      >
                        +
                      </button>
                      <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 24 }}>{product.unit}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {form.errors.items && (
            <div style={{ ...errorStyle, marginTop: 8 }} data-testid="transfer-new-error-items">{form.errors.items}</div>
          )}

          {/* 格式化摘要 */}
          {form.items.filter((i) => i.quantity > 0).length > 0 && (
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 8,
              background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: 13, color: '#0369a1',
            }}>
              已选择 {form.items.filter((i) => i.quantity > 0).length} 种商品，
              共 {form.items.reduce((s, i) => s + i.quantity, 0)} 件
            </div>
          )}
        </div>

        {/* 提交按钮区 */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 12,
          padding: '16px 0', borderTop: '1px solid #e5e7eb',
        }}>
          <Button
            variant="outline"
            onClick={() => router.push('/stock-transfer')}
            data-testid="transfer-new-cancel"
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={form.submitting}
            loading={form.submitting}
            data-testid="transfer-new-submit"
          >
            {form.submitting ? '提交中…' : '提交调拨单'}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
