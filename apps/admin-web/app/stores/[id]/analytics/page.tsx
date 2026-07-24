// 📊 经营分析 · 营收/客流/设备/趋势 · 多维分析看板
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Tabs, Empty, Progress, Modal, Divider, message, DatePicker } from '@m5/ui';
import { AdminPermissionGate } from '../../../components/admin-permission-gate';

const permissionGate = {
  requiredPermission: 'store:read',
  title: '门店分析访问受限',
  description:
    '门店分析页已接入管理员本地 session，只有具备 store:read 的账号才能查看营收趋势、客流分布与经营明细数据。',
} as const;

const REVENUE_DATA = [
  { day:'07/07', revenue:14500, traffic:320, deviceUsage:'82%', newMember:12, avgOrder:45 },
  { day:'07/08', revenue:12600, traffic:280, deviceUsage:'76%', newMember:8, avgOrder:45 },
  { day:'07/09', revenue:15200, traffic:340, deviceUsage:'85%', newMember:15, avgOrder:45 },
  { day:'07/10', revenue:13800, traffic:310, deviceUsage:'79%', newMember:10, avgOrder:45 },
  { day:'07/11', revenue:16100, traffic:360, deviceUsage:'88%', newMember:18, avgOrder:45 },
  { day:'07/12', revenue:17900, traffic:400, deviceUsage:'91%', newMember:22, avgOrder:45 },
  { day:'07/13', revenue:15800, traffic:350, deviceUsage:'84%', newMember:14, avgOrder:45 },
];

const CATEGORY_DATA = [
  { category:'游戏收入', amount:56000, ratio:'38.6%', trend:'↑12%', items:'主机/VR/彩票机' },
  { category:'会员充值', amount:48000, ratio:'33.1%', trend:'↑8%', items:'充值卡/套餐' },
  { category:'饮品销售', amount:18500, ratio:'12.8%', trend:'↑5%', items:'水饮/零食' },
  { category:'门票收入', amount:12500, ratio:'8.6%', trend:'↓3%', items:'入场/通票' },
  { category:'其他', amount:10000, ratio:'6.9%', trend:'↑2%', items:'礼品/活动' },
];

const HOUR_DIST = [
  { hour:'09-10', traffic:20 }, { hour:'10-11', traffic:45 }, { hour:'11-12', traffic:60 },
  { hour:'12-14', traffic:85 }, { hour:'14-16', traffic:120 }, { hour:'16-18', traffic:95 },
  { hour:'18-20', traffic:70 }, { hour:'20-22', traffic:55 },
];

const DEVICE_TOP = [
  { name:'PS5-01', usage:'92%', revenue:4200 }, { name:'VR-01', usage:'88%', revenue:3800 },
  { name:'投篮机-01', usage:'85%', revenue:2100 }, { name:'赛车模拟器', usage:'76%', revenue:1800 },
  { name:'跳绳机', usage:'72%', revenue:1500 },
];

const TOTAL_REVENUE = REVENUE_DATA.reduce((s, d) => s + d.revenue, 0);
const TOTAL_TRAFFIC = REVENUE_DATA.reduce((s, d) => s + d.traffic, 0);
const AVG_REVENUE = Math.round(TOTAL_REVENUE / REVENUE_DATA.length);
const AVG_TRAFFIC = Math.round(TOTAL_TRAFFIC / REVENUE_DATA.length);
const MAX_REVENUE = Math.max(...REVENUE_DATA.map(d => d.revenue));
const MAX_TRAFFIC = Math.max(...REVENUE_DATA.map(d => d.traffic));
const AVG_ORDER = Math.round(REVENUE_DATA.reduce((s,d) => s + d.avgOrder, 0) / REVENUE_DATA.length);
const TOTAL_NEW_MEMBERS = REVENUE_DATA.reduce((s, d) => s + d.newMember, 0);
const WEEK_OVER_WEEK = '+13%';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('week');
  const [tabKey, setTabKey] = useState('revenue');
  const [showDetail, setShowDetail] = useState<typeof REVENUE_DATA[0] | null>(null);

  const trend = REVENUE_DATA[REVENUE_DATA.length - 1].revenue > REVENUE_DATA[0].revenue ? 'up' : 'down';
  const trendColor = trend === 'up' ? '#34d399' : '#f87171';
  const trendLabel = trend === 'up' ? '↑' : '↓';
  const trendPct = Math.round(Math.abs((REVENUE_DATA[REVENUE_DATA.length - 1].revenue - REVENUE_DATA[0].revenue) / REVENUE_DATA[0].revenue * 100));

  const cols = [
    { title: '日期', dataIndex: 'day', width: 80 },
    { title: '营收', dataIndex: 'revenue', width: 100, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '客流', dataIndex: 'traffic', width: 70, render: (v: number) => `${v}人` },
    { title: '设备利用率', dataIndex: 'deviceUsage', width: 100, render: (v: string) => <Progress percent={parseInt(v)} size="small" style={{width:80}} strokeColor={parseInt(v) >= 85 ? '#34d399' : '#f59e0b'} /> },
    { title: '新会员', dataIndex: 'newMember', width: 70 },
    { title: '客单价', dataIndex: 'avgOrder', width: 70, render: (v: number) => `¥${v}` },
    { title: '操作', key: 'a', width: 80, render: (_: unknown, r: typeof REVENUE_DATA[0]) => <Button size="small" type="link" onClick={() => setShowDetail(r)}>详情</Button> },
  ];

  return (
    <AdminPermissionGate {...permissionGate}>
      <PageShell>
        <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>📊 经营分析</h2>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>营收 · 客流 · 设备 · 趋势</span>
          </div>
          <Space>
            <Button onClick={() => {}}>导出报告</Button>
            <Select value={period} onChange={setPeriod} style={{ width: 110 }}
              options={[{ value: 'week', label: '本周' }, { value: 'month', label: '本月' }, { value: 'quarter', label: '本季' }]} />
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={3}><Card size="small"><Statistic title="周期营收" value={TOTAL_REVENUE.toLocaleString()} prefix="¥" valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="日均营收" value={AVG_REVENUE.toLocaleString()} prefix="¥" /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="环比" value={`${trendLabel}${trendPct}%`} valueStyle={{ color: trendColor }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="总客流" value={TOTAL_TRAFFIC} suffix="人" valueStyle={{ color: '#6366f1' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="日均客流" value={AVG_TRAFFIC} suffix="人" /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="客单价" value={AVG_ORDER} prefix="¥" valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="新增会员" value={TOTAL_NEW_MEMBERS} suffix="人" valueStyle={{ color: '#8b5cf6' }} /></Card></Col>
          <Col span={3}><Card size="small"><Statistic title="同比上周" value={WEEK_OVER_WEEK} valueStyle={{ color: '#34d399' }} /></Card></Col>
        </Row>

        <Tabs activeKey={tabKey} onChange={setTabKey} items={[
          { key: 'revenue', label: '营收分析',
            children: <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="营收趋势（近7天）">
                  {REVENUE_DATA.map(d => (
                    <div key={d.day} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#94a3b8' }}>{d.day}</span>
                        <Space size={12}>
                          <span style={{ color: '#fbbf24' }}>¥{d.revenue.toLocaleString()}</span>
                          <span style={{ color: '#64748b' }}>{d.traffic}人</span>
                        </Space>
                      </div>
                      <Progress percent={Math.round(d.revenue / MAX_REVENUE * 100)} size="small" strokeColor="#fbbf24" />
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="收入结构">
                  {CATEGORY_DATA.map(c => (
                    <div key={c.category} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#94a3b8' }}>{c.category}</span>
                        <Space size={8}>
                          <span style={{ color: c.trend.startsWith('↑') ? '#34d399' : '#f87171', fontSize: 11 }}>{c.trend}</span>
                          <span style={{ color: '#e2e8f0' }}>¥{c.amount.toLocaleString()} ({c.ratio})</span>
                        </Space>
                      </div>
                      <Progress percent={parseInt(c.ratio)} size="small" strokeColor="#6366f1" />
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          },
          { key: 'traffic', label: '客流分析',
            children: <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="时段客流分布">
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '16px 0' }}>
                    {HOUR_DIST.map(h => {
                      const pct = Math.round(h.traffic / Math.max(...HOUR_DIST.map(x => x.traffic)) * 100);
                      return <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: `${pct}%`, width: '100%', background: pct >= 80 ? '#6366f1' : pct >= 50 ? '#8b5cf6' : '#334155', borderRadius: '4px 4px 0 0', minHeight: 8 }} />
                        <span style={{ color: '#94a3b8', fontSize: 10, marginTop: 4 }}>{h.hour}</span>
                        <span style={{ color: '#64748b', fontSize: 10 }}>{h.traffic}</span>
                      </div>;
                    })}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="设备使用率排行">
                  {DEVICE_TOP.map(d => (
                    <div key={d.name} style={{ marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#e2e8f0' }}>{d.name}</span>
                        <span style={{ color: '#34d399' }}>¥{d.revenue.toLocaleString()}</span>
                      </div>
                      <Progress percent={parseInt(d.usage)} size="small" strokeColor="#10b981" />
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          },
          { key: 'table', label: '明细数据',
            children: <Card>
              <Table dataSource={REVENUE_DATA} columns={cols} rowKey="day" pagination={false} />
            </Card>
          },
        ]} />

        <Modal title={`详情 - ${showDetail?.day || ''}`} open={!!showDetail} onCancel={() => setShowDetail(null)} footer={<Button onClick={() => setShowDetail(null)}>关闭</Button>}>
          {showDetail && <Space direction="vertical" style={{width:'100%'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div><div style={{color:'#94a3b8',fontSize:12}}>日期</div><div style={{color:'#e2e8f0'}}>{showDetail.day}</div></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>营收</div><span style={{color:'#fbbf24'}}>¥{showDetail.revenue.toLocaleString()}</span></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>客流</div><span style={{color:'#e2e8f0'}}>{showDetail.traffic}人</span></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>设备利用率</div><Tag>{showDetail.deviceUsage}</Tag></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>新会员</div><span style={{color:'#e2e8f0'}}>+{showDetail.newMember}人</span></div>
              <div><div style={{color:'#94a3b8',fontSize:12}}>客单价</div><span style={{color:'#e2e8f0'}}>¥{showDetail.avgOrder}</span></div>
            </div>
          </Space>}
        </Modal>
        </Space>
      </PageShell>
    </AdminPermissionGate>
  );
}
