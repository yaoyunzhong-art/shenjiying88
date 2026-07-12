// 👥 员工管理 · 员工信息/培训/考核
'use client';
import { useState } from 'react';
import { PageShell, Button, Card, Tag, Table, Space } from '@m5/ui';

const STAFF = [
  { id: 'S001', name: '张三', role: '店长', phone: '138****8888', status: 'active', joinDate: '2025-03-01' },
  { id: 'S002', name: '李四', role: '前台', phone: '139****6666', status: 'active', joinDate: '2025-06-15' },
  { id: 'S003', name: '王五', role: '导玩员', phone: '137****5555', status: 'active', joinDate: '2025-08-20' },
  { id: 'S004', name: '赵六', role: '导玩员', phone: '136****4444', status: 'leave', joinDate: '2025-04-10' },
  { id: 'S005', name: '刘七', role: '收银', phone: '135****3333', status: 'active', joinDate: '2026-01-05' },
];

const COLUMNS = [
  { title: '编号', dataIndex: 'id' },
  { title: '姓名', dataIndex: 'name' },
  { title: '角色', dataIndex: 'role' },
  { title: '电话', dataIndex: 'phone' },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '在职' : '离职'}</Tag> },
  { title: '入职日期', dataIndex: 'joinDate' },
];

export default function StaffPage() {
  const [data] = useState(STAFF);
  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        <h2 style={{ color: '#f8fafc', margin: 0 }}>👥 员工管理</h2>
        <Card>
          <Table dataSource={data} columns={COLUMNS} rowKey="id" pagination={false} />
        </Card>
        <Card>
          <Space>
            <Button type="primary">添加员工</Button>
            <Button>排班管理</Button>
            <Button>导出花名册</Button>
          </Space>
        </Card>
      </Space>
    </PageShell>
  );
}