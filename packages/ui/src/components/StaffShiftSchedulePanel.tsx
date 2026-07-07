'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShiftAssignment {
  staffId: string;
  staffName: string;
  role: string;
  shiftLabel: string;
  /** HH:mm format */
  startTime: string;
  endTime: string;
  avatar?: string;
}

export interface ShiftSlot {
  date: string;
  dayLabel: string;
  assignments: ShiftAssignment[];
}

export interface StaffShiftSchedulePanelProps {
  /** Shifts for the visible period */
  shifts: ShiftSlot[];
  /** Staff available for assignment */
  availableStaff: { id: string; name: string; role: string }[];
  /** On add shift assignment */
  onAddShift?: (date: string, staffId: string, shiftLabel: string) => Promise<void>;
  /** On remove shift assignment */
  onRemoveShift?: (date: string, staffId: string) => Promise<void>;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Test id */
  'data-testid'?: string;
  className?: string;
}

const SHIFT_TEMPLATES = [
  { label: '早班', start: '08:00', end: '16:00' },
  { label: '中班', start: '12:00', end: '20:00' },
  { label: '晚班', start: '16:00', end: '00:00' },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekdayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `周${days[d.getDay()]}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StaffShiftSchedulePanel({
  shifts,
  availableStaff,
  onAddShift,
  onRemoveShift,
  loading = false,
  error,
  'data-testid': testId = 'staff-shift-schedule',
  className,
}: StaffShiftSchedulePanelProps) {
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedShiftIdx, setSelectedShiftIdx] = useState<number>(0);
  const [operating, setOperating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleOpenAdd = useCallback((date: string) => {
    setAddingDate(date);
    setSelectedStaffId(availableStaff[0]?.id ?? '');
    setSelectedShiftIdx(0);
    setActionError(null);
  }, [availableStaff]);

  const handleCancelAdd = useCallback(() => {
    setAddingDate(null);
    setActionError(null);
  }, []);

  const handleConfirmAdd = useCallback(async () => {
    if (!addingDate || !selectedStaffId) return;
    setOperating(true);
    setActionError(null);
    try {
      const tpl = SHIFT_TEMPLATES[selectedShiftIdx]!;
      const shiftLabel = `${tpl.label} ${tpl.start}-${tpl.end}`;
      await onAddShift?.(addingDate, selectedStaffId, shiftLabel);
      setAddingDate(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '添加排班失败');
    } finally {
      setOperating(false);
    }
  }, [addingDate, selectedStaffId, selectedShiftIdx, onAddShift]);

  const handleRemove = useCallback(async (date: string, staffId: string) => {
    setOperating(true);
    setActionError(null);
    try {
      await onRemoveShift?.(date, staffId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '移除排班失败');
    } finally {
      setOperating(false);
    }
  }, [onRemoveShift]);

  const groupedByTemplate = useMemo(() => {
    const groups: Record<string, { label: string; start: string; end: string; items: { date: string; dayLabel: string; assignments: ShiftAssignment[] }[] }> = {};
    for (const tpl of SHIFT_TEMPLATES) {
      const key = `${tpl.label}-${tpl.start}`;
      groups[key] = { ...tpl, items: [] };
    }
    for (const slot of shifts) {
      for (const asgn of slot.assignments) {
        const key = `${asgn.shiftLabel.split(' ')[0]}-${asgn.startTime}`;
        if (groups[key]) {
          if (!groups[key].items.find((i) => i.date === slot.date)) {
            groups[key].items.push({ date: slot.date, dayLabel: slot.dayLabel, assignments: [] });
          }
          const found = groups[key].items.find((i) => i.date === slot.date);
          found?.assignments.push(asgn);
        }
      }
    }
    return Object.values(groups);
  }, [shifts]);

  if (loading) {
    return (
      <div
        data-testid={testId}
        className={className}
        style={{
          borderRadius: 16,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#94a3b8', fontSize: 14 }}>加载排班信息中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid={testId}
        className={className}
        style={{
          borderRadius: 16,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#f87171', marginBottom: 8 }}>{error}</p>
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className={className}
      style={{ display: 'grid', gap: 16 }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
            员工排班表
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            {shifts.length > 0 && shifts[0]
              ? `${formatShortDate(shifts[0].date)} - ${formatShortDate(shifts[shifts.length - 1]!.date)}`
              : '暂无排班'}
          </p>
        </div>
        <StatusBadge
          label={shifts.reduce((acc, s) => acc + s.assignments.length, 0) + ' 个班次'}
          variant="info"
          size="sm"
        />
      </div>

      {/* Action Feedback */}
      {actionError && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.25)',
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      )}

      {/* Add Shift Form */}
      {addingDate && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            display: 'grid',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>
            添加排班 · {formatShortDate(addingDate)} ({getWeekdayLabel(addingDate)})
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              disabled={operating}
              style={selectStyle}
            >
              {availableStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
            <select
              value={selectedShiftIdx}
              onChange={(e) => setSelectedShiftIdx(Number(e.target.value))}
              disabled={operating}
              style={selectStyle}
            >
              {SHIFT_TEMPLATES.map((tpl, idx) => (
                <option key={idx} value={idx}>
                  {tpl.label} ({tpl.start}-{tpl.end})
                </option>
              ))}
            </select>
            <Button variant="primary" size="sm" loading={operating} onClick={handleConfirmAdd}>
              确认
            </Button>
            <Button variant="secondary" size="sm" disabled={operating} onClick={handleCancelAdd}>
              取消
            </Button>
          </div>
        </div>
      )}

      {/* Shift Grid */}
      {groupedByTemplate.length === 0 ? (
        <div
          style={{
            borderRadius: 12,
            padding: 32,
            background: 'rgba(15, 23, 42, 0.25)',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 14,
          }}
        >
          暂无排班数据，请点击上方日期添加排班
        </div>
      ) : (
        groupedByTemplate.map((group) => (
          <div key={group.label} style={{ display: 'grid', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#94a3b8',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background:
                    group.label === '早班'
                      ? '#fbbf24'
                      : group.label === '中班'
                        ? '#60a5fa'
                        : '#a78bfa',
                }}
              />
              {group.label} ({group.start}-{group.end})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {shifts.map((slot) => {
                const dayAssignments = slot.assignments.filter(
                  (a) => a.shiftLabel.startsWith(group.label.split(' ')[0] ?? '')
                );
                const isDayToday = isToday(slot.date);
                return (
                  <div
                    key={slot.date + group.label}
                    style={{
                      borderRadius: 10,
                      padding: 10,
                      background: isDayToday
                        ? 'rgba(37, 99, 235, 0.12)'
                        : 'rgba(15, 23, 42, 0.3)',
                      border: `1px solid ${isDayToday ? 'rgba(37, 99, 235, 0.3)' : 'rgba(148, 163, 184, 0.1)'}`,
                      minHeight: 80,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isDayToday ? 700 : 400,
                          color: isDayToday ? '#60a5fa' : '#64748b',
                        }}
                      >
                        {formatShortDate(slot.date)} {getWeekdayLabel(slot.date)}
                      </span>
                      {isDayToday && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(37, 99, 235, 0.2)',
                            color: '#60a5fa',
                          }}
                        >
                          今天
                        </span>
                      )}
                    </div>

                    {dayAssignments.length === 0 ? (
                      <div
                        style={{
                          fontSize: 11,
                          color: '#475569',
                          padding: '4px 0',
                        }}
                      >
                        {onAddShift ? (
                          <button
                            onClick={() => handleOpenAdd(slot.date)}
                            style={{
                              background: 'none',
                              border: '1px dashed rgba(148,163,184,0.2)',
                              borderRadius: 6,
                              padding: '4px 8px',
                              width: '100%',
                              cursor: 'pointer',
                              color: '#64748b',
                              fontSize: 11,
                            }}
                          >
                            + 添加
                          </button>
                        ) : (
                          <span style={{ color: '#475569' }}>—</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 4 }}>
                        {dayAssignments.map((asgn) => (
                          <div
                            key={asgn.staffId + asgn.shiftLabel}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 4,
                              padding: '3px 6px',
                              borderRadius: 6,
                              background: 'rgba(30, 41, 59, 0.5)',
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: '#e2e8f0',
                                  lineHeight: 1.3,
                                }}
                              >
                                {asgn.staffName}
                              </div>
                              <div style={{ fontSize: 10, color: '#64748b' }}>
                                {asgn.role}
                              </div>
                            </div>
                            {onRemoveShift && (
                              <button
                                onClick={() => handleRemove(slot.date, asgn.staffId)}
                                disabled={operating}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  fontSize: 14,
                                  lineHeight: 1,
                                  padding: '2px',
                                  opacity: operating ? 0.5 : 1,
                                }}
                                title="移除排班"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.4)',
  color: '#f1f5f9',
  fontSize: 13,
  outline: 'none',
  minWidth: 140,
};
