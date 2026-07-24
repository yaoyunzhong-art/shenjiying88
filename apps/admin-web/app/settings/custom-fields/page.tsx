// @ts-nocheck
'use client'

/**
 * settings/custom-fields/page.tsx — 自定义字段管理
 *
 * 管理各业务场景的自定义字段定义、类型配置与显示规则
 * 模块: 字段列表 | 创建字段 | 编辑字段 | 字段分组
 */

import React, { useState } from 'react';
import { AdminPermissionGate } from '../../components/admin-permission-gate';

// ============================================================
// 类型定义
// ============================================================
type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean' | 'multi_select';

interface FieldOption {
  label: string;
  value: string;
}

interface CustomField {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  label: string;
  required: boolean;
  enabled: boolean;
  sortOrder: number;
  group: string;
  placeholder?: string;
  defaultValue?: string;
  options?: FieldOption[];
  validation?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 预定义数据
// ============================================================
const FIELD_GROUPS = ['基本信息', '会员资料', '订单扩展', '活动报名', '工单信息'];

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: '单行文本',
  number: '数字',
  select: '下拉选择',
  date: '日期',
  boolean: '开关/布尔',
  multi_select: '多选',
};

const FIELD_TYPE_COLOR: Record<FieldType, string> = {
  text: '#3b82f6',
  number: '#8b5cf6',
  select: '#f59e0b',
  date: '#06b6d4',
  boolean: '#22c55e',
  multi_select: '#ec4899',
};

const DEFAULT_FIELDS: CustomField[] = [
  { id: 'cf-001', name: '会员生日', key: 'member_birthday', type: 'date', label: '会员生日', required: false, enabled: true, sortOrder: 1, group: '会员资料', placeholder: '请选择出生日期', createdAt: '2025-01-15', updatedAt: '2025-06-01' },
  { id: 'cf-002', name: '性别', key: 'gender', type: 'select', label: '性别', required: true, enabled: true, sortOrder: 2, group: '会员资料', options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }, { label: '其他', value: 'other' }], createdAt: '2025-01-15', updatedAt: '2025-06-01' },
  { id: 'cf-003', name: '会员标签', key: 'member_tags', type: 'multi_select', label: '会员标签', required: false, enabled: true, sortOrder: 3, group: '会员资料', options: [{ label: 'VIP', value: 'vip' }, { label: '新客', value: 'new' }, { label: '高频', value: 'frequent' }, { label: '沉默', value: 'silent' }], createdAt: '2025-02-01', updatedAt: '2025-06-15' },
  { id: 'cf-004', name: '生日提醒', key: 'birthday_reminder', type: 'boolean', label: '开启生日提醒', required: false, enabled: true, sortOrder: 4, group: '会员资料', defaultValue: 'true', createdAt: '2025-02-01', updatedAt: '2025-06-15' },
  { id: 'cf-005', name: '订单备注', key: 'order_remark', type: 'text', label: '订单备注', required: false, enabled: true, sortOrder: 5, group: '订单扩展', placeholder: '请输入备注内容', validation: 'maxLength:200', createdAt: '2025-01-20', updatedAt: '2025-05-30' },
  { id: 'cf-006', name: '订单来源', key: 'order_source', type: 'select', label: '订单来源', required: true, enabled: true, sortOrder: 6, group: '订单扩展', options: [{ label: '线上', value: 'online' }, { label: '线下', value: 'offline' }, { label: '电话', value: 'phone' }], createdAt: '2025-01-20', updatedAt: '2025-05-30' },
  { id: 'cf-007', name: '活动人数', key: 'event_capacity', type: 'number', label: '活动预计人数', required: true, enabled: true, sortOrder: 7, group: '活动报名', validation: 'min:1|max:10000', defaultValue: '1', createdAt: '2025-03-01', updatedAt: '2025-06-10' },
  { id: 'cf-008', name: '活动日期', key: 'event_date', type: 'date', label: '活动日期', required: true, enabled: true, sortOrder: 8, group: '活动报名', createdAt: '2025-03-01', updatedAt: '2025-06-10' },
  { id: 'cf-009', name: '昵称', key: 'nickname', type: 'text', label: '昵称', required: false, enabled: false, sortOrder: 9, group: '基本信息', placeholder: '请输入昵称', validation: 'maxLength:30', createdAt: '2025-04-01', updatedAt: '2025-06-20' },
  { id: 'cf-010', name: '紧急联系人', key: 'emergency_contact', type: 'text', label: '紧急联系人', required: false, enabled: true, sortOrder: 10, group: '基本信息', createdAt: '2025-04-01', updatedAt: '2025-06-20' },
  { id: 'cf-011', name: '工单紧急程度', key: 'ticket_urgency', type: 'select', label: '紧急程度', required: true, enabled: true, sortOrder: 11, group: '工单信息', options: [{ label: '普通', value: 'normal' }, { label: '紧急', value: 'urgent' }, { label: '非常紧急', value: 'critical' }], createdAt: '2025-05-01', updatedAt: '2025-06-25' },
  { id: 'cf-012', name: '工单分类', key: 'ticket_category', type: 'select', label: '工单分类', required: true, enabled: true, sortOrder: 12, group: '工单信息', options: [{ label: '故障报修', value: 'repair' }, { label: '服务投诉', value: 'complaint' }, { label: '咨询建议', value: 'consult' }], createdAt: '2025-05-01', updatedAt: '2025-06-25' },
  { id: 'cf-013', name: '附件上传', key: 'attachment', type: 'text', label: '附件说明', required: false, enabled: true, sortOrder: 13, group: '工单信息', description: '上传相关附件作为工单补充材料', createdAt: '2025-05-15', updatedAt: '2025-06-25' },
];

// ============================================================
// 样式
// ============================================================
const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 960, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: (bg: string) => ({ background: bg, borderRadius: 12, padding: '20px 24px', border: '1px solid rgba(148, 163, 184, 0.1)' }),
  statLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: 700, color: '#f1f5f9' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  groupFilter: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  groupChip: (active: boolean) => ({
    padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
    border: `1px solid ${active ? '#3b82f6' : 'rgba(148, 163, 184, 0.2)'}`,
    background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: active ? '#60a5fa' : '#94a3b8',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s ease',
  }),
  addBtn: { padding: '8px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  typeBadge: (color: string) => ({ fontSize: 11, color, background: `${color}15`, padding: '2px 8px', borderRadius: 6, display: 'inline-block' }),
  enabledDot: (on: boolean) => ({
    width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
    background: on ? '#22c55e' : '#475569',
  }),
  actionBtn: { fontSize: 12, color: '#60a5fa', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px' },
  actionBtnDanger: { fontSize: 12, color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px' },
  emptyRow: { textAlign: 'center' as const, padding: 40, color: '#64748b', fontSize: 14 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.15)', padding: 28, minWidth: 480, maxWidth: 560 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6, display: 'block' },
  formInput: { width: '100%', padding: '8px 12px', fontSize: 14, background: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 8, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' as const },
  formSelect: { width: '100%', padding: '8px 12px', fontSize: 14, background: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 8, color: '#f1f5f9', outline: 'none' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 },
  cancelBtn: { padding: '8px 20px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  submitBtn: { padding: '8px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  fieldGroupTitle: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12, marginTop: 24 },
};

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '自定义字段访问受限',
  description:
    '自定义字段页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看字段定义、分组筛选与创建编辑能力。',
} as const;

// ============================================================
// 辅助函数
// ============================================================
function generateId(): string {
  const num = DEFAULT_FIELDS.length + 1;
  return `cf-${String(num).padStart(3, '0')}`;
}

function filterFields(
  fields: CustomField[],
  group: string | null,
  searchText: string,
): CustomField[] {
  return fields.filter(f => {
    if (group && f.group !== group) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return f.name.toLowerCase().includes(q)
        || f.key.toLowerCase().includes(q)
        || f.label.toLowerCase().includes(q);
    }
    return true;
  });
}

function validateField(field: Partial<CustomField>): string | null {
  if (!field.name || field.name.trim().length === 0) return '字段名称不能为空';
  if (!field.key || field.key.trim().length === 0) return '字段标识不能为空';
  if (field.key && !/^[a-z_][a-z0-9_]*$/.test(field.key)) return '字段标识只能包含小写字母、数字和下划线';
  if (field.name && field.name.length > 50) return '字段名称不能超过50个字符';
  if (field.key && field.key.length > 100) return '字段标识不能超过100个字符';
  return null;
}

// ============================================================
// 主页面组件
// ============================================================
export default function CustomFieldsPage() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<Partial<CustomField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [fields, setFields] = useState<CustomField[]>(DEFAULT_FIELDS);

  const totalFields = fields.length;
  const enabledCount = fields.filter(f => f.enabled).length;
  const requiredCount = fields.filter(f => f.required).length;
  const disabledCount = fields.filter(f => !f.enabled).length;

  const filtered = filterFields(fields, activeGroup, searchText);

  function openCreateModal() {
    setEditingField(null);
    setFormData({ type: 'text', required: false, enabled: true, sortOrder: fields.length + 1, group: '基本信息' });
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(field: CustomField) {
    setEditingField(field);
    setFormData({ ...field });
    setFormError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingField(null);
    setFormData({});
    setFormError(null);
  }

  function handleFormChange(key: string, value: unknown) {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (formError) setFormError(null);
  }

  function handleSubmit() {
    const err = validateField(formData);
    if (err) { setFormError(err); return; }

    if (editingField) {
      setFields(prev => prev.map(f => f.id === editingField.id ? { ...f, ...formData, updatedAt: new Date().toISOString().slice(0, 10) } as CustomField : f));
    } else {
      const newField: CustomField = {
        id: generateId(),
        name: formData.name || '',
        key: formData.key || '',
        type: (formData.type as FieldType) || 'text',
        label: formData.label || '',
        required: formData.required || false,
        enabled: formData.enabled !== false,
        sortOrder: formData.sortOrder || fields.length + 1,
        group: formData.group || '基本信息',
        placeholder: formData.placeholder,
        defaultValue: formData.defaultValue,
        validation: formData.validation,
        description: formData.description,
        options: formData.options,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setFields(prev => [...prev, newField]);
    }
    closeModal();
  }

  function toggleEnabled(id: string) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  }

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={styles.page}>
        <h1 style={styles.title}>📋 自定义字段管理</h1>
        <p style={styles.subtitle}>
          管理各业务场景的自定义字段。支持 {FIELD_GROUPS.length} 个字段分组、
          {FIELD_TYPE_LABEL ? Object.keys(FIELD_TYPE_LABEL).length : 0} 种字段类型，
          按需创建、编辑和调整排序。
        </p>

        {/* 统计卡片 */}
        <div style={styles.statsRow}>
          <div style={styles.statCard('rgba(30, 41, 59, 0.8)')}>
            <div style={styles.statLabel}>字段总数</div>
            <div style={styles.statValue}>{totalFields}</div>
          </div>
          <div style={styles.statCard('rgba(34, 197, 94, 0.08)')}>
            <div style={styles.statLabel}>已启用</div>
            <div style={{ ...styles.statValue, color: '#22c55e' }}>{enabledCount}</div>
          </div>
          <div style={styles.statCard('rgba(59, 130, 246, 0.08)')}>
            <div style={styles.statLabel}>必填字段</div>
            <div style={{ ...styles.statValue, color: '#60a5fa' }}>{requiredCount}</div>
          </div>
          <div style={styles.statCard('rgba(71, 85, 105, 0.08)')}>
            <div style={styles.statLabel}>已停用</div>
            <div style={{ ...styles.statValue, color: '#475569' }}>{disabledCount}</div>
          </div>
        </div>

        {/* 操作栏 */}
        <div style={styles.toolbar}>
          <div style={styles.groupFilter}>
            <span style={styles.groupChip(activeGroup === null)} onClick={() => setActiveGroup(null)}>全部</span>
            {FIELD_GROUPS.map(g => (
              <span key={g} style={styles.groupChip(activeGroup === g)} onClick={() => setActiveGroup(g)}>{g}</span>
            ))}
          </div>
          <input
            type="text"
            placeholder="🔍 搜索字段名称/标识..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ ...styles.formInput, width: 240 }}
          />
          <button style={styles.addBtn} onClick={openCreateModal}>+ 新增字段</button>
        </div>

        {/* 字段列表表格 */}
        <div>
          {FIELD_GROUPS.map(group => {
            const groupFields = filtered.filter(f => f.group === group);
            if (groupFields.length === 0 && activeGroup === null && !searchText) return null;
            if (activeGroup && activeGroup !== group) return null;
            if (groupFields.length === 0) return null;

            return (
              <div key={group}>
                <h3 style={{ ...styles.fieldGroupTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📁 {group}
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>({groupFields.length})</span>
                </h3>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>排序</th>
                      <th style={styles.th}>字段名称</th>
                      <th style={styles.th}>标识</th>
                      <th style={styles.th}>类型</th>
                      <th style={styles.th}>必填</th>
                      <th style={styles.th}>状态</th>
                      <th style={styles.th}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupFields.map(f => (
                      <tr key={f.id}>
                        <td style={styles.td}>{f.sortOrder}</td>
                        <td style={{ ...styles.td, fontWeight: 600 }}>{f.name}</td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{f.key}</td>
                        <td style={styles.td}>
                          <span style={styles.typeBadge(FIELD_TYPE_COLOR[f.type])}>{FIELD_TYPE_LABEL[f.type]}</span>
                        </td>
                        <td style={styles.td}>{f.required ? '是' : '否'}</td>
                        <td style={styles.td}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={styles.enabledDot(f.enabled)} />
                            {f.enabled ? '启用' : '停用'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button style={styles.actionBtn} onClick={() => openEditModal(f)}>编辑</button>
                          <button style={styles.actionBtn} onClick={() => toggleEnabled(f.id)}>
                            {f.enabled ? '停用' : '启用'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={styles.emptyRow}>
              {searchText ? '未找到匹配的字段，请调整搜索条件' : '该分组下暂无自定义字段'}
            </div>
          )}
        </div>

        {/* 创建/编辑弹窗 */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={closeModal}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>{editingField ? '编辑字段' : '新增字段'}</h2>

              {formError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
                  ⚠️ {formError}
                </div>
              )}

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>字段名称 *</label>
                  <input style={styles.formInput} value={formData.name || ''} onChange={e => handleFormChange('name', e.target.value)} placeholder="例如：会员生日" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>字段标识 *</label>
                  <input style={styles.formInput} value={formData.key || ''} onChange={e => handleFormChange('key', e.target.value)} placeholder="例如：member_birthday" readOnly={!!editingField} />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>显示标签</label>
                  <input style={styles.formInput} value={formData.label || ''} onChange={e => handleFormChange('label', e.target.value)} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>字段类型</label>
                  <select style={styles.formSelect} value={formData.type || 'text'} onChange={e => handleFormChange('type', e.target.value)} disabled={!!editingField}>
                    {Object.entries(FIELD_TYPE_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>所属分组</label>
                  <select style={styles.formSelect} value={formData.group || '基本信息'} onChange={e => handleFormChange('group', e.target.value)}>
                    {FIELD_GROUPS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>排序号</label>
                  <input type="number" style={styles.formInput} value={formData.sortOrder || fields.length + 1} onChange={e => handleFormChange('sortOrder', parseInt(e.target.value) || 1)} />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <input type="checkbox" checked={formData.required || false} onChange={e => handleFormChange('required', e.target.checked)} /> 必填字段
                  </label>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <input type="checkbox" checked={formData.enabled !== false} onChange={e => handleFormChange('enabled', e.target.checked)} /> 启用字段
                  </label>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>占位提示</label>
                <input style={styles.formInput} value={formData.placeholder || ''} onChange={e => handleFormChange('placeholder', e.target.value)} />
              </div>

              <div style={styles.modalFooter}>
                <button style={styles.cancelBtn} onClick={closeModal}>取消</button>
                <button style={styles.submitBtn} onClick={handleSubmit}>{editingField ? '保存修改' : '创建字段'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPermissionGate>
  );
}
