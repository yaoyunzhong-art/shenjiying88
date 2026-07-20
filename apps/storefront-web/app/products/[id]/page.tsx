'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  PageShell,
  DetailShell,
  StatusBadge,
  Modal,
  SubmitButton,
  FormField,
  FormSubmitFeedback,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';
import { useTriState } from '../../_components/useTriState';
import { TriStateRenderer } from '../../_components/TriStateRenderer';

// ── 类型 ──

type OfferingCategory = 'class' | 'event' | 'product' | 'service';
type OfferingStatus = 'published' | 'draft' | 'archived';

interface StoreOffering {
  id: string;
  name: string;
  category: OfferingCategory;
  storeName: string;
  description: string;
  price?: string;
  scheduleHint?: string;
  status: OfferingStatus;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<OfferingCategory, string> = {
  class: '课程',
  event: '活动',
  product: '商品',
  service: '服务',
};

const STATUS_VARIANTS: Record<OfferingStatus, 'success' | 'warning' | 'neutral'> = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
};

const STATUS_LABELS: Record<OfferingStatus, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

const NEXT_STATUS: Partial<Record<OfferingStatus, OfferingStatus>> = {
  draft: 'published',
  published: 'archived',
  archived: 'draft',
};

const STATUS_ACTION_LABELS: Partial<Record<OfferingStatus, string>> = {
  draft: '发布',
  published: '归档',
  archived: '取消归档',
};

// ── Mock 详情 ──

function getOfferingById(id: string): StoreOffering | undefined {
  const mock: StoreOffering[] = [
    { id: 'o1', name: '瑜伽初级课', category: 'class', storeName: 'Demo Store 旗舰店', description: '适合入门学习者，每周二四开课。课程包含呼吸练习、基础体式和冥想。', price: '¥199/节', scheduleHint: '周二 18:30 / 周四 19:00', status: 'published', createdAt: '2026-06-10', updatedAt: '2026-06-15' },
    { id: 'o2', name: 'HIIT 高强度间歇训练', category: 'class', storeName: 'Demo Store 旗舰店', description: '快速燃脂，适合有一定基础的学员。', price: '¥149/节', scheduleHint: '周三 07:00', status: 'published', createdAt: '2026-06-08', updatedAt: '2026-06-12' },
    { id: 'o3', name: '夏日游泳挑战赛', category: 'event', storeName: 'Demo Store 社区店', description: '门店内部游泳比赛。', price: '¥50 报名费', scheduleHint: '2026-07-15 09:00', status: 'published', createdAt: '2026-06-12', updatedAt: '2026-06-12' },
    { id: 'o4', name: '蛋白粉（乳清）', category: 'product', storeName: 'Demo Store 旗舰店', description: '进口乳清蛋白粉。', price: '¥299', status: 'published', createdAt: '2026-06-01', updatedAt: '2026-06-01' },
    { id: 'o5', name: '运动毛巾套装', category: 'product', storeName: 'Demo Store 社区店', description: '速干材质。', price: '¥89', status: 'draft', createdAt: '2026-06-11', updatedAt: '2026-06-14' },
    { id: 'o8', name: '青少年篮球训练营', category: 'class', storeName: 'Demo Store 社区店', description: '暑期集中训练，8-16岁。', price: '¥2,999/期', scheduleHint: '7月每周一三五 14:00', status: 'draft', createdAt: '2026-06-13', updatedAt: '2026-06-13' },
    { id: 'o12', name: '康复理疗服务', category: 'service', storeName: 'Demo Store 社区店', description: '运动损伤的康复理疗。', price: '¥399/次', scheduleHint: '需预约评估', status: 'archived', createdAt: '2026-04-01', updatedAt: '2026-05-01' },
  ];
  return mock.find((o) => o.id === id);
}

// ── 编辑表单 ──

type EditFormData = {
  name: string;
  description: string;
  price: string;
  scheduleHint: string;
};

const INITIAL_FORM: EditFormData = { name: '', description: '', price: '', scheduleHint: '' };

function EditModal({
  offering,
  open,
  onClose,
  onSaved,
}: {
  offering: StoreOffering;
  open: boolean;
  onClose: () => void;
  onSaved: (data: EditFormData) => void;
}) {
  const [form, setForm] = useState<EditFormData>({
    name: offering.name,
    description: offering.description,
    price: offering.price ?? '',
    scheduleHint: offering.scheduleHint ?? '',
  });

  const { submitting, error, success, submit, clearError } = useFormSubmit({
    onSubmit: async () => {
      if (!form.name.trim()) throw new Error('名称不能为空');
      if (!form.description.trim()) throw new Error('描述不能为空');
      onSaved(form);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑产品">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="名称" error={!form.name.trim() ? undefined : undefined}>
          <input
            data-testid="edit-name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="产品名称"
            style={inputStyle}
          />
        </FormField>
        <FormField label="描述">
          <textarea
            data-testid="edit-description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="产品描述"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </FormField>
        <FormField label="价格">
          <input
            data-testid="edit-price"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            placeholder="例如 ¥199"
            style={inputStyle}
          />
        </FormField>
        <FormField label="时间">
          <input
            data-testid="edit-schedule"
            value={form.scheduleHint}
            onChange={(e) => setForm((prev) => ({ ...prev, scheduleHint: e.target.value }))}
            placeholder="例如 周二 18:30"
            style={inputStyle}
          />
        </FormField>
        <FormSubmitFeedback submitting={submitting} error={error} success={success} onDismissError={clearError} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>
            取消
          </button>
          <SubmitButton loading={submitting} type="submit">
            保存
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ── 删除确认 ──

function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  itemName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}) {
  const { submitting, submit } = useFormSubmit({
    onSubmit: async () => {
      onConfirm();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <Modal open={open} onClose={onClose} title="确认删除">
      <div style={{ color: '#cbd5e1', marginBottom: 16 }}>
        确定要删除产品 <strong style={{ color: '#f87171' }}>{itemName}</strong> 吗？此操作不可撤销。
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>
            取消
          </button>
          <SubmitButton loading={submitting} type="submit" variant="danger">
            删除
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ── 常量 ──

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(15,23,42,0.6)',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'transparent',
  color: '#cbd5e1',
  cursor: 'pointer',
  fontSize: 13,
};

// ── 详情页 ──

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [offering, setOffering] = useState<StoreOffering | undefined>(undefined);
  const [pageReady, setPageReady] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // 模拟加载数据
  useEffect(() => {
    wrapLoad(
      new Promise<StoreOffering | undefined>((resolve) => {
        setTimeout(() => resolve(getOfferingById(params.id)), 300);
      }),
    ).then((data) => {
      setOffering(data);
      setPageReady(true);
    });
  }, [params.id]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // 状态流转
  const transitionStatus = useCallback(() => {
    if (!offering) return;
    const next = NEXT_STATUS[offering.status];
    if (!next) return;
    setOffering((prev) => prev ? { ...prev, status: next, updatedAt: today() } : prev);
  }, [offering]);

  // 保存编辑
  const handleSaved = useCallback(
    (data: EditFormData) => {
      setOffering((prev) =>
        prev
          ? { ...prev, name: data.name, description: data.description, price: data.price, scheduleHint: data.scheduleHint, updatedAt: today() }
          : prev,
      );
      setEditOpen(false);
    },
    [],
  );

  // 删除
  const handleDelete = useCallback(() => {
    setDeleted(true);
    setDeleteOpen(false);
  }, []);

  const detailActions: DetailShellAction[] = useMemo(
    () => [
      {
        key: 'edit',
        label: '编辑',
        onClick: () => setEditOpen(true),
        variant: 'primary',
      },
      {
        key: 'transition',
        label: offering ? STATUS_ACTION_LABELS[offering.status] ?? '状态流转' : '状态流转',
        onClick: transitionStatus,
        variant: 'secondary',
      },
      {
        key: 'delete',
        label: '删除',
        onClick: () => setDeleteOpen(true),
        variant: 'danger',
      },
    ],
    [offering, transitionStatus],
  );

  if (!offering && pageReady) {
    return (
      <PageShell title="产品详情" description="">
        <TriStateRenderer
          loading={false}
          empty={true}
          error={error}
          onRetry={() =>
            wrapLoad(
              new Promise<StoreOffering | undefined>((resolve) => {
                setTimeout(() => resolve(getOfferingById(params.id)), 300);
              }),
            ).then((data) => {
              setOffering(data);
              setPageReady(true);
            })
          }
        ><></></TriStateRenderer>
      </PageShell>
    );
  }

  if (!offering) {
    return (
      <PageShell title="产品详情" description="">
        <TriStateRenderer loading={loading} empty={false} error={error}><></></TriStateRenderer>
      </PageShell>
    );
  }

  if (deleted) {
    return (
      <PageShell title="产品详情" description="">
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
            产品已删除
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            &ldquo;{offering.name}&rdquo; 已被移除。
          </div>
          <button
            onClick={() => router.push('/products')}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid rgba(99,102,241,0.4)',
              background: 'rgba(99,102,241,0.12)',
              color: '#a5b4fc',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            返回产品列表
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={offering.name}
      description={`${CATEGORY_LABELS[offering.category]} · ${offering.storeName}`}
    >
      <TriStateRenderer loading={loading} empty={false} error={error}><>
      <DetailShell title={offering.name} subtitle={`${CATEGORY_LABELS[offering.category]} · ${offering.storeName}`} actions={detailActions}>
        {/* 基本信息 */}
        <InfoSection title="基本信息">
          <InfoRow label="名称" value={offering.name} />
          <InfoRow label="分类" value={CATEGORY_LABELS[offering.category]} />
          <InfoRow label="门店" value={offering.storeName} />
          <InfoRow label="描述" value={offering.description} />
          <InfoRow label="状态">
            <StatusBadge
              label={STATUS_LABELS[offering.status]}
              variant={STATUS_VARIANTS[offering.status]}
              size="sm"
            />
          </InfoRow>
        </InfoSection>

        {/* 价格与时间 */}
        <InfoSection title="价格与时间">
          <InfoRow label="价格" value={offering.price || '—'} />
          <InfoRow label="时间安排" value={offering.scheduleHint || '—'} />
        </InfoSection>

        {/* 时间戳 */}
        <InfoSection title="变更记录">
          <InfoRow label="创建时间" value={offering.createdAt} />
          <InfoRow label="最近更新" value={offering.updatedAt} />
        </InfoSection>
      </DetailShell>

      {/* 编辑弹窗 */}
      {editOpen && (
        <EditModal
          offering={offering}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* 删除确认弹窗 */}
      {deleteOpen && (
        <DeleteConfirmModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          itemName={offering.name}
        />
      )}
      </></TriStateRenderer>
    </PageShell>
  );
}

// ── 辅助组件 ──

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.12)',
        background: 'rgba(15,23,42,0.4)',
        padding: 20,
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </section>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', minHeight: 28 }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
      {children ?? <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{value}</span>}
    </div>
  );
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
