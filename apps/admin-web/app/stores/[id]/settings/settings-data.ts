export type ConfigValue = string | number | boolean

export interface ConfigOption {
  value: string
  label: string
}

export interface ConfigItem {
  id: string
  label: string
  key: string
  type: 'switch' | 'text' | 'select' | 'number'
  value: ConfigValue
  options?: ConfigOption[]
  desc: string
  category: string
}

export interface ConfigCategory {
  name: string
  icon: string
  items: ConfigItem[]
}

export interface NotificationItem {
  id: string
  type: '告警' | '提醒' | '系统'
  message: string
  time: string
  read: boolean
}

export interface SettingsSummary {
  totalItems: number
  switchCount: number
  enabledDefaultCount: number
  categoryCount: number
  unreadNotifications: number
}

export interface SettingsSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-settings-mock'
  storeId: string
  categories: ConfigCategory[]
  notifications: NotificationItem[]
  summary: SettingsSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const SETTINGS_CATEGORIES: ConfigCategory[] = [
  {
    name: '营业设置',
    icon: 'BUS',
    items: [
      { id: 'CFG-01', label: '营业时间', key: 'businessHours', type: 'text', value: '10:00-22:00', desc: '门店每日运营时段', category: 'business' },
      { id: 'CFG-02', label: '周末营业', key: 'weekendOpen', type: 'switch', value: true, desc: '周六日是否正常营业', category: 'business' },
      { id: 'CFG-03', label: '最大接待人数', key: 'maxCapacity', type: 'number', value: 200, desc: '同时最大在店人数', category: 'business' },
      { id: 'CFG-04', label: '节假日模式', key: 'holidayMode', type: 'switch', value: false, desc: '节假日自动调整营业时间', category: 'business' },
      { id: 'CFG-05', label: '预约前置时间', key: 'reservationLead', type: 'number', value: 30, desc: '预约需提前N分钟', category: 'business' },
    ],
  },
  {
    name: '收银设置',
    icon: 'PAY',
    items: [
      { id: 'CFG-06', label: '默认支付方式', key: 'defaultPayment', type: 'select', value: 'wechat', options: [{ value: 'wechat', label: '微信支付' }, { value: 'alipay', label: '支付宝' }, { value: 'cash', label: '现金' }, { value: 'card', label: '银行卡' }], desc: '收银台默认选中', category: 'cashier' },
      { id: 'CFG-07', label: '小票打印', key: 'receiptPrint', type: 'switch', value: true, desc: '交易完成自动打印小票', category: 'cashier' },
      { id: 'CFG-08', label: '找零模式', key: 'changeRounding', type: 'select', value: 'round', options: [{ value: 'round', label: '四舍五入' }, { value: 'keep', label: '保留分位' }], desc: '现金找零规则', category: 'cashier' },
      { id: 'CFG-09', label: '积分抵扣', key: 'pointsDeduct', type: 'switch', value: true, desc: '允许会员使用积分折抵金额', category: 'cashier' },
      { id: 'CFG-10', label: '退款自动审批金额上限', key: 'autoRefundLimit', type: 'number', value: 200, desc: '不高于此金额自动审批退款', category: 'cashier' },
    ],
  },
  {
    name: '会员设置',
    icon: 'MEM',
    items: [
      { id: 'CFG-11', label: '自动开卡', key: 'autoMemberCard', type: 'switch', value: true, desc: '消费满条件自动办理会员', category: 'member' },
      { id: 'CFG-12', label: '积分有效期', key: 'pointsExpiry', type: 'select', value: '1year', options: [{ value: 'never', label: '永久' }, { value: '1year', label: '一年' }, { value: 'halfyear', label: '半年' }, { value: 'quarter', label: '季度' }], desc: '会员积分过期规则', category: 'member' },
      { id: 'CFG-13', label: '新会员优惠', key: 'newMemberBonus', type: 'text', value: '首充满100送50', desc: '新注册会员自动发放优惠', category: 'member' },
      { id: 'CFG-14', label: '生日自动优惠', key: 'birthdayBonus', type: 'switch', value: true, desc: '会员生日当天自动发放优惠券', category: 'member' },
    ],
  },
  {
    name: '通知设置',
    icon: 'MSG',
    items: [
      { id: 'CFG-15', label: '到店提醒', key: 'arriveNotify', type: 'switch', value: true, desc: '预约会员到店后通知店长', category: 'notify' },
      { id: 'CFG-16', label: '库存预警', key: 'stockAlert', type: 'switch', value: true, desc: '低库存时推送通知', category: 'notify' },
      { id: 'CFG-17', label: '巡检提醒', key: 'inspectRemind', type: 'switch', value: true, desc: '每日巡检未完成时推送提醒', category: 'notify' },
      { id: 'CFG-18', label: '营业日报推送', key: 'dailyReport', type: 'switch', value: true, desc: '每日营业结束后推送报表', category: 'notify' },
    ],
  },
]

export const SETTINGS_NOTIFICATIONS: NotificationItem[] = [
  { id: 'N-01', type: '告警', message: '仓库存量低于安全线 (耳机10件)', time: '10:25', read: false },
  { id: 'N-02', type: '提醒', message: '今日巡检任务未完成', time: '09:00', read: false },
  { id: 'N-03', type: '系统', message: '系统版本 v2.3.1 更新可用', time: '昨天', read: false },
  { id: 'N-04', type: '告警', message: '门禁AL-006已超过48h未处理', time: '昨天', read: true },
  { id: 'N-05', type: '提醒', message: '会员张三预约14:00到店', time: '昨天', read: true },
]

export function buildSettingsSummary(
  categories: ConfigCategory[],
  notifications: NotificationItem[]
): SettingsSummary {
  const allItems = categories.flatMap((item) => item.items)
  const switchItems = allItems.filter((item) => item.type === 'switch')

  return {
    totalItems: allItems.length,
    switchCount: switchItems.length,
    enabledDefaultCount: switchItems.filter((item) => item.value === true).length,
    categoryCount: categories.length,
    unreadNotifications: notifications.filter((item) => !item.read).length,
  }
}

export async function loadSettingsSnapshot(
  storeId: string
): Promise<SettingsSnapshot> {
  const categories = SETTINGS_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      options: item.options ? item.options.map((option) => ({ ...option })) : undefined,
    })),
  }))
  const notifications = SETTINGS_NOTIFICATIONS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-settings-mock',
    storeId,
    categories,
    notifications,
    summary: buildSettingsSummary(categories, notifications),
    generatedAt: '2026-07-27T16:40:00.000Z',
    controlPlaneSource: 'loadSettingsSnapshot -> SETTINGS_CATEGORIES + SETTINGS_NOTIFICATIONS',
    businessDataSource: 'local configuration samples + notification center snapshot',
    refreshPath: `SettingsPage -> loadSettingsSnapshot(${storeId})`,
    note: '当前门店设置页消费本地 settings snapshot loader，已显式暴露来源态、刷新路径与 mock 边界，不作为真实配置下发表征。',
    error: '门店设置控制面尚未接入真实配置中心，当前展示 mock 快照。',
  }
}
