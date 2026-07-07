'use client';

import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { Modal } from './Modal';
import { InfoRow } from './InfoRow';
import { StatCard } from './StatCard';
import { Tooltip } from './Tooltip';

// ---- Type Definitions ----

export type HandoverCategory =
  | 'cash'
  | 'order'
  | 'member'
  | 'inventory'
  | 'device'
  | 'other';

export interface ShiftHandoverEntry {
  id: string;
  category: HandoverCategory;
  title: string;
  description: string;
  status: 'pending' | 'resolved' | 'escalated';
  createdBy: string;
  createdAt: string;
  handoverTo?: string;
  resolvedAt?: string;
  notes?: string;
}

export interface ShiftSummary {
  totalItems: number;
  pendingCount: number;
  resolvedCount: number;
  escalatedCount: number;
  cashTotal: number;
  orderTotal: number;
  shiftStart: string;
  shiftEnd: string;
  currentStaff: string;
  incomingStaff: string;
}

export interface ShiftHandoverPanelProps {
  summary: ShiftSummary;
  items: ShiftHandoverEntry[];
  onResolveItem: (id: string) => void;
  onEscalateItem: (id: string) => void;
  onStartHandover: () => void;
  onEditNotes: (id: string, notes: string) => void;
  loading?: boolean;
}

const categoryLabel: Record<HandoverCategory, string> = {
  cash: '现金',
  order: '订单',
  member: '会员',
  inventory: '库存',
  device: '设备',
  other: '其他',
};

const categoryColor: Record<HandoverCategory, 'warning' | 'info' | 'purple' | 'neutral' | 'default'> = {
  cash: 'warning',
  order: 'info',
  member: 'purple',
  inventory: 'neutral',
  device: 'warning',
  other: 'default',
};

const statusLabel: Record<string, string> = {
  pending: '待处理',
  resolved: '已完成',
  escalated: '已升级',
};

const statusVariant: Record<string, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  resolved: 'success',
  escalated: 'error',
};

export const ShiftHandoverPanel: React.FC<ShiftHandoverPanelProps> = ({
  summary,
  items,
  onResolveItem,
  onEscalateItem,
  onStartHandover,
  onEditNotes,
  loading = false,
}) => {
  const [selectedItem, setSelectedItem] = useState<ShiftHandoverEntry | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const pendingItems = useMemo(() => items.filter((i) => i.status === 'pending'), [items]);

  const columns: DataTableColumn<ShiftHandoverEntry>[] = useMemo(
    () => [
      {
        key: 'category',
        header: '类别',
        width: "80px",
        render: (row: ShiftHandoverEntry) => (
          <Badge variant={categoryColor[row.category]}>{categoryLabel[row.category]}</Badge>
        ),
      },
      {
        key: 'title',
        header: '事项',
        width: "200px",
        render: (row: ShiftHandoverEntry) => <span style={{ fontWeight: 500 }}>{row.title}</span>,
      },
      {
        key: 'status',
        header: '状态',
        width: "100px",
        render: (row: ShiftHandoverEntry) => (
          <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>
        ),
      },
      {
        key: 'createdBy',
        header: '创建人',
        width: "100px",
      },
      {
        key: 'createdAt',
        header: '创建时间',
        width: "140px",
      },
      {
        key: 'handoverTo',
        header: '交接人',
        width: "100px",
        render: (row: ShiftHandoverEntry) => (row.handoverTo ? row.handoverTo : <span style={{ color: "#999" }}>-</span>),
      },
      {
        key: 'actions',
        header: '操作',
        width: "200px",
        render: (row: ShiftHandoverEntry) => (
          <div style={{ display: 'flex', gap: 8 }}>
            {row.status === 'pending' && (
              <>
                <Button size="sm" variant="primary" onClick={() => onResolveItem(row.id)}>
                  完成
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEscalateItem(row.id)}>
                  升级
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedItem(row);
                setNotesDraft(row.notes || '');
              }}
            >
              备注
            </Button>
          </div>
        ),
      },
    ],
    [onResolveItem, onEscalateItem],
  );

  if (loading) {
    return (
      <Card title="交接班面板" style={{ padding: 24, textAlign: 'center', color: '#999' }}>
        加载中...
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="交班摘要" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <StatCard label="当前班次" value={`${summary.shiftStart} - ${summary.shiftEnd}`} />
          <StatCard label="在班人员" value={summary.currentStaff} />
          <StatCard label="接班人员" value={summary.incomingStaff} />
          <StatCard
            label="待处理事项"
            value={summary.pendingCount}
            trend={{ value: `${summary.pendingCount}`, positive: summary.pendingCount === 0 }}
          />
          <StatCard label="现金总额" value={`¥${summary.cashTotal.toLocaleString()}`} />
          <StatCard label="订单总数" value={summary.orderTotal} />
        </div>
      </Card>

      {pendingItems.length > 0 && (
        <Card
          title={`待处理事项 (${pendingItems.length})`}
          style={{ padding: 12, borderLeft: `4px solid ${pendingItems.length > 3 ? '#ef4444' : '#f59e0b'}` }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge variant={categoryColor[item.category]}>
                    {categoryLabel[item.category]}
                  </Badge>
                  <Tooltip content={item.description}>
                    <span>{item.title}</span>
                  </Tooltip>
                </div>
                <Button size="sm" variant="primary" onClick={() => onResolveItem(item.id)}>
                  完成
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="交接事项清单">
        <DataTable columns={columns} data={items} rowKey={(row: ShiftHandoverEntry) => row.id} />
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="primary"
          size="lg"
          onClick={onStartHandover}
          disabled={pendingItems.length > 0}
        >
          {pendingItems.length > 0
            ? `尚有 ${pendingItems.length} 项待处理，无法交接`
            : '开始交接班'}
        </Button>
      </div>

      {selectedItem && (
        <Modal
          open
          onClose={() => setSelectedItem(null)}
          title={`备注 - ${selectedItem.title}`}
          footer={
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                取消
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onEditNotes(selectedItem.id, notesDraft);
                  setSelectedItem(null);
                }}
              >
                保存
              </Button>
            </div>
          }
        >
          <InfoRow label="类别" value={categoryLabel[selectedItem.category]} />
          <InfoRow label="创建人" value={selectedItem.createdBy} />
          <InfoRow label="描述" value={selectedItem.description} />
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              交接备注
            </label>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 6,
                border: '1px solid #d9d9d9',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ShiftHandoverPanel;
