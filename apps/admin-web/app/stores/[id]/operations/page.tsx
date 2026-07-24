// ⚙️ 运营管理 · 营业参数/客流/开关店
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, InputNumber, Switch, Input, Modal, message, Select, Progress, Tabs, Divider, Empty } from '@m5/ui';
import { AdminPermissionGate } from '../../../components/admin-permission-gate';

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
  { key: 'weekend_peak_start', label: '周末高峰开始', type: 'time', value: '10:00', desc: '周末高峰时段起始', category: '客流' },
  { key: 'weekend_peak_end', label: '周末高峰结束', type: 'time', value: '21:00', desc: '周末高峰时段结束', category: '客流' },
  { key: 'min_group_size', label: '团预约最低人数', type: 'number', value: 10, desc: '团体预约最低人数要求', category: '营业' },
];

const CATEGORIES = ['营业时间', '客流', '财务', '自动化', '优惠', '营业'];
const grouped = (cats: string[]) => cats.map(c => ({ category: c, items: SETTINGS.filter(s => s.category === c) }));

const REAL_TIME = [
  { label:'当前客流', value:156, suffix:'人', color:'#fbbf24' },
  { label:'当前上座率', value:'65%', suffix:'', color:'#34d399' },
  { label:'今日总客流', value:328, suffix:'人', color:'#6366f1' },
  { label:'峰值时段', value:'14-16', suffix:'', color:'#f59e0b' },
  { label:'今日营收', value:12800, prefix:'¥', color:'#34d399' },
];

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '门店运营参数访问受限',
  description:
    '门店运营参数页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看营业参数、实时统计与配置变更。',
} as const;

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<string>('营业时间');
  const [showEdit, setShowEdit] = useState<Setting | null>(null);
  const [saved, setSaved] = useState(false);

  const handleEdit = (s: Setting) => setShowEdit(s);
  const handleSave = () => { setSaved(true); message.success('所有设置已保存'); };

  return (
    <AdminPermissionGate {...permissionGate}>
      <PageShell>
        <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>⚙️ 运营管理</h2>

          <Row gutter={16}>
            {REAL_TIME.map(rt => (
              <Col key={rt.label} span={4}>
                <Card size="small">
                  <Statistic title={rt.label}
                    value={rt.prefix ? `${rt.prefix}${rt.value}` : rt.suffix ? `${rt.value}${rt.suffix}` : rt.value}
                    valueStyle={{ color: rt.color }} />
                </Card>
              </Col>
            ))}
          </Row>

          <Card>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #1e293b', paddingBottom: 8 }}>
              {CATEGORIES.map(t => (
                <div key={t} onClick={() => setActiveTab(t)} style={{
                  padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14,
                  background: activeTab === t ? '#334155' : 'transparent', color: activeTab === t ? '#f8fafc' : '#94a3b8',
                  transition: 'all 0.2s',
                }}>{t}</div>
              ))}
            </div>

            {grouped(CATEGORIES).filter(g => g.category === activeTab).map(g => (
              <div key={g.category}>
                {g.items.map(s => (
                  <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(148,163,184,0.08)', cursor: 'pointer' }}
                    onClick={() => handleEdit(s)}>
                    <div>
                      <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{s.label}</div>
                      <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#fbbf24', fontSize: 16, fontWeight: 600 }}>
                        {s.type === 'switch' ? (s.value ? '🟢 已开启' : '🔴 已关闭') :
                         s.type === 'number' ? (typeof s.value === 'number' && s.value < 1 ? `${(s.value * 100).toFixed(0)}%` : s.value) :
                         String(s.value)}
                      </span>
                      <Button size="small" type="link" onClick={(e) => { e.stopPropagation(); handleEdit(s); }}>编辑</Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </Card>

          <Card>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <div>
                <Tag color={saved ? 'green' : 'default'} style={{ marginRight: 8 }}>配置状态: {saved ? '已保存' : '有未保存修改'}</Tag>
                <span style={{ color: '#64748b', fontSize: 12 }}>共 {SETTINGS.length} 项配置 · {CATEGORIES.length} 个分类</span>
              </div>
              <Space>
                <Button onClick={() => { message.info('已重置未保存修改'); setSaved(false); }}>重置</Button>
                <Button>恢复默认</Button>
                <Button>导出配置</Button>
                <Button type="primary" onClick={handleSave}>保存全部</Button>
              </Space>
            </Space>
          </Card>

          <Modal title={`编辑参数 - ${showEdit?.label || ''}`} open={!!showEdit} onCancel={() => setShowEdit(null)} onOk={() => { message.success(`参数 [${showEdit?.label}] 已更新`); setShowEdit(null); setSaved(false); }} okText="保存">
            {showEdit && <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ background: 'rgba(148,163,184,0.06)', borderRadius: 8, padding: 12 }}>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>说明</div>
                <div style={{ color: '#e2e8f0', fontSize: 14 }}>{showEdit.desc}</div>
              </div>
              <Divider />
              <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>当前值</div>
              {showEdit.type === 'switch'
                ? <Select value={showEdit.value ? 'true' : 'false'} style={{ width: 120 }}>
                    <Select.Option value="true">开启</Select.Option>
                    <Select.Option value="false">关闭</Select.Option>
                  </Select>
                : showEdit.type === 'number'
                  ? <InputNumber style={{ width: '100%' }} value={showEdit.value} />
                  : <Input value={String(showEdit.value)} />}
            </Space>}
          </Modal>
        </Space>
      </PageShell>
    </AdminPermissionGate>
  );
}
