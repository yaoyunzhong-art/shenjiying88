'use client';

/**
 * 合同管理页 - Contract Management
 *
 * 合同类型: 销售合同/采购合同/服务合同/租赁合同
 * 状态: 待签/执行中/已到期/已完成
 * Tab筛选: 全部/待签/执行中/已到期
 */
import { useCallback, useMemo, useState } from 'react';

// ---- 类型定义 ----

type ContractType = 'sales' | 'procurement' | 'service' | 'lease';
type ContractStatus = 'pending_sign' | 'in_progress' | 'expired' | 'completed';
type TabKey = 'all' | 'pending_sign' | 'in_progress' | 'expired';

interface ContractRecord {
  id: string;
  type: ContractType;
  title: string;
  partyA: string;
  partyB: string;
  amount: number;
  status: ContractStatus;
  signedAt: string;
  expiresAt: string;
  updatedAt: string;
  description: string;
  comment: string;
}

// ---- 常量映射 ----

const TYPE_LABEL: Record<ContractType, string> = {
  sales: '销售合同',
  procurement: '采购合同',
  service: '服务合同',
  lease: '租赁合同',
};

const STATUS_LABEL: Record<ContractStatus, string> = {
  pending_sign: '待签',
  in_progress: '执行中',
  expired: '已到期',
  completed: '已完成',
};

const STATUS_COLOR: Record<ContractStatus, string> = {
  pending_sign: '#eab308',
  in_progress: '#22c55e',
  expired: '#ef4444',
  completed: '#94a3b8',
};

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isExpiredSoon(expiresAt: string, withinDays = 30): boolean {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= withinDays * 24 * 60 * 60 * 1000;
}

// ---- Mock API ----

const API_BASE = '/api/contracts';

/** URL-pattern response registry – maps URL patterns to handler functions */
const responseRegistry = new Map<string, (body?: unknown) => { ok: boolean; data: unknown; message: string }>();

responseRegistry.set('POST:/api/contracts/sign', (body) => {
  const { id } = (body ?? {}) as { id: string };
  if (!id) return { ok: false, data: null, message: '缺少合同ID' };
  return { ok: true, data: { id, status: 'in_progress' }, message: '签署成功' };
});

responseRegistry.set('POST:/api/contracts/comment', (body) => {
  const { id, text } = (body ?? {}) as { id: string; text: string };
  if (!id || !text || typeof text !== 'string' || text.trim().length === 0) {
    return { ok: false, data: null, message: '备注内容不能为空' };
  }
  return { ok: true, data: { id, comment: text.trim(), createdAt: new Date().toISOString() }, message: '提交成功' };
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

const DEFAULT_CONTRACTS: ContractRecord[] = [
  { id: 'CT-001', type: 'sales', title: '北京朝阳店设备销售合同', partyA: '我方', partyB: '北京朝阳科技有限公司', amount: 350000, status: 'pending_sign', signedAt: '', expiresAt: '2026-10-18', updatedAt: '2026-07-18T09:00:00', description: '销售2条全自动生产线及相关配件', comment: '' },
  { id: 'CT-002', type: 'procurement', title: '上海浦东原材料采购合同', partyA: '上海浦东原材料供应商', partyB: '我方', amount: 128000, status: 'in_progress', signedAt: '2026-06-15', expiresAt: '2026-12-31', updatedAt: '2026-07-17T14:30:00', description: '年度原材料框架采购协议', comment: '' },
  { id: 'CT-003', type: 'service', title: '广州天河IT运维服务合同', partyA: '广州天河信息技术公司', partyB: '我方', amount: 96000, status: 'in_progress', signedAt: '2026-05-01', expiresAt: '2027-04-30', updatedAt: '2026-07-17T10:00:00', description: '全年IT系统运维及技术支持服务', comment: '' },
  { id: 'CT-004', type: 'lease', title: '深圳南山办公场地租赁合同', partyA: '我方', partyB: '深圳南山产业园管理有限公司', amount: 240000, status: 'in_progress', signedAt: '2026-04-01', expiresAt: '2027-03-31', updatedAt: '2026-07-16T08:00:00', description: '深圳南山研发中心办公场地续租', comment: '' },
  { id: 'CT-005', type: 'sales', title: '成都锦江门店装修合同', partyA: '成都锦江装饰公司', partyB: '我方', amount: 86000, status: 'completed', signedAt: '2026-03-10', expiresAt: '2026-06-30', updatedAt: '2026-07-02T11:00:00', description: '新门店装修工程合同', comment: '已按合同约定完成验收结算' },
  { id: 'CT-006', type: 'procurement', title: '杭州西湖办公设备采购合同', partyA: '我方', partyB: '杭州办公设备供应商', amount: 45000, status: 'expired', signedAt: '2025-07-01', expiresAt: '2026-06-30', updatedAt: '2026-07-01T16:00:00', description: '年度办公设备集中采购合同', comment: '合同已到期，正在协商续签' },
  { id: 'CT-007', type: 'service', title: '武汉光谷物流配送服务合同', partyA: '武汉光谷物流公司', partyB: '我方', amount: 180000, status: 'pending_sign', signedAt: '', expiresAt: '2027-01-15', updatedAt: '2026-07-13T09:30:00', description: '区域物流配送服务年度合同', comment: '' },
  { id: 'CT-008', type: 'lease', title: '南京新街口设备租赁合同', partyA: '我方', partyB: '南京设备租赁有限公司', amount: 60000, status: 'expired', signedAt: '2025-08-01', expiresAt: '2026-07-15', updatedAt: '2026-07-15T07:00:00', description: '施工设备租赁合同（已到期）', comment: '设备已归还，待办结算' },
];

// ===== 组件 =====

export default function ContractsPage() {
  const [tabKey, setTabKey] = useState<TabKey>('all');
  const [contracts, setContracts] = useState<ContractRecord[]>(DEFAULT_CONTRACTS);
  const [reviewOpen, setReviewOpen] = useState<Record<string, boolean>>({});
  const [reviewTexts, setReviewTexts] = useState<Record<string, string>>({});
  const [reviewSubmitting, setReviewSubmitting] = useState<Record<string, boolean>>({});
  const [signingId, setSigningId] = useState<string | null>(null);

  // ---- 派生数据 ----

  const filtered = useMemo(() => {
    if (tabKey === 'all') return contracts;
    return contracts.filter((c) => c.status === tabKey);
  }, [contracts, tabKey]);

  const stats = useMemo(() => {
    const total = contracts.length;
    const pendingSign = contracts.filter((c) => c.status === 'pending_sign').length;
    const inProgress = contracts.filter((c) => c.status === 'in_progress').length;
    const expired = contracts.filter((c) => c.status === 'expired').length;
    const totalAmount = contracts.reduce((s, c) => s + c.amount, 0);

    return { total, pendingSign, inProgress, expired, totalAmount, avgAmount: total > 0 ? Math.round(totalAmount / total) : 0 };
  }, [contracts]);

  // ---- 事件处理 ----

  const handleSign = useCallback(async (id: string) => {
    setSigningId(id);
    const result = await handleApiCall(`${API_BASE}/sign`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
    if (result.ok) {
      setContracts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'in_progress', signedAt: new Date().toISOString().slice(0, 10) } : c))
      );
    }
    setSigningId(null);
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
      setContracts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, comment: text.trim() } : c))
      );
      setReviewTexts((prev) => ({ ...prev, [id]: '' }));
      setReviewOpen((prev) => ({ ...prev, [id]: false }));
    }

    setReviewSubmitting((prev) => ({ ...prev, [id]: false }));
  }, [reviewTexts]);

  // ---- 空态 ----

  const isEmpty = filtered.length === 0;
  const tabLabel: Record<TabKey, string> = {
    all: '全部',
    pending_sign: '待签',
    in_progress: '执行中',
    expired: '已到期',
  };

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>📑 合同管理</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 14 }}>
            管理所有合同，追踪合同状态和到期情况
          </p>
        </div>
      </div>

      {/* 合同总览统计条: 总合同/待签/执行中/已到期 */}
      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(4, 1fr)',
          marginBottom: 24,
        }}
      >
        <StatBox label="总合同数" value={String(stats.total)} color="#3b82f6" />
        <StatBox label="待签" value={String(stats.pendingSign)} color="#eab308" />
        <StatBox label="执行中" value={String(stats.inProgress)} color="#22c55e" />
        <StatBox label="已到期" value={String(stats.expired)} color="#ef4444" />
      </div>

      {/* Tab 筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'pending_sign', 'in_progress', 'expired'] as const).map((key) => {
          const count =
            key === 'all'
              ? contracts.length
              : contracts.filter((c) => c.status === key).length;
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

      {/* 合同列表 */}
      {isEmpty ? (
        <EmptyState tabKey={tabKey} tabLabel={tabLabel[tabKey]} />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((item) => (
            <ContractCard
              key={item.id}
              item={item}
              reviewOpen={reviewOpen[item.id] ?? false}
              reviewText={reviewTexts[item.id] ?? ''}
              reviewSubmitting={reviewSubmitting[item.id] ?? false}
              isSigning={signingId === item.id}
              onToggleReview={() => toggleReview(item.id)}
              onReviewTextChange={(t) => setReviewText(item.id, t)}
              onSubmitReview={() => submitReview(item.id)}
              onSign={() => handleSign(item.id)}
            />
          ))}
        </div>
      )}
    </main>
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
  const emptyTips: Record<string, string> = {
    all: '目前还没有任何合同记录',
    pending_sign: '暂无待签合同',
    in_progress: '暂无执行中的合同',
    expired: '暂无已到期的合同',
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

function ContractCard({
  item,
  reviewOpen,
  reviewText,
  reviewSubmitting,
  isSigning,
  onToggleReview,
  onReviewTextChange,
  onSubmitReview,
  onSign,
}: {
  item: ContractRecord;
  reviewOpen: boolean;
  reviewText: string;
  reviewSubmitting: boolean;
  isSigning: boolean;
  onToggleReview: () => void;
  onReviewTextChange: (text: string) => void;
  onSubmitReview: () => void;
  onSign: () => void;
}) {
  const isPending = item.status === 'pending_sign';
  const borderColor = isPending ? 'rgba(234,179,8,0.2)' : 'rgba(148,163,184,0.1)';
  const nearExpiry = item.status === 'in_progress' && isExpiredSoon(item.expiresAt, 30);

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
          <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{item.title}</span>
          <span style={{ fontSize: 12, color: '#94a3b8', background: 'rgba(71,85,105,0.4)', borderRadius: 4, padding: '2px 8px' }}>
            {item.id}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {nearExpiry && (
            <span
              style={{
                borderRadius: 999,
                padding: '3px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: '#f97316',
                background: '#f9731618',
              }}
            >
              即将到期
            </span>
          )}
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
        <DetailField label="甲方" value={item.partyA} />
        <DetailField label="乙方" value={item.partyB} />
        <DetailField label="金额" value={formatAmount(item.amount)} />
        <DetailField label="签署日期" value={item.signedAt || '—'} />
        <DetailField label="到期日期" value={formatDate(item.expiresAt)} />
        <DetailField label="描述" value={item.description} />
      </div>

      {/* 备注 */}
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

      {/* 待签操作区 */}
      {isPending && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            onClick={onSign}
            disabled={isSigning}
            style={{
              borderRadius: 8,
              padding: '8px 16px',
              background: isSigning ? 'rgba(34,197,94,0.08)' : '#22c55e22',
              color: isSigning ? '#64748b' : '#86efac',
              border: 'none',
              cursor: isSigning ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {isSigning ? '签署中...' : '✍️ 签署'}
          </button>
        </div>
      )}

      {/* 备注区 - 可展开 */}
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
          {reviewOpen ? '收起备注 ▲' : '📝 添加备注 ▼'}
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
              placeholder="请输入备注内容..."
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
              {reviewSubmitting ? '提交中...' : '提交备注'}
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
