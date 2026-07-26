'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  DetailActionBar,
  DetailClosureBar,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  SubmitButton,
  WorkspaceBreadcrumb,
} from '@m5/ui'
import { useDetailActions } from '../../components/use-detail-actions'
import {
  buildStandardBreadcrumb,
  buildStandardClosureLinks,
} from '../../components/detail-workspace-registry'
import {
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_BADGE_VARIANT,
  STATUS_FLOW_OPTIONS,
  STATUS_LABELS,
  formatDate,
  type Announcement,
} from './announcement-detail-data'
import type { AnnouncementDetailSnapshot } from './announcement-detail-data'

export default function AnnouncementDetailClient({
  snapshot,
}: {
  snapshot: AnnouncementDetailSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [announcement, setAnnouncement] = useState(snapshot.announcement)
  const [submitState, setSubmitState] = useState<'idle' | 'success'>('idle')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', summary: '', content: '' })
  const [editErrors, setEditErrors] = useState<{ title?: string; summary?: string }>(
    {},
  )

  useEffect(() => {
    setAnnouncement(snapshot.announcement)
    setEditing(false)
    setShowConfirmDelete(false)
  }, [snapshot.announcement, snapshot.generatedAt])

  useEffect(() => {
    if (snapshot.announcement) {
      setEditForm({
        title: snapshot.announcement.title,
        summary: snapshot.announcement.summary,
        content: snapshot.announcement.content,
      })
      setEditErrors({})
    }
  }, [snapshot.announcement])

  const detailId = announcement?.id ?? snapshot.requestedId

  const { actions } = useDetailActions({
    workspace: 'announcements',
    detailId: detailId || 'missing',
    record: announcement,
    shareTitle: `公告：${announcement?.title ?? '未命中快照'}`,
    shareText: announcement?.summary ?? '当前详情未命中公告快照',
  })

  const availableTransitions = useMemo(() => {
    if (!announcement) return []
    return STATUS_FLOW_OPTIONS.filter((option) => option.from === announcement.status)
  }, [announcement])

  const handleStatusTransition = useCallback(
    (targetStatus: Announcement['status']) => {
      if (!announcement) return

      const now = new Date().toISOString().slice(0, 10)
      setAnnouncement({
        ...announcement,
        status: targetStatus,
        publishedAt:
          targetStatus === 'published' && !announcement.publishedAt
            ? now
            : announcement.publishedAt,
        updatedAt: now,
      })
      setFeedbackMessage(
        `公告「${announcement.title}」已切换为${STATUS_LABELS[targetStatus]}演练态，需刷新快照恢复服务端视图。`,
      )
      setSubmitState('success')
    },
    [announcement],
  )

  const handleDelete = useCallback(() => {
    if (!announcement) return

    setShowConfirmDelete(false)
    setFeedbackMessage('当前删除仅为客户端演练，返回列表后可刷新服务端快照恢复样本。')
    setSubmitState('success')
    router.push('/announcements')
  }, [announcement, router])

  const handleEditSubmit = useCallback(() => {
    if (!announcement) return

    const errors: { title?: string; summary?: string } = {}
    if (!editForm.title.trim()) {
      errors.title = '公告标题不能为空'
    } else if (editForm.title.trim().length > 100) {
      errors.title = '标题最多 100 个字符'
    }

    if (!editForm.summary.trim()) {
      errors.summary = '摘要不能为空'
    }

    setEditErrors(errors)
    if (Object.keys(errors).length > 0) return

    const now = new Date().toISOString().slice(0, 10)
    setAnnouncement({
      ...announcement,
      title: editForm.title.trim(),
      summary: editForm.summary.trim(),
      content: editForm.content.trim(),
      updatedAt: now,
    })
    setEditing(false)
    setFeedbackMessage('当前修改仅保留在客户端演练态，点击“刷新快照”可回到服务端样本。')
    setSubmitState('success')
  }, [announcement, editForm])

  const closureLinks = [...buildStandardClosureLinks({ workspace: 'announcements', detailId })]

  if (snapshot.notFound || !announcement) {
    return (
      <main style={{ maxWidth: 860, margin: '0 auto', padding: 32 }}>
        <WorkspaceBreadcrumb
          {...buildStandardBreadcrumb({
            workspace: 'announcements',
            detailLabel: '公告详情',
          })}
        />
        <div style={emptyStateStyle}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <h2 style={{ margin: '0 0 8px', color: '#f8fafc' }}>公告不存在</h2>
          <p style={{ margin: '0 0 20px', color: '#94a3b8' }}>
            ID 为 {snapshot.requestedId || '空值'} 的公告未命中当前快照，可能已被删除或尚未同步到样本源。
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <SubmitButton
              label={isRefreshing ? '刷新中...' : '刷新快照'}
              variant="secondary"
              onClick={() => startRefresh(() => router.refresh())}
            />
            <SubmitButton
              label="返回公告列表"
              variant="primary"
              onClick={() => router.push('/announcements')}
            />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({
          workspace: 'announcements',
          detailLabel: announcement.title,
        })}
      />

      {submitState === 'success' ? (
        <FormSubmitFeedback
          success={feedbackMessage}
          onDismissSuccess={() => setSubmitState('idle')}
        />
      ) : null}

      <div style={toolbarStyle}>
        <div>
          <StatusBadge
            variant={STATUS_BADGE_VARIANT[announcement.status]}
            label={STATUS_LABELS[announcement.status]}
            size="md"
            dot
          />
          <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 8 }}>
            最后更新：{formatDate(announcement.updatedAt)} · 样本时间：
            {formatDate(snapshot.generatedAt)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
            style={secondaryButtonStyle}
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
          {availableTransitions.map((transition) => (
            <button
              key={transition.to}
              type="button"
              onClick={() => handleStatusTransition(transition.to)}
              style={accentButtonStyle}
            >
              {transition.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            style={dangerButtonStyle}
          >
            删除
          </button>
        </div>
      </div>

      {editing ? (
        <div style={panelStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#f8fafc' }}>编辑公告</h3>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>公告标题 *</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(event) =>
                setEditForm((current) => ({ ...current, title: event.target.value }))
              }
              style={{
                ...inputStyle,
                border: editErrors.title
                  ? '1px solid #ef4444'
                  : '1px solid rgba(148,163,184,0.3)',
              }}
            />
            {editErrors.title ? <div style={errorTextStyle}>{editErrors.title}</div> : null}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>公告摘要 *</label>
            <input
              type="text"
              value={editForm.summary}
              onChange={(event) =>
                setEditForm((current) => ({ ...current, summary: event.target.value }))
              }
              style={{
                ...inputStyle,
                border: editErrors.summary
                  ? '1px solid #ef4444'
                  : '1px solid rgba(148,163,184,0.3)',
              }}
            />
            {editErrors.summary ? (
              <div style={errorTextStyle}>{editErrors.summary}</div>
            ) : null}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>公告内容</label>
            <textarea
              rows={8}
              value={editForm.content}
              onChange={(event) =>
                setEditForm((current) => ({ ...current, content: event.target.value }))
              }
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <SubmitButton
              label="保存修改"
              variant="primary"
              onClick={handleEditSubmit}
            />
            <SubmitButton
              label="取消"
              variant="secondary"
              onClick={() => {
                setEditing(false)
                setEditErrors({})
              }}
            />
          </div>
        </div>
      ) : (
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
                {announcement.title}
              </h2>
              <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 14 }}>
                {announcement.summary}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={secondaryButtonStyle}
            >
              编辑
            </button>
          </div>

          <div style={metaGridStyle}>
            <InfoRow label="类型" value={CATEGORY_LABELS[announcement.category]} />
            <InfoRow
              label="优先级"
              value={
                <span style={{ color: PRIORITY_COLORS[announcement.priority], fontWeight: 600 }}>
                  {PRIORITY_LABELS[announcement.priority]}
                </span>
              }
            />
            <InfoRow label="作者" value={announcement.author} />
            <InfoRow label="阅读量" value={announcement.readCount.toLocaleString()} />
            <InfoRow label="发布时间" value={formatDate(announcement.publishedAt)} />
            <InfoRow label="创建时间" value={formatDate(announcement.createdAt)} />
            <InfoRow label="最后更新" value={formatDate(announcement.updatedAt)} />
          </div>

          <div style={contentStyle}>{announcement.content}</div>
        </div>
      )}

      {showConfirmDelete ? (
        <div style={overlayStyle} onClick={() => setShowConfirmDelete(false)}>
          <div style={dialogStyle} onClick={(event) => event.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: 18 }}>确认删除公告</h3>
            <p style={{ color: '#94a3b8', margin: '0 0 20px', fontSize: 14 }}>
              删除「{announcement.title}」后会跳回列表；当前仍是客户端演练，不会写入真实消息中心。
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <SubmitButton
                label="取消"
                variant="secondary"
                onClick={() => setShowConfirmDelete(false)}
              />
              <SubmitButton
                label="确认删除"
                variant="danger"
                onClick={handleDelete}
              />
            </div>
          </div>
        </div>
      ) : null}

      <DetailActionBar
        actions={actions}
        heading="详情操作"
        caption="复制 / 导出 / 分享公告详情快照"
      />

      <DetailClosureBar links={closureLinks} />
    </main>
  )
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
  padding: '14px 18px',
  borderRadius: 12,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  flexWrap: 'wrap',
}

const panelStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 24,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  marginBottom: 20,
}

const metaGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 20,
  paddingBottom: 16,
  borderBottom: '1px solid rgba(148,163,184,0.12)',
}

const contentStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.8,
  fontSize: 15,
  color: '#e2e8f0',
  padding: 16,
  borderRadius: 10,
  background: 'rgba(0,0,0,0.15)',
}

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 60,
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const dialogStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 28,
  minWidth: 380,
  background: '#1e293b',
  border: '1px solid rgba(148,163,184,0.18)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: '#94a3b8',
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  background: '#0f172a',
  color: '#f8fafc',
  fontSize: 14,
}

const errorTextStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: 12,
  marginTop: 4,
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.3)',
  background: 'rgba(15,23,42,0.5)',
  color: '#93c5fd',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const accentButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: 8,
  border: '1px solid #52c41a',
  background: '#f6ffed',
  color: '#52c41a',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
}

const dangerButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: 8,
  border: '1px solid #ff4d4f',
  background: '#fff',
  color: '#ff4d4f',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
}
