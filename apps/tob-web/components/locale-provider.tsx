'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Locale = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR' | 'th-TH' | 'vi-VN' | 'id-ID' | 'ms-MY'

export const SUPPORTED_LOCALES: Locale[] = [
  'zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY',
]

const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en-US': 'English',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'th-TH': 'ภาษาไทย',
  'vi-VN': 'Tiếng Việt',
  'id-ID': 'Bahasa Indonesia',
  'ms-MY': 'Bahasa Melayu',
}

// 内置翻译资源（与 I18nExtService 同步）
const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    'common.ok': '确定', 'common.cancel': '取消', 'common.confirm': '确认', 'common.delete': '删除',
    'common.edit': '编辑', 'common.search': '搜索', 'common.loading': '加载中...', 'common.error': '操作失败',
    'common.success': '操作成功', 'common.warning': '警告',
    'member.level': '会员等级', 'member.points': '会员积分', 'member.svip': '超级会员', 'member.upgrade': '升级',
    'member.birthday': '生日', 'member.anniversary': '周年纪念日',
    'order.created': '订单已创建', 'order.paid': '订单已支付', 'order.refunded': '订单已退款',
    'order.cancelled': '订单已取消', 'order.completed': '订单已完成', 'order.shipped': '订单已发货',
    'order.delivered': '订单已送达',
    'points.earned': '积分获得', 'points.redeemed': '积分兑换', 'points.expired': '积分过期',
    'points.insufficient': '积分不足', 'points.converted': '积分转换', 'points.adjusted': '积分调整',
    'coupon.issued': '优惠券已发放', 'coupon.used': '优惠券已使用', 'coupon.expired': '优惠券已过期',
    'coupon.redeemed': '优惠券已核销', 'coupon.insufficient': '优惠券不足', 'coupon.minimum': '优惠券最低消费',
    'payment.alipay': '支付宝', 'payment.wechat': '微信支付', 'payment.paypal': 'PayPal',
    'payment.stripe': 'Stripe', 'payment.cash': '现金', 'payment.card': '银行卡',
    'inventory.low': '库存不足', 'inventory.out': '缺货', 'inventory.restock': '库存补货',
    'inventory.transferred': '库存调拨', 'inventory.adjusted': '库存调整',
    'tournament.started': '赛事已开始', 'tournament.ended': '赛事已结束', 'tournament.cancelled': '赛事已取消',
    'tournament.full': '赛事已满员', 'tournament.waiting': '等待中',
  },
  'zh-TW': {
    'common.ok': '確定', 'common.cancel': '取消', 'common.confirm': '確認', 'common.delete': '刪除',
    'common.edit': '編輯', 'common.search': '搜尋', 'common.loading': '載入中...', 'common.error': '操作失敗',
    'common.success': '操作成功', 'common.warning': '警告',
    'member.level': '會員等級', 'member.points': '會員積分', 'member.svip': '超級會員', 'member.upgrade': '升級',
    'member.birthday': '生日', 'member.anniversary': '週年紀念日',
    'order.created': '訂單已創建', 'order.paid': '訂單已支付', 'order.refunded': '訂單已退款',
    'order.cancelled': '訂單已取消', 'order.completed': '訂單已完成', 'order.shipped': '訂單已發貨',
    'order.delivered': '訂單已送達',
    'points.earned': '積分獲得', 'points.redeemed': '積分兌換', 'points.expired': '積分過期',
    'points.insufficient': '積分不足', 'points.converted': '積分轉換', 'points.adjusted': '積分調整',
    'coupon.issued': '優惠券已發放', 'coupon.used': '優惠券已使用', 'coupon.expired': '優惠券已過期',
    'coupon.redeemed': '優惠券已核銷', 'coupon.insufficient': '優惠券不足', 'coupon.minimum': '優惠券最低消費',
    'payment.alipay': '支付寶', 'payment.wechat': '微信支付', 'payment.paypal': 'PayPal',
    'payment.stripe': 'Stripe', 'payment.cash': '現金', 'payment.card': '銀行卡',
    'inventory.low': '庫存不足', 'inventory.out': '缺貨', 'inventory.restock': '庫存補貨',
    'inventory.transferred': '庫存調撥', 'inventory.adjusted': '庫存調整',
    'tournament.started': '賽事已開始', 'tournament.ended': '賽事已結束', 'tournament.cancelled': '賽事已取消',
    'tournament.full': '賽事已滿員', 'tournament.waiting': '等待中',
  },
  'en-US': {
    'common.ok': 'OK', 'common.cancel': 'Cancel', 'common.confirm': 'Confirm', 'common.delete': 'Delete',
    'common.edit': 'Edit', 'common.search': 'Search', 'common.loading': 'Loading...', 'common.error': 'Operation failed',
    'common.success': 'Operation successful', 'common.warning': 'Warning',
    'member.level': 'Member Level', 'member.points': 'Points', 'member.svip': 'Super VIP', 'member.upgrade': 'Upgrade',
    'member.birthday': 'Birthday', 'member.anniversary': 'Anniversary',
    'order.created': 'Order created', 'order.paid': 'Order paid', 'order.refunded': 'Order refunded',
    'order.cancelled': 'Order cancelled', 'order.completed': 'Order completed', 'order.shipped': 'Order shipped',
    'order.delivered': 'Order delivered',
    'points.earned': 'Points earned', 'points.redeemed': 'Points redeemed', 'points.expired': 'Points expired',
    'points.insufficient': 'Insufficient points', 'points.converted': 'Points converted', 'points.adjusted': 'Points adjusted',
    'coupon.issued': 'Coupon issued', 'coupon.used': 'Coupon used', 'coupon.expired': 'Coupon expired',
    'coupon.redeemed': 'Coupon redeemed', 'coupon.insufficient': 'Insufficient coupons', 'coupon.minimum': 'Minimum purchase required',
    'payment.alipay': 'Alipay', 'payment.wechat': 'WeChat Pay', 'payment.paypal': 'PayPal',
    'payment.stripe': 'Stripe', 'payment.cash': 'Cash', 'payment.card': 'Bank Card',
    'inventory.low': 'Low stock', 'inventory.out': 'Out of stock', 'inventory.restock': 'Restocked',
    'inventory.transferred': 'Stock transferred', 'inventory.adjusted': 'Stock adjusted',
    'tournament.started': 'Tournament started', 'tournament.ended': 'Tournament ended', 'tournament.cancelled': 'Tournament cancelled',
    'tournament.full': 'Tournament full', 'tournament.waiting': 'Waiting',
  },
  'ja-JP': {
    'common.ok': 'OK', 'common.cancel': 'キャンセル', 'common.confirm': '確認', 'common.delete': '削除',
    'common.edit': '編集', 'common.search': '検索', 'common.loading': '読み込み中...', 'common.error': '操作失敗',
    'common.success': '操作成功', 'common.warning': '警告',
    'member.level': '会員レベル', 'member.points': 'ポイント', 'member.svip': 'SVIP', 'member.upgrade': 'アップグレード',
    'member.birthday': '誕生日', 'member.anniversary': '記念日',
    'order.created': '注文作成済み', 'order.paid': '支払済み', 'order.refunded': '返金済み',
    'order.cancelled': 'キャンセル済み', 'order.completed': '注文完了', 'order.shipped': '発送済み',
    'order.delivered': '配達完了',
    'points.earned': 'ポイント獲得', 'points.redeemed': 'ポイント交換', 'points.expired': 'ポイント失効',
    'points.insufficient': 'ポイント不足', 'points.converted': 'ポイント変換', 'points.adjusted': 'ポイント調整',
    'coupon.issued': 'クーポン発行', 'coupon.used': 'クーポン使用', 'coupon.expired': 'クーポン失効',
    'coupon.redeemed': 'クーポン使用済み', 'coupon.insufficient': 'クーポン不足', 'coupon.minimum': '最低利用額',
    'payment.alipay': 'アリペイ', 'payment.wechat': 'ウィチャットペイ', 'payment.paypal': 'PayPal',
    'payment.stripe': 'Stripe', 'payment.cash': '現金', 'payment.card': '银行卡',
    'inventory.low': '在庫不足', 'inventory.out': '在庫切れ', 'inventory.restock': '在庫補充',
    'inventory.transferred': '在庫移動', 'inventory.adjusted': '在庫調整',
    'tournament.started': '大会開始', 'tournament.ended': '大会終了', 'tournament.cancelled': '大会中止',
    'tournament.full': '大会満員', 'tournament.waiting': '待機中',
  },
  'ko-KR': {
    'common.ok': '확인', 'common.cancel': '취소', 'common.confirm': '확인', 'common.delete': '삭제',
    'common.edit': '편집', 'common.search': '검색', 'common.loading': '로딩 중...', 'common.error': '작업 실패',
    'common.success': '작업 성공', 'common.warning': '경고',
    'member.level': '회원 등급', 'member.points': '포인트', 'member.svip': 'SVIP', 'member.upgrade': '업그레이드',
    'member.birthday': '생일', 'member.anniversary': '기념일',
    'order.created': '주문 생성됨', 'order.paid': '결제 완료', 'order.refunded': '환불 완료',
    'order.cancelled': '주문 취소됨', 'order.completed': '주문 완료', 'order.shipped': '배송됨',
    'order.delivered': '배달 완료',
    'points.earned': '포인트 적립', 'points.redeemed': '포인트 사용', 'points.expired': '포인트 만료',
    'points.insufficient': '포인트 부족', 'points.converted': '포인트 전환', 'points.adjusted': '포인트 조정',
    'coupon.issued': '쿠폰 발행', 'coupon.used': '쿠폰 사용', 'coupon.expired': '쿠폰 만료',
    'coupon.redeemed': '쿠폰 사용됨', 'coupon.insufficient': '쿠폰 부족', 'coupon.minimum': '최소 이용 금액',
    'payment.alipay': '알리페이', 'payment.wechat': '위챗페이', 'payment.paypal': 'PayPal',
    'payment.stripe': 'Stripe', 'payment.cash': '현금', 'payment.card': '카드',
    'inventory.low': '재고 부족', 'inventory.out': '품절', 'inventory.restock': '재고 보충',
    'inventory.transferred': '재고 이동', 'inventory.adjusted': '재고 조정',
    'tournament.started': '대회 시작', 'tournament.ended': '대회 종료', 'tournament.cancelled': '대회 취소',
    'tournament.full': '대회 만원', 'tournament.waiting': '대기 중',
  },
  'th-TH': {
    'common.ok': 'ตกลง', 'common.cancel': 'ยกเลิก', 'common.confirm': 'ยืนยัน', 'common.delete': 'ลบ',
    'common.edit': 'แก้ไข', 'common.search': 'ค้นหา', 'common.loading': 'กำลังโหลด...', 'common.error': 'การดำเนินการล้มเหลว',
    'common.success': 'การดำเนินการสำเร็จ', 'common.warning': 'คำเตือน',
    'member.level': 'ระดับสมาชิก', 'member.points': 'แต้ม', 'member.svip': 'SVIP', 'member.upgrade': 'อัพเกรด',
    'member.birthday': 'วันเกิด', 'member.anniversary': 'วันครบรอบ',
    'order.created': 'สั่งซื้อแล้ว', 'order.paid': 'ชำระเงินแล้ว', 'order.refunded': 'คืนเงินแล้ว',
    'order.cancelled': 'ยกเลิกแล้ว', 'order.completed': 'เสร็จสิ้น', 'order.shipped': 'จัดส่งแล้ว',
    'order.delivered': 'ส่งถึงแล้ว',
    'points.earned': 'ได้รับแต้ม', 'points.redeemed': 'ใช้แต้ม', 'points.expired': 'แต้มหมดอายุ',
    'points.insufficient': 'แต้มไม่เพียงพอ', 'points.converted': 'แลกแต้ม', 'points.adjusted': 'ปรับแต้ม',
    'coupon.issued': 'คูปองออกแล้ว', 'coupon.used': 'ใช้คูปองแล้ว', 'coupon.expired': 'คูปองหมดอายุ',
    'coupon.redeemed': 'ใช้คูปองแล้ว', 'coupon.insufficient': 'คูปองไม่เพียงพอ', 'coupon.minimum': 'ซื้อขั้นต่ำ',
    'payment.alipay': 'อลิเพย์', 'payment.wechat': 'วีแชท', 'payment.paypal': 'PayPal',
    'payment.stripe': 'Stripe', 'payment.cash': 'เงินสด', 'payment.card': 'บัตร',
    'inventory.low': 'สินค้าใกล้หมด', 'inventory.out': 'สินค้าหมด', 'inventory.restock': 'เติมสินค้า',
    'inventory.transferred': 'โอนสินค้า', 'inventory.adjusted': 'ปรับสต็อก',
    'tournament.started': 'การแข่งขันเริ่มแล้ว', 'tournament.ended': 'การแข่งขันสิ้นสุด', 'tournament.cancelled': 'การแข่งขันถูกยกเลิก',
    'tournament.full': 'การแข่งขันเต็ม', 'tournament.waiting': 'รอคิว',
  },
  'vi-VN': {
    'common.ok': 'Đồng ý', 'common.cancel': 'Hủy', 'common.confirm': 'Xác nhận', 'common.delete': 'Xóa',
    'common.edit': 'Sửa', 'common.search': 'Tìm kiếm', 'common.loading': 'Đang tải...', 'common.error': 'Thao tác thất bại',
    'common.success': 'Thao tác thành công', 'common.warning': 'Cảnh báo',
    'member.level': 'Cấp bậc', 'member.points': 'Điểm', 'member.svip': 'SVIP', 'member.upgrade': 'Nâng cấp',
    'member.birthday': 'Sinh nhật', 'member.anniversary': 'Kỷ niệm',
    'order.created': 'Đơn đã tạo', 'order.paid': 'Đã thanh toán', 'order.refunded': 'Đã hoàn tiền',
    'order.cancelled': 'Đã hủy', 'order.completed': 'Hoàn thành', 'order.shipped': 'Đã giao',
    'order.delivered': 'Đã nhận',
    'points.earned': 'Tích điểm', 'points.redeemed': 'Đổi điểm', 'points.expired': 'Hết hạn',
    'points.insufficient': 'Không đủ điểm', 'points.converted': 'Chuyển đổi', 'points.adjusted': 'Điều chỉnh',
    'coupon.issued': 'Phiếu phát hành', 'coupon.used': 'Đã dùng', 'coupon.expired': 'Hết hạn',
    'coupon.redeemed': 'Đã đổi', 'coupon.insufficient': 'Không đủ phiếu', 'coupon.minimum': 'Tối thiểu',
    'payment.alipay': 'Alipay', 'payment.wechat': 'WeChat', 'payment.paypal': 'PayPal',
    'payment.stripe': 'Stripe', 'payment.cash': 'Tiền mặt', 'payment.card': 'Thẻ',
    'inventory.low': 'Hàng sắp hết', 'inventory.out': 'Hết hàng', 'inventory.restock': 'Nhập hàng',
    'inventory.transferred': 'Chuyển kho', 'inventory.adjusted': 'Điều chỉnh',
    'tournament.started': 'Giải đấu bắt đầu', 'tournament.ended': 'Giải đấu kết thúc', 'tournament.cancelled': 'Giải đấu hủy',
    'tournament.full': 'Giải đấu đầy', 'tournament.waiting': 'Chờ',
  },
  'id-ID': {
    'common.ok': 'OK', 'common.cancel': 'Batal', 'common.confirm': 'Konfirmasi', 'common.delete': 'Hapus',
    'common.edit': 'Edit', 'common.search': 'Cari', 'common.loading': 'Memuat...', 'common.error': 'Gagal',
    'common.success': 'Berhasil', 'common.warning': 'Peringatan',
    'member.level': 'Level Anggota', 'member.points': 'Poin', 'member.svip': 'SVIP', 'member.upgrade': 'Naikkan',
    'member.birthday': 'Ulang tahun', 'member.anniversary': 'Hari jadi',
    'order.created': 'Pesanan dibuat', 'order.paid': 'Lunas', 'order.refunded': 'Dikembalikan',
    'order.cancelled': 'Dibatalkan', 'order.completed': 'Selesai', 'order.shipped': 'Dikirim',
    'order.delivered': 'Diterima',
    'points.earned': 'Poin diperoleh', 'points.redeemed': 'Poin ditukar', 'points.expired': 'Poin kadaluarsa',
    'points.insufficient': 'Poin tidak cukup', 'points.converted': 'Poin dikonversi', 'points.adjusted': 'Poin disesuaikan',
    'coupon.issued': 'Kupon diterbitkan', 'coupon.used': 'Kupon digunakan', 'coupon.expired': 'Kupon kadaluarsa',
    'coupon.redeemed': 'Kupon ditukar', 'coupon.insufficient': 'Kupon tidak cukup', 'coupon.minimum': 'Minimum beli',
    'payment.alipay': 'Alipay', 'payment.wechat': 'WeChat', 'payment.paypal': 'PayPal',
    'payment.stripe': 'Stripe', 'payment.cash': 'Tunai', 'payment.card': 'Kartu',
    'inventory.low': 'Stok rendah', 'inventory.out': 'Habis', 'inventory.restock': 'Restok',
    'inventory.transferred': 'Dipindahkan', 'inventory.adjusted': 'Disesuaikan',
    'tournament.started': 'Turnamen dimulai', 'tournament.ended': 'Turnamen selesai', 'tournament.cancelled': 'Turnamen dibatalkan',
    'tournament.full': 'Penuh', 'tournament.waiting': 'Menunggu',
  },
  'ms-MY': {
    'common.ok': 'OK', 'common.cancel': 'Batal', 'common.confirm': 'Sahkan', 'common.delete': 'Padam',
    'common.edit': 'Sunting', 'common.search': 'Cari', 'common.loading': 'Memuat...', 'common.error': 'Gagal',
    'common.success': 'Berjaya', 'common.warning': 'Amaran',
    'member.level': 'Tahap Ahli', 'member.points': 'Mata', 'member.svip': 'SVIP', 'member.upgrade': 'Naik taraf',
    'member.birthday': 'Hari lahir', 'member.anniversary': 'Hari jadi',
    'order.created': 'Pesanan dicipta', 'order.paid': 'Dibayar', 'order.refunded': 'Dikembalikan',
    'order.cancelled': 'Dibatalkan', 'order.completed': 'Selesai', 'order.shipped': 'Dihantar',
    'order.delivered': 'Diterima',
    'points.earned': 'Mata earned', 'points.redeemed': 'Mata ditukar', 'points.expired': 'Mata luput',
    'points.insufficient': 'Mata tidak cukup', 'points.converted': 'Mata ditukar', 'points.adjusted': 'Mata disesuaikan',
    'coupon.issued': 'Kupon diterbitkan', 'coupon.used': 'Kupon digunakan', 'coupon.expired': 'Kupon luput',
    'coupon.redeemed': 'Kupon ditukar', 'coupon.insufficient': 'Kupon tidak cukup', 'coupon.minimum': 'Minimum beli',
    'payment.alipay': 'Alipay', 'payment.wechat': 'WeChat', 'payment.paypal': 'PayPal',
    'payment.stripe': 'Stripe', 'payment.cash': 'Tunai', 'payment.card': 'Kad',
    'inventory.low': 'Stok rendah', 'inventory.out': 'Habis', 'inventory.restock': 'Isi semula',
    'inventory.transferred': 'Dipindahkan', 'inventory.adjusted': 'Disesuaikan',
    'tournament.started': 'Pertandingan bermula', 'tournament.ended': 'Pertandingan tamat', 'tournament.cancelled': 'Pertandingan dibatalkan',
    'tournament.full': 'Penuh', 'tournament.waiting': 'Menunggu',
  },
}

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function getBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'zh-CN'
  const lang = navigator.language
  const normalized = lang.toLowerCase()
  const map: Record<string, Locale> = {
    'zh-cn': 'zh-CN', 'zh-hans-cn': 'zh-CN', 'zh': 'zh-CN',
    'zh-tw': 'zh-TW', 'zh-hant-tw': 'zh-TW',
    'en': 'en-US', 'en-us': 'en-US',
    'ja': 'ja-JP', 'ja-jp': 'ja-JP',
    'ko': 'ko-KR', 'ko-kr': 'ko-KR',
    'th': 'th-TH', 'th-th': 'th-TH',
    'vi': 'vi-VN', 'vi-vn': 'vi-VN',
    'id': 'id-ID', 'id-id': 'id-ID',
    'ms': 'ms-MY', 'ms-my': 'ms-MY',
  }
  return map[normalized] ?? map[normalized.split('-')[0] as string] ?? 'zh-CN'
}

function getStoredLocale(): Locale | null {
  if (typeof localStorage === 'undefined') return null
  const stored = localStorage.getItem('locale') as Locale
  if (stored && SUPPORTED_LOCALES.includes(stored)) return stored
  return null
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh-CN')

  useEffect(() => {
    const stored = getStoredLocale()
    const browser = getBrowserLocale()
    setLocaleState(stored ?? browser)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('locale', l)
    }
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const map = TRANSLATIONS[locale]
    if (!map) return key
    let value = map[key]
    if (!value) {
      // fallback to zh-CN
      value = TRANSLATIONS['zh-CN']?.[key] ?? key
    }
    if (!params) return value
    return value.replace(/\{(\w+)\}/g, (match, k) => {
      if (k in params) return String(params[k])
      return match
    })
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

export function useTranslation() {
  const { t } = useLocale()
  return { t }
}

export { LOCALE_LABELS }
