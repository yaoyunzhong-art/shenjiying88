/**
 * 库存详情页 — Stock Detail Page (Next.js App Router / Dynamic Route)
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 类型: B-页面创建 / 详情页
 * 功能: 展示库存单品详情、编辑入口、状态流转（补货/调整阈值/归档/删除）
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';
import {
  PageShell,
  DetailShell,
  DescriptionList,
  StatusBadge,
  Button,
  Modal,
  FormField,
  InputNumber,
  Select,
  TextArea,
  ToastContainer,
  useToast,
} from '@m5/ui';

import { StockStatusBadge, STOCK_STATUS_LABEL } from '../components/StockStatusBadge';
import type { StockStatus, StockItem } from '../components/StockStatusBadge';

/* ── 常量 ── */
const UNIT_MAP: Record<string, string> = {
  '瓶': '瓶 · 瓶装饮品/液体产品',
  '支': '支 · 管状/棒状产品',
  '盒': '盒 · 盒装产品',
  '套': '套 · 组合套装',
  '个': '个 · 单件产品',
};

const STATUS_TRANSITIONS: Record<StockStatus, StockStatus[]> = {
  sufficient: ['low', 'overstocked'],
  low: ['sufficient', 'critical', 'out_of_stock'],
  critical: ['low', 'out_of_stock', 'sufficient'],
  out_of_stock: ['low', 'critical', 'sufficient'],
  overstocked: ['sufficient', 'low'],
};

/* ── Helper ── */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function formatQuantity(qty: number, unit: string): string {
  return `${qty.toLocaleString('zh-CN')} ${unit}`;
}

/* ── Mock 库存数据 ── */
const MOCK_ITEMS: Record<string, StockItem> = {
  '1': { id: '1', sku: 'SKU-1001', name: '玫瑰精华爽肤水', category: '护肤品', quantity: 280, minThreshold: 50, maxThreshold: 500, unit: '瓶', price: 168, updatedAt: '2026-06-25 10:32', status: 'sufficient' },
  '2': { id: '2', sku: 'SKU-1002', name: '玻尿酸保湿面霜', category: '护肤品', quantity: 15, minThreshold: 30, maxThreshold: 300, unit: '瓶', price: 238, updatedAt: '2026-06-25 09:15', status: 'critical' },
  '3': { id: '3', sku: 'SKU-2001', name: '丝绒哑光口红·正红色', category: '彩妆', quantity: 0, minThreshold: 20, maxThreshold: 200, unit: '支', price: 89, updatedAt: '2026-06-24 18:00', status: 'out_of_stock' },
};

/* ── 页面组件 ── */
export default function StockDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const itemId = typeof params.id === 'string' ? params.id : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const item = useMemo(() => MOCK_ITEMS[itemId] ?? null, [itemId]);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // 编辑表单状态
  const [editQty, setEditQty] = useState(item?.quantity ?? 0);
  const [editMin, setEditMin] = useState(item?.minThreshold ?? 0);
  const [editMax, setEditMax] = useState(item?.maxThreshold ?? 0);
  const [editPrice, setEditPrice] = useState(item?.price ?? 0);
  const [editNote, setEditNote] = useState('');
  const [editStatus, setEditStatus] = useState<StockStatus>(item?.status ?? 'sufficient');

  const resetEdit = useCallback(() => {
    if (!item) return;
    setEditQty(item.quantity);
    setEditMin(item.minThreshold);
    setEditMax(item.maxThreshold);
    setEditPrice(item.price);
    setEditNote('');
    setEditStatus(item.status);
  }, [item]);

  const handleSave = useCallback(() => {
    if (editMin >= editMax) {
      toast.error('最低库存不能大于等于最高库存');
      return;
    }
    if (editPrice <= 0) {
      toast.error('单价必须大于 0');
      return;
    }
    toast.success('库存信息已更新');
    setShowEdit(false);
  }, [editMin, editMax, editPrice, toast]);

  const handleDelete = useCallback(() => {
    toast.success(`已删除商品「${item?.name ?? ''}」`);
    setShowDelete(false);
    setTimeout(() => router.push('/stock'), 1500);
  }, [item, router, toast]);

  const handleStatusChange = useCallback((newStatus: StockStatus) => {
    toast.success(`状态已变更为「${STOCK_STATUS_LABEL[newStatus]}」`);
  }, [toast]);

  const availableTransitions = useMemo(() => {
    if (!item) return [];
    return STATUS_TRANSITIONS[item.status] ?? [];
  }, [item]);

  // 未找到商品
  if (!item) {
    return (
      <PageShell title="库存详情">
        <DetailShell
          title="库存详情"
          breadcrumbs={[{ label: '库存管理', href: '/stock' }, { label: '详情' }]}
        >
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <p>未找到该库存商品 (ID: {itemId})</p>
            <Button onClick={() => router.push('/stock')}>返回库存列表</Button>
          </div>
        </DetailShell>
      </PageShell>
    );
  }

  return (
    <PageShell title={item.name}>
      <DetailShell
        title={item.name}
        subtitle={`SKU: ${item.sku}`}
        breadcrumbs={[
          { label: '库存管理', href: '/stock' },
          { label: item.name },
        ]}
      >
        {/* ── 操作栏 ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          <Button variant="primary" onClick={() => { resetEdit(); setShowEdit(true); }}>
            编辑
          </Button>
          {availableTransitions.map(st => (
            <Button
              key={st}
              variant="ghost"
              onClick={() => handleStatusChange(st)}
            >
              标记为「{STOCK_STATUS_LABEL[st]}」
            </Button>
          ))}
          <Button variant="danger" onClick={() => setShowDelete(true)}>
            删除
          </Button>
        </div>

        {/* ── 基本信息 ── */}
        <DescriptionList
          title="基本信息"
          items={[
            { label: '商品名称', value: item.name },
            { label: 'SKU 编码', value: item.sku },
            { label: '所属分类', value: item.category },
            { label: '库存状态', value: <StockStatusBadge status={item.status} /> },
            { label: '计量单位', value: UNIT_MAP[item.unit] || item.unit },
            { label: '销售单价', value: formatCurrency(item.price) },
            { label: '最后更新', value: item.updatedAt },
          ]}
        />

        {/* ── 库存详情 ── */}
        <DescriptionList
          title="库存详情"
          items={[
            { label: '当前库存', value: formatQuantity(item.quantity, item.unit) },
            { label: '最低阈值', value: formatQuantity(item.minThreshold, item.unit) },
            { label: '最高阈值', value: formatQuantity(item.maxThreshold, item.unit) },
            {
              label: '库存健康度',
              value: (
                <StatusBadge
                  variant={
                    item.quantity <= 0 ? 'danger' as const :
                    item.quantity <= item.minThreshold ? 'warning' as const :
                    item.quantity >= item.maxThreshold ? 'info' as const :
                    'success' as const
                  }
                  label={
                    item.quantity <= 0 ? '已耗尽' :
                    item.quantity <= item.minThreshold ? '低于阈值' :
                    item.quantity >= item.maxThreshold ? '超过阈值' :
                    '正常'
                  }
                />
              ),
            },
            { label: '预估库存价值', value: formatCurrency(item.quantity * item.price) },
          ]}
        />

        {/* ── 编辑弹窗 ── */}
        <Modal open={showEdit} title={`编辑 - ${item.name}`} onClose={() => setShowEdit(false)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 4px' }}>
              <FormField label="当前库存数量">
                <InputNumber value={editQty} onChange={setEditQty} min={0} />
              </FormField>
              <FormField label="最低阈值">
                <InputNumber value={editMin} onChange={setEditMin} min={0} />
              </FormField>
              <FormField label="最高阈值">
                <InputNumber value={editMax} onChange={setEditMax} min={0} />
              </FormField>
              <FormField label="销售单价">
                <InputNumber value={editPrice} onChange={setEditPrice} min={0.01} />
              </FormField>
              <FormField label="库存状态">
                <Select
                  value={editStatus}
                  onChange={v => setEditStatus(v as StockStatus)}
                  options={Object.entries(STOCK_STATUS_LABEL).map(([k, v]) => ({ value: k, label: v }))}
                />
              </FormField>
              <FormField label="备注">
                <TextArea value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="输入变更备注（可选）" rows={3} />
              </FormField>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Button variant="ghost" onClick={() => setShowEdit(false)}>取消</Button>
                <Button variant="primary" onClick={handleSave}>保存</Button>
              </div>
            </div>
          </Modal>

        {/* ── 删除确认弹窗 ── */}
        <Modal open={showDelete} title="确认删除" onClose={() => setShowDelete(false)}>
            <p>确定要删除商品「{item.name}」(SKU: {item.sku}) 吗？</p>
            <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>此操作不可撤销</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button variant="ghost" onClick={() => setShowDelete(false)}>取消</Button>
              <Button variant="danger" onClick={handleDelete}>确认删除</Button>
            </div>
          </Modal>

        {/* ── 底部栏 ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, paddingTop: 16, borderTop: '1px solid #eee' }}>
          <Button variant="ghost" onClick={() => router.push('/stock')}>返回库存列表</Button>
        </div>
      </DetailShell>

      {/* Toast通知 — useToast 管理 ToastContainer */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </PageShell>
  );
}
