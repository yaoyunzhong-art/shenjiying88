/**
 * 采购单编辑页 — Purchase Order Edit Page (Next.js App Router Page)
 * 功能: 编辑采购单基本信息、供应商信息、调整明细、更新备注/付款条款
 * 角色视角: 👔店长 / 💳采购经理
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailShell,
  FormField,
  Input,
  Select,
  SubmitButton,
  useToast,
  InfoRow,
} from '@m5/ui';

// ---- 类型 ----

type PurchaseOrderStatus = 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'received' | 'cancelled';

interface PurchaseOrderItem {
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplier: string;
  contactPerson: string;
  contactPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  itemsCount: number;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery: string | null;
  paymentTerms: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
}

interface EditFormData {
  supplier: string;
  contactPerson: string;
  contactPhone: string;
  shippingAddress: string;
  expectedDelivery: string;
  paymentTerms: string;
  paymentMethod: string;
  notes: string;
}

interface EditFormErrors {
  supplier?: string;
  contactPerson?: string;
  contactPhone?: string;
  shippingAddress?: string;
  expectedDelivery?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  notes?: string;
}

// ---- 常量 ----

const PAYMENT_TERMS_OPTIONS = [
  { label: '月结30天', value: 'net30' },
  { label: '月结60天', value: 'net60' },
  { label: '预付款+尾款', value: 'deposit_balance' },
  { label: '货到付款', value: 'cod' },
  { label: '全额预付', value: 'prepaid' },
];

const PAYMENT_METHOD_OPTIONS = [
  { label: '银行转账', value: 'bank_transfer' },
  { label: '微信支付', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '支票', value: 'check' },
  { label: '现金', value: 'cash' },
];

// ---- Mock 数据 ----

const MOCK_ORDERS: Record<string, PurchaseOrder> = {
  '1': {
    id: '1', orderNo: 'PO-20260601-001',
    supplier: '广州美妆供应链有限公司',
    contactPerson: '李明', contactPhone: '13800138001',
    shippingAddress: '广州市天河区体育西路123号旗舰店仓库',
    totalAmount: 28600, status: 'received', itemsCount: 12,
    orderDate: '2026-06-01', expectedDelivery: '2026-06-10',
    actualDelivery: '2026-06-09', paymentTerms: 'net30',
    paymentMethod: 'bank_transfer', notes: '优先安排核心SKU入库。',
    createdAt: '2026-06-01 09:00:00', updatedAt: '2026-06-09 14:30:00',
    items: [
      { name: '保湿精华液（100ml）', sku: 'ES-100ML-001', quantity: 200, unit: '瓶', unitPrice: 68, totalPrice: 13600 },
      { name: '洁面乳（150g）', sku: 'CF-150G-002', quantity: 150, unit: '支', unitPrice: 45, totalPrice: 6750 },
      { name: '防晒霜（SPF50 60ml）', sku: 'SS-60ML-003', quantity: 100, unit: '支', unitPrice: 55, totalPrice: 5500 },
      { name: '面霜礼盒装', sku: 'CG-BOX-004', quantity: 50, unit: '盒', unitPrice: 55, totalPrice: 2750 },
    ],
  },
  '2': {
    id: '2', orderNo: 'PO-20260605-002',
    supplier: '上海日化股份有限公司',
    contactPerson: '王芳', contactPhone: '13900139002',
    shippingAddress: '上海市浦东新区张江高科技园区仓库B区',
    totalAmount: 42000, status: 'shipped', itemsCount: 8,
    orderDate: '2026-06-05', expectedDelivery: '2026-06-15',
    actualDelivery: null, paymentTerms: 'cod',
    paymentMethod: 'wechat', notes: '急单，请优先配送。',
    createdAt: '2026-06-05 09:00:00', updatedAt: '2026-06-12 09:00:00',
    items: [
      { name: '洗发水（500ml）', sku: 'SH-500ML-005', quantity: 300, unit: '瓶', unitPrice: 35, totalPrice: 10500 },
      { name: '护发素（500ml）', sku: 'CD-500ML-006', quantity: 200, unit: '瓶', unitPrice: 38, totalPrice: 7600 },
    ],
  },
  '3': {
    id: '3', orderNo: 'PO-20260610-003',
    supplier: '深圳包装材料厂',
    contactPerson: '赵工', contactPhone: '13700137003',
    shippingAddress: '深圳市龙岗区坂田街道品尚仓库一楼',
    totalAmount: 12500, status: 'draft', itemsCount: 5,
    orderDate: '2026-06-10', expectedDelivery: '2026-06-20',
    actualDelivery: null, paymentTerms: 'prepaid',
    paymentMethod: 'alipay', notes: '',
    createdAt: '2026-06-10 11:00:00', updatedAt: '2026-06-10 11:00:00',
    items: [
      { name: '礼品包装袋（大号）', sku: 'GB-LG-007', quantity: 500, unit: '个', unitPrice: 3.5, totalPrice: 1750 },
    ],
  },
};

/** 将采购单对象转为表单数据 */
function toFormData(order: PurchaseOrder): EditFormData {
  return {
    supplier: order.supplier,
    contactPerson: order.contactPerson,
    contactPhone: order.contactPhone,
    shippingAddress: order.shippingAddress,
    expectedDelivery: order.expectedDelivery,
    paymentTerms: order.paymentTerms,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
  };
}

// ---- 验证 ----

function validateForm(data: EditFormData): EditFormErrors {
  const e: EditFormErrors = {};

  if (!data.supplier.trim()) {
    e.supplier = '供应商名称不能为空';
  } else if (data.supplier.trim().length > 100) {
    e.supplier = '名称不超过100个字符';
  }

  if (!data.contactPerson.trim()) {
    e.contactPerson = '联系人不能为空';
  } else if (data.contactPerson.trim().length > 30) {
    e.contactPerson = '联系人不超过30个字符';
  }

  if (!data.contactPhone.trim()) {
    e.contactPhone = '联系电话不能为空';
  } else if (!/^1\d{10}$/.test(data.contactPhone.trim())) {
    e.contactPhone = '请输入有效的手机号码';
  }

  if (!data.shippingAddress.trim()) {
    e.shippingAddress = '收货地址不能为空';
  } else if (data.shippingAddress.trim().length > 200) {
    e.shippingAddress = '地址不超过200个字符';
  }

  if (!data.expectedDelivery) {
    e.expectedDelivery = '请选择预计到货日期';
  }

  if (!data.paymentTerms) {
    e.paymentTerms = '请选择付款条件';
  }

  if (!data.paymentMethod) {
    e.paymentMethod = '请选择付款方式';
  }

  if (data.notes.length > 500) {
    e.notes = '备注不超过500个字符';
  }

  return e;
}

// ---- 页面组件 ----

export default function PurchaseOrderEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const source = useMemo<PurchaseOrder | null>(() => MOCK_ORDERS[id] ?? null, [id]);

  const [form, setForm] = useState<EditFormData>(
    source ? toFormData(source) : {
      supplier: '', contactPerson: '', contactPhone: '',
      shippingAddress: '', expectedDelivery: '',
      paymentTerms: '', paymentMethod: '', notes: '',
    }
  );
  const [errors, setErrors] = useState<EditFormErrors>({});
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');
  const toast = useToast();

  const handleChange = useCallback(<K extends keyof EditFormData>(key: K, value: EditFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (submitState === 'error') setSubmitState('idle');
  }, [errors, submitState]);

  // 通用输入变更处理器
  const handleInputChange = useCallback(<K extends keyof EditFormData>(key: K) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      handleChange(key, e.target.value as EditFormData[K]);
    };
  }, [handleChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateForm(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitState('submitting');
    setSubmitError('');

    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitState('success');
      toast.success('采购单更新成功');
      setTimeout(() => router.push(`/purchase-orders/${id}`), 800);
    } catch {
      setSubmitState('error');
      setSubmitError('提交失败，请稍后重试');
    }
  }, [form, id, router, toast]);

  // ---- 页面不存在 ----
  if (!source) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>采购单未找到</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          未找到 ID 为 <strong>{id}</strong> 的采购单，可能已被删除。
        </p>
        <button
          onClick={() => router.push('/purchase-orders')}
          style={{
            padding: '8px 24px', borderRadius: 8, border: '1px solid #d1d5db',
            background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
          }}
        >
          ← 返回采购单列表
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e2e8f0',
    fontSize: 14,
    padding: '8px 0',
    fontFamily: 'inherit',
  };

  const sectionStyle: React.CSSProperties = {
    borderRadius: 8, border: '1px solid rgba(148,163,184,0.12)',
    overflow: 'hidden', marginBottom: 16,
  };
  const sectionHeaderStyle: React.CSSProperties = {
    padding: '10px 16px', fontSize: 12, color: '#94a3b8',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
    fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
  };
  const fieldRowStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
  };

  return (
    <DetailShell
      backHref={`/purchase-orders/${id}`}
      title={`编辑采购单 · ${source.orderNo}`}
      subtitle={`供应商: ${source.supplier} · 当前金额: ¥${source.totalAmount.toLocaleString()}`}
      actions={[]}
    >
      <form onSubmit={handleSubmit} noValidate style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* 供应商信息 */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>供应商信息</div>
          <div style={fieldRowStyle}>
            <FormField label="供应商名称" error={errors.supplier} required>
              <Input
                value={form.supplier}
                onChange={handleInputChange('supplier')}
                placeholder="输入供应商全称"
                style={inputStyle}
              />
            </FormField>
          </div>
          <div style={fieldRowStyle}>
            <FormField label="联系人" error={errors.contactPerson} required>
              <Input
                value={form.contactPerson}
                onChange={handleInputChange('contactPerson')}
                placeholder="联系人姓名"
                style={inputStyle}
              />
            </FormField>
          </div>
          <div style={{ ...fieldRowStyle, borderBottom: 'none' }}>
            <FormField label="联系电话" error={errors.contactPhone} required>
              <Input
                value={form.contactPhone}
                onChange={handleInputChange('contactPhone')}
                placeholder="11位手机号码"
                style={inputStyle}
              />
            </FormField>
          </div>
        </div>

        {/* 收货信息 */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>收货与排期</div>
          <div style={fieldRowStyle}>
            <FormField label="收货地址" error={errors.shippingAddress} required>
              <textarea
                value={form.shippingAddress}
                onChange={e => handleChange('shippingAddress', e.target.value)}
                placeholder="详细收货地址"
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 40, lineHeight: 1.6 }}
              />
            </FormField>
          </div>
          <div style={{ ...fieldRowStyle, borderBottom: 'none' }}>
            <FormField label="预计到货日期" error={errors.expectedDelivery} required>
              <Input
                type="date"
                value={form.expectedDelivery}
                onChange={handleInputChange('expectedDelivery')}
                style={inputStyle}
              />
            </FormField>
          </div>
        </div>

        {/* 付款信息 */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>付款信息</div>
          <div style={fieldRowStyle}>
            <FormField label="付款条件" error={errors.paymentTerms} required>
              <Select
                value={form.paymentTerms}
                onChange={v => handleChange('paymentTerms', v)}
                options={PAYMENT_TERMS_OPTIONS}
                placeholder="选择付款条件"
              />
            </FormField>
          </div>
          <div style={{ ...fieldRowStyle, borderBottom: 'none' }}>
            <FormField label="付款方式" error={errors.paymentMethod} required>
              <Select
                value={form.paymentMethod}
                onChange={v => handleChange('paymentMethod', v)}
                options={PAYMENT_METHOD_OPTIONS}
                placeholder="选择付款方式"
              />
            </FormField>
          </div>
        </div>

        {/* 备注 */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>备注</div>
          <div style={{ ...fieldRowStyle, borderBottom: 'none' }}>
            <FormField label="备注" error={errors.notes}>
              <textarea
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="添加内部备注..."
                rows={3}
                maxLength={500}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }}
              />
              <div style={{ fontSize: 11, color: '#64748b', textAlign: 'right', marginTop: 4 }}>
                {form.notes.length}/500
              </div>
            </FormField>
          </div>
        </div>

        {/* 提交反馈 */}
        {submitState === 'error' && (
          <div style={{
            marginBottom: 16, padding: 12, borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontSize: 14,
          }}>
            ❌ {submitError}
          </div>
        )}
        {submitState === 'success' && (
          <div style={{
            marginBottom: 16, padding: 12, borderRadius: 8,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            color: '#86efac', fontSize: 14,
          }}>
            ✅ 采购单更新成功！即将跳转回详情页...
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            type="button"
            onClick={() => router.push(`/purchase-orders/${id}`)}
            style={{
              padding: '10px 24px', border: '1px solid rgba(148,163,184,0.25)',
              borderRadius: 8, background: 'transparent', color: '#94a3b8',
              cursor: 'pointer', fontSize: 14,
            }}
            disabled={submitState === 'submitting'}
          >
            取消
          </button>
          <SubmitButton
            loading={submitState === 'submitting'}
            disabled={submitState === 'submitting'}
            variant="primary"
          >
            💾 保存修改
          </SubmitButton>
        </div>
      </form>
    </DetailShell>
  );
}
