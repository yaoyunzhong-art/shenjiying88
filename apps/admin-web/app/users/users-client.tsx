'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react'
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  Modal,
  PageShell,
  SearchFilterInput,
  Space,
  StatCard,
  StatusBadge,
  Tabs,
  Tag,
  type DataTableColumn,
} from '@m5/ui'
import type { User, UsersSnapshotDelivery } from './users-data'
import {
  ALL_ROLES,
  buildRoleCounts,
  buildStoreCounts,
  computeActivityInsights,
  computeUserStats,
  matchesUserSearch,
  ROLE_LABELS,
  STATUS_MAP,
} from './users-data'
import BatchOperationsBar, { type BatchAction } from '../../components/shell/BatchOperationsBar';
import { useRowSelection } from '../../components/shell/useRowSelection';
import { useCrudFeedback } from '../../components/shell/FeedbackProvider';

export default function UsersClient({
  snapshot,
}: {
  snapshot: UsersSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'ALL'>('ALL')
  const [showNewUserModal, setShowNewUserModal] = useState(false)
  const users = snapshot.users

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
        return matchesRole && matchesUserSearch(user, searchTerm)
      }),
    [roleFilter, searchTerm, users]
  )

  const totals = useMemo(() => computeUserStats(users), [users])
  const roleCounts = useMemo(() => buildRoleCounts(users), [users])
  const storeCounts = useMemo(() => buildStoreCounts(users), [users])
  const activity = useMemo(() => computeActivityInsights(users), [users])

  const columns: DataTableColumn<User>[] = useMemo(
    () => [
      {
        key: 'name',
        title: '姓名',
        dataKey: 'name',
        sortable: true,
        render: (row) => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{row.name}</span>,
      },
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
      {
        key: 'status',
        title: '状态',
        dataKey: 'status',
        sortable: true,
        render: (row) => (
          <StatusBadge
            label={STATUS_MAP[row.status].label}
            variant={STATUS_MAP[row.status].variant}
            size="sm"
            dot
          />
        ),
      },
      { key: 'store', title: '门店', dataKey: 'store', sortable: true },
      { key: 'lastLogin', title: '最后登录', dataKey: 'lastLogin', sortable: true },
      { key: 'loginCount', title: '登录次数', dataKey: 'loginCount', sortable: true },
    ],
    []
  )

  const selection = useRowSelection(filtered, (item) => item.id);
  const feedback = useCrudFeedback();

  const columnsWithCheckbox = useMemo<DataTableColumn<User>[]>(() => [
    { key: '_select', title: '✅', width: '40px', render: (item: User) => (
      <input type="checkbox" checked={selection.selectedIds.has(item.id)} 
        onChange={() => selection.toggle(item.id)} onClick={(e) => e.stopPropagation()}
        style={{ cursor: 'pointer', width: 16, height: 16 }} />
    )}, ...columns,
  ], [columns, selection.selectedIds, selection.toggle]);

  const batchActions: BatchAction[] = useMemo(() => [
    { key: 'batch-enable', label: '批量启用', icon: '✅', variant: 'primary',
      onClick: () => { feedback.success(`已启用 ${selection.selectedCount} 个用户`); selection.clear(); } },
    { key: 'batch-disable', label: '批量禁用', icon: '⛔', variant: 'danger',
      onClick: () => { feedback.success(`已禁用 ${selection.selectedCount} 个用户`); selection.clear(); } },
    { key: 'batch-delete', label: '批量删除', icon: '🗑️', variant: 'danger',
      onClick: () => { feedback.success(`已删除 ${selection.selectedCount} 个用户`); selection.clear(); } },
    { key: 'batch-export', label: '导出选中', icon: '📤', variant: 'default',
      onClick: () => { feedback.info(`正在导出 ${selection.selectedCount} 个用户...`); selection.clear(); } },
  ], [selection, feedback]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell title="用户管理">
        <Space style={{ width: '100%', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#f8fafc', margin: 0, fontSize: 20 }}>
              用户列表 · 角色管理 · 权限配置
            </h2>
            <Space>
              <Button variant="secondary" onClick={() => handleRefresh()}>
                {isRefreshing ? '刷新中...' : '刷新'}
              </Button>
              <Button variant="primary" onClick={() => setShowNewUserModal(true)}>
                新建用户
              </Button>
            </Space>
          </div>

          {snapshot.error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.28)',
                color: '#92400e',
                fontSize: 12,
              }}
            >
              {snapshot.error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatCard label="总用户" value={totals.total} />
            <StatCard label="活跃用户" value={totals.active} variant="info" />
            <StatCard label="已停用" value={totals.inactiveCount} variant="warning" />
            <StatCard label="已冻结" value={totals.suspended} variant="error" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Card title="角色分布">
              {roleCounts.map((item) => (
                <div key={item.role}>
                  {item.label}: {item.count}
                </div>
              ))}
            </Card>
            <Card title="门店分布">
              {storeCounts.map((item) => (
                <div key={item.store}>
                  {item.store}: {item.count} 人
                </div>
              ))}
            </Card>
            <Card title="今日活跃">
              <div style={{ color: '#34d399' }}>今日登录: {activity.todayLogin} 人</div>
              <div style={{ color: '#f59e0b', marginTop: 4 }}>
                7日内未登录: {activity.inactiveWithinSevenDays} 人
              </div>
            </Card>
          </div>

          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索用户姓名 / 邮箱 / 门店..."
          />

          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: users.length },
              ...ALL_ROLES.map((role) => ({
                key: role,
                label: ROLE_LABELS[role],
                count: users.filter((user) => user.role === role).length,
              })),
            ]}
            activeKey={roleFilter}
            onChange={(key) => setRoleFilter(key as User['role'] | 'ALL')}
            variant="pills"
            size="sm"
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="暂无用户"
              description="当前筛选条件下没有可显示的用户记录，请调整筛选条件或稍后刷新。"
            />
          ) : (
            <>
              {selection.selectedCount > 0 && (
                <BatchOperationsBar
                  selectedCount={selection.selectedCount}
                  totalCount={filtered.length}
                  actions={batchActions}
                  onClearSelection={selection.clear}
                  itemLabel="用户"
                />
              )}
              <DataTable columns={columnsWithCheckbox} items={filtered} rowKey={(item) => item.id} striped compact />
            </>
          )}

          <Modal
            title="新建用户"
            open={showNewUserModal}
            onClose={() => setShowNewUserModal(false)}
            footer={
              <Space>
                <Button onClick={() => setShowNewUserModal(false)}>取消</Button>
                <Button variant="primary" onClick={() => setShowNewUserModal(false)}>
                  确定
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>姓名</div>
                <Input placeholder="姓名" style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>邮箱</div>
                <Input placeholder="邮箱" style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>手机号</div>
                <Input placeholder="手机号" style={{ width: '100%' }} />
              </div>
            </Space>
          </Modal>
        </Space>
      </PageShell>
    </main>
  )
}
