/**
 * 采购单创建/编辑表单页 — Purchase Order Form Page (Next.js App Router Page)
 * 功能: 新建采购单，含字段验证、提交、错误处理
 * 角色视角: 👤采购管理 / 供应链
 * 类型: B-页面创建 / 表单页
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
import {
  PURCHASE_ORDER_URGENCIES,
  PURCHASE_ORDER_URGENCY_MAP,
  type PurchaseOrderUrgency,
} from '../purchase-orders-data';

// ---- 表单字段定义 ----

interface PurchaseOrderFormValues {
  supplierName: string;
  supplierId: string;
  contactPerson: string;
  contactPhone: string;
  urgency: PurchaseOrderUrgency;
  department: string;
  storeCode: string;
  itemsCount: number;
  totalQuantity: number;
  totalAmount: number;
  expectedDelivery: string;
  remark: string;
}

const DEFAULT_VALUES: PurchaseOrderFormValues = {
  supplierName: '',
  supplierId: '',
  contactPerson: '',
  contactPhone: '',
  urgency: 'normal',
  department: '',
  storeCode: '',
  itemsCount: 1,
  totalQuantity: 0,
  totalAmount: 0,
  expectedDelivery: '',
  remark: '',
};

interface FieldError {
  field: keyof PurchaseOrderFormValues;
  message: string;
}

const DEPARTMENTS = [
  { value: '后厨', label: '后厨' },
  { value: '前厅', label: '前厅' },
  { value: '西点房', label: '西点房' },
  { value: '供应链', label: '供应链' },
  { value: '物流', label: '物流' },
  { value: 'IT', label: 'IT' },
  { value: '设备维护', label: '设备维护' },
  { value: '后勤', label: '后勤' },
  { value: '出口贸易', label: '出口贸易' },
] as const;

const STORE_OPTIONS = [
  { value: 'SH-001', label: '朝阳旗舰店' },
  { value: 'SH-002', label: '海淀创新店' },
  { value: 'SH-003', label: '深圳南山店' },
  { value: 'SH-004', label: '杭州西湖店' },
] as const;

// ---- 验证逻辑 ----

function validateForm(values: PurchaseOrderFormValues): FieldError[] {
  const errors: FieldError[] = [];

  if (!values.supplierName.trim()) {
    errors.push({ field: 'supplierName', message: '供应商名称不能为空' });
  }

  if (!values.supplierId.trim()) {
    errors.push({ field: 'supplierId', message: '供应商编号不能为空' });
  }

  if (!values.contactPerson.trim()) {
    errors.push({ field: 'contactPerson', message: '联系人不能为空' });
  }

  if (!values.contactPhone.trim()) {
    errors.push({ field: 'contactPhone', message: '联系电话不能为空' });
  } else if (!/^1\d{10}$/.test(values.contactPhone.trim()) && !/^\d{7,15}$/.test(values.contactPhone.trim())) {
    errors.push({ field: 'contactPhone', message: '请输入有效的手机号或固话' });
  }

  if (!values.department.trim()) {
    errors.push({ field: 'department', message: '采购部门不能为空' });
  }

  if (!values.storeCode.trim()) {
    errors.push({ field: 'storeCode', message: '请选择门店' });
  }

  if (values.itemsCount < 1) {
    errors.push({ field: 'itemsCount', message: '品项数至少为1' });
  }

  if (values.totalQuantity < 1) {
    errors.push({ field: 'totalQuantity', message: '总数量至少为1' });
  }

  if (values.totalAmount < 0) {
    errors.push({ field: 'totalAmount', message: '金额不能为负数' });
  }

  if (!values.expectedDelivery.trim()) {
    errors.push({ field: 'expectedDelivery', message: '请选择期望到货日期' });
  }

  return errors;
}

// ---- 表单组件（带 data-field 包裹） ----

function FormFieldWithData(props: {
  field: keyof PurchaseOrderFormValues;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-field={props.field}>
      <FormField label={props.label} required={props.required} error={props.error}>
        {props.children}
      </FormField>
    </div>
  );
}

// ---- 表单页面组件 ----

export default function PurchaseOrderFormPage() {
  const [values, setValues] = useState<PurchaseOrderFormValues>(DEFAULT_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const getFieldError = useCallback(
    (field: keyof PurchaseOrderFormValues): string | undefined =>
      fieldErrors.find((e) => e.field === field)?.message,
    [fieldErrors],
  );

  const handleChange = useCallback(
    (field: keyof PurchaseOrderFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
        setValues((prev) => ({ ...prev, [field]: value }));
        setFieldErrors((prev) => prev.filter((fe) => fe.field !== field));
        setSubmitState('idle');
      },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const errors = validateForm(values);
      setFieldErrors(errors);

      if (errors.length > 0) return;

      setSubmitState('submitting');

      // 模拟异步提交
      const timer = setTimeout(() => {
        if (Math.random() > 0.15) {
          setSubmitState('success');
        } else {
          setSubmitState('error');
        }
      }, 1200);

      return () => clearTimeout(timer);
    },
    [values],
  );

  const handleReset = useCallback(() => {
    setValues(DEFAULT_VALUES);
    setFieldErrors([]);
    setSubmitState('idle');
  }, []);

  const urgencyOptions = PURCHASE_ORDER_URGENCIES.map((u) => ({
    value: u,
    label: PURCHASE_ORDER_URGENCY_MAP[u].label,
  }));

  return (
    <PageShell
      title="创建采购单"
      description="填写采购信息并提交审批"
      breadcrumb={
        <WorkspaceBreadcrumb
          workspaceLabel="采购管理"
          workspaceHref="/purchase-orders"
          detailLabel="创建采购单"
          intermediateLabel=""
        />
      }
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <form onSubmit={handleSubmit} noValidate>
          {/* ---- 供应商信息 ---- */}
          <FormFieldWithData field="supplierName" label="供应商名称" required error={getFieldError('supplierName')}>
            <input
              type="text"
              value={values.supplierName}
              onChange={handleChange('supplierName')}
              placeholder="请输入供应商名称"
              disabled={submitState === 'submitting'}
              style={inputStyle}
            />
          </FormFieldWithData>

          <FormFieldWithData field="supplierId" label="供应商编号" required error={getFieldError('supplierId')}>
            <input
              type="text"
              value={values.supplierId}
              onChange={handleChange('supplierId')}
              placeholder="例如: sp-001"
              disabled={submitState === 'submitting'}
              style={inputStyle}
            />
          </FormFieldWithData>

          <FormFieldWithData field="contactPerson" label="联系人" required error={getFieldError('contactPerson')}>
            <input
              type="text"
              value={values.contactPerson}
              onChange={handleChange('contactPerson')}
              placeholder="请输入联系人姓名"
              disabled={submitState === 'submitting'}
              style={inputStyle}
            />
          </FormFieldWithData>

          <FormFieldWithData field="contactPhone" label="联系电话" required error={getFieldError('contactPhone')}>
            <input
              type="text"
              value={values.contactPhone}
              onChange={handleChange('contactPhone')}
              placeholder="手机号或固话"
              disabled={submitState === 'submitting'}
              style={inputStyle}
            />
          </FormFieldWithData>

          {/* ---- 采购信息 ---- */}
          <FormFieldWithData field="department" label="采购部门" required error={getFieldError('department')}>
            <select
              value={values.department}
              onChange={handleChange('department')}
              disabled={submitState === 'submitting'}
              style={selectStyle}
            >
              <option value="">请选择部门</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </FormFieldWithData>

          <FormFieldWithData field="storeCode" label="所属门店" required error={getFieldError('storeCode')}>
            <select
              value={values.storeCode}
              onChange={handleChange('storeCode')}
              disabled={submitState === 'submitting'}
              style={selectStyle}
            >
              <option value="">请选择门店</option>
              {STORE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </FormFieldWithData>

          <FormFieldWithData field="urgency" label="紧急程度">
            <select
              value={values.urgency}
              onChange={handleChange('urgency')}
              disabled={submitState === 'submitting'}
              style={selectStyle}
            >
              {urgencyOptions.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </FormFieldWithData>

          {/* ---- 商品明细 ---- */}
          <FormFieldWithData field="itemsCount" label="品项数" required error={getFieldError('itemsCount')}>
            <input
              type="number"
              min={1}
              value={values.itemsCount}
              onChange={handleChange('itemsCount')}
              disabled={submitState === 'submitting'}
              style={inputStyle}
            />
          </FormFieldWithData>

          <FormFieldWithData field="totalQuantity" label="总数量" required error={getFieldError('totalQuantity')}>
            <input
              type="number"
              min={1}
              value={values.totalQuantity}
              onChange={handleChange('totalQuantity')}
              disabled={submitState === 'submitting'}
              style={inputStyle}
            />
          </FormFieldWithData>

          <FormFieldWithData field="totalAmount" label="总金额 (元)" required error={getFieldError('totalAmount')}>
            <input
              type="number"
              min={0}
              step={0.01}
              value={values.totalAmount}
              onChange={handleChange('totalAmount')}
              disabled={submitState === 'submitting'}
              style={inputStyle}
            />
          </FormFieldWithData>

          <FormFieldWithData field="expectedDelivery" label="期望到货日期" required error={getFieldError('expectedDelivery')}>
            <input
              type="date"
              value={values.expectedDelivery}
              onChange={handleChange('expectedDelivery')}
              disabled={submitState === 'submitting'}
              style={inputStyle}
            />
          </FormFieldWithData>

          {/* ---- 备注 ---- */}
          <FormFieldWithData field="remark" label="备注">
            <textarea
              value={values.remark}
              onChange={handleChange('remark')}
              placeholder="采购单备注说明（选填）"
              disabled={submitState === 'submitting'}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </FormFieldWithData>

          {/* ---- 提交反馈 ---- */}
          {submitState === 'success' && (
            <FormSubmitFeedback success="采购单已成功提交，等待审批。" />
          )}
          {submitState === 'error' && (
            <FormSubmitFeedback
              error="提交失败，请稍后重试。若问题持续请联系 IT 支持。"
            />
          )}

          {/* ---- 操作按钮 ---- */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <SubmitButton
              type="submit"
              loading={submitState === 'submitting'}
              disabled={submitState === 'submitting'}
            >
              {submitState === 'submitting' ? '提交中...' : '提交采购单'}
            </SubmitButton>
            <button
              type="button"
              onClick={handleReset}
              disabled={submitState === 'submitting'}
              style={cancelBtnStyle}
            >
              重置
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

// ---- 内联样式 ----

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  lineHeight: 1.5,
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  fontSize: 14,
  cursor: 'pointer',
};
