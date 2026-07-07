'use client'

/**
 * Phase-36 T166-1: admin-web 会员配置中心
 *
 * 3 个表单分区:
 *  - 积分比例 (D3): earnRate / redeemRate / enabled / expiryDays
 *  - 等级阈值 (D2): Bronze/Silver/Gold/Platinum/Diamond 5 档
 *  - 休眠判定 (D4): dormantDays / churnedDays
 *
 * 反模式 v4 命中:
 *  - async-try-catch-pattern: 所有 fetch try/catch
 *  - feature-flags: 用 useState 热更新
 */

import { useEffect, useState } from 'react'

interface MemberConfig {
  points: {
    earnRate: number
    redeemRate: number
    enabled: boolean
    expiryDays: number
  }
  levels: {
    thresholds: {
      BRONZE: number
      SILVER: number
      GOLD: number
      PLATINUM: number
      DIAMOND: number
    }
  }
  lifecycle: {
    dormantDays: number
    churnedDays: number
  }
  phoneUniqueScope: 'global' | 'tenant'
  crossTenantEnabled: boolean
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function MemberConfigPage() {
  const [config, setConfig] = useState<MemberConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [changeReason, setChangeReason] = useState('')

  // ─── 初始加载 ───
  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/member/config', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setConfig(data.config)
    } catch (err) {
      showToast('error', `加载失败: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  // ─── 保存 ───
  const handleSave = async () => {
    if (!config) return
    if (!changeReason.trim()) {
      showToast('error', '请填写变更原因')
      return
    }

    setSaving(true)
    try {
      // 1. 先 validate
      const validateRes = await fetch('/api/member/config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ patch: config })
      })
      const validateData = await validateRes.json()
      if (!validateData.valid) {
        showToast('error', `校验失败: ${validateData.errors.join(', ')}`)
        return
      }

      // 2. 提交 update
      const updateRes = await fetch('/api/member/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ patch: config, reason: changeReason })
      })
      if (!updateRes.ok) {
        const err = await updateRes.json()
        throw new Error(err.message?.message || `HTTP ${updateRes.status}`)
      }

      showToast('success', '保存成功')
      setChangeReason('')
    } catch (err) {
      showToast('error', `保存失败: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  // ─── 重置 ───
  const handleReset = async () => {
    if (!confirm('确认重置为默认配置?历史变更将保留。')) return
    try {
      const res = await fetch('/api/member/config/reset', {
        method: 'POST',
        credentials: 'include'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setConfig(data.config)
      showToast('success', '已重置为默认配置')
    } catch (err) {
      showToast('error', `重置失败: ${(err as Error).message}`)
    }
  }

  // ─── Toast ───
  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  // ─── 字段更新 helpers ───
  const updatePoints = (field: keyof MemberConfig['points'], value: number | boolean) => {
    if (!config) return
    setConfig({ ...config, points: { ...config.points, [field]: value } })
  }
  const updateThreshold = (level: keyof MemberConfig['levels']['thresholds'], value: number) => {
    if (!config) return
    setConfig({
      ...config,
      levels: { thresholds: { ...config.levels.thresholds, [level]: value } }
    })
  }
  const updateLifecycle = (field: keyof MemberConfig['lifecycle'], value: number) => {
    if (!config) return
    setConfig({ ...config, lifecycle: { ...config.lifecycle, [field]: value } })
  }

  if (loading || !config) {
    return <div style={{ padding: 24 }}>加载中...</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>会员配置中心</h1>
      <p style={{ color: '#666' }}>Phase-36 T166-1 · 大飞哥 D1-D5 决策可调</p>

      {/* Toast */}
      {toast && (
        <div
          style={{
            padding: 12,
            margin: '12px 0',
            borderRadius: 4,
            background: toast.type === 'success' ? '#d4edda' : '#f8d7da',
            color: toast.type === 'success' ? '#155724' : '#721c24'
          }}
        >
          {toast.message}
        </div>
      )}

      {/* 分区 1: 积分比例 (D3) */}
      <fieldset style={{ margin: '20px 0', padding: 16, borderRadius: 4, border: '1px solid #ddd' }}>
        <legend><strong>积分比例 (D3)</strong></legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
          <label>
            赚取比例 (1 元 = N 积分)
            <input
              type="number"
              min="0.01"
              step="0.1"
              value={config.points.earnRate}
              onChange={(e) => updatePoints('earnRate', parseFloat(e.target.value))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            兑换比例 (N 积分 = 1 元)
            <input
              type="number"
              min="1"
              step="10"
              value={config.points.redeemRate}
              onChange={(e) => updatePoints('redeemRate', parseInt(e.target.value, 10))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            积分过期天数 (0 = 永不过期)
            <input
              type="number"
              min="0"
              value={config.points.expiryDays}
              onChange={(e) => updatePoints('expiryDays', parseInt(e.target.value, 10))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginTop: 28 }}>
            <input
              type="checkbox"
              checked={config.points.enabled}
              onChange={(e) => updatePoints('enabled', e.target.checked)}
              style={{ marginRight: 8 }}
            />
            启用积分功能
          </label>
        </div>
      </fieldset>

      {/* 分区 2: 等级阈值 (D2) */}
      <fieldset style={{ margin: '20px 0', padding: 16, borderRadius: 4, border: '1px solid #ddd' }}>
        <legend><strong>等级阈值 (D2 · 累计积分门槛)</strong></legend>
        <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
          必须单调递增: Bronze ≤ Silver ≤ Gold ≤ Platinum ≤ Diamond
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 12 }}>
          {(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const).map((lv) => (
            <label key={lv}>
              {lv}
              <input
                type="number"
                min="0"
                value={config.levels.thresholds[lv]}
                onChange={(e) => updateThreshold(lv, parseInt(e.target.value, 10))}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      {/* 分区 3: 生命周期 (D4) */}
      <fieldset style={{ margin: '20px 0', padding: 16, borderRadius: 4, border: '1px solid #ddd' }}>
        <legend><strong>休眠判定 (D4)</strong></legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
          <label>
            Dormant 阈值 (天未访问)
            <input
              type="number"
              min="1"
              value={config.lifecycle.dormantDays}
              onChange={(e) => updateLifecycle('dormantDays', parseInt(e.target.value, 10))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            Expired 阈值 (天未访问)
            <input
              type="number"
              min="1"
              value={config.lifecycle.churnedDays}
              onChange={(e) => updateLifecycle('churnedDays', parseInt(e.target.value, 10))}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>
        </div>
      </fieldset>

      {/* 分区 4: 变更原因 + 操作 */}
      <fieldset style={{ margin: '20px 0', padding: 16, borderRadius: 4, border: '1px solid #ddd' }}>
        <legend><strong>变更说明 + 操作</strong></legend>
        <label style={{ display: 'block', marginBottom: 12 }}>
          变更原因 (必填, 用于审计)
          <input
            type="text"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="例: 618 大促积分加倍"
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 24px',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            重置为默认
          </button>
          <button
            onClick={fetchConfig}
            style={{
              padding: '10px 24px',
              background: '#fff',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            刷新
          </button>
        </div>
      </fieldset>

      {/* 当前值快照 */}
      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', color: '#666' }}>查看当前配置 (JSON)</summary>
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </details>
    </div>
  )
}
