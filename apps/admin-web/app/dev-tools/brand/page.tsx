// 🔐 P-47品牌运营 · 品牌定制/营销活动/内容管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Input, Modal, Select, message, Tabs, Progress } from '@m5/ui';

interface Brand { id:string; name:string; domain:string; status:'active'|'pending'|'expired'; templates:number; campaigns:number; emailCount:number; created:string; }
const BRANDS: Brand[] = [
  { id:'B-01',name:'火星蹦床公园',domain:'mars.venuetech.com',status:'active',templates:5,campaigns:12,emailCount:8,created:'2026-01'},
  { id:'B-02',name:'银河电竞馆',domain:'galaxy.venuetech.com',status:'active',templates:3,campaigns:8,emailCount:5,created:'2026-02'},
  { id:'B-03',name:'星际儿童乐园',domain:'star.venuetech.com',status:'pending',templates:2,campaigns:3,emailCount:2,created:'2026-04'},
  { id:'B-04',name:'极速卡丁车',domain:'speed.venuetech.com',status:'active',templates:4,campaigns:15,emailCount:6,created:'2026-01'},
];

export default function BrandPage() {
  const [search, setSearch] = useState('');
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16}}>
    <div style={{display:'flex',justifyContent:'space-between'}}>
      <h2 style={{color:'#f8fafc',margin:0}}>🔐 品牌运营</h2>
      <Button type="primary">+ 新建品牌</Button>
    </div>
    <Row gutter={16}>
      <Col span={4}><Card size="small"><Statistic title="品牌数" value={BRANDS.length} /></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="活跃" value={BRANDS.filter(b=>b.status==='active').length} valueStyle={{color:'#34d399'}} /></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="总模板" value={BRANDS.reduce((s,b)=>s+b.templates,0)} /></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="总活动" value={BRANDS.reduce((s,b)=>s+b.campaigns,0)} /></Card></Col>
      <Col span={5}><Card size="small"><Statistic title="邮件模板" value={BRANDS.reduce((s,b)=>s+b.emailCount,0)} /></Card></Col>
    </Row>
    <Card>
      <Input.Search placeholder="搜索品牌" value={search} onChange={e=>setSearch(e.target.value)} style={{width:220,marginBottom:12}} />
      <Table dataSource={BRANDS.filter(b=>!search||b.name.includes(search))} rowKey="id" columns={[
        {title:'品牌名',dataIndex:'name'},{title:'域名',dataIndex:'domain'},
        {title:'状态',dataIndex:'status',render:(v:string)=>v==='active'?<Tag color="green">已激活</Tag>:v==='pending'?<Tag color="orange">待审核</Tag>:<Tag color="red">已过期</Tag>},
        {title:'模板',dataIndex:'templates'},{title:'活动',dataIndex:'campaigns'},{title:'邮箱',dataIndex:'emailCount'},
        {title:'创建',dataIndex:'created'},{title:'操作',key:'a',render:(_:unknown,r:Brand)=><Space><Button size="small">管理</Button><Button size="small" disabled>配置</Button></Space>},
      ]} pagination={false} />
    </Card>
  </Space></PageShell>);
}
