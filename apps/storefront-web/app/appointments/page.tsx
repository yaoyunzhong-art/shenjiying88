'use client';

/**
 * 场地预约页面 - Appointments Page
 * 角色: 🛒 前台消费者视角
 * 功能: 日期选择 → 场地类型筛选 → 时间段展示 → 预约确认
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';

// ================================================================
// Types
// ================================================================

type ZoneType = 'racing' | 'shooting' | 'vr' | 'esports' | 'arcade' | 'billiards' | 'bowling';

interface ZoneInfo {
  id: ZoneType;
  label: string;
  icon: string;
  color: string;
}

interface TimeSlot {
  id: string;
  time: string;           // e.g. "10:00"
  endTime: string;        // e.g. "11:00"
  price: number;
  originalPrice?: number;
  available: boolean;
  peak?: boolean;
  zoneId: ZoneType;
}

interface VenueSlot {
  id: string;
  zoneId: ZoneType;
  date: string;
  slots: TimeSlot[];
}

// ================================================================
// Mock Data
// ================================================================

const ZONES: ZoneInfo[] = [
  { id: 'racing',    label: '🏎️ 赛车区',  icon: '🏎️', color: '#ef4444' },
  { id: 'shooting',  label: '🔫 射击区',  icon: '🔫', color: '#22c55e' },
  { id: 'vr',        label: '🥽 VR区',    icon: '🥽', color: '#8b5cf6' },
  { id: 'esports',   label: '🎮 电竞区',  icon: '🎮', color: '#f59e0b' },
  { id: 'arcade',    label: '🕹️ 街机区',  icon: '🕹️', color: '#06b6d4' },
  { id: 'billiards', label: '🎱 台球区',  icon: '🎱', color: '#ec4899' },
  { id: 'bowling',   label: '🎳 保龄球区', icon: '🎳', color: '#f97316' },
];

const TIME_LABELS = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getNextDays(count: number): { date: string; label: string; weekday: string; isToday: boolean }[] {
  const result: { date: string; label: string; weekday: string; isToday: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = formatDate(d);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[d.getDay()]!;
    const isToday = i === 0;
    result.push({
      date: dateStr,
      label: `${month}月${day}日`,
      weekday,
      isToday,
    });
  }
  return result;
}

// Generate mock slots for a given zone on a given date
function generateSlotsForZone(zoneId: ZoneType, date: string): TimeSlot[] {
  const seed = (zoneId + date).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return TIME_LABELS.map((time, idx) => {
    const hour = parseInt(time.split(':')[0]!, 10);
    const isPeak = hour >= 13 && hour <= 20;
    const basePrice =
      zoneId === 'racing' ? 88 :
      zoneId === 'shooting' ? 68 :
      zoneId === 'vr' ? 58 :
      zoneId === 'esports' ? 48 :
      zoneId === 'arcade' ? 38 :
      zoneId === 'billiards' ? 78 :
      zoneId === 'bowling' ? 68 : 50;
    const price = isPeak ? Math.round(basePrice * 1.3) : basePrice;
    const originalPrice = isPeak ? basePrice : undefined;
    // Some slots unavailable based on seed
    const unavailIdx = (seed + idx * 7) % 17;
    const available = unavailIdx !== 0 && unavailIdx !== 5 && unavailIdx !== 11;
    return {
      id: `${zoneId}-${date}-${time}`,
      time,
      endTime: TIME_LABELS[idx + 1] || '23:00',
      price,
      originalPrice,
      available,
      peak: isPeak,
      zoneId,
    };
  });
}

// ================================================================
// Styles
// ================================================================

const styles = {
  container: {
    maxWidth: 1100,
    margin: '0 auto' as const,
    padding: '32px 20px',
  },
  header: {
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 12,
  },
  // Date picker
  dateGrid: {
    display: 'flex' as const,
    gap: 8,
    overflowX: 'auto' as const,
    paddingBottom: 8,
  },
  dateCard: (selected: boolean): React.CSSProperties => ({
    flexShrink: 0,
    minWidth: 72,
    padding: '10px 14px',
    borderRadius: 12,
    textAlign: 'center' as const,
    cursor: 'pointer',
    border: selected ? '1.5px solid #3b82f6' : '1px solid rgba(148,163,184,0.15)',
    background: selected ? 'rgba(59,130,246,0.12)' : 'rgba(15,23,42,0.35)',
    transition: 'all 0.2s',
  }),
  dateNum: (selected: boolean): React.CSSProperties => ({
    fontSize: 16,
    fontWeight: 700,
    color: selected ? '#60a5fa' : '#e2e8f0',
    lineHeight: 1.3,
  }),
  dateWeekday: (selected: boolean): React.CSSProperties => ({
    fontSize: 11,
    color: selected ? '#93c5fd' : '#64748b',
    marginTop: 2,
  }),
  dateToday: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: 600,
    marginTop: 1,
  },
  // Filter chips
  filterRow: {
    display: 'flex' as const,
    gap: 6,
    flexWrap: 'wrap' as const,
    marginBottom: 20,
  },
  filterChip: (active: boolean, color: string): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: active ? `1.5px solid ${color}` : '1px solid rgba(148,163,184,0.12)',
    background: active ? `${color}15` : 'rgba(15,23,42,0.3)',
    color: active ? color : '#94a3b8',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  }),
  // Slot grid
  timeGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 10,
  },
  slotCard: (
    slot: TimeSlot,
    selected: boolean,
  ): React.CSSProperties => ({
    borderRadius: 12,
    padding: '12px 10px',
    cursor: slot.available ? 'pointer' : 'not-allowed',
    border: selected
      ? '1.5px solid #3b82f6'
      : slot.available
        ? '1px solid rgba(148,163,184,0.12)'
        : '1px solid rgba(148,163,184,0.06)',
    background: selected
      ? 'rgba(59,130,246,0.12)'
      : slot.available
        ? 'rgba(15,23,42,0.35)'
        : 'rgba(15,23,42,0.15)',
    opacity: slot.available ? 1 : 0.45,
    transition: 'all 0.2s',
    position: 'relative' as const,
  }),
  slotTime: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
    lineHeight: 1.3,
  },
  slotEnd: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 1.2,
    marginBottom: 6,
  },
  slotPrice: (available: boolean): React.CSSProperties => ({
    fontSize: 15,
    fontWeight: 700,
    color: available ? '#f59e0b' : '#475569',
  }),
  slotOrigPrice: {
    fontSize: 11,
    color: '#64748b',
    textDecoration: 'line-through',
    marginLeft: 4,
  },
  slotPeak: {
    fontSize: 9,
    color: '#fb923c',
    fontWeight: 600,
    marginBottom: 4,
  },
  slotUnavail: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  // Legend
  legend: {
    display: 'flex' as const,
    gap: 20,
    marginTop: 16,
    padding: '12px 16px',
    borderRadius: 10,
    background: 'rgba(15,23,42,0.25)',
    border: '1px solid rgba(148,163,184,0.08)',
    flexWrap: 'wrap' as const,
  },
  legendItem: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 6,
    fontSize: 12,
    color: '#94a3b8',
  },
  legendDot: (color: string): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),
  // Modal
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    background: '#1e293b',
    border: '1px solid rgba(148,163,184,0.15)',
    padding: 28,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 20,
  },
  modalRow: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    padding: '8px 0',
    fontSize: 14,
    color: '#cbd5e1',
    borderBottom: '1px solid rgba(148,163,184,0.06)',
  },
  modalRowLabel: {
    color: '#94a3b8',
  },
  modalRowValue: {
    fontWeight: 600,
    color: '#e2e8f0',
  },
  modalActions: {
    display: 'flex' as const,
    gap: 10,
    marginTop: 24,
    justifyContent: 'flex-end' as const,
  },
  btnPrimary: {
    borderRadius: 10,
    padding: '10px 24px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  btnSecondary: {
    borderRadius: 10,
    padding: '10px 24px',
    background: 'rgba(148,163,184,0.1)',
    color: '#94a3b8',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  },
  btnPeak: {
    borderRadius: 10,
    padding: '10px 24px',
    background: '#ea580c',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  toast: (show: boolean): React.CSSProperties => ({
    position: 'fixed' as const,
    bottom: 40,
    left: '50%',
    transform: show ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(80px)',
    background: '#22c55e',
    color: '#fff',
    padding: '12px 28px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    zIndex: 2000,
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    opacity: show ? 1 : 0,
    pointerEvents: show ? ('auto' as const) : ('none' as const),
    boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
    whiteSpace: 'nowrap' as const,
  }),
  summaryBar: {
    position: 'sticky' as const,
    bottom: 0,
    marginTop: 28,
    padding: '14px 20px',
    borderRadius: 14,
    background: 'rgba(30,41,59,0.95)',
    border: '1px solid rgba(148,163,184,0.12)',
    backdropFilter: 'blur(8px)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  summaryText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 1.5,
  },
  summaryCount: {
    fontSize: 15,
    fontWeight: 700,
    color: '#f1f5f9',
  },
  zoneHeader: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 12,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  zoneDot: (color: string): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color,
    display: 'inline-block',
  }),
};

// ================================================================
// Component
// ================================================================

import { useTriState } from '../_components/useTriState';
import { TriStateRenderer } from '../_components/TriStateRenderer';

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    wrapLoad(
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 400);
      }),
    ).then(() => setPageReady(true));
  }, []);
  const [selectedZone, setSelectedZone] = useState<ZoneType | 'all'>('all');
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const dateOptions = useMemo(() => getNextDays(14), []);
  const firstDate = dateOptions[0]?.date || '';

  // Auto-select today on first render
  React.useEffect(() => {
    if (!selectedDate && firstDate) {
      setSelectedDate(firstDate);
    }
  }, [firstDate, selectedDate]);

  // Generate all venue slots
  const allSlots = useMemo(() => {
    const result: VenueSlot[] = [];
    for (const zone of ZONES) {
      const slots = generateSlotsForZone(zone.id, selectedDate || firstDate);
      result.push({
        id: `${zone.id}-${selectedDate || firstDate}`,
        zoneId: zone.id,
        date: selectedDate || firstDate,
        slots,
      });
    }
    return result;
  }, [selectedDate, firstDate]);

  const filteredVenues = useMemo(() => {
    if (selectedZone === 'all') return allSlots;
    return allSlots.filter(v => v.zoneId === selectedZone);
  }, [allSlots, selectedZone]);

  const toggleSlot = useCallback((slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlots(prev => {
      const exists = prev.find(s => s.id === slot.id);
      if (exists) return prev.filter(s => s.id !== slot.id);
      return [...prev, slot];
    });
  }, []);

  const isSlotSelected = useCallback(
    (slotId: string) => selectedSlots.some(s => s.id === slotId),
    [selectedSlots],
  );

  const handleBookNow = useCallback(() => {
    if (selectedSlots.length === 0) return;
    setShowConfirm(true);
  }, [selectedSlots]);

  const confirmBooking = useCallback(() => {
    setShowConfirm(false);
    const count = selectedSlots.length;
    const total = selectedSlots.reduce((s, sl) => s + sl.price, 0);
    setToastMessage(`✅ 预约成功！共 ${count} 个时段，合计 ¥${total}`);
    setShowToast(true);
    setSelectedSlots([]);
    setTimeout(() => setShowToast(false), 3500);
  }, [selectedSlots]);

  const totalAmount = useMemo(
    () => selectedSlots.reduce((s, sl) => s + sl.price, 0),
    [selectedSlots],
  );

  const zoneMap = useMemo(() => {
    const m = new Map<ZoneType, ZoneInfo>();
    ZONES.forEach(z => m.set(z.id, z));
    return m;
  }, []);

  return (
    <main style={styles.container}>
      <TriStateRenderer
        loading={loading}
        empty={!pageReady && !loading && !error}
        error={error}
        onRetry={() =>
          wrapLoad(
            new Promise<void>((resolve) => {
              setTimeout(() => resolve(), 400);
            }),
          ).then(() => setPageReady(true))
        }
      >
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>📅 场地预约</h1>
        <p style={styles.headerSub}>选择日期和场地，预订你的专属娱乐时段</p>
      </div>

      {/* Date Picker */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📆 选择日期</div>
        <div style={styles.dateGrid}>
          {dateOptions.map(d => (
            <div
              key={d.date}
              style={styles.dateCard(selectedDate === d.date)}
              onClick={() => setSelectedDate(d.date)}
            >
              <div style={styles.dateNum(selectedDate === d.date)}>{d.label}</div>
              <div style={styles.dateWeekday(selectedDate === d.date)}>{d.weekday}</div>
              {d.isToday && <div style={styles.dateToday}>今天</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Zone Filter */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>🏟️ 场地类型</div>
        <div style={styles.filterRow}>
          <div
            style={styles.filterChip(selectedZone === 'all', '#3b82f6')}
            onClick={() => setSelectedZone('all')}
          >
            🏟️ 全部场地
          </div>
          {ZONES.map(zone => (
            <div
              key={zone.id}
              style={styles.filterChip(selectedZone === zone.id, zone.color)}
              onClick={() => setSelectedZone(zone.id)}
            >
              {zone.label}
            </div>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div style={styles.section}>
        {filteredVenues.map(venue => {
          const zone = zoneMap.get(venue.zoneId)!;
          const availableCount = venue.slots.filter(s => s.available).length;
          return (
            <div key={venue.id} style={{ marginBottom: 28 }}>
              <div style={styles.zoneHeader}>
                <span style={styles.zoneDot(zone.color)} />
                {zone.label}
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
                  （{availableCount}/{venue.slots.length} 时段可约）
                </span>
              </div>
              <div style={styles.timeGrid}>
                {venue.slots.map(slot => (
                  <div
                    key={slot.id}
                    style={styles.slotCard(slot, isSlotSelected(slot.id))}
                    onClick={() => toggleSlot(slot)}
                  >
                    {slot.peak && slot.available && (
                      <div style={styles.slotPeak}>🔺 高峰</div>
                    )}
                    <div style={styles.slotTime}>{slot.time}</div>
                    <div style={styles.slotEnd}>~ {slot.endTime}</div>
                    {slot.available ? (
                      <div>
                        <span style={styles.slotPrice(true)}>¥{slot.price}</span>
                        {slot.originalPrice && (
                          <span style={styles.slotOrigPrice}>¥{slot.originalPrice}</span>
                        )}
                      </div>
                    ) : (
                      <div style={styles.slotUnavail}>❌ 已约满</div>
                    )}
                    {isSlotSelected(slot.id) && (
                      <div style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: '#fff',
                        fontWeight: 700,
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={styles.legendDot('#22c55e')} />
          可预约
        </div>
        <div style={styles.legendItem}>
          <span style={styles.legendDot('#64748b')} />
          已约满
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot('#fb923c'), width: 10, height: 10 }} />
          高峰时段（价格上浮）
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot('#3b82f6'), width: 10, height: 10 }} />
          已选中
        </div>
        <div style={styles.legendItem}>
          <span style={{ fontSize: 13 }}>💰 选中 <strong style={{ color: '#f5f5f5' }}>{selectedSlots.length}</strong> 个时段，合计 <strong style={{ color: '#f59e0b' }}>¥{totalAmount}</strong></span>
        </div>
      </div>

      {/* Summary & Action */}
      {selectedSlots.length > 0 && (
        <div style={styles.summaryBar}>
          <div>
            <div style={styles.summaryText}>
              已选择 <strong style={styles.summaryCount}>{selectedSlots.length}</strong> 个时段
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              {selectedSlots.map(s => `${s.time}-${s.endTime}`).join('、')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
              ¥{totalAmount}
            </div>
            <button
              onClick={handleBookNow}
              style={{ ...styles.btnPrimary, padding: '12px 32px', fontSize: 15 }}
            >
              去预约 →
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowConfirm(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>📋 预约确认</div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <div style={styles.modalRow}>
                <span style={styles.modalRowLabel}>日期</span>
                <span style={styles.modalRowValue}>{selectedDate || firstDate}</span>
              </div>
              {selectedSlots.map(slot => {
                const zone = zoneMap.get(slot.zoneId);
                return (
                  <div key={slot.id} style={styles.modalRow}>
                    <span style={styles.modalRowLabel}>
                      {zone?.icon || '🏟️'} {slot.time} - {slot.endTime}
                    </span>
                    <span style={styles.modalRowValue}>¥{slot.price}</span>
                  </div>
                );
              })}
              <div style={{ ...styles.modalRow, borderBottom: 'none', marginTop: 4 }}>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>合计</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
                  ¥{totalAmount}
                </span>
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setShowConfirm(false)}>
                取消
              </button>
              <button
                style={selectedSlots.some(s => s.peak) ? styles.btnPeak : styles.btnPrimary}
                onClick={confirmBooking}
              >
                ✅ 确认预约
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={styles.toast(showToast)}>{toastMessage}</div>
      </TriStateRenderer>
    </main>
  );
}
