'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  DEFAULT_MEMBER_CONFIG,
  type MemberConfig,
  type MemberConfigSnapshotDelivery,
} from './member-config-data'

interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function MemberConfigClient({
  snapshot,
}: {
  snapshot: MemberConfigSnapshotDelivery
}) {
  const router = useRouter()
  const [config, setConfig] = useState<MemberConfig>(snapshot.config)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [changeReason, setChangeReason] = useState('')
  const [isRefreshing, startRefresh] = useTransition()

  useEffect(() => {
    setConfig(snapshot.config)
  }, [snapshot.config])

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 3000)
  }

  const updatePoints = (field: keyof MemberConfig['points'], value: number | boolean) => {
    setConfig((current) => ({ ...current, points: { ...current.points, [field]: value } }))
  }

  const updateThreshold = (field: keyof MemberConfig['levels']['thresholds'], value: number) => {
    setConfig((current) => ({
      ...current,
      levels: { thresholds: { ...current.levels.thresholds, [field]: value } },
    }))
  }

  const updateLifecycle = (field: keyof MemberConfig['lifecycle'], value: number) => {
    setConfig((current) => ({ ...current, lifecycle: { ...current.lifecycle, [field]: value } }))
  }

  const handleSave = async () => {
    if (!changeReason.trim()) {
      showToast('error', '请填写变更原因')
      return
    }

    setSaving(true)
    try {
      await fetch('/api/member/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ patch: config, reason: changeReason }),
      })
      showToast('success', '已提交配置更新请求')
      setChangeReason('')
      startRefresh(() => router.refresh())
    } catch (error) {
      showToast('error', `保存失败: ${(error as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(DEFAULT_MEMBER_CONFIG)
    showToast('success', '已重置为默认配置样本')
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>会员配置中心</h1>
          <p style={{ color: '#666' }}>
            Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel} · generatedAt{' '}
            {snapshot.generatedAt}
          </p>
          <p style={{ color: '#666', marginTop: 4 }}>
            最近变更 {snapshot.lastChangedAt} · 操作人 {snapshot.lastChangedBy} · 历史记录{' '}
            {snapshot.historyCount}
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          style={{ padding: '10px 24px', borderRadius: 4, border: '1px solid #ddd', background: '#fff' }}
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {toast && (
        <div
          style={{
            padding: 12,
            margin: '12px 0',
            borderRadius: 4,
            background: toast.type === 'success' ? '#d4edda' : '#f8d7da',
            color: toast.type === 'success' ? '#155724' : '#721c24',
          }}
        >
          {toast.message}
        </div>
      )}

      {snapshot.error && (
        <div
          style={{
            padding: 12,
            margin: '12px 0',
            borderRadius: 4,
            background: '#fff7ed',
            color: '#9a3412',
            border: '1px solid #fdba74',
          }}
        >
          {snapshot.error}
        </div>
      )}

      <fieldset style={{ margin: '20px 0', padding: 16, borderRadius: 4, border: '1px solid #ddd' }}>
        <legend>
          <strong>积分比例</strong>
        </legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
          <label>
            赚取比例
            <input
              type="number"
              min="0.01"
              step="0.1"
              value={config.points.earnRate}
              onChange={(event) => updatePoints('earnRate', Number(event.target.value))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            兑换比例
            <input
              type="number"
              min="1"
              step="10"
              value={config.points.redeemRate}
              onChange={(event) => updatePoints('redeemRate', Number(event.target.value))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            过期天数
            <input
              type="number"
              min="0"
              value={config.points.expiryDays}
              onChange={(event) => updatePoints('expiryDays', Number(event.target.value))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginTop: 28 }}>
            <input
              type="checkbox"
              checked={config.points.enabled}
              onChange={(event) => updatePoints('enabled', event.target.checked)}
              style={{ marginRight: 8 }}
            />
            启用积分功能
          </label>
        </div>
      </fieldset>

      <fieldset style={{ margin: '20px 0', padding: 16, borderRadius: 4, border: '1px solid #ddd' }}>
        <legend>
          <strong>等级阈值</strong>
        </legend>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 12 }}>
          {(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const).map((level) => (
            <label key={level}>
              {level}
              <input
                type="number"
                min="0"
                value={config.levels.thresholds[level]}
                onChange={(event) => updateThreshold(level, Number(event.target.value))}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset style={{ margin: '20px 0', padding: 16, borderRadius: 4, border: '1px solid #ddd' }}>
        <legend>
          <strong>生命周期</strong>
        </legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
          <label>
            Dormant 阈值
            <input
              type="number"
              min="1"
              value={config.lifecycle.dormantDays}
              onChange={(event) => updateLifecycle('dormantDays', Number(event.target.value))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            Churned 阈值
            <input
              type="number"
              min="1"
              value={config.lifecycle.churnedDays}
              onChange={(event) => updateLifecycle('churnedDays', Number(event.target.value))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
        </div>
      </fieldset>

      <fieldset style={{ margin: '20px 0', padding: 16, borderRadius: 4, border: '1px solid #ddd' }}>
        <legend>
          <strong>变更说明 + 操作</strong>
        </legend>
        <label style={{ display: 'block', marginBottom: 12 }}>
          变更原因
          <input
            type="text"
            value={changeReason}
            onChange={(event) => setChangeReason(event.target.value)}
            placeholder="例: 618 大促积分加倍"
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 24px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4 }}
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={{ padding: '10px 24px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 4 }}
          >
            重置为默认
          </button>
        </div>
      </fieldset>

      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', color: '#666' }}>查看当前配置 (JSON)</summary>
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </details>
    </div>
  )
}
