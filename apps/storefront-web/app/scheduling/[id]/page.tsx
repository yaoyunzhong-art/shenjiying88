/**
 * 排班详情页 — Scheduling Detail Page (Next.js App Router)
 * 角色视角: 👔店长 / 🛒前台主管
 * 类型: B-详情页 (含编辑/状态流转)
 * 功能: 查看单日排班详情、调整排班、员工替换
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageShell,
  DetailShell,
  DetailActionBar,
  Badge,
  Button,
  EmptyState,
  LoadingOverlay,
} from '@m5/ui';
import type {
  DetailActionBarAction,
  DetailShellAction,
} from '@m5/ui';

// ============================================================
// 类型定义
// ============================================================

interface ShiftAssignmentInfo {
  staffId: string;
  staffName: string;
  role: string;
  shiftLabel: string;
  startTime: string;
  endTime: string;
}

interface DayShiftDetail {
  date: string;
  dayLabel: string;
  assignments: ShiftAssignmentInfo[];
  totalStaff: number;
  roles: string[];
  totalHours: number;
  note?: string;
}

// ============================================================
// Mock 数据
// ============================================================

const MOCK_DAY_DETAILS: Record<string, DayShiftDetail> = {
  '2026-06-29': {
    date: '2026-06-29',
    dayLabel: '周一',
    assignments: [
      { staffId: 's1', staffName: '张三', role: '收银员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
      { staffId: 's2', staffName: '李四', role: '导购员', shiftLabel: '中班 12:00-20:00', startTime: '12:00', endTime: '20:00' },
      { staffId: 's3', staffName: '王五', role: '收银员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
    ],
    totalStaff: 3,
    roles: ['收银员', '导购员'],
    totalHours: 40,
    note: '本日客流量预计较大，安排双收银员',
  },
  '2026-07-01': {
    date: '2026-07-01',
    dayLabel: '周三',
    assignments: [
      { staffId: 's1', staffName: '张三', role: '收银员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
      { staffId: 's4', staffName: '赵六', role: '导购员', shiftLabel: '晚班 16:00-00:00', startTime: '16:00', endTime: '00:00' },
      { staffId: 's5', staffName: '孙七', role: '收银员', shiftLabel: '中班 14:00-22:00', startTime: '14:00', endTime: '22:00' },
      { staffId: 's6', staffName: '周八', role: '导购员', shiftLabel: '中班 14:00-22:00', startTime: '14:00', endTime: '22:00' },
    ],
    totalStaff: 4,
    roles: ['收银员', '导购员'],
    totalHours: 56,
  },
  '2026-07-03': {
    date: '2026-07-03',
    dayLabel: '周五',
    assignments: [
      { staffId: 's2', staffName: '李四', role: '导购员', shiftLabel: '中班 12:00-20:00', startTime: '12:00', endTime: '20:00' },
      { staffId: 's3', staffName: '王五', role: '收银员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
    ],
    totalStaff: 2,
    roles: ['收银员', '导购员'],
    totalHours: 24,
    note: '周五下午员工培训，安排较少人手',
  },
};

const MOCK_AVAILABLE_STAFF = [
  { id: 's1', name: '张三', role: '收银员' },
  { id: 's2', name: '李四', role: '导购员' },
  { id: 's3', name: '王五', role: '收银员' },
  { id: 's4', name: '赵六', role: '导购员' },
  { id: 's5', name: '孙七', role: '收银员' },
  { id: 's6', name: '周八', role: '导购员' },
];

// ============================================================
// 工具函数
// ============================================================

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${dateStr} 周${weekdays[d.getDay()]}`;
}

// ============================================================
// 主组件
// ============================================================

export default async function SchedulingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [swapping, setSwapping] = useState(false);

  const detail = useMemo(() => MOCK_DAY_DETAILS[id], [id]);

  const handleEdit = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      await new Promise((r) => setTimeout(r, 800));
      // In real app: navigate to edit page
    } catch {
      setError('编辑失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSwap = useCallback(async (staffId: string, newStaffId: string) => {
    setSwapping(true);
    setError(undefined);
    try {
      await new Promise((r) => setTimeout(r, 600));
      // In real app: call API to swap staff
    } catch {
      setError('换班失败');
    } finally {
      setSwapping(false);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      await new Promise((r) => setTimeout(r, 800));
      router.push('/scheduling');
    } catch {
      setError('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (!detail) {
    return (
      <PageShell title="排班详情">
        <EmptyState
          title="未找到排班信息"
          description={`日期 ${id} 暂无排班数据`}
          action={<Button variant="primary" onClick={() => router.push('/scheduling')}>返回排班列表</Button>}
        />
      </PageShell>
    );
  }

  const actions: DetailActionBarAction[] = [
    { key: 'edit', label: '编辑排班', variant: 'primary', onClick: handleEdit },
    { key: 'copy', label: '复制到其他日', variant: 'default', onClick: () => {} },
    { key: 'delete', label: '删除当日排班', variant: 'danger', onClick: handleDelete },
  ];

  const shellActions: DetailShellAction[] = [
    { key: 'print', label: '打印', onClick: () => window.print() },
    { key: 'export', label: '导出' },
  ];

  return (
    <PageShell title={`排班详情 — ${formatDate(detail.date)}`}>
      <LoadingOverlay visible={loading} />

      <DetailShell
        title={`排班详情 — ${formatDate(detail.date)}`}
        subtitle={`在岗 ${detail.totalStaff} 人 · ${detail.roles.join('、')}`}
        actions={shellActions}
        onBack={() => router.push('/scheduling')}
      >
        {/* 错误提示 */}
        {error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* 排班信息概览 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>基本信息</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>排班日期</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>{formatDate(detail.date)}</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>在岗人数</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>{detail.totalStaff} 人</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>总工时</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>{detail.totalHours} h</div>
            </div>
          </div>
          {detail.note && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', fontSize: 14, color: '#92400e' }}>
              📌 {detail.note}
            </div>
          )}
        </div>

        {/* 排班人员明细 */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>排班人员明细</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>姓名</th>
                <th style={{ padding: '10px 12px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>角色</th>
                <th style={{ padding: '10px 12px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>班次</th>
                <th style={{ padding: '10px 12px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>时间段</th>
                <th style={{ padding: '10px 12px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {detail.assignments.map((a) => (
                <tr key={a.staffId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{a.staffName}</td>
                  <td style={{ padding: '12px' }}>
                    <Badge variant={a.role === '收银员' ? 'info' : 'success'}>{a.role}</Badge>
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>{a.shiftLabel}</td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {a.startTime} - {a.endTime}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Button size="sm" variant="ghost" onClick={() => handleSwap(a.staffId, 's5')} disabled={swapping}>
                      {swapping ? '调整中…' : '换班'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 操作栏 */}
        <div style={{ marginTop: 24 }}>
          <DetailActionBar actions={actions} />
        </div>

        {/* 今日备注 */}
        <div style={{ marginTop: 24, padding: 16, background: '#f0f9ff', borderRadius: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0369a1', marginBottom: 8 }}>💡 可操作提示</div>
          <ul style={{ fontSize: 13, color: '#475569', lineHeight: 2, paddingLeft: 20 }}>
            <li>点击「换班」可将指定员工替换为其他可用员工</li>
            <li>点击「编辑排班」可修改班次时间</li>
            <li>点击「复制到其他日」快速复制排班模板</li>
          </ul>
        </div>
      </DetailShell>
    </PageShell>
  );
}
