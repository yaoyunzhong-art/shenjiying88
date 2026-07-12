/**
 * 团队预约 — P-38 Group Booking (前台自助预约)
 * 角色: 🤝 团建顾客
 * 功能: 选择活动类型、选择日期时间、填写人数、提交预约
 */
'use client';

import React, { useState } from 'react';

import {
  PageShell,
  Button,
  Card,
  Tag,
  Input,
  Select,
} from '@m5/ui';

// ============================================================
// 类型
// ============================================================

type BookingStep = 'select-type' | 'date-time' | 'info' | 'confirm' | 'success';

interface ActivityType {
  id: string;
  name: string;
  icon: string;
  minPeople: number;
  maxPeople: number;
  pricePerPerson: number;
  duration: string;
}

interface TimeSlot {
  id: string;
  label: string;
  available: boolean;
}

// ============================================================
// 常量
// ============================================================

const ACTIVITIES: ActivityType[] = [
  { id: 'arcade', name: '游戏机畅玩', icon: '🎮', minPeople: 1, maxPeople: 50, pricePerPerson: 68, duration: '2h' },
  { id: 'birthday', name: '生日派对', icon: '🎂', minPeople: 5, maxPeople: 30, pricePerPerson: 128, duration: '3h' },
  { id: 'team', name: '团建活动', icon: '🤝', minPeople: 10, maxPeople: 100, pricePerPerson: 88, duration: '4h' },
  { id: 'vr', name: 'VR体验', icon: '🥽', minPeople: 1, maxPeople: 10, pricePerPerson: 98, duration: '1h' },
  { id: 'competition', name: '赛事组织', icon: '🏆', minPeople: 4, maxPeople: 64, pricePerPerson: 58, duration: '3h' },
  { id: 'party', name: '包场聚会', icon: '🎉', minPeople: 20, maxPeople: 200, pricePerPerson: 68, duration: '5h' },
];

const TIME_SLOTS: TimeSlot[] = [
  { id: '10:00', label: '10:00-12:00', available: true },
  { id: '12:00', label: '12:00-14:00', available: true },
  { id: '14:00', label: '14:00-16:00', available: true },
  { id: '16:00', label: '16:00-18:00', available: false },
  { id: '18:00', label: '18:00-20:00', available: true },
  { id: '20:00', label: '20:00-22:00', available: true },
];

// ============================================================
// 组件
// ============================================================

export default function GroupBookingPage() {
  const [step, setStep] = useState<BookingStep>('select-type');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 计算总价
  const totalPrice = selectedActivity
    ? selectedActivity.pricePerPerson * peopleCount
    : 0;

  // 选择活动
  const handleSelectActivity = (activity: ActivityType) => {
    setSelectedActivity(activity);
    setPeopleCount(activity.minPeople);
    setError(null);
    setStep('date-time');
  };

  // 提交预约
  const handleSubmit = () => {
    if (!contactName.trim()) { setError('请输入联系人姓名'); return; }
    if (!contactPhone.trim() || !/^1\d{10}$/.test(contactPhone)) { setError('请输入正确的手机号'); return; }

    setSubmitting(true);
    setError(null);

    setTimeout(() => {
      setSubmitting(false);
      setStep('success');
    }, 2000);
  };

  // 重新预约
  const handleReset = () => {
    setStep('select-type');
    setSelectedActivity(null);
    setSelectedDate('');
    setSelectedTime('');
    setPeopleCount(1);
    setContactName('');
    setContactPhone('');
    setRemark('');
    setError(null);
  };

  // ============================================================
  // Step 1: 选择活动类型
  // ============================================================
  if (step === 'select-type') {
    return (
      <main style={{ minHeight: '100vh', padding: '32px 16px', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 }}>团队预约 — P-38</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>选择活动类型开始预约</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {ACTIVITIES.map(act => (
              <button
                key={act.id}
                onClick={() => handleSelectActivity(act)}
                style={{
                  padding: '20px 16px',
                  borderRadius: 16,
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{act.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>{act.name}</div>
                <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>¥{act.pricePerPerson}/人</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{act.duration} · {act.minPeople}-{act.maxPeople}人</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // Step 2: 选择时间
  // ============================================================
  if (step === 'date-time') {
    return (
      <main style={{ minHeight: '100vh', padding: '32px 16px', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 480, width: '100%' }}>
          {/* 步骤进度 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
            <Tag style={{ background: '#34d399', color: '#0f172a', border: 'none', borderRadius: 12 }}>✅ 已选活动</Tag>
            <span style={{ color: '#64748b' }}>→</span>
            <Tag style={{ background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 12 }}>📅 选择时间</Tag>
          </div>

          {/* 已选活动回顾 */}
          {selectedActivity && (
            <Card style={{ borderRadius: 16, marginBottom: 24, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{selectedActivity.icon}</span>
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: 600 }}>{selectedActivity.name}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>¥{selectedActivity.pricePerPerson}/人 · {selectedActivity.duration}</div>
                </div>
              </div>
            </Card>
          )}

          {/* 日期选择 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>选择日期</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(30, 41, 59, 0.8)',
                border: selectedDate ? '1px solid #f59e0b60' : '1px solid rgba(148, 163, 184, 0.15)',
                color: '#f8fafc',
                fontSize: 16,
                outline: 'none',
              }}
            />
          </div>

          {/* 时段选择 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>选择时段</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => slot.available && setSelectedTime(slot.id)}
                  disabled={!slot.available}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    background: selectedTime === slot.id
                      ? 'rgba(245, 158, 11, 0.2)'
                      : slot.available
                        ? 'rgba(30, 41, 59, 0.8)'
                        : 'rgba(30, 41, 59, 0.4)',
                    border: selectedTime === slot.id
                      ? '2px solid #f59e0b'
                      : '1px solid rgba(148, 163, 184, 0.12)',
                    cursor: slot.available ? 'pointer' : 'not-allowed',
                    color: slot.available ? '#e2e8f0' : '#475569',
                    fontSize: 14,
                  }}
                >
                  {slot.label}
                  {!slot.available && <span style={{ fontSize: 11, display: 'block', color: '#475569' }}>已满</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 人数 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              参与人数 {selectedActivity && `(${selectedActivity.minPeople}-${selectedActivity.maxPeople}人)`}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setPeopleCount(Math.max(selectedActivity?.minPeople ?? 1, peopleCount - 1))}
                style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  color: '#f8fafc', fontSize: 22, cursor: 'pointer',
                }}
              >−</button>
              <div style={{
                flex: 1, textAlign: 'center', padding: '12px',
                borderRadius: 10, background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                color: '#fbbf24', fontSize: 20, fontWeight: 700,
              }}>
                {peopleCount}
              </div>
              <button
                onClick={() => setPeopleCount(Math.min(selectedActivity?.maxPeople ?? 200, peopleCount + 1))}
                style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  color: '#f8fafc', fontSize: 22, cursor: 'pointer',
                }}
              >+</button>
            </div>
          </div>

          {error && (
            <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginBottom: 16, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <Button
            block
            disabled={!selectedDate || !selectedTime}
            onClick={() => { if (!selectedDate) { setError('请选择日期'); return; } if (!selectedTime) { setError('请选择时段'); return; } setStep('info'); }}
            style={{
              height: 52, borderRadius: 12, fontSize: 16, fontWeight: 600,
              background: selectedDate && selectedTime ? 'linear-gradient(135deg, #f59e0b, #d97706)' : undefined,
              border: 'none', color: '#0f172a',
            }}
          >
            下一步 · 填写联系信息
          </Button>
        </div>
      </main>
    );
  }

  // ============================================================
  // Step 3: 联系信息
  // ============================================================
  if (step === 'info') {
    return (
      <main style={{ minHeight: '100vh', padding: '32px 16px', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 480, width: '100%' }}>
          <Tag style={{ background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 12, marginBottom: 20, display: 'inline-block' }}>
            📝 填写联系信息
          </Tag>

          {/* 预约摘要 */}
          <Card style={{ borderRadius: 16, marginBottom: 24, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
              <span>活动</span><span style={{ color: '#f8fafc' }}>{selectedActivity?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
              <span>时间</span><span style={{ color: '#f8fafc' }}>{selectedDate} {selectedTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
              <span>人数</span><span style={{ color: '#f8fafc' }}>{peopleCount}人</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.1)', color: '#94a3b8', fontSize: 14 }}>
              <span>预估价格</span><span style={{ color: '#fbbf24', fontSize: 22, fontWeight: 700 }}>¥{totalPrice}</span>
            </div>
          </Card>

          {/* 联系人 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>联系人姓名 *</label>
            <input
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="请输入姓名"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                color: '#f8fafc', fontSize: 16, outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>联系电话 *</label>
            <input
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="请输入手机号"
              maxLength={11}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                color: '#f8fafc', fontSize: 16, outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>备注</label>
            <textarea
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="如有特殊需求请在此备注（如生日装饰、饮食禁忌等）"
              rows={3}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                color: '#f8fafc', fontSize: 14, outline: 'none', resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginBottom: 16, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <Button
            block
            disabled={submitting}
            onClick={handleSubmit}
            style={{
              height: 52, borderRadius: 12, fontSize: 16, fontWeight: 600,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', color: '#0f172a',
            }}
          >
            {submitting ? '⏳ 提交中...' : '确认预约'}
          </Button>

          <Button block variant="outline" onClick={() => setStep('date-time')} disabled={submitting}
            style={{ marginTop: 12, color: '#64748b', borderColor: 'rgba(148,163,184,0.2)', height: 44, borderRadius: 10 }}>
            ← 返回修改
          </Button>
        </div>
      </main>
    );
  }

  // ============================================================
  // Step 5: 预约成功
  // ============================================================
  return (
    <main style={{ minHeight: '100vh', padding: '32px 16px', background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg, #34d39940, #05966920)',
          border: '3px solid #34d39960',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 44,
        }}>
          🎉
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>预约成功！</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>我们会尽快联系您确认预约详情</p>

        <Card style={{ borderRadius: 16, marginBottom: 24, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
            <span>活动</span><span style={{ color: '#f8fafc' }}>{selectedActivity?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
            <span>时间</span><span style={{ color: '#f8fafc' }}>{selectedDate} {selectedTime}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
            <span>人数</span><span style={{ color: '#f8fafc' }}>{peopleCount}人</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
            <span>联系人</span><span style={{ color: '#f8fafc' }}>{contactName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.1)', color: '#94a3b8', fontSize: 13 }}>
            <span>联系人电话</span><span style={{ color: '#f8fafc' }}>{contactPhone}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.1)', color: '#94a3b8', fontSize: 14 }}>
            <span>预估总价</span><span style={{ color: '#fbbf24', fontSize: 22, fontWeight: 700 }}>¥{totalPrice}</span>
          </div>
        </Card>

        <Button
          block
          onClick={handleReset}
          style={{
            height: 48, borderRadius: 12, fontSize: 16, fontWeight: 600,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none', color: '#0f172a', marginBottom: 12,
          }}
        >
          继续预约
        </Button>
        <Button block variant="outline" onClick={() => window.location.href = '/'}
          style={{ borderColor: 'rgba(148,163,184,0.2)', color: '#94a3b8', height: 48, borderRadius: 12 }}>
          返回首页
        </Button>
      </div>
    </main>
  );
}
