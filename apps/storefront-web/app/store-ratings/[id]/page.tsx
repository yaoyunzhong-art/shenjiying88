/**
 * 门店评分详情页 — Store Rating Detail Page (Next.js App Router Page)
 * 功能: 查看评分详情、回复评价、删除差评、状态流转(未回复→已回复→已隐藏/已公开)
 * 角色视角: 🏪店长 / 🧑💼前台
 * 类型: B-页面创建 (详情页 - 含编辑/删除/状态流转)
 */
'use client';

import React, { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

/* ── 类型 ── */

type RatingStatus = 'unreplied' | 'replied' | 'hidden' | 'visible';

interface RatingDetailItem {
  id: string;
  storeName: string;
  memberName: string;
  memberPhone: string;
  overallScore: number;        // 1-5
  serviceScore: number;        // 1-5
  environmentScore: number;    // 1-5
  productScore: number;        // 1-5
  content: string;
  tags: string[];
  images: string[];
  createdAt: string;
  status: RatingStatus;
  replyContent: string;
  repliedAt: string | null;
  orderNo: string;
}

const MOCK_RATINGS: Record<string, RatingDetailItem> = {
  '1': {
    id: '1', storeName: 'Demo Store 旗舰店',
    memberName: '张伟', memberPhone: '138****1234',
    overallScore: 5, serviceScore: 5, environmentScore: 4, productScore: 5,
    content: '产品质量非常好，店员服务态度也很棒，推荐！环境也比较舒适，下次还会来。',
    tags: ['服务好', '品质好', '环境舒适', '推荐'],
    images: ['review-1.jpg'],
    createdAt: '2026-07-08 14:30',
    status: 'unreplied', replyContent: '', repliedAt: null,
    orderNo: 'ORD-20260708-001',
  },
  '2': {
    id: '2', storeName: 'Demo Store 旗舰店',
    memberName: '李娜', memberPhone: '139****5678',
    overallScore: 3, serviceScore: 3, environmentScore: 4, productScore: 2,
    content: '商品质量一般，跟描述有差距。希望改进。不过环境还不错。',
    tags: ['品质一般', '环境不错'],
    images: [],
    createdAt: '2026-07-07 10:15',
    status: 'replied',
    replyContent: '感谢您的反馈，我们已经针对商品质量问题进行改善，欢迎再次光临体验。',
    repliedAt: '2026-07-07 16:20',
    orderNo: 'ORD-20260707-002',
  },
  '3': {
    id: '3', storeName: 'Demo Store 社区店',
    memberName: '王芳', memberPhone: '137****9012',
    overallScore: 1, serviceScore: 1, environmentScore: 2, productScore: 1,
    content: '非常差的体验，店员态度恶劣，商品有明显的质量问题，不会再来了。',
    tags: ['态度差', '品质差'],
    images: [],
    createdAt: '2026-07-05 18:00',
    status: 'hidden',
    replyContent: '',
    repliedAt: null,
    orderNo: 'ORD-20260705-008',
  },
  '4': {
    id: '4', storeName: 'Demo Store 旗舰店',
    memberName: '赵强', memberPhone: '136****3456',
    overallScore: 4, serviceScore: 4, environmentScore: 5, productScore: 4,
    content: '环境特别好，适合带朋友来。店员也挺热情的，整体满意。',
    tags: ['环境好', '服务好'],
    images: ['review-2.jpg', 'review-3.jpg'],
    createdAt: '2026-07-03 09:00',
    status: 'visible',
    replyContent: '感谢您的认可！我们会继续保持服务质量。',
    repliedAt: '2026-07-04 10:30',
    orderNo: 'ORD-20260703-005',
  },
};

const STATUS_LABEL: Record<RatingStatus, string> = {
  unreplied: '未回复',
  replied: '已回复',
  hidden: '已隐藏',
  visible: '已公开',
};

const STATUS_COLOR: Record<RatingStatus, string> = {
  unreplied: '#f59e0b',
  replied: '#059669',
  hidden: '#6b7280',
  visible: '#2563eb',
};

/** 评价状态流转：未回复 → 已回复 → 已公开 / 可隐藏 */
const STATUS_FLOW: RatingStatus[] = ['unreplied', 'replied', 'visible'];

function renderStars(score: number): string {
  return '★'.repeat(score) + '☆'.repeat(5 - score);
}

function formatCurrency(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

/* ── 信息行小组件 ── */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '8px 0', borderBottom: '1px solid #e5e7eb',
    }}>
      <span style={{ fontSize: 13, color: '#6b7280', minWidth: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ fontSize: 14, color: '#111827', textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

/* ── Tag 标签 ── */
function Tag({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 500,
      border: '1px solid #bfdbfe', marginRight: 4, marginBottom: 4,
    }}>
      {label}
    </span>
  );
}

/* ── 评分条 ── */
function ScoreRow({ label, score }: { label: string; score: number }) {
  const pct = (score / 5) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: '#6b7280', minWidth: 56, flexShrink: 0 }}>{label}</span>
      <div style={{
        flex: 1, height: 8, borderRadius: 4,
        background: '#e5e7eb', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          borderRadius: 4,
          background: score >= 4 ? '#059669' : score >= 3 ? '#f59e0b' : '#ef4444',
          transition: 'width 0.3s',
        }} />
      </div>
      <span style={{
        fontSize: 16, fontWeight: 700, minWidth: 24, textAlign: 'right',
        color: score >= 4 ? '#059669' : score >= 3 ? '#f59e0b' : '#ef4444',
      }}>
        {score}
      </span>
    </div>
  );
}

/* ── 页面 ── */
export default function StoreRatingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const item = MOCK_RATINGS[id];

  const [replying, setReplying] = useState(false);
  const [editingReply, setEditingReply] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<RatingStatus>(item ? item.status : 'unreplied');

  // 回复编辑态
  const [newReply, setNewReply] = useState(item?.replyContent ?? '');
  const [editReplyContent, setEditReplyContent] = useState(item?.replyContent ?? '');

  /** 状态推进：未回复→已回复 或 已回复→已公开 */
  const handleStatusForward = useCallback(() => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      const next = STATUS_FLOW[idx + 1]!;
      if (next === 'replied' && !newReply.trim()) {
        return; // 回复内容为空时不推进
      }
      if (next === 'replied') {
        setReplying(true);
        setNewReply(editReplyContent || '感谢您的评价，我们会继续努力改进！');
      }
      setCurrentStatus(next);
    }
  }, [currentStatus, newReply, editReplyContent]);

  /** 状态回退 */
  const handleStatusBack = useCallback(() => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx > 0) {
      setCurrentStatus(STATUS_FLOW[idx - 1]!);
    } else if (currentStatus === 'hidden') {
      setCurrentStatus('unreplied');
    }
  }, [currentStatus]);

  /** 隐藏评价 */
  const handleHide = useCallback(() => {
    setCurrentStatus('hidden');
  }, []);

  /** 恢复展示 */
  const handleShow = useCallback(() => {
    if (currentStatus === 'hidden') {
      setCurrentStatus(item?.replyContent ? 'visible' : 'unreplied');
    }
  }, [currentStatus, item]);

  /** 提交回复 */
  const handleSubmitReply = useCallback(() => {
    if (!newReply.trim()) return;
    setEditReplyContent(newReply);
    setReplying(false);
    if (currentStatus === 'unreplied') {
      setCurrentStatus('replied');
    }
  }, [newReply, currentStatus]);

  /** 进入编辑回复模式 */
  const handleEditReply = useCallback(() => {
    setEditingReply(true);
    setNewReply(editReplyContent);
  }, [editReplyContent]);

  /** 保存编辑的回复 */
  const handleSaveReply = useCallback(() => {
    if (!newReply.trim()) return;
    setEditReplyContent(newReply);
    setEditingReply(false);
  }, [newReply]);

  /** 删除评价 */
  const handleDelete = useCallback(() => {
    setDeleting(true);
    setTimeout(() => {
      router.push('/store-ratings');
    }, 500);
  }, [router]);

  /** 返回列表 */
  const handleBack = useCallback(() => {
    router.push('/store-ratings');
  }, [router]);

  /* ── 未找到 ── */
  if (!item) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>评价未找到</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          未找到 ID 为 <strong>{id}</strong> 的评价，可能已被删除。
        </p>
        <button
          onClick={handleBack}
          style={{
            padding: '8px 24px', borderRadius: 8, border: '1px solid #d1d5db',
            background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
          }}
          data-testid="rating-detail-back-list"
        >
          返回评价列表
        </button>
      </div>
    );
  }

  /* ── 正在删除 ── */
  if (deleting) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>删除完成</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          评价 <strong>#{item.id}</strong> 已成功删除，正在返回评价列表...
        </p>
      </div>
    );
  }

  const isRepliedOrVisible = currentStatus === 'replied' || currentStatus === 'visible';
  const canHide = currentStatus !== 'hidden' && isRepliedOrVisible;
  const canShow = currentStatus === 'hidden';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      {/* ← 返回按钮 */}
      <button
        onClick={handleBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
          background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
          marginBottom: 20,
        }}
        data-testid="rating-detail-back"
      >
        ← 返回评价列表
      </button>

      {/* 标题区 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 }}>
            ⭐ 评价详情
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280' }}>
            <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>#{item.id}</span>
            <span>·</span>
            <span>{item.storeName}</span>
            <span>·</span>
            <span style={{
              padding: '1px 8px', borderRadius: 4,
              background: `${STATUS_COLOR[currentStatus]}18`,
              color: STATUS_COLOR[currentStatus],
              fontWeight: 600, fontSize: 12,
            }} data-testid="rating-status-badge">
              {STATUS_LABEL[currentStatus]}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setShowConfirmDelete(true); }}
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid #dc2626',
              background: '#fef2f2', color: '#dc2626', fontWeight: 600,
              fontSize: 14, cursor: 'pointer',
            }}
            data-testid="rating-detail-delete"
          >
            🗑️ 删除评价
          </button>
        </div>
      </div>

      {/* 确认删除对话框 */}
      {showConfirmDelete && (
        <div style={{
          marginBottom: 24, padding: 20, borderRadius: 12,
          background: '#fef2f2', border: '1px solid #fecaca',
        }} data-testid="rating-detail-delete-confirm">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>
            确认删除此评价？
          </div>
          <p style={{ fontSize: 14, color: '#b91c1c', marginBottom: 16 }}>
            此操作不可撤销。{item.memberName} 的评价将被永久删除。
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#dc2626', color: '#fff', fontWeight: 600,
                fontSize: 14, cursor: 'pointer',
              }}
              data-testid="rating-detail-delete-confirm-btn"
            >
              确认删除
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              style={{
                padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db',
                background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
              }}
              data-testid="rating-detail-delete-cancel"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 状态流转操作栏 */}
      <div style={{
        marginBottom: 24, padding: 16, borderRadius: 12,
        background: '#f0f9ff', border: '1px solid #bae6fd',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }} data-testid="rating-detail-status-bar">
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0369a1' }}>
          评价状态管理:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleStatusBack}
            disabled={currentStatus === 'unreplied' || currentStatus === 'visible'}
            style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #93c5fd',
              background: '#dbeafe', color: '#1e40af', fontSize: 13,
              cursor: currentStatus === 'unreplied' || currentStatus === 'visible' ? 'not-allowed' : 'pointer',
              opacity: currentStatus === 'unreplied' || currentStatus === 'visible' ? 0.5 : 1,
            }}
            data-testid="rating-status-back"
          >
            ← 回退
          </button>
          <span style={{
            padding: '4px 12px', borderRadius: 6,
            background: STATUS_COLOR[currentStatus],
            color: '#fff', fontSize: 13, fontWeight: 600, minWidth: 60, textAlign: 'center',
          }} data-testid="rating-status-current">
            {STATUS_LABEL[currentStatus]}
          </span>
          <button
            onClick={handleStatusForward}
            disabled={currentStatus === 'visible' || currentStatus === 'hidden'}
            style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #93c5fd',
              background: '#dbeafe', color: '#1e40af', fontSize: 13,
              cursor: currentStatus === 'visible' || currentStatus === 'hidden' ? 'not-allowed' : 'pointer',
              opacity: currentStatus === 'visible' || currentStatus === 'hidden' ? 0.5 : 1,
            }}
            data-testid="rating-status-forward"
          >
            推进 →
          </button>
        </div>
        {canHide && (
          <button
            onClick={handleHide}
            style={{
              padding: '4px 14px', borderRadius: 6, border: '1px solid #9ca3af',
              background: '#f3f4f6', color: '#374151', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="rating-detail-hide"
          >
            隐藏评价
          </button>
        )}
        {canShow && (
          <button
            onClick={handleShow}
            style={{
              padding: '4px 14px', borderRadius: 6, border: '1px solid #059669',
              background: '#d1fae5', color: '#065f46', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="rating-detail-show"
          >
            恢复展示
          </button>
        )}
      </div>

      {/* 两列布局 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24,
      }}>
        {/* 左列: 评价内容 & 会员信息 */}
        <div style={{
          padding: 20, borderRadius: 12,
          background: '#fff', border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
            评价内容
          </h2>

          {/* 总体评分 */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              fontSize: 40, fontWeight: 700,
              color: item.overallScore >= 4 ? '#059669' : item.overallScore >= 3 ? '#f59e0b' : '#ef4444',
              marginBottom: 4,
            }} data-testid="rating-overall-score">
              {item.overallScore}
            </div>
            <div style={{ fontSize: 18, letterSpacing: 2, color: '#f59e0b' }}>
              {renderStars(item.overallScore)}
            </div>
          </div>

          <ScoreRow label="服务评分" score={item.serviceScore} />
          <ScoreRow label="环境评分" score={item.environmentScore} />
          <ScoreRow label="商品评分" score={item.productScore} />

          <div style={{
            marginTop: 16, padding: 12, borderRadius: 8,
            background: '#f9fafb', fontSize: 14, lineHeight: 1.6,
            color: '#374151',
          }} data-testid="rating-content">
            {item.content}
          </div>

          {/* 标签 */}
          {item.tags.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {item.tags.map((tag, i) => (
                <Tag key={i} label={tag} />
              ))}
            </div>
          )}

          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 20 }}>
            会员信息
          </h2>
          <InfoRow label="会员姓名" value={item.memberName} />
          <InfoRow label="手机号" value={item.memberPhone} />
          <InfoRow label="关联订单" value={<span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{item.orderNo}</span>} />
          <InfoRow label="评价时间" value={item.createdAt} />
        </div>

        {/* 右列: 回复管理 */}
        <div style={{
          padding: 20, borderRadius: 12,
          background: '#fff', border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
            回复管理
          </h2>

          {currentStatus === 'unreplied' && !replying && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                此评价尚未回复，请及时回复客户反馈。
              </p>
              <button
                onClick={() => {
                  setReplying(true);
                  setNewReply(editReplyContent || '感谢您的评价，我们会继续努力改进！');
                }}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: '1px solid #2563eb',
                  background: '#eff6ff', color: '#2563eb', fontWeight: 600,
                  fontSize: 14, cursor: 'pointer',
                }}
                data-testid="rating-detail-start-reply"
              >
                ✏️ 回复评价
              </button>
            </div>
          )}

          {(replying || editingReply) && (
            <div>
              <label style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                回复内容:
              </label>
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                rows={4}
                style={{
                  width: '100%', borderRadius: 8, border: '1px solid #d1d5db',
                  padding: 10, fontSize: 14, lineHeight: 1.5, resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                placeholder="请输入回复内容..."
                data-testid="rating-reply-textarea"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {replying && (
                  <button
                    onClick={handleSubmitReply}
                    disabled={!newReply.trim()}
                    style={{
                      padding: '8px 20px', borderRadius: 8, border: 'none',
                      background: newReply.trim() ? '#2563eb' : '#93c5fd',
                      color: '#fff', fontWeight: 600, fontSize: 14,
                      cursor: newReply.trim() ? 'pointer' : 'not-allowed',
                    }}
                    data-testid="rating-reply-submit"
                  >
                    💬 提交回复
                  </button>
                )}
                {editingReply && (
                  <button
                    onClick={handleSaveReply}
                    disabled={!newReply.trim()}
                    style={{
                      padding: '8px 20px', borderRadius: 8, border: 'none',
                      background: newReply.trim() ? '#059669' : '#6ee7b7',
                      color: '#fff', fontWeight: 600, fontSize: 14,
                      cursor: newReply.trim() ? 'pointer' : 'not-allowed',
                    }}
                    data-testid="rating-reply-save"
                  >
                    💾 保存回复
                  </button>
                )}
                <button
                  onClick={() => {
                    setReplying(false);
                    setEditingReply(false);
                    setNewReply(editReplyContent);
                  }}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db',
                    background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
                  }}
                  data-testid="rating-reply-cancel"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {isRepliedOrVisible && !replying && !editingReply && (
            <div>
              {/* 已存在的回复 */}
              <div style={{
                padding: 12, borderRadius: 8,
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 13, color: '#065f46', fontWeight: 600, marginBottom: 6 }}>
                  店铺回复:
                </div>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                  {editReplyContent}
                </p>
                {item.repliedAt && (
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                    回复时间: {item.repliedAt}
                  </div>
                )}
              </div>
              <button
                onClick={handleEditReply}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: '1px solid #d1d5db',
                  background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer',
                }}
                data-testid="rating-reply-edit"
              >
                ✏️ 编辑回复
              </button>
            </div>
          )}

          {currentStatus === 'hidden' && (
            <div style={{
              padding: 20, borderRadius: 8,
              background: '#f9fafb', border: '1px solid #e5e7eb',
              textAlign: 'center', marginTop: 12,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🙈</div>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                此评价已被隐藏，客户无法在前台查看。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
