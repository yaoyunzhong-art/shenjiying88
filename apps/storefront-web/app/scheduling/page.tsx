/**
 * 排班管理页 — Staff Scheduling Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🛒前台主管
 * 类型: D-角色操作界面
 * 功能: 门店排班查看、排班表编辑、排班冲突检测、人员统计
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  PageShell,
  StaffShiftSchedulePanel,
  StatusBadge,
  type ShiftSlot,
} from '@m5/ui';

// ============================================================
// Mock 数据
// ============================================================

function generateMockShifts(): ShiftSlot[] {
  const days: ShiftSlot[] = [];
  const staff = [
    { staffId: 's1', staffName: '张三', role: '收银员', startTime: '08:00', endTime: '16:00' },
    { staffId: 's2', staffName: '李四', role: '导购员', startTime: '12:00', endTime: '20:00' },
    { staffId: 's3', staffName: '王五', role: '收银员', startTime: '08:00', endTime: '16:00' },
    { staffId: 's4', staffName: '赵六', role: '导购员', startTime: '16:00', endTime: '00:00' },
    { staffId: 's5', staffName: '孙七', role: '收银员', startTime: '10:00', endTime: '18:00' },
    { staffId: 's6', staffName: '周八', role: '导购员', startTime: '08:00', endTime: '14:00' },
  ];
  const shiftLabels = ['早班', '中班', '晚班'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(2026, 5, 29 + i);
    const dateStr = d.toISOString().slice(0, 10);
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    const count = (i % 3) + 2;
    const assignments = staff.slice(0, count).map((s, idx) => ({
      staffId: s.staffId,
      staffName: s.staffName,
      role: s.role,
      shiftLabel: `${shiftLabels[idx % 3]} ${i % 2 === 0 ? s.startTime : '14:00'}-${i % 2 === 0 ? s.endTime : '22:00'}`,
      startTime: i % 2 === 0 ? s.startTime : '14:00',
      endTime: i % 2 === 0 ? s.endTime : '22:00',
    }));
    days.push({ date: dateStr, dayLabel: `周${weekday}`, assignments });
  }
  return days;
}

const MOCK_SHIFTS = generateMockShifts();

const MOCK_AVAILABLE_STAFF = [
  { id: 's1', name: '张三', role: '收银员' },
  { id: 's2', name: '李四', role: '导购员' },
  { id: 's3', name: '王五', role: '收银员' },
  { id: 's4', name: '赵六', role: '导购员' },
  { id: 's5', name: '孙七', role: '收银员' },
  { id: 's6', name: '周八', role: '导购员' },
];

const STAFF_ROLES = ['收银员', '导购员', '保洁', '保安', '客服'] as const;

// ============================================================
// 子组件：统计卡片
// ============================================================

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 130, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ============================================================
// 子组件：人员统计详情
// ============================================================

function StaffStatsPanel({ staff }: { staff: typeof MOCK_AVAILABLE_STAFF }) {
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    staff.forEach((s) => {
      counts[s.role] = (counts[s.role] || 0) + 1;
    });
    return counts;
  }, [staff]);

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        padding: '12px 18px',
        background: '#f9fafb',
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        marginBottom: 20,
        fontSize: 13,
      }}
    >
      <span style={{ fontWeight: 600, color: '#374151' }}>👥 人员统计:</span>
      {STAFF_ROLES.map((role) => {
        const count = roleCounts[role] || 0;
        if (count === 0) return null;
        return (
          <span key={role} style={{ color: '#6b7280' }}>
            {role} <strong style={{ color: '#374151' }}>{count}</strong>
            {role !== '客服' && <span style={{ marginRight: 8 }}>·</span>}
          </span>
        );
      })}
      <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
        共 {staff.length} 人
      </span>
    </div>
  );
}

// ============================================================
// 子组件：周排班摘要
// ============================================================

function WeeklySummary({ shifts }: { shifts: ShiftSlot[] }) {
  const totalAssignments = shifts.reduce((sum, day) => sum + day.assignments.length, 0);
  const avgPerDay = shifts.length > 0 ? Math.round(totalAssignments / shifts.length) : 0;
  const busiestDay = [...shifts].sort((a, b) => b.assignments.length - a.assignments.length)[0];

  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        padding: '14px 20px',
        background: '#f0fdf4',
        borderRadius: 10,
        border: '1px solid #bbf7d0',
        marginBottom: 20,
        fontSize: 13,
        color: '#166534',
      }}
    >
      <span>📅 排班周期: {shifts[0]?.date ?? '—'} ~ {shifts[shifts.length - 1]?.date ?? '—'}</span>
      <span>👥 总排班人次: {totalAssignments}</span>
      <span>📊 日均排班: {avgPerDay} 人/天</span>
      {busiestDay && (
        <span>🔥 最忙: {busiestDay.dayLabel} ({busiestDay.assignments.length} 人)</span>
      )}
    </div>
  );
}

// ============================================================
// 排班管理页面
// ============================================================

export default function SchedulingPage() {
  const [shifts, setShifts] = useState<ShiftSlot[]>(MOCK_SHIFTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'schedule' | 'overview'>('schedule');

  const handleAddShift = useCallback(
    async (date: string, staffId: string, shiftLabel: string) => {
      setLoading(true);
      setError(undefined);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const staff = MOCK_AVAILABLE_STAFF.find((s) => s.id === staffId);
        if (!staff) {
          throw new Error(`未找到员工: ${staffId}`);
        }

        const timeMatch = shiftLabel.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        const startTime = (timeMatch ? timeMatch[1] : '08:00') as string;
        const endTime = (timeMatch ? timeMatch[2] : '16:00') as string;

        const targetDay = shifts.find((s) => s.date === date);
        if (targetDay) {
          const conflict = targetDay.assignments.find(
            (a) =>
              a.staffId === staffId &&
              a.startTime === startTime &&
              a.endTime === endTime
          );
          if (conflict) {
            throw new Error(`${staff.name} 在 ${date} ${shiftLabel} 已有排班`);
          }
        }

        setShifts((prev) =>
          prev.map((slot) =>
            slot.date === date
              ? {
                  ...slot,
                  assignments: [
                    ...slot.assignments,
                    {
                      staffId: staff.id,
                      staffName: staff.name,
                      role: staff.role,
                      shiftLabel: `${shiftLabel} ${startTime}-${endTime}`,
                      startTime,
                      endTime,
                    },
                  ],
                }
              : slot
          )
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '添加排班失败');
      } finally {
        setLoading(false);
      }
    },
    [shifts]
  );

  const handleRemoveShift = useCallback(
    async (date: string, staffId: string) => {
      setLoading(true);
      setError(undefined);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setShifts((prev) =>
          prev.map((slot) =>
            slot.date === date
              ? {
                  ...slot,
                  assignments: slot.assignments.filter(
                    (a) => a.staffId !== staffId
                  ),
                }
              : slot
          )
        );
      } catch {
        setError('移除排班失败');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleDismissError = useCallback(() => setError(undefined), []);

  return (
    <PageShell
      title="排班管理"
      description="门店员工排班查看与编辑，支持早中晚班配置"
    >
      <div style={{ padding: 24 }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>📅 排班管理</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            管理门店 {MOCK_AVAILABLE_STAFF.length} 名员工的排班 · 共 {shifts.length} 天排班计划
          </p>
        </div>

        {/* 统计卡片 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatCard label="总员工" value={MOCK_AVAILABLE_STAFF.length} icon="👥" color="#2563eb" />
          <StatCard label="排班天数" value={shifts.length} icon="📅" color="#059669" />
          <StatCard label="本周排班人次" value={shifts.reduce((s, d) => s + d.assignments.length, 0)} icon="📊" color="#7c3aed" />
          <StatCard label="收银员" value={MOCK_AVAILABLE_STAFF.filter(s => s.role === '收银员').length} icon="💳" color="#d97706" />
          <StatCard label="导购员" value={MOCK_AVAILABLE_STAFF.filter(s => s.role === '导购员').length} icon="🛒" color="#dc2626" />
        </div>

        {/* 人员统计 */}
        <StaffStatsPanel staff={MOCK_AVAILABLE_STAFF} />

        {/* 周排班摘要 */}
        <WeeklySummary shifts={shifts} />

        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
          {(['schedule', 'overview'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === tab ? 700 : 400,
                color: activeTab === tab ? '#2563eb' : '#6b7280',
                borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                marginBottom: -2,
              }}
            >
              {tab === 'schedule' ? '📋 排班表' : '📊 概览'}
            </button>
          ))}
        </div>

        {/* 错误提示 */}
        {error && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 16px',
              marginBottom: 16,
              background: '#fef2f2',
              borderRadius: 8,
              border: '1px solid #fecaca',
              fontSize: 13,
              color: '#dc2626',
            }}
          >
            <span>⚠️ {error}</span>
            <button
              onClick={handleDismissError}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 16,
                color: '#9ca3af',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* 排班面板 */}
        {activeTab === 'schedule' && (
          <StaffShiftSchedulePanel
            shifts={shifts}
            availableStaff={MOCK_AVAILABLE_STAFF}
            onAddShift={handleAddShift}
            onRemoveShift={handleRemoveShift}
            loading={loading}
            error={undefined}
            data-testid="scheduling-panel"
          />
        )}

        {/* 概览视图 */}
        {activeTab === 'overview' && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>日期</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>星期</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>排班人数</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>值班人员</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((day) => (
                  <tr key={day.date} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{day.date}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{day.dayLabel}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusBadge
                        variant={day.assignments.length >= 4 ? 'success' : day.assignments.length >= 2 ? 'warning' : 'danger'}
                        label={`${day.assignments.length} 人`}
                      />
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>
                      {day.assignments.map((a) => a.staffName).join('、') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 排班操作说明 */}
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            background: '#f9fafb',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            fontSize: 12,
            color: '#6b7280',
            lineHeight: 1.6,
          }}
        >
          <strong>💡 操作说明:</strong> 在排班表中点击日期可添加排班，选择员工和班次即可完成排班。
          系统会自动检测排班冲突，冲突时会提示错误。
        </div>
      </div>
    </PageShell>
  );
}
