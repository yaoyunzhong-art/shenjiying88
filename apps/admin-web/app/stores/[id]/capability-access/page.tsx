// 🔐 权限管理 · 角色/用户/功能权限 · 完整角色管理
'use client';
import { useState, useMemo } from 'react';
import { PageShell, Card, Table, Tag, Button, Space, Statistic, Row, Col, Select, Modal, message, Input, Tabs, Switch, Empty, Popconfirm, Tooltip } from '@m5/ui';
import { AdminPermissionGate } from '../../../components/admin-permission-gate';

const permissionGate = {
  requiredPermission: 'store:read',
  title: '门店能力访问访问受限',
  description:
    '门店能力访问页已接入管理员本地 session，只有具备 store:read 的账号才能查看角色权限、作用域筛选与能力访问配置。',
} as const;

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
  { title:'作用域', dataIndex:'scope', render:(v:string)=><Tag>{v === '全局' ? '🌐 全局' : '🏪 门店'}</Tag> },
  { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={STATUS_MAP[v]?.color||'default'}>{STATUS_MAP[v]?.label||v}</Tag> },
  {
    title:'操作', key:'a', width:160,
    render:(_:unknown,r:typeof ROLE_DATA[0])=>(
      <Space size="small">
        <Tooltip title="编辑角色权限"><Button size="small">编辑</Button></Tooltip>
        {r.status === 'draft' && <Button size="small" type="primary">启用</Button>}
        {r.status === 'active' && r.name !== '超级管理员' && <Popconfirm title="确认停用？" onConfirm={()=>message.success('已停用')}><Button size="small" danger>停用</Button></Popconfirm>}
      </Space>
    ),
  },
];

export default function CapabilityAccessPage() {
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('roles');

  const filtered = useMemo(() => {
    let r = ROLE_DATA;
    if (scopeFilter !== 'all') r = r.filter(d => d.scope === scopeFilter);
    if (statusFilter !== 'all') r = r.filter(d => d.status === statusFilter);
    return r;
  }, [scopeFilter, statusFilter]);

  const activeUsers = ROLE_DATA.filter(r => r.status === 'active').reduce((a, r) => a + r.users, 0);
  const totalUsers = ROLE_DATA.reduce((a, r) => a + r.users, 0);

  return (
    <AdminPermissionGate {...permissionGate}>
      <PageShell>
        <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ color: '#f8fafc', margin: 0 }}>🔐 权限管理</h2><span style={{ color: '#94a3b8', fontSize: 13 }}>角色 · 用户 · 功能权限管控</span></div>
          <Button type="primary" onClick={() => setShowCreate(true)}>+ 新建角色</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="角色总数" value={ROLE_DATA.length} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="总人数" value={totalUsers} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="活跃用户" value={activeUsers} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="启用角色" value={ROLE_DATA.filter(r => r.status === 'active').length} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card size="small"><Statistic title="草稿角色" value={ROLE_DATA.filter(r => r.status === 'draft').length} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
        </Row>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="roles" label="角色管理" />
            <Tabs.Tab key="users" label="用户管理" />
            <Tabs.Tab key="audit" label="权限审计" />
          </Tabs>

          {tab === 'roles' && (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>作用域:</span>
                <Select value={scopeFilter} onChange={setScopeFilter} style={{ width: 120 }}
                  options={[{ value: 'all', label: '全部' }, { value: '全局', label: '全局' }, { value: '门店', label: '门店' }]} />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}
                  options={[{ value: 'all', label: '全部' }, { value: 'active', label: '启用' }, { value: 'draft', label: '草稿' }]} />
              </Space>
              <Table dataSource={filtered} columns={COLUMNS} rowKey="id" pagination={{ pageSize: 8 }} />
            </>
          )}

          {tab === 'users' && (
            <Empty description="用户管理详情页面开发中…" />
          )}

          {tab === 'audit' && (
            <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
              <Card size="small" title="权限合规检查">
                <div>✅ 最小权限原则: 7角色中全部符合</div>
                <div>✅ 敏感权限分离: 财务与业务角色分离</div>
                <div>✅ 管理员审计: 超级管理员仅2人</div>
                <Button style={{ marginTop: 8 }}>生成权限审计报告</Button>
              </Card>
            </Space>
          )}
        </Card>

        <Modal title="新建角色" open={showCreate} onCancel={() => setShowCreate(false)}
          onOk={() => { message.success('角色已创建'); setShowCreate(false); }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="角色名称" />
            <Input placeholder="角色说明" />
            <Select placeholder="作用域" style={{ width: '100%' }}>
              <Select.Option value="全局">全局</Select.Option>
              <Select.Option value="门店">门店</Select.Option>
            </Select>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>创建后为草稿状态，需配置权限后启用</div>
          </Space>
        </Modal>
        </Space>
      </PageShell>
    </AdminPermissionGate>
  );
}
