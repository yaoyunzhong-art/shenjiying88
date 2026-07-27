'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { TRANSFER_TYPES, TYPE_LABEL, URGENCY_LEVELS, URGENCY_LABEL } from '../stock-transfer-data'
import type { StockTransferFormSnapshot } from './stock-transfer-form-data'

interface TransferFormValues {
  sourceStore: string
  targetStore: string
  productName: string
  productSku: string
  quantity: string
  type: string
  urgency: string
  remark: string
}
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

const DEFAULT_VALUES: TransferFormValues = {
  sourceStore: '',
  targetStore: '',
  productName: '',
  productSku: '',
  quantity: '',
  type: 'supply',
  urgency: 'normal',
  remark: '',
}

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.42)',
  padding: 20,
  color: '#e2e8f0',
} as const

const buttonStyle = {
  borderRadius: 8,
  border: '1px solid rgba(96, 165, 250, 0.35)',
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#bfdbfe',
  padding: '8px 14px',
  cursor: 'pointer',
} as const

function validate(values: TransferFormValues): string[] {
  const errors: string[] = []
  if (!values.sourceStore.trim()) errors.push('请选择调出门店')
  if (!values.targetStore.trim()) errors.push('请选择调入门店')
  if (values.sourceStore && values.targetStore && values.sourceStore === values.targetStore) {
    errors.push('调出门店和调入门店不能相同')
  }
  if (!values.productName.trim()) errors.push('请填写商品名称')
  if (!values.productSku.trim()) errors.push('请填写商品 SKU')
  if (!values.quantity.trim() || Number(values.quantity) <= 0) errors.push('调拨数量必须大于 0')
  return errors
}

export default function StockTransferFormClient({ snapshot }: { snapshot: StockTransferFormSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [values, setValues] = useState<TransferFormValues>(DEFAULT_VALUES)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const typeSummary = useMemo(
    () => TRANSFER_TYPES.map((type) => TYPE_LABEL[type]).join(' / '),
    []
  )

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  function updateField(field: keyof TransferFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setSubmitMessage(null)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (nextErrors.length > 0) return
    setSubmitMessage(`调拨单已进入 mock 审核队列，类型 ${TYPE_LABEL[values.type as keyof typeof TYPE_LABEL]}，紧急度 ${URGENCY_LABEL[values.urgency as keyof typeof URGENCY_LABEL]}。`)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          客户端快照上下文: {snapshot.sourceLabel} · 刷新路径: {snapshot.refreshPath}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/stock-transfer" style={{ ...buttonStyle, textDecoration: 'none' }}>
            返回列表
          </Link>
          <button type="button" onClick={handleRefresh} style={buttonStyle}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
          业务配置来源: {snapshot.businessDataSource} · 类型集合: {typeSummary}
        </div>

        {submitMessage ? (
          <div style={{ marginBottom: 16, borderRadius: 12, padding: 12, background: 'rgba(34, 197, 94, 0.12)', color: '#bbf7d0' }}>
            {submitMessage}
          </div>
        ) : null}

        {errors.length > 0 ? (
          <div style={{ marginBottom: 16, borderRadius: 12, padding: 12, background: 'rgba(239, 68, 68, 0.12)', color: '#fecaca' }}>
            {errors.join('；')}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>调出门店</span>
              <select value={values.sourceStore} onChange={(event) => updateField('sourceStore', event.target.value)} style={inputStyle}>
                <option value="">请选择</option>
                {snapshot.stores.map((store) => (
                  <option key={store.value} value={store.value}>{store.label}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>调入门店</span>
              <select value={values.targetStore} onChange={(event) => updateField('targetStore', event.target.value)} style={inputStyle}>
                <option value="">请选择</option>
                {snapshot.stores.map((store) => (
                  <option key={store.value} value={store.value}>{store.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>商品名称</span>
              <input value={values.productName} onChange={(event) => updateField('productName', event.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>商品 SKU</span>
              <input value={values.productSku} onChange={(event) => updateField('productSku', event.target.value)} style={inputStyle} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>调拨数量</span>
              <input value={values.quantity} onChange={(event) => updateField('quantity', event.target.value)} type="number" min="1" style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>调拨类型</span>
              <select value={values.type} onChange={(event) => updateField('type', event.target.value)} style={inputStyle}>
                {TRANSFER_TYPES.map((type) => (
                  <option key={type} value={type}>{TYPE_LABEL[type]}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>紧急度</span>
              <select value={values.urgency} onChange={(event) => updateField('urgency', event.target.value)} style={inputStyle}>
                {URGENCY_LEVELS.map((level) => (
                  <option key={level} value={level}>{URGENCY_LABEL[level]}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: 8 }}>
            <span>备注</span>
            <textarea value={values.remark} onChange={(event) => updateField('remark', event.target.value)} rows={4} style={{ ...inputStyle, paddingTop: 12 }} />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setValues(DEFAULT_VALUES)} style={buttonStyle}>
              重置
            </button>
            <button type="submit" style={buttonStyle}>
              提交调拨
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  minHeight: 40,
  borderRadius: 10,
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.5)',
  color: '#e2e8f0',
  padding: '0 12px',
} as const
