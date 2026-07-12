/**
 * 门店管理 — Store Manager (admin-web)
 * 角色: 👔店长
 * 功能: 门店基本信息、营业状态、营业时间管理
 */
'use client';

import React, { useState } from 'react';
import {
  PageShell,
  Button,
  Card,
  Tag,
  Input,
} from '@m5/ui';

export default function StoreManagerPage() {
  const [name, setName] = useState('神机营电竞乐园 · 旗舰店');
  const [address] = useState('北京市朝阳区建国路88号');
  const [phone, setPhone] = useState('010-88886666');
  const [hours] = useState('10:00-22:00');
  const [status] = useState<'active' | 'maintenance' | 'closed'>('active');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  const statusLabel = { active: '营业中', maintenance: '维护中', closed: '已关闭' };
  const statusColor = { active: '#34d399', maintenance: '#fbbf24', closed: '#f87171' };

  return (
    <PageShell title="门店管理">
      <div style={{ maxWidth: 600 }}>
        <Card style={{ borderRadius: 16, marginBottom: 16, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 600, margin: 0 }}>{name}</h2>
            <Tag style={{ background: `${statusColor[status]}20`, color: statusColor[status], border: `1px solid ${statusColor[status]}40`, borderRadius: 8 }}>
              {statusLabel[status]}
            </Tag>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>门店名称</label>
            <Input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>地址</label>
            <Input value={address} disabled style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>联系电话</label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>营业时间</label>
            <Input value={hours} disabled style={{ width: '100%' }} />
          </div>
          <Button onClick={handleSave} loading={saving} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#0f172a', fontWeight: 600 }}>
            保存修改
          </Button>
        </Card>
      </div>
    </PageShell>
  );
}
