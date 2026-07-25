// 🔐 P-49 开放平台 · API/开发者/文档
'use client';
import { useState } from 'react';
import { PageShell, Card, Statistic, Tabs, Button, Space, Tag } from '@m5/ui';
import { AdminPermissionGate } from '../../components/admin-permission-gate';

const DOC_ITEMS = ['收银API','会员API','库存API','报表API','活动API'];


const permissionGate = {
  requiredPermission: 'dev-tools:platform:read',
  title: '开放平台访问受限',
  description:
    '开放平台页已接入管理员本地 session，只有具备 dev-tools:platform:read 的账号才能查看 API 文档、Webhook 与调用日志。',
} as const

export default function OpenPlatformPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tabKey, setTabKey] = useState('api');

  if (loading) return <AdminPermissionGate {...permissionGate}><div>加载中...</div></AdminPermissionGate>
  if (error) return <AdminPermissionGate {...permissionGate}><div>数据获取失败: {error}</div></AdminPermissionGate>
  if (!DOC_ITEMS || DOC_ITEMS.length === 0) return <AdminPermissionGate {...permissionGate}><div>暂无数据</div></AdminPermissionGate>

  return (
    <AdminPermissionGate {...permissionGate}>
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
    </AdminPermissionGate>
  );
}
