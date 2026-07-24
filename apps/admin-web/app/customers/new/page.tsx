'use client'
/**
 * customers/new/page.tsx — 新建客户表单页 (admin-web)
 *
 * 功能: 新建客户信息表单，含验证、提交、反馈
 */
'use client'

import React, { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  FormField,
  FormSubmitFeedback,
  SubmitButton,
  validateFormFields,
  useToast,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui'

import {
  CUSTOMER_SOURCES,
  MEMBER_LEVELS,
  CUSTOMER_SOURCE_MAP,
  MEMBER_LEVEL_MAP,
  type CustomerSource,
  type MemberLevel,
} from '../customers-data'

export interface NewCustomerFormData {
  name: string
  phone: string
  gender: string
  city: string
  source: string
  memberLevel: string
  birthDate: string
  remark: string
}

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unknown', label: '未知' },
]

const SOURCE_OPTIONS = CUSTOMER_SOURCES.map((k: CustomerSource) => ({
  value: k,
  label: CUSTOMER_SOURCE_MAP[k],
}))

const LEVEL_OPTIONS = MEMBER_LEVELS.map((k: MemberLevel) => ({
  value: k,
  label: MEMBER_LEVEL_MAP[k].label,
}))

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '客户姓名',
    type: 'text',
    required: true,
    placeholder: '请输入客户姓名',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length < 2 ? '姓名至少2个字符' : null,
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 20 ? '姓名最多20个字符' : null,
      },
    ],
  },
  {
    key: 'phone',
    label: '手机号',
    type: 'text',
    required: true,
    placeholder: '请输入11位手机号',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && !/^1\d{10}$/.test(v) ? '请输入有效的11位手机号' : null,
      },
    ],
  },
  {
    key: 'gender',
    label: '性别',
    type: 'select',
    required: false,
    placeholder: '请选择性别',
  },
  {
    key: 'city',
    label: '城市',
    type: 'text',
    required: false,
    placeholder: '请输入所在城市',
  },
  {
    key: 'source',
    label: '客户来源',
    type: 'select',
    required: true,
    placeholder: '请选择来源',
  },
  {
    key: 'memberLevel',
    label: '会员等级',
    type: 'select',
    required: true,
    placeholder: '请选择会员等级',
  },
  {
    key: 'birthDate',
    label: '出生日期',
    type: 'text',
    required: false,
    placeholder: '例如: 1990-01-01',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(v)
            ? '日期格式不正确，请使用 YYYY-MM-DD'
            : null,
      },
    ],
  },
  {
    key: 'remark',
    label: '备注',
    type: 'textarea',
    required: false,
    placeholder: '可填写客户备注信息',
  },
]

function getDefaultFormData(): NewCustomerFormData {
  return {
    name: '',
    phone: '',
    gender: 'unknown',
    city: '',
    source: '',
    memberLevel: '',
    birthDate: '',
    remark: '',
  }
}

export default function NewCustomerPage() {
  const router = useRouter()
  const { success: showSuccess, error: showError } = useToast()
  const [formData, setFormData] = useState<NewCustomerFormData>(getDefaultFormData())
  const [errors, setErrors] = useState<Partial<Record<keyof NewCustomerFormData, string>>>({})
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = useCallback((field: keyof NewCustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }, [errors])

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateFormFields(FIELDS, formData as unknown as Record<string, unknown>)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors as Partial<Record<keyof NewCustomerFormData, string>>)
      showError('请检查表单中的错误')
      return
    }

    setErrors({})
    setSubmitState('submitting')
    setSubmitError(null)

    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 300))
      setSubmitState('success')
      showSuccess('客户创建成功')
      setTimeout(() => router.push('/customers'), 800)
    } catch {
      setSubmitState('error')
      setSubmitError('提交失败，请重试')
      showError('提交失败，请重试')
    }
  }, [formData, router, showSuccess, showError])

  const handleRetry = useCallback(() => {
    setSubmitState('idle')
    setSubmitError(null)
  }, [])

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
    boxSizing: 'border-box' as const,
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'auto' as const,
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 80,
    resize: 'vertical' as const,
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#e2e8f0' }}>
        新建客户
      </h1>

      <FormField label="客户姓名" error={errors.name}>
        <input
          style={inputStyle}
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="请输入客户姓名"
          aria-label="客户姓名"
        />
      </FormField>

      <FormField label="手机号" error={errors.phone}>
        <input
          style={inputStyle}
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="请输入11位手机号"
          aria-label="手机号"
        />
      </FormField>

      <FormField label="性别">
        <select
          style={selectStyle}
          value={formData.gender}
          onChange={(e) => handleChange('gender', e.target.value)}
          aria-label="性别"
        >
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FormField>

      <FormField label="城市">
        <input
          style={inputStyle}
          value={formData.city}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="请输入所在城市"
          aria-label="城市"
        />
      </FormField>

      <FormField label="客户来源" error={errors.source}>
        <select
          style={selectStyle}
          value={formData.source}
          onChange={(e) => handleChange('source', e.target.value)}
          aria-label="客户来源"
        >
          <option value="">请选择来源</option>
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FormField>

      <FormField label="会员等级" error={errors.memberLevel}>
        <select
          style={selectStyle}
          value={formData.memberLevel}
          onChange={(e) => handleChange('memberLevel', e.target.value)}
          aria-label="会员等级"
        >
          <option value="">请选择会员等级</option>
          {LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FormField>

      <FormField label="出生日期" error={errors.birthDate}>
        <input
          style={inputStyle}
          value={formData.birthDate}
          onChange={(e) => handleChange('birthDate', e.target.value)}
          placeholder="例如: 1990-01-01"
          aria-label="出生日期"
        />
      </FormField>

      <FormField label="备注">
        <textarea
          style={textareaStyle}
          value={formData.remark}
          onChange={(e) => handleChange('remark', e.target.value)}
          placeholder="可填写客户备注信息"
          aria-label="备注"
        />
      </FormField>

      <FormSubmitFeedback
        state={{
          isSubmitting: submitState === 'submitting',
          successMessage: submitState === 'success' ? '客户创建成功' : undefined,
          errorMessage: submitError,
        }}
        onRetry={handleRetry}
      />

      <div style={{ marginTop: 24 }}>
        <SubmitButton
          onClick={handleSubmit}
          loading={submitState === 'submitting'}
          disabled={submitState === 'submitting'}
        >
          创建客户
        </SubmitButton>
      </div>
    </div>
  )
}
