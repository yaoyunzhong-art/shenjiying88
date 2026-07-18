// 🔗 开放平台 · API密钥/开发者/接口管理
'use client';
import { useState } from 'react';
import { PageShell, Card, Statistic, Table, Tag, Button, Space, Input, Modal, Select, Tabs, Progress } from '@m5/ui';

/* ── 平台配置类型定义 ── */
interface PlatformConfigItem {
  id: string;
  name: string;
  category: string;
  status: 'configured' | 'unconfigured' | 'error';
}

/* ── 平台配置项列表 ── */
const PLATFORM_CONFIGS: PlatformConfigItem[] = [
  { id: 'PC-01', name: 'API密钥', category: '基础', status: 'configured' },
  { id: 'PC-02', name: 'Webhook回调', category: '集成', status: 'configured' },
  { id: 'PC-03', name: 'OAuth2认证', category: '安全', status: 'configured' },
  { id: 'PC-04', name: 'IP白名单', category: '安全', status: 'configured' },
  { id: 'PC-05', name: '频率限制', category: '基础', status: 'configured' },
  { id: 'PC-06', name: '日志推送', category: '集成', status: 'configured' },
  { id: 'PC-07', name: '监控告警', category: '运维', status: 'configured' },
  { id: 'PC-08', name: '数据导出', category: '集成', status: 'unconfigured' },
  { id: 'PC-09', name: '自定义域名', category: '基础', status: 'unconfigured' },
  { id: 'PC-10', name: 'SSL证书', category: '安全', status: 'unconfigured' },
  { id: 'PC-11', name: '邮件服务', category: '集成', status: 'error' },
  { id: 'PC-12', name: '短信通道', category: '集成', status: 'error' },
];

interface APIKey {
  id: string; name: string; key: string; status: string;
  created: string; expires: string; lastUsed: string; quota: number; used: number;
  [key:string]: unknown;
}

const API_KEYS: APIKey[] = [
  { id:'K-001', name:'收银系统集成', key:'sk_live_****a1b2', status:'active', created:'2026-03-01', expires:'2027-03-01', lastUsed:'2026-07-14 10:23', quota:10000, used:7245 },
  { id:'K-002', name:'会员小程序', key:'sk_live_****c3d4', status:'active', created:'2026-04-15', expires:'2027-04-15', lastUsed:'2026-07-14 09:15', quota:5000, used:3120 },
  { id:'K-003', name:'第三方合作伙伴', key:'sk_live_****e5f6', status:'active', created:'2026-05-01', expires:'2027-05-01', lastUsed:'2026-07-13 16:30', quota:2000, used:845 },
  { id:'K-004', name:'测试密钥(旧)', key:'sk_test_****g7h8', status:'expired', created:'2025-06-01', expires:'2026-06-01', lastUsed:'2026-05-30', quota:1000, used:989 },
  { id:'K-005', name:'离职开发密钥', key:'sk_live_****i9j0', status:'revoked', created:'2025-10-01', expires:'2026-10-01', lastUsed:'2026-06-15', quota:5000, used:4800 },
];

const QUOTA_OPTIONS = [
  { value:'read', label:'只读' },
  { value:'write', label:'读写' },
  { value:'admin', label:'管理' },
];

const DOCS = ['REST API概览','OAuth2认证','Webhook回调','SDK下载','错误码表','频率限制'];

function statusTag(status: string) {
  if (status === 'active') return <Tag variant="success">活跃</Tag>;
  if (status === 'expired') return <Tag variant="warning">已过期</Tag>;
  return <Tag variant="error">已吊销</Tag>;
}

function expiresTag(expires: string) {
  const color = new Date(expires) < new Date() ? 'red' : 'green';
  return <span style={{color,fontSize:13}}>{expires}</span>;
}

export default function OpenPlatformPage() {
  const [tabKey, setTabKey] = useState('keys');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // ── API密钥统计 ──
  const activeKeys = API_KEYS.filter(k => k.status === 'active').length;
  const totalQuota = API_KEYS.reduce((s, k) => s + k.quota, 0);
  const totalUsed = API_KEYS.reduce((s, k) => s + k.used, 0);
  const usagePct = Math.round(totalUsed/totalQuota*100);

  const filteredKeys = API_KEYS.filter(k => !search || k.name.includes(search));

  // ── 平台配置统计 ──
  const configCount = PLATFORM_CONFIGS.length;
  const configuredCount = PLATFORM_CONFIGS.filter(c => c.status === 'configured').length;
  const unconfiguredCount = PLATFORM_CONFIGS.filter(c => c.status === 'unconfigured').length;
  const errorCount = PLATFORM_CONFIGS.filter(c => c.status === 'error').length;

  const configStatsRow = (
    <div style={{marginBottom:16}}>
      <div style={{color:'#94a3b8',fontSize:13,marginBottom:8}}>📋 平台配置概览</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        <Card><Statistic label="已配置" value={configuredCount} variant="success" /></Card>
        <Card><Statistic label="未配置" value={unconfiguredCount} variant="warning" /></Card>
        <Card><Statistic label="异常" value={errorCount} variant="danger" /></Card>
        <Card><Statistic label="总配置项" value={configCount} /></Card>
      </div>
    </div>
  );

  const statsRow = (
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:16,marginBottom:16}}>
      <Card><Statistic label="总密钥" value={API_KEYS.length} /></Card>
      <Card><Statistic label="活跃" value={activeKeys} variant="success" /></Card>
      <Card><Statistic label="过期/吊销" value={API_KEYS.filter(k => k.status !== 'active').length} variant="danger" /></Card>
      <Card><Statistic label="总配额" value={totalQuota.toLocaleString()} prefix="¥" /></Card>
      <Card><Statistic label="已消耗" value={totalUsed.toLocaleString()} prefix="¥" variant="warning" /></Card>
      <Card><Statistic label="使用率" value={usagePct} suffix="%" variant={totalUsed/totalQuota > 0.7 ? 'warning' : 'success'} /></Card>
    </div>
  );

  return (
    <PageShell title="开放平台">
      <Space style={{width:'100%',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{color:'#f8fafc',margin:0}}>🔗 开放平台</h2>
          <Space>
            <Button>开发者文档</Button>
            <Button variant="primary" onClick={() => setShowCreate(true)}>+ 创建密钥</Button>
          </Space>
        </div>

        {configStatsRow}
        {statsRow}

        <Tabs activeKey={tabKey} onChange={setTabKey} items={[
          { key:'keys', label:'API密钥' },
          { key:'docs', label:'开发文档' },
        ]} />

        {tabKey === 'keys' && (
          <Card>
            <Input
              placeholder="搜索密钥名称"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{width:220,marginBottom:12}}
            />
            <Table
              rows={filteredKeys}
              rowKey={(r: APIKey) => r.id}
              columns={[
                {key:'name', header:'名称', render:(r: APIKey)=>r.name},
                {key:'key', header:'密钥', render:(r: APIKey)=>r.key},
                {key:'status', header:'状态', render:(r: APIKey)=>statusTag(r.status)},
                {key:'created', header:'创建', render:(r: APIKey)=>r.created},
                {key:'expires', header:'到期', render:(r: APIKey)=>expiresTag(r.expires)},
                {key:'lastUsed', header:'最近使用', render:(r: APIKey)=>r.lastUsed},
                {key:'quota', header:'配额', render:(r: APIKey)=>(
                  <Space>
                    <Progress value={Math.round(r.used/r.quota*100)} height={16} style={{width:80}} />
                    <span style={{color:'#94a3b8',fontSize:12}}>{r.used}/{r.quota}</span>
                  </Space>
                )},
                {key:'a', header:'操作', render:(r: APIKey)=>(
                  r.status==='active'
                    ? <Button size="sm" variant="danger">吊销</Button>
                    : <Button size="sm">恢复</Button>
                )},
              ]}
            />
          </Card>
        )}

        {tabKey === 'docs' && (
          <Card>
            <Space style={{width:'100%',flexDirection:'column'}}>
              {DOCS.map(d => (
                <div key={d} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(148,163,184,0.08)'}}>
                  <span style={{color:'#e2e8f0'}}>{d}</span>
                  <Button size="sm" variant="ghost">查看 →</Button>
                </div>
              ))}
            </Space>
          </Card>
        )}

        <Modal
          title="创建API密钥"
          open={showCreate}
          onClose={() => setShowCreate(false)}
        >
          <Space style={{width:'100%',flexDirection:'column'}}>
            <Input placeholder="密钥名称" />
            <Input placeholder="配额上限" type="number" />
            <Select placeholder="权限范围" options={QUOTA_OPTIONS} style={{width:'100%'}} />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
