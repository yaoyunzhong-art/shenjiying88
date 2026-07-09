/**
 * 库存调拨表单页 — Stock Transfer Form Page (Next.js App Router Page)
 * 功能: 新建调拨申请，含商品选择、门店选择、数量与紧急度、备注
 * 角色视角: 👤店长 / 仓管
 */
'use client';

import React, { useState, useCallback } from 'react';

import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  WorkspaceBreadcrumb,
} from '@m5/ui';

import { URGENCY_LABEL, URGENCY_LEVELS, TYPE_LABEL, TRANSFER_TYPES } from '../stock-transfer-data';

// ---- 表单字段定义 ----

interface TransferFormValues {
  sourceStore: string;
  targetStore: string;
  productName: string;
  productSku: string;
  quantity: string;
  type: string;
  urgency: string;
  remark: string;
}

const DEFAULT_VALUES: TransferFormValues = {
  sourceStore: '',
  targetStore: '',
  productName: '',
  productSku: '',
  quantity: '',
  type: 'supply',
  urgency: 'normal',
  remark: '',
};

interface FieldError {
  field: keyof TransferFormValues;
  message: string;
}

// ---- 验证逻辑 ----

function validateForm(values: TransferFormValues): FieldError[] {
  const errors: FieldError[] = [];

  if (!values.sourceStore.trim()) errors.push({ field: 'sourceStore', message: '请选择调出门店' });
  if (!values.targetStore.trim()) errors.push({ field: 'targetStore', message: '请选择调入门店' });

  if (values.sourceStore.trim() && values.targetStore.trim() && values.sourceStore === values.targetStore) {
    errors.push({ field: 'targetStore', message: '调入门店不能与调出门店相同' });
  }

  if (!values.productName.trim()) errors.push({ field: 'productName', message: '请填写商品名称' });
  if (!values.productSku.trim()) errors.push({ field: 'productSku', message: '请填写商品SKU' });

  const qty = parseInt(values.quantity, 10);
  if (!values.quantity.trim()) {
    errors.push({ field: 'quantity', message: '请填写调拨数量' });
  } else if (isNaN(qty) || qty <= 0) {
    errors.push({ field: 'quantity', message: '数量必须大于0' });
  } else if (qty > 99999) {
    errors.push({ field: 'quantity', message: '单次调拨数量不能超过 99999' });
  }

  return errors;
}

// ---- 模拟门店选项 ----

const STORE_OPTIONS = [
  { value: 'S-001', label: '杭州银泰旗舰店' },
  { value: 'S-002', label: '杭州万象城店' },
  { value: 'S-003', label: '深圳万象天地店' },
  { value: 'S-004', label: '北京三里屯店' },
  { value: 'S-005', label: '北京朝阳大悦城店' },
  { value: 'WH-001', label: '中央仓库-华东' },
  { value: 'WH-002', label: '中央仓库-华南' },
  { value: 'WH-003', label: '中央仓库-华北' },
];

// ---- 页面 ----

export default function StockTransferFormPage() {
  const [values, setValues] = useState<TransferFormValues>(DEFAULT_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const getFieldError = useCallback(
    (field: keyof TransferFormValues): string | undefined =>
      fieldErrors.find((e) => e.field === field)?.message,
    [fieldErrors],
  );

  const handleSubmit = useCallback(async () => {
    if (submitState === 'submitting') return;
    setSubmitState('submitting');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitState('success');
    } catch {
      setSubmitState('error');
    }
  }, [submitState]);

  const setValue = useCallback(
    (field: keyof TransferFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        setFieldErrors((prev) => prev.filter((e) => e.field !== field));
      },
    [],
  );

  const onSubmit = useCallback(async () => {
    const errors = validateForm(values);
    setFieldErrors(errors);
    if (errors.length > 0) return;
    await handleSubmit();
  }, [values, handleSubmit]);

  const resetSubmit = useCallback(() => setSubmitState('idle'), []);
  const isSubmitting = submitState === 'submitting';

  return (
    <PageShell
      title="新建调拨单"
      subtitle="发起门店或仓库之间的库存调拨申请"
      breadcrumb={
        <WorkspaceBreadcrumb
          workspaceLabel="库存调拨"
          workspaceHref="/stock-transfer"
          detailLabel="新建调拨单"
        />
      }
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {submitState === 'success' && (
          <FormSubmitFeedback success="调拨单已提交 — 等待仓管审核。" onDismissSuccess={resetSubmit} />
        )}
        {submitState === 'error' && (
          <FormSubmitFeedback error="提交失败，请重试" onRetry={onSubmit} onDismissError={resetSubmit} />
        )}

        {submitState !== 'success' && (
          <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* 门店信息 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                调拨门店
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div data-field="sourceStore">
                  <FormField label="调出门店 *" error={getFieldError('sourceStore')}>
                    <select
                      value={values.sourceStore}
                      onChange={setValue('sourceStore')}
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('sourceStore'))}
                    >
                      <option value="">请选择</option>
                      {STORE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div data-field="targetStore">
                  <FormField label="调入门店 *" error={getFieldError('targetStore')}>
                    <select
                      value={values.targetStore}
                      onChange={setValue('targetStore')}
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('targetStore'))}
                    >
                      <option value="">请选择</option>
                      {STORE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </section>

            {/* 商品信息 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                商品信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div data-field="productName">
                  <FormField label="商品名称 *" error={getFieldError('productName')}>
                    <input
                      type="text"
                      value={values.productName}
                      onChange={setValue('productName')}
                      placeholder="例：焕颜精华液30ml"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('productName'))}
                    />
                  </FormField>
                </div>
                <div data-field="productSku">
                  <FormField label="商品SKU *" error={getFieldError('productSku')}>
                    <input
                      type="text"
                      value={values.productSku}
                      onChange={setValue('productSku')}
                      placeholder="例：SKU-HY-001"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('productSku'))}
                    />
                  </FormField>
                </div>
                <div data-field="quantity">
                  <FormField label="调拨数量 *" error={getFieldError('quantity')}>
                    <input
                      type="number"
                      value={values.quantity}
                      onChange={setValue('quantity')}
                      placeholder="1"
                      min={1}
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('quantity'))}
                    />
                  </FormField>
                </div>
                <div>
                  <FormField label="调拨类型">
                    <select
                      value={values.type}
                      onChange={setValue('type')}
                      disabled={isSubmitting}
                      style={inputStyle()}
                    >
                      {TRANSFER_TYPES.map((t) => (
                        <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </section>

            {/* 其他 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                其他信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <FormField label="紧急程度">
                    <select
                      value={values.urgency}
                      onChange={setValue('urgency')}
                      disabled={isSubmitting}
                      style={inputStyle()}
                    >
                      {URGENCY_LEVELS.map((u) => (
                        <option key={u} value={u}>{URGENCY_LABEL[u]}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div />
                <div data-field="remark" style={{ gridColumn: '1 / -1' }}>
                  <FormField label="备注">
                    <textarea
                      value={values.remark}
                      onChange={setValue('remark')}
                      placeholder="调拨原因、注意事项等"
                      disabled={isSubmitting}
                      rows={3}
                      style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* 按钮 */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #334155' }}>
              <SubmitButton variant="secondary" onClick={() => window.history.back()} disabled={isSubmitting}>
                取消
              </SubmitButton>
              <SubmitButton variant="primary" loading={isSubmitting} type="submit">
                {isSubmitting ? '提交中…' : '提交调拨'}
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </PageShell>
  );
}

// ---- 样式助手 ----

function inputStyle(error?: string): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    color: '#e2e8f0',
    background: '#1e293b',
    border: `1px solid ${error ? '#ef4444' : '#334155'}`,
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: 40,
  };
}
