// 🔗 开放平台 · API密钥/开发者/接口管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Input, Modal, Select, message, Tabs, Progress, Empty, DatePicker } from '@m5/ui';

interface APIKey {
  id: string; name: string; key: string; status: 'active' | 'expired' | 'revoked';
  created: string; expires: string; lastUsed: string; quota: number; used: number;
}

const API_KEYS: APIKey[] = [
  { id:'K-001', name:'收银系统集成', key:'sk_live_****a1b2', status:'active', created:'2026-03-01', expires:'2027-03-01', lastUsed:'2026-07-14 10:23', quota:10000, used:7245 },
  { id:'K-002', name:'会员小程序', key:'sk_live_****c3d4', status:'active', created:'2026-04-15', expires:'2027-04-15', lastUsed:'2026-07-14 09:15', quota:5000, used:3120 },
  { id:'K-003', name:'第三方合作伙伴', key:'sk_live_****e5f6', status:'active', created:'2026-05-01', expires:'2027-05-01', lastUsed:'2026-07-13 16:30', quota:2000, used:845 },
  { id:'K-004', name:'测试密钥(旧)', key:'sk_test_****g7h8', status:'expired', created:'2025-06-01', expires:'2026-06-01', lastUsed:'2026-05-30', quota:1000, used:989 },
  { id:'K-005', name:'离职开发密钥', key:'sk_live_****i9j0', status:'revoked', created:'2025-10-01', expires:'2026-10-01', lastUsed:'2026-06-15', quota:5000, used:4800 },
];

export default function OpenPlatformPage() {
  const [tabKey, setTabKey] = useState('keys');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const activeKeys = API_KEYS.filter(k => k.status === 'active').length;
  const totalQuota = API_KEYS.reduce((s, k) => s + k.quota, 0);
  const totalUsed = API_KEYS.reduce((s, k) => s + k.used, 0);
  const expiredCount = API_KEYS.filter(k => k.status === 'expired').length;

  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <div style={{display:'flex',justifyContent:'space-between'}}>
      <h2 style={{color:'#f8fafc',margin:0}}>🔗 开放平台</h2>
      <Space><Button>开发者文档</Button><Button type="primary" onClick={() => setShowCreate(true)}>+ 创建密钥</Button></Space>
    </div>

    <Row gutter={16}>
      <Col span={4}><Card size="small"><Statistic title="总密钥" value={API_KEYS.length} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="活跃" value={activeKeys} valueStyle={{color:'#34d399'}} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="过期/吊销" value={API_KEYS.filter(k => k.status !== 'active').length} valueStyle={{color:'#f87171'}} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="总配额" value={totalQuota.toLocaleString()} prefix="¥" /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="已消耗" value={totalUsed.toLocaleString()} prefix="¥" valueStyle={{color:'#f59e0b'}} /></Card></Col>
      <Col span={4}><Card size="small"><Statistic title="使用率" value={Math.round(totalUsed/totalQuota*100)} suffix="%" valueStyle={{color: totalUsed/totalQuota > 0.7 ? '#f59e0b' : '#34d399'}} /></Card></Col>
    </Row>

    <Tabs activeKey={tabKey} onChange={setTabKey} items={[
      { key:'keys', label:'API密钥',
        children: <Card>
          <Space style={{marginBottom:12,width:'100%'}}>
            <Input.Search placeholder="搜索密钥名称" value={search} onChange={e => setSearch(e.target.value)} style={{width:220}} />
          </Space>
          <Table dataSource={API_KEYS.filter(k => !search || k.name.includes(search))} rowKey="id" columns={[
            {title:'名称',dataIndex:'name'}, {title:'密钥',dataIndex:'key'},
            {title:'状态',dataIndex:'status',render:(v:string)=>v==='active'?<Tag color="green">活跃</Tag>:v==='expired'?<Tag color="orange">已过期</Tag>:<Tag color="red">已吊销</Tag>},
            {title:'创建',dataIndex:'created'},{title:'到期',dataIndex:'expires',render:(v:string)=><Tag color={new Date(v)<new Date()?'red':'green'} size="small">{v}</Tag>},
            {title:'最近使用',dataIndex:'lastUsed'},{title:'配额',key:'quota',render:(_:unknown,r:APIKey)=><><Progress percent={Math.round(r.used/r.quota*100)} size="small" style={{width:80}} /><span style={{color:'#94a3b8',fontSize:12,marginLeft:4}}>{r.used}/{r.quota}</span></>},
            {title:'操作',key:'a',render:(_:unknown,r:APIKey)=>r.status==='active'?<Space><Button size="small" danger>吊销</Button></Space>:<Button size="small">恢复</Button>},
          ]} pagination={{pageSize:6}} />
        </Card>
      },
      { key:'docs', label:'开发文档',
        children: <Card>
          <Space direction="vertical" style={{width:'100%'}}>
            {['REST API概览','OAuth2认证','Webhook回调','SDK下载','错误码表','频率限制'].map(d => (
              <div key={d} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(148,163,184,0.08)'}}>
                <span style={{color:'#e2e8f0'}}>{d}</span>
                <Button size="small" type="link">查看 →</Button>
              </div>
            ))}
          </Space>
        </Card>
      },
    ]} />

    <Modal title="创建API密钥" open={showCreate} onCancel={() => setShowCreate(false)} onOk={()=>{message.success('密钥已创建');setShowCreate(false)}}>
      <Space direction="vertical" style={{width:'100%'}}>
        <Input placeholder="密钥名称" /><Input placeholder="配额上限" type="number" />
        <Select placeholder="权限范围" style={{width:'100%'}}>
          <Select.Option value="read">只读</Select.Option>
          <Select.Option value="write">读写</Select.Option>
          <Select.Option value="admin">管理</Select.Option>
        </Select>
      </Space>
    </Modal>
  </Space></PageShell>);
}
