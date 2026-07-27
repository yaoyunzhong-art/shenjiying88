export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean' | 'multi_select'

export interface FieldOption {
  label: string
  value: string
}

export interface CustomField {
  id: string
  name: string
  key: string
  type: FieldType
  label: string
  required: boolean
  enabled: boolean
  sortOrder: number
  group: string
  placeholder?: string
  defaultValue?: string
  options?: FieldOption[]
  validation?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CustomFieldsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-custom-fields-snapshot'
  fieldGroups: string[]
  fieldTypeLabel: Record<FieldType, string>
  fieldTypeColor: Record<FieldType, string>
  fields: CustomField[]
  generatedAt: string
}

export const FIELD_GROUPS = ['基本信息', '会员资料', '订单扩展', '活动报名', '工单信息']

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: '单行文本',
  number: '数字',
  select: '下拉选择',
  date: '日期',
  boolean: '开关/布尔',
  multi_select: '多选',
}

export const FIELD_TYPE_COLOR: Record<FieldType, string> = {
  text: '#3b82f6',
  number: '#8b5cf6',
  select: '#f59e0b',
  date: '#06b6d4',
  boolean: '#22c55e',
  multi_select: '#ec4899',
}

export const DEFAULT_FIELDS: CustomField[] = [
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
]

export function buildCustomFieldId(length: number): string {
  return `cf-${String(length + 1).padStart(3, '0')}`
}

export function filterFields(fields: CustomField[], group: string | null, searchText: string): CustomField[] {
  return fields.filter((field) => {
    if (group && field.group !== group) return false
    if (!searchText) return true
    const query = searchText.toLowerCase()
    return field.name.toLowerCase().includes(query) || field.key.toLowerCase().includes(query) || field.label.toLowerCase().includes(query)
  })
}

export function validateField(field: Partial<CustomField>): string | null {
  if (!field.name || field.name.trim().length === 0) return '字段名称不能为空'
  if (!field.key || field.key.trim().length === 0) return '字段标识不能为空'
  if (field.key && !/^[a-z_][a-z0-9_]*$/.test(field.key)) return '字段标识只能包含小写字母、数字和下划线'
  if (field.name && field.name.length > 50) return '字段名称不能超过50个字符'
  if (field.key && field.key.length > 100) return '字段标识不能超过100个字符'
  return null
}

export async function loadCustomFieldsSnapshot(): Promise<CustomFieldsSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-custom-fields-snapshot',
    fieldGroups: FIELD_GROUPS,
    fieldTypeLabel: FIELD_TYPE_LABEL,
    fieldTypeColor: FIELD_TYPE_COLOR,
    fields: DEFAULT_FIELDS,
    generatedAt: new Date().toISOString(),
  }
}
