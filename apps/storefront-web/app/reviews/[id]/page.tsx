/**
 * 评价详情页 — Review Detail Page (Next.js App Router Page)
 * 角色视角: 🛒 前台消费者 / 👔 门店运营
 * 功能: 查看评价详情、状态流转(隐藏/显示/待审核)、编辑评价内容、删除评价
 * 类型: B-详情页 (含编辑/删除/状态流转)
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailShell,
  InfoRow,
  StatusBadge,
  Button,
  DetailActionBar,
  DetailClosureBar,
  DescriptionList,
  ConfirmDialog,
  FormField,
  FormSubmitFeedback,
  SubmitButton,
  useFormSubmit,
  WorkspaceBreadcrumb,
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
} from '@m5/ui';
import type { Review, ReviewStatus, Rating, ReviewTag } from '../reviews-data';

// ============================================================
// 常量与映射
// ============================================================

const STATUS_LABELS: Record<ReviewStatus, string> = {
  published: '已发布',
  hidden: '已隐藏',
  pending: '待审核',
};

const STATUS_VARIANTS: Record<ReviewStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  published: 'success',
  hidden: 'neutral',
  pending: 'warning',
};

/** 评分文字 */
const RATING_WORDS: Record<Rating, string> = {
  1: '非常差',
  2: '差',
  3: '一般',
  4: '好',
  5: '非常好',
};

/** 状态流转映射 */
const NEXT_STATUS_MAP: Record<ReviewStatus, ReviewStatus[]> = {
  published: ['hidden'],
  hidden: ['published'],
  pending: ['published', 'hidden'],
};

const TRANSITION_LABELS: Record<string, string> = {
  'pending→published': '审核通过 → 发布',
  'pending→hidden': '驳回 → 隐藏',
  'published→hidden': '隐藏评价',
  'hidden→published': '重新发布',
};

// ============================================================
// Mock 数据 — 生产环境替换为 API 调用
// ============================================================

import { MOCK_REVIEWS } from '../reviews-data';

function getReviewById(id: string): Review | undefined {
  return MOCK_REVIEWS.find((r) => r.reviewId === id);
}

// ============================================================
// 模拟 API
// ============================================================

async function submitReviewEdit(
  _id: string,
  _data: { content: string; tags: ReviewTag[] }
): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, 600));
  return { success: true };
}

async function transitionReviewStatus(
  _id: string,
  _from: ReviewStatus,
  _to: ReviewStatus
): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, 400));
  return { success: true };
}

async function deleteReview(_id: string): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, 500));
  return { success: true };
}

// ============================================================
// 详情页组件
// ============================================================

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const review = getReviewById(id);

  // ---- 状态 ----
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(review?.content ?? '');
  const [editTags, setEditTags] = useState<ReviewTag[]>(review?.tags ?? []);
  const [localStatus, setLocalStatus] = useState<ReviewStatus>(review?.status ?? 'pending');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [localDeleted, setLocalDeleted] = useState(false);

  const {
    submit: handleSave,
    state: saveState,
    reset: resetSave,
  } = useFormSubmit({
    async onSubmit() {
      if (!review) throw new Error('评价不存在');
      if (!editContent.trim()) throw new Error('评价内容不能为空');
      await submitReviewEdit(review.reviewId, {
        content: editContent.trim(),
        tags: editTags,
      });
    },
    successMessage: '评价已更新',
  });

  const [transitioning, setTransitioning] = useState(false);

  const handleTransition = useCallback(
    async (from: ReviewStatus, to: ReviewStatus) => {
      if (!review || transitioning) return;
      setTransitioning(true);
      try {
        await transitionReviewStatus(review.reviewId, from, to);
        setLocalStatus(to);
      } finally {
        setTransitioning(false);
      }
    },
    [review, transitioning]
  );

  const handleDelete = useCallback(async () => {
    if (!review) return;
    await deleteReview(review.reviewId);
    setShowDeleteDialog(false);
    setLocalDeleted(true);
  }, [review]);

  // ---- Guard: 未找到 ----
  if (!review) {
    return (
      <DetailShell title="评价未找到" subtitle="请检查评价 ID" backLink={{ label: '返回评价列表', href: '/reviews' }}>
        <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
          ⚠️ 未找到评价 (ID: {id})
        </div>
      </DetailShell>
    );
  }

  // ---- Guard: 已删除 ----
  if (localDeleted) {
    return (
      <DetailShell title="已删除" subtitle="该评价已被删除" backLink={{ label: '返回评价列表', href: '/reviews' }}>
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
          ✅ 评价 {review.reviewId} 已成功删除
        </div>
      </DetailShell>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        workspaceLabel="评价管理"
        workspaceHref="/reviews"
        intermediateLabel="详情"
        detailLabel={`${review.author.nickname} 的评价`}
      />
      <DetailShell
        title={`${review.author.nickname} 的评价`}
        subtitle={`门店: ${review.storeName} · ${RATING_WORDS[review.rating]}`}
        backLink={{ label: '返回评价列表', href: '/reviews' }}
        actions={buildDetailActions(
          editing,
          saveState.isSubmitting,
          saveState.isSubmitting || transitioning,
          () => {
            if (editing) {
              handleSave().then((result) => {
                if (result !== undefined) {
                  setEditing(false);
                  resetSave();
                }
              }).catch(() => {});
            } else {
              setEditing(true);
              setEditContent(review.content);
              setEditTags([...review.tags]);
            }
          },
          () => {
            setEditing(false);
            resetSave();
            setEditContent(review.content);
            setEditTags([...review.tags]);
          },
          transitioning,
        )}
      >
        {/* 编辑模式 */}
        {editing ? (
          <section style={{
            borderRadius: 16, padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>编辑评价</h3>

            {saveState.isSubmitting || saveState.errorMessage || saveState.successMessage ? (
              <div style={{ marginBottom: 16 }}><FormSubmitFeedback state={saveState} /></div>
            ) : null}

            <FormField label="评价内容" required>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={saveState.isSubmitting}
                style={{
                  width: '100%', borderRadius: 10, padding: '10px 14px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(15, 23, 42, 0.4)', color: '#f1f5f9',
                  fontSize: 14, outline: 'none', minHeight: 100,
                  resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </FormField>
          </section>
        ) : null}

        {/* 基础信息 */}
        <section style={{
          borderRadius: 16, padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>评价信息</h3>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <InfoRow label="评价编号" value={review.reviewId} />
            <InfoRow label="门店" value={review.storeName} />
            <InfoRow
              label="评分"
              value={<span style={{ color: '#f59e0b' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} {review.rating}/5</span>}
            />
            <InfoRow
              label="评价状态"
              value={<StatusBadge label={STATUS_LABELS[localStatus]} variant={STATUS_VARIANTS[localStatus]} size="sm" dot />}
            />
            <InfoRow label="评价者" value={review.author.nickname} />
            <InfoRow label="会员等级" value={review.author.memberTier ?? '-'} />
            <InfoRow label="点赞数" value={`${review.likes}`} />
            <InfoRow label="创建时间" value={new Date(review.createdAt).toLocaleString('zh-CN')} />
          </div>
        </section>

        {/* 评价内容 */}
        <section style={{
          borderRadius: 16, padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>评价内容</h3>
          <p style={{ color: '#cbd5e1', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
            {editing ? editContent : review.content}
          </p>
          {review.tags.length > 0 && !editing && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {review.tags.map((tag) => (
                <span key={tag} style={{
                  padding: '3px 10px', borderRadius: 12,
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa', fontSize: 12,
                }}>{tag}</span>
              ))}
            </div>
          )}
        </section>

        {/* 商家回复 */}
        {review.reply && !editing && (
          <section style={{
            borderRadius: 16, padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>商家回复</h3>
            <p style={{ color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
              {review.reply}
            </p>
            {review.repliedAt && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                回复于 {new Date(review.repliedAt).toLocaleString('zh-CN')}
              </div>
            )}
          </section>
        )}

        {/* 状态流转 */}
        <section style={{
          borderRadius: 16, padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>状态流转</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {NEXT_STATUS_MAP[localStatus].map((next) => {
              const key = `${localStatus}→${next}`;
              const label = TRANSITION_LABELS[key] ?? `${STATUS_LABELS[localStatus]} → ${STATUS_LABELS[next]}`;
              const variant = next === 'hidden' ? 'danger' as const : 'primary' as const;
              return (
                <Button
                  key={key}
                  variant={variant}
                  size="sm"
                  loading={transitioning}
                  disabled={transitioning}
                  onClick={() => handleTransition(localStatus, next)}
                >
                  {label}
                </Button>
              );
            })}
            <Button variant="danger" size="sm" onClick={() => setShowDeleteDialog(true)}>
              删除评价
            </Button>
          </div>
        </section>

        <DetailClosureBar
          heading="关联链接"
          caption="返回评价管理入口"
          links={[
            { key: 'back-to-reviews', title: '返回评价列表', subtitle: '浏览全部用户评价', href: '/reviews' },
          ]}
        />
      </DetailShell>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="确认删除"
        message={`确定要删除 ${review.author.nickname} 的评价吗？此操作不可撤回。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}

// ============================================================
// 工具函数
// ============================================================

function buildDetailActions(
  editing: boolean,
  isSubmitting: boolean,
  disabled: boolean,
  onEdit: () => void,
  onCancel: () => void,
  transitioning: boolean,
): DetailShellAction[] {
  if (editing) {
    return [
      {
        key: 'save',
        label: isSubmitting ? '保存中...' : '保存',
        variant: 'primary',
        loading: isSubmitting,
        disabled: isSubmitting,
        onClick: onEdit,
      },
      {
        key: 'cancel',
        label: '取消',
        variant: 'secondary',
        disabled: isSubmitting,
        onClick: onCancel,
      },
    ];
  }
  return [
    {
      key: 'edit',
      label: '编辑',
      variant: 'primary',
      disabled,
      onClick: onEdit,
    },
  ];
}
