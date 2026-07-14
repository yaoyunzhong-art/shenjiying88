// 🔐 P-47品牌运营 · 品牌定制/营销活动/内容管理
'use client';
import { useState } from 'react';
import { PageShell, Card, Statistic, Table, Tag, Button, Space, Input, Select } from '@m5/ui';

interface Brand { id:string; name:string; domain:string; status:string; templates:number; campaigns:number; emailCount:number; created:string; [key:string]:unknown; }
const BRANDS: Brand[] = [
  { id:'B-01',name:'火星蹦床公园',domain:'mars.venuetech.com',status:'active' as string,templates:5,campaigns:12,emailCount:8,created:'2026-01'},
  { id:'B-02',name:'银河电竞馆',domain:'galaxy.venuetech.com',status:'active' as string,templates:3,campaigns:8,emailCount:5,created:'2026-02'},
  { id:'B-03',name:'星际儿童乐园',domain:'star.venuetech.com',status:'pending' as string,templates:2,campaigns:3,emailCount:2,created:'2026-04'},
  { id:'B-04',name:'极速卡丁车',domain:'speed.venuetech.com',status:'active' as string,templates:4,campaigns:15,emailCount:6,created:'2026-01'},
];

export default function BrandPage() {
  const [search, setSearch] = useState('');
  const filtered = BRANDS.filter(b => !search || b.name.includes(search));

  return (
    <PageShell title="品牌运营">
      <Space style={{width:'100%',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{color:'#f8fafc',margin:0}}>🔐 品牌运营</h2>
          <Button variant="primary">+ 新建品牌</Button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
          <Card><Statistic label="品牌数" value={BRANDS.length} /></Card>
          <Card><Statistic label="活跃" value={BRANDS.filter(b=>b.status==='active').length} variant="success" /></Card>
          <Card><Statistic label="总模板" value={BRANDS.reduce((s,b)=>s+b.templates,0)} /></Card>
          <Card><Statistic label="总活动" value={BRANDS.reduce((s,b)=>s+b.campaigns,0)} /></Card>
          <Card><Statistic label="邮件模板" value={BRANDS.reduce((s,b)=>s+b.emailCount,0)} /></Card>
        </div>
        <Card>
          <Input
            placeholder="搜索品牌"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{width:220,marginBottom:12}}
          />
          <Table
            rows={filtered}
            rowKey={(r: Brand) => r.id}
            columns={[
              {key:'name', header:'品牌名', render:(r: Brand)=>r.name},
              {key:'domain', header:'域名', render:(r: Brand)=>r.domain},
              {key:'status', header:'状态', render:(r: Brand)=>{
                if (r.status==='active') return <Tag variant="success">已激活</Tag>;
                if (r.status==='pending') return <Tag variant="warning">待审核</Tag>;
                return <Tag variant="error">已过期</Tag>;
              }},
              {key:'templates', header:'模板', render:(r: Brand)=>String(r.templates)},
              {key:'campaigns', header:'活动', render:(r: Brand)=>String(r.campaigns)},
              {key:'emailCount', header:'邮箱', render:(r: Brand)=>String(r.emailCount)},
              {key:'created', header:'创建', render:(r: Brand)=>r.created},
              {key:'a', header:'操作', render:(r: Brand)=>(
                <Space>
                  <Button size="sm">管理</Button>
                  <Button size="sm" disabled>配置</Button>
                </Space>
              )},
            ]}
          />
        </Card>
      </Space>
    </PageShell>
  );
}
