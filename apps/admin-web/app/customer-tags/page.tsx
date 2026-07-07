/**
 * 客户画像标签管理页 — Customer Profile Tag Management Page (Next.js App Router Page)
 * 功能: 查看、创建、编辑、删除标签，含表单验证、提交反馈、错误处理
 * 角色视角: 👤运营管理员 / 📊市场分析师
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';

import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  StatusBadge,
  WorkspaceBreadcrumb,
} from '@m5/ui';

// ---- 常量 ----

const TAG_CATEGORIES = [
  { value: 'demographics', label: '人口属性' },
  { value: 'behavior', label: '行为特征' },
  { value: 'consumption', label: '消费偏好' },
  { value: 'lifestyle', label: '生活方式' },
  { value: 'engagement', label: '互动偏好' },
] as const;

const TAG_COLORS = [
  { value: 'blue', label: '蓝色', hex: '#1677ff' },
  { value: 'green', label: '绿色', hex: '#52c41a' },
  { value: 'orange', label: '橙色', hex: '#fa8c16' },
  { value: 'red', label: '红色', hex: '#f5222d' },
  { value: 'purple', label: '紫色', hex: '#722ed1' },
  { value: 'cyan', label: '青色', hex: '#13c2c2' },
  { value: 'pink', label: '粉色', hex: '#eb2f96' },
] as const;

const TAG_SOURCES = [
  { value: 'manual', label: '手动创建' },
  { value: 'rule-engine', label: '规则引擎' },
  { value: 'ai-prediction', label: 'AI预测' },
  { value: 'imported', label: '外部导入' },
] as const;

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface Tag {
  id: string;
  name: string;
  category: string;
  color: string;
  source: string;
  memberCount: number;
  description: string;
  enabled: boolean;
  createdAt: string;
}

interface FormData {
  name: string;
  category: string;
  color: string;
  source: string;
  description: string;
  enabled: boolean;
}

interface FormErrors {
  name?: string;
  category?: string;
  color?: string;
  source?: string;
}

// ---- Mock 数据 ----

const MOCK_TAGS: Tag[] = [
  { id: 't1', name: '高净值会员', category: 'consumption', color: 'purple', source: 'ai-prediction', memberCount: 1243, description: '近6个月消费总额前5%', enabled: true, createdAt: '2025-12-01' },
  { id: 't2', name: '沉睡用户', category: 'behavior', color: 'orange', source: 'rule-engine', memberCount: 8720, description: '超过90天未到店', enabled: true, createdAt: '2025-11-15' },
  { id: 't3', name: 'Z世代', category: 'demographics', color: 'cyan', source: 'manual', memberCount: 5601, description: '出生年份1997-2012', enabled: true, createdAt: '2025-10-20' },
  { id: 't4', name: '母婴关注者', category: 'lifestyle', color: 'pink', source: 'manual', memberCount: 3390, description: '近30天浏览母婴品类', enabled: true, createdAt: '2025-12-10' },
  { id: 't5', name: '活动积极分子', category: 'engagement', color: 'green', source: 'ai-prediction', memberCount: 2145, description: '月度活动参与率>60%', enabled: true, createdAt: '2025-09-05' },
  { id: 't6', name: '高退换率', category: 'behavior', color: 'red', source: 'rule-engine', memberCount: 896, description: '退换货率>30%', enabled: false, createdAt: '2025-08-12' },
  { id: 't7', name: '夜猫子客群', category: 'lifestyle', color: 'blue', source: 'ai-prediction', memberCount: 4560, description: '主要消费时段22:00-02:00', enabled: true, createdAt: '2025-11-28' },
];

// ---- 子组件 ----

function TagBadge({ color, name }: { color: string; name: string }) {
  const colorMap: Record<string, string> = {
    blue: '#1677ff', green: '#52c41a', orange: '#fa8c16',
    red: '#f5222d', purple: '#722ed1', cyan: '#13c2c2', pink: '#eb2f96',
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 500,
        color: '#fff',
        backgroundColor: colorMap[color] || '#1677ff',
      }}
  >
      {name}
    </span>
  );
}

// ---- 主组件 ----

export default function CustomerTagsPage() {
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    name: '', category: 'behavior', color: 'blue', source: 'manual', description: '', enabled: true,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ---- 过滤 ----

  const filteredTags = useMemo(() => {
    return tags.filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      return true;
    });
  }, [tags, search, categoryFilter]);

  // ---- 验证 ----

  const validate = useCallback((): boolean => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = '标签名称不能为空';
    else if (form.name.trim().length > 20) errors.name = '标签名称最多20个字符';
    if (!form.category) errors.category = '请选择标签分类';
    if (!form.color) errors.color = '请选择标签颜色';
    if (!form.source) errors.source = '请选择标签来源';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  // ---- 提交 ----

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSubmitState('submitting');
    // 模拟 API 调用
    await new Promise(r => setTimeout(r, 600));
    if (editingId) {
      setTags(prev => prev.map(t => t.id === editingId ? { ...t, ...form, memberCount: t.memberCount } : t));
      setFeedbackMessage(`标签「${form.name}」已更新`);
    } else {
      const newTag: Tag = {
        id: `t${Date.now()}`,
        name: form.name,
        category: form.category,
        color: form.color,
        source: form.source,
        memberCount: 0,
        description: form.description,
        enabled: form.enabled,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setTags(prev => [newTag, ...prev]);
      setFeedbackMessage(`标签「${form.name}」已创建`);
    }
    setSubmitState('success');
    resetForm();
  }, [form, editingId, validate]);

  // ---- 编辑 ----

  const startEdit = useCallback((tag: Tag) => {
    setForm({
      name: tag.name, category: tag.category, color: tag.color,
      source: tag.source, description: tag.description, enabled: tag.enabled,
    });
    setEditingId(tag.id);
    setShowForm(true);
    setFormErrors({});
  }, []);

  // ---- 删除 ----

  const handleDelete = useCallback((id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
    setShowConfirmDelete(null);
    setFeedbackMessage('标签已删除');
    setSubmitState('success');
  }, []);

  // ---- 重置 ----

  const resetForm = useCallback(() => {
    setForm({ name: '', category: 'behavior', color: 'blue', source: 'manual', description: '', enabled: true });
    setEditingId(null);
    setShowForm(false);
    setFormErrors({});
  }, []);

  // ---- 切换启用 ----

  const toggleEnabled = useCallback((id: string) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  }, []);

  // ---- 渲染 ----

  return (
    <PageShell title="客户画像标签管理">
      <WorkspaceBreadcrumb
        workspaceLabel="客户管理"
        workspaceHref="/"
        detailLabel="标签管理"
      />

      {/* 反馈 */}
      {submitState === 'success' && (
        <FormSubmitFeedback
          success={feedbackMessage}
          onDismissSuccess={() => setSubmitState('idle')}
        />
      )}

      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormField label="">
          <input
            type="text"
            placeholder="搜索标签名称或描述…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: 240 }}
          />
        </FormField>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}
      >
          <option value="">全部分类</option>
          {TAG_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <SubmitButton
          label={showForm ? '收起表单' : '+ 新建标签'}
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => {
            if (!showForm) { resetForm(); setShowForm(true); }
            else resetForm();
          }}
        />
      </div>

      {/* 表单 */}
      {showForm && (
        <div style={{
          background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 8,
          padding: 20, marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
            {editingId ? '编辑标签' : '新建标签'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="标签名称" error={formErrors.name} required>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="例：高净值会员"
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
              />
            </FormField>
            <FormField label="标签分类" error={formErrors.category} required>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
            >
                {TAG_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="标签颜色" error={formErrors.color} required>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TAG_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, color: c.value }))}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: form.color === c.value ? '3px solid #333' : '2px solid transparent',
                      backgroundColor: c.hex, cursor: 'pointer',
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </FormField>
            <FormField label="标签来源" error={formErrors.source} required>
              <select
                value={form.source}
                onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
            >
                {TAG_SOURCES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="标签描述">
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="简要描述标签的业务含义…"
                  rows={2}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%', resize: 'vertical' }}
                />
              </FormField>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={e => setForm(p => ({ ...p, enabled: e.target.checked }))}
                />
                启用标签
              </label>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <SubmitButton label={editingId ? '保存修改' : '创建标签'} variant="primary" onClick={handleSubmit} loading={submitState === 'submitting'} />
            <SubmitButton label="取消" variant="secondary" onClick={resetForm} />
          </div>
        </div>
      )}

      {/* 标签列表 */}
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#666' }}>标签名称</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#666' }}>分类</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#666' }}>来源</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#666' }}>命中人数</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#666' }}>状态</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#666' }}>创建时间</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#666' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTags.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                  {search || categoryFilter ? '没有匹配的标签' : '暂无标签，点击上方按钮新建'}
                </td>
              </tr>
            ) : (
              filteredTags.map(tag => (
                <tr key={tag.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <TagBadge color={tag.color} name={tag.name} />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{tag.description}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>{TAG_CATEGORIES.find(c => c.value === tag.category)?.label || tag.category}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>{TAG_SOURCES.find(s => s.value === tag.source)?.label || tag.source}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'right', fontWeight: 600 }}>{tag.memberCount.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <StatusBadge variant={tag.enabled ? 'success' : 'default'} label={tag.enabled ? '启用' : '停用'} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'center' }}>{tag.createdAt}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => toggleEnabled(tag.id)}
                        style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}
                    >
                        {tag.enabled ? '停用' : '启用'}
                      </button>
                      <button
                        onClick={() => startEdit(tag)}
                        style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}
                    >
                        编辑
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(tag.id)}
                        style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer' }}
                    >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 删除确认弹窗 */}
      {showConfirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowConfirmDelete(null)}>
          <div style={{
            background: '#fff', borderRadius: 8, padding: 24, minWidth: 360,
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>确认删除</h3>
            <p style={{ color: '#666', margin: '0 0 16px', fontSize: 14 }}>
              删除后该标签将从所有已打标的会员中移除，此操作不可撤销。
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <SubmitButton label="取消" variant="secondary" onClick={() => setShowConfirmDelete(null)} />
              <SubmitButton label="确认删除" variant="danger" onClick={() => handleDelete(showConfirmDelete)} />
            </div>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160, background: '#f9f0ff', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>标签总数</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#722ed1' }}>{tags.length}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, background: '#e6f7ff', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>已启用</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1677ff' }}>{tags.filter(t => t.enabled).length}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, background: '#fff7e6', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>AI预测标签</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16' }}>{tags.filter(t => t.source === 'ai-prediction').length}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, background: '#f6ffed', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#666' }}>总覆盖率</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>
            {tags.filter(t => t.enabled).reduce((s, t) => s + t.memberCount, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
