/**
 * PurchaseOrderForm.tsx — 采购订单创建表单
 * 角色视角: 💳采购经理 / 店长
 * 功能: 选择供应商、添加采购条目（SKU/数量/单价）、验证、提交、错误处理
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Input,
  Select,
  FormField,
  FormSubmitFeedback,
  Button,
  TextArea,
  InputNumber,
} from '@m5/ui';
import { createPurchaseOrder } from '../../purchase-orders-service';
import {
  SUPPLIER_OPTIONS,
  AVAILABLE_SKUS,
  formatCurrency,
  type CreatePOFormValues,
  type CreatePOFormErrors,
} from '../../purchase-orders-data';

/* ── 采购条目 ── */
interface LineItem {
  id: string;
  skuId: string;
  skuName: string;
  quantity: number;
  unitCost: number;
}

let lineItemCounter = 0;
function newLineItem(): LineItem {
  lineItemCounter += 1;
  return { id: `item-${lineItemCounter}-${Date.now()}`, skuId: '', skuName: '', quantity: 1, unitCost: 0 };
}

/* ── 验证 ── */
function validateForm(values: CreatePOFormValues, items: LineItem[]): CreatePOFormErrors {
  const errors: CreatePOFormErrors = {};
  if (!values.supplierId) errors.supplierId = '请选择供应商';
  if (items.length === 0 || items.every((i) => !i.skuId)) {
    errors.items = '请至少添加一个采购条目';
  } else {
    const invalidItems = items.filter((i) => i.skuId && (i.quantity < 1 || i.unitCost <= 0));
    if (invalidItems.length > 0) errors.items = '存在数量或单价无效的条目';
  }
  return errors;
}

/* ── 组件 ── */
export function PurchaseOrderForm() {
  const router = useRouter();

  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [items, setItems] = useState<LineItem[]>([newLineItem()]);
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState<CreatePOFormErrors>({});
  const [submitState, setSubmitState] = useState<{
    isSubmitting: boolean;
    errorMessage?: string;
    successMessage?: string;
  }>({ isSubmitting: false });

  /* ── 计算总金额 ── */
  const totalAmount = useMemo(
    () => items.reduce((s, i) => s + (i.skuId ? i.quantity * i.unitCost : 0), 0),
    [items],
  );

  /* ── 供应商变更 ── */
  const handleSupplierChange = useCallback((val: string) => {
    setSupplierId(val);
    const opt = SUPPLIER_OPTIONS.find((o) => o.value === val);
    setSupplierName(opt?.label ?? '');
    setErrors((prev) => ({ ...prev, supplierId: undefined }));
  }, []);

  /* ── SKU 选择 ── */
  const handleSkuChange = useCallback(
    (itemId: string, skuId: string) => {
      const sku = AVAILABLE_SKUS.find((s) => s.value === skuId);
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, skuId, skuName: sku?.label.replace(/（.*?）/, '').trim() ?? '', unitCost: sku?.costPrice ?? 0 }
            : i,
        ),
      );
      setErrors((prev) => ({ ...prev, items: undefined }));
    },
    [],
  );

  /* ── 数量 / 单价变更 ── */
  const handleItemFieldChange = useCallback(
    (itemId: string, field: 'quantity' | 'unitCost', value: number) => {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, [field]: Math.max(0, value) } : i)),
      );
    },
    [],
  );

  /* ── 添加条目 ── */
  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, newLineItem()]);
  }, []);

  /* ── 删除条目 ── */
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== itemId) : prev));
    },
    [],
  );

  /* ── 提交 ── */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const formValues: CreatePOFormValues = { supplierId, supplierName, items: [], remark };
      const validationErrors = validateForm(formValues, items);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;

      setSubmitState({ isSubmitting: true });

      try {
        await createPurchaseOrder({
          supplierId,
          supplierName,
          items: items
            .filter((i) => i.skuId)
            .map((i) => ({ skuId: i.skuId, skuName: i.skuName, quantity: i.quantity, unitCost: i.unitCost })),
          remark,
        });

        setSubmitState({
          isSubmitting: false,
          successMessage: `采购订单创建成功！采购总额 ¥${formatCurrency(totalAmount)}`,
        });

        setTimeout(() => router.push('/purchase-orders'), 2000);
      } catch (err) {
        setSubmitState({
          isSubmitting: false,
          errorMessage: err instanceof Error ? err.message : '提交失败，请稍后重试',
        });
      }
    },
    [supplierId, supplierName, items, remark, totalAmount, router],
  );

  const handleRetry = useCallback(() => {
    setSubmitState({ isSubmitting: false, errorMessage: undefined });
  }, []);

  const handleDismissError = useCallback(() => {
    setSubmitState((prev) => ({ ...prev, errorMessage: undefined }));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          新增采购订单
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 6 }}>
          填写供应商和采购明细，创建新的采购订单
        </p>
      </div>

      <FormSubmitFeedback
        submitting={submitState.isSubmitting}
        error={submitState.errorMessage}
        success={submitState.successMessage}
        onRetry={handleRetry}
        onDismissError={handleDismissError}
      />

      {!submitState.successMessage && (
        <form onSubmit={handleSubmit} noValidate>
          <div
            style={{
              background: '#1e293b',
              borderRadius: 16,
              padding: 28,
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#e2e8f0',
                paddingBottom: 8,
                borderBottom: '1px solid #334155',
              }}
            >
              供应商信息
            </div>

            <FormField label="供应商" required error={errors.supplierId}>
              <Select
                value={supplierId}
                onChange={handleSupplierChange}
                options={SUPPLIER_OPTIONS}
                placeholder="请选择供应商"
              />
            </FormField>

            <FormField label="备注">
              <TextArea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="备注信息（可选）…"
                rows={2}
              />
            </FormField>

            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#e2e8f0',
                paddingBottom: 8,
                borderBottom: '1px solid #334155',
                marginTop: 8,
              }}
            >
              采购明细
              {errors.items && (
                <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 400, marginLeft: 12 }}>
                  {errors.items}
                </span>
              )}
            </div>

            {items.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  background: '#0f172a',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>条目 #{idx + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ color: '#ef4444', fontSize: 12, padding: '2px 8px' }}
                    >
                      移除
                    </Button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', gap: 12 }}>
                  <Select
                    value={item.skuId}
                    onChange={(val) => handleSkuChange(item.id, val)}
                    options={AVAILABLE_SKUS}
                    placeholder="选择 SKU"
                  />
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>数量</div>
                    <InputNumber
                      value={item.quantity}
                      onChange={(val) => handleItemFieldChange(item.id, 'quantity', val ?? 0)}
                      min={1}
                      size="sm"
                    />
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>单价(¥)</div>
                    <InputNumber
                      value={item.unitCost}
                      onChange={(val) => handleItemFieldChange(item.id, 'unitCost', val ?? 0)}
                      min={0}
                      precision={2}
                      size="sm"
                    />
                  </div>
                </div>

                {item.skuId && (
                  <div style={{ color: '#64748b', fontSize: 12, textAlign: 'right' }}>
                    小计：¥{formatCurrency(item.quantity * item.unitCost)}
                  </div>
                )}
              </div>
            ))}

            <Button type="button" variant="outline" onClick={handleAddItem} style={{ alignSelf: 'flex-start' }}>
              + 添加条目
            </Button>

            {/* 合计 */}
            <div
              style={{
                textAlign: 'right',
                fontSize: 18,
                fontWeight: 700,
                color: '#e2e8f0',
                padding: '12px 0',
                borderTop: '1px solid #334155',
              }}
            >
              合计：¥{formatCurrency(totalAmount)}
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button variant="outline" type="button" onClick={() => router.push('/purchase-orders')}>
              取消
            </Button>
            <Button type="submit" loading={submitState.isSubmitting}>
              创建采购订单
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
