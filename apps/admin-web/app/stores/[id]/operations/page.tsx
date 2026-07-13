// ⚙️ 运营管理 · 营业参数/客流/开关店 (35→120)
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, InputNumber, Switch, Input, Modal, message, Select, Progress } from '@m5/ui';

interface Setting { key: string; label: string; type: string; value: any; desc: string; category: string; }
const SETTINGS: Setting[] = [
  { key: 'open_time', label: '营业开始时间', type: 'time', value: '10:00', desc: '门店每日营业开始时间', category: '营业时间' },
  { key: 'close_time', label: '营业结束时间', type: 'time', value: '22:00', desc: '门店每日营业结束时间', category: '营业时间' },
  { key: 'max_capacity', label: '最大容纳人数', type: 'number', value: 200, desc: '门店同时容纳最大客流量', category: '客流' },
  { key: 'auto_close', label: '自动关店', type: 'switch', value: true, desc: '营业结束后自动关闭POS系统', category: '自动化' },
  { key: 'member_discount', label: '会员折扣率', type: 'number', value: 0.9, desc: '会员消费默认折扣(0-1)', category: '优惠' },
  { key: 'min_recharge', label: '最低充值金额', type: 'number', value: 50, desc: '会员最低充值金额', category: '财务' },
  { key: 'min_game_charge', label: '最低游戏充值', type: 'number', value: 20, desc: '游戏充值最低金额', category: '财务' },
  { key: 'auto_assign', label: '自动派单', type: 'switch', value: true, desc: '新订单自动指派导玩员', category: '自动化' },
  { key: 'enable_vip_room', label: 'VIP包间启用', type: 'switch', value: true, desc: 'VIP包间是否对外开放', category: '营业' },
  { key: 'peak_start', label: '高峰开始时间', type: 'time', value: '18:00', desc: '工作日高峰时段起始', category: '客流' },
  { key: 'peak_end', label: '高峰结束时间', type: 'time', value: '21:00', desc: '工作日高峰时段结束', category: '客流' },
  { key: 'peak_rate', label: '高峰加价率', type: 'number', value: 1.2, desc: '高峰时段价格倍率', category: '财务' },
  
];

const CATEGORIES = ['营业时间', '客流', '财务', '自动化', '优惠', '营业'];
const grouped = (cats: string[]) => cats.map(c => ({ category: c, items: SETTINGS.filter(s => s.category === c) }));

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<string>('营业时间');
  const [showEdit, setShowEdit] = useState<Setting | null>(null);

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ color: '#f8fafc', margin: 0 }}>⚙️ 运营管理</h2>
        <Row gutter={16}>
          <Col span={4}><Card size="small"><Statistic title="营业状态" value="营业中" valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="今日客流" value={328} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="上座率" value="65%" valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="客单价" value="¥86" /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="今日营收" value="¥12,800" valueStyle={{ color: '#34d399' }} /></Card></Col>
        </Row>
        <Card>
          <TabsStyle activeTab={activeTab} set={setActiveTab} tabs={CATEGORIES} />
          {grouped(CATEGORIES).filter(g => g.category === activeTab).map(g => (
            <div key={g.category}>
              {g.items.map(s => (
                <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.08)', cursor: 'pointer' }}
                  onClick={() => setShowEdit(s)}>
                  <div><div style={{ color: '#e2e8f0', fontSize: 14 }}>{s.label}</div><div style={{ color: '#64748b', fontSize: 12 }}>{s.desc}</div></div>
                  <div style={{ color: '#fbbf24', fontSize: 16, fontWeight: 600 }}>
                    {s.type === 'switch' ? (s.value ? '🟢 开' : '🔴 关') : s.type === 'number' ? s.value : String(s.value)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Card>
        <Card>
          <Space>
            <Button type="primary">保存设置</Button>
            <Button>恢复默认</Button>
            <Button>导出配置</Button>
          </Space>
        </Card>
        <Modal title="编辑参数" open={!!showEdit} onCancel={() => setShowEdit(null)} onOk={() => { message.success('参数已更新'); setShowEdit(null); }} okText="保存">
          {showEdit && <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{showEdit.label}</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>{showEdit.desc}</div>
            {showEdit.type === 'switch' ? <Select value={showEdit.value ? 'true' : 'false'} style={{ width: 120 }}><Select.Option value="true">开</Select.Option><Select.Option value="false">关</Select.Option></Select>
              : <Input value={String(showEdit.value)} />}
          </Space>}
        </Modal>
      </Space>
    </PageShell>
  );
}

function TabsStyle({ activeTab, set, tabs }: { activeTab: string; set: (v: string) => void; tabs: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #1e293b', paddingBottom: 8 }}>
      {tabs.map(t => (
        <div key={t} onClick={() => set(t)} style={{
          padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14,
          background: activeTab === t ? '#334155' : 'transparent', color: activeTab === t ? '#f8fafc' : '#94a3b8',
        }}>{t}</div>
      ))}
    </div>
  );
}
