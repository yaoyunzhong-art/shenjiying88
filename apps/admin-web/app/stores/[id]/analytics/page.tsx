// 📊 经营分析 · 营收/客流/设备/趋势 · 多维分析看板
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Tabs, Empty, Progress } from '@m5/ui';

const REVENUE_DATA = [
  { day:'07/07', revenue:14500, traffic:320, deviceUsage:'82%' },
  { day:'07/08', revenue:12600, traffic:280, deviceUsage:'76%' },
  { day:'07/09', revenue:15200, traffic:340, deviceUsage:'85%' },
  { day:'07/10', revenue:13800, traffic:310, deviceUsage:'79%' },
  { day:'07/11', revenue:16100, traffic:360, deviceUsage:'88%' },
  { day:'07/12', revenue:17900, traffic:400, deviceUsage:'91%' },
  { day:'07/13', revenue:15800, traffic:350, deviceUsage:'84%' },
];

const CATEGORY_DATA = [
  { category:'游戏收入', amount:56000, ratio:'38.6%', trend:'↑12%' },
  { category:'会员充值', amount:48000, ratio:'33.1%', trend:'↑8%' },
  { category:'饮品销售', amount:18500, ratio:'12.8%', trend:'↑5%' },
  { category:'门票收入', amount:12500, ratio:'8.6%', trend:'↓3%' },
  { category:'其他', amount:10000, ratio:'6.9%', trend:'↑2%' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('week');
  const totalRevenue = REVENUE_DATA.reduce((s, d) => s + d.revenue, 0);
  const totalTraffic = REVENUE_DATA.reduce((s, d) => s + d.traffic, 0);
  const avgRevenue = Math.round(totalRevenue / REVENUE_DATA.length);
  const avgTraffic = Math.round(totalTraffic / REVENUE_DATA.length);

  const cols = [
    { title: '日期', dataIndex: 'day' },
    { title: '营收', dataIndex: 'revenue', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '客流', dataIndex: 'traffic', render: (v: number) => `${v}人` },
    { title: '设备利用率', dataIndex: 'deviceUsage' },
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>📊 经营分析</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>营收 · 客流 · 设备 · 趋势</span></div>
          <Select value={period} onChange={setPeriod} style={{ width: 120 }}
            options={[{ value: 'week', label: '本周' }, { value: 'month', label: '本月' }, { value: 'quarter', label: '本季' }]} />
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="周期营收" value={totalRevenue.toLocaleString()} prefix="¥" valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="日均营收" value={avgRevenue.toLocaleString()} prefix="¥" valueStyle={{ color: '#fbbf24' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="总客流" value={totalTraffic} suffix="人" valueStyle={{ color: '#6366f1' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="日均客流" value={avgTraffic} suffix="人" valueStyle={{ color: '#14b8a6' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="客单价" value={Math.round(avgRevenue / avgTraffic)} prefix="¥" valueStyle={{ color: '#f59e0b' }} /></Card></Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small" title="营收趋势（近7天）">
              {REVENUE_DATA.map(d => {
                const maxRev = Math.max(...REVENUE_DATA.map(x => x.revenue));
                return (
                  <div key={d.day} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>{d.day}</span>
                      <span style={{ fontSize: 12, color: '#fbbf24' }}>¥{d.revenue.toLocaleString()}</span>
                    </div>
                    <Progress percent={Math.round(d.revenue / maxRev * 100)} size="small" strokeColor="#fbbf24" />
                  </div>
                );
              })}
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="收入结构">
              {CATEGORY_DATA.map(c => (
                <div key={c.category} style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>{c.category}</span>
                    <span>¥{c.amount.toLocaleString()} ({c.ratio})</span>
                  </div>
                  <Progress percent={parseInt(c.ratio)} size="small" strokeColor="#6366f1" />
                </div>
              ))}
            </Card>
          </Col>
        </Row>

        <Card><Table dataSource={REVENUE_DATA} columns={cols} rowKey="day" pagination={false} /></Card>
      </Space>
    </PageShell>
  );
}
