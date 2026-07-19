'use client';

import { useState, useMemo } from 'react';
import {
  PageShell, Card, StatCard, Row, Col, Statistic,
  DataTable, Tag, Button, Space, Select,
  SearchFilterInput, Modal, message, StatusBadge, Tabs,
  Empty, Tooltip, Input, type DataTableColumn,
} from '@m5/ui';

// ── 类型定义 ──────────────────────────────────────────
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
  phone: string;
  loginCount: number;
}

// ── 角色 → 中文 ───────────────────────────────────────
const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '超级管理员',
  store_manager: '店长',
  staff: '员工',
  finance: '财务',
  marketing: '营销',
  ops: '运维',
};

const STATUS_MAP: Record<UserStatus, { label: string; variant: 'success' | 'danger' | 'warning' }> = {
  active: { label: '正常', variant: 'success' },
  inactive: { label: '已停用', variant: 'danger' },
  suspended: { label: '已冻结', variant: 'warning' },
};

// ── Mock 数据 ─────────────────────────────────────────
const MOCK_USERS: User[] = [
  { id: 'U001', name: '张明', email: 'zhangming@sportsant.net', role: 'super_admin', status: 'active', store: '总部', lastLogin: '2026-07-20 08:30', createdAt: '2024-01-01', phone: '13800001111', loginCount: 1286 },
  { id: 'U002', name: '李芳', email: 'lifang@store-a.com', role: 'store_manager', status: 'active', store: '朝阳店', lastLogin: '2026-07-19 09:15', createdAt: '2024-03-15', phone: '13800002222', loginCount: 856 },
  { id: 'U003', name: '王伟', email: 'wangwei@store-a.com', role: 'staff', status: 'active', store: '朝阳店', lastLogin: '2026-07-19 18:45', createdAt: '2024-06-01', phone: '13800003333', loginCount: 523 },
  { id: 'U004', name: '赵敏', email: 'zhaomin@finance.com', role: 'finance', status: 'active', store: '总部', lastLogin: '2026-07-20 10:00', createdAt: '2024-05-20', phone: '13800004444', loginCount: 412 },
  { id: 'U005', name: '孙磊', email: 'sunlei@market.com', role: 'marketing', status: 'active', store: '总部', lastLogin: '2026-07-19 16:20', createdAt: '2024-07-01', phone: '13800005555', loginCount: 367 },
  { id: 'U006', name: '周婷', email: 'zhouting@store-a.com', role: 'staff', status: 'inactive', store: '朝阳店', lastLogin: '2026-06-30 12:00', createdAt: '2025-01-10', phone: '13800006666', loginCount: 189 },
  { id: 'U007', name: '吴强', email: 'wuqiang@ops.com', role: 'ops', status: 'active', store: '总部', lastLogin: '2026-07-20 07:50', createdAt: '2024-09-01', phone: '13800007777', loginCount: 634 },
  { id: 'U008', name: '郑浩', email: 'zhenghao@store-b.com', role: 'store_manager', status: 'suspended', store: '海淀店', lastLogin: '2026-07-10 14:30', createdAt: '2024-11-01', phone: '13800008888', loginCount: 278 },
  { id: 'U009', name: '陈雪', email: 'chenxue@store-b.com', role: 'staff', status: 'active', store: '海淀店', lastLogin: '2026-07-19 14:10', createdAt: '2025-03-01', phone: '13800009999', loginCount: 145 },
  { id: 'U010', name: '刘洋', email: 'liuyang@store-c.com', role: 'staff', status: 'active', store: '西单店', lastLogin: '2026-07-18 20:00', createdAt: '2025-02-15', phone: '13800001010', loginCount: 210 },
];

// ── 表列定义 ──────────────────────────────────────────
const columns: DataTableColumn<User>[] = [
  {
    key: 'name',
    title: '姓名',
    dataKey: 'name',
    sortable: true,
    render: (item) => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{item.name}</span>,
  },
  { key: 'email', title: '邮箱', dataKey: 'email', sortable: true },
  {
    key: 'role',
    title: '角色',
    dataKey: 'role',
    sortable: true,
    render: (item) => <Tag>{ROLE_LABELS[item.role]}</Tag>,
  },
  {
    key: 'status',
    title: '状态',
    dataKey: 'status',
    sortable: true,
    render: (item) => (
      <StatusBadge label={STATUS_MAP[item.status].label} variant={STATUS_MAP[item.status].variant} size="sm" dot />
    ),
  },
  { key: 'store', title: '门店', dataKey: 'store', sortable: true },
  {
    key: 'lastLogin',
    title: '最后登录',
    dataKey: 'lastLogin',
    sortable: true,
  },
  {
    key: 'actions',
    title: '操作',
    width: 180,
    render: (_value, record) => (
      <Space size="small">
        <Button size="small" onClick={() => message.info(`查看 ${record.name} 详情`)}>详情</Button>
        <Button size="small"
          type={record.status === 'active' ? 'default' : 'primary'}
          onClick={() => {
            message.success(record.status === 'active' ? `已冻结 ${record.name}` : `已解冻 ${record.name}`);
          }}
        >
          {record.status === 'active' ? '冻结' : '解冻'}
        </Button>
      </Space>
    ),
  },
];

// ── 页面组件 ──────────────────────────────────────────
export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedRows, setSelectedRows] = useState<User[]>([]);
  const [showNewUserModal, setShowNewUserModal] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_USERS.filter((u) => {
      const matchesSearch =
        !searchTerm ||
        `${u.name} ${u.email} ${u.store}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [searchTerm, roleFilter]);

  const roleStats = useMemo(
    () => ({
      total: MOCK_USERS.length,
      active: MOCK_USERS.filter((u) => u.status === 'active').length,
      inactive: MOCK_USERS.filter((u) => u.status === 'inactive').length,
      suspended: MOCK_USERS.filter((u) => u.status === 'suspended').length,
      storeManagers: MOCK_USERS.filter((u) => u.role === 'store_manager').length,
    }),
    [],
  );

  const handleBatchAction = (action: string) => {
    if (selectedRows.length === 0) {
      message.warning('请先选择用户');
      return;
    }
    if (action === 'freeze') {
      message.success(`已批量冻结 ${selectedRows.length} 名用户`);
    } else if (action === 'unfreeze') {
      message.success(`已批量解冻 ${selectedRows.length} 名用户`);
    } else if (action === 'export') {
      message.success(`正在导出 ${selectedRows.length} 名用户数据`);
    }
  };

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {/* ── 标题栏 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>👥 用户管理</h2>
          <Space>
            <Button onClick={() => setShowNewUserModal(true)} type="primary">新建用户</Button>
            <Button>导出列表</Button>
          </Space>
        </div>

        {/* ── 统计卡片 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard label="总用户" value={roleStats.total} variant="default" />
          <StatCard label="活跃用户" value={roleStats.active} variant="info" />
          <StatCard label="已停用" value={roleStats.inactive} variant="warning" />
          <StatCard label="已冻结" value={roleStats.suspended} variant="danger" />
        </div>

        {/* ── 快捷信息行 ── */}
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" title="角色分布">
              <div>超级管理员: {MOCK_USERS.filter((u) => u.role === 'super_admin').length}</div>
              <div>店长: {roleStats.storeManagers}</div>
              <div>员工: {MOCK_USERS.filter((u) => u.role === 'staff').length}</div>
              <div>财务: {MOCK_USERS.filter((u) => u.role === 'finance').length}</div>
              <div>营销: {MOCK_USERS.filter((u) => u.role === 'marketing').length}</div>
              <div>运维: {MOCK_USERS.filter((u) => u.role === 'ops').length}</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="门店分布">
              {[...new Set(MOCK_USERS.map((u) => u.store))].map((store) => (
                <div key={store}>
                  {store}: {MOCK_USERS.filter((u) => u.store === store).length} 人
                </div>
              ))}
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="今日活跃">
              <div style={{ color: '#34d399' }}>
                今日登录: {MOCK_USERS.filter((u) => u.lastLogin.startsWith('2026-07-20')).length} 人
              </div>
              <div style={{ color: '#f59e0b' }}>
                7日内未登录: {MOCK_USERS.filter((u) => u.lastLogin < '2026-07-13').length} 人
              </div>
            </Card>
          </Col>
        </Row>

        {/* ── 筛选区 ── */}
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索用户姓名 / 邮箱 / 门店..."
        />

        <Tabs
          items={[
            { key: 'ALL', label: '全部', count: MOCK_USERS.length },
            ...(['super_admin', 'store_manager', 'staff', 'finance', 'marketing', 'ops'] as UserRole[]).map(
              (r) => ({
                key: r,
                label: ROLE_LABELS[r],
                count: MOCK_USERS.filter((u) => u.role === r).length,
              }),
            ),
          ]}
          activeKey={roleFilter}
          onChange={setRoleFilter}
          variant="pills"
          size="sm"
        />

        {/* ── 批量操作栏 ── */}
        {selectedRows.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 16px',
              background: '#1e293b',
              borderRadius: 8,
              border: '1px solid #334155',
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              已选 {selectedRows.length} 项
            </span>
            <Button size="small" onClick={() => handleBatchAction('freeze')}>
              批量冻结
            </Button>
            <Button size="small" onClick={() => handleBatchAction('unfreeze')}>
              批量解冻
            </Button>
            <Button size="small" onClick={() => handleBatchAction('export')}>
              导出选中
            </Button>
            <Button size="small" onClick={() => setSelectedRows([])}>
              取消选择
            </Button>
          </div>
        )}

        {/* ── 数据表格 ── */}
        <DataTable
          columns={columns}
          items={filtered}
          rowKey={(item) => item.id}
          striped
          compact
          pagination={{ pageSize: 10 }}
          selectedItems={selectedRows}
          onSelectionChange={setSelectedRows}
        />

        {/* ── 新建用户弹窗 ── */}
        <Modal
          title="新建用户"
          open={showNewUserModal}
          onCancel={() => setShowNewUserModal(false)}
          onOk={() => {
            message.success('用户创建成功');
            setShowNewUserModal(false);
          }}
        >
          <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>姓名</div>
              <Input placeholder="请输入姓名" style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>邮箱</div>
              <Input placeholder="请输入邮箱" style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>角色</div>
              <Select
                style={{ width: '100%' }}
                options={[
                  { value: 'staff', label: '员工' },
                  { value: 'store_manager', label: '店长' },
                  { value: 'finance', label: '财务' },
                  { value: 'super_admin', label: '超级管理员' },
                ]}
              />
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>门店</div>
              <Select
                style={{ width: '100%' }}
                options={[
                  { value: '总部', label: '总部' },
                  { value: '朝阳店', label: '朝阳店' },
                  { value: '海淀店', label: '海淀店' },
                  { value: '西单店', label: '西单店' },
                ]}
              />
            </div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
