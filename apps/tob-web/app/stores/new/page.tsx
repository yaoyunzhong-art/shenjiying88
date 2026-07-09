/**
 * stores/new/page.tsx — 新增门店表单页 (ToB Next.js App Router Page)
 * 角色视角: 企业管理员 / 品牌运营者
 * 功能: 表单验证、提交、错误处理、成功后跳转
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell, Button, StatusBadge } from '@m5/ui';
import { storeService, type Store } from '../../../lib/store-service';

interface FormData {
  storeName: string;
  storeCode: string;
  region: string;
  city: string;
  address: string;
  managerName: string;
  managerMobile: string;
  employeeCount: number;
  status: Store['status'];
}

interface FormErrors {
  storeName?: string;
  storeCode?: string;
  region?: string;
  city?: string;
  address?: string;
  managerName?: string;
  managerMobile?: string;
  employeeCount?: string;
}

const INITIAL_FORM: FormData = {
  storeName: '',
  storeCode: '',
  region: '',
  city: '',
  address: '',
  managerName: '',
  managerMobile: '',
  employeeCount: 1,
  status: 'active',
};

const REGIONS = [
  { value: '', label: '请选择' },
  { value: '华北', label: '华北' },
  { value: '华东', label: '华东' },
  { value: '华南', label: '华南' },
  { value: '华中', label: '华中' },
  { value: '西南', label: '西南' },
  { value: '西北', label: '西北' },
  { value: '东北', label: '东北' },
];

export default function NewStorePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  function validateField(name: keyof FormErrors, value: string | number): string | undefined {
    switch (name) {
      case 'storeName':
        if (!String(value).trim()) return '门店名称不能为空';
        if (String(value).trim().length < 2) return '门店名称至少2个字符';
        if (String(value).trim().length > 50) return '门店名称不能超过50个字符';
        return undefined;
      case 'storeCode':
        if (!String(value).trim()) return '门店编号不能为空';
        if (!/^[A-Za-z0-9_-]+$/.test(String(value))) return '门店编号只能包含字母、数字、下划线和连字符';
        return undefined;
      case 'region':
        if (!String(value).trim()) return '请选择所属地区';
        return undefined;
      case 'city':
        if (!String(value).trim()) return '城市不能为空';
        return undefined;
      case 'address':
        if (!String(value).trim()) return '地址不能为空';
        if (String(value).trim().length > 200) return '地址不能超过200个字符';
        return undefined;
      case 'managerName':
        if (!String(value).trim()) return '店长姓名不能为空';
        return undefined;
      case 'managerMobile':
        if (!String(value).trim()) return '联系电话不能为空';
        if (!/^1[3-9]\d{9}$/.test(String(value))) return '请输入正确的手机号格式';
        return undefined;
      case 'employeeCount':
        if (Number(value) < 1) return '员工数至少为1';
        if (Number(value) > 999) return '员工数不能超过999';
        return undefined;
      default:
        return undefined;
    }
  }

  function validateForm(): FormErrors {
    const newErrors: FormErrors = {};
    const fields: (keyof FormErrors)[] = [
      'storeName', 'storeCode', 'region', 'city', 'address',
      'managerName', 'managerMobile', 'employeeCount',
    ];

    for (const field of fields) {
      const error = validateField(field, form[field as keyof FormData]);
      if (error) newErrors[field] = error;
    }

    return newErrors;
  }

  function handleChange(field: keyof FormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));

    // 实时校验已触摸字段
    if (touched.has(field)) {
      const error = validateField(field as keyof FormErrors, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[field as keyof FormErrors] = error;
        } else {
          delete next[field as keyof FormErrors];
        }
        return next;
      });
    }
  }

  function handleBlur(field: keyof FormData) {
    setTouched((prev) => new Set(prev).add(field));
    const error = validateField(field as keyof FormErrors, form[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field as keyof FormErrors] = error;
      } else {
        delete next[field as keyof FormErrors];
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // 全部标记触摸
    const allFields: (keyof FormData)[] = [
      'storeName', 'storeCode', 'region', 'city', 'address',
      'managerName', 'managerMobile', 'employeeCount',
    ];
    setTouched(new Set(allFields));

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await storeService.createStore({
        storeName: form.storeName.trim(),
        storeCode: form.storeCode.trim(),
        tenantId: 'tenant-demo',
        region: form.region,
        city: form.city.trim(),
        address: form.address.trim(),
        managerName: form.managerName.trim(),
        managerMobile: form.managerMobile.trim(),
        employeeCount: form.employeeCount,
        status: form.status,
      });

      if (result.success && result.data) {
        router.push(`/stores/${result.data.id}`);
      } else {
        setSubmitError(result.error?.message ?? '创建门店失败，请稍后重试');
      }
    } catch (err) {
      setSubmitError('网络错误，请检查网络连接后重试');
    } finally {
      setSubmitting(false);
    }
  }

  const containerStyle: React.CSSProperties = {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: 12,
    padding: 32,
    maxWidth: 720,
    margin: '0 auto',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#94a3b8',
    marginBottom: 6,
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    background: 'rgba(15, 23, 42, 0.6)',
    border: `1px solid ${hasError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(148, 163, 184, 0.2)'}`,
    color: '#f8fafc',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  });

  const selectStyle = (hasError: boolean): React.CSSProperties => ({
    ...inputStyle(hasError),
    cursor: 'pointer',
  });

  const errorTextStyle: React.CSSProperties = {
    color: '#f87171',
    fontSize: 12,
    marginTop: 4,
  };

  const gridRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    marginBottom: 20,
  };

  const fullRowStyle: React.CSSProperties = {
    marginBottom: 20,
  };

  return (
    <PageShell
      title="新增门店"
      subtitle="填写门店基本信息完成创建"
      actions={
        <button
          onClick={() => router.push('/stores')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#94a3b8',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          返回列表
        </button>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={containerStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 24px' }}>
            基本信息
          </h2>

          {/* 门店名称 + 门店编号 */}
          <div style={gridRowStyle}>
            <div>
              <label style={labelStyle}>
                门店名称 <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                style={inputStyle(!!errors.storeName)}
                value={form.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                onBlur={() => handleBlur('storeName')}
                placeholder="如: 深圳南山旗舰店"
              />
              {errors.storeName && <div style={errorTextStyle}>{errors.storeName}</div>}
            </div>
            <div>
              <label style={labelStyle}>
                门店编号 <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                style={inputStyle(!!errors.storeCode)}
                value={form.storeCode}
                onChange={(e) => handleChange('storeCode', e.target.value.toUpperCase())}
                onBlur={() => handleBlur('storeCode')}
                placeholder="如: SZ-CENTER-01"
              />
              {errors.storeCode && <div style={errorTextStyle}>{errors.storeCode}</div>}
            </div>
          </div>

          {/* 所属地区 + 城市 */}
          <div style={gridRowStyle}>
            <div>
              <label style={labelStyle}>
                所属地区 <span style={{ color: '#f87171' }}>*</span>
              </label>
              <select
                style={selectStyle(!!errors.region)}
                value={form.region}
                onChange={(e) => handleChange('region', e.target.value)}
                onBlur={() => handleBlur('region')}
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.region && <div style={errorTextStyle}>{errors.region}</div>}
            </div>
            <div>
              <label style={labelStyle}>
                城市 <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                style={inputStyle(!!errors.city)}
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                onBlur={() => handleBlur('city')}
                placeholder="如: 深圳"
              />
              {errors.city && <div style={errorTextStyle}>{errors.city}</div>}
            </div>
          </div>

          {/* 详细地址 */}
          <div style={fullRowStyle}>
            <label style={labelStyle}>
              详细地址 <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              style={inputStyle(!!errors.address)}
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              placeholder="如: 深圳市南山区科技园南路88号"
            />
            {errors.address && <div style={errorTextStyle}>{errors.address}</div>}
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '24px 0' }}>
            联系人信息
          </h2>

          {/* 店长姓名 + 联系电话 */}
          <div style={gridRowStyle}>
            <div>
              <label style={labelStyle}>
                店长姓名 <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                style={inputStyle(!!errors.managerName)}
                value={form.managerName}
                onChange={(e) => handleChange('managerName', e.target.value)}
                onBlur={() => handleBlur('managerName')}
                placeholder="如: 张店长"
              />
              {errors.managerName && <div style={errorTextStyle}>{errors.managerName}</div>}
            </div>
            <div>
              <label style={labelStyle}>
                联系电话 <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                style={inputStyle(!!errors.managerMobile)}
                value={form.managerMobile}
                onChange={(e) => handleChange('managerMobile', e.target.value)}
                onBlur={() => handleBlur('managerMobile')}
                placeholder="如: 13800138001"
                maxLength={11}
              />
              {errors.managerMobile && <div style={errorTextStyle}>{errors.managerMobile}</div>}
            </div>
          </div>

          {/* 员工数量 + 状态 */}
          <div style={gridRowStyle}>
            <div>
              <label style={labelStyle}>员工数量</label>
              <input
                type="number"
                min={1}
                max={999}
                style={inputStyle(!!errors.employeeCount)}
                value={form.employeeCount}
                onChange={(e) => handleChange('employeeCount', Math.max(1, parseInt(e.target.value) || 1))}
                onBlur={() => handleBlur('employeeCount')}
              />
              {errors.employeeCount && <div style={errorTextStyle}>{errors.employeeCount}</div>}
            </div>
            <div>
              <label style={labelStyle}>门店状态</label>
              <select
                style={selectStyle(false)}
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="active">营业中</option>
                <option value="inactive">休息中</option>
                <option value="suspended">已停业</option>
              </select>
            </div>
          </div>

          {/* 提交错误提示 */}
          {submitError && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              {submitError}
            </div>
          )}

          {/* 提交按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => router.push('/stores')}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#94a3b8',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? '提交中...' : '创建门店'}
            </Button>
          </div>
        </div>
      </form>
    </PageShell>
  );
}
