/**
 * Phase 96 SSO 连接列表 (V10 Sprint 2 Day 24)
 */

import React, { useState } from 'react'
import {
  useSsoConnections, useSsoLogin, useDeleteSsoConnection,
} from './useSso'
import { SSO_PROTOCOL_LABELS, SSO_STATUS_LABELS, SSO_STATUS_COLORS, type SsoConnection } from './types'

export interface SsoConnectionListProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  onEdit?: (conn: SsoConnection) => void
  onCreate?: () => void
}

export function SsoConnectionList({ variant = 'pc', onEdit, onCreate }: SsoConnectionListProps) {
  const { data: connections = [], isLoading } = useSsoConnections()
  const loginMut = useSsoLogin()
  const deleteMut = useDeleteSsoConnection()
  const [testingId, setTestingId] = useState<string | null>(null)

  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'

  const handleTest = (id: string) => {
    setTestingId(id)
    loginMut.mutate(
      { connectionId: id, forceAuthn: false },
      {
        onSuccess: (data) => {
          setTestingId(null)
          if (typeof window !== 'undefined') {
            window.alert(`SSO 测试跳转 URL:\n${data.redirectUrl}\n\n(实际生产会跳转浏览器)`)
          }
        },
      },
    )
  }

  const handleDelete = (id: string, name: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`确定删除 SSO 连接 "${name}"?`)) return
    deleteMut.mutate(id)
  }

  if (isLoading) {
    return <div data-testid="sso-list-loading" style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>加载中...</div>
  }

  return (
    <div
      data-testid="sso-connection-list"
      data-variant={variant}
      style={{ padding: isCompact ? 12 : 20, background: '#f5f5f5', minHeight: '100vh' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: isCompact ? 18 : 22, margin: 0 }}>SSO 单点登录</h1>
        {onCreate && (
          <button
            type="button"
            data-testid="sso-create-btn"
            onClick={onCreate}
            style={{
              padding: '6px 16px', background: '#1890ff', color: '#fff',
              border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13,
            }}
          >
            + 新建 SSO 连接
          </button>
        )}
      </div>

      {connections.length === 0 ? (
        <div
          data-testid="sso-empty"
          style={{ background: '#fff', padding: 40, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}
        >
          暂无 SSO 连接,点击右上角新建
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {connections.map((conn) => (
            <div
              key={conn.id}
              data-testid={`sso-conn-${conn.id}`}
              data-protocol={conn.protocol}
              data-status={conn.status}
              style={{
                background: '#fff', padding: 16, borderRadius: 8,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr auto', gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <strong style={{ fontSize: 15 }}>{conn.name}</strong>
                  <span
                    data-testid={`sso-protocol-${conn.id}`}
                    style={{
                      padding: '2px 8px', fontSize: 11, borderRadius: 10,
                      background: '#1890ff20', color: '#1890ff',
                    }}
                  >
                    {SSO_PROTOCOL_LABELS[conn.protocol]}
                  </span>
                  <span
                    data-testid={`sso-status-${conn.id}`}
                    style={{
                      padding: '2px 8px', fontSize: 11, borderRadius: 10,
                      background: `${SSO_STATUS_COLORS[conn.status]}20`,
                      color: SSO_STATUS_COLORS[conn.status],
                    }}
                  >
                    {SSO_STATUS_COLORS[conn.status] === '#52c41a' ? '●' : '○'} {SSO_STATUS_LABELS[conn.status]}
                  </span>
                  {conn.isDefault && (
                    <span
                      data-testid={`sso-default-${conn.id}`}
                      style={{
                        padding: '2px 8px', fontSize: 11, borderRadius: 10,
                        background: '#faad1420', color: '#faad14',
                      }}
                    >
                      默认
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>
                  <span>允许域名: {conn.allowedEmailDomains.length > 0 ? conn.allowedEmailDomains.join(', ') : '(全部)'}</span>
                  <span style={{ marginLeft: 16 }}>默认角色: {conn.defaultRole}</span>
                  {conn.autoProvisionTenant && <span style={{ marginLeft: 16, color: '#1890ff' }}>自动配置租户</span>}
                </div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                  创建 {new Date(conn.createdAt).toLocaleDateString()} · 更新 {new Date(conn.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  data-testid={`sso-test-${conn.id}`}
                  disabled={testingId === conn.id || conn.status !== 'active'}
                  onClick={() => handleTest(conn.id)}
                  style={{
                    padding: '4px 12px', fontSize: 12, borderRadius: 4,
                    border: '1px solid #1890ff', background: '#fff', color: '#1890ff',
                    cursor: 'pointer', opacity: testingId === conn.id ? 0.6 : 1,
                  }}
                >
                  {testingId === conn.id ? '跳转中...' : '测试登录'}
                </button>
                {onEdit && (
                  <button
                    type="button"
                    data-testid={`sso-edit-${conn.id}`}
                    onClick={() => onEdit(conn)}
                    style={{
                      padding: '4px 12px', fontSize: 12, borderRadius: 4,
                      border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer',
                    }}
                  >
                    编辑
                  </button>
                )}
                <button
                  type="button"
                  data-testid={`sso-delete-${conn.id}`}
                  onClick={() => handleDelete(conn.id, conn.name)}
                  style={{
                    padding: '4px 12px', fontSize: 12, borderRadius: 4,
                    border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer',
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}