/**
 * 分类详情页 — Category Detail Page
 * 角色视角: 👤运营管理员
 * 功能: 查看 / 编辑 / 状态切换 / 删除
 */
'use client';

import { useState, useCallback, use } from 'react';

import {
  DetailClosureBar,
  DetailShell,
  FormField,
  InfoRow,
  StatusBadge,
  SubmitButton,
  useFormSubmit,
  FormSubmitFeedback,
} from '@m5/ui';

import {
  CATEGORY_STATUS_MAP,
  type CategoryItem,
  type CategoryStatus,
  MOCK_CATEGORIES,
  adminCategoryRoute,
  getCategoryStatusLabel,
  getCategoryStatusVariant,
} from '../../categories-data';

type TabKey = 'basic' | 'children';

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  const item = MOCK_CATEGORIES.find(c => c.id === resolved.id)!;
  const [form, setForm] = useState({
    name: item?.name ?? '',
    code: item?.code ?? '',
    sortOrder: item?.sortOrder ?? 0,
    status: item?.status ?? 'active',
  });
  const [tab, setTab] = useState<TabKey>('basic');

  const { submit, submitting, state } = useFormSubmit<{ success: boolean; message: string }>({
    onSubmit: async () => {
      await new Promise(r => setTimeout(r, 500));
      return { success: true, message: '分类已更新' };
    },
    successMessage: '保存成功',
    defaultErrorMessage: '保存失败，请重试',
  });

  const handleSave = useCallback(() => {
    submit();
  }, [submit]);

  const handleDelete = useCallback(() => {
    if (confirm('确认删除此分类？')) {
      window.location.href = adminCategoryRoute.href;
    }
  }, []);

  const handleToggleStatus = useCallback(() => {
    const newStatus = form.status === 'active' ? 'inactive' : 'active';
    if (confirm(`确认${newStatus === 'active' ? '启用' : '停用'}此分类？`)) {
      setForm(prev => ({ ...prev, status: newStatus as CategoryStatus }));
    }
  }, [form.status]);

  const handleFieldChange = useCallback((field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  if (!item) {
    return (
      <DetailShell
        title="分类未找到"
        breadcrumbs={[
          { label: '商品管理', href: '/products' },
          { label: '分类管理', href: '/categories' },
          { label: '未找到' },
        ]}
      >
        <div className="p-8 text-center text-gray-500">该分类不存在或已被删除</div>
        <DetailClosureBar
          links={[
            { key: 'back-categories', title: '分类管理', subtitle: '返回分类列表', href: '/categories' },
          ]}
        />
      </DetailShell>
    );
  }

  const childCategories = MOCK_CATEGORIES.filter(c => c.parentName === item.name);
  const statusItem = CATEGORY_STATUS_MAP[item.status as CategoryStatus] ?? CATEGORY_STATUS_MAP.active;

  return (
    <DetailShell
      title={item.name}
      subtitle={`编码: ${item.code}`}
      breadcrumbs={[
        { label: '商品管理', href: '/products' },
        { label: '分类管理', href: '/categories' },
        { label: item.name },
      ]}
      actions={[{ key: 'status', label: statusItem.label, variant: statusItem.variant as 'primary' | 'secondary' | 'danger' }]}
    >
      <div className="mb-6 flex gap-4 border-b border-gray-700 pb-2">
        <button
          type="button"
          className={`px-3 py-1.5 text-sm font-medium rounded-t ${tab === 'basic' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setTab('basic')}
        >
          基本信息
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-sm font-medium rounded-t ${tab === 'children' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setTab('children')}
        >
          子分类 ({childCategories.length})
        </button>
      </div>
      {tab === 'basic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="分类名称" required>
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                value={form.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                placeholder="输入分类名称"
              />
            </FormField>
            <FormField label="分类编码">
              <input
                className="w-full rounded border bg-gray-50 px-3 py-2 text-sm text-gray-500"
                value={form.code}
                disabled
              />
            </FormField>
            <FormField label="上级分类">
              <InfoRow label="上级分类" value={item.parentName ?? '—（一级分类）'} />
            </FormField>
            <FormField label="排序权重">
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                type="number"
                value={form.sortOrder}
                onChange={e => handleFieldChange('sortOrder', parseInt(e.target.value) || 0)}
              />
            </FormField>
            <FormField label="关联商品数">
              <InfoRow label="商品数" value={String(item.productCount)} />
            </FormField>
            <FormField label="创建时间">
              <InfoRow label="创建时间" value={new Date(item.createdAt).toLocaleDateString('zh-CN')} />
            </FormField>
          </div>

          <FormSubmitFeedback state={state} />

          <div className="flex items-center gap-3">
            <SubmitButton loading={submitting} onClick={handleSave}>保存修改</SubmitButton>
            <SubmitButton variant="secondary" onClick={handleToggleStatus}>
              {form.status === 'active' ? '停用分类' : '启用分类'}
            </SubmitButton>
            <SubmitButton variant="danger" onClick={handleDelete}>删除分类</SubmitButton>
          </div>
        </div>
      )}

      {tab === 'children' && (
        <div>
          {childCategories.length === 0 ? (
            <div className="py-8 text-center text-gray-400">暂无子分类</div>
          ) : (
            <ul className="divide-y">
              {childCategories.map(child => (
                <li key={child.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium">{child.name}</span>
                    <span className="ml-2 text-sm text-gray-500">({child.code})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{child.productCount} 件商品</span>
                    <StatusBadge variant={getCategoryStatusVariant(child.status)} label={getCategoryStatusLabel(child.status)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <DetailClosureBar
        links={[
          { key: 'back-categories', title: '分类管理', subtitle: '返回分类列表', href: '/categories' },
        ]}
      />
    </DetailShell>
  );
}
