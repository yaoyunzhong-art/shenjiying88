// 📢 营销管理 · 优惠券/推广/会员营销 · 完整营销管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Select, Progress, Modal, message, Input, Tabs, Empty, Divider } from '@m5/ui';

const CAMPAIGNS = [
  { id:'C001', name:'新会员首充有礼', type:'充值', status:'active', start:'2026-07-01', end:'2026-07-31', budget:5000, used:3200, channel:'小程序', roi:'64%', audience:'新会员' },
  { id:'C002', name:'暑期畅玩卡', type:'会员卡', status:'active', start:'2026-07-01', end:'2026-08-31', budget:20000, used:8500, channel:'到店', roi:'42%', audience:'全体会员' },
  { id:'C003', name:'分享有礼活动', type:'推广', status:'active', start:'2026-07-05', end:'2026-07-20', budget:3000, used:1800, channel:'社交', roi:'60%', audience:'老客' },
  { id:'C004', name:'教师节特别活动', type:'节日', status:'scheduled', start:'2026-09-10', end:'2026-09-10', budget:2000, used:0, channel:'全部', roi:'-', audience:'教师群体' },
  { id:'C005', name:'短视频团购券', type:'推广', status:'active', start:'2026-07-01', end:'2026-07-31', budget:15000, used:9800, channel:'抖音', roi:'65%', audience:'新客' },
  { id:'C006', name:'会员积分兑换', type:'会员', status:'ended', start:'2026-06-01', end:'2026-06-30', budget:8000, used:7600, channel:'小程序', roi:'95%', audience:'全会员' },
  { id:'C007', name:'七夕情侣套餐', type:'节日', status:'scheduled', start:'2026-08-10', end:'2026-08-10', budget:3000, used:0, channel:'全部', roi:'-', audience:'情侣人群' },
  { id:'C008', name:'充值满赠活动', type:'充值', status:'active', start:'2026-07-10', end:'2026-07-25', budget:5000, used:1200, channel:'到店', roi:'24%', audience:'高频用户' },
  { id:'C009', name:'老客带新券', type:'推广', status:'active', start:'2026-07-12', end:'2026-07-30', budget:4000, used:600, channel:'社交', roi:'15%', audience:'老客' },
  { id:'C010', name:'开学季学生卡', type:'会员卡', status:'scheduled', start:'2026-08-20', end:'2026-09-10', budget:10000, used:0, channel:'抖音+到店', roi:'-', audience:'学生群体' },
];

const COUPONS = [
  { id:'CP-001', name:'满100减20', type:'满减', total:500, claimed:320, used:180, rate:'56%', expiry:'2026-07-31' },
  { id:'CP-002', name:'新客8折券', type:'折扣', total:300, claimed:240, used:155, rate:'65%', expiry:'2026-07-31' },
  { id:'CP-003', name:'饮品买一送一', type:'兑换', total:200, claimed:150, used:98, rate:'65%', expiry:'2026-07-20' },
  { id:'CP-004', name:'满200减50', type:'满减', total:200, claimed:85, used:42, rate:'49%', expiry:'2026-08-15' },
];

const TYPE_COLORS: Record<string, string> = { 充值:'#6366f1', 推广:'#f59e0b', 会员:'#8b5cf6', 节日:'#ef4444', 会员卡:'#10b981' };
const STATUS_CFG: Record<string, [string, string]> = { active:['green','进行中'], scheduled:['blue','待开始'], ended:['default','已结束'] };

const activeCount = CAMPAIGNS.filter(c => c.status === 'active').length;
const totalBudget = CAMPAIGNS.reduce((s, c) => s + c.budget, 0);
const totalUsed = CAMPAIGNS.reduce((s, c) => s + c.used, 0);
const useRate = totalBudget > 0 ? Math.round(totalUsed / totalBudget * 100) : 0;

export default function MarketingPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<typeof CAMPAIGNS[0] | null>(null);
  const [tabKey, setTabKey] = useState('campaigns');

  const types = [...new Set(CAMPAIGNS.map(c => c.type))];

  const filtered = useMemo(() => {
    let list = CAMPAIGNS;
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    if (typeFilter !== 'all') list = list.filter(c => c.type === typeFilter);
    return list;
  }, [statusFilter, typeFilter]);

  const typeDist = useMemo(() => types.map(t => ({
    type: t, count: CAMPAIGNS.filter(c => c.type === t).length, used: CAMPAIGNS.filter(c => c.type === t).reduce((s, c) => s + c.used, 0),
  })), []);

  const campaignCols = [
    { title: '活动名称', dataIndex: 'name', width: 160 },
    { title: '类型', dataIndex: 'type', width: 70, render: (v: string) => <Tag color={TYPE_COLORS[v]||'default'} size="small">{v}</Tag> },
    { title: '渠道', dataIndex: 'channel', width: 90, render: (v: string) => <Tag size="small">{v}</Tag> },
    { title: '预算', dataIndex: 'budget', width: 80, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '已消耗', dataIndex: 'used', width: 80, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '消耗率', key: 'rate', width: 100, render: (_: unknown, r: typeof CAMPAIGNS[0]) => {
      const pct = r.budget > 0 ? Math.round(r.used / r.budget * 100) : 0;
      return <Progress percent={pct} size="small" strokeColor={pct > 70 ? '#f59e0b' : '#34d399'} style={{width:80}} />;
    }},
    { title: '投放对象', dataIndex: 'audience', width: 80 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={STATUS_CFG[v]?.[0]||'default'} size="small">{STATUS_CFG[v]?.[1]||v}</Tag> },
    { title: '操作', key: 'a', width: 120, render: (_: unknown, r: typeof CAMPAIGNS[0]) => <Space size="small">
      <Button size="small" onClick={() => setShowDetail(r)}>详情</Button>
      {r.status !== 'ended' && <Button size="small" type="primary" ghost>编辑</Button>}
    </Space> },
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>📢 营销管理</h2></div>
          <Button type="primary" onClick={() => setShowCreate(true)}>+ 创建活动</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={3}><Card size="small"><Statistic title="进行中" value={activeCount} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="总投入" value={totalBudget.toLocaleString()} prefix="¥" /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="已消耗" value={totalUsed.toLocaleString()} prefix="¥" valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="消耗率" value={`${useRate}%`} valueStyle={{ color: useRate > 50 ? '#f59e0b' : '#34d399' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="待启动" value={CAMPAIGNS.filter(c => c.status === 'scheduled').length} valueStyle={{ color: '#60a5fa' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="优惠券" value={COUPONS.length} suffix="种" /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="领券率" value={COUPONS.length > 0 ? Math.round(COUPONS.reduce((s,c) => s + c.claimed, 0) / COUPONS.reduce((s,c) => s + c.total, 0) * 100) : 0} suffix="%" valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="核销率" value={COUPONS.length > 0 ? Math.round(COUPONS.reduce((s,c) => s + c.used, 0) / COUPONS.reduce((s,c) => s + c.claimed, 0) * 100) : 0} suffix="%" valueStyle={{ color: '#6366f1' }} /></Card></Col>
        </Row>

        <Tabs activeKey={tabKey} onChange={setTabKey} items={[
          { key: 'campaigns', label: `营销活动(${CAMPAIGNS.length})`,
            children: <Card>
              <Space style={{ marginBottom: 12, gap: 8, width:'100%' }} wrap>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 100 }}
                  options={[{ value: 'all', label: '全部' }, { value: 'active', label: '进行中' }, { value: 'scheduled', label: '待开始' }, { value: 'ended', label: '已结束' }]} />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>类型:</span>
                <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 100 }}
                  options={[{ value: 'all', label: '全部类型' }, ...types.map(t => ({ value: t, label: t }))]} />
                <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 13 }}>共 {filtered.length} 个活动</span>
              </Space>
              <Table dataSource={filtered} columns={campaignCols} rowKey="id" pagination={{ pageSize: 8 }} />
            </Card>
          },
          { key: 'coupons', label: `优惠券(${COUPONS.length})`,
            children: <Card>
              <Table dataSource={COUPONS} rowKey="id" columns={[
                { title:'券名', dataIndex:'name' }, { title:'类型', dataIndex:'type', render:(v:string)=><Tag>{v}</Tag> },
                { title:'发放/领取', key:'cl', render:(_:unknown,r:typeof COUPONS[0])=><>{r.claimed}/{r.total}</> },
                { title:'使用数', dataIndex:'used' }, { title:'核销率', dataIndex:'rate' },
                { title:'有效期', dataIndex:'expiry', render:(v:string)=><Tag color={new Date(v) < new Date()?'red':'green'} size="small">{v}</Tag> },
              ]} pagination={false} />
            </Card>
          },
          { key: 'stats', label: '分析概览',
            children: <Row gutter={16}>
              <Col span={12}>
                <Card title="各类型投入">
                  {typeDist.map(t => (
                    <div key={t.type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(148,163,184,0.08)' }}>
                      <Tag color={TYPE_COLORS[t.type]}>{t.type}</Tag>
                      <Space><span style={{color:'#e2e8f0'}}>{t.count}场</span><span style={{color:'#94a3b8'}}>¥{t.used.toLocaleString()}</span></Space>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="渠道分布">
                  {['小程序','到店','抖音','社交','全部'].map(ch => {
                    const cnt = CAMPAIGNS.filter(c => c.channel.includes(ch)).length;
                    return <div key={ch} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(148,163,184,0.08)' }}>
                      <span style={{color:'#e2e8f0'}}>{ch}</span>
                      <span style={{color:'#94a3b8'}}>{cnt}场</span>
                    </div>;
                  })}
                </Card>
              </Col>
            </Row>
          },
        ]} />

        <Card size="small">
          <Space><Button>投放渠道</Button><Button>效果分析报告</Button><Button>模板管理</Button></Space>
        </Card>

        <Modal title={`活动详情 - ${showDetail?.name || ''}`} open={!!showDetail} onCancel={() => setShowDetail(null)} footer={<Button onClick={() => setShowDetail(null)}>关闭</Button>}>
          {showDetail && <Space direction="vertical" style={{width:'100%'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div><div style={{color:'#94a3b8',fontSize:12}}>名称</div><div style={{color:'#e2e8f0'}}>{showDetail.name}</div></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>类型</div><Tag color={TYPE_COLORS[showDetail.type]}>{showDetail.type}</Tag></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>渠道</div><Tag>{showDetail.channel}</Tag></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>状态</div><Tag color={STATUS_CFG[showDetail.status]?.[0]}>{STATUS_CFG[showDetail.status]?.[1]}</Tag></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>预算</div><span style={{color:'#e2e8f0'}}>¥{showDetail.budget.toLocaleString()}</span></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>已消耗</div><span style={{color:'#f59e0b'}}>¥{showDetail.used.toLocaleString()}</span></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>消耗率</div><Progress percent={showDetail.budget > 0 ? Math.round(showDetail.used / showDetail.budget * 100) : 0} size="small" style={{width:120}} /></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>投放对象</div><span style={{color:'#e2e8f0'}}>{showDetail.audience}</span></div>
              <div style={{gridColumn:'1 / -1'}}><div style={{color:'#94a3b8',fontSize:12}}>起止</div><span style={{color:'#e2e8f0'}}>{showDetail.start} ~ {showDetail.end}</span></div>
            </div>
          </Space>}
        </Modal>

        <Modal title="创建营销活动" open={showCreate} onCancel={() => setShowCreate(false)}
          onOk={() => { message.success('活动已创建'); setShowCreate(false); }} width={520}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="活动名称" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Select placeholder="类型" style={{width:'100%'}}>
                <Select.Option value="推广">推广</Select.Option>
                <Select.Option value="充值">充值</Select.Option>
                <Select.Option value="会员">会员</Select.Option>
              </Select>
              <Select placeholder="渠道" style={{width:'100%'}}>
                <Select.Option value="小程序">小程序</Select.Option>
                <Select.Option value="到店">到店</Select.Option>
                <Select.Option value="抖音">抖音</Select.Option>
              </Select>
              <Input placeholder="预算" type="number" />
              <Input placeholder="投放对象" />
              <Input placeholder="开始日期" type="date" />
              <Input placeholder="结束日期" type="date" />
            </div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
