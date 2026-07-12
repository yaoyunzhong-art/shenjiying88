// 👥 会员管理 · 会员信息/等级/积分管理
'use client';
import { useState } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Input } from '@m5/ui';

const MEMBERS = [
  { id: 'M001', name: '张明', phone: '138****8888', tier: 'gold', points: 3200, balance: 580, lastVisit: '2026-07-12', totalSpent: 12500 },
  { id: 'M002', name: '李芳', phone: '139****6666', tier: 'diamond', points: 8500, balance: 1200, lastVisit: '2026-07-11', totalSpent: 32000 },
  { id: 'M003', name: '王强', phone: '137****5555', tier: 'silver', points: 1800, balance: 300, lastVisit: '2026-07-10', totalSpent: 6500 },
  { id: 'M004', name: '赵丽', phone: '136****4444', tier: 'bronze', points: 400, balance: 100, lastVisit: '2026-07-08', totalSpent: 2000 },
  { id: 'M005', name: '刘伟', phone: '135****3333', tier: 'gold', points: 2800, balance: 750, lastVisit: '2026-07-12', totalSpent: 15000 },
];

const TIER_COLORS: Record<string, string> = { diamond: '#a78bfa', gold: '#fbbf24', silver: '#94a3b8', bronze: '#d97706', basic: '#64748b' };
const TIER_NAMES: Record<string, string> = { diamond: '钻石', gold: '黄金', silver: '银卡', bronze: '铜卡', basic: '普通' };

const COLUMNS = [
  { title: '姓名', dataIndex: 'name' }, { title: '电话', dataIndex: 'phone' },
  { title: '等级', dataIndex: 'tier', render: (v: string) => <Tag style={{ color: TIER_COLORS[v], border: `1px solid ${TIER_COLORS[v]}40` }}>{TIER_NAMES[v]}</Tag> },
  { title: '积分', dataIndex: 'points' }, { title: '余额', dataIndex: 'balance', render: (v: number) => `¥${v}` },
  { title: '累计消费', dataIndex: 'totalSpent', render: (v: number) => <span style={{ color: '#fbbf24' }}>¥{v.toLocaleString()}</span> },
  { title: '最后到店', dataIndex: 'lastVisit' },
];

export default function MembersPage() {
  const [data] = useState(MEMBERS);
  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <h2 style={{ color: '#f8fafc', margin: 0 }}>👥 会员管理</h2>
        <Row gutter={16}>
          <Col span={8}><Card><Statistic title="总会员" value={1286} /></Card></Col>
          <Col span={8}><Card><Statistic title="本月新增" value={48} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={8}><Card><Statistic title="活跃会员(7天)" value={356} /></Card></Col>
        </Row>
        <Card>
          <Space style={{ width: '100%', marginBottom: 16 }}>
            <Input.Search placeholder="搜索会员姓名/手机号" style={{ width: 300 }} />
            <Button>高级筛选</Button>
          </Space>
          <Table dataSource={data} columns={COLUMNS} rowKey="id" pagination={false} />
        </Card>
        <Card><Space><Button type="primary">新增会员</Button><Button>批量导入</Button><Button>发送消息</Button></Space></Card>
      </Space>
    </PageShell>
  );
}