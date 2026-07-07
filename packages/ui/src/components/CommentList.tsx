'use client';

import React, { useState } from 'react';

// ==================== 类型定义 ====================

export interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface CommentItem {
  id: string;
  author: CommentAuthor;
  content: string;
  createdAt: string;
  likes: number;
  liked?: boolean;
  replies?: CommentItem[];
}

export interface CommentListProps {
  /** 评论数据 */
  comments: CommentItem[];
  /** 当前用户 ID */
  currentUserId?: string;
  /** 添加评论回调 */
  onAddComment?: (content: string, parentId?: string) => void;
  /** 删除评论回调 */
  onDeleteComment?: (commentId: string) => void;
  /** 点赞/取消点赞回调 */
  onToggleLike?: (commentId: string) => void;
  /** 加载更多回调 */
  onLoadMore?: () => void;
  /** 是否正在加载更多 */
  loading?: boolean;
  /** 是否还有更多 */
  hasMore?: boolean;
  /** 占位文本 */
  placeholder?: string;
  /** 测试 ID */
  'data-testid'?: string;
}

// ==================== 子组件 ====================

function CommentRow({
  comment,
  depth = 0,
  currentUserId,
  onAddComment,
  onDeleteComment,
  onToggleLike,
  testId,
}: {
  comment: CommentItem;
  depth?: number;
  currentUserId?: string;
  onAddComment?: (content: string, parentId?: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onToggleLike?: (commentId: string) => void;
  testId?: string;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const isAuthor = currentUserId === comment.author.id;

  const handleSubmitReply = () => {
    if (replyText.trim() && onAddComment) {
      onAddComment(replyText.trim(), comment.id);
      setReplyText('');
      setShowReply(false);
    }
  };

  return (
    <div
      data-testid={`${testId}-comment-${comment.id}`}
      style={{
        marginLeft: depth > 0 ? 40 : 0,
        marginTop: depth > 0 ? 8 : 0,
        padding: '10px 12px',
        background: depth > 0 ? '#f9fafb' : '#fff',
        borderRadius: 8,
        border: '1px solid #f3f4f6',
      }}
    >
      {/* 作者信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: '#6b7280',
            flexShrink: 0,
          }}
        >
          {comment.author.avatar ? (
            <img src={comment.author.avatar} alt={comment.author.name} style={{ width: 30, height: 30, borderRadius: '50%' }} />
          ) : (
            comment.author.name.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>{comment.author.name}</span>
          {comment.author.role && (
            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>{comment.author.role}</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{comment.createdAt}</span>
      </div>

      {/* 评论内容 */}
      <p style={{ margin: '0 0 8px 38px', fontSize: 13, color: '#4b5563', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
        {comment.content}
      </p>

      {/* 操作栏 */}
      <div style={{ marginLeft: 38, display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* 点赞 */}
        <button
          data-testid={`${testId}-like-${comment.id}`}
          onClick={() => onToggleLike?.(comment.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 12,
            color: comment.liked ? '#ef4444' : '#9ca3af',
            padding: 0,
          }}
        >
          {comment.liked ? '❤️' : '🤍'} <span>{comment.likes > 0 ? comment.likes : ''}</span>
        </button>

        {/* 回复 */}
        {onAddComment && depth === 0 && (
          <button
            data-testid={`${testId}-reply-btn-${comment.id}`}
            onClick={() => setShowReply(!showReply)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#6b7280', padding: 0 }}
          >
            {showReply ? '取消回复' : '回复'}
          </button>
        )}

        {/* 删除 */}
        {isAuthor && onDeleteComment && (
          <button
            data-testid={`${testId}-delete-${comment.id}`}
            onClick={() => onDeleteComment(comment.id)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#ef4444', padding: 0 }}
          >
            删除
          </button>
        )}
      </div>

      {/* 回复输入框 */}
      {showReply && (
        <div style={{ margin: '8px 0 0 38px', display: 'flex', gap: 8 }}>
          <input
            data-testid={`${testId}-reply-input-${comment.id}`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="输入回复..."
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 12,
              outline: 'none',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitReply(); } }}
          />
          <button
            data-testid={`${testId}-reply-submit-${comment.id}`}
            onClick={handleSubmitReply}
            disabled={!replyText.trim()}
            style={{
              padding: '6px 14px',
              background: replyText.trim() ? '#3b82f6' : '#d1d5db',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              cursor: replyText.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            发送
          </button>
        </div>
      )}

      {/* 子回复 */}
      {comment.replies?.map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          currentUserId={currentUserId}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
          onToggleLike={onToggleLike}
          testId={testId}
        />
      ))}
    </div>
  );
}

// ==================== 主组件 ====================

export function CommentList({
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
  onToggleLike,
  onLoadMore,
  loading = false,
  hasMore = false,
  placeholder = '写下你的评论...',
  'data-testid': testId = 'comment-list',
}: CommentListProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div data-testid={testId}>
      {/* 评论输入 */}
      {onAddComment && (
        <div
          data-testid={`${testId}-input-area`}
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
            padding: 12,
            background: '#f9fafb',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
        >
          <input
            data-testid={`${testId}-input`}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 13,
              outline: 'none',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          />
          <button
            data-testid={`${testId}-submit`}
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            style={{
              padding: '8px 18px',
              background: newComment.trim() ? '#3b82f6' : '#d1d5db',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              cursor: newComment.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            发表
          </button>
        </div>
      )}

      {/* 评论列表 */}
      {comments.length === 0 ? (
        <div
          data-testid={`${testId}-empty`}
          style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}
        >
          暂无评论
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
              onToggleLike={onToggleLike}
              testId={testId}
            />
          ))}
        </div>
      )}

      {/* 加载更多 */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            data-testid={`${testId}-load-more`}
            onClick={onLoadMore}
            disabled={loading}
            style={{
              padding: '6px 20px',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 12,
              color: '#6b7280',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
}
