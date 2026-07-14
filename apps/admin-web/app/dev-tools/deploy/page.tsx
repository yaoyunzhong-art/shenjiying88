// 🔧 P-53 部署DevOps · 部署计划/状态/回滚管理
'use client';
import { useState } from 'react';
import { PageShell, Card, Statistic, Table, Tag, Button, Space, Input, Modal, Select, Progress } from '@m5/ui';

interface Deployment { id:string; name:string; version:string; env:string; status:string; time:string; duration:string; deployer:string; commits:number; notes:string; [key:string]:unknown; }

const DEPLOYS: Deployment[] = [
  { id:'D-001',name:'收银系统更新',version:'v2.3.1',env:'production',status:'success',time:'2026-07-14 08:00',duration:'12min',deployer:'张三',commits:24,notes:'P-35收银Sprint #12' },
  { id:'D-002',name:'会员模块补丁',version:'v2.3.1-hotfix',env:'production',status:'rolling',time:'2026-07-14 09:30',duration:'8min',deployer:'李四',commits:8,notes:'紧急hotfix' },
  { id:'D-003',name:'开放平台V2',version:'v2.4.0',env:'staging',status:'success',time:'2026-07-13 18:00',duration:'15min',deployer:'王五',commits:56,notes:'P-49开发' },
  { id:'D-004',name:'库存模块部署',version:'v2.3.0',env:'testing',status:'success',time:'2026-07-13 14:00',duration:'10min',deployer:'赵六',commits:32,notes:'P-37测试' },
  { id:'D-005',name:'财务对账部署',version:'v2.2.0',env:'staging',status:'failed',time:'2026-07-12 22:00',duration:'5min',deployer:'IT部',commits:15,notes:'配置错误回滚' },
  { id:'D-006',name:'紧急回滚',version:'v2.2.0-rollback',env:'production',status:'rollback',time:'2026-07-12 22:30',duration:'6min',deployer:'IT部',commits:0,notes:'回滚至v2.2.0' },
];

const ENV_OPTIONS = [
  {value:'all',label:'全部环境'},
  {value:'production',label:'生产'},
  {value:'staging',label:'预发'},
  {value:'testing',label:'测试'},
];

function envTag(env: string) {
  const v = env==='production'?'error':env==='staging'?'primary':'default';
  return <Tag variant={v as any}>{env}</Tag>;
}

function statusTag(status: string) {
  const m: Record<string,string> = {
    success:'success,成功', failed:'error,失败', rolling:'primary,部署中', rollback:'warning,回滚',
  };
  const [v,l] = (m[status]||'default,未知').split(',');
  return <Tag variant={v as any}>{l}</Tag>;
}

export default function DeployPage() {
  const [envFilter, setEnvFilter] = useState('all');
  const [showDeploy, setShowDeploy] = useState(false);
  const filtered = envFilter==='all' ? DEPLOYS : DEPLOYS.filter(d=>d.env===envFilter);
  const prodDeploys = DEPLOYS.filter(d=>d.env==='production');
  const successRate = Math.round(prodDeploys.filter(d=>d.status==='success').length/prodDeploys.length*100);

  return (
    <PageShell title="部署管理 (P-53)">
      <Space style={{width:'100%',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <h2 style={{color:'#f8fafc',margin:0}}>🔧 部署管理 (P-53)</h2>
          <Button variant="primary" onClick={()=>setShowDeploy(true)}>+ 新建部署</Button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:16}}>
          <Card><Statistic label="部署记录" value={DEPLOYS.length} /></Card>
          <Card><Statistic label="生产上线" value={prodDeploys.length} /></Card>
          <Card><Statistic label="成功率" value={`${successRate}%`} variant="success" /></Card>
          <Card><Statistic label="回滚数" value={DEPLOYS.filter(d=>d.status==='rollback').length} variant="danger" /></Card>
          <Card><Statistic label="失败数" value={DEPLOYS.filter(d=>d.status==='failed').length} variant="danger" /></Card>
          <Card><Statistic label="进行中" value={DEPLOYS.filter(d=>d.status==='rolling').length} variant="warning" /></Card>
          <Card><Statistic label="总commits" value={DEPLOYS.reduce((s,d)=>s+d.commits,0)} /></Card>
          <Card><Statistic label="平均时长" value="11min" /></Card>
        </div>
        <Card>
          <Space style={{marginBottom:12}}>
            <Select value={envFilter} onChange={setEnvFilter} style={{width:120}} options={ENV_OPTIONS} />
          </Space>
          <Table
            rows={filtered}
            rowKey={(r: Deployment) => r.id}
            columns={[
              {key:'name', header:'名称', render:(r: Deployment)=>r.name},
              {key:'version', header:'版本', render:(r: Deployment)=><Tag>{r.version}</Tag>},
              {key:'env', header:'环境', render:(r: Deployment)=>envTag(r.env)},
              {key:'status', header:'状态', render:(r: Deployment)=>statusTag(r.status)},
              {key:'time', header:'时间', render:(r: Deployment)=>r.time},
              {key:'duration', header:'时长', render:(r: Deployment)=>r.duration},
              {key:'deployer', header:'部署人', render:(r: Deployment)=>r.deployer},
              {key:'a', header:'操作', render:(r: Deployment)=>(
                <Space><Button size="sm">详情</Button><Button size="sm" disabled={r.status!=='success'}>回滚</Button></Space>
              )},
            ]}
          />
        </Card>
        <Modal title="新建部署" open={showDeploy} onClose={()=>setShowDeploy(false)}>
          <Space style={{width:'100%',flexDirection:'column'}}>
            <Input placeholder="版本号 (如v2.4.0)" />
            <Select placeholder="目标环境" options={ENV_OPTIONS.filter(o=>o.value!=='all')} style={{width:'100%'}} />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
