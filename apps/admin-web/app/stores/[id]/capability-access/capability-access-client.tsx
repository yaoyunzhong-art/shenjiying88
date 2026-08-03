'use client';
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Col, Row, message } from 'antd';
import {
  Button,
  Card,
  Input,
  Modal,
  PageShell,
  Popconfirm,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from '@m5/ui';

import {
  STATUS_MAP,
  type CapabilityAccessSnapshot,
  type RoleRecord,
  type RoleScope,
  type RoleStatus,
} from './capability-access-data';

type DiagnosticTagColor = 'default' | 'green' | 'orange' | 'red';

function getDiagnosticTagColor(status: CapabilityAccessSnapshot['diagnostics'][number]['status']): DiagnosticTagColor {
  if (status === 'stable') return 'green';
  if (status === 'watch') return 'orange';
  if (status === 'risk') return 'red';
  return 'default';
}

export default function CapabilityAccessClient({
  snapshot,
}: {
  snapshot: CapabilityAccessSnapshot;
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [roles, setRoles] = useState(snapshot.roles);
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('roles');
  const [draftRoleName, setDraftRoleName] = useState('');
  const [draftRoleDesc, setDraftRoleDesc] = useState('');
  const [draftRoleScope, setDraftRoleScope] = useState<RoleScope>('门店');

  useEffect(() => {
    setRoles(snapshot.roles);
  }, [snapshot.roles]);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesScope = scopeFilter === 'all' || role.scope === scopeFilter;
      const matchesStatus = statusFilter === 'all' || role.status === statusFilter;
      return matchesScope && matchesStatus;
    });
  }, [roles, scopeFilter, statusFilter]);

  const refreshSnapshot = () => {
    handleRefresh();
  };

  const createRole = () => {
    if (!draftRoleName.trim()) {
      message.error('请填写角色名称');
      return;
    }
    const nextRole: RoleRecord = {
      id: `draft-${roles.length + 1}`,
      name: draftRoleName.trim(),
      users: 0,
      permissions: '待配置',
      desc: draftRoleDesc.trim() || '待补充说明',
      scope: draftRoleScope,
      status: 'draft',
    };
    setRoles((current) => [nextRole, ...current]);
    setDraftRoleName('');
    setDraftRoleDesc('');
    setDraftRoleScope('门店');
    setShowCreate(false);
    message.success('角色草稿已创建');
  };

  const updateRoleStatus = (roleId: string, status: RoleStatus) => {
    setRoles((current) => current.map((role) => (role.id === roleId ? { ...role, status } : role)));
    message.success(status === 'active' ? '角色已启用' : '角色已停用');
  };

  const roleColumns = [
    { title: '角色', dataIndex: 'name' },
    { title: '人数', dataIndex: 'users', width: 90 },
    { title: '权限范围', dataIndex: 'permissions', width: 160 },
    { title: '说明', dataIndex: 'desc' },
    {
      title: '作用域',
      dataIndex: 'scope',
      width: 110,
      render: (value: RoleScope) => <Tag>{value === '全局' ? '全局' : '门店'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: RoleStatus) => <Tag color={STATUS_MAP[value]?.color ?? 'default'}>{STATUS_MAP[value]?.label ?? value}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: unknown, role: RoleRecord) => (
        <Space size="small">
          <Tooltip title="编辑角色权限">
            <Button size="small" onClick={() => message.info(`角色 ${role.name} 已进入编辑态`)}>
              编辑
            </Button>
          </Tooltip>
          {role.status === 'draft' ? (
            <Button size="small" type="primary" onClick={() => updateRoleStatus(role.id, 'active')}>
              启用
            </Button>
          ) : null}
          {role.status === 'active' && role.name !== '超级管理员' ? (
            <Popconfirm title="确认停用？" onConfirm={() => updateRoleStatus(role.id, 'disabled')}>
              <Button size="small" danger>
                停用
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  const userColumns = [
    { title: '用户', dataIndex: 'name' },
    { title: '角色', dataIndex: 'role' },
    { title: '作用域', dataIndex: 'scope', render: (value: RoleScope) => <Tag>{value}</Tag> },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: string) => <Tag color={value === 'active' ? 'green' : 'orange'}>{value === 'active' ? '已生效' : '待同步'}</Tag>,
    },
  ];

  return (
    <PageShell title="权限管理" subtitle="server wrapper + snapshot loader + client renderer">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {snapshot.error ? (
          <Card>
            <span style={{ color: '#fbbf24', fontSize: 13 }}>{snapshot.error}</span>
          </Card>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>权限管理</h2>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
              角色 · 用户 · 功能权限管控 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </div>
          </div>
          <Space>
            <Button variant="outline" onClick={refreshSnapshot} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </Button>
            <Button type="primary" onClick={() => setShowCreate(true)}>
              + 新建角色
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="角色总数" value={roles.length} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="总人数" value={snapshot.summary.totalUsers} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="活跃用户" value={snapshot.summary.activeUsers} valueStyle={{ color: '#34d399' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic title="全局角色" value={snapshot.summary.globalRoles} valueStyle={{ color: '#60a5fa' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small">
              <Statistic
                title="草稿角色"
                value={roles.filter((role) => role.status === 'draft').length}
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="来源态诊断" subtitle="角色样本、账号同步和能力写链状态">
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {snapshot.diagnostics.map((diagnostic) => (
              <div
                key={diagnostic.id}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: 12,
                  padding: 14,
                  background: 'rgba(15, 23, 42, 0.35)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{diagnostic.title}</span>
                  <Tag color={getDiagnosticTagColor(diagnostic.status)}>{diagnostic.status}</Tag>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>{diagnostic.detail}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Tabs value={tab} onChange={setTab} style={{ marginBottom: 12 }}>
            <Tabs.Tab key="roles" label="角色管理" />
            <Tabs.Tab key="users" label="用户管理" />
            <Tabs.Tab key="audit" label="权限审计" />
          </Tabs>

          {tab === 'roles' ? (
            <>
              <Space style={{ marginBottom: 12, gap: 8 }} wrap>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>作用域:</span>
                <Select
                  value={scopeFilter}
                  onChange={setScopeFilter}
                  style={{ width: 120 }}
                  options={[
                    { value: 'all', label: '全部' },
                    { value: '全局', label: '全局' },
                    { value: '门店', label: '门店' },
                  ]}
                />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>状态:</span>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 120 }}
                  options={[
                    { value: 'all', label: '全部' },
                    { value: 'active', label: '启用' },
                    { value: 'draft', label: '草稿' },
                    { value: 'disabled', label: '停用' },
                  ]}
                />
                <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12 }}>
                  generatedAt {snapshot.generatedAt}
                </span>
              </Space>
              <Table dataSource={filteredRoles} columns={roleColumns} rowKey="id" pagination={{ pageSize: 8 }} />
            </>
          ) : null}

          {tab === 'users' ? (
            <Table dataSource={snapshot.userDigest} columns={userColumns} rowKey="id" pagination={false} />
          ) : null}

          {tab === 'audit' ? (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {snapshot.auditFindings.map((finding) => (
                <Card
                  key={finding.id}
                  size="small"
                  title={finding.title}
                  extra={<Tag color={finding.level === 'pass' ? 'green' : finding.level === 'watch' ? 'orange' : 'red'}>{finding.level}</Tag>}
                >
                  <div style={{ color: '#94a3b8', lineHeight: 1.8 }}>{finding.detail}</div>
                </Card>
              ))}
            </div>
          ) : null}
        </Card>

        <Modal title="新建角色" open={showCreate} onCancel={() => setShowCreate(false)} onOk={createRole}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="角色名称" value={draftRoleName} onChange={(event) => setDraftRoleName(event.target.value)} />
            <Input placeholder="角色说明" value={draftRoleDesc} onChange={(event) => setDraftRoleDesc(event.target.value)} />
            <Select
              value={draftRoleScope}
              onChange={(value) => setDraftRoleScope(value as RoleScope)}
              style={{ width: '100%' }}
              options={[
                { value: '全局', label: '全局' },
                { value: '门店', label: '门店' },
              ]}
            />
            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              当前写链路仍为交互演示，创建后将以草稿状态停留在客户端快照中。
            </div>
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
