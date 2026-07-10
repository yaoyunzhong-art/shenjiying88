'use client';

import React from 'react';

// ==================== 类型定义 ====================

export interface CommentAuthor {
  /** 用户名称 */
  name: string;
  /** 头像 URL */
  avatar?: string;
  /** 身份标识（管理员 / 作者等） */
  badge?: string;
}

export interface CommentAction {
  /** 操作标识 */
  key: string;
  /** 操作文本 */
  label: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 图标（可选） */
  icon?: React.ReactNode;
}

export interface CommentData {
  /** 评论唯一标识 */
  id: string;
  /** 评论作者 */
  author: CommentAuthor;
  /** 评论内容 */
  content: React.ReactNode;
  /** 发布时间（显示文本） */
  datetime: string;
  /** 子评论（嵌套回复） */
  replies?: CommentData[];
  /** 评论操作列表 */
  actions?: CommentAction[];
  /** 是否标记为删除 */
  deleted?: boolean;
}

export interface CommentProps {
  /** 评论列表 */
  comments: CommentData[];
  /** 最多展示几级嵌套 */
  maxNest?: number;
  /** 额外类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 空状态提示 */
  emptyText?: string;
}

// ==================== 样式常量 ====================

const WRAPPER_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const ITEM_STYLE: React.CSSProperties = {
  display: 'flex',
  gap: 12,
};

const NESTED_STYLE: React.CSSProperties = {
  marginLeft: 44,
  marginTop: 12,
  borderLeft: '2px solid rgba(148, 163, 184, 0.15)',
  paddingLeft: 16,
};

const AVATAR_STYLE: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  flexShrink: 0,
  background: 'rgba(148, 163, 184, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 600,
  color: '#e2e8f0',
  overflow: 'hidden',
};

const BODY_STYLE: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
};

const AUTHOR_STYLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#e2e8f0',
};

const BADGE_STYLE: React.CSSProperties = {
  fontSize: 11,
  padding: '1px 6px',
  borderRadius: 4,
  background: 'rgba(59, 130, 246, 0.2)',
  color: '#60a5fa',
  lineHeight: '18px',
};

const DATETIME_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
};

const CONTENT_STYLE: React.CSSProperties = {
  fontSize: 14,
  lineHeight: '22px',
  color: '#cbd5e1',
  wordBreak: 'break-word',
};

const ACTIONS_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginTop: 6,
};

const ACTION_BTN_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 13,
  color: '#94a3b8',
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  padding: '2px 4px',
  borderRadius: 4,
  transition: 'color 0.15s, background 0.15s',
};

const DELETED_STYLE: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  fontStyle: 'italic',
};

const EMPTY_STYLE: React.CSSProperties = {
  padding: '24px 0',
  textAlign: 'center',
  color: '#64748b',
  fontSize: 14,
};

// ==================== 单条评论组件 ====================

interface CommentItemProps {
  comment: CommentData;
  nestLevel: number;
  maxNest: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, nestLevel, maxNest }) => {
  const initials = comment.author.name
    .split('')
    .filter(c => /[\u4e00-\u9fa5a-zA-Z]/.test(c))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div>
      <div style={ITEM_STYLE}>
        {/* 头像 */}
        <div style={AVATAR_STYLE}>
          {comment.author.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initials
          )}
        </div>

        {/* 评论主体 */}
        <div style={BODY_STYLE}>
          {/* 头部：作者 + 时间 */}
          <div style={HEADER_STYLE}>
            <span style={AUTHOR_STYLE}>{comment.author.name}</span>
            {comment.author.badge && <span style={BADGE_STYLE}>{comment.author.badge}</span>}
            <span style={DATETIME_STYLE}>{comment.datetime}</span>
          </div>

          {/* 内容 */}
          {comment.deleted ? (
            <div style={DELETED_STYLE}>该评论已被删除</div>
          ) : (
            <div style={CONTENT_STYLE}>{comment.content}</div>
          )}

          {/* 操作 */}
          {!comment.deleted && comment.actions && comment.actions.length > 0 && (
            <div style={ACTIONS_STYLE}>
              {comment.actions.map(action => (
                <button
                  key={action.key}
                  type="button"
                  style={ACTION_BTN_STYLE}
                  onClick={action.onClick}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = '#e2e8f0';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                    (e.currentTarget as HTMLElement).style.background = 'none';
                  }}
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 嵌套回复 */}
      {comment.replies && comment.replies.length > 0 && nestLevel + 1 < maxNest && (
        <div style={NESTED_STYLE}>
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              nestLevel={nestLevel + 1}
              maxNest={maxNest}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== 主组件 ====================

export const Comment: React.FC<CommentProps> = ({
  comments,
  maxNest = 3,
  className,
  style,
  emptyText = '暂无评论',
}) => {
  if (!comments || comments.length === 0) {
    return <div style={EMPTY_STYLE}>{emptyText}</div>;
  }

  return (
    <div style={{ ...WRAPPER_STYLE, ...style }} className={className}>
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          nestLevel={0}
          maxNest={maxNest}
        />
      ))}
    </div>
  );
};

export default Comment;
