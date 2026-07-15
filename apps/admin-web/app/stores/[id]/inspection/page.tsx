'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  PageShell,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  ToastContainer,
  Tooltip,
  useToast,
} from '@m5/ui';
import type { TableColumn } from '@m5/ui';

interface InspectionItem {
  id: string;
  tenantId: string;
  storeId?: string;
  equipmentId?: string;
  equipmentName?: string;
  assigneeId?: string;
  assigneeName?: string;
  scheduledAt: string;
  remindedAt?: string;
  result?: 'normal' | 'warning' | 'fault';
  note?: string;
  inspectorId?: string;
  inspectorName?: string;
  status?: 'scheduled' | 'reminded' | 'completed';
  createdAt: string;
  updatedAt: string;
}

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

export default function InspectionPage() {
  const { toasts, success, error, dismiss } = useToast();
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tab, setTab] = useState('list');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ equipmentName: '', assigneeName: '', scheduledAt: '' });

  const tenantId = 'tenant-p30';

  const fetchItems = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      const res = await fetch(`/api/logistics/inspections?${qs.toString()}`, {
        headers: { 'x-tenant-id': tenantId },
      });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      error('加载巡检列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/logistics/inspections', {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentName: newItem.equipmentName,
          assigneeName: newItem.assigneeName,
          scheduledAt: newItem.scheduledAt || new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('create failed');
      success('新建巡检成功');
      setShowAdd(false);
      setNewItem({ equipmentName: '', assigneeName: '', scheduledAt: '' });
      await fetchItems();
    } catch (e) {
      error('新建巡检失败');
    }
  };

  const handleRemind = async (id: string) => {
    try {
      const res = await fetch(`/api/logistics/inspections/${id}/remind`, {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ now: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('remind failed');
      success('发送提醒成功');
      await fetchItems();
    } catch (e) {
      error('发送提醒失败');
    }
  };

  const handleRecordResult = async (id: string, result: 'normal' | 'warning' | 'fault') => {
    try {
      const res = await fetch(`/api/logistics/inspections/${id}/result`, {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result,
          note: '',
          inspectorId: 'inspector-01',
          inspectorName: '系统管理员',
        }),
      });
      if (!res.ok) throw new Error('record result failed');
      success('记录巡检结果成功');
      await fetchItems();
    } catch (e) {
      error('记录巡检结果失败');
    }
  };

  const filtered = useMemo(() => {
    let r = items;
    if (typeFilter !== 'all') {
      const map: Record<string, string> = { equipment: '设备', safety: '安全', hygiene: '卫生' };
      r = r.filter(d => (d.equipmentName || '').includes(map[typeFilter] || typeFilter));
    }
    return r;
  }, [items, typeFilter]);

  const passCount = items.filter(d => d.result === 'normal').length;
  const warnCount = items.filter(d => d.result === 'warning').length;
  const failCount = items.filter(d => d.result === 'fault').length;
  const avgScore = useMemo(() => {
    const scores = items.map(d => (d.result === 'normal' ? 90 : d.result === 'warning' ? 60 : 30));
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [items]);

  const columns: TableColumn<InspectionItem>[] = [
    { title: 'ID', key: 'id', render: (_, r) => <span className="font-mono text-xs text-slate-400">{r.id.slice(0, 8)}</span> },
    { title: '设备', key: 'equipmentName' },
    { title: '负责人', key: 'assigneeName' },
    { title: '排期', key: 'scheduledAt', render: (v) => <span className="text-slate-400 text-sm">{v ? new Date(v as string).toLocaleString() : '-'}</span> },
    { title: '状态', key: 'status', render: (_, r) => <Tag variant={STATUS_MAP[r.status || 'scheduled']?.color || 'default'}>{STATUS_MAP[r.status || 'scheduled']?.label || r.status}</Tag> },
    { title: '结果', key: 'result', render: (_, r) => r.result ? <Tag variant={RESULT_MAP[r.result]?.color || 'default'}>{RESULT_MAP[r.result]?.label || r.result}</Tag> : <span className="text-slate-500">-</span> },
    { title: '备注', key: 'note', render: (v) => <span className="text-slate-400 text-sm truncate max-w-xs">{v as string || '-'}</span> },
    { title: '操作', key: 'actions', render: (_, r) => (
      <Space>
        {r.status !== 'completed' && (
          <Button size="sm" variant="outline" onClick={() => handleRemind(r.id)}>提醒</Button>
        )}
        {r.status === 'reminded' && (
          <>
            <Button size="sm" variant="primary" onClick={() => handleRecordResult(r.id, 'normal')}>正常</Button>
            <Button size="sm" variant="warning" onClick={() => handleRecordResult(r.id, 'warning')}>警告</Button>
            <Button size="sm" variant="danger" onClick={() => handleRecordResult(r.id, 'fault')}>故障</Button>
          </>
        )}
      </Space>
    )},
  ];

  return (
    <PageShell title="巡检管理">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <Space direction="vertical" className="w-full" style={{ gap: 16 }}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-slate-100 text-xl font-semibold">📋 巡检管理</h2>
            <span className="text-slate-400 text-sm">设备 · 安全 · 卫生 · 全维度巡检</span>
          </div>
          <Button variant="primary" onClick={() => setShowAdd(true)}>+ 新建巡检</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card><Statistic title="今日巡检" value={items.length} /></Card></Col>
          <Col span={5}><Card><Statistic title="通过" value={passCount} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={5}><Card><Statistic title="需关注" value={warnCount} valueStyle={{ color: '#f59e0b' }} /></Card></Col>
          <Col span={5}><Card><Statistic title="不通过" value={failCount} valueStyle={{ color: '#f87171' }} /></Card></Col>
          <Col span={5}><Card><Statistic title="综合评分" value={avgScore} suffix="分" valueStyle={{ color: avgScore >= 80 ? '#34d399' : '#f59e0b' }} /></Card></Col>
        </Row>

        <Card>
          <Tabs items={[
            { key: 'list', label: '巡检列表' },
            { key: 'stats', label: '统计' },
          ]} activeKey={tab} onChange={(k) => setTab(k)} />

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
                <Button variant="outline" size="sm" onClick={fetchItems} loading={loading}>刷新</Button>
              </Space>
              <Table<InspectionItem>
                rows={filtered}
                columns={columns}
                rowKey={(r) => r.id}
                emptyContent={<Empty description="暂无巡检数据" />}
              />
            </Space>
          ) : (
            <Space direction="vertical" className="w-full" style={{ marginTop: 12 }}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card title="巡检类型分布">
                    <Space direction="vertical">
                      {Object.entries(INSPECTION_TYPE_MAP).map(([k, v]) => (
                        <Space key={k}>
                          <Tag variant={v.color}>{v.label}</Tag>
                          <span>{items.filter(i => (i.equipmentName || '').includes(v.label)).length} 项</span>
                        </Space>
                      ))}
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="结果分布">
                    <Space direction="vertical">
                      <Space><Tag variant="success">正常</Tag><span>{passCount} 项</span></Space>
                      <Space><Tag variant="warning">警告</Tag><span>{warnCount} 项</span></Space>
                      <Space><Tag variant="error">故障</Tag><span>{failCount} 项</span></Space>
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="状态分布">
                    <Space direction="vertical">
                      <Space><Tag>已排期</Tag><span>{items.filter(i => i.status === 'scheduled').length} 项</span></Space>
                      <Space><Tag variant="warning">已提醒</Tag><span>{items.filter(i => i.status === 'reminded').length} 项</span></Space>
                      <Space><Tag variant="success">已完成</Tag><span>{items.filter(i => i.status === 'completed').length} 项</span></Space>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Space>
          )}
        </Card>
      </Space>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="新建巡检"
        footer={
          <Space>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
            <Button variant="primary" onClick={handleCreate}>确定</Button>
          </Space>
        }
      >
        <Space direction="vertical" className="w-full" style={{ gap: 12 }}>
          <Input placeholder="设备名称" value={newItem.equipmentName} onChange={(v) => setNewItem(s => ({ ...s, equipmentName: v }))} />
          <Input placeholder="负责人" value={newItem.assigneeName} onChange={(v) => setNewItem(s => ({ ...s, assigneeName: v }))} />
          <Input type="datetime-local" placeholder="排期时间" value={newItem.scheduledAt} onChange={(v) => setNewItem(s => ({ ...s, scheduledAt: v }))} />
        </Space>
      </Modal>
    </PageShell>
  );
}
