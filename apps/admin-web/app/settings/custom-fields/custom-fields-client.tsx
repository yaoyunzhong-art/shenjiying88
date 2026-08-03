'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { CustomField, CustomFieldsSnapshot, FieldType } from './custom-fields-data'
import { buildCustomFieldId, filterFields, validateField } from './custom-fields-data'

const styles = {
  page: { padding: 32, maxWidth: 1080, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 },
  subtitle: { fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginTop: 8, maxWidth: 760 },
  refreshButton: {
    border: '1px solid rgba(148, 163, 184, 0.25)',
    background: 'rgba(15, 23, 42, 0.45)',
    color: '#e2e8f0',
    borderRadius: 10,
    padding: '10px 16px',
    cursor: 'pointer',
  },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 },
  card: { borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 18 },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 700, color: '#f8fafc' },
  toolbar: { display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' as const },
  chips: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  chip: (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 13,
    cursor: 'pointer',
    border: `1px solid ${active ? '#3b82f6' : 'rgba(148, 163, 184, 0.2)'}`,
    background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: active ? '#60a5fa' : '#94a3b8',
  }),
  input: { width: 240, padding: '8px 12px', fontSize: 14, background: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 8, color: '#f1f5f9' },
  button: { padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  section: { borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.45)', padding: 20 },
  groupTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 12, marginTop: 24 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.1)' },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148,163,184,0.06)' },
  badge: (color: string) => ({ fontSize: 11, color, background: `${color}15`, padding: '2px 8px', borderRadius: 6, display: 'inline-block' }),
  empty: { textAlign: 'center' as const, padding: 40, color: '#64748b', fontSize: 14 },
}

export default function CustomFieldsClient({ snapshot }: { snapshot: CustomFieldsSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [fields, setFields] = useState<CustomField[]>(snapshot.fields)

  const filtered = useMemo(() => filterFields(fields, activeGroup, searchText), [activeGroup, fields, searchText])
  const enabledCount = useMemo(() => fields.filter((field) => field.enabled).length, [fields])
  const requiredCount = useMemo(() => fields.filter((field) => field.required).length, [fields])
  const disabledCount = useMemo(() => fields.filter((field) => !field.enabled).length, [fields])

  function appendDemoField() {
    const nextKey = `custom_field_${fields.length + 1}`
    const error = validateField({ name: `示例字段${fields.length + 1}`, key: nextKey })
    if (error) return
    const nextField: CustomField = {
      id: buildCustomFieldId(fields.length),
      name: `示例字段${fields.length + 1}`,
      key: nextKey,
      type: 'text' as FieldType,
      label: `示例字段${fields.length + 1}`,
      required: false,
      enabled: true,
      sortOrder: fields.length + 1,
      group: '基本信息',
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    setFields((prev) => [...prev, nextField])
  }

  function toggleEnabled(id: string) {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, enabled: !field.enabled } : field)))
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>自定义字段管理</h1>
          <p style={styles.subtitle}>
            字段定义、分组和筛选能力全部基于服务端快照首屏渲染，客户端只负责本地交互，刷新动作统一回到
            `loadCustomFieldsSnapshot()`。
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          style={{ ...styles.refreshButton, opacity: isRefreshing ? 0.7 : 1 }}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>字段总数</div>
          <div style={styles.cardValue}>{fields.length}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>已启用</div>
          <div style={styles.cardValue}>{enabledCount}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>必填字段</div>
          <div style={styles.cardValue}>{requiredCount}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>已停用</div>
          <div style={styles.cardValue}>{disabledCount}</div>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.chips}>
          <span style={styles.chip(activeGroup === null)} onClick={() => setActiveGroup(null)}>
            全部
          </span>
          {snapshot.fieldGroups.map((group) => (
            <span key={group} style={styles.chip(activeGroup === group)} onClick={() => setActiveGroup(group)}>
              {group}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
          <input type="text" placeholder="搜索字段名称/标识..." value={searchText} onChange={(event) => setSearchText(event.target.value)} style={styles.input} />
          <button type="button" style={styles.button} onClick={appendDemoField}>
            新增字段
          </button>
        </div>
      </div>

      <div style={styles.section}>
        {snapshot.fieldGroups.map((group) => {
          const groupFields = filtered.filter((field) => field.group === group)
          if (activeGroup && activeGroup !== group) return null
          if (groupFields.length === 0 && !activeGroup && !searchText) return null
          if (groupFields.length === 0) return null

          return (
            <div key={group}>
              <div style={styles.groupTitle}>
                {group} ({groupFields.length})
              </div>
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
                  {groupFields.map((field) => (
                    <tr key={field.id}>
                      <td style={styles.td}>{field.sortOrder}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{field.name}</td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{field.key}</td>
                      <td style={styles.td}>
                        <span style={styles.badge(snapshot.fieldTypeColor[field.type])}>{snapshot.fieldTypeLabel[field.type]}</span>
                      </td>
                      <td style={styles.td}>{field.required ? '是' : '否'}</td>
                      <td style={styles.td}>{field.enabled ? '启用' : '停用'}</td>
                      <td style={styles.td}>
                        <button type="button" style={styles.button} onClick={() => toggleEnabled(field.id)}>
                          {field.enabled ? '停用' : '启用'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        {filtered.length === 0 && <div style={styles.empty}>{searchText ? '未找到匹配的字段，请调整搜索条件' : '该分组下暂无自定义字段'}</div>}
      </div>
    </div>
  )
}
