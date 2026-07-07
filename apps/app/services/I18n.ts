/**
 * 国际化服务
 * Internationalization Service
 */

import * as Localization from 'expo-localization';
import { I18n } from 'i18n';

const i18n = new I18n();

// 支持的语言
export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', nativeName: '日本語', flag: '🇯🇵' },
];

// 默认语言
i18n.defaultLocale = 'zh-CN';
i18n.locale = 'zh-CN';
i18n.enableFallback = true;

// 翻译资源
const translations = {
  // 通用
  'common.confirm': { 'zh-CN': '确认', 'zh-TW': '確認', 'en': 'Confirm', 'ja': '確認' },
  'common.cancel': { 'zh-CN': '取消', 'zh-TW': '取消', 'en': 'Cancel', 'ja': 'キャンセル' },
  'common.save': { 'zh-CN': '保存', 'zh-TW': '儲存', 'en': 'Save', 'ja': '保存' },
  'common.delete': { 'zh-CN': '删除', 'zh-TW': '刪除', 'en': 'Delete', 'ja': '削除' },
  'common.edit': { 'zh-CN': '编辑', 'zh-TW': '編輯', 'en': 'Edit', 'ja': '編集' },
  'common.search': { 'zh-CN': '搜索', 'zh-TW': '搜索', 'en': 'Search', 'ja': '検索' },
  'common.loading': { 'zh-CN': '加载中...', 'zh-TW': '載入中...', 'en': 'Loading...', 'ja': '読み込み中...' },
  'common.error': { 'zh-CN': '出错了', 'zh-TW': '錯誤', 'en': 'Error', 'ja': 'エラー' },
  'common.success': { 'zh-CN': '成功', 'zh-TW': '成功', 'en': 'Success', 'ja': '成功' },
  'common.retry': { 'zh-CN': '重试', 'zh-TW': '重試', 'en': 'Retry', 'ja': '再試行' },

  // 首页
  'home.title': { 'zh-CN': '首页', 'zh-TW': '首頁', 'en': 'Home', 'ja': 'ホーム' },
  'home.workbench': { 'zh-CN': '工作台', 'zh-TW': '工作台', 'en': 'Workbench', 'ja': 'ワークベンチ' },
  'home.member': { 'zh-CN': '会员', 'zh-TW': '會員', 'en': 'Member', 'ja': 'メンバー' },
  'home.settings': { 'zh-CN': '设置', 'zh-TW': '設定', 'en': 'Settings', 'ja': '設定' },

  // 订单
  'order.title': { 'zh-CN': '订单', 'zh-TW': '訂單', 'en': 'Order', 'ja': '注文' },
  'order.list': { 'zh-CN': '订单列表', 'zh-TW': '訂單列表', 'en': 'Order List', 'ja': '注文一覧' },
  'order.detail': { 'zh-CN': '订单详情', 'zh-TW': '訂單詳情', 'en': 'Order Detail', 'ja': '注文詳細' },
  'order.status.pending': { 'zh-CN': '待支付', 'zh-TW': '待支付', 'en': 'Pending', 'ja': '未払い' },
  'order.status.paid': { 'zh-CN': '已支付', 'zh-TW': '已支付', 'en': 'Paid', 'ja': '支払済み' },
  'order.status.completed': { 'zh-CN': '已完成', 'zh-TW': '已完成', 'en': 'Completed', 'ja': '完了' },
  'order.status.refunded': { 'zh-CN': '已退款', 'zh-TW': '已退款', 'en': 'Refunded', 'ja': '返金済み' },

  // 收款
  'payment.title': { 'zh-CN': '收款', 'zh-TW': '收款', 'en': 'Payment', 'ja': '支払い' },
  'payment.amount': { 'zh-CN': '收款金额', 'zh-TW': '收款金額', 'en': 'Amount', 'ja': '金額' },
  'payment.scan': { 'zh-CN': '扫码收款', 'zh-TW': '掃碼收款', 'en': 'Scan to Pay', 'ja': 'スキャン支払い' },

  // 会员
  'member.title': { 'zh-CN': '会员中心', 'zh-TW': '會員中心', 'en': 'Member Center', 'ja': 'メンバーセンター' },
  'member.login': { 'zh-CN': '会员登录', 'zh-TW': '會員登錄', 'en': 'Member Login', 'ja': 'メンバーログイン' },
  'member.register': { 'zh-CN': '注册会员', 'zh-TW': '註冊會員', 'en': 'Register', 'ja': 'メンバー登録' },
  'member.points': { 'zh-CN': '积分', 'zh-TW': '積分', 'en': 'Points', 'ja': 'ポイント' },
  'member.coupons': { 'zh-CN': '优惠券', 'zh-TW': '優惠券', 'en': 'Coupons', 'ja': 'クーポン' },
  'member.level': { 'zh-CN': '会员等级', 'zh-TW': '會員等級', 'en': 'Member Level', 'ja': 'メンバーレベル' },

  // 库存
  'inventory.title': { 'zh-CN': '库存查询', 'zh-TW': '庫存查詢', 'en': 'Inventory', 'ja': '在庫確認' },
  'inventory.scan': { 'zh-CN': '扫码入库', 'zh-TW': '掃碼入庫', 'en': 'Scan In', 'ja': 'スキャン入库' },
  'inventory.low': { 'zh-CN': '库存不足', 'zh-TW': '庫存不足', 'en': 'Low Stock', 'ja': '在庫不足' },

  // 设备
  'device.title': { 'zh-CN': '设备监控', 'zh-TW': '設備監控', 'en': 'Device Monitor', 'ja': 'デバイス管理' },
  'device.online': { 'zh-CN': '在线', 'zh-TW': '在線', 'en': 'Online', 'ja': 'オンライン' },
  'device.offline': { 'zh-CN': '离线', 'zh-TW': '離線', 'en': 'Offline', 'ja': 'オフライン' },
  'device.alert': { 'zh-CN': '设备告警', 'zh-TW': '設備告警', 'en': 'Device Alert', 'ja': 'デバイスアラート' },

  // 报表
  'report.title': { 'zh-CN': '数据报表', 'zh-TW': '數據報表', 'en': 'Reports', 'ja': 'レポート' },
  'report.today': { 'zh-CN': '今日', 'zh-TW': '今日', 'en': 'Today', 'ja': '今日' },
  'report.week': { 'zh-CN': '本周', 'zh-TW': '本週', 'en': 'This Week', 'ja': '今週' },
  'report.month': { 'zh-CN': '本月', 'zh-TW': '本月', 'en': 'This Month', 'ja': '今月' },

  // 设置
  'settings.title': { 'zh-CN': '设置', 'zh-TW': '設定', 'en': 'Settings', 'ja': '設定' },
  'settings.language': { 'zh-CN': '语言', 'zh-TW': '語言', 'en': 'Language', 'ja': '言語' },
  'settings.notifications': { 'zh-CN': '通知设置', 'zh-TW': '通知設置', 'en': 'Notifications', 'ja': '通知設定' },
  'settings.biometric': { 'zh-CN': '生物识别', 'zh-TW': '生物識別', 'en': 'Biometric', 'ja': '生体認証' },
  'settings.offline': { 'zh-CN': '离线模式', 'zh-TW': '離線模式', 'en': 'Offline Mode', 'ja': 'オフラインモード' },
  'settings.about': { 'zh-CN': '关于', 'zh-TW': '關於', 'en': 'About', 'ja': 'アプリについて' },
  'settings.logout': { 'zh-CN': '退出登录', 'zh-TW': '退出登錄', 'en': 'Logout', 'ja': 'ログアウト' },

  // 错误消息
  'error.network': { 'zh-CN': '网络连接失败', 'zh-TW': '網路連接失敗', 'en': 'Network connection failed', 'ja': 'ネットワーク接続に失敗しました' },
  'error.server': { 'zh-CN': '服务器错误', 'zh-TW': '伺服器錯誤', 'en': 'Server error', 'ja': 'サーバーエラー' },
  'error.auth': { 'zh-CN': '认证失败', 'zh-TW': '認證失敗', 'en': 'Authentication failed', 'ja': '認証に失敗しました' },
  'error.permission': { 'zh-CN': '无权限', 'zh-TW': '無權限', 'en': 'Permission denied', 'ja': '権限がありません' },
};

// 添加翻译
i18n.translations = translations;

class I18nService {
  private currentLocale: string = 'zh-CN';

  // 初始化
  async init(): Promise<void> {
    const locales = Localization.getLocales();
    const deviceLocale = locales[0]?.languageTag || 'zh-CN';

    // 匹配支持的语言
    const supportedLocale = this.matchLocale(deviceLocale);
    this.currentLocale = supportedLocale;
    i18n.locale = supportedLocale;
  }

  // 匹配设备语言到支持的语言
  private matchLocale(deviceLocale: string): string {
    // 精确匹配
    if (SUPPORTED_LANGUAGES.some((lang) => lang.code === deviceLocale)) {
      return deviceLocale;
    }

    // 语言部分匹配
    const langCode = deviceLocale.split('-')[0] || deviceLocale;
    const match = SUPPORTED_LANGUAGES.find((lang) => lang.code.startsWith(langCode));
    return match?.code || 'zh-CN';
  }

  // 获取当前语言
  getCurrentLocale(): string {
    return this.currentLocale;
  }

  // 设置语言
  setLocale(locale: string): void {
    if (SUPPORTED_LANGUAGES.some((lang) => lang.code === locale)) {
      this.currentLocale = locale;
      i18n.locale = locale;
    }
  }

  // 翻译
  t(key: string, options?: Record<string, string | number>): string {
    return i18n.t(key, options);
  }

  // 获取支持的语言列表
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  // 是否RTL语言
  isRTL(): boolean {
    return false; // 暂不支持RTL语言
  }

  // 格式化数字
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(num);
  }

  // 格式化日期
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(this.currentLocale, options).format(d);
  }

  // 格式化货币
  formatCurrency(amount: number, currency = 'CNY'): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

export const i18nService = new I18nService();
