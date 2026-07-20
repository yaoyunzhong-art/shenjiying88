/**
 * 前台交接班面板 — Shift Handover Page (Next.js App Router Page)
 * 角色视角: 🛒前台 / 👔收银
 * 类型: D-角色操作界面
 * 功能: 交接班清单管理、现金清点、待办转交、状态确认、分类筛选
 */
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  PageShell,
  StatusBadge,
  type ShiftSummary,
  type ShiftHandoverEntry,
} from '@m5/ui';

// ============================================================
// Mock 数据
// ============================================================

const MOCK_ITEMS: ShiftHandoverEntry[] = [
  {
    id: 'sh-1',
    category: 'cash',
    title: '早班现金清点',
    description: '收银台现金总额 ¥12,580.00，已与系统对账一致',
    status: 'pending',
    createdBy: '张明 (早班)',
    createdAt: '2026-06-29 08:00',
    handoverTo: '李华 (晚班)',
  },
  {
    id: 'sh-2',
    category: 'order',
    title: '未完成订单处理',
    description: '订单 ORD-2398 已支付但未取货，需晚班跟进',
    status: 'pending',
    createdBy: '张明 (早班)',
    createdAt: '2026-06-29 10:30',
    handoverTo: '李华 (晚班)',
  },
  {
    id: 'sh-3',
    category: 'member',
    title: 'VIP客户预约接待',
    description: '钻石会员周小姐预约今日15:00到店取货',
    status: 'pending',
    createdBy: '张明 (早班)',
    createdAt: '2026-06-29 09:15',
    handoverTo: '李华 (晚班)',
  },
  {
    id: 'sh-4',
    category: 'device',
    title: 'POS-03 扫码枪故障',
    description: '3号收银台扫码枪间歇性无法识别条码，已报修',
    status: 'escalated',
    createdBy: '张明 (早班)',
    createdAt: '2026-06-29 11:00',
  },
  {
    id: 'sh-5',
    category: 'inventory',
    title: '热销商品补货提醒',
    description: 'SKU-089 咖啡豆库存仅剩 3 件，需联系采购补货',
    status: 'resolved',
    createdBy: '张明 (早班)',
    createdAt: '2026-06-29 07:45',
    handoverTo: '李华 (晚班)',
    resolvedAt: '2026-06-29 11:30',
    notes: '已通知采购部，预计明日到货',
  },
  {
    id: 'sh-6',
    category: 'other',
    title: '早班考勤异常',
    description: '前台王丽迟到 15 分钟，已记录考勤',
    status: 'resolved',
    createdBy: '张明 (早班)',
    createdAt: '2026-06-29 08:15',
    resolvedAt: '2026-06-29 09:00',
    notes: '已与王丽确认，因交通延误',
  },
];

const MOCK_SUMMARY: ShiftSummary = {
  totalItems: MOCK_ITEMS.length,
  pendingCount: MOCK_ITEMS.filter(i => i.status === 'pending').length,
  resolvedCount: MOCK_ITEMS.filter(i => i.status === 'resolved').length,
  escalatedCount: MOCK_ITEMS.filter(i => i.status === 'escalated').length,
  cashTotal: 12580,
  orderTotal: 56800,
  shiftStart: '2026-06-29 07:00',
  shiftEnd: '2026-06-29 15:00',
  currentStaff: '张明 (早班)',
  incomingStaff: '李华 (晚班)',
};

// ============================================================
// 枚举与工具
// ============================================================

const CATEGORY_LABEL: Record<string, string> = {
  cash: '💰 现金',
  order: '📦 订单',
  member: '👤 会员',
  inventory: '📋 库存',
  device: '🔧 设备',
  other: '📌 其他',
};

const CATEGORY_COLOR: Record<string, string> = {
  cash: '#059669',
  order: '#2563eb',
  member: '#7c3aed',
  inventory: '#d97706',
  device: '#dc2626',
  other: '#6b7280',
};

const STATUS_LABEL: Record<string, string> = {
  pending: '待处理',
  resolved: '已完成',
  escalated: '已升级',
  cancelled: '已取消',
};

const STATUS_VARIANT: Record<string, string> = {
  pending: 'warning',
  resolved: 'success',
  escalated: 'danger',
  cancelled: 'neutral',
};

// ============================================================
// 统计卡片
// ============================================================

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 120,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ============================================================
// 主线型接办卡片
// ============================================================

function HandoverItemCard({
  item,
  onResolve,
  onEscalate,
  onEditNotes,
}: {
  item: ShiftHandoverEntry;
  onResolve: (id: string) => void;
  onEscalate: (id: string) => void;
  onEditNotes: (id: string, notes: string) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(item.notes || '');

  const handleSaveNotes = useCallback(() => {
    onEditNotes(item.id, notesDraft);
    setEditingNotes(false);
  }, [item.id, notesDraft, onEditNotes]);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: `1px solid ${item.status === 'escalated' ? '#fca5a5' : '#e5e7eb'}`,
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: CATEGORY_COLOR[item.category] || '#6b7280', fontWeight: 600 }}>
            {CATEGORY_LABEL[item.category] || item.category}
          </span>
          <StatusBadge
            variant={STATUS_VARIANT[item.status] as 'warning' | 'success' | 'danger'}
            label={STATUS_LABEL[item.status] ?? item.status}
          />
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          {item.createdAt}
        </div>
      </div>
      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>{item.title}</h4>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
        {item.description}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          <span>创建人: {item.createdBy}</span>
          {item.handoverTo && <span style={{ marginLeft: 12 }}>交接给: {item.handoverTo}</span>}
          {item.resolvedAt && <span style={{ marginLeft: 12 }}>完成于: {item.resolvedAt}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {item.status === 'pending' && (
            <>
              <button
                onClick={() => onResolve(item.id)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#059669',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                完成
              </button>
              <button
                onClick={() => onEscalate(item.id)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#dc2626',
                }}
              >
                升级
              </button>
            </>
          )}
          <button
            onClick={() => setEditingNotes(!editingNotes)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            📝 备注
          </button>
        </div>
      </div>
      {item.notes && !editingNotes && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#166534' }}>
          📌 {item.notes}
        </div>
      )}
      {editingNotes && (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="添加备注…"
            rows={2}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              fontSize: 12,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button
              onClick={handleSaveNotes}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              保存
            </button>
            <button
              onClick={() => setEditingNotes(false)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 前台交接班页面
// ============================================================

import { useTriState } from '../_components/useTriState';
import { TriStateRenderer } from '../_components/TriStateRenderer';

export default function ShiftHandoverPage() {
  const [items, setItems] = useState<ShiftHandoverEntry[]>([]);
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const handleResolve = useCallback((id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: 'resolved' as const, resolvedAt: new Date().toLocaleString('zh-CN') }
          : item
      )
    );
  }, []);

  const handleEscalate = useCallback((id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'escalated' as const } : item
      )
    );
  }, []);

  const handleStartHandover = useCallback(() => {
    if (typeof window !== 'undefined') {
      alert('✅ 交接班已发起，等待晚班确认…');
    }
  }, []);

  const handleEditNotes = useCallback((id: string, notes: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, notes } : item))
    );
  }, []);

  /** 筛选与排序 */
  const filteredItems = useMemo(() => {
    let result = [...items];
    if (categoryFilter !== 'ALL') {
      result = result.filter(i => i.category === categoryFilter);
    }
    if (statusFilter !== 'ALL') {
      result = result.filter(i => i.status === statusFilter);
    }
    result.sort((a, b) => {
      const da = a.createdAt;
      const db = b.createdAt;
      return sortOrder === 'newest' ? db.localeCompare(da) : da.localeCompare(db);
    });
    return result;
  }, [items, categoryFilter, statusFilter, sortOrder]);

  /** 实时 summary */
  const summary: ShiftSummary = useMemo(() => ({
    ...MOCK_SUMMARY,
    totalItems: items.length,
    pendingCount: items.filter(i => i.status === 'pending').length,
    resolvedCount: items.filter(i => i.status === 'resolved').length,
    escalatedCount: items.filter(i => i.status === 'escalated').length,
  }), [items]);

  /** 分类统计 */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  // 模拟加载数据
  useEffect(() => {
    wrapLoad(
      new Promise<ShiftHandoverEntry[]>((resolve) => {
        setTimeout(() => resolve(MOCK_ITEMS), 300);
      }),
    ).then((data) => {
      if (data) setItems(data);
    });
  }, []);

  return (
    <PageShell title="前台交接班" description="交接班清单管理 & 状态确认">
      <TriStateRenderer
        loading={loading}
        empty={items.length === 0 && !loading}
        error={error}
        onRetry={() =>
          wrapLoad(
            new Promise<ShiftHandoverEntry[]>((resolve) => {
              setTimeout(() => resolve(MOCK_ITEMS), 300);
            }),
          ).then((data) => {
            if (data) setItems(data);
          })
        }
      >
      <div style={{ padding: 24 }}>
        {/* 头部信息 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>📋 前台交接班</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              {MOCK_SUMMARY.currentStaff} → {MOCK_SUMMARY.incomingStaff} · 班次 {MOCK_SUMMARY.shiftStart} ~ {MOCK_SUMMARY.shiftEnd}
            </p>
          </div>
          <button
            onClick={handleStartHandover}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🚀 发起交接
          </button>
        </div>

        {/* 统计卡片 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatCard label="全部事项" value={summary.totalItems} icon="📋" color="#6b7280" />
          <StatCard label="待处理" value={summary.pendingCount} icon="⏳" color="#d97706" />
          <StatCard label="已完成" value={summary.resolvedCount} icon="✅" color="#059669" />
          <StatCard label="已升级" value={summary.escalatedCount} icon="🔴" color="#dc2626" />
          <StatCard label="现金总额" value={summary.cashTotal} icon="💰" color="#2563eb" />
          <StatCard label="订单总额" value={summary.orderTotal} icon="📦" color="#7c3aed" />
        </div>

        {/* 筛选工具栏 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 20,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                minWidth: 120,
              }}
            >
              <option value="ALL">全部分类</option>
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label} ({categoryCounts[key] || 0})
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                minWidth: 110,
              }}
            >
              <option value="ALL">全部状态</option>
              <option value="pending">待处理 ({summary.pendingCount})</option>
              <option value="resolved">已完成 ({summary.resolvedCount})</option>
              <option value="escalated">已升级 ({summary.escalatedCount})</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              style={{
                padding: '8px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                minWidth: 100,
              }}
            >
              <option value="newest">最新优先</option>
              <option value="oldest">最早优先</option>
            </select>
          </div>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>
            筛选后 {filteredItems.length}/{items.length} 项
          </span>
        </div>

        {/* 交接项列表 */}
        {filteredItems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 48,
              borderRadius: 12,
              border: '1px dashed #d1d5db',
              background: '#f9fafb',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>暂无匹配的交接事项</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              请调整筛选条件查看所有事项
            </div>
          </div>
        ) : (
          <div>
            {filteredItems.map(item => (
              <HandoverItemCard
                key={item.id}
                item={item}
                onResolve={handleResolve}
                onEscalate={handleEscalate}
                onEditNotes={handleEditNotes}
              />
            ))}
          </div>
        )}

        {/* 完成情况汇总 */}
        <div
          style={{
            marginTop: 20,
            padding: '14px 20px',
            background: '#f9fafb',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          <span>📊 完成率: {summary.totalItems > 0 ? Math.round((summary.resolvedCount / summary.totalItems) * 100) : 0}%</span>
          <span>📌 待处理: {summary.pendingCount} 项</span>
          <span>🔴 需升级: {summary.escalatedCount} 项</span>
          <span>💵 现金总额: ¥{(summary.cashTotal).toLocaleString()}</span>
          <span>🛒 订单总额: ¥{(summary.orderTotal).toLocaleString()}</span>
        </div>
      </div>
      </TriStateRenderer>
    </PageShell>
  );
}
