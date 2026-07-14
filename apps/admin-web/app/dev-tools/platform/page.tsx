// 🔐 P-49 开放平台 · API/开发者/文档
'use client';
import { useState } from 'react';
import { PageShell, Card, Statistic, Tabs, Button, Space, Tag } from '@m5/ui';

const DOC_ITEMS = ['收银API','会员API','库存API','报表API','活动API'];

export default function OpenPlatformPage() {
  const [tabKey, setTabKey] = useState('api');
  return (
    <PageShell title="开放平台">
      <Space style={{width:'100%',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <h2 style={{color:'#f8fafc',margin:0}}>🔐 开放平台</h2>
          <Button variant="primary">开发者接入</Button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
          <Card><Statistic label="API版本" value="v3" /></Card>
          <Card><Statistic label="QPS上限" value={5000} suffix="/s" /></Card>
          <Card><Statistic label="活跃开发者" value={42} /></Card>
          <Card><Statistic label="API端点" value={156} /></Card>
          <Card><Statistic label="本月调用" value="1.2M" /></Card>
        </div>
        <Tabs activeKey={tabKey} onChange={setTabKey} items={[
          {key:'api',label:'API管理'},
          {key:'webhook',label:'Webhook'},
          {key:'logs',label:'调用日志'},
        ]} />
        {tabKey === 'api' && (
          <Card>
            <Space style={{width:'100%',flexDirection:'column'}}>
              {DOC_ITEMS.map(a=><div key={a} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(148,163,184,0.08)'}}>
                <span style={{color:'#e2e8f0'}}>{a}</span>
                <Space><Tag variant="success">v3</Tag><Button size="sm" variant="ghost">文档 →</Button></Space>
              </div>)}
            </Space>
          </Card>
        )}
        {tabKey === 'webhook' && <Card><div style={{color:'#94a3b8',textAlign:'center',padding:40}}>Webhook配置 (开发中)</div></Card>}
        {tabKey === 'logs' && <Card><div style={{color:'#94a3b8',textAlign:'center',padding:40}}>调用日志 (开发中)</div></Card>}
      </Space>
    </PageShell>
  );
}
