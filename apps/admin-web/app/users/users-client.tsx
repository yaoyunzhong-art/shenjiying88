/**
 * UsersClient — 用户管理客户端组件
 * 功能: 用户列表、角色筛选、状态管理、统计摘要、角色分布
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, StatCard, StatusBadge, SearchFilterInput, DataTable, Tabs, type DataTableColumn } from '@m5/ui';

type UserRole = 'super_admin' | 'store_manager' | 'staff' | 'finance' | 'marketing' | 'ops';
type UserStatus = 'active' | 'inactive' | 'suspended';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  store: string;
  lastLogin: string;
  createdAt: string;
}

const MOCK_USERS: User[] = [
  { id: 'u1', name: '张三', email: 'zhangsan@m5.com', role: 'super_admin', status: 'active', store: '总部', lastLogin: '2026-07-17 09:15', createdAt: '2024-01-01' },
  { id: 'u2', name: '李四', email: 'lisi@m5.com', role: 'store_manager', status: 'active', store: '朝阳店', lastLogin: '2026-07-17 08:30', createdAt: '2024-03-15' },
  { id: 'u3', name: '王五', email: 'wangwu@m5.com', role: 'staff', status: 'active', store: '朝阳店', lastLogin: '2026-07-16 18:45', createdAt: '2024-06-01' },
  { id: 'u4', name: '赵六', email: 'zhaoliu@m5.com', role: 'finance', status: 'active', store: '总部', lastLogin: '2026-07-17 10:00', createdAt: '2024-05-20' },
  { id: 'u5', name: '孙七', email: 'sunqi@m5.com', role: 'marketing', status: 'active', store: '总部', lastLogin: '2026-07-16 16:20', createdAt: '2024-07-01' },
  { id: 'u6', name: '周八', email: 'zhouba@m5.com', role: 'staff', status: 'inactive', store: '朝阳店', lastLogin: '2026-06-30 12:00', createdAt: '2025-01-10' },
  { id: 'u7', name: '吴九', email: 'wujiu@m5.com', role: 'ops', status: 'active', store: '总部', lastLogin: '2026-07-17 07:50', createdAt: '2024-09-01' },
  { id: 'u8', name: '郑十', email: 'zhengshi@m5.com', role: 'store_manager', status: 'suspended', store: '海淀店', lastLogin: '2026-07-10 14:30', createdAt: '2024-11-01' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '超级管理员', store_manager: '店长', staff: '员工',
  finance: '财务', marketing: '营销', ops: '运维',
};

const STATUS_MAP: Record<UserStatus, { label: string; variant: 'success' | 'danger' | 'warning' }> = {
  active: { label: '正常', variant: 'success' },
  inactive: { label: '已停用', variant: 'danger' },
  suspended: { label: '已冻结', variant: 'warning' },
};

export default function UsersClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return MOCK_USERS.filter(u => {
      const matchesSearch = !searchTerm || `${u.name} ${u.email} ${u.store}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [searchTerm, roleFilter]);

  const roleStats = useMemo(() => ({
    total: MOCK_USERS.length,
    super_admin: MOCK_USERS.filter(u => u.role === 'super_admin').length,
    staff: MOCK_USERS.filter(u => u.role === 'staff').length,
    finance: MOCK_USERS.filter(u => u.role === 'finance').length,
    ops: MOCK_USERS.filter(u => u.role === 'ops').length,
  }), []);

  const columns: DataTableColumn<User>[] = [
    { key: 'name', title: '姓名', dataKey: 'name', sortable: true, render: (item) => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{item.name}</span> },
    { key: 'email', title: '邮箱', dataKey: 'email', sortable: true },
    { key: 'role', title: '角色', dataKey: 'role', sortable: true, render: (item) => ROLE_LABELS[item.role] },
    { key: 'status', title: '状态', dataKey: 'status', sortable: true, render: (item) => <StatusBadge label={STATUS_MAP[item.status].label} variant={STATUS_MAP[item.status].variant} size="sm" dot /> },
    { key: 'store', title: '门店', dataKey: 'store', sortable: true },
    { key: 'lastLogin', title: '最后登录', dataKey: 'lastLogin', sortable: true },
  ];

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* 用户角色统计条 — 管理员/运营/店员/财务/总用户 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        <StatCard label="总用户" value={roleStats.total} variant="default" />
        <StatCard label="超级管理员" value={roleStats.super_admin} variant="info" />
        <StatCard label="员工" value={roleStats.staff} variant="success" />
        <StatCard label="财务" value={roleStats.finance} variant="warning" />
        <StatCard label="运维" value={roleStats.ops} variant="warning" />
      </div>

      <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索用户姓名/邮箱/门店..." />

      <Tabs
        items={[{ key: 'ALL', label: '全部', count: MOCK_USERS.length },
          ...(['super_admin', 'store_manager', 'staff', 'finance', 'marketing', 'ops'] as UserRole[]).map(r => ({
            key: r, label: ROLE_LABELS[r], count: MOCK_USERS.filter(u => u.role === r).length,
          }))]}
        activeKey={roleFilter}
        onChange={setRoleFilter}
        variant="pills"
        size="sm"
      />

      <DataTable columns={columns} items={filtered} rowKey={item => item.id} striped compact />
    </div>
  );
}
