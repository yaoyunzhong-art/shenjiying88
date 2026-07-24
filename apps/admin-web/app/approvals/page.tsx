'use client';

/**
 * 活动审批页 - Campaign Approval Management
 *
 * 审批类型: 采购审批/报销审批/活动审批/请假审批
 * 状态: 待审批/已通过/已驳回/已撤回
 * Tab筛选: 待审批/已处理/全部
 */
import { useCallback, useMemo, useState } from 'react';
import { AdminPermissionGate } from '../components/admin-permission-gate';

// ---- 类型定义 ----

type ApprovalType = 'purchase' | 'expense' | 'campaign' | 'leave';
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
type TabKey = 'pending' | 'done' | 'all';

interface ApprovalRecord {
  id: string;
  type: ApprovalType;
  applicant: string;
  store: string;
  amount: number;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  description: string;
  comment: string;
  approver: string;
}

interface ReviewComment {
  text: string;
  createdAt: string;
}

// ---- 常量映射 ----

const TYPE_LABEL: Record<ApprovalType, string> = {
  purchase: '采购审批',
  expense: '报销审批',
  campaign: '活动审批',
  leave: '请假审批',
};

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  withdrawn: '已撤回',
};

const STATUS_COLOR: Record<ApprovalStatus, string> = {
  pending: '#eab308',
  approved: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#94a3b8',
};

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

function getThisMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// ---- Mock API ----

const API_BASE = '/api/approvals';

/** URL-pattern response registry – maps URL patterns to handler functions */
const responseRegistry = new Map<string, (body?: unknown) => { ok: boolean; data: unknown; message: string }>();

responseRegistry.set('POST:/api/approvals/comment', (body) => {
  const { id, text } = (body ?? {}) as { id: string; text: string };
  if (!id || !text || typeof text !== 'string' || text.trim().length === 0) {
    return { ok: false, data: null, message: '评论内容不能为空' };
  }
  return { ok: true, data: { id, comment: text.trim(), createdAt: new Date().toISOString() }, message: '提交成功' };
});

responseRegistry.set('POST:/api/approvals/approve', (body) => {
  const { id } = (body ?? {}) as { id: string };
  if (!id) return { ok: false, data: null, message: '缺少审批单ID' };
  return { ok: true, data: { id, status: 'approved', approver: '当前管理员' }, message: '已批准' };
});

responseRegistry.set('POST:/api/approvals/reject', (body) => {
  const { id } = (body ?? {}) as { id: string };
  if (!id) return { ok: false, data: null, message: '缺少审批单ID' };
  return { ok: true, data: { id, status: 'rejected', approver: '当前管理员' }, message: '已驳回' };
});

function handleApiCall(url: string, options?: RequestInit): Promise<{ ok: boolean; data: unknown; message: string }> {
  const method = (options?.method ?? 'GET').toUpperCase();
  const key = `${method}:${url}`;

  const handler = responseRegistry.get(key);
  if (!handler) {
    return Promise.resolve({ ok: false, data: null, message: `未注册的API: ${key}` });
  }

  let body: unknown;
  if (options?.body && typeof options.body === 'string') {
    try { body = JSON.parse(options.body); } catch { body = options.body; }
  }

  return Promise.resolve(handler(body));
}

// ---- 样本数据 ----

const DEFAULT_APPROVALS: ApprovalRecord[] = [
  { id: 'APR-001', type: 'purchase', applicant: '李强', store: '北京朝阳店', amount: 35000, status: 'pending', createdAt: '2026-07-18T09:00:00', updatedAt: '2026-07-18T09:00:00', description: '采购2台高配收银终端(华为擎云)', comment: '', approver: '' },
  { id: 'APR-002', type: 'expense', applicant: '王晓芳', store: '上海浦东店', amount: 2800, status: 'pending', createdAt: '2026-07-17T14:30:00', updatedAt: '2026-07-17T14:30:00', description: '7月团队聚餐活动报销', comment: '', approver: '' },
  { id: 'APR-003', type: 'campaign', applicant: '陈杰', store: '广州天河店', amount: 12000, status: 'pending', createdAt: '2026-07-17T10:00:00', updatedAt: '2026-07-17T10:00:00', description: '暑期亲子嘉年华活动预算审批', comment: '', approver: '' },
  { id: 'APR-004', type: 'leave', applicant: '张婷', store: '深圳南山店', amount: 0, status: 'pending', createdAt: '2026-07-16T08:00:00', updatedAt: '2026-07-16T08:00:00', description: '年假5天(7/20-7/24)', comment: '', approver: '' },
  { id: 'APR-005', type: 'purchase', applicant: '赵磊', store: '成都锦江店', amount: 8600, status: 'approved', createdAt: '2026-07-15T11:00:00', updatedAt: '2026-07-16T09:00:00', description: '门店装饰物料采购(七夕活动)', comment: '预算合理，同意采购', approver: '张经理' },
  { id: 'APR-006', type: 'expense', applicant: '刘敏', store: '杭州西湖店', amount: 1500, status: 'rejected', createdAt: '2026-07-14T16:00:00', updatedAt: '2026-07-15T10:00:00', description: '个人交通费用报销（缺票据）', comment: '缺少正式发票，请补充后重新提交', approver: '李主管' },
  { id: 'APR-007', type: 'campaign', applicant: '吴迪', store: '武汉光谷店', amount: 20000, status: 'approved', createdAt: '2026-07-13T09:30:00', updatedAt: '2026-07-14T14:00:00', description: '国庆前置预热营销活动', comment: '方案完整，注意预算控制', approver: '张经理' },
  { id: 'APR-008', type: 'leave', applicant: '孙悦', store: '南京新街口店', amount: 0, status: 'withdrawn', createdAt: '2026-07-12T07:00:00', updatedAt: '2026-07-13T11:00:00', description: '事假半天(7/15下午)', comment: '申请人已自行撤回', approver: '' },
];

// ===== 组件 =====

export default function ApprovalsPage() {
  const [tabKey, setTabKey] = useState<TabKey>('pending');
  const [approvals, setApprovals] = useState<ApprovalRecord[]>(DEFAULT_APPROVALS);
  const [reviewOpen, setReviewOpen] = useState<Record<string, boolean>>({});
  const [reviewTexts, setReviewTexts] = useState<Record<string, string>>({});
  const [reviewSubmitting, setReviewSubmitting] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ---- 派生数据 ----

  const filtered = useMemo(() => {
    if (tabKey === 'pending') return approvals.filter((a) => a.status === 'pending');
    if (tabKey === 'done') return approvals.filter((a) => a.status !== 'pending');
    return approvals;
  }, [approvals, tabKey]);

  const stats = useMemo(() => {
    const pending = approvals.filter((a) => a.status === 'pending');
    const thisMonth = approvals.filter((a) => isThisMonth(a.createdAt));
    const resolved = approvals.filter((a) => a.status !== 'pending');
    const approved = approvals.filter((a) => a.status === 'approved');

    return {
      pendingCount: pending.length,
      monthTotal: thisMonth.reduce((s, a) => s + a.amount, 0),
      passRate: resolved.length > 0 ? Math.round((approved.length / resolved.length) * 100) : 0,
    };
  }, [approvals]);

  // ---- 事件处理 ----

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300));
    setApprovals([...DEFAULT_APPROVALS]);
    setReviewOpen({});
    setReviewTexts({});
    setIsRefreshing(false);
  }, []);

  const toggleReview = useCallback((id: string) => {
    setReviewOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setReviewText = useCallback((id: string, text: string) => {
    setReviewTexts((prev) => ({ ...prev, [id]: text }));
  }, []);

  const submitReview = useCallback(async (id: string) => {
    const text = reviewTexts[id] ?? '';
    if (!text.trim()) return;

    setReviewSubmitting((prev) => ({ ...prev, [id]: true }));

    const result = await handleApiCall(`${API_BASE}/comment`, {
      method: 'POST',
      body: JSON.stringify({ id, text }),
    });

    if (result.ok) {
      // Update the record with the comment
      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, comment: text.trim() } : a))
      );
      setReviewTexts((prev) => ({ ...prev, [id]: '' }));
      setReviewOpen((prev) => ({ ...prev, [id]: false }));
    }

    setReviewSubmitting((prev) => ({ ...prev, [id]: false }));
  }, [reviewTexts]);

  const handleApprove = useCallback(async (id: string) => {
    const result = await handleApiCall(`${API_BASE}/approve`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
    if (result.ok) {
      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'approved', approver: '当前管理员' } : a))
      );
    }
  }, []);

  const handleReject = useCallback(async (id: string) => {
    const result = await handleApiCall(`${API_BASE}/reject`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
    if (result.ok) {
      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'rejected', approver: '当前管理员' } : a))
      );
    }
  }, []);

  // ---- 空态 ----

  const isEmpty = filtered.length === 0;
  const tabLabel: Record<TabKey, string> = {
    pending: '待审批',
    done: '已处理',
    all: '全部',
  };

  return (
    <AdminPermissionGate
      requiredPermission="foundation.governance.read"
      title="治理审批中心访问受限"
      description="治理审批中心已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看审批待办、统计摘要与审批动作。"
    >
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>📋 活动审批</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 14 }}>
            管理所有类型的审批请求，快速处理待办事项
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            borderRadius: 10,
            padding: '10px 20px',
            background: 'rgba(59,130,246,0.16)',
            border: '1px solid rgba(96,165,250,0.3)',
            color: '#dbeafe',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            fontSize: 14,
            opacity: isRefreshing ? 0.6 : 1,
          }}
        >
          {isRefreshing ? '⟳ 刷新中...' : '⟳ 刷新'}
        </button>
      </div>

      {/* 概览统计 */}
      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(3, 1fr)',
          marginBottom: 24,
        }}
      >
        <StatBox label="待审批数" value={String(stats.pendingCount)} color="#eab308" />
        <StatBox label="本月总金额" value={formatAmount(stats.monthTotal)} color="#22c55e" />
        <StatBox label="通过率" value={`${stats.passRate}%`} color="#3b82f6" />
      </div>

      {/* Tab 筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['pending', 'done', 'all'] as const).map((key) => {
          const count =
            key === 'pending'
              ? approvals.filter((a) => a.status === 'pending').length
              : key === 'done'
                ? approvals.filter((a) => a.status !== 'pending').length
                : approvals.length;
          const isActive = tabKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTabKey(key)}
              style={{
                borderRadius: 999,
                padding: '8px 18px',
                fontSize: 14,
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                border: isActive ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(148,163,184,0.2)',
                background: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(15,23,42,0.3)',
                color: isActive ? '#dbeafe' : '#94a3b8',
              }}
            >
              {tabLabel[key]} ({count})
            </button>
          );
        })}
      </div>

      {/* 审批列表 */}
      {isEmpty ? (
        <EmptyState tabKey={tabKey} tabLabel={tabLabel[tabKey]} />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((item) => (
            <ApprovalCard
              key={item.id}
              item={item}
              reviewOpen={reviewOpen[item.id] ?? false}
              reviewText={reviewTexts[item.id] ?? ''}
              reviewSubmitting={reviewSubmitting[item.id] ?? false}
              onToggleReview={() => toggleReview(item.id)}
              onReviewTextChange={(t) => setReviewText(item.id, t)}
              onSubmitReview={() => submitReview(item.id)}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
            />
          ))}
        </div>
      )}
      </main>
    </AdminPermissionGate>
  );
}

// ---- 子组件 ----

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 20,
        background: 'rgba(15,23,42,0.38)',
        border: '1px solid rgba(148,163,184,0.18)',
      }}
    >
      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function EmptyState({ tabKey, tabLabel }: { tabKey: TabKey; tabLabel: string }) {
  const emptyTips: Record<TabKey, string> = {
    pending: '暂无待处理的审批请求，所有事项均已处理完成 🎉',
    done: '暂无已处理的审批记录',
    all: '目前还没有任何审批记录',
  };

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        borderRadius: 18,
        background: 'rgba(15,23,42,0.25)',
        border: '1px dashed rgba(148,163,184,0.2)',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
        {tabLabel}列表为空
      </div>
      <div style={{ fontSize: 14, color: '#94a3b8' }}>{emptyTips[tabKey]}</div>
    </div>
  );
}

function ApprovalCard({
  item,
  reviewOpen,
  reviewText,
  reviewSubmitting,
  onToggleReview,
  onReviewTextChange,
  onSubmitReview,
  onApprove,
  onReject,
}: {
  item: ApprovalRecord;
  reviewOpen: boolean;
  reviewText: string;
  reviewSubmitting: boolean;
  onToggleReview: () => void;
  onReviewTextChange: (text: string) => void;
  onSubmitReview: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending = item.status === 'pending';
  const borderColor = isPending ? 'rgba(234,179,8,0.2)' : 'rgba(148,163,184,0.1)';

  return (
    <div
      style={{
        borderRadius: 14,
        padding: 18,
        background: 'rgba(15,23,42,0.35)',
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* 第一行：标题 + 状态 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{item.description}</span>
          <span style={{ fontSize: 12, color: '#94a3b8', background: 'rgba(71,85,105,0.4)', borderRadius: 4, padding: '2px 8px' }}>
            {item.id}
          </span>
        </div>
        <span
          style={{
            borderRadius: 999,
            padding: '3px 12px',
            fontSize: 12,
            fontWeight: 700,
            color: STATUS_COLOR[item.status],
            background: `${STATUS_COLOR[item.status]}18`,
          }}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      {/* 第二行：详情网格 */}
      <div
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns: 'repeat(4, 1fr)',
          marginBottom: 10,
          fontSize: 13,
        }}
      >
        <DetailField label="类型" value={TYPE_LABEL[item.type]} />
        <DetailField label="申请人" value={item.applicant} />
        <DetailField label="门店" value={item.store} />
        <DetailField label="金额" value={item.amount > 0 ? formatAmount(item.amount) : '—'} />
        <DetailField label="提交时间" value={formatDate(item.createdAt)} />
        <DetailField label="更新时间" value={formatDate(item.updatedAt)} />
        <DetailField label="审批人" value={item.approver || '待指派'} />
        <DetailField label="审批意见" value={item.comment || '—'} />
      </div>

      {/* 审批意见 */}
      {item.comment && (
        <div
          style={{
            marginBottom: 10,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            color: '#86efac',
            background: 'rgba(34,197,94,0.08)',
          }}
        >
          💬 {item.comment}
        </div>
      )}

      {/* 待审批操作区 */}
      {isPending && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" onClick={onApprove} style={actionBtnStyle('#22c55e', '#86efac')}>
            ✅ 批准
          </button>
          <button type="button" onClick={onReject} style={actionBtnStyle('#ef4444', '#fca5a5')}>
            ❌ 驳回
          </button>
        </div>
      )}

      {/* 审批意见区 - 可展开 */}
      <div>
        <button
          type="button"
          onClick={onToggleReview}
          style={{
            background: 'none',
            border: 'none',
            color: '#93c5fd',
            cursor: 'pointer',
            fontSize: 13,
            padding: '4px 0',
          }}
        >
          {reviewOpen ? '收起审批意见 ▲' : '📝 审批意见 ▼'}
        </button>

        {reviewOpen && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 10,
              background: 'rgba(15,23,42,0.45)',
              border: '1px solid rgba(148,163,184,0.15)',
            }}
          >
            <textarea
              value={reviewText}
              onChange={(e) => onReviewTextChange(e.target.value)}
              placeholder="请输入审批意见..."
              rows={3}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: 8,
                padding: 10,
                fontSize: 13,
                background: 'rgba(30,41,59,0.6)',
                border: '1px solid rgba(148,163,184,0.25)',
                color: '#e2e8f0',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={onSubmitReview}
              disabled={reviewSubmitting || !reviewText.trim()}
              style={{
                marginTop: 8,
                borderRadius: 8,
                padding: '8px 16px',
                background: reviewSubmitting || !reviewText.trim()
                  ? 'rgba(59,130,246,0.08)'
                  : 'rgba(59,130,246,0.2)',
                border: '1px solid rgba(96,165,250,0.3)',
                color: reviewSubmitting || !reviewText.trim() ? '#64748b' : '#dbeafe',
                cursor: reviewSubmitting || !reviewText.trim() ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              {reviewSubmitting ? '提交中...' : '提交意见'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: '#64748b', marginRight: 6 }}>{label}:</span>
      <span style={{ color: '#cbd5e1' }}>{value}</span>
    </div>
  );
}

function actionBtnStyle(bg: string, color: string): React.CSSProperties {
  return {
    borderRadius: 8,
    padding: '8px 16px',
    background: `${bg}22`,
    color,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  };
}
