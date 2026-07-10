// 设备巡检表单 — 类型定义与模拟数据

export type InspectionType =
  | 'daily'      // 日常巡检
  | 'weekly'     // 周检
  | 'monthly'    // 月检
  | 'emergency'  // 应急巡检

export type DeviceCategory =
  | 'arcade'        // 游艺机
  | 'console'       // 主机
  | 'ticket'        // 出票机
  | 'vr'            // VR 设备
  | 'pos'           // 收银 POS
  | 'network'       // 网络设备
  | 'lighting'      // 灯光
  | 'ac'            // 空调

export type InspectionResult = 'pass' | 'warn' | 'fail'

export interface InspectionItem {
  id: string
  label: string
  category: DeviceCategory
  result: InspectionResult | null
  remark: string
}

export interface InspectionFormData {
  storeId: string
  storeName: string
  inspectorName: string
  inspectionType: InspectionType
  inspectionDate: string
  items: InspectionItem[]
  overallRemark: string
  signature: string
}

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  daily: '日常巡检',
  weekly: '周检',
  monthly: '月检',
  emergency: '应急巡检',
}

export const CATEGORY_LABELS: Record<DeviceCategory, string> = {
  arcade: '游艺机',
  console: '主机',
  ticket: '出票机',
  vr: 'VR 设备',
  pos: '收银 POS',
  network: '网络设备',
  lighting: '灯光',
  ac: '空调',
}

export const RESULT_LABELS: Record<InspectionResult, string> = {
  pass: '通过',
  warn: '告警',
  fail: '故障',
}

export const RESULT_COLORS: Record<InspectionResult, string> = {
  pass: '#22c55e',
  warn: '#f59e0b',
  fail: '#ef4444',
}

export const MOCK_STORES = [
  { id: 'store-001', name: '旗舰店（北京朝阳）' },
  { id: 'store-002', name: '分店（上海静安）' },
  { id: 'store-003', name: '分店（广州天河）' },
  { id: 'store-004', name: '分店（深圳南山）' },
  { id: 'store-005', name: '分店（成都锦江）' },
]

export const DEFAULT_INSPECTION_ITEMS: InspectionItem[] = [
  { id: 'item-1', label: '设备外观检查（无破损、无灰尘堆积）', category: 'arcade', result: null, remark: '' },
  { id: 'item-2', label: '屏幕显示正常（无坏点、无闪烁）', category: 'arcade', result: null, remark: '' },
  { id: 'item-3', label: '按键/摇杆灵敏回应', category: 'arcade', result: null, remark: '' },
  { id: 'item-4', label: '投币器/读卡器正常工作', category: 'pos', result: null, remark: '' },
  { id: 'item-5', label: '网络连接正常（Ping ≤ 50ms）', category: 'network', result: null, remark: '' },
  { id: 'item-6', label: '出票机票据余量充足', category: 'ticket', result: null, remark: '' },
  { id: 'item-7', label: 'VR 设备镜片清洁度', category: 'vr', result: null, remark: '' },
  { id: 'item-8', label: '空调/通风运行正常', category: 'ac', result: null, remark: '' },
  { id: 'item-9', label: '应急照明/疏散指示完好', category: 'lighting', result: null, remark: '' },
  { id: 'item-10', label: '收银系统响应正常', category: 'pos', result: null, remark: '' },
]

/** 表单验证错误 */
export interface FormValidationErrors {
  storeId?: string
  inspectorName?: string
  inspectionType?: string
  inspectionDate?: string
  items?: string
  overall?: string
}

/** 验证表单数据 */
export function validateInspectionForm(data: InspectionFormData): FormValidationErrors | null {
  const errors: FormValidationErrors = {}

  if (!data.storeId) errors.storeId = '请选择门店'
  if (!data.inspectorName?.trim()) errors.inspectorName = '请输入巡检人姓名'
  if (!data.inspectionType) errors.inspectionType = '请选择巡检类型'
  if (!data.inspectionDate) errors.inspectionDate = '请选择巡检日期'

  const unmarkedItems = data.items.filter((item) => item.result === null)
  if (unmarkedItems.length > 0) {
    errors.items = `还有 ${unmarkedItems.length} 项未评定结果`
  }

  return Object.keys(errors).length > 0 ? errors : null
}

/** 模拟提交表单 */
export async function submitInspectionForm(data: InspectionFormData): Promise<{ success: boolean; id: string; message: string }> {
  // 模拟网络延迟
  await new Promise((r) => setTimeout(r, 800))

  // 模拟随机失败
  if (Math.random() < 0.1) {
    return { success: false, id: '', message: '提交失败：服务器繁忙，请稍后重试' }
  }

  return {
    success: true,
    id: `INS-${Date.now().toString(36).toUpperCase()}`,
    message: `巡检单 ${data.storeName} — ${INSPECTION_TYPE_LABELS[data.inspectionType]} 已提交成功`,
  }
}
