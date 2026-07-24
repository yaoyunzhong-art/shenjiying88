'use client';

import { useState, useMemo } from 'react';
import {
  PageShell, Card, StatCard,
  DataTable, Button, Space, Tag,
  SearchFilterInput, Modal, message, StatusBadge, Tabs,
  Input, type DataTableColumn,
} from '@m5/ui';

import { AdminPermissionGate } from '../components/admin-permission-gate';

// ── 类型定义 ──────────────────────────────────────────
type UserRole = 'super_admin' | 'store_manager' | 'staff' | 'finance' | 'marketing' | 'ops';
type UserStatus = 'active' | 'inactive' | 'suspended';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  status: UserStatus;
  store: string;
  lastLogin: string;
  createdAt: string;
  phone: string;
  loginCount: number;
}

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '超级管理员', store_manager: '店长', staff: '员工',
  finance: '财务', marketing: '营销', ops: '运维',
};

const STATUS_MAP: Record<UserStatus, { label: string; variant: 'success' | 'error' | 'warning' }> = {
  active: { label: '正常', variant: 'success' },
  inactive: { label: '已停用', variant: 'error' },
  suspended: { label: '已冻结', variant: 'warning' },
};

const MOCK_USERS: User[] = [
  { id: 'U001', name: '张明', email: 'zhangming@sportsant.net', role: 'super_admin', permissions: ['*', 'identity-access:write', 'user:write'], status: 'active', store: '总部', lastLogin: '2026-07-20 08:30', createdAt: '2024-01-01', phone: '13800001111', loginCount: 1286 },
  { id: 'U002', name: '李芳', email: 'lifang@store-a.com', role: 'store_manager', permissions: ['store:read', 'staff:read', 'staff:write'], status: 'active', store: '朝阳店', lastLogin: '2026-07-19 09:15', createdAt: '2024-03-15', phone: '13800002222', loginCount: 856 },
  { id: 'U003', name: '王伟', email: 'wangwei@store-a.com', role: 'staff', permissions: ['store:read', 'schedule:read'], status: 'active', store: '朝阳店', lastLogin: '2026-07-19 18:45', createdAt: '2024-06-01', phone: '13800003333', loginCount: 523 },
  { id: 'U004', name: '赵敏', email: 'zhaomin@finance.com', role: 'finance', permissions: ['finance:read', 'finance:export'], status: 'active', store: '总部', lastLogin: '2026-07-20 10:00', createdAt: '2024-05-20', phone: '13800004444', loginCount: 412 },
  { id: 'U005', name: '孙磊', email: 'sunlei@market.com', role: 'marketing', permissions: ['campaign:read', 'campaign:write'], status: 'active', store: '总部', lastLogin: '2026-07-19 16:20', createdAt: '2024-07-01', phone: '13800005555', loginCount: 367 },
  { id: 'U006', name: '周婷', email: 'zhouting@store-a.com', role: 'staff', permissions: ['store:read'], status: 'inactive', store: '朝阳店', lastLogin: '2026-06-30 12:00', createdAt: '2025-01-10', phone: '13800006666', loginCount: 189 },
  { id: 'U007', name: '吴强', email: 'wuqiang@ops.com', role: 'ops', permissions: ['monitor:read', 'alert:write'], status: 'active', store: '总部', lastLogin: '2026-07-20 07:50', createdAt: '2024-09-01', phone: '13800007777', loginCount: 634 },
  { id: 'U008', name: '郑浩', email: 'zhenghao@store-b.com', role: 'store_manager', permissions: ['store:read', 'staff:read'], status: 'suspended', store: '海淀店', lastLogin: '2026-07-10 14:30', createdAt: '2024-11-01', phone: '13800008888', loginCount: 278 },
  { id: 'U009', name: '陈雪', email: 'chenxue@store-b.com', role: 'staff', permissions: ['store:read', 'schedule:read'], status: 'active', store: '海淀店', lastLogin: '2026-07-19 14:10', createdAt: '2025-03-01', phone: '13800009999', loginCount: 145 },
  { id: 'U010', name: '刘洋', email: 'liuyang@store-c.com', role: 'staff', permissions: ['store:read', 'inventory:read'], status: 'active', store: '西单店', lastLogin: '2026-07-18 20:00', createdAt: '2025-02-15', phone: '13800001010', loginCount: 210 },
  { id: 'U011', name: '杨华', email: 'yanghua@store-c.com', role: 'staff', permissions: ['store:read'], status: 'active', store: '西单店', lastLogin: '2026-07-17 12:30', createdAt: '2025-04-01', phone: '13800001111', loginCount: 98 },
  { id: 'U012', name: '马鹏', email: 'mapeng@store-d.com', role: 'store_manager', permissions: ['store:read', 'staff:read', 'inventory:read'], status: 'active', store: '望京店', lastLogin: '2026-07-18 09:00', createdAt: '2025-03-15', phone: '13800001212', loginCount: 312 },
];

const ALL_ROLES: UserRole[] = ['super_admin', 'store_manager', 'staff', 'finance', 'marketing', 'ops'];

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '用户管理访问受限',
  description:
    '用户管理页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看用户列表、角色分布与权限配置。',
} as const;

const columns: DataTableColumn<User>[] = [
  { key: 'name', title: '姓名', dataKey: 'name', sortable: true, render: (row) => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{row.name}</span> },
  { key: 'email', title: '邮箱', dataKey: 'email', sortable: true },
  {
    key: 'role',
    title: '角色',
    dataKey: 'role',
    sortable: true,
    render: (row) => (
      <div style={{ display: 'grid', gap: 4 }}>
        <Tag>{ROLE_LABELS[row.role]}</Tag>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {row.permissions.includes('*') ? '全部权限' : `权限 ${row.permissions.length} 项`}
        </span>
      </div>
    ),
  },
  { key: 'status', title: '状态', dataKey: 'status', sortable: true, render: (row) => <StatusBadge label={STATUS_MAP[row.status].label} variant={STATUS_MAP[row.status].variant} size="sm" dot /> },
  { key: 'store', title: '门店', dataKey: 'store', sortable: true },
  { key: 'lastLogin', title: '最后登录', dataKey: 'lastLogin', sortable: true },
  { key: 'loginCount', title: '登录次数', dataKey: 'loginCount', sortable: true },
];

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showNewUserModal, setShowNewUserModal] = useState(false);

  const filtered = useMemo(() => MOCK_USERS.filter((u) => {
    const ms = !searchTerm || `${u.name} ${u.email} ${u.store} ${u.permissions.join(' ')}`.toLowerCase().includes(searchTerm.toLowerCase());
    const mr = roleFilter === 'ALL' || u.role === roleFilter;
    return ms && mr;
  }), [searchTerm, roleFilter]);

  const totals = useMemo(() => ({
    total: MOCK_USERS.length,
    active: MOCK_USERS.filter((u) => u.status === 'active').length,
    inactiveCount: MOCK_USERS.filter((u) => u.status === 'inactive').length,
    suspended: MOCK_USERS.filter((u) => u.status === 'suspended').length,
  }), []);

  const stores = useMemo(() => [...new Set(MOCK_USERS.map((u) => u.store))], []);

  return (
    <AdminPermissionGate {...permissionGate}>
      <PageShell title="👥 用户管理">
        <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#f8fafc', margin: 0, fontSize: 20 }}>用户列表 · 角色管理 · 权限配置</h2>
            <Space>
              <Button variant="primary" onClick={() => setShowNewUserModal(true)}>新建用户</Button>
              <Button onClick={() => message.success('正在导出用户列表…')}>导出列表</Button>
            </Space>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatCard label="总用户" value={totals.total} />
            <StatCard label="活跃用户" value={totals.active} variant="info" />
            <StatCard label="已停用" value={totals.inactiveCount} variant="warning" />
            <StatCard label="已冻结" value={totals.suspended} variant="error" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Card title="角色分布">
              {ALL_ROLES.map((role) => <div key={role}>{ROLE_LABELS[role]}: {MOCK_USERS.filter((u) => u.role === role).length}</div>)}
            </Card>
            <Card title="门店分布">
              {stores.map((store) => <div key={store}>{store}: {MOCK_USERS.filter((u) => u.store === store).length} 人</div>)}
            </Card>
            <Card title="今日活跃">
              <div style={{ color: '#34d399' }}>今日登录: {MOCK_USERS.filter((u) => u.lastLogin.startsWith('2026-07-20')).length} 人</div>
              <div style={{ color: '#f59e0b', marginTop: 4 }}>7日内未登录: {MOCK_USERS.filter((u) => u.lastLogin < '2026-07-13').length} 人</div>
            </Card>
          </div>

          <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索用户姓名 / 邮箱 / 门店…" />

          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: MOCK_USERS.length },
              ...ALL_ROLES.map((r) => ({ key: r, label: ROLE_LABELS[r], count: MOCK_USERS.filter((u) => u.role === r).length })),
            ]}
            activeKey={roleFilter}
            onChange={setRoleFilter}
            variant="pills"
            size="sm"
          />

          <DataTable columns={columns} items={filtered} rowKey={(item) => item.id} striped compact />

          <Modal title="新建用户" open={showNewUserModal} onClose={() => setShowNewUserModal(false)}
            footer={
              <Space>
                <Button onClick={() => setShowNewUserModal(false)}>取消</Button>
                <Button variant="primary" onClick={() => { message.success('用户创建成功'); setShowNewUserModal(false); }}>确定</Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
              <div><div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>姓名</div><Input placeholder="姓名" style={{ width: '100%' }} /></div>
              <div><div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>邮箱</div><Input placeholder="邮箱" style={{ width: '100%' }} /></div>
              <div><div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>手机号</div><Input placeholder="手机号" style={{ width: '100%' }} /></div>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>角色</div>
                <Space style={{ gap: 8 }}>
                  {ALL_ROLES.map((r) => <Button key={r} variant="outline" size="sm" onClick={() => {}}>{ROLE_LABELS[r]}</Button>)}
                </Space>
              </div>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>门店</div>
                <Space style={{ gap: 8 }}>
                  {stores.map((s) => <Button key={s} variant="outline" size="sm" onClick={() => {}}>{s}</Button>)}
                </Space>
              </div>
            </Space>
          </Modal>
        </Space>
      </PageShell>
    </AdminPermissionGate>
  );
}
