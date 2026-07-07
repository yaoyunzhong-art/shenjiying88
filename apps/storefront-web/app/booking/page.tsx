/**
 * 预约看店页 — Booking Page (Next.js App Router Page)
 * B-页面: 面向C端用户的预约到店功能
 * 角色: 🛒 前台消费者视角
 *
 * 功能: 选择门店 → 选择日期/时段 → 填写联系信息 → 提交预约
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  DEFAULT_SLOTS,
  MOCK_STORES,
  MOCK_BOOKINGS,
  MAX_GUESTS_PER_BOOKING,
  today,
  getNextDays,
  formatDateDisplay,
  getChineseWeekday,
  isSlotBookable,
  findStoreByCode,
  validateBookingRequest,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  filterBookingsByStatus,
  type StoreBrief,
  type BookingSlot,
  type BookingRecord,
  type BookingRequest,
} from './booking-data';

// ============================================================
// 页面状态类型
// ============================================================

type BookingStep = 'select-store' | 'select-slot' | 'fill-info' | 'confirm' | 'done';

// ============================================================
// 预约看店页面
// ============================================================

export default function BookingPage() {
  const [step, setStep] = useState<BookingStep>('select-store');
  const [selectedStore, setSelectedStore] = useState<StoreBrief | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<BookingRecord | null>(null);

  const dateOptions = useMemo(() => getNextDays(14), []);

  // 当前选中门店的可预约时段
  const availableSlots = useMemo(
    () => DEFAULT_SLOTS.filter((s) => s.available),
    []
  );

  // 用户的历史预约
  const myBookings = useMemo(
    () => MOCK_BOOKINGS.filter((b) => b.status !== 'cancelled').slice(0, 3),
    []
  );

  const handleSelectStore = useCallback((store: StoreBrief) => {
    setSelectedStore(store);
    setStep('select-slot');
    setErrors([]);
  }, []);

  const handleBackToStore = useCallback(() => {
    setSelectedStore(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setStep('select-store');
    setErrors([]);
  }, []);

  const handleSelectSlot = useCallback(() => {
    if (!selectedDate || !selectedSlot) {
      setErrors([{ field: 'slot', message: '请选择日期和时段' }]);
      return;
    }
    setStep('fill-info');
    setErrors([]);
  }, [selectedDate, selectedSlot]);

  const handleBackToSlot = useCallback(() => {
    setStep('select-slot');
    setErrors([]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedStore || !selectedSlot) return;

    const req: BookingRequest = {
      storeCode: selectedStore.storeCode,
      date: selectedDate,
      slotId: selectedSlot.slotId,
      guestCount,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      note: note.trim() || undefined,
    };

    const validationErrors = validateBookingRequest(req);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newBooking: BookingRecord = {
      bookingId: `bk-${Date.now()}`,
      storeCode: selectedStore.storeCode,
      storeName: selectedStore.storeName,
      date: selectedDate,
      slotLabel: selectedSlot.label,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      guestCount,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      note: note.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setCreatedBooking(newBooking);
    setSubmitting(false);
    setStep('done');
  }, [selectedStore, selectedDate, selectedSlot, guestCount, contactName, contactPhone, note]);

  const handleReset = useCallback(() => {
    setStep('select-store');
    setSelectedStore(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setContactName('');
    setContactPhone('');
    setGuestCount(1);
    setNote('');
    setErrors([]);
    setCreatedBooking(null);
  }, []);

  // ---- Step: 选择门店 ----
  if (step === 'select-store') {
    return (
      <main style={{ minHeight: '100vh', background: '#0f172a', paddingBottom: 80 }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          padding: '16px',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: 0, textAlign: 'center' }}>
            预约看店
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', textAlign: 'center' }}>
            选择您想前往的门店
          </p>
        </header>

        <section style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_STORES.map((store) => (
              <button
                key={store.storeCode}
                onClick={() => handleSelectStore(store)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 8,
                  padding: 16, borderRadius: 12,
                  background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.1)',
                  cursor: 'pointer', textAlign: 'left', color: '#e2e8f0',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>{store.storeName}</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>
                    {store.distance ? `${(store.distance / 1000).toFixed(1)}km` : ''}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{store.address}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#f59e0b' }}>★ {store.rating}</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{store.reviewCount}条评价</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  // ---- Step: 选择日期/时段 ----
  if (step === 'select-slot') {
    return (
      <main style={{ minHeight: '100vh', background: '#0f172a', paddingBottom: 80 }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <button
              onClick={handleBackToStore}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, padding: 0 }}
            >
              ←
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              选择预约时间
            </h1>
          </div>
          {selectedStore && (
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {selectedStore.storeName}
            </p>
          )}
        </header>

        <section style={{ padding: '16px' }}>
          {/* 日期选择 */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 12px' }}>
              选择日期
            </h3>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
              {dateOptions.map((dateStr) => {
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    style={{
                      flexShrink: 0, padding: '10px 14px', borderRadius: 10,
                      border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.15)',
                      background: isSelected ? '#1e3a5f' : '#1e293b',
                      color: isSelected ? '#60a5fa' : '#94a3b8',
                      cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 12 }}>{getChineseWeekday(dateStr)}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: isSelected ? '#f8fafc' : '#e2e8f0' }}>
                      {dateStr.slice(8)}
                    </div>
                    <div style={{ fontSize: 11 }}>
                      {dateStr.slice(5, 7)}月
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 时段选择 */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 12px' }}>
              选择时段
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DEFAULT_SLOTS.map((slot) => {
                const bookable = isSlotBookable(slot);
                const isSelected = selectedSlot?.slotId === slot.slotId;
                return (
                  <button
                    key={slot.slotId}
                    onClick={() => bookable && setSelectedSlot(slot)}
                    disabled={!bookable}
                    style={{
                      padding: '10px 16px', borderRadius: 10,
                      border: isSelected
                        ? '1px solid #3b82f6'
                        : bookable
                          ? '1px solid rgba(148, 163, 184, 0.15)'
                          : '1px solid rgba(148, 163, 184, 0.05)',
                      background: isSelected ? '#1e3a5f' : bookable ? '#1e293b' : '#1a1f2e',
                      color: bookable ? (isSelected ? '#60a5fa' : '#94a3b8') : '#475569',
                      cursor: bookable ? 'pointer' : 'not-allowed',
                      opacity: bookable ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{slot.label}</div>
                    {slot.remaining > 0 && (
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        剩{slot.remaining}位
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {errors.length > 0 && (
            <div style={{
              padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 16,
            }}>
              {errors.map((e) => (
                <p key={e.field} style={{ fontSize: 13, color: '#ef4444', margin: '2px 0' }}>{e.message}</p>
              ))}
            </div>
          )}

          <button
            onClick={handleSelectSlot}
            disabled={!selectedDate || !selectedSlot}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: selectedDate && selectedSlot ? '#3b82f6' : '#1e293b',
              border: 'none', color: selectedDate && selectedSlot ? '#ffffff' : '#475569',
              fontSize: 16, fontWeight: 600, cursor: selectedDate && selectedSlot ? 'pointer' : 'not-allowed',
            }}
          >
            下一步
          </button>
        </section>
      </main>
    );
  }

  // ---- Step: 填写信息 ----
  if (step === 'fill-info') {
    return (
      <main style={{ minHeight: '100vh', background: '#0f172a', paddingBottom: 80 }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <button
              onClick={handleBackToSlot}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, padding: 0 }}
            >
              ←
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              填写预约信息
            </h1>
          </div>
        </header>

        <section style={{ padding: '16px' }}>
          {/* 预约摘要 */}
          <div style={{
            padding: 14, borderRadius: 10, background: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.1)', marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>预约信息</div>
            <div style={{ fontSize: 14, color: '#e2e8f0', marginBottom: 4 }}>
              {selectedStore?.storeName}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              {selectedDate} {selectedSlot?.label} · {guestCount}人
            </div>
          </div>

          {/* 联系人姓名 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: '#94a3b8', marginBottom: 6, display: 'block' }}>
              联系人姓名 *
            </label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="请输入您的姓名"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.2)',
                background: '#1e293b', color: '#e2e8f0', fontSize: 15, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 联系电话 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: '#94a3b8', marginBottom: 6, display: 'block' }}>
              联系电话 *
            </label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="请输入手机号"
              maxLength={11}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.2)',
                background: '#1e293b', color: '#e2e8f0', fontSize: 15, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 预约人数 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: '#94a3b8', marginBottom: 6, display: 'block' }}>
              预约人数 *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                disabled={guestCount <= 1}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: guestCount > 1 ? '#334155' : '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  color: guestCount > 1 ? '#e2e8f0' : '#475569',
                  cursor: guestCount > 1 ? 'pointer' : 'not-allowed',
                  fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                -
              </button>
              <span style={{ fontSize: 20, fontWeight: 600, color: '#f8fafc', minWidth: 30, textAlign: 'center' }}>
                {guestCount}
              </span>
              <button
                onClick={() => setGuestCount(Math.min(MAX_GUESTS_PER_BOOKING, guestCount + 1))}
                disabled={guestCount >= MAX_GUESTS_PER_BOOKING}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: guestCount < MAX_GUESTS_PER_BOOKING ? '#334155' : '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  color: guestCount < MAX_GUESTS_PER_BOOKING ? '#e2e8f0' : '#475569',
                  cursor: guestCount < MAX_GUESTS_PER_BOOKING ? 'pointer' : 'not-allowed',
                  fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                +
              </button>
              <span style={{ fontSize: 12, color: '#64748b' }}>最多{MAX_GUESTS_PER_BOOKING}人</span>
            </div>
          </div>

          {/* 备注 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, color: '#94a3b8', marginBottom: 6, display: 'block' }}>
              备注（选填）
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="如有特殊需求请在此说明"
              rows={3}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.2)',
                background: '#1e293b', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* 错误提示 */}
          {errors.length > 0 && (
            <div style={{
              padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 16,
            }}>
              {errors.map((e) => (
                <p key={e.field} style={{ fontSize: 13, color: '#ef4444', margin: '2px 0' }}>{e.message}</p>
              ))}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: submitting ? '#1e293b' : '#3b82f6',
              border: 'none', color: submitting ? '#475569' : '#ffffff',
              fontSize: 16, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? '提交中...' : '提交预约'}
          </button>
        </section>
      </main>
    );
  }

  // ---- Step: 完成 ----
  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', paddingBottom: 80 }}>
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 16px', minHeight: '60vh',
      }}>
        {/* 成功图标 */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <span style={{ fontSize: 36 }}>✓</span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
          预约提交成功
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', textAlign: 'center' }}>
          我们将在确认后通过电话联系您
        </p>

        {createdBooking && (
          <div style={{
            width: '100%', maxWidth: 360, padding: 16, borderRadius: 12,
            background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.1)',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>预约编号：{createdBooking.bookingId}</div>
            <div style={{ fontSize: 15, color: '#f8fafc', fontWeight: 600, marginBottom: 4 }}>{createdBooking.storeName}</div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              {createdBooking.date} {createdBooking.slotLabel}
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              {createdBooking.guestCount}人 · {createdBooking.contactName}
            </div>
          </div>
        )}

        <button
          onClick={handleReset}
          style={{
            padding: '12px 32px', borderRadius: 12,
            background: '#334155', border: 'none',
            color: '#e2e8f0', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          继续预约
        </button>
      </section>
    </main>
  );
}
