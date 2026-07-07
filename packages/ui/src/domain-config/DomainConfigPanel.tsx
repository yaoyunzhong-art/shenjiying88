/**
 * Phase 96 Domain 配置 UI (V10 Sprint 2 Day 25)
 *
 * 自定义域名管理 + DNS TXT 校验向导 + SSL 申请
 */

import React, { useState } from 'react'
import {
  useDomainList, useDomainAdd, useDomainVerify, useDomainRequestSsl, useDomainRemove,
} from './useDomain'
import { DOMAIN_STATUS_LABELS, DOMAIN_STATUS_COLORS, type DomainMapping, type DomainStatus } from './types'

export interface DomainConfigPanelProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
}

export function DomainConfigPanel({ variant = 'pc' }: DomainConfigPanelProps) {
  const { data: domains = [], isLoading } = useDomainList()
  const addMut = useDomainAdd()
  const verifyMut = useDomainVerify()
  const sslMut = useDomainRequestSsl()
  const removeMut = useDomainRemove()

  const [newDomain, setNewDomain] = useState('')
  const [adding, setAdding] = useState(false)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [sslIssuingId, setSslIssuingId] = useState<string | null>(null)

  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'

  const handleAdd = () => {
    if (!newDomain) return
    setAdding(true)
    addMut.mutate(newDomain, {
      onSuccess: () => {
        setAdding(false)
        setNewDomain('')
      },
      onError: () => setAdding(false),
    })
  }

  const handleVerify = (id: string) => {
    setVerifyingId(id)
    verifyMut.mutate(id, { onSettled: () => setVerifyingId(null) })
  }

  const handleSsl = (id: string) => {
    setSslIssuingId(id)
    sslMut.mutate(id, { onSettled: () => setSslIssuingId(null) })
  }

  const handleRemove = (id: string, domain: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`删除域名 ${domain}?`)) return
    removeMut.mutate(id)
  }

  if (isLoading) {
    return <div data-testid="domain-loading" style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>加载中...</div>
  }

  return (
    <div
      data-testid="domain-config-panel"
      data-variant={variant}
      style={{ padding: isCompact ? 12 : 20, background: '#f5f5f5', minHeight: '100vh' }}
    >
      <h1 style={{ fontSize: isCompact ? 18 : 22, margin: '0 0 16px' }}>自定义域名</h1>

      {/* 添加域名表单 */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 14, margin: '0 0 12px' }}>添加新域名</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            data-testid="domain-input"
            placeholder="acme.shenjiying88.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '6px 12px',
              border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13,
            }}
          />
          <button
            type="button"
            data-testid="domain-add-btn"
            onClick={handleAdd}
            disabled={!newDomain || adding}
            style={{
              padding: '6px 16px', background: '#1890ff', color: '#fff',
              border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13,
              opacity: !newDomain || adding ? 0.6 : 1,
            }}
          >
            {adding ? '添加中...' : '添加'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#8c8c8c', margin: '8px 0 0' }}>
          添加后需在 DNS 服务商添加 TXT 记录完成校验
        </p>
      </div>

      {/* 域名列表 */}
      {domains.length === 0 ? (
        <div
          data-testid="domain-empty"
          style={{ background: '#fff', padding: 40, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}
        >
          暂无自定义域名
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {domains.map((d) => (
            <DomainCard
              key={d.id}
              domain={d}
              isCompact={isCompact}
              verifying={verifyingId === d.id}
              sslIssuing={sslIssuingId === d.id}
              onVerify={() => handleVerify(d.id)}
              onSsl={() => handleSsl(d.id)}
              onRemove={() => handleRemove(d.id, d.domain)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============ Domain Card 子组件 ============

interface DomainCardProps {
  domain: DomainMapping
  isCompact: boolean
  verifying: boolean
  sslIssuing: boolean
  onVerify: () => void
  onSsl: () => void
  onRemove: () => void
}

function DomainCard({ domain, isCompact, verifying, sslIssuing, onVerify, onSsl, onRemove }: DomainCardProps) {
  const [expanded, setExpanded] = useState(false)
  const status: DomainStatus = domain.status
  const color = DOMAIN_STATUS_COLORS[status]

  return (
    <div
      data-testid={`domain-${domain.id}`}
      data-status={status}
      style={{
        background: '#fff', padding: 16, borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 15 }}>{domain.domain}</strong>
            <span
              data-testid={`domain-status-${domain.id}`}
              style={{
                padding: '2px 8px', fontSize: 11, borderRadius: 10,
                background: `${color}20`, color,
              }}
            >
              {DOMAIN_STATUS_LABELS[status]}
            </span>
            {domain.ssl && (
              <span
                data-testid={`domain-ssl-${domain.id}`}
                style={{
                  padding: '2px 8px', fontSize: 11, borderRadius: 10,
                  background: '#13c2c220', color: '#13c2c2',
                }}
              >
                🔒 SSL 至 {new Date(domain.ssl.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
            创建 {new Date(domain.createdAt).toLocaleDateString()}
            {domain.lastVerifiedAt && ` · 上次校验 ${new Date(domain.lastVerifiedAt).toLocaleDateString()}`}
            {domain.verificationFailCount > 0 && (
              <span style={{ color: '#ff4d4f', marginLeft: 8 }}>
                失败 {domain.verificationFailCount}/3
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {status === 'pending_verification' && (
            <button
              type="button"
              data-testid={`domain-verify-${domain.id}`}
              onClick={onVerify}
              disabled={verifying}
              style={{
                padding: '4px 12px', fontSize: 12, borderRadius: 4,
                border: '1px solid #52c41a', background: '#fff', color: '#52c41a', cursor: 'pointer',
                opacity: verifying ? 0.6 : 1,
              }}
            >
              {verifying ? '校验中...' : '校验 DNS'}
            </button>
          )}
          {status === 'active' && (
            <button
              type="button"
              data-testid={`domain-ssl-btn-${domain.id}`}
              onClick={onSsl}
              disabled={sslIssuing}
              style={{
                padding: '4px 12px', fontSize: 12, borderRadius: 4,
                border: '1px solid #1890ff', background: '#fff', color: '#1890ff', cursor: 'pointer',
                opacity: sslIssuing ? 0.6 : 1,
              }}
            >
              {sslIssuing ? '签发中...' : '申请 SSL'}
            </button>
          )}
          {status === 'ssl_failed' && (
            <button
              type="button"
              data-testid={`domain-ssl-retry-${domain.id}`}
              onClick={onSsl}
              style={{
                padding: '4px 12px', fontSize: 12, borderRadius: 4,
                border: '1px solid #faad14', background: '#fff', color: '#faad14', cursor: 'pointer',
              }}
            >
              重试 SSL
            </button>
          )}
          <button
            type="button"
            data-testid={`domain-toggle-${domain.id}`}
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '4px 12px', fontSize: 12, borderRadius: 4,
              border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer',
            }}
          >
            {expanded ? '收起' : '详情'}
          </button>
          <button
            type="button"
            data-testid={`domain-remove-${domain.id}`}
            onClick={onRemove}
            style={{
              padding: '4px 12px', fontSize: 12, borderRadius: 4,
              border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer',
            }}
          >
            删除
          </button>
        </div>
      </div>

      {/* TXT 校验提示 (展开) */}
      {expanded && (
        <div
          data-testid={`domain-txt-hint-${domain.id}`}
          style={{
            marginTop: 12, padding: 12, background: '#fafafa',
            borderRadius: 6, fontSize: 12, fontFamily: 'monospace',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <strong style={{ fontFamily: 'system-ui' }}>DNS TXT 记录配置:</strong>
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>主机 (Host):</span> {domain.verificationHost}
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>类型 (Type):</span> TXT
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>值 (Value):</span> shenjiying-verify={domain.verificationToken}
          </div>
          {domain.ssl && (
            <div style={{ marginTop: 8, fontFamily: 'system-ui' }}>
              <strong>SSL 详情:</strong> {domain.ssl.provider} · 指纹 {domain.ssl.fingerprint.slice(0, 16)}...
            </div>
          )}
        </div>
      )}
    </div>
  )
}