'use client';
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react';
import { Button, Card, Empty, Input, Modal, PageShell, Select, Space, Statistic, Table, Tabs, Tag, ToastContainer, useToast } from '@m5/ui';
import type { TableColumn } from '@m5/ui';
import { buildActorHeaders } from '@m5/sdk';

import {
  INSPECTION_PAGE_ACTOR,
  type InspectionItem,
  type InspectionSnapshot,
} from './inspection-data';

const INSPECTION_TYPE_MAP: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  equipment: { label: '设备', color: 'primary' },
  safety: { label: '安全', color: 'warning' },
  hygiene: { label: '卫生', color: 'success' },
};

const STATUS_MAP: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  scheduled: { label: '已排期', color: 'default' },
  reminded: { label: '已提醒', color: 'warning' },
  completed: { label: '已完成', color: 'success' },
};

const RESULT_MAP: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  normal: { label: '正常', color: 'success' },
  warning: { label: '警告', color: 'warning' },
  fault: { label: '故障', color: 'error' },
};

export default function InspectionClient({
  snapshot,
}: {
  snapshot: InspectionSnapshot;
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const { toasts, success, error, dismiss } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tab, setTab] = useState('list');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ equipmentName: '', assigneeName: '', scheduledAt: '' });

  const buildInspectionHeaders = useCallback(
    (contentType?: string) => ({
      ...buildActorHeaders({
        ...INSPECTION_PAGE_ACTOR,
        tenantId: snapshot.tenantId,
        storeId: snapshot.storeId,
      }),
      ...(contentType ? { 'Content-Type': contentType } : {}),
    }),
    [snapshot.storeId, snapshot.tenantId],
  );

  const refreshSnapshot = useCallback(() => {
    handleRefresh();
  }, [router, startRefresh]);

  const handleCreate = useCallback(async () => {
    try {
      const response = await fetch('/api/logistics/inspections', {
        method: 'POST',
        headers: buildInspectionHeaders('application/json'),
        body: JSON.stringify({
          storeId: snapshot.storeId,
          equipmentName: newItem.equipmentName,
          assigneeName: newItem.assigneeName,
          scheduledAt: newItem.scheduledAt || new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('create failed');
      success('新建巡检成功');
      setShowAdd(false);
      setNewItem({ equipmentName: '', assigneeName: '', scheduledAt: '' });
      refreshSnapshot();
    } catch {
      error('新建巡检失败');
    }
  }, [buildInspectionHeaders, error, newItem, refreshSnapshot, snapshot.storeId, success]);

  const handleRemind = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/logistics/inspections/${id}/remind`, {
        method: 'POST',
        headers: buildInspectionHeaders('application/json'),
        body: JSON.stringify({ now: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('remind failed');
      success('发送提醒成功');
      refreshSnapshot();
    } catch {
      error('发送提醒失败');
    }
  }, [buildInspectionHeaders, error, refreshSnapshot, success]);

  const handleRecordResult = useCallback(async (id: string, result: 'normal' | 'warning' | 'fault') => {
    try {
      const response = await fetch(`/api/logistics/inspections/${id}/result`, {
        method: 'POST',
        headers: buildInspectionHeaders('application/json'),
        body: JSON.stringify({
          result,
          note: '',
          inspectorId: 'inspector-01',
          inspectorName: '系统管理员',
        }),
      });
      if (!response.ok) throw new Error('record result failed');
      success('记录巡检结果成功');
      refreshSnapshot();
    } catch {
      error('记录巡检结果失败');
    }
  }, [buildInspectionHeaders, error, refreshSnapshot, success]);

  const filtered = useMemo(() => {
    let result = snapshot.items;
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      const map: Record<string, string> = { equipment: '设备', safety: '安全', hygiene: '卫生' };
      result = result.filter((item) => (item.equipmentName || '').includes(map[typeFilter] || typeFilter));
    }
    return result;
  }, [snapshot.items, statusFilter, typeFilter]);

  const passCount = snapshot.items.filter((item) => item.result === 'normal').length;
  const warnCount = snapshot.items.filter((item) => item.result === 'warning').length;
  const failCount = snapshot.items.filter((item) => item.result === 'fault').length;
  const avgScore = useMemo(() => {
    const scores = snapshot.items.map((item) => (item.result === 'normal' ? 90 : item.result === 'warning' ? 60 : 30));
    return scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
  }, [snapshot.items]);

  const columns: TableColumn<InspectionItem>[] = [
    { title: 'ID', key: 'id', render: (_, row) => <span className="font-mono text-xs text-slate-400">{row.id.slice(0, 8)}</span> },
    { title: '设备', key: 'equipmentName' },
    { title: '负责人', key: 'assigneeName' },
    { title: '排期', key: 'scheduledAt', render: (value) => <span className="text-slate-400 text-sm">{value ? new Date(value as string).toLocaleString() : '-'}</span> },
    { title: '状态', key: 'status', render: (_, row) => <Tag variant={STATUS_MAP[row.status || 'scheduled']?.color || 'default'}>{STATUS_MAP[row.status || 'scheduled']?.label || row.status}</Tag> },
    { title: '结果', key: 'result', render: (_, row) => row.result ? <Tag variant={RESULT_MAP[row.result]?.color || 'default'}>{RESULT_MAP[row.result]?.label || row.result}</Tag> : <span className="text-slate-500">-</span> },
    { title: '备注', key: 'note', render: (value) => <span className="text-slate-400 text-sm truncate max-w-xs">{(value as string) || '-'}</span> },
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <Space>
          {row.status !== 'completed' && (
            <Button size="sm" variant="outline" onClick={() => void handleRemind(row.id)}>提醒</Button>
          )}
          {row.status === 'reminded' && (
            <>
              <Button size="sm" variant="primary" onClick={() => void handleRecordResult(row.id, 'normal')}>正常</Button>
              <Button size="sm" variant="warning" onClick={() => void handleRecordResult(row.id, 'warning')}>警告</Button>
              <Button size="sm" variant="danger" onClick={() => void handleRecordResult(row.id, 'fault')}>故障</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageShell title="巡检管理">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <Space direction="vertical" className="w-full" style={{ gap: 16 }}>
        {snapshot.error ? (
          <Card>
            <span className="text-amber-400 text-sm">{snapshot.error}</span>
          </Card>
        ) : null}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-slate-100 text-xl font-semibold">📋 巡检管理</h2>
            <span className="text-slate-400 text-sm">
              设备 · 安全 · 卫生 · 全维度巡检 · Delivery {snapshot.deliveryMode}
            </span>
          </div>
          <Space>
            <Button variant="outline" onClick={refreshSnapshot} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </Button>
            <Button variant="primary" onClick={() => setShowAdd(true)}>+ 新建巡检</Button>
          </Space>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <Card><Statistic title="今日巡检" value={snapshot.items.length} /></Card>
          <Card><Statistic title="通过" value={passCount} valueStyle={{ color: '#34d399' }} /></Card>
          <Card><Statistic title="需关注" value={warnCount} valueStyle={{ color: '#f59e0b' }} /></Card>
          <Card><Statistic title="不通过" value={failCount} valueStyle={{ color: '#f87171' }} /></Card>
          <Card><Statistic title="综合评分" value={avgScore} suffix="分" valueStyle={{ color: avgScore >= 80 ? '#34d399' : '#f59e0b' }} /></Card>
        </div>

        <Card>
          <Tabs
            items={[
              { key: 'list', label: '巡检列表' },
              { key: 'stats', label: '统计' },
            ]}
            activeKey={tab}
            onChange={(key) => setTab(key)}
          />

          {tab === 'list' ? (
            <Space direction="vertical" className="w-full" style={{ marginTop: 12 }}>
              <Space wrap style={{ gap: 8 }}>
                <span className="text-slate-400 text-sm">类别:</span>
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: 130 }}
                  options={[
                    { value: 'all', label: '全部' },
                    { value: 'equipment', label: '🔧 设备' },
                    { value: 'safety', label: '🛡️ 安全' },
                    { value: 'hygiene', label: '🧹 卫生' },
                  ]}
                />
                <span className="text-slate-400 text-sm">状态:</span>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 120 }}
                  options={[
                    { value: 'all', label: '全部' },
                    { value: 'scheduled', label: '已排期' },
                    { value: 'reminded', label: '已提醒' },
                    { value: 'completed', label: '已完成' },
                  ]}
                />
                <Button variant="outline" size="sm" onClick={refreshSnapshot} loading={isRefreshing}>刷新</Button>
              </Space>
              <Table<InspectionItem>
                rows={filtered}
                columns={columns}
                rowKey={(row) => row.id}
                emptyContent={<Empty description="暂无巡检数据" />}
              />
            </Space>
          ) : (
            <Space direction="vertical" className="w-full" style={{ marginTop: 12 }}>
              <div className="grid grid-cols-3 gap-4">
                <Card title="巡检类型分布">
                  <Space direction="vertical">
                    {Object.entries(INSPECTION_TYPE_MAP).map(([key, value]) => (
                      <Space key={key}>
                        <Tag variant={value.color}>{value.label}</Tag>
                        <span>{snapshot.items.filter((item) => (item.equipmentName || '').includes(value.label)).length} 项</span>
                      </Space>
                    ))}
                  </Space>
                </Card>
                <Card title="结果分布">
                  <Space direction="vertical">
                    <Space><Tag variant="success">正常</Tag><span>{passCount} 项</span></Space>
                    <Space><Tag variant="warning">警告</Tag><span>{warnCount} 项</span></Space>
                    <Space><Tag variant="error">故障</Tag><span>{failCount} 项</span></Space>
                  </Space>
                </Card>
                <Card title="状态分布">
                  <Space direction="vertical">
                    <Space><Tag>已排期</Tag><span>{snapshot.items.filter((item) => item.status === 'scheduled').length} 项</span></Space>
                    <Space><Tag variant="warning">已提醒</Tag><span>{snapshot.items.filter((item) => item.status === 'reminded').length} 项</span></Space>
                    <Space><Tag variant="success">已完成</Tag><span>{snapshot.items.filter((item) => item.status === 'completed').length} 项</span></Space>
                  </Space>
                </Card>
              </div>
            </Space>
          )}
        </Card>

        <Modal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          title="新建巡检"
          footer={
            <Space>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
              <Button variant="primary" onClick={() => void handleCreate()}>确定</Button>
            </Space>
          }
        >
          <Space direction="vertical" className="w-full" style={{ gap: 12 }}>
            <Input placeholder="设备名称" value={newItem.equipmentName} onChange={(value) => setNewItem((state) => ({ ...state, equipmentName: value }))} />
            <Input placeholder="负责人" value={newItem.assigneeName} onChange={(value) => setNewItem((state) => ({ ...state, assigneeName: value }))} />
            <Input type="datetime-local" placeholder="排期时间" value={newItem.scheduledAt} onChange={(value) => setNewItem((state) => ({ ...state, scheduledAt: value }))} />
          </Space>
        </Modal>
      </Space>
    </PageShell>
  );
}
