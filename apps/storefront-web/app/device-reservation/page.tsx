/**
 * 设备预定 — P-39 Device Reservation (前台自助)
 * 角色: 🎮 导玩员/顾客
 * 功能: 选择设备类型、查看可用时段、选择时间段、提交预定
 */
'use client';

import React, { useState } from 'react';

import {
  PageShell,
  Button,
  Card,
  Tag,
} from '@m5/ui';

// ============================================================
// 类型
// ============================================================

type DeviceStep = 'category' | 'select' | 'time' | 'confirm' | 'success';

interface DeviceCategory {
  id: string;
  name: string;
  icon: string;
  devices: Device[];
}

interface Device {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'maintenance';
  pricePerHour: number;
  maxDuration: number;
}

interface TimeSlot {
  id: string;
  label: string;
  available: boolean;
}

// ============================================================
// 常量
// ============================================================

const CATEGORIES: DeviceCategory[] = [
  {
    id: 'arcade', name: '街机', icon: '🕹️',
    devices: [
      { id: 'arcade-1', name: '街机A区 (1-8号)', status: 'available', pricePerHour: 20, maxDuration: 4 },
      { id: 'arcade-2', name: '街机B区 (9-16号)', status: 'available', pricePerHour: 20, maxDuration: 4 },
      { id: 'arcade-3', name: '街机C区 (17-24号)', status: 'busy', pricePerHour: 20, maxDuration: 4 },
    ],
  },
  {
    id: 'vr', name: 'VR体验', icon: '🥽',
    devices: [
      { id: 'vr-1', name: 'VR体验室1', status: 'available', pricePerHour: 48, maxDuration: 2 },
      { id: 'vr-2', name: 'VR体验室2', status: 'available', pricePerHour: 48, maxDuration: 2 },
      { id: 'vr-3', name: 'VR体验室3', status: 'maintenance', pricePerHour: 48, maxDuration: 2 },
    ],
  },
  {
    id: 'sim', name: '模拟机', icon: '🎯',
    devices: [
      { id: 'sim-1', name: '射击模拟器', status: 'available', pricePerHour: 38, maxDuration: 3 },
      { id: 'sim-2', name: '赛车模拟器', status: 'available', pricePerHour: 38, maxDuration: 3 },
      { id: 'sim-3', name: '舞蹈模拟器', status: 'available', pricePerHour: 38, maxDuration: 3 },
      { id: 'sim-4', name: '篮球模拟器', status: 'busy', pricePerHour: 38, maxDuration: 3 },
    ],
  },
  {
    id: 'billiard', name: '台球桌', icon: '🎱',
    devices: [
      { id: 'bil-1', name: '台球桌1号', status: 'available', pricePerHour: 30, maxDuration: 3 },
      { id: 'bil-2', name: '台球桌2号', status: 'available', pricePerHour: 30, maxDuration: 3 },
    ],
  },
  {
    id: 'kart', name: '卡丁车', icon: '🏎️',
    devices: [
      { id: 'kart-1', name: '卡丁车A道', status: 'available', pricePerHour: 68, maxDuration: 1 },
      { id: 'kart-2', name: '卡丁车B道', status: 'maintenance', pricePerHour: 68, maxDuration: 1 },
    ],
  },
  {
    id: 'board', name: '桌游区', icon: '🎲',
    devices: [
      { id: 'board-1', name: '桌游包间1', status: 'available', pricePerHour: 25, maxDuration: 4 },
      { id: 'board-2', name: '桌游包间2', status: 'available', pricePerHour: 25, maxDuration: 4 },
      { id: 'board-3', name: '桌游大厅', status: 'busy', pricePerHour: 15, maxDuration: 4 },
    ],
  },
];

const STATUS_LABELS: Record<string, string> = {
  available: '可预约',
  busy: '已占用',
  maintenance: '维护中',
};

const STATUS_COLORS: Record<string, string> = {
  available: '#34d399',
  busy: '#f87171',
  maintenance: '#fbbf24',
};

// ============================================================
// 组件
// ============================================================

export default function DeviceReservationPage() {
  const [step, setStep] = useState<DeviceStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = CATEGORIES.find(c => c.id === selectedCategory);
  const totalPrice = selectedDevice ? selectedDevice.pricePerHour * selectedDuration : 0;

  // 选择类别
  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
    setSelectedDevice(null);
    setError(null);
    setStep('select');
  };

  // 选择设备
  const handleDeviceSelect = (device: Device) => {
    if (device.status !== 'available') {
      setError(`${device.name} 当前${STATUS_LABELS[device.status]}，请选择其他设备`);
      return;
    }
    setSelectedDevice(device);
    setError(null);
    setStep('time');
  };

  // 提交
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

  // 重置
  const handleReset = () => {
    setStep('category');
    setSelectedCategory(null);
    setSelectedDevice(null);
    setSelectedDuration(1);
    setContactName('');
    setContactPhone('');
    setError(null);
  };

  // ============================================================
  // Step 1: 选择设备类别
  // ============================================================
  if (step === 'category') {
    return (
      <main style={{ minHeight: '100vh', padding: '32px 16px', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎮</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 }}>设备预定 — P-39</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>选择设备类别</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  padding: '20px 12px', borderRadius: 16,
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{cat.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{cat.devices.filter(d => d.status === 'available').length}台可用</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // Step 2: 选择设备
  // ============================================================
  if (step === 'select') {
    return (
      <main style={{ minHeight: '100vh', padding: '32px 16px', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          <Tag style={{ background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 12, marginBottom: 16, display: 'inline-block' }}>
            {category?.icon} {category?.name}
          </Tag>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {category?.devices.map(device => (
              <button
                key={device.id}
                onClick={() => handleDeviceSelect(device)}
                disabled={device.status !== 'available'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px', borderRadius: 14,
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  cursor: device.status === 'available' ? 'pointer' : 'not-allowed',
                  opacity: device.status === 'available' ? 1 : 0.6,
                  textAlign: 'left', width: '100%',
                }}
              >
                <span style={{ fontSize: 24 }}>{category?.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15 }}>{device.name}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>¥{device.pricePerHour}/时</div>
                </div>
                <Tag style={{
                  background: `${STATUS_COLORS[device.status]}20`,
                  color: STATUS_COLORS[device.status],
                  border: `1px solid ${STATUS_COLORS[device.status]}40`,
                  borderRadius: 8, fontSize: 11, fontWeight: 500,
                }}>
                  {STATUS_LABELS[device.status]}
                </Tag>
              </button>
            ))}
          </div>

          <Button block variant="outline" onClick={() => setStep('category')}
            style={{ marginTop: 16, color: '#64748b', borderColor: 'rgba(148,163,184,0.2)', height: 44, borderRadius: 10 }}>
            ← 返回选择类别
          </Button>
        </div>
      </main>
    );
  }

  // ============================================================
  // Step 3: 选择时长+联系信息
  // ============================================================
  if (step === 'time') {
    return (
      <main style={{ minHeight: '100vh', padding: '32px 16px', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 480, width: '100%' }}>
          <Tag style={{ background: '#34d399', color: '#0f172a', border: 'none', borderRadius: 12, marginBottom: 20, display: 'inline-block' }}>
            ✅ {selectedDevice?.name}
          </Tag>

          {/* 已选设备 */}
          <Card style={{ borderRadius: 16, marginBottom: 20, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 13 }}>
              <span>设备</span><span style={{ color: '#f8fafc' }}>{selectedDevice?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
              <span>单价</span><span style={{ color: '#fbbf24', fontWeight: 600 }}>¥{selectedDevice?.pricePerHour}/时</span>
            </div>
          </Card>

          {/* 时长选择 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              选择时长 (最多{selectedDevice?.maxDuration}小时)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: selectedDevice?.maxDuration ?? 4 }, (_, i) => i + 1).map(h => (
                <button
                  key={h}
                  onClick={() => setSelectedDuration(h)}
                  style={{
                    flex: 1, padding: '14px 8px', borderRadius: 10, textAlign: 'center',
                    background: selectedDuration === h ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                    border: selectedDuration === h ? '2px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.12)',
                    color: selectedDuration === h ? '#fbbf24' : '#94a3b8',
                    fontSize: 16, fontWeight: selectedDuration === h ? 700 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* 联系人 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>联系人姓名 *</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)}
              placeholder="请输入姓名"
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#f8fafc', fontSize: 16, outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>联系电话 *</label>
            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
              placeholder="请输入手机号" maxLength={11}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', color: '#f8fafc', fontSize: 16, outline: 'none' }}
            />
          </div>

          {/* 总价 */}
          <Card style={{ borderRadius: 16, marginBottom: 16, background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>预估费用</span>
              <span style={{ color: '#fbbf24', fontSize: 24, fontWeight: 700 }}>¥{totalPrice}</span>
            </div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              {selectedDuration}小时 × ¥{selectedDevice?.pricePerHour}/时
            </div>
          </Card>

          {error && (
            <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginBottom: 16, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</div>
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
            {submitting ? '⏳ 提交中...' : '确认预定'}
          </Button>

          <Button block variant="outline" onClick={() => setStep('select')} disabled={submitting}
            style={{ marginTop: 12, color: '#64748b', borderColor: 'rgba(148,163,184,0.2)', height: 44, borderRadius: 10 }}>
            ← 返回选择设备
          </Button>
        </div>
      </main>
    );
  }

  // ============================================================
  // Step 5: 预定成功
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
        }}>🎮</div>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>预定成功！</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>设备已为您保留，请按时到店使用</p>

        <Card style={{ borderRadius: 16, marginBottom: 24, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
            <span>设备</span><span style={{ color: '#f8fafc' }}>{selectedDevice?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
            <span>时长</span><span style={{ color: '#f8fafc' }}>{selectedDuration}小时</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
            <span>联系人</span><span style={{ color: '#f8fafc' }}>{contactName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.1)', color: '#94a3b8', fontSize: 13 }}>
            <span>联系电话</span><span style={{ color: '#f8fafc' }}>{contactPhone}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.1)', color: '#94a3b8', fontSize: 14 }}>
            <span>预估费用</span><span style={{ color: '#fbbf24', fontSize: 20, fontWeight: 700 }}>¥{totalPrice}</span>
          </div>
        </Card>

        <Button block onClick={handleReset}
          style={{ height: 48, borderRadius: 12, fontSize: 16, fontWeight: 600, background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#0f172a', marginBottom: 12 }}>
          继续预定
        </Button>
        <Button block variant="outline" onClick={() => window.location.href = '/'}
          style={{ borderColor: 'rgba(148,163,184,0.2)', color: '#94a3b8', height: 48, borderRadius: 12 }}>
          返回首页
        </Button>
      </div>
    </main>
  );
}
