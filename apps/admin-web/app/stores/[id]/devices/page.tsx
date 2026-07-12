// 🖥️ 设备管理 · 游戏机/设备状态监控维护
'use client';
import { useState } from 'react';
import { PageShell, Button, Card, Tag, Table, Space, Badge } from '@m5/ui';

const DEVICES = [
  { id: 'D001', name: '街机A区1-8号', type: '街机', status: 'online', usage: '78%', lastMaintenance: '2026-07-10' },
  { id: 'D002', name: '街机B区9-16号', type: '街机', status: 'online', usage: '65%', lastMaintenance: '2026-07-09' },
  { id: 'D003', name: 'VR体验室1', type: 'VR', status: 'online', usage: '92%', lastMaintenance: '2026-07-08' },
  { id: 'D004', name: 'VR体验室2', type: 'VR', status: 'offline', usage: '0%', lastMaintenance: '2026-07-12' },
  { id: 'D005', name: '射击模拟器', type: '模拟机', status: 'online', usage: '45%', lastMaintenance: '2026-07-07' },
  { id: 'D006', name: '赛车模拟器', type: '模拟机', status: 'maintenance', usage: '12%', lastMaintenance: '2026-07-11' },
  { id: 'D007', name: '台球桌1号', type: '台球', status: 'online', usage: '55%', lastMaintenance: '2026-07-06' },
  { id: 'D008', name: '卡丁车A道', type: '卡丁车', status: 'online', usage: '88%', lastMaintenance: '2026-07-10' },
];

const COLUMNS = [
  { title: '编号', dataIndex: 'id' },
  { title: '名称', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type' },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'online' ? 'green' : v === 'offline' ? 'red' : 'orange'}>{v === 'online' ? '在线' : v === 'offline' ? '离线' : '维护中'}</Tag> },
  { title: '使用率', dataIndex: 'usage' },
  { title: '最后维护', dataIndex: 'lastMaintenance' },
];

export default function DevicesPage() {
  const [devices] = useState(DEVICES);
  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <h2 style={{ color: '#f8fafc', margin: 0 }}>🖥️ 设备管理</h2>
        <Card>
          <Table dataSource={devices} columns={COLUMNS} rowKey="id" pagination={false} />
        </Card>
        <Card>
          <Space>
            <Button type="primary">新增设备</Button>
            <Button>维护记录</Button>
            <Button>导出报表</Button>
          </Space>
        </Card>
      </Space>
    </PageShell>
  );
}