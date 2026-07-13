// 🔐 权限管理 · 角色/用户/功能权限
'use client'; import { useState } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select } from '@m5/ui';

const ROLE_DATA = [
  { id:'R-01', name:'超级管理员', users:2, permissions:'全部权限', desc:'系统级管理', scope:'全局', status:'active' },
  { id:'R-02', name:'店长', users:5, permissions:'门店全部', desc:'门店运营管理', scope:'门店', status:'active' },
  { id:'R-03', name:'收银员', users:8, permissions:'收银/开卡', desc:'前台收银操作', scope:'门店', status:'active' },
  { id:'R-04', name:'库管员', users:3, permissions:'出入库', desc:'仓库管理操作', scope:'门店', status:'active' },
  { id:'R-05', name:'导玩员', users:12, permissions:'活动引导', desc:'现场服务', scope:'门店', status:'active' },
  { id:'R-06', name:'财务审计', users:2, permissions:'财务/审计', desc:'财务对账审核', scope:'全局', status:'active' },
  { id:'R-07', name:'临时工', users:0, permissions:'基本操作', desc:'临时权限(草稿)', scope:'门店', status:'draft' },
];

const STATUS_MAP: Record<string,{color:string,label:string}> = { active:{color:'green',label:'启用'}, draft:{color:'orange',label:'草稿'}, disabled:{color:'default',label:'停用'} };
const COLUMNS = [
  { title:'角色', dataIndex:'name' },
  { title:'人数', dataIndex:'users' },
  { title:'权限范围', dataIndex:'permissions', ellipsis:true },
  { title:'说明', dataIndex:'desc' },
  { title:'作用域', dataIndex:'scope', render:(v:string)=><Tag>{v==='全局'?'🌐 全局':'🏪 门店'}</Tag> },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_MAP[v]?.color||'default'}>{STATUS_MAP[v]?.label||v}</Tag> },
];

export default function CapabilityAccessPage() {
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const filtered = scopeFilter === 'all' ? ROLE_DATA : ROLE_DATA.filter(r => r.scope === scopeFilter);
  const activeUsers = ROLE_DATA.filter(r => r.status === 'active').reduce((a, r) => a + r.users, 0);
  return (<PageShell><Space style={{width:'100%',flexDirection:'column',gap:16,alignItems:'stretch'}}>
    <h2 style={{color:'#f8fafc',margin:0}}>🔐 权限管理</h2>
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="角色总数" value={ROLE_DATA.length}/></Card></Col>
      <Col span={6}><Card><Statistic title="活跃用户" value={activeUsers}/></Card></Col>
      <Col span={6}><Card><Statistic title="启用角色" value={ROLE_DATA.filter(r=>r.status==='active').length} valueStyle={{color:'#34d399'}}/></Card></Col>
      <Col span={6}><Card><Statistic title="草稿角色" value={ROLE_DATA.filter(r=>r.status==='draft').length} valueStyle={{color:'#f59e0b'}}/></Card></Col>
    </Row>
    <Card><Space style={{marginBottom:12}}>
      <span style={{color:'#94a3b8',fontSize:13}}>作用域:</span>
      <Select value={scopeFilter} onChange={setScopeFilter} style={{width:120}}
        options={[{value:'all',label:'全部'},{value:'全局',label:'全局'},{value:'门店',label:'门店'}]}/>
      <Button type="primary" style={{marginLeft:'auto'}}>新建角色</Button>
    </Space><Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={false}/></Card>
  </Space></PageShell>);
}
