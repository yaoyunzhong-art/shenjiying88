/**
 * Phase 99 多模态存储 仪表盘 (V11 Sprint 3 Day 34)
 *
 * 资产网格 + 上传组件 + 存储统计 + 后端管理
 */

import React, { useState } from 'react'
import {
  useMultimediaAssets, useStorageStats, useStorageBackends,
  useUploadAsset, useDeleteAsset, useGenerateSignedUrl,
} from './useMultimedia'
import {
  ASSET_TYPE_LABELS, ASSET_TYPE_ICONS, ASSET_STATUS_LABELS, ASSET_STATUS_COLORS,
  BACKEND_TYPE_LABELS, formatBytes,
  type MultimediaAsset, type AssetType, type StorageBackend, type StorageStats,
} from './types'

export interface MultimediaDashboardProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  filterType?: AssetType
  onAssetSelect?: (asset: MultimediaAsset) => void
}

export function MultimediaDashboard({ variant = 'pc', filterType, onAssetSelect }: MultimediaDashboardProps) {
  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'
  const { data: assets = [], isLoading } = useMultimediaAssets({ assetType: filterType, limit: 100 })
  const { data: stats } = useStorageStats()
  const { data: backends = [] } = useStorageBackends()
  const [showUpload, setShowUpload] = useState(false)
  const [showBackends, setShowBackends] = useState(false)

  if (isLoading) {
    return <div data-testid="mm-loading" style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>加载中...</div>
  }

  return (
    <div
      data-testid="multimedia-dashboard"
      data-variant={variant}
      style={{
        padding: isCompact ? 12 : 20, background: '#f0f2f5', minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: isCompact ? 18 : 22, margin: 0 }}>多模态存储</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            data-testid="mm-toggle-backends"
            onClick={() => setShowBackends((v) => !v)}
            style={{
              padding: '6px 14px', fontSize: 12, borderRadius: 4,
              background: showBackends ? '#1890ff' : '#fff',
              color: showBackends ? '#fff' : '#1890ff',
              border: '1px solid #1890ff', cursor: 'pointer',
            }}
          >
            存储后端 ({backends.length})
          </button>
          <button
            type="button"
            data-testid="mm-upload-btn"
            onClick={() => setShowUpload((v) => !v)}
            style={{
              padding: '6px 14px', fontSize: 12, borderRadius: 4,
              background: showUpload ? '#52c41a' : '#fff',
              color: showUpload ? '#fff' : '#52c41a',
              border: '1px solid #52c41a', cursor: 'pointer',
            }}
          >
            + 上传资产
          </button>
        </div>
      </div>

      {/* 存储统计 */}
      {stats && <StorageStatsPanel stats={stats} isCompact={isCompact} />}

      {/* 存储后端列表 */}
      {showBackends && <StorageBackendsList backends={backends} isCompact={isCompact} />}

      {/* 上传组件 */}
      {showUpload && <UploadPanel onClose={() => setShowUpload(false)} isCompact={isCompact} />}

      {/* 资产网格 */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 14, margin: '0 0 10px' }}>
          资产列表 ({assets.length})
          {filterType && <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 8 }}>过滤: {ASSET_TYPE_LABELS[filterType]}</span>}
        </h2>
        {assets.length === 0 ? (
          <div data-testid="mm-empty" style={{ background: '#fff', padding: 32, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
            暂无资产,点击右上角"上传资产"开始
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isCompact ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {assets.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                isCompact={isCompact}
                onClick={() => onAssetSelect?.(a)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ StorageStatsPanel ============

interface StatsPanelProps { stats: StorageStats; isCompact: boolean }
function StorageStatsPanel({ stats, isCompact }: StatsPanelProps) {
  return (
    <div
      data-testid="mm-stats-panel"
      style={{
        background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <h3 style={{ fontSize: 13, margin: '0 0 12px' }}>存储概览</h3>
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
        <StatBox label="总资产" value={stats.totalAssets.toString()} testid="mm-stat-total" />
        <StatBox label="总占用" value={formatBytes(stats.totalSizeBytes)} testid="mm-stat-size" />
        <StatBox label="近 24h" value={`${stats.recentUploads} 个`} testid="mm-stat-recent" />
        <StatBox label="去重命中" value={stats.duplicateHits.toString()} testid="mm-stat-dedup" />
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Object.entries(stats.byType).map(([type, info]) => (
          <div
            key={type}
            data-testid={`mm-type-${type}`}
            style={{
              padding: '4px 10px', fontSize: 11, borderRadius: 12,
              background: '#f0f5ff', color: '#1890ff',
              border: '1px solid #d6e4ff',
            }}
          >
            {ASSET_TYPE_ICONS[type as AssetType] ?? '📎'} {ASSET_TYPE_LABELS[type as AssetType] ?? type}: {info.count} ({formatBytes(info.sizeBytes)})
          </div>
        ))}
      </div>
    </div>
  )
}

function StatBox({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div data-testid={testid} style={{ background: '#fafafa', padding: 10, borderRadius: 6 }}>
      <div style={{ fontSize: 11, color: '#8c8c8c' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: '#262626' }}>{value}</div>
    </div>
  )
}

// ============ StorageBackendsList ============

function StorageBackendsList({ backends, isCompact }: { backends: StorageBackend[]; isCompact: boolean }) {
  return (
    <div
      data-testid="mm-backends-list"
      style={{
        background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <h3 style={{ fontSize: 13, margin: '0 0 12px' }}>存储后端</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {backends.map((b) => (
          <div
            key={b.id}
            data-testid={`mm-backend-${b.id}`}
            data-default={b.isDefault}
            style={{
              padding: 10, borderRadius: 6,
              border: b.isDefault ? '2px solid #1890ff' : '1px solid #d9d9d9',
              background: b.isDefault ? '#e6f7ff' : '#fafafa',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong style={{ fontSize: 13 }}>{b.name}</strong>
                {b.isDefault && (
                  <span data-testid={`mm-backend-default-${b.id}`} style={{
                    marginLeft: 8, padding: '1px 6px', fontSize: 10, borderRadius: 8,
                    background: '#1890ff', color: '#fff',
                  }}>默认</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>{BACKEND_TYPE_LABELS[b.type] ?? b.type}</span>
            </div>
            <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>
              {b.bucket} · {b.region}
              {b.cdnDomain && ` · CDN: ${b.cdnDomain}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ UploadPanel ============

function UploadPanel({ onClose, isCompact }: { onClose: () => void; isCompact: boolean }) {
  const [name, setName] = useState('new-asset.jpg')
  const [tags, setTags] = useState('upload, test')
  const uploadMut = useUploadAsset()

  const handleUpload = () => {
    uploadMut.mutate({
      file: { name, size: 1024 * 1024, type: 'image/jpeg' },
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <div
      data-testid="mm-upload-panel"
      style={{
        background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <h3 style={{ fontSize: 13, margin: '0 0 12px' }}>上传资产</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        <label style={{ fontSize: 12 }}>
          文件名
          <input
            data-testid="mm-upload-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          />
        </label>
        <label style={{ fontSize: 12 }}>
          标签 (逗号分隔)
          <input
            data-testid="mm-upload-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            data-testid="mm-upload-submit"
            onClick={handleUpload}
            style={{
              padding: '6px 16px', fontSize: 12, borderRadius: 4,
              background: '#52c41a', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            开始上传
          </button>
          <button
            type="button"
            data-testid="mm-upload-cancel"
            onClick={onClose}
            style={{
              padding: '6px 16px', fontSize: 12, borderRadius: 4,
              background: '#fff', color: '#595959', border: '1px solid #d9d9d9', cursor: 'pointer',
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ AssetCard ============

interface AssetCardProps {
  asset: MultimediaAsset
  isCompact: boolean
  onClick: () => void
}
function AssetCard({ asset, isCompact, onClick }: AssetCardProps) {
  const deleteMut = useDeleteAsset()
  const signedUrlMut = useGenerateSignedUrl()
  const status = asset.status
  const color = ASSET_STATUS_COLORS[status]
  const typeIcon = ASSET_TYPE_ICONS[asset.assetType]

  const handleSignedUrl = (e: React.MouseEvent) => {
    e.stopPropagation()
    signedUrlMut.mutate({ assetId: asset.id })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`确认删除 ${asset.originalFilename}?`)) {
      deleteMut.mutate(asset.id)
    }
  }

  return (
    <div
      data-testid={`mm-asset-${asset.id}`}
      data-status={status}
      data-type={asset.assetType}
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 8, overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer',
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* 缩略图占位 */}
      <div
        data-testid={`mm-asset-thumb-${asset.id}`}
        style={{
          height: isCompact ? 80 : 120,
          background: status === 'processing'
            ? 'linear-gradient(90deg, #f0f0f0 25%, #e6f7ff 50%, #f0f0f0 75%)'
            : '#fafafa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isCompact ? 24 : 36, color: '#bfbfbf',
          position: 'relative',
        }}
      >
        {status === 'processing' ? (
          <div data-testid={`mm-asset-progress-${asset.id}`} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#1890ff' }}>处理中 {(asset.processingProgress * 100).toFixed(0)}%</div>
            <div style={{ height: 4, width: 100, background: '#fff', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${asset.processingProgress * 100}%`, height: '100%', background: '#1890ff' }} />
            </div>
          </div>
        ) : (
          <span>{typeIcon}</span>
        )}
      </div>

      {/* 信息 */}
      <div style={{ padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <strong style={{ fontSize: 12, color: '#262626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {asset.originalFilename}
          </strong>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
          <span
            data-testid={`mm-asset-status-${asset.id}`}
            style={{
              padding: '1px 6px', fontSize: 10, borderRadius: 8,
              background: `${color}20`, color,
            }}
          >
            {ASSET_STATUS_LABELS[status]}
          </span>
          {asset.tags.slice(0, 2).map((t) => (
            <span key={t} style={{
              padding: '1px 6px', fontSize: 10, borderRadius: 8,
              background: '#f0f0f0', color: '#595959',
            }}>#{t}</span>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#8c8c8c' }}>
          {formatBytes(asset.sizeBytes)} · {asset.variantCount} 衍生
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <button
            type="button"
            data-testid={`mm-asset-signed-${asset.id}`}
            onClick={handleSignedUrl}
            style={{
              flex: 1, padding: '3px 6px', fontSize: 10, borderRadius: 3,
              background: '#e6f7ff', color: '#1890ff', border: 'none', cursor: 'pointer',
            }}
          >
            签名 URL
          </button>
          <button
            type="button"
            data-testid={`mm-asset-delete-${asset.id}`}
            onClick={handleDelete}
            style={{
              flex: 1, padding: '3px 6px', fontSize: 10, borderRadius: 3,
              background: '#fff1f0', color: '#ff4d4f', border: 'none', cursor: 'pointer',
            }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}