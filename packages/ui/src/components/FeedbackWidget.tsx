/**
 * FeedbackWidget — 用户反馈/评价组件
 * 功能: 星级评价 + 文字评论 + 提交/取消操作，支持loading状态和提交后成功展示
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';

// ── Types ───────────────────────────────────────────────────

export interface FeedbackWidgetProps {
  /** Initial rating value (0 to max). */
  initialRating?: number;
  /** Maximum rating value. */
  maxRating?: number;
  /** Rating labels per star index (1-based). */
  ratingLabels?: string[];
  /** Placeholder for the comment textarea. */
  commentPlaceholder?: string;
  /** Maximum comment length. */
  maxCommentLength?: number;
  /** Label for the submit button. */
  submitLabel?: string;
  /** Label for the cancel/reset button. */
  cancelLabel?: string;
  /** Show cancel button. */
  showCancel?: boolean;
  /** Called when feedback is submitted. */
  onSubmit?: (rating: number, comment: string) => void | Promise<void>;
  /** Called when cancelled. */
  onCancel?: () => void;
  /** Whether feedback is being submitted (shows loading). */
  submitting?: boolean;
  /** Title text displayed above the rating. */
  title?: string;
  /** Description / prompt text. */
  description?: string;
  /** Show success state after submission. */
  submitted?: boolean;
  /** Success message shown after submission. */
  successMessage?: string;
  /** CSS class name. */
  className?: string;
}

// ── Defaults ────────────────────────────────────────────────

const DEFAULT_RATING_LABELS = ['很差', '较差', '一般', '满意', '非常满意'];
const DEFAULT_SUCCESS_MSG = '感谢您的反馈！';

// ── Styling helpers ─────────────────────────────────────────

const styles = {
  container: {
    maxWidth: 480,
    padding: 24,
    borderRadius: 12,
    background: '#1e293b',
    border: '1px solid rgba(148,163,184,0.15)',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 1.4,
  },
  stars: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
  },
  star: (filled: boolean) => ({
    fontSize: 28,
    cursor: 'pointer',
    color: filled ? '#fbbf24' : '#475569',
    transition: 'color 0.15s',
    background: 'none',
    border: 'none',
    padding: 0,
    lineHeight: 1,
  }),
  ratingLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
    minHeight: 20,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.2)',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: 14,
    resize: 'vertical' as const,
    minHeight: 80,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  charCount: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right' as const,
    marginTop: 4,
  },
  actions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  btn: (primary: boolean) => ({
    padding: '8px 20px',
    borderRadius: 8,
    border: primary ? 'none' : '1px solid rgba(148,163,184,0.2)',
    background: primary ? '#3b82f6' : 'transparent',
    color: primary ? '#fff' : '#94a3b8',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer' as const,
    transition: 'opacity 0.15s',
    opacity: primary ? 1 : undefined,
  }),
  successContainer: {
    textAlign: 'center' as const,
    padding: '32px 0',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#f1f5f9',
  },
};

// ── Component ───────────────────────────────────────────────

export function FeedbackWidget({
  initialRating = 0,
  maxRating = 5,
  ratingLabels = DEFAULT_RATING_LABELS,
  commentPlaceholder = '请描述您的体验或建议...',
  maxCommentLength = 500,
  submitLabel = '提交反馈',
  cancelLabel = '取消',
  showCancel = true,
  onSubmit,
  onCancel,
  submitting = false,
  title = '意见反馈',
  description,
  submitted = false,
  successMessage = DEFAULT_SUCCESS_MSG,
  className,
}: FeedbackWidgetProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const displayRating = hoverRating || rating;
  const label = useMemo(
    () => (displayRating > 0 && displayRating <= ratingLabels.length ? ratingLabels[displayRating - 1] : ''),
    [displayRating, ratingLabels],
  );
  const canSubmit = rating > 0 && !submitting;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    void onSubmit?.(rating, comment);
  }, [canSubmit, rating, comment, onSubmit]);

  const handleCancel = useCallback(() => {
    setRating(initialRating);
    setComment('');
    onCancel?.();
  }, [initialRating, onCancel]);

  if (submitted) {
    return (
      <div style={styles.container} className={className}>
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>🎉</div>
          <div style={styles.successText}>{successMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className={className}>
      {title && <div style={styles.title}>{title}</div>}
      {description && <div style={styles.description}>{description}</div>}

      {/* Star Rating */}
      <div style={styles.stars}>
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            style={styles.star(star <= displayRating)}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${star} 星`}
          >
            {star <= displayRating ? '★' : '☆'}
          </button>
        ))}
      </div>

      {/* Label */}
      {label && <div style={styles.ratingLabel}>{label}</div>}

      {/* Comment */}
      <textarea
        style={styles.textarea}
        placeholder={commentPlaceholder}
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, maxCommentLength))}
        aria-label="评论内容"
      />
      {maxCommentLength > 0 && (
        <div style={styles.charCount}>
          {comment.length} / {maxCommentLength}
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        {showCancel && (
          <button type="button" style={styles.btn(false)} onClick={handleCancel} disabled={submitting}>
            {cancelLabel}
          </button>
        )}
        <button
          type="button"
          style={{ ...styles.btn(true), opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? '提交中...' : submitLabel}
        </button>
      </div>
    </div>
  );
}
