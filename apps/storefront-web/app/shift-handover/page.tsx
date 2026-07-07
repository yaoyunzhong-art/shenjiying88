/**
 * 前台交接班面板 — Shift Handover Page (Next.js App Router Page)
 * 角色视角: 🛒前台 / 👔收银
 * 类型: D-角色操作界面
 * 功能: 交接班清单管理、现金清点、待办转交、状态确认
 */
'use client';

import React, { useState, useCallback } from 'react';
import {
  PageShell,
  ShiftHandoverPanel,
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
// 前台交接班页面
// ============================================================

export default function ShiftHandoverPage() {
  const [items, setItems] = useState<ShiftHandoverEntry[]>(MOCK_ITEMS);

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

  // 计算实时 summary
  const summary: ShiftSummary = {
    ...MOCK_SUMMARY,
    totalItems: items.length,
    pendingCount: items.filter(i => i.status === 'pending').length,
    resolvedCount: items.filter(i => i.status === 'resolved').length,
    escalatedCount: items.filter(i => i.status === 'escalated').length,
  };

  return (
    <PageShell title="前台交接班" description="交接班清单管理 & 状态确认">
      <ShiftHandoverPanel
        summary={summary}
        items={items}
        onResolveItem={handleResolve}
        onEscalateItem={handleEscalate}
        onStartHandover={handleStartHandover}
        onEditNotes={handleEditNotes}
      />
    </PageShell>
  );
}
