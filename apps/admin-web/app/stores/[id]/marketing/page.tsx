// 📢 营销管理 · 优惠券/推广/会员营销 · 完整营销管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, Progress, Modal, message, Input } from '@m5/ui';

const CAMPAIGNS = [
  { id:'C001', name:'新会员首充有礼', type:'充值', status:'active', start:'2026-07-01', end:'2026-07-31', budget:5000, used:3200, channel:'小程序' },
  { id:'C002', name:'暑期畅玩卡', type:'会员卡', status:'active', start:'2026-07-01', end:'2026-08-31', budget:20000, used:8500, channel:'到店' },
  { id:'C003', name:'分享有礼活动', type:'推广', status:'active', start:'2026-07-05', end:'2026-07-20', budget:3000, used:1800, channel:'社交' },
  { id:'C004', name:'教师节特别活动', type:'节日', status:'scheduled', start:'2026-09-10', end:'2026-09-10', budget:2000, used:0, channel:'全部' },
  { id:'C005', name:'短视频团购券', type:'推广', status:'active', start:'2026-07-01', end:'2026-07-31', budget:15000, used:9800, channel:'抖音' },
  { id:'C006', name:'会员积分兑换', type:'会员', status:'ended', start:'2026-06-01', end:'2026-06-30', budget:8000, used:7600, channel:'小程序' },
  { id:'C007', name:'七夕情侣套餐', type:'节日', status:'scheduled', start:'2026-08-10', end:'2026-08-10', budget:3000, used:0, channel:'全部' },
  { id:'C008', name:'充值满赠活动', type:'充值', status:'active', start:'2026-07-10', end:'2026-07-25', budget:5000, used:1200, channel:'到店' },
];

const TYPE_COLORS: Record<string, string> = { 充值:'#6366f1', 推广:'#f59e0b', 会员:'#8b5cf6', 节日:'#ef4444', 会员卡:'#10b981' };
const STATUS_CFG: Record<string, [string, string]> = { active:['green','进行中'], scheduled:['blue','待开始'], ended:['default','已结束'] };

const COLUMNS = [
  { title:'活动名称', dataIndex:'name' },
  { title:'类型', dataIndex:'type', render:(v:string)=><Tag color={TYPE_COLORS[v]||'default'}>{v}</Tag> },
  { title:'渠道', dataIndex:'channel', render:(v:string)=><Tag>{v}</Tag> },
  { title:'预算', dataIndex:'budget', render:(v:number)=>`¥${v.toLocaleString()}` },
  { title:'已使用', dataIndex:'used', render:(v:number)=>`¥${v.toLocaleString()}` },
  { title:'消耗率', key:'rate', render:(_:unknown,r:typeof CAMPAIGNS[0])=><Progress percent={r.budget>0?Math.round(r.used/r.budget*100):0} size="small" strokeColor={r.used/r.budget>0.7?'#f59e0b':'#34d399'} style={{width:80}}/> },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_CFG[v]?.[0]||'default'}>{STATUS_CFG[v]?.[1]||v}</Tag> },
  { title:'起止', key:'period', render:(_:unknown,r:typeof CAMPAIGNS[0])=><>{r.start}~{r.end}</> },
];

export default function MarketingPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const filtered = statusFilter === 'all' ? CAMPAIGNS : CAMPAIGNS.filter(c => c.status === statusFilter);
  const totalBudget = CAMPAIGNS.reduce((s, c) => s + c.budget, 0);
  const totalUsed = CAMPAIGNS.reduce((s, c) => s + c.used, 0);
  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>📢 营销管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>优惠券 · 推广 · 会员营销</span></div>
          <Button type="primary" onClick={() => setShowCreate(true)}>+ 创建活动</Button>
        </div>
        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="进行中" value={CAMPAIGNS.filter(c => c.status === 'active').length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="总投入" value={totalBudget.toLocaleString()} prefix="¥" valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="已消耗" value={totalUsed.toLocaleString()} prefix="¥" valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="使用率" value={`${totalBudget > 0 ? Math.round(totalUsed / totalBudget * 100) : 0}%`} valueStyle={{ color: totalUsed / totalBudget > 0.5 ? '#f59e0b' : '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="待启动" value={CAMPAIGNS.filter(c => c.status === 'scheduled').length} valueStyle={{ color: '#60a5fa' }} /></Card></Col>
        </Row>
        <Card>
          <Space style={{ marginBottom: 12, gap: 8 }} wrap>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 110 }}
              options={[{ value: 'all', label: '全部' }, { value: 'active', label: '进行中' }, { value: 'scheduled', label: '待开始' }, { value: 'ended', label: '已结束' }]} />
          </Space>
          <Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{ pageSize: 8 }} />
        </Card>
        <Card size="small">
          <Space><Button>优惠券管理</Button><Button>投放渠道</Button><Button>效果分析</Button></Space>
        </Card>
        <Modal title="创建营销活动" open={showCreate} onCancel={() => setShowCreate(false)}
          onOk={() => { message.success('活动已创建'); setShowCreate(false); }} width={500}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="活动名称" />
            <Select placeholder="类型" style={{ width: '100%' }}>
              <Select.Option value="推广">推广</Select.Option>
              <Select.Option value="充值">充值</Select.Option>
              <Select.Option value="会员">会员</Select.Option>
            </Select>
            <Select placeholder="渠道" style={{ width: '100%' }}>
              <Select.Option value="小程序">小程序</Select.Option>
              <Select.Option value="到店">到店</Select.Option>
              <Select.Option value="抖音">抖音</Select.Option>
            </Select>
            <Input placeholder="开始日期" type="date" />
            <Input placeholder="结束日期" type="date" />
            <Input placeholder="预算" type="number" />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
